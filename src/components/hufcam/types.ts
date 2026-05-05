export type PerspectiveId = "dorsal" | "lateral" | "medial" | "solar" | "palmar";

export interface PhotoData {
  dataUrl: string;
  perspective: PerspectiveId;
  timestamp: number;
}

export interface HoofData {
  photos: Map<PerspectiveId, PhotoData>;
  collageUrl?: string;
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
  { id: "dorsal", label: "Vorn", guideType: "t-guide", hint: "Bodenlinie bündig mit Boden! Senkrechte mittig durch den Huf.", requiresLevel: true },
  { id: "lateral", label: "Seite", guideType: "l-guide", hint: "Handy flach auf den Boden legen! Objektiv auf Hufhöhe.", requiresLevel: true },
  { id: "solar", label: "Sohle", guideType: "target-guide", hint: "Strahlspitze genau ins Fadenkreuz.", requiresLevel: false },
  { id: "palmar", label: "Hinten", guideType: "t-guide", hint: "Bodenlinie bündig mit Boden! Senkrechte mittig durch den Huf.", requiresLevel: true },
  { id: "medial", label: "Innen", guideType: "l-guide", hint: "Objektiv auf Hufhöhe von innen.", requiresLevel: true },
];
