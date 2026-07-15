// ── Question Categories ────────────────────────────────────────
export type QuestionCategory =
  | "radar"
  | "thermometer"
  | "measuring"
  | "matching"
  | "photo"
  | "tentacles";

// ── Question Definitions ───────────────────────────────────────
export interface RadarQuestionDef {
  type: "radar";
  distance: number; // miles
  label: string; // e.g. "¼ Mile"
}

export interface ThermometerQuestionDef {
  type: "thermometer";
  distance: number; // miles
  label: string;
  gameSize: "small" | "medium" | "large";
}

export interface MeasuringQuestionDef {
  type: "measuring";
  category: string; // e.g. "Transit-Related"
  noun: string; // e.g. "Commercial Airport"
  description?: string;
}

export type QuestionDef = RadarQuestionDef | ThermometerQuestionDef | MeasuringQuestionDef;

// ── Asked Questions (history entries) ──────────────────────────
export interface AskedRadarQuestion {
  id: string;
  type: "radar";
  distance: number;
  label: string;
  center: [number, number]; // [lat, lng] of user location when asked
  answer: "yes" | "no";
  timestamp: number;
}

export interface AskedThermometerQuestion {
  id: string;
  type: "thermometer";
  distance: number;
  label: string;
  start: [number, number]; // [lat, lng]
  end: [number, number]; // [lat, lng]
  answer: "hotter" | "colder";
  timestamp: number;
}

export type AskedQuestion = AskedRadarQuestion | AskedThermometerQuestion;

// ── Exclusion Zones ────────────────────────────────────────────
export interface ExclusionZone {
  polygon: GeoJSON.Feature<GeoJSON.Polygon>;
  sourceQuestion: AskedQuestion;
}

// ── Registered Station ─────────────────────────────────────────
export interface RegisteredStation {
  id: string;
  name: string;
  latlng: L.LatLng;
  circle: L.Circle;
  marker: L.CircleMarker;
  layerGroup: L.FeatureGroup;
  removed: boolean;
  grayed: boolean;
}
