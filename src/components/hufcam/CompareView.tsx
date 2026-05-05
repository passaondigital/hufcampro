import { ArrowLeftRight, X } from "lucide-react";
import { type HufSession } from "@/lib/db";

const HOOVES = ["VL", "VR", "HL", "HR"] as const;

interface CompareViewProps {
  sessions: [HufSession, HufSession] | null;
  onClear: () => void;
}

export function CompareView({ sessions, onClear }: CompareViewProps) {
  if (!sessions) {
    return (
      <div className="text-center py-16 space-y-3">
        <ArrowLeftRight className="h-12 w-12 text-zinc-700 mx-auto" />
        <p className="font-bold text-zinc-400">Noch kein Vergleich ausgewählt</p>
        <p className="text-sm text-zinc-600">Gehe zum Verlauf und wähle zwei Sitzungen aus.</p>
      </div>
    );
  }

  const [a, b] = sessions;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-900 border border-zinc-800">
        <div className="flex items-center gap-3 text-sm">
          <div className="text-center">
            <p className="font-bold text-orange-400">{a.horseName}</p>
            <p className="text-zinc-500 text-xs">{a.date}</p>
          </div>
          <ArrowLeftRight className="h-4 w-4 text-zinc-600" />
          <div className="text-center">
            <p className="font-bold text-orange-400">{b.horseName}</p>
            <p className="text-zinc-500 text-xs">{b.date}</p>
          </div>
        </div>
        <button onClick={onClear} className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-500 hover:text-white transition-colors">
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Side-by-side per hoof */}
      {HOOVES.map(hoofId => {
        const colA = a.collages.find(c => c.hoofId === hoofId);
        const colB = b.collages.find(c => c.hoofId === hoofId);
        if (!colA && !colB) return null;

        return (
          <div key={hoofId} className="rounded-2xl bg-zinc-900 border border-zinc-800 overflow-hidden">
            <div className="px-4 py-2 border-b border-zinc-800 flex items-center gap-2">
              <span className="px-2 py-0.5 bg-orange-500 text-white text-xs font-black rounded">{hoofId}</span>
              <span className="text-xs text-zinc-500">
                {hoofId === "VL" ? "Vorne Links" : hoofId === "VR" ? "Vorne Rechts" : hoofId === "HL" ? "Hinten Links" : "Hinten Rechts"}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-1 p-2">
              <div className="space-y-1">
                <p className="text-xs text-center text-zinc-500 font-medium">{a.date}</p>
                {colA ? (
                  <img src={colA.collageUrl} alt={`${hoofId} vorher`} className="w-full rounded-lg" />
                ) : (
                  <div className="aspect-[4/3] rounded-lg bg-zinc-800 flex items-center justify-center">
                    <p className="text-xs text-zinc-600">Kein Foto</p>
                  </div>
                )}
              </div>
              <div className="space-y-1">
                <p className="text-xs text-center text-zinc-500 font-medium">{b.date}</p>
                {colB ? (
                  <img src={colB.collageUrl} alt={`${hoofId} nachher`} className="w-full rounded-lg" />
                ) : (
                  <div className="aspect-[4/3] rounded-lg bg-zinc-800 flex items-center justify-center">
                    <p className="text-xs text-zinc-600">Kein Foto</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
