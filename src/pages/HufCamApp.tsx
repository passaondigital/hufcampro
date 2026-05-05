import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Camera, Clock, ArrowLeftRight } from "lucide-react";
import { HufCamPro } from "@/components/hufcam/HufCamPro";
import { HistoryView } from "@/components/hufcam/HistoryView";
import { CompareView } from "@/components/hufcam/CompareView";
import { cn } from "@/lib/utils";
import { type HufSession } from "@/lib/db";

type Tab = "kamera" | "verlauf" | "vergleich";

const TABS = [
  { id: "kamera",    label: "Kamera",    Icon: Camera },
  { id: "verlauf",   label: "Verlauf",   Icon: Clock },
  { id: "vergleich", label: "Vergleich", Icon: ArrowLeftRight },
] as const;

export default function HufCamApp() {
  const [tab, setTab]                     = useState<Tab>("kamera");
  const [compareTarget, setCompareTarget] = useState<[HufSession, HufSession] | null>(null);
  const [historyRefresh, setHistoryRefresh] = useState(0);

  const handleCompare = (pair: [HufSession, HufSession]) => {
    setCompareTarget(pair);
    setTab("vergleich");
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col">
      {/* Top nav */}
      <div className="flex-shrink-0 flex items-center gap-3 px-4 py-3 border-b border-zinc-900">
        <Link to="/" className="p-2 rounded-lg hover:bg-zinc-800 text-zinc-400 transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <span className="font-black text-orange-400 tracking-wider">HUFCAMPRO</span>
      </div>

      {/* Tab bar */}
      <div className="flex-shrink-0 flex border-b border-zinc-900">
        {TABS.map(({ id, label, Icon }) => (
          <button key={id} onClick={() => setTab(id as Tab)}
            className={cn(
              "flex-1 flex items-center justify-center gap-1.5 py-3 text-sm font-semibold border-b-2 transition-colors",
              tab === id
                ? "border-orange-500 text-orange-400"
                : "border-transparent text-zinc-500 hover:text-zinc-300"
            )}>
            <Icon className="h-4 w-4" />{label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        <div className="max-w-lg mx-auto px-4 py-4">
          {tab === "kamera" && (
            <HufCamPro onSessionSaved={() => setHistoryRefresh(v => v + 1)} />
          )}
          {tab === "verlauf" && (
            <HistoryView onCompare={handleCompare} refreshKey={historyRefresh} />
          )}
          {tab === "vergleich" && (
            <CompareView sessions={compareTarget} onClear={() => setCompareTarget(null)} />
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="flex-shrink-0 py-3 text-center text-xs text-zinc-700 border-t border-zinc-900 flex flex-col items-center gap-1">
        <span>Entwickelt von Pascal Schmid &middot; <a href="https://hufiapp.de" target="_blank" rel="noopener noreferrer" className="text-orange-400/60 hover:text-orange-400 transition-colors">hufiapp.de</a></span>
        <Link to="/legal" className="text-zinc-500 hover:text-zinc-300 transition-colors">Datenschutz & Impressum</Link>
      </div>
    </div>
  );
}

