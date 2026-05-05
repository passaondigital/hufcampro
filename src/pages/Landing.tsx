import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Camera, Smartphone, Download, Wifi, Image, Zap, Star, ChevronDown, ArrowRight, Code2, FileText } from "lucide-react";
import { Link } from "react-router-dom";
// import { ReviewSection } from "@/components/ReviewSection";

const fadeUp = { hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0 } };
const stagger = { visible: { transition: { staggerChildren: 0.12 } } };

const FEATURES = [
  { icon: Camera, title: "Live-Kamera", desc: "Direkte Aufnahme mit der Gerätekamera — mit Führungslinien für perfekte Perspektiven." },
  { icon: Image, title: "Auto-Collage", desc: "Alle Huffotos werden automatisch zu einer professionellen Collage zusammengestellt." },
  { icon: Download, title: "Sofort Download", desc: "Collagen direkt auf dein Gerät herunterladen — kein Account, kein Upload." },
  { icon: Wifi, title: "100% Offline", desc: "Einmal installiert läuft die App komplett ohne Internet — perfekt im Stall." },
  { icon: Smartphone, title: "Jedes Gerät", desc: "iPhone, Android, Tablet, PC — installierbar wie eine native App." },
  { icon: Zap, title: "Kostenlos", desc: "Keine Kosten, kein Abo, kein Datenschutz-Problem. Einfach benutzen." },
];

