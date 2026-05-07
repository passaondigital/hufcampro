export type PerspectiveId = "dorsal" | "lateral" | "medial" | "solar" | "palmar";

export type TiltZone = "good" | "warn" | "block";

export interface OrientationSnapshot {
  alpha: number | null;
  beta: number | null;
  gamma: number | null;
  tiltAngle: number;
  tiltZone: TiltZone;
}

export interface PhotoData {
  dataUrl: string;
  perspective: PerspectiveId;
  timestamp: number;
  orientationData?: OrientationSnapshot;
  measurementPoints?: SolarMeasurementInput;
  pixelMeasurements?: SolarMeasurements;
  referenceScale?: ReferenceScale;
  mmMeasurements?: MmMeasurements;
}

export interface HoofData {
  photos: Map<PerspectiveId, PhotoData>;
  collageUrl?: string;
}

// ── Mess-Datenmodell (neutral, rein geometrisch) ────────────────────
export interface Point {
  x: number;
  y: number;
}

export type HoofShape = "round" | "oval" | "slim";

export interface SolarMeasurementInput {
  toe: Point;
  widthLeft: Point;
  widthRight: Point;
  heel: Point;
}

export interface SolarMeasurements {
  lengthPx: number;
  widthPx: number;
  ratio: number;
  shape: HoofShape;
}

export interface ReferenceScale {
  referenceObjectType: string;
  referenceLengthMm: number;
  detectedPixelLength: number;
  mmPerPixel: number;
}

export interface MmMeasurements {
  lengthMm: number;
  widthMm: number;
}

export type HoofView = PerspectiveId | "other";

export interface HoofViewConfig {
  id: HoofView;
  label: string;
  guideType: "t-guide" | "l-guide" | "target-guide" | "none";
  hint: string;
  requiresLevel: boolean;
}

export const HOOF_VIEW_CONFIGS: HoofViewConfig[] = [
  { id: "dorsal",  label: "Vorn",   guideType: "t-guide",      hint: "Bodenlinie bündig mit Boden! Senkrechte mittig durch den Huf.", requiresLevel: true  },
  { id: "lateral", label: "Seite",  guideType: "l-guide",      hint: "Handy flach auf den Boden legen! Objektiv auf Hufhöhe.",        requiresLevel: true  },
  { id: "solar",   label: "Sohle",  guideType: "target-guide", hint: "Strahlspitze genau ins Fadenkreuz.",                            requiresLevel: false },
  { id: "palmar",  label: "Hinten", guideType: "t-guide",      hint: "Bodenlinie bündig mit Boden! Senkrechte mittig durch den Huf.", requiresLevel: true  },
  { id: "medial",  label: "Innen",  guideType: "l-guide",      hint: "Objektiv auf Hufhöhe von innen.",                              requiresLevel: true  },
];
