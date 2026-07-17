import type L from "leaflet";
import { exportBorderGeoJSON, setBorderEditable } from "../layers/border";
import { stationRegistry } from "../questions";
import { buildShareUrl } from "./link";
import { settingsCallbacks, settingsStore } from "./store";

interface SettingsConfig {
  map: L.Map;
  trainLayer: L.LayerGroup | null;
  subwayLayer: L.LayerGroup | null;
  borderLayer: L.Layer | null;
  userLocationLayer: L.Layer | null;
  tileLayer: L.TileLayer | null;
}

const config: SettingsConfig = {
  map: null as unknown as L.Map,
  trainLayer: null,
  subwayLayer: null,
  borderLayer: null,
  userLocationLayer: null,
  tileLayer: null,
};

const STORAGE_KEY = "jetlag-map-settings";

type SettingsState = Record<string, boolean>;

const LIGHT_TILES = "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png";
const DARK_TILES = "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png";

const loadSettings = (): SettingsState => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // Ignore corrupt data
  }
  return {};
};

const saveSettings = (state: SettingsState): void => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
};

const defaultState: SettingsState = {
  "chk-trains": true,
  "chk-subway": true,
  "chk-border": true,
  "chk-location": true,
  "chk-dark": false,
  "chk-labels": false,
};

// ── Layer toggle handler ───────────────────────────────────────
const toggleLayer = (
  id: "chk-trains" | "chk-subway" | "chk-border" | "chk-location",
  checked: boolean,
): void => {
  const state = loadSettings();
  state[id] = checked;
  saveSettings(state);

  const layerMap: Record<string, L.Layer | L.LayerGroup | null> = {
    "chk-trains": config.trainLayer,
    "chk-subway": config.subwayLayer,
    "chk-border": config.borderLayer,
    "chk-location": config.userLocationLayer,
  };

  const layer = layerMap[id];
  if (!layer) return;

  if (checked) {
    config.map.addLayer(layer);
  } else {
    config.map.removeLayer(layer);
  }

  // Hub stations (e.g. Union, Kennedy) are merged across the train and subway
  // layers and added directly to the map, so they aren't children of either
  // layer group. Hide a hub station when either of its source layers is off.
  if (id === "chk-trains" || id === "chk-subway") {
    const otherLayerOn =
      id === "chk-trains"
        ? loadSettings()["chk-subway"] !== false
        : loadSettings()["chk-trains"] !== false;
    if (!checked || !otherLayerOn) {
      stationRegistry.setHubStationsVisible(false);
    } else {
      stationRegistry.setHubStationsVisible(true);
    }
  }

  // Keep the reactive store in sync so the checkbox reflects the new state
  const storeKeyMap = {
    "chk-trains": "trains",
    "chk-subway": "subway",
    "chk-border": "border",
    "chk-location": "location",
  } as const;
  const storeKey = storeKeyMap[id];
  if (storeKey) {
    settingsStore.update({ [storeKey]: checked });
  }
};

// ── Dark mode toggle handler ───────────────────────────────────
const toggleDarkMode = (checked: boolean): void => {
  const state = loadSettings();
  state["chk-dark"] = checked;
  saveSettings(state);

  if (config.tileLayer) {
    config.tileLayer.setUrl(checked ? DARK_TILES : LIGHT_TILES);
  }

  // Toggle a class on the map container so CSS can restyle map UI
  // (station labels, zoom buttons) for dark mode.
  config.map.getContainer().classList.toggle("dark-mode", checked);

  settingsStore.update({ darkMode: checked });
};

// ── Station labels toggle handler ─────────────────────────────
const toggleStationLabels = (checked: boolean): void => {
  const state = loadSettings();
  state["chk-labels"] = checked;
  saveSettings(state);

  stationRegistry.setLabelsVisible(checked);

  settingsStore.update({ stationLabels: checked });
};

// ── Border editable toggle handler ────────────────────────────
const toggleBorderEditable = (checked: boolean): void => {
  setBorderEditable(checked);
  settingsStore.update({ borderEditable: checked });
};

// ── Border export handler ─────────────────────────────────────
const exportBorder = (): void => {
  exportBorderGeoJSON();
};

// ── State link export handler ─────────────────────────────────
// Build a shareable URL carrying the full game state and copy it to the
// clipboard so the user can paste it anywhere.
const exportStateLink = (): void => {
  const url = buildShareUrl();
  if (navigator.clipboard?.writeText) {
    void navigator.clipboard.writeText(url);
  }
};

// ── Init ───────────────────────────────────────────────────────
export const initSettings = (settings: {
  map: L.Map;
  trainLayer?: L.LayerGroup | null;
  subwayLayer?: L.LayerGroup | null;
  borderLayer?: L.Layer | null;
  userLocationLayer?: L.Layer | null;
  tileLayer?: L.TileLayer | null;
}): void => {
  settingsCallbacks.toggleBorderEditable = toggleBorderEditable;
  settingsCallbacks.exportBorder = exportBorder;
  settingsCallbacks.exportStateLink = exportStateLink;
  config.map = settings.map;
  config.trainLayer = settings.trainLayer ?? null;
  config.subwayLayer = settings.subwayLayer ?? null;
  config.borderLayer = settings.borderLayer ?? null;
  config.userLocationLayer = settings.userLocationLayer ?? null;
  config.tileLayer = settings.tileLayer ?? null;

  // Wire the callbacks so the React panel can trigger actions
  settingsCallbacks.toggleLayer = toggleLayer;
  settingsCallbacks.toggleDarkMode = toggleDarkMode;
  settingsCallbacks.toggleStationLabels = toggleStationLabels;

  // Load saved state into the store
  const stored = loadSettings();
  const merged = { ...defaultState, ...stored };
  settingsStore.update({
    trains: merged["chk-trains"],
    subway: merged["chk-subway"],
    border: merged["chk-border"],
    location: merged["chk-location"],
    darkMode: merged["chk-dark"],
    stationLabels: merged["chk-labels"],
  });

  // Apply saved state — remove layers whose checkboxes are unchecked
  const layerMap: Record<string, L.Layer | L.LayerGroup | null> = {
    "chk-trains": config.trainLayer,
    "chk-subway": config.subwayLayer,
    "chk-border": config.borderLayer,
    "chk-location": config.userLocationLayer,
  };
  for (const [id, layer] of Object.entries(layerMap)) {
    if (layer && merged[id] === false) {
      config.map.removeLayer(layer);
    }
  }

  // Apply saved dark mode to the tile layer
  if (config.tileLayer && merged["chk-dark"] === true) {
    config.tileLayer.setUrl(DARK_TILES);
  }

  // Apply saved dark-mode class to the map container
  config.map.getContainer().classList.toggle("dark-mode", merged["chk-dark"] === true);

  // Apply saved label visibility
  stationRegistry.setLabelsVisible(merged["chk-labels"] !== false);
};
