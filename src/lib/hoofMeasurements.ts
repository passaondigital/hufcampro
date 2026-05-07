import type {
  Point,
  HoofShape,
  SolarMeasurementInput,
  SolarMeasurements,
  MmMeasurements,
} from "@/components/hufcam/types";

// Schwellen rein geometrisch (Verhältnis Breite/Länge), neutral klassifiziert.
export const HOOF_SHAPE_THRESHOLDS = {
  roundMin: 0.95,
  ovalMin: 0.8,
} as const;

export function calculateDistance(a: Point, b: Point): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

export function classifyHoofShape(ratio: number): HoofShape {
  if (ratio >= HOOF_SHAPE_THRESHOLDS.roundMin) return "round";
  if (ratio >= HOOF_SHAPE_THRESHOLDS.ovalMin) return "oval";
  return "slim";
}

export function calculateSolarMeasurements(
  input: SolarMeasurementInput,
): SolarMeasurements {
  const lengthPx = calculateDistance(input.toe, input.heel);
  const widthPx = calculateDistance(input.widthLeft, input.widthRight);
  const ratio = lengthPx > 0 ? widthPx / lengthPx : 0;
  return {
    lengthPx,
    widthPx,
    ratio,
    shape: classifyHoofShape(ratio),
  };
}

export function computeMmPerPixel(
  referenceLengthMm: number,
  detectedPixelLength: number,
): number {
  if (detectedPixelLength <= 0) return 0;
  return referenceLengthMm / detectedPixelLength;
}

export function toMmMeasurements(
  px: SolarMeasurements,
  mmPerPixel: number,
): MmMeasurements {
  return {
    lengthMm: px.lengthPx * mmPerPixel,
    widthMm: px.widthPx * mmPerPixel,
  };
}
