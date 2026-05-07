import { useRegisterSW } from "virtual:pwa-register/react";
import { RefreshCw, X } from "lucide-react";

export function UpdatePrompt() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisterError(err) {
      console.error("SW registration error", err);
    },
  });

  if (!needRefresh) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-4 left-4 right-4 z-[60] mx-auto max-w-md rounded-2xl border border-orange-500/40 bg-zinc-900/95 backdrop-blur-md shadow-2xl shadow-black/50 p-4 flex items-center gap-3"
    >
      <div className="h-9 w-9 flex-shrink-0 rounded-xl bg-orange-500/15 flex items-center justify-center">
        <RefreshCw className="h-4 w-4 text-orange-400" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-bold text-white">Neue Version verfügbar</div>
        <div className="text-xs text-zinc-400">Jetzt neu laden, um sie zu nutzen.</div>
      </div>
      <button
        onClick={() => updateServiceWorker(true)}
        className="px-3 py-1.5 rounded-lg bg-orange-500 hover:bg-orange-400 text-white text-xs font-bold transition-colors"
      >
        Neu laden
      </button>
      <button
        onClick={() => setNeedRefresh(false)}
        aria-label="Später"
        className="p-1.5 rounded-lg text-zinc-500 hover:text-white hover:bg-white/5 transition-colors"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
