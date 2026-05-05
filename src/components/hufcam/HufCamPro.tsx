import { useState, useRef, useCallback, useEffect } from "react";
import {
  Camera, Zap, FolderOpen, RotateCcw, Check, X, Download, Share2,
  ChevronRight, ChevronLeft, Sparkles, Loader2, Image as ImageIcon,
  FileText, Settings, Save, Palette,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { CameraGuideOverlay } from "./CameraGuideOverlay";
import { GuideOverlay } from "./GuideOverlay";
import { useDeviceOrientation } from "@/hooks/useDeviceOrientation";
import { saveSession } from "@/lib/db";
import type { PerspectiveId, PhotoData, HoofData } from "./types";
import jsPDF from "jspdf";

const HOOVES = [
  { id: "VL", label: "Vorne Links", short: "VL" },
  { id: "VR", label: "Vorne Rechts", short: "VR" },
  { id: "HL", label: "Hinten Links", short: "HL" },
  { id: "HR", label: "Hinten Rechts", short: "HR" },
] as const;

const PERSPECTIVES = [
  { id: "dorsal",  label: "Von vorne", desc: "Vorderansicht (Dorsal)" },
  { id: "lateral", label: "Außenseite", desc: "Seitlich von außen (Lateral)" },
  { id: "medial",  label: "Innenseite", desc: "Seitlich von innen (Medial)" },
  { id: "solar",   label: "Sohle",      desc: "Hufsohle (Solar)" },
  { id: "palmar",  label: "Ballenbereich", desc: "Ballenbereich (Palmar)" },
] as const;

type HoofId = typeof HOOVES[number]["id"];
type CaptureMode = "ai" | "live" | "gallery";

const LS_WATERMARK = "hufcampro_watermark";

export function HufCamPro({ onSessionSaved }: { onSessionSaved?: () => void }) {
  const [horseName, setHorseName]       = useState("");
  const [watermark, setWatermark]       = useState(() => localStorage.getItem(LS_WATERMARK) || "");
  const [showSettings, setShowSettings] = useState(false);
  const [isOpen, setIsOpen]             = useState(false);
  const [currentHoofIndex, setCurrentHoofIndex]           = useState(0);
  const [currentPerspectiveIndex, setCurrentPerspectiveIndex] = useState(0);
  const [captureMode, setCaptureMode]   = useState<CaptureMode>("live");
  const [hoofData, setHoofData]         = useState<Map<HoofId, HoofData>>(new Map());
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [isGeneratingCollage, setIsGeneratingCollage] = useState(false);
  const [justGenerated, setJustGenerated] = useState(false);
  const [isSavingSession, setIsSavingSession] = useState(false);
  const [completedCollages, setCompletedCollages] = useState<Array<{ hoofId: HoofId; collageUrl: string; timestamp: number }>>([]);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [torchOn, setTorchOn]           = useState(false);
  const [torchSupported, setTorchSupported] = useState(false);
  const [shareSupported]                = useState(() => !!navigator.share);

  // New States
  const [seenGuides, setSeenGuides] = useState<Set<string>>(new Set());
  const [showGuide, setShowGuide] = useState(false);
  const [lightStatus, setLightStatus] = useState<"green" | "yellow" | "red" | null>(null);
  const [bgOption, setBgOption] = useState<"white" | "black" | "transparent">("transparent");
  const [isRemovingBg, setIsRemovingBg] = useState(false);

  const videoRef    = useRef<HTMLVideoElement>(null);
  const canvasRef   = useRef<HTMLCanvasElement>(null);
  const streamRef   = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { isLevel, tiltAngle, requestPermission } = useDeviceOrientation();

  const currentHoof        = HOOVES[currentHoofIndex];
  const currentPerspective = PERSPECTIVES[currentPerspectiveIndex];
  const currentHoofData    = hoofData.get(currentHoof.id);
  const currentPhoto       = currentHoofData?.photos.get(currentPerspective.id);
  const photosForCurrentHoof = currentHoofData?.photos.size || 0;
  const totalPhotos = Array.from(hoofData.values()).reduce((s, hd) => s + hd.photos.size, 0);

  // ── Camera ────────────────────────────────────────────────────────────
  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" }, audio: false });
      streamRef.current = stream;
      const track = stream.getVideoTracks()[0];
      const caps = track.getCapabilities?.() as MediaTrackCapabilities & { torch?: boolean };
      setTorchSupported(!!caps?.torch);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () =>
          videoRef.current?.play().then(() => setIsCameraReady(true)).catch(console.error);
      }
    } catch { setCaptureMode("gallery"); }
  }, []);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setIsCameraReady(false);
    setTorchOn(false);
  }, []);

  const toggleTorch = useCallback(async () => {
    if (!streamRef.current || !torchSupported) return;
    const track = streamRef.current.getVideoTracks()[0];
    try {
      await track.applyConstraints({ advanced: [{ torch: !torchOn } as MediaTrackConstraintSet] });
      setTorchOn(v => !v);
    } catch { /* ignore */ }
  }, [torchOn, torchSupported]);

  // ── Live Analysis ───────────────────────────────────────────────────
  useEffect(() => {
    if (!isCameraReady || !videoRef.current || captureMode === "gallery" || capturedPhoto || showGuide) {
      setLightStatus(null);
      return;
    }

    let rafId: number;
    const analyzeVideo = () => {
      const v = videoRef.current;
      if (!v || v.paused || v.ended) return;

      const canvas = document.createElement("canvas");
      canvas.width = 40;
      canvas.height = 30;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      ctx.drawImage(v, 0, 0, canvas.width, canvas.height);
      const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;

      let totalBrightness = 0;
      for (let i = 0; i < data.length; i += 4) {
        totalBrightness += (0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]);
      }
      const avgBrightness = totalBrightness / (data.length / 4);

      if (avgBrightness < 50) {
        setLightStatus("red");
      } else if (avgBrightness < 90) {
        setLightStatus("yellow");
      } else {
        setLightStatus("green");
      }

      rafId = requestAnimationFrame(analyzeVideo);
    };

    rafId = requestAnimationFrame(analyzeVideo);
    return () => cancelAnimationFrame(rafId);
  }, [isCameraReady, captureMode, capturedPhoto, showGuide]);

  // ── Capture ───────────────────────────────────────────────────────────
  const captureFromCamera = useCallback(() => {
    if (!videoRef.current || !canvasRef.current || !isCameraReady) return;
    const v = videoRef.current, c = canvasRef.current;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    c.width = v.videoWidth; c.height = v.videoHeight;
    ctx.drawImage(v, 0, 0);
    setCapturedPhoto(c.toDataURL("image/jpeg", 0.92));
  }, [isCameraReady]);

  const handleGalleryUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = ev => setCapturedPhoto(ev.target?.result as string);
    reader.readAsDataURL(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, []);

  const removeBg = async () => {
    if (!capturedPhoto) return;
    setIsRemovingBg(true);
    try {
      const response = await fetch("/api/remove-bg", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: capturedPhoto, background: bgOption })
      });
      if (response.ok) {
        const data = await response.json();
        if (data.image) setCapturedPhoto(data.image);
      }
    } catch (e) {
      console.error("BG removal failed", e);
    } finally {
      setIsRemovingBg(false);
    }
  };

  const confirmPhoto = useCallback(() => {
    if (!capturedPhoto) return;
    setHoofData(prev => {
      const m = new Map(prev);
      const ex = m.get(currentHoof.id) || { photos: new Map() };
      ex.photos.set(currentPerspective.id, { dataUrl: capturedPhoto, perspective: currentPerspective.id, timestamp: Date.now() });
      m.set(currentHoof.id, ex);
      return m;
    });
    setCapturedPhoto(null);
    if (currentPerspectiveIndex < PERSPECTIVES.length - 1) setCurrentPerspectiveIndex(i => i + 1);
  }, [capturedPhoto, currentHoof, currentPerspective, currentPerspectiveIndex]);

  const removePhoto = useCallback((perspId: PerspectiveId) => {
    setHoofData(prev => {
      const m = new Map(prev);
      const ex = m.get(currentHoof.id);
      if (ex) { ex.photos.delete(perspId); m.set(currentHoof.id, ex); }
      return m;
    });
  }, [currentHoof]);

  // ── Collage ───────────────────────────────────────────────────────────
  const generateCollage = useCallback(async (hoofId: HoofId): Promise<string | null> => {
    const hData = hoofData.get(hoofId);
    if (!hData || hData.photos.size === 0) return null;
    setIsGeneratingCollage(true);
    try {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) return null;
      const hoofInfo = HOOVES.find(h => h.id === hoofId);
      const photos = Array.from(hData.photos.values());
      const width = 1080, headerH = 80, footerH = 90, pad = 12;
      const cols = Math.min(photos.length, 3);
      const rows = Math.ceil(photos.length / cols);
      const pw = (width - pad * (cols + 1)) / cols;
      const ph = pw * 0.75;
      const height = headerH + rows * (ph + pad) + footerH;
      canvas.width = width; canvas.height = height;

      ctx.fillStyle = "#0a0a0a"; ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = "#F47B20"; ctx.fillRect(0, 0, width, 4);
      ctx.fillStyle = "#ffffff"; ctx.font = "bold 28px sans-serif"; ctx.textAlign = "left";
      ctx.fillText(`${hoofInfo?.label} (${hoofInfo?.short})`, pad + 8, 52);
      ctx.font = "16px sans-serif"; ctx.fillStyle = "#888888"; ctx.textAlign = "right";
      ctx.fillText(horseName || "HufCamPro", width - pad - 8, 52);

      const loadImg = (src: string): Promise<HTMLImageElement> => new Promise((res, rej) => {
        const img = new Image(); img.crossOrigin = "anonymous";
        img.onload = () => res(img); img.onerror = rej; img.src = src;
      });

      for (let i = 0; i < photos.length; i++) {
        const photo = photos[i];
        const col = i % cols, row = Math.floor(i / cols);
        const x = pad + col * (pw + pad);
        const y = headerH + pad + row * (ph + pad);
        try {
          const img = await loadImg(photo.dataUrl);
          ctx.save(); ctx.beginPath();
          ctx.roundRect(x, y, pw, ph, 8); ctx.clip();
          const ia = img.width / img.height, ba = pw / ph;
          let sx = 0, sy = 0, sw = img.width, sh = img.height;
          if (ia > ba) { sw = img.height * ba; sx = (img.width - sw) / 2; }
          else         { sh = img.width / ba;  sy = (img.height - sh) / 2; }
          ctx.drawImage(img, sx, sy, sw, sh, x, y, pw, ph); ctx.restore();
          const pi = PERSPECTIVES.find(p => p.id === photo.perspective);
          ctx.fillStyle = "rgba(244,123,32,0.9)"; ctx.beginPath();
          ctx.roundRect(x + 6, y + 6, 70, 24, 4); ctx.fill();
          ctx.fillStyle = "#ffffff"; ctx.font = "bold 12px sans-serif"; ctx.textAlign = "center";
          ctx.fillText(pi?.label || "", x + 6 + 35, y + 6 + 17);
        } catch { /* skip */ }
      }

      const label = watermark || "HUFCAMPRO";
      const dateStr = new Date().toLocaleDateString("de-DE");
      ctx.fillStyle = "#F47B20"; ctx.font = "bold 18px sans-serif"; ctx.textAlign = "center";
      ctx.fillText(label, width / 2, height - 52);
      
      // Recommendation footer
      ctx.fillStyle = "#888888"; ctx.font = "14px sans-serif"; ctx.textAlign = "center";
      ctx.fillText("Empf. Abstand: 60–70cm (dorsal/lateral) · 40–50cm (solar/palmar)", width / 2, height - 22);

      ctx.font = "bold 14px sans-serif"; ctx.textAlign = "right";
      ctx.strokeStyle = "#000000"; ctx.lineWidth = 3;
      ctx.strokeText(dateStr, width - pad - 8, height - 52);
      ctx.fillStyle = "#ffffff"; ctx.fillText(dateStr, width - pad - 8, height - 52);
      return canvas.toDataURL("image/jpeg", 0.92);
    } catch { return null; }
    finally { setIsGeneratingCollage(false); }
  }, [hoofData, horseName, watermark]);

  const generateAndSaveCollage = useCallback(async () => {
    const url = await generateCollage(currentHoof.id);
    if (!url) return;
    
    setHoofData(prev => {
      const m = new Map(prev);
      const ex = m.get(currentHoof.id) || { photos: new Map<PerspectiveId, PhotoData>() };
      const updated: HoofData = { ...ex, collageUrl: url };
      m.set(currentHoof.id, updated);
      return m;
    });

    setCompletedCollages(prev => {
      const existing = prev.findIndex(c => c.hoofId === currentHoof.id);
      const newItem = { hoofId: currentHoof.id, collageUrl: url, timestamp: Date.now() };
      if (existing >= 0) {
        const next = [...prev];
        next[existing] = newItem;
        return next;
      }
      return [...prev, newItem];
    });

    setJustGenerated(true);
    setTimeout(() => setJustGenerated(false), 2000);
  }, [currentHoof, generateCollage]);

  // ── Download ──────────────────────────────────────────────────────────
  const downloadCollage = useCallback((url: string, hoofId: HoofId) => {
    const a = document.createElement("a");
    a.download = `${horseName || "huf"}_${hoofId}_${new Date().toISOString().split("T")[0]}.jpg`;
    a.href = url; a.click();
  }, [horseName]);

  const downloadAll = useCallback(async () => {
    for (const c of completedCollages) {
      downloadCollage(c.collageUrl, c.hoofId);
      await new Promise(r => setTimeout(r, 500));
    }
  }, [completedCollages, downloadCollage]);

  // ── Share (Web Share API) ─────────────────────────────────────────────
  const shareCollage = useCallback(async (url: string, hoofId: HoofId) => {
    try {
      const res = await fetch(url);
      const blob = await res.blob();
      const file = new File([blob], `${horseName || "huf"}_${hoofId}.jpg`, { type: "image/jpeg" });
      await navigator.share({ title: "HufCamPro Dokumentation", text: horseName ? `Hufdokumentation von ${horseName}` : "Hufdokumentation", files: [file] });
    } catch { /* cancelled */ }
  }, [horseName]);

  // ── PDF Export ────────────────────────────────────────────────────────
  const exportPDF = useCallback(async () => {
    if (completedCollages.length === 0) return;
    const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const pw = 190, margin = 10;
    // Header
    pdf.setFontSize(18); pdf.setTextColor(244, 123, 32);
    pdf.text("HufCamPro Dokumentation", margin, 20);
    pdf.setFontSize(10); pdf.setTextColor(150, 150, 150);
    pdf.text(`${horseName || "Pferd"} · ${new Date().toLocaleDateString("de-DE")}`, margin, 28);
    // Orange line
    pdf.setDrawColor(244, 123, 32); pdf.setLineWidth(0.5);
    pdf.line(margin, 32, 200, 32);

    const colW = (pw - margin) / 2;
    const colH = colW * 0.75;
    let y = 38;

    for (let i = 0; i < completedCollages.length; i++) {
      const col = i % 2;
      const x = margin + col * (colW + margin);
      if (col === 0 && i > 0) y += colH + 6;
      if (y + colH > 280) { pdf.addPage(); y = 15; }
      try {
        pdf.addImage(completedCollages[i].collageUrl, "JPEG", x, y, colW, colH);
      } catch { /* skip */ }
    }

    // Footer
    const pages = (pdf as any).internal.getNumberOfPages();
    for (let p = 1; p <= pages; p++) {
      pdf.setPage(p);
      pdf.setFontSize(8); pdf.setTextColor(100, 100, 100);
      pdf.text("Erstellt mit HufCamPro · hufcampro.de", margin, 290);
    }
    pdf.save(`${horseName || "huf"}_${new Date().toISOString().split("T")[0]}.pdf`);
  }, [completedCollages, horseName]);

  // ── Save session to IndexedDB ─────────────────────────────────────────
  const saveToHistory = useCallback(async () => {
    if (completedCollages.length === 0) return;
    setIsSavingSession(true);
    try {
      await saveSession({
        horseName: horseName || "Unbekannt",
        date: new Date().toLocaleDateString("de-DE"),
        timestamp: Date.now(),
        collages: completedCollages.map(c => ({ hoofId: c.hoofId, collageUrl: c.collageUrl })),
        watermark: watermark || "HUFCAMPRO",
      });
      onSessionSaved?.();
    } catch (e) { console.error(e); }
    finally { setIsSavingSession(false); }
  }, [completedCollages, horseName, watermark, onSessionSaved]);

  // ── Watermark persistence ─────────────────────────────────────────────
  useEffect(() => {
    localStorage.setItem(LS_WATERMARK, watermark);
  }, [watermark]);

  // ── Camera lifecycle ──────────────────────────────────────────────────
  useEffect(() => {
    if (isOpen && captureMode !== "gallery" && !capturedPhoto) {
      startCamera();
      if (captureMode === "ai") requestPermission();
    }
    return () => { if (!isOpen) stopCamera(); };
  }, [isOpen, captureMode, capturedPhoto, startCamera, stopCamera, requestPermission]);

  // ── Guide Lifecycle ──────────────────────────────────────────────────
  useEffect(() => {
    if (isOpen && !capturedPhoto && captureMode !== "gallery") {
      if (!seenGuides.has(currentPerspective.id)) {
        setShowGuide(true);
      }
    }
  }, [isOpen, currentPerspective.id, capturedPhoto, seenGuides, captureMode]);

  const onGuideComplete = () => {
    setSeenGuides(prev => new Set(prev).add(currentPerspective.id));
    setShowGuide(false);
  };

  const goToHoof = (i: number) => { setCurrentHoofIndex(i); setCurrentPerspectiveIndex(0); setCapturedPhoto(null); };
  const goToPerspective = (i: number) => { setCurrentPerspectiveIndex(i); setCapturedPhoto(null); };
  const closeWizard = () => { stopCamera(); setIsOpen(false); };

  // ── Render ────────────────────────────────────────────────────────────
  return (
    <>
      {/* Trigger Card */}
      <div className="rounded-2xl border border-orange-500/30 bg-zinc-900 p-5 space-y-4">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-xl bg-orange-500/10 flex items-center justify-center flex-shrink-0">
            <Camera className="h-6 w-6 text-orange-400" />
          </div>
          <div>
            <h3 className="font-bold text-lg text-white">HufCamPro</h3>
            <p className="text-sm text-zinc-400">{totalPhotos > 0 ? `${totalPhotos} Fotos` : "Huf-Dokumentation starten"}</p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            {completedCollages.length > 0 && (
              <span className="px-2 py-1 rounded-full bg-green-500/20 text-green-400 text-xs font-bold">
                {completedCollages.length} Collagen
              </span>
            )}
            <button onClick={() => setShowSettings(v => !v)}
              className={cn("p-2 rounded-lg transition-colors", showSettings ? "bg-orange-500/20 text-orange-400" : "hover:bg-zinc-800 text-zinc-500")}>
              <Settings className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Settings panel */}
        {showSettings && (
          <div className="rounded-xl bg-zinc-800/50 border border-zinc-700 p-4 space-y-3">
            <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Einstellungen</p>
            <div>
              <label className="block text-xs text-zinc-400 mb-1">Eigenes Wasserzeichen auf Collage</label>
              <input
                type="text"
                value={watermark}
                onChange={e => setWatermark(e.target.value)}
                placeholder="z.B. Dein Name oder Firmenname"
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-orange-500"
              />
              <p className="text-xs text-zinc-500 mt-1">Leer lassen = Standard "HUFCAMPRO"</p>
            </div>
          </div>
        )}

        {/* Horse name */}
        <div>
          <label className="block text-xs text-zinc-400 mb-1">Pferdename (optional)</label>
          <input
            type="text"
            value={horseName}
            onChange={e => setHorseName(e.target.value)}
            placeholder="z.B. Bella"
            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-orange-500"
          />
        </div>

        <button onClick={() => setIsOpen(true)}
          className="w-full h-12 rounded-xl bg-orange-500 hover:bg-orange-400 text-white font-bold text-base flex items-center justify-center gap-2 transition-colors">
          <Camera className="h-5 w-5" />
          {totalPhotos > 0 ? "Fortsetzen" : "Dokumentation starten"}
        </button>

        {/* Completed collages */}
        {completedCollages.length > 0 && (
          <div className="pt-3 border-t border-zinc-800 space-y-3">
            <p className="text-sm font-medium text-zinc-400">Fertige Collagen</p>
            <div className="grid grid-cols-2 gap-2">
              {completedCollages.map(c => (
                <div key={c.timestamp} className="relative rounded-lg overflow-hidden group">
                  <img src={c.collageUrl} alt={c.hoofId} className="w-full" />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                    <button onClick={() => downloadCollage(c.collageUrl, c.hoofId)} title="Herunterladen"
                      className="p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors">
                      <Download className="h-5 w-5 text-white" />
                    </button>
                    {shareSupported && (
                      <button onClick={() => shareCollage(c.collageUrl, c.hoofId)} title="Teilen"
                        className="p-2 rounded-full bg-orange-500/80 hover:bg-orange-500 transition-colors">
                        <Share2 className="h-5 w-5 text-white" />
                      </button>
                    )}
                  </div>
                  <span className="absolute top-1 left-1 px-1.5 py-0.5 bg-orange-500 text-white text-xs rounded font-bold">{c.hoofId}</span>
                </div>
              ))}
            </div>

            {/* Action buttons */}
            <div className="grid grid-cols-2 gap-2">
              <button onClick={downloadAll}
                className="py-2 rounded-lg border border-zinc-700 text-sm text-zinc-300 flex items-center justify-center gap-2 hover:bg-zinc-800 transition-colors">
                <Download className="h-4 w-4" /> Alle JPG
              </button>
              <button onClick={exportPDF}
                className="py-2 rounded-lg border border-zinc-700 text-sm text-zinc-300 flex items-center justify-center gap-2 hover:bg-zinc-800 transition-colors">
                <FileText className="h-4 w-4" /> PDF Export
              </button>
            </div>
            <button onClick={saveToHistory} disabled={isSavingSession}
              className="w-full py-2.5 rounded-xl bg-zinc-700 hover:bg-zinc-600 text-white font-bold text-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-50">
              {isSavingSession ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              In Verlauf speichern
            </button>
          </div>
        )}
      </div>

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-2"
          onClick={e => e.target === e.currentTarget && closeWizard()}>
          <div className="w-full max-w-lg bg-zinc-950 rounded-2xl overflow-hidden flex flex-col max-h-[95vh]">

            {/* Header */}
            <div className="p-4 pb-2 border-b border-zinc-800 flex-shrink-0">
              <div className="flex items-center justify-between mb-2">
                <span className="flex items-center gap-2 font-bold text-white">
                  <Camera className="h-5 w-5 text-orange-400" />
                  {horseName || "HufCamPro"}
                </span>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-full border border-zinc-700 text-xs text-zinc-400">
                    {photosForCurrentHoof}/{PERSPECTIVES.length}
                  </span>
                  <button onClick={closeWizard} className="p-1 rounded-full hover:bg-zinc-800 text-zinc-400">
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* Hoof tabs */}
              <div className="flex gap-1.5">
                {HOOVES.map((hoof, i) => {
                  const hData = hoofData.get(hoof.id);
                  const count = hData?.photos.size || 0;
                  const hasCollage = !!hData?.collageUrl;
                  return (
                    <button key={hoof.id} onClick={() => goToHoof(i)}
                      className={cn("flex-1 py-1.5 rounded-lg text-sm font-bold relative transition-colors",
                        i === currentHoofIndex ? "bg-orange-500 text-white"
                        : hasCollage ? "bg-green-500/20 border border-green-500 text-green-400"
                        : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700")}>
                      {hoof.short}
                      {count > 0 && !hasCollage && (
                        <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-orange-500 text-[9px] flex items-center justify-center text-white">{count}</span>
                      )}
                      {hasCollage && <Check className="inline h-3 w-3 ml-1" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Mode selector */}
            <div className="flex justify-center gap-1 p-2 bg-zinc-900/50 flex-shrink-0">
              {([["ai", Sparkles, "AI Cam"], ["live", Zap, "Live Cam"], ["gallery", FolderOpen, "Galerie"]] as const).map(([mode, Icon, label]) => (
                <button key={mode} onClick={() => setCaptureMode(mode as CaptureMode)}
                  className={cn("flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
                    captureMode === mode ? "bg-orange-500 text-white" : "text-zinc-400 hover:text-white hover:bg-zinc-800")}>
                  <Icon className="h-4 w-4" />{label}
                </button>
              ))}
            </div>

            {/* Perspective info */}
            <div className="p-3 text-center flex-shrink-0 bg-black/20">
              <h3 className="text-base font-bold text-white">{currentHoof.label}</h3>
              <p className="text-orange-400 font-bold text-lg">{currentPerspective.label}</p>
              <p className="text-zinc-500 text-xs">{currentPerspective.desc}</p>
            </div>

            {/* Main content */}
            <div className="flex-1 p-4 overflow-auto space-y-4 relative">
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleGalleryUpload} />
              <canvas ref={canvasRef} className="hidden" />

              {/* Camera area */}
              <div className="relative aspect-[4/3] bg-black rounded-xl overflow-hidden shadow-2xl">
                {showGuide && <GuideOverlay perspective={currentPerspective.id} onComplete={onGuideComplete} />}
                
                {capturedPhoto ? (
                  <>
                    <img src={capturedPhoto} alt="Preview" className="w-full h-full object-cover" />
                    
                    {/* Post-Capture Panel */}
                    <div className="absolute top-4 right-4 flex flex-col gap-2 z-40">
                      <div className="bg-black/60 backdrop-blur-md p-3 rounded-2xl border border-zinc-700/50 space-y-3">
                        <div className="flex items-center gap-2">
                          <Palette className="h-4 w-4 text-orange-400" />
                          <span className="text-[10px] font-bold text-zinc-300 uppercase tracking-wider">Hintergrund</span>
                        </div>
                        <div className="flex gap-1.5">
                          {(["white", "black", "transparent"] as const).map(opt => (
                            <button key={opt} onClick={() => setBgOption(opt)}
                              className={cn("h-8 w-8 rounded-lg border-2 transition-all",
                                bgOption === opt ? "border-orange-500 scale-110" : "border-zinc-700 hover:border-zinc-500",
                                opt === "white" ? "bg-white" : opt === "black" ? "bg-black" : "bg-zinc-800 bg-[radial-gradient(#444_1px,transparent_1px)] [background-size:4px_4px]")}
                            />
                          ))}
                        </div>
                        <button onClick={removeBg} disabled={isRemovingBg}
                          className="w-full py-2 rounded-xl bg-orange-500 hover:bg-orange-400 text-white text-[10px] font-black uppercase flex items-center justify-center gap-2 transition-colors disabled:opacity-50">
                          {isRemovingBg ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
                          BG entfernen
                        </button>
                      </div>
                    </div>

                    <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-4">
                      <button onClick={() => setCapturedPhoto(null)}
                        className="h-14 w-14 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center transition-colors shadow-lg">
                        <RotateCcw className="h-6 w-6 text-white" />
                      </button>
                      <button onClick={confirmPhoto}
                        className="h-14 w-14 rounded-full bg-green-500 hover:bg-green-600 flex items-center justify-center transition-colors shadow-lg">
                        <Check className="h-6 w-6 text-white" />
                      </button>
                    </div>
                  </>
                ) : captureMode === "gallery" ? (
                  <div className="w-full h-full flex flex-col items-center justify-center gap-4 cursor-pointer hover:bg-white/5 transition-colors"
                    onClick={() => fileInputRef.current?.click()}>
                    <FolderOpen className="h-16 w-16 text-zinc-500" />
                    <p className="font-medium text-zinc-400">Foto aus Galerie wählen</p>
                  </div>
                ) : (
                  <>
                    <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                    
                    {/* Traffic Light */}
                    {lightStatus && (
                      <div className="absolute top-4 left-4 z-40">
                        <div className="flex gap-1.5 bg-black/40 backdrop-blur-sm p-1.5 rounded-full border border-white/10">
                          <div className={cn("h-3 w-3 rounded-full transition-shadow duration-500", lightStatus === "red" ? "bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.8)]" : "bg-red-900/40")} />
                          <div className={cn("h-3 w-3 rounded-full transition-shadow duration-500", lightStatus === "yellow" ? "bg-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.8)]" : "bg-yellow-900/40")} />
                          <div className={cn("h-3 w-3 rounded-full transition-shadow duration-500", lightStatus === "green" ? "bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.8)]" : "bg-green-900/40")} />
                        </div>
                      </div>
                    )}

                    {/* Gyro Warning */}
                    {tiltAngle > 10 && (
                      <div className="absolute top-1/4 left-0 right-0 flex justify-center z-40 pointer-events-none">
                        <div className="bg-red-500 text-white px-4 py-2 rounded-2xl font-black text-xs uppercase tracking-wider shadow-2xl animate-bounce flex items-center gap-2">
                          <RotateCcw className="h-4 w-4" /> Kamera gerade halten
                        </div>
                      </div>
                    )}

                    {/* Torch Banner */}
                    {lightStatus === "red" && torchSupported && (
                      <div className="absolute top-16 left-0 right-0 flex justify-center z-40 px-4">
                        <button onClick={toggleTorch} className="bg-zinc-900/90 backdrop-blur-md border border-orange-500 text-orange-500 px-4 py-2 rounded-2xl text-[10px] font-black uppercase flex items-center gap-2 shadow-xl hover:bg-orange-500 hover:text-white transition-all">
                          <Zap className="h-4 w-4" /> Taschenlampe einschalten
                        </button>
                      </div>
                    )}

                    {captureMode === "ai" && isCameraReady && (
                      <CameraGuideOverlay view={currentPerspective.id as any} isLevel={isLevel} tiltAngle={tiltAngle} requiresLevel={true} />
                    )}
                    {!isCameraReady && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black">
                        <Loader2 className="h-8 w-8 text-orange-500 animate-spin" />
                      </div>
                    )}
                    <div className="absolute bottom-4 left-0 right-0 flex items-center justify-center gap-4 px-4">
                      {torchSupported && (
                        <button onClick={toggleTorch}
                          className={cn("h-12 w-12 rounded-full backdrop-blur-md flex items-center justify-center transition-all", 
                            torchOn ? "bg-yellow-400 text-black scale-110" : "bg-zinc-800/80 text-zinc-400")}>
                          <Zap className={cn("h-6 w-6", torchOn && "fill-current")} />
                        </button>
                      )}
                      <button onClick={captureFromCamera} disabled={!isCameraReady}
                        className="h-20 w-20 rounded-full bg-white hover:bg-gray-100 flex items-center justify-center shadow-2xl disabled:opacity-50 border-4 border-zinc-900 group active:scale-95 transition-transform">
                        <div className="h-16 w-16 rounded-full border-2 border-black/10 flex items-center justify-center">
                          <Camera className="h-10 w-10 text-black group-hover:scale-110 transition-transform" />
                        </div>
                      </button>
                      <button onClick={() => fileInputRef.current?.click()}
                        className="h-12 w-12 rounded-full bg-zinc-800/80 backdrop-blur-md flex items-center justify-center hover:bg-zinc-700 transition-colors">
                        <ImageIcon className="h-5 w-5 text-zinc-400" />
                      </button>
                    </div>
                  </>
                )}
                {currentPhoto && !capturedPhoto && (
                  <span className="absolute top-4 right-4 px-3 py-1.5 rounded-full bg-green-500 text-white text-xs font-black uppercase flex items-center gap-1.5 shadow-lg backdrop-blur-md">
                    <Check className="h-4 w-4" /> Erledigt
                  </span>
                )}
              </div>

              {/* Perspective pills */}
              <div className="flex justify-center gap-1.5 flex-wrap">
                {PERSPECTIVES.map((persp, i) => {
                  const hasPhoto = currentHoofData?.photos.has(persp.id);
                  return (
                    <button key={persp.id} onClick={() => goToPerspective(i)}
                      className={cn("px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5",
                        i === currentPerspectiveIndex ? "bg-orange-500 text-white shadow-lg shadow-orange-500/20"
                        : hasPhoto ? "bg-green-500/10 text-green-400 border border-green-500/20"
                        : "bg-zinc-800/50 text-zinc-400 hover:bg-zinc-800 border border-transparent")}>
                      {persp.label}{hasPhoto && <Check className="h-3 w-3" />}
                    </button>
                  );
                })}
              </div>

              {/* Thumbnails */}
              {photosForCurrentHoof > 0 && (
                <div className="flex gap-3 overflow-x-auto pb-2 px-1">
                  {Array.from(currentHoofData?.photos.entries() || []).map(([perspId, photo]) => (
                    <div key={perspId} className="relative flex-shrink-0 group">
                      <img src={photo.dataUrl} alt={perspId} className="h-20 w-20 rounded-xl object-cover border border-zinc-800 shadow-lg" />
                      <button onClick={() => removePhoto(perspId as PerspectiveId)}
                        className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-red-500 flex items-center justify-center shadow-lg hover:scale-110 transition-transform">
                        <X className="h-3 w-3 text-white" />
                      </button>
                      <div className="absolute bottom-0 left-0 right-0 px-1 py-1 bg-black/60 backdrop-blur-sm text-white rounded-b-xl">
                        <p className="text-[8px] font-bold text-center truncate uppercase">
                          {PERSPECTIVES.find(p => p.id === perspId)?.label}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-zinc-800 bg-zinc-900/50 flex-shrink-0 space-y-3">
              {photosForCurrentHoof >= 1 && (
                <button onClick={generateAndSaveCollage} disabled={isGeneratingCollage}
                  className={cn(
                    "w-full py-4 rounded-2xl font-black text-sm uppercase tracking-wider flex items-center justify-center gap-3 transition-all shadow-xl",
                    justGenerated ? "bg-green-500 text-white shadow-green-500/20" : "bg-orange-500 hover:bg-orange-400 text-white shadow-orange-500/20"
                  )}>
                  {isGeneratingCollage ? <Loader2 className="h-5 w-5 animate-spin" /> 
                    : justGenerated ? <Check className="h-5 w-5" /> 
                    : <Sparkles className="h-5 w-5" />}
                  {justGenerated ? "Collage erstellt!" : "Collage für diesen Huf erstellen"}
                </button>
              )}

              <div className="flex gap-2.5">
                <button onClick={() => { if (currentHoofIndex > 0) goToHoof(currentHoofIndex - 1); }}
                  disabled={currentHoofIndex === 0}
                  className="flex-1 py-3.5 rounded-2xl border border-zinc-700 text-xs font-bold text-zinc-300 flex items-center justify-center gap-2 disabled:opacity-20 hover:bg-zinc-800 transition-colors">
                  <ChevronLeft className="h-4 w-4" /> Zurück
                </button>
                
                {currentHoofIndex < HOOVES.length - 1 ? (
                  <button onClick={() => goToHoof(currentHoofIndex + 1)}
                    className="flex-1 py-3.5 rounded-2xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold text-xs flex items-center justify-center gap-2 transition-colors">
                    Nächster Huf <ChevronRight className="h-4 w-4" />
                  </button>
                ) : (
                  <button onClick={closeWizard}
                    className="flex-1 py-3.5 rounded-2xl bg-green-500/20 border border-green-500 text-green-400 font-bold text-xs flex items-center justify-center gap-2 hover:bg-green-500/30 transition-colors">
                    Doku Beenden
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
