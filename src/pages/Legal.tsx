import { Shield, Camera, ScrollText, Building2, ChevronLeft } from "lucide-react";
import { Link } from "react-router-dom";

export function Legal() {
  return (
    <div className="min-h-screen bg-[#0a0700] text-zinc-300 font-sans p-6 pb-24">
      <div className="max-w-3xl mx-auto space-y-12">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link to="/" className="p-2 -ml-2 rounded-full hover:bg-zinc-800 transition-colors text-zinc-400">
            <ChevronLeft className="h-6 w-6" />
          </Link>
          <h1 className="text-3xl font-black text-white uppercase tracking-wider">
            Datenschutz & Impressum
          </h1>
        </div>

        {/* DATENSCHUTZ */}
        <section className="space-y-4">
          <div className="flex items-center gap-3 text-[#F5970A]">
            <Shield className="h-6 w-6" />
            <h2 className="text-xl font-bold uppercase tracking-wider">Datenschutz</h2>
          </div>
          <div className="bg-zinc-900/50 rounded-2xl border border-zinc-800 p-6 space-y-3 text-sm leading-relaxed">
            <p>• Diese App speichert <strong className="text-white">keine Daten auf Servern</strong>.</p>
            <p>• Alle Fotos verbleiben auf deinem Gerät (lokaler Browserspeicher / IndexedDB).</p>
            <p>• Beim Hintergrund-Entfernen werden Fotos kurzzeitig an den Server übertragen und <strong className="text-white">sofort nach der Verarbeitung gelöscht</strong> — keine dauerhafte Speicherung.</p>
            <p>• Kein Tracking, keine Cookies, keine Analytics.</p>
            <p>• Kein Account erforderlich.</p>
          </div>
        </section>

        {/* BILDRECHTE */}
        <section className="space-y-4">
          <div className="flex items-center gap-3 text-[#F5970A]">
            <Camera className="h-6 w-6" />
            <h2 className="text-xl font-bold uppercase tracking-wider">Bildrechte</h2>
          </div>
          <div className="bg-zinc-900/50 rounded-2xl border border-zinc-800 p-6 space-y-3 text-sm leading-relaxed">
            <p>• Die mit HufCamPro erstellten Fotos und Collagen <strong className="text-white">gehören dir</strong>.</p>
            <p>• HufCamPro beansprucht <strong className="text-white">keine Rechte</strong> an deinen Aufnahmen.</p>
            <p>• Du bist selbst verantwortlich für die Einholung von Einverständnissen beim Fotografieren von Pferden Dritter.</p>
          </div>
        </section>

        {/* NUTZUNG */}
        <section className="space-y-4">
          <div className="flex items-center gap-3 text-[#F5970A]">
            <ScrollText className="h-6 w-6" />
            <h2 className="text-xl font-bold uppercase tracking-wider">Nutzung</h2>
          </div>
          <div className="bg-zinc-900/50 rounded-2xl border border-zinc-800 p-6 space-y-3 text-sm leading-relaxed">
            <p>• HufCamPro ist ein kostenloses Tool ohne Garantie auf Verfügbarkeit.</p>
            <p>• Die App dient der Dokumentation, <strong className="text-white">ersetzt keine tierärztliche Diagnose</strong>.</p>
          </div>
        </section>

        {/* IMPRESSUM */}
        <section className="space-y-4">
          <div className="flex items-center gap-3 text-[#F5970A]">
            <Building2 className="h-6 w-6" />
            <h2 className="text-xl font-bold uppercase tracking-wider">Impressum</h2>
          </div>
          <div className="bg-zinc-900/50 rounded-2xl border border-zinc-800 p-6 space-y-3 text-sm leading-relaxed">
            <p className="font-bold text-white">Pascal Schmid</p>
            <p>c/o Postflex #10643<br/>Emsdettener Str. 10<br/>48268 Greven</p>
            <p className="pt-4 text-zinc-500 italic">Rechtliche Beratung: erecht24</p>
          </div>
        </section>
      </div>
    </div>
  );
}
