import type { AskedQuestion } from "./types";

// ── Coordinate precision ───────────────────────────────────────
// 6 decimal places ≈ 0.11 m at the equator — more than enough for
// placing game markers, while keeping the input fields tidy.
export const roundCoord = (v: number): number => Math.round(v * 1e6) / 1e6;

// ── Simple reactive store shared between React UI and sidebar logic ───
// This store is shared across both question types. Per-type fields
// (radarCenter, thermoStart, etc.) live here so the UI can subscribe
// to a single source of truth.

export interface QuestionsState {
  panelOpen: boolean;
  activeTab: "radar" | "thermometer" | "polygon";

  // Custom polygon
  polygonDrawing: boolean; // true while the user is actively placing vertices
  polygonDrawn: boolean; // true once the shape has been committed (double-click or finish button)

  // Radar
  radarCenter: [number, number] | null;
  radarLat: string; // lat input field (auto-populated from clicks)
  radarLng: string; // lng input field (auto-populated from clicks)
  radarDistance: number; // selected distance from dropdown
  radarCustomDistance: number; // custom input value
  radarUseCustom: boolean;

  // Thermometer
  thermoStart: [number, number] | null;
  thermoEnd: [number, number] | null;
  thermoStartLat: string; // lat input field (auto-populated from clicks)
  thermoStartLng: string; // lng input field (auto-populated from clicks)
  thermoEndLat: string; // lat input field (auto-populated from clicks)
  thermoEndLng: string; // lng input field (auto-populated from clicks)
  thermoDistance: number;

  // History
  history: AskedQuestion[];

  // Station exclusion status (alphabetical), for the sidebar list
  stations: { id: string; name: string; excluded: boolean }[];

  // Settings
  showRemoved: boolean;
}

const initialState: QuestionsState = {
  panelOpen: false,
  activeTab: "radar",
  polygonDrawing: false,
  polygonDrawn: false,

  radarCenter: null,
  radarLat: "",
  radarLng: "",
  radarDistance: 5,
  radarCustomDistance: 0,
  radarUseCustom: false,

  thermoStart: null,
  thermoEnd: null,
  thermoStartLat: "",
  thermoStartLng: "",
  thermoEndLat: "",
  thermoEndLng: "",
  thermoDistance: 0.5,

  history: [],
  stations: [],
  showRemoved: false,
};

type Listener = () => void;

const state: QuestionsState = { ...initialState };
const listeners = new Set<Listener>();

export const questionsStore = {
  get(): QuestionsState {
    return state;
  },

  update(partial: Partial<QuestionsState>): void {
    Object.assign(state, partial);
    for (const fn of listeners) fn();
  },

  subscribe(fn: Listener): () => void {
    listeners.add(fn);
    return () => {
      listeners.delete(fn);
    };
  },
};

export type QuestionsStoreType = typeof questionsStore;

// ── Callback registry ──────────────────────────────────────────
// sidebar.ts sets these; React components call them.

export interface QuestionsCallbacks {
  submitRadar: (answer: "yes" | "no") => void;
  submitThermo: (answer: "hotter" | "colder") => void;
  submitPolygon: (answer: "yes" | "no") => void;
  finishPolygonDrawing: () => void;
  switchTab: (tab: "radar" | "thermometer" | "polygon") => void;
  clearRadarMarker: () => void;
  clearThermoMarkers: () => void;
  clearPolygon: () => void;
  startRadarPicking: () => void;
  startThermoPicking: () => void;
  startPolygonPicking: () => void;
  setRadarCenter: (lat: number, lng: number) => void;
  setThermoStart: (lat: number, lng: number) => void;
  setThermoEnd: (lat: number, lng: number) => void;
  setShowRemoved: (v: boolean) => void;
}

export const questionsCallbacks: QuestionsCallbacks = {
  submitRadar: () => {},
  submitThermo: () => {},
  submitPolygon: () => {},
  finishPolygonDrawing: () => {},
  switchTab: () => {},
  clearRadarMarker: () => {},
  clearThermoMarkers: () => {},
  clearPolygon: () => {},
  startRadarPicking: () => {},
  startThermoPicking: () => {},
  startPolygonPicking: () => {},
  setRadarCenter: () => {},
  setThermoStart: () => {},
  setThermoEnd: () => {},
  setShowRemoved: () => {},
};
