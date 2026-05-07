import { useState, useEffect, lazy, Suspense } from "react";
import { motion } from "framer-motion";
import {
  Camera, Smartphone, Download, WifiOff, Image, Zap, Star, ArrowRight,
  Code2, FileText, Ruler, Monitor, Layers,
} from "lucide-react";
import { Link } from "react-router-dom";

const ReviewSection = lazy(() =>
  import("@/components/ReviewSection").then(m => ({ default: m.ReviewSection })),
);

const fadeUp = { hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0 } };
const stagger = { visible: { transition: { staggerChildren: 0.12 } } };

const FEATURES = [
  { icon: Camera,     title: "Live-Kamera",          desc: "Direkte Aufnahme mit Führungslinien für reproduzierbare Perspektiven." },
  { icon: Image,      title: "Auto-Collage",         desc: "Alle Hufe und Perspektiven werden automatisch zu einer Übersicht zusammengestellt." },
  { icon: Ruler,      title: "Sohle vermessen",      desc: "Optional: Länge, Breite und Verhältnis pixelgenau am Sohlenfoto erfassen." },
  { icon: Download,   title: "Sofort Download",      desc: "Collage direkt aufs Gerät — ohne Account, ohne Upload." },
  { icon: WifiOff,    title: "Offline-fähig",        desc: "Fotos, Collagen und Verlauf funktionieren komplett ohne Internet." },
  { icon: Smartphone, title: "Auf jedem Gerät",      desc: "iPhone, Android, Tablet oder Desktop — installierbar wie eine native App." },
  { icon: Layers,     title: "Lokaler Verlauf",      desc: "Alle Sitzungen bleiben in deinem Gerät gespeichert und sind jederzeit vergleichbar." },
  { icon: Zap,        title: "Komplett kostenlos",   desc: "Kein Abo, keine Werbung, keine Cloud — Daten bleiben bei dir." },
];

const PERSPECTIVES = [
  { de: "Vorn",   la: "Dorsal" },
  { de: "Seite",  la: "Lateral" },
  { de: "Innen",  la: "Medial" },
  { de: "Sohle",  la: "Solar" },
  { de: "Hinten", la: "Palmar" },
];

const STEPS = [
  { num: "01", title: "Pferdename eingeben",  desc: "Optional — der Name erscheint auf der Collage." },
  { num: "02", title: "Hufe & Perspektiven",  desc: "Wähle einen Huf (VL · VR · HL · HR) und eine der 5 Perspektiven." },
  { num: "03", title: "Foto aufnehmen",        desc: "Live-Kamera mit Führungslinien, oder Foto aus der Galerie." },
  { num: "04", title: "Collage & Export",      desc: "Collage automatisch erstellen, als JPG oder PDF speichern." },
];

const PREVIEW_TILES = [
  { label: "Vorn",   sub: "Dorsal",  grad: "from-orange-500/25 to-orange-700/5" },
  { label: "Seite",  sub: "Lateral", grad: "from-cyan-500/25 to-cyan-700/5" },
  { label: "Sohle",  sub: "Solar",   grad: "from-purple-500/25 to-purple-700/5" },
  { label: "Hinten", sub: "Palmar",  grad: "from-emerald-500/25 to-emerald-700/5" },
];

