import { useState, useEffect } from "react";
import { Trash2, Clock, ArrowLeftRight, Download, Ruler } from "lucide-react";
import { getSessions, deleteSession, updateSession, type HufSession, type SessionSolarPhoto } from "@/lib/db";
import { MeasurementView } from "./MeasurementView";
import type { SolarMeasurementInput, SolarMeasurements } from "./types";

interface HistoryViewProps {
  onCompare: (sessions: [HufSession, HufSession]) => void;
  refreshKey?: number;
}

export function HistoryView({ onCompare, refreshKey }: HistoryViewProps) {
  const [sessions, setSessions] = useState<HufSession[]>([]);
  const [selected, setSelected] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [measuring, setMeasuring] = useState<{ sessionId: number; hoofId: string } | null>(null);

  useEffect(() => {
    getSessions().then(s => { setSessions(s); setLoading(false); });
  }, [refreshKey]);

  const measuringSession = measuring ? sessions.find(s => s.id === measuring.sessionId) : null;
  const measuringPhoto: SessionSolarPhoto | undefined =
    measuringSession?.solarPhotos?.find(p => p.hoofId === measuring?.hoofId);

  const handleSaveMeasurement = async (
    points: SolarMeasurementInput,
    measurements: SolarMeasurements,
  ) => {
    if (!measuringSession || !measuringPhoto || measuringSession.id === undefined) return;
    const updatedPhotos: SessionSolarPhoto[] =
      (measuringSession.solarPhotos ?? []).map(p =>
        p.hoofId === measuringPhoto.hoofId
          ? { ...p, measurementPoints: points, pixelMeasurements: measurements }
          : p,
      );
    const updated: HufSession = { ...measuringSession, solarPhotos: updatedPhotos };
    await updateSession(updated);
    setSessions(prev => prev.map(s => (s.id === updated.id ? updated : s)));
    setMeasuring(null);
  };

  const handleDelete = async (id: number) => {
    await deleteSession(id);
    setSessions(prev => prev.filter(s => s.id !== id));
    setSelected(prev => prev.filter(i => i !== id));
  };

  const toggleSelect = (id: number) => {
    setSelected(prev => {
      if (prev.includes(id)) return prev.filter(i => i !== id);
      if (prev.length >= 2) return [prev[1], id];
      return [...prev, id];
    });
  };

  const handleCompare = () => {
    const s1 = sessions.find(s => s.id === selected[0]);
    const s2 = sessions.find(s => s.id === selected[1]);
    if (s1 && s2) onCompare([s1, s2]);
  };

  const downloadCollage = (url: string, horseName: string, hoofId: string) => {
    const a = document.createElement("a");
    a.download = `${horseName}_${hoofId}.jpg`;
    a.href = url; a.click();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-zinc-500">
        <div className="animate-spin h-6 w-6 border-2 border-orange-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (sessions.length === 0) {
    return (
      <div className="text-center py-16 space-y-3">
        <Clock className="h-12 w-12 text-zinc-700 mx-auto" />
        <p className="font-bold text-zinc-400">Noch keine gespeicherten Sitzungen</p>
        <p className="text-sm text-zinc-600">Erstelle eine Dokumentation und klicke auf "In Verlauf speichern".</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Compare bar */}
      {selected.length === 2 && (
        <div className="sticky top-0 z-10 flex items-center justify-between p-3 rounded-xl bg-orange-500/10 border border-orange-500/30">
          <p className="text-sm text-orange-300 font-medium">2 Sitzungen ausgewählt</p>
          <button onClick={handleCompare}
            className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-400 text-white text-sm font-bold rounded-lg transition-colors">
            <ArrowLeftRight className="h-4 w-4" /> Vergleichen
          </button>
        </div>
      )}
      {selected.length === 1 && (
        <p className="text-xs text-zinc-500 text-center">Wähle eine weitere Sitzung für den Vergleich</p>
      )}

      {sessions.map(session => {
        const isSelected = session.id !== undefined && selected.includes(session.id);
        return (
          <div key={session.id}
            className={`rounded-2xl border p-4 space-y-3 transition-colors ${isSelected ? "border-orange-500 bg-orange-500/5" : "border-zinc-800 bg-zinc-900"}`}>
            {/* Header */}
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-bold text-white">{session.horseName}</h3>
                <p className="text-xs text-zinc-500">{session.date} · {session.collages.length} Collage{session.collages.length !== 1 ? "n" : ""}</p>
                {session.watermark && session.watermark !== "HUFCAMPRO" && (
                  <p className="text-xs text-orange-400/70 mt-0.5">Wasserzeichen: {session.watermark}</p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => session.id !== undefined && toggleSelect(session.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${isSelected ? "bg-orange-500 text-white" : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"}`}>
                  {isSelected ? "✓ Ausgewählt" : "Auswählen"}
                </button>
                <button onClick={() => session.id !== undefined && handleDelete(session.id)}
                  className="p-1.5 rounded-lg hover:bg-red-500/20 text-zinc-600 hover:text-red-400 transition-colors">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Collage thumbnails */}
            <div className="flex gap-2 overflow-x-auto pb-1">
              {session.collages.map(c => (
                <div key={c.hoofId} className="relative flex-shrink-0 group cursor-pointer"
                  onClick={() => downloadCollage(c.collageUrl, session.horseName, c.hoofId)}>
                  <img src={c.collageUrl} alt={c.hoofId} className="h-20 w-28 rounded-lg object-cover" />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                    <Download className="h-5 w-5 text-white" />
                  </div>
                  <span className="absolute top-1 left-1 px-1.5 py-0.5 bg-orange-500 text-white text-[10px] font-bold rounded">
                    {c.hoofId}
                  </span>
                </div>
              ))}
            </div>

            {/* Solar measurement actions */}
            {session.solarPhotos && session.solarPhotos.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-1 border-t border-zinc-800/60">
                {session.solarPhotos.map(sp => {
                  const measured = !!sp.pixelMeasurements;
                  return (
                    <button
                      key={sp.hoofId}
                      onClick={() => session.id !== undefined && setMeasuring({ sessionId: session.id, hoofId: sp.hoofId })}
                      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                        measured
                          ? "bg-cyan-500/15 text-cyan-300 hover:bg-cyan-500/25"
                          : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
                      }`}
                      title={measured ? "Messpunkte vorhanden – bearbeiten" : "Sohle vermessen"}
                    >
                      <Ruler className="h-3.5 w-3.5" />
                      {sp.hoofId} · {measured ? "vermessen" : "Sohle vermessen"}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}

      {measuring && measuringSession && measuringPhoto && (
        <MeasurementView
          hoofId={measuringPhoto.hoofId}
          horseName={measuringSession.horseName}
          dataUrl={measuringPhoto.dataUrl}
          initialPoints={measuringPhoto.measurementPoints}
          onSave={handleSaveMeasurement}
          onClose={() => setMeasuring(null)}
        />
      )}
    </div>
  );
}
