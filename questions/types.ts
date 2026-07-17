// ── Shared Question Types ──────────────────────────────────────
// Re-exports the per-type definition/asked interfaces so consumers can
// import everything from a single location, and defines the few truly
// shared types used across radar and thermometer modules.

export type { AskedPolygonQuestion } from "./polygon/types";
export type { AskedRadarQuestion, RadarQuestionDef } from "./radar/types";
export type { AskedThermometerQuestion, ThermometerQuestionDef } from "./thermometer/types";

// ── Question Categories ────────────────────────────────────────
export type QuestionCategory = "radar" | "thermometer" | "polygon";

// ── Discriminated union of all asked questions ─────────────────
import type { AskedPolygonQuestion } from "./polygon/types";
import type { AskedRadarQuestion } from "./radar/types";
import type { AskedThermometerQuestion } from "./thermometer/types";

export type AskedQuestion = AskedRadarQuestion | AskedThermometerQuestion | AskedPolygonQuestion;

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
