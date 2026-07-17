// ── Settings store ─────────────────────────────────────────────
// Reactive store for the settings panel, shared between the
// React SettingsPanel component and settings.ts logic.

import { createStoreHook } from "../store-hook";

export interface SettingsState {
  panelOpen: boolean;
  trains: boolean;
  subway: boolean;
  border: boolean;
  location: boolean;
  darkMode: boolean;
  stationLabels: boolean;
  borderEditable: boolean;
}

const initialState: SettingsState = {
  panelOpen: false,
  trains: true,
  subway: true,
  border: true,
  location: true,
  darkMode: false,
  stationLabels: false,
  borderEditable: false,
};

type Listener = () => void;

const state: SettingsState = { ...initialState };
const listeners = new Set<Listener>();

export const settingsStore = {
  get(): SettingsState {
    return state;
  },

  update(partial: Partial<SettingsState>): void {
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

// ── Callbacks ──────────────────────────────────────────────────
// Set by settings.ts; called by the React component on user actions.

export interface SettingsCallbacks {
  toggleLayer: (
    id: "chk-trains" | "chk-subway" | "chk-border" | "chk-location",
    checked: boolean,
  ) => void;
  toggleDarkMode: (checked: boolean) => void;
  toggleStationLabels: (checked: boolean) => void;
  toggleBorderEditable: (checked: boolean) => void;
  exportBorder: () => void;
  exportStateLink: () => void;
}

export const settingsCallbacks: SettingsCallbacks = {
  toggleLayer: () => {},
  toggleDarkMode: () => {},
  toggleStationLabels: () => {},
  toggleBorderEditable: () => {},
  exportBorder: () => {},
  exportStateLink: () => {},
};

export const useSettingsStore = createStoreHook(settingsStore);
