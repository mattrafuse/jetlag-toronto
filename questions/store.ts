import type { AskedQuestion } from "./types";

// ── Simple reactive store shared between React UI and sidebar logic ──

export interface QuestionsState {
  panelOpen: boolean;
  activeTab: "radar" | "thermometer";

  // Radar
  radarCenter: [number, number] | null;
  radarDistance: number; // selected distance from dropdown
  radarCustomDistance: number; // custom input value
  radarUseCustom: boolean;

  // Thermometer
  thermoStart: [number, number] | null;
  thermoEnd: [number, number] | null;
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

  radarCenter: null,
  radarDistance: 5,
  radarCustomDistance: 0,
  radarUseCustom: false,

  thermoStart: null,
  thermoEnd: null,
  thermoDistance: 0.5,

  history: [],
  stations: [],
  showRemoved: false,
};

type Listener = () => void;

const state: QuestionsState = { ...initialState };
const listeners = new Set<Listener>();

export const store = {
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

// ── Callback registry ──────────────────────────────────────────
// sidebar.ts sets these; React components call them.

export interface SidebarCallbacks {
  submitRadar: (answer: "yes" | "no") => void;
  submitThermo: (answer: "hotter" | "colder") => void;
  switchTab: (tab: "radar" | "thermometer") => void;
  clearRadarMarker: () => void;
  clearThermoMarkers: () => void;
  startRadarPicking: () => void;
  startThermoPicking: () => void;
  setShowRemoved: (v: boolean) => void;
}

export const callbacks: SidebarCallbacks = {
  submitRadar: () => {},
  submitThermo: () => {},
  switchTab: () => {},
  clearRadarMarker: () => {},
  clearThermoMarkers: () => {},
  startRadarPicking: () => {},
  startThermoPicking: () => {},
  setShowRemoved: () => {},
};