const STEPS = [
  { num: "01", title: "Pferdename eingeben", desc: "Gib optional den Namen des Pferdes ein — er erscheint auf der Collage.", icon: "🐴" },
  { num: "02", title: "Hufe wählen", desc: "Wähle VL · VR · HL · HR und die Perspektive: Dorsal, Lateral, Solar, Palmar.", icon: "🔲" },
  { num: "03", title: "Foto aufnehmen", desc: "Nutze die Live-Kamera mit Führungslinien oder lade Fotos aus der Galerie.", icon: "📸" },
  { num: "04", title: "Collage erstellen", desc: "Tippe 'Collage erstellen' — fertig. Professionelle Dokumentation in Sekunden.", icon: "✨" },
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
            App starten &rarr;
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="min-h-screen flex flex-col items-center justify-center text-center px-4 pt-14 relative overflow-hidden">
        <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 50% 40%, rgba(244,123,32,0.15) 0%, transparent 70%)" }} />
        <motion.div initial="hidden" animate="visible" variants={stagger} className="relative z-10 max-w-3xl mx-auto">
          <motion.div variants={fadeUp} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-orange-500/10 border border-orange-500/30 text-orange-400 text-sm font-medium mb-6">
            <Star className="h-3.5 w-3.5" /> Kostenlos &middot; Offline &middot; Kein Account
          </motion.div>
          <motion.h1 variants={fadeUp} className="text-5xl md:text-7xl font-black tracking-tight mb-4">
            Huf<span className="text-orange-400">Cam</span>Pro
          </motion.h1>
          <motion.p variants={fadeUp} className="text-xl md:text-2xl text-zinc-400 mb-3 font-medium">
            Professionelle Huf-Fotodokumentation
          </motion.p>
          <motion.p variants={fadeUp} className="text-zinc-500 mb-10 max-w-xl mx-auto">
            Fotografiere alle 4 Hufe in 5 Perspektiven. Erstelle automatisch Collagen. Lade sie sofort herunter. Komplett kostenlos, offline nutzbar, auf jedem Ger&auml;t installierbar.
          </motion.p>
          <motion.div variants={fadeUp} className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/app" className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-orange-500 hover:bg-orange-400 rounded-2xl text-white font-bold text-lg transition-colors shadow-lg shadow-orange-500/25">
              <Camera className="h-5 w-5" /> Jetzt starten
            </Link>
            {deferredPrompt && !isInstalled && (
              <button onClick={handleInstall} className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-white font-bold text-lg transition-colors">
                <Download className="h-5 w-5" /> Als App installieren
              </button>
            )}
          </motion.div>
        </motion.div>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.5 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 text-zinc-600 animate-bounce">
          <ChevronDown className="h-6 w-6" />
        </motion.div>
      </section>

      {/* Features */}
      <section className="py-24 px-4">
        <div className="max-w-5xl mx-auto">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={stagger}>
            <motion.h2 variants={fadeUp} className="text-3xl md:text-4xl font-black text-center mb-3">
              Alles was du brauchst
            </motion.h2>
            <motion.p variants={fadeUp} className="text-zinc-400 text-center mb-12">
              Entwickelt f&uuml;r Hufpfleger, Hufschmiede und Tier&auml;rzte
            </motion.p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
      <section className="py-24 px-4 bg-zinc-900/30">
        <div className="max-w-3xl mx-auto">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={stagger}>
            <motion.h2 variants={fadeUp} className="text-3xl md:text-4xl font-black text-center mb-3">
              So einfach geht&apos;s
            </motion.h2>
            <motion.p variants={fadeUp} className="text-zinc-400 text-center mb-12">
              In 4 Schritten zur professionellen Dokumentation
            </motion.p>
            <div className="space-y-4">
              {STEPS.map((step, i) => (
                <motion.div key={i} variants={fadeUp}
                  className="flex gap-4 p-5 rounded-2xl bg-zinc-900 border border-zinc-800 hover:border-orange-500/30 transition-all hover:translate-x-1">
                  <div className="flex-shrink-0 w-14 h-14 rounded-2xl bg-orange-500/10 flex flex-col items-center justify-center">
                    <span className="text-2xl leading-none mb-0.5">{step.icon}</span>
                    <span className="text-orange-400 text-[10px] font-black">{step.num}</span>
                  </div>
                  <div>
                    <h3 className="font-bold text-white mb-1">{step.title}</h3>
                    <p className="text-sm text-zinc-400 leading-relaxed">{step.desc}</p>
                  </div>
                  {i < STEPS.length - 1 && (
                    <ArrowRight className="flex-shrink-0 h-5 w-5 text-zinc-700 self-center ml-auto hidden sm:block" />
                  )}
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Install CTA */}
      <section className="py-24 px-4">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}
          className="max-w-2xl mx-auto text-center">
          <motion.div variants={fadeUp} className="p-8 rounded-3xl bg-gradient-to-br from-orange-500/20 to-orange-600/5 border border-orange-500/20">
            <Smartphone className="h-12 w-12 text-orange-400 mx-auto mb-4" />
            <h2 className="text-2xl md:text-3xl font-black mb-3">Als App installieren</h2>
            <p className="text-zinc-400 mb-6">
              Installiere HufCamPro auf deinem Ger&auml;t &mdash; funktioniert wie eine native App, auch komplett offline.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6 text-sm">
              <div className="p-3 rounded-xl bg-black/30">
                <div className="font-bold text-white mb-1">&#128241; iPhone / iPad</div>
                <div className="text-zinc-400">Safari &rarr; Teilen &rarr; Zum Home-Bildschirm</div>
              </div>
              <div className="p-3 rounded-xl bg-black/30">
                <div className="font-bold text-white mb-1">&#129302; Android</div>
                <div className="text-zinc-400">Chrome &rarr; Men&uuml; &rarr; App installieren</div>
              </div>
              <div className="p-3 rounded-xl bg-black/30">
                <div className="font-bold text-white mb-1">&#128187; Desktop</div>
                <div className="text-zinc-400">Chrome/Edge &rarr; Adressleiste &rarr; Installieren</div>
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
                  &#10003; Bereits installiert
                </span>
              )}
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* HufiApp Funnel */}
      <section className="py-24 px-4 bg-zinc-900/30">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={stagger}
          className="max-w-3xl mx-auto">
          <motion.div variants={fadeUp} className="p-8 md:p-12 rounded-3xl bg-gradient-to-br from-zinc-900 to-zinc-900/50 border border-zinc-700 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/5 rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />
            <div className="relative">
              <span className="inline-block px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/30 text-orange-400 text-xs font-bold mb-4">
                FÜR PROFIS
              </span>
              <h2 className="text-2xl md:text-3xl font-black mb-3 text-white">
                Du bist Hufpfleger und willst mehr?
              </h2>
              <p className="text-zinc-400 mb-6 leading-relaxed">
                HufCamPro ist nur der Anfang. Mit <span className="text-white font-semibold">HufiApp</span> verwaltest du dein gesamtes Hufpflege-Business — von der Terminplanung über Kundenverwaltung bis hin zu digitalen Rechnungen.
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8 text-sm">
                {[
                  { icon: "📅", label: "Terminplanung" },
                  { icon: "👥", label: "Kundenverwaltung" },
                  { icon: "🧾", label: "Rechnungen" },
                  { icon: "📊", label: "Auswertungen" },
                ].map(f => (
                  <div key={f.label} className="p-3 rounded-xl bg-black/30 text-center">
                    <div className="text-2xl mb-1">{f.icon}</div>
                    <div className="text-zinc-300 font-medium text-xs">{f.label}</div>
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

      {/* <ReviewSection /> */}

      {/* Developer credit */}
      <section className="py-12 px-4 border-t border-zinc-900">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}
          className="max-w-2xl mx-auto text-center">
          <div className="flex items-center justify-center gap-2 mb-3">
            <Code2 className="h-5 w-5 text-orange-400" />
            <span className="font-bold text-white">Entwickelt von Pascal Schmid</span>
          </div>
          <p className="text-zinc-500 text-sm">
            HufCamPro ist ein kostenloses Open-Source-Tool f&uuml;r die Hufpflege-Community.<br />
            Teil der <a href="https://hufiapp.de" target="_blank" rel="noopener noreferrer" className="text-orange-400 hover:underline">HufiApp</a>-Familie &mdash; Software f&uuml;r Hufpfleger.
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
      <span>&copy; {new Date().getFullYear()} Pascal Schmid</span>
    </div>
  </div>
</footer>
</div>
);
}

// Type augmentation for BeforeInstallPromptEvent
interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

