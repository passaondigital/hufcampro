import { useEffect, useMemo, useRef, useState } from "react";
import { X, RotateCcw, Save } from "lucide-react";
import { calculateSolarMeasurements } from "@/lib/hoofMeasurements";
import type {
  Point,
  SolarMeasurementInput,
  SolarMeasurements,
} from "./types";

type PointKey = keyof SolarMeasurementInput;

const POINT_ORDER: { key: PointKey; label: string; color: string }[] = [
  { key: "toe",        label: "Zehe",         color: "#f97316" },
  { key: "widthLeft",  label: "Breite links", color: "#22d3ee" },
  { key: "widthRight", label: "Breite rechts", color: "#22d3ee" },
  { key: "heel",       label: "Trachte",      color: "#a855f7" },
];

const SHAPE_LABELS: Record<SolarMeasurements["shape"], string> = {
  round: "rund",
  oval: "oval",
  slim: "schmal",
};

export interface MeasurementViewProps {
  hoofId: string;
  horseName: string;
  dataUrl: string;
  initialPoints?: SolarMeasurementInput;
  onSave: (points: SolarMeasurementInput, measurements: SolarMeasurements) => Promise<void> | void;
  onClose: () => void;
}

export function MeasurementView({
  hoofId,
  horseName,
  dataUrl,
  initialPoints,
  onSave,
  onClose,
}: MeasurementViewProps) {
  const [points, setPoints] = useState<Partial<SolarMeasurementInput>>(initialPoints ?? {});
  const [naturalSize, setNaturalSize] = useState<{ w: number; h: number } | null>(null);
  const [displaySize, setDisplaySize] = useState<{ w: number; h: number } | null>(null);
  const [draggingKey, setDraggingKey] = useState<PointKey | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const imgRef = useRef<HTMLImageElement>(null);

  const nextPointKey = useMemo<PointKey | null>(() => {
    for (const { key } of POINT_ORDER) {
      if (!points[key]) return key;
    }
    return null;
  }, [points]);

  const allPoints: SolarMeasurementInput | null = useMemo(() => {
    const { toe, widthLeft, widthRight, heel } = points;
    if (toe && widthLeft && widthRight && heel) return { toe, widthLeft, widthRight, heel };
    return null;
  }, [points]);

  const measurements = useMemo<SolarMeasurements | null>(() => {
    if (!allPoints) return null;
    return calculateSolarMeasurements(allPoints);
  }, [allPoints]);

  // ── Coord helpers (display ↔ natural) ─────────────────────────────────
  function displayToNatural(dx: number, dy: number): Point {
    if (!naturalSize || !displaySize) return { x: dx, y: dy };
    return {
      x: (dx / displaySize.w) * naturalSize.w,
      y: (dy / displaySize.h) * naturalSize.h,
    };
  }

  function naturalToDisplay(p: Point): Point {
    if (!naturalSize || !displaySize) return p;
    return {
      x: (p.x / naturalSize.w) * displaySize.w,
      y: (p.y / naturalSize.h) * displaySize.h,
    };
  }

  function getDisplayCoords(
    e: React.PointerEvent | PointerEvent,
    opts: { clamp?: boolean } = {},
  ): { x: number; y: number } | null {
    const img = imgRef.current;
    if (!img) return null;
    const rect = img.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    if (opts.clamp) {
      return {
        x: Math.max(0, Math.min(rect.width, x)),
        y: Math.max(0, Math.min(rect.height, y)),
      };
    }
    if (x < 0 || y < 0 || x > rect.width || y > rect.height) return null;
    return { x, y };
  }

  // ── Place / drag points ───────────────────────────────────────────────
  function handleImagePointerDown(e: React.PointerEvent) {
    if (draggingKey) return;
    if (!nextPointKey) return;
    const c = getDisplayCoords(e);
    if (!c) return;
    const natural = displayToNatural(c.x, c.y);
    setPoints(prev => ({ ...prev, [nextPointKey]: natural }));
  }

  function handleHandlePointerDown(e: React.PointerEvent, key: PointKey) {
    e.stopPropagation();
    (e.target as Element).setPointerCapture?.(e.pointerId);
    setDraggingKey(key);
  }

  function handleHandlePointerMove(e: React.PointerEvent) {
    if (!draggingKey) return;
    const c = getDisplayCoords(e, { clamp: true });
    if (!c) return;
    const natural = displayToNatural(c.x, c.y);
    setPoints(prev => ({ ...prev, [draggingKey]: natural }));
  }

  function handleHandlePointerUp(e: React.PointerEvent) {
    if (!draggingKey) return;
    (e.target as Element).releasePointerCapture?.(e.pointerId);
    setDraggingKey(null);
  }

  function resetPoint(key: PointKey) {
    setPoints(prev => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }

  function resetAll() {
    setPoints({});
  }

  // ── Image sizing ──────────────────────────────────────────────────────
  function handleImgLoad() {
    const img = imgRef.current;
    if (!img) return;
    setNaturalSize({ w: img.naturalWidth, h: img.naturalHeight });
    setDisplaySize({ w: img.clientWidth, h: img.clientHeight });
  }

  useEffect(() => {
    const img = imgRef.current;
    if (!img) return;
    const obs = new ResizeObserver(() => {
      setDisplaySize({ w: img.clientWidth, h: img.clientHeight });
    });
    obs.observe(img);
    return () => obs.disconnect();
  }, []);

  // ── Save ──────────────────────────────────────────────────────────────
  async function handleSave() {
    if (!allPoints || !measurements) return;
    setIsSaving(true);
    try {
      await onSave(allPoints, measurements);
    } finally {
      setIsSaving(false);
    }
  }

  // ── Rendering ─────────────────────────────────────────────────────────
  const dispToe   = points.toe        ? naturalToDisplay(points.toe)        : null;
  const dispHeel  = points.heel       ? naturalToDisplay(points.heel)       : null;
  const dispLeft  = points.widthLeft  ? naturalToDisplay(points.widthLeft)  : null;
  const dispRight = points.widthRight ? naturalToDisplay(points.widthRight) : null;

  return (
    <div className="fixed inset-0 z-50 bg-black/95 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
        <div>
          <h2 className="text-white font-bold">Sohle vermessen</h2>
          <p className="text-xs text-zinc-500">{horseName} · Huf {hoofId}</p>
        </div>
        <button onClick={onClose}
          className="p-2 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
          aria-label="Schließen">
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Photo + overlay */}
        <div className="flex-1 flex items-center justify-center p-4 overflow-hidden">
          <div className="relative max-w-full max-h-full">
            <img
              ref={imgRef}
              src={dataUrl}
              alt={`Sohle ${hoofId}`}
              onLoad={handleImgLoad}
              className="block max-w-full max-h-[70vh] select-none touch-none"
              draggable={false}
            />
            {displaySize && (
              <svg
                className="absolute top-0 left-0"
                style={{ width: displaySize.w, height: displaySize.h, cursor: nextPointKey ? "crosshair" : "default" }}
                onPointerDown={handleImagePointerDown}
                onPointerMove={handleHandlePointerMove}
                onPointerUp={handleHandlePointerUp}
              >
                {dispToe && dispHeel && (
                  <line x1={dispToe.x} y1={dispToe.y} x2={dispHeel.x} y2={dispHeel.y}
                    stroke="#f97316" strokeWidth={2} strokeDasharray="6 4" />
                )}
                {dispLeft && dispRight && (
                  <line x1={dispLeft.x} y1={dispLeft.y} x2={dispRight.x} y2={dispRight.y}
                    stroke="#22d3ee" strokeWidth={2} strokeDasharray="6 4" />
                )}
                {POINT_ORDER.map(({ key, color }) => {
                  const p = points[key];
                  if (!p) return null;
                  const d = naturalToDisplay(p);
                  return (
                    <g key={key}>
                      <circle cx={d.x} cy={d.y} r={14} fill="rgba(0,0,0,0.4)" />
                      <circle
                        cx={d.x} cy={d.y} r={9}
                        fill={color}
                        stroke="white"
                        strokeWidth={2}
                      />
                      <circle
                        cx={d.x} cy={d.y} r={22}
                        fill="transparent"
                        style={{ cursor: "grab", touchAction: "none" }}
                        onPointerDown={(e) => handleHandlePointerDown(e, key)}
                      />
                    </g>
                  );
                })}
              </svg>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="lg:w-80 border-t lg:border-t-0 lg:border-l border-zinc-800 bg-zinc-950 p-4 space-y-4 overflow-y-auto">
          {/* Hint */}
          <div className="text-sm text-zinc-400">
            {nextPointKey
              ? <>Tippe ins Bild, um <span className="text-white font-bold">{POINT_ORDER.find(p => p.key === nextPointKey)?.label}</span> zu setzen.</>
              : "Alle Punkte gesetzt. Du kannst sie weiterhin verschieben."}
          </div>

          {/* Point list */}
          <div className="space-y-2">
            {POINT_ORDER.map(({ key, label, color }) => {
              const isSet = !!points[key];
              const isNext = key === nextPointKey;
              return (
                <div key={key}
                  className={`flex items-center justify-between rounded-lg border px-3 py-2 ${
                    isNext ? "border-orange-500/70 bg-orange-500/10" :
                    isSet ? "border-zinc-700 bg-zinc-900" : "border-zinc-800 bg-zinc-900/50"
                  }`}>
                  <div className="flex items-center gap-2">
                    <span className="inline-block h-3 w-3 rounded-full" style={{ background: color }} />
                    <span className="text-sm text-zinc-200">{label}</span>
                  </div>
                  {isSet ? (
                    <button onClick={() => resetPoint(key)}
                      className="text-xs text-zinc-500 hover:text-red-400">
                      entfernen
                    </button>
                  ) : (
                    <span className="text-xs text-zinc-600">offen</span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Measurements */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-3 space-y-1.5">
            <h3 className="text-xs font-bold uppercase tracking-wide text-zinc-500">Ergebnis</h3>
            {measurements ? (
              <div className="space-y-1 text-sm">
                <Row label="Länge" value={`${measurements.lengthPx.toFixed(0)} px`} />
                <Row label="Breite" value={`${measurements.widthPx.toFixed(0)} px`} />
                <Row label="Verhältnis" value={measurements.ratio.toFixed(2)} />
                <Row label="Formtyp" value={SHAPE_LABELS[measurements.shape]} />
              </div>
            ) : (
              <p className="text-xs text-zinc-500">Setze alle vier Punkte für eine Messung.</p>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <button onClick={resetAll}
              disabled={Object.keys(points).length === 0}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-zinc-700 text-zinc-300 hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-sm">
              <RotateCcw className="h-4 w-4" /> Reset
            </button>
            <button onClick={handleSave}
              disabled={!measurements || isSaving}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-orange-500 hover:bg-orange-400 disabled:bg-zinc-700 disabled:text-zinc-500 disabled:cursor-not-allowed text-white font-bold transition-colors text-sm">
              <Save className="h-4 w-4" /> {isSaving ? "Speichere…" : "Speichern"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-zinc-500">{label}</span>
      <span className="text-white font-bold tabular-nums">{value}</span>
    </div>
  );
}