export default function Landing() {
  const [deferredPrompt, setDeferredPrompt] = useState<Event | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => { e.preventDefault(); setDeferredPrompt(e); };
    window.addEventListener("beforeinstallprompt", handler);
    window.addEventListener("appinstalled", () => setIsInstalled(true));
    if (window.matchMedia("(display-mode: standalone)").matches) setIsInstalled(true);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      (deferredPrompt as BeforeInstallPromptEvent).prompt();
      await (deferredPrompt as BeforeInstallPromptEvent).userChoice;
      setDeferredPrompt(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white overflow-x-hidden">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-40 bg-[#0a0a0a]/80 backdrop-blur-md border-b border-white/5">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <span className="font-black text-orange-400 tracking-wider text-lg">HUFCAMPRO</span>
          <Link to="/app" className="px-4 py-1.5 bg-orange-500 hover:bg-orange-400 rounded-full text-sm font-bold transition-colors">
            App starten →
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="min-h-[100svh] flex flex-col items-center justify-center px-4 pt-24 pb-16 relative overflow-hidden">
        <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 50% 30%, rgba(244,123,32,0.18) 0%, transparent 65%)" }} />
        <motion.div initial="hidden" animate="visible" variants={stagger}
          className="relative z-10 w-full max-w-5xl mx-auto grid lg:grid-cols-2 gap-10 items-center">

          {/* Text column */}
          <div className="text-center lg:text-left">
            <motion.div variants={fadeUp} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-orange-500/10 border border-orange-500/30 text-orange-400 text-sm font-medium mb-6">
              <Star className="h-3.5 w-3.5" /> Kostenlos · Offline-fähig · Kein Account
            </motion.div>
            <motion.h1 variants={fadeUp} className="text-5xl md:text-7xl font-black tracking-tight mb-4">
              Huf<span className="text-orange-400">Cam</span>Pro
            </motion.h1>
            <motion.p variants={fadeUp} className="text-xl md:text-2xl text-zinc-300 mb-3 font-medium">
              Standardisierte Huf-Fotodokumentation in Sekunden.
            </motion.p>
            <motion.p variants={fadeUp} className="text-zinc-500 mb-8 max-w-xl mx-auto lg:mx-0">
              4 Hufe · 5 Perspektiven · automatische Collage. Direkt am Pferd, ohne Cloud.
            </motion.p>
            <motion.div variants={fadeUp} className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
              <Link to="/app" className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-orange-500 hover:bg-orange-400 rounded-2xl text-white font-bold text-lg transition-colors shadow-lg shadow-orange-500/25">
                <Camera className="h-5 w-5" /> Jetzt starten
              </Link>
              {deferredPrompt && !isInstalled && (
                <button onClick={handleInstall} className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-white font-bold text-lg transition-colors">
                  <Download className="h-5 w-5" /> Installieren
                </button>
              )}
            </motion.div>
          </div>

          {/* Preview column */}
          <motion.div variants={fadeUp} className="relative mx-auto w-full max-w-sm">
            <div className="absolute -inset-6 bg-orange-500/10 blur-3xl rounded-full pointer-events-none" />
            <div className="relative rounded-3xl bg-zinc-900/80 border border-white/10 backdrop-blur-sm shadow-2xl shadow-black/50 overflow-hidden">
              {/* Mock header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
                <div>
                  <div className="text-xs text-zinc-500">Pferd</div>
                  <div className="text-sm font-bold text-white">Maximus · VL</div>
                </div>
                <div className="px-2 py-1 rounded-md bg-orange-500/10 text-orange-400 text-[10px] font-bold tracking-wider">SITZUNG</div>
              </div>
              {/* Mock collage */}
              <div className="grid grid-cols-2 gap-2 p-3">
                {PREVIEW_TILES.map(t => (
                  <div key={t.label}
                    className={`aspect-square rounded-2xl bg-gradient-to-br ${t.grad} border border-white/10 flex flex-col justify-end p-3 relative overflow-hidden`}>
                    <div className="absolute top-2 right-2 h-2 w-2 rounded-full bg-white/40" />
                    <div className="text-xs font-bold text-white">{t.label}</div>
                    <div className="text-[10px] text-zinc-400 uppercase tracking-wider">{t.sub}</div>
                  </div>
                ))}
              </div>
              {/* Mock footer */}
              <div className="text-center text-[10px] text-zinc-600 tracking-[0.2em] py-2 border-t border-white/5">
                HUFCAMPRO · HUFCAMPRO.DE
              </div>
            </div>
            <p className="text-center text-xs text-zinc-600 mt-4">Beispielhafte Collagen-Vorschau</p>
          </motion.div>
        </motion.div>
      </section>

      {/* Perspectives strip */}
      <section className="px-4 pb-4">
        <div className="max-w-3xl mx-auto">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 px-4 py-4 flex flex-wrap items-center justify-center gap-3 sm:gap-6">
            <span className="text-xs text-zinc-500 tracking-wider uppercase">5 Perspektiven</span>
            {PERSPECTIVES.map(p => (
              <span key={p.la} className="text-sm">
                <span className="text-white font-bold">{p.de}</span>
                <span className="text-zinc-600 ml-1">· {p.la}</span>
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={stagger}>
            <motion.h2 variants={fadeUp} className="text-3xl md:text-4xl font-black text-center mb-3">
              Die App auf einen Blick
            </motion.h2>
            <motion.p variants={fadeUp} className="text-zinc-400 text-center mb-12">
              Entwickelt für Hufpfleger, Hufschmiede, Tierärzte und engagierte Pferdebesitzer
            </motion.p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {FEATURES.map((f, i) => (
                <motion.div key={i} variants={fadeUp}
                  className="p-5 rounded-2xl bg-zinc-900 border border-zinc-800 hover:border-orange-500/30 transition-colors group">
                  <div className="h-10 w-10 rounded-xl bg-orange-500/10 flex items-center justify-center mb-4 group-hover:bg-orange-500/20 transition-colors">
                    <f.icon className="h-5 w-5 text-orange-400" />
                  </div>
                  <h3 className="font-bold text-white mb-1">{f.title}</h3>
                  <p className="text-sm text-zinc-400 leading-relaxed">{f.desc}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 px-4 bg-zinc-900/30">
        <div className="max-w-3xl mx-auto">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={stagger}>
            <motion.h2 variants={fadeUp} className="text-3xl md:text-4xl font-black text-center mb-3">
              In 4 Schritten zur Dokumentation
            </motion.h2>
            <motion.p variants={fadeUp} className="text-zinc-400 text-center mb-12">
              Kein Tutorial nötig — die App führt dich durch jeden Schritt.
            </motion.p>
            <div className="space-y-3">
              {STEPS.map((step, i) => (
                <motion.div key={i} variants={fadeUp}
                  className="flex gap-4 items-center p-5 rounded-2xl bg-zinc-900 border border-zinc-800 hover:border-orange-500/30 transition-all hover:translate-x-1">
                  <div className="flex-shrink-0 w-12 h-12 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
                    <span className="text-orange-400 text-sm font-black">{step.num}</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-white mb-0.5">{step.title}</h3>
                    <p className="text-sm text-zinc-400 leading-relaxed">{step.desc}</p>
                  </div>
                  {i < STEPS.length - 1 && (
                    <ArrowRight className="flex-shrink-0 h-4 w-4 text-zinc-700 hidden sm:block" />
                  )}
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Install CTA */}
      <section className="py-20 px-4">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}
          className="max-w-2xl mx-auto text-center">
          <motion.div variants={fadeUp} className="p-8 rounded-3xl bg-gradient-to-br from-orange-500/15 to-orange-600/5 border border-orange-500/20">
            <Smartphone className="h-12 w-12 text-orange-400 mx-auto mb-4" />
            <h2 className="text-2xl md:text-3xl font-black mb-3">Wie eine native App</h2>
            <p className="text-zinc-400 mb-6">
              Installiere HufCamPro auf deinem Gerät — startet wie eine App, läuft auch ohne Netz.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6 text-sm text-left">
              <div className="p-3 rounded-xl bg-black/30 flex items-start gap-3">
                <Smartphone className="h-5 w-5 text-orange-400 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-white text-xs mb-1">iPhone / iPad</div>
                  <div className="text-zinc-400 text-xs">Safari → Teilen → Zum Home-Bildschirm</div>
                </div>
              </div>
              <div className="p-3 rounded-xl bg-black/30 flex items-start gap-3">
                <Smartphone className="h-5 w-5 text-orange-400 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-white text-xs mb-1">Android</div>
                  <div className="text-zinc-400 text-xs">Chrome → Menü → App installieren</div>
                </div>
              </div>
              <div className="p-3 rounded-xl bg-black/30 flex items-start gap-3">
                <Monitor className="h-5 w-5 text-orange-400 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-white text-xs mb-1">Desktop</div>
                  <div className="text-zinc-400 text-xs">Chrome/Edge → Adressleiste → Installieren</div>
                </div>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link to="/app" className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-orange-500 hover:bg-orange-400 rounded-xl text-white font-bold transition-colors">
                <Camera className="h-4 w-4" /> App starten
              </Link>
              {deferredPrompt && !isInstalled && (
                <button onClick={handleInstall} className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 rounded-xl text-white font-bold transition-colors">
                  <Download className="h-4 w-4" /> Direkt installieren
                </button>
              )}
              {isInstalled && (
                <span className="inline-flex items-center gap-2 px-6 py-3 bg-green-500/20 rounded-xl text-green-400 font-bold">
                  ✓ Bereits installiert
                </span>
              )}
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* HufiApp Funnel */}
      <section className="py-20 px-4 bg-zinc-900/30">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={stagger}
          className="max-w-3xl mx-auto">
          <motion.div variants={fadeUp} className="p-8 md:p-12 rounded-3xl bg-gradient-to-br from-zinc-900 to-zinc-900/50 border border-zinc-700 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/5 rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />
            <div className="relative">
              <span className="inline-block px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/30 text-orange-400 text-xs font-bold mb-4">
                FÜR PROFIS
              </span>
              <h2 className="text-2xl md:text-3xl font-black mb-3 text-white">
                Du machst Hufpflege beruflich?
              </h2>
              <p className="text-zinc-400 mb-6 leading-relaxed">
                HufCamPro ist nur der Foto-Baustein. Mit <span className="text-white font-semibold">HufiApp</span> verwaltest du Termine, Kunden und Rechnungen für dein gesamtes Hufpflege-Business.
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8 text-sm">
                {[
                  { label: "Terminplanung" },
                  { label: "Kundenverwaltung" },
                  { label: "Rechnungen" },
                  { label: "Auswertungen" },
                ].map(f => (
                  <div key={f.label} className="px-3 py-2.5 rounded-xl bg-black/30 text-center">
                    <div className="text-zinc-200 font-medium text-xs">{f.label}</div>
                  </div>
                ))}
              </div>
              <a href="https://hufiapp.de" target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 bg-orange-500 hover:bg-orange-400 rounded-xl text-white font-bold transition-colors shadow-lg shadow-orange-500/20">
                HufiApp entdecken →
              </a>
            </div>
          </motion.div>
        </motion.div>
      </section>

      <Suspense fallback={<div className="py-12 text-center text-zinc-700 text-sm">Lade Erfahrungsberichte…</div>}>
        <ReviewSection />
      </Suspense>

      {/* Developer credit */}
      <section className="py-12 px-4 border-t border-zinc-900">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}
          className="max-w-2xl mx-auto text-center">
          <div className="flex items-center justify-center gap-2 mb-3">
            <Code2 className="h-5 w-5 text-orange-400" />
            <span className="font-bold text-white">Entwickelt von Pascal Schmid</span>
          </div>
          <p className="text-zinc-500 text-sm">
            HufCamPro ist ein kostenloses Werkzeug für die Hufpflege-Community.<br />
            Teil der <a href="https://hufiapp.de" target="_blank" rel="noopener noreferrer" className="text-orange-400 hover:underline">HufiApp</a>-Familie — Software für Hufpfleger.
          </p>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-zinc-900">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="font-black text-zinc-600 tracking-wider">HUFCAMPRO</span>
          <div className="flex items-center gap-4 text-sm text-zinc-500">
            <Link to="/legal" className="hover:text-white transition-colors flex items-center gap-1">
              <FileText className="h-3.5 w-3.5" /> Datenschutz & Impressum
            </Link>
            <span>© {new Date().getFullYear()} Pascal Schmid</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

// Type augmentation for BeforeInstallPromptEvent
interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}
