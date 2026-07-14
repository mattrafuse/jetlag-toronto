import L from "leaflet";
import { settingsCallbacks, settingsStore } from "./settings-store";

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

function loadSettings(): SettingsState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // Ignore corrupt data
  }
  return {};
}

function saveSettings(state: SettingsState): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

const defaultState: SettingsState = {
  "chk-trains": true,
  "chk-subway": true,
  "chk-border": true,
  "chk-location": true,
  "chk-dark": false,
};

// ── Layer toggle handler ───────────────────────────────────────
function toggleLayer(
  id: "chk-trains" | "chk-subway" | "chk-border" | "chk-location",
  checked: boolean,
): void {
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
}

// ── Dark mode toggle handler ───────────────────────────────────
function toggleDarkMode(checked: boolean): void {
  const state = loadSettings();
  state["chk-dark"] = checked;
  saveSettings(state);

  if (config.tileLayer) {
    config.tileLayer.setUrl(checked ? DARK_TILES : LIGHT_TILES);
  }

  settingsStore.update({ darkMode: checked });
}

// ── Init ───────────────────────────────────────────────────────
export function initSettings(settings: {
  map: L.Map;
  trainLayer?: L.LayerGroup | null;
  subwayLayer?: L.LayerGroup | null;
  borderLayer?: L.Layer | null;
  userLocationLayer?: L.Layer | null;
  tileLayer?: L.TileLayer | null;
}): void {
  config.map = settings.map;
  config.trainLayer = settings.trainLayer ?? null;
  config.subwayLayer = settings.subwayLayer ?? null;
  config.borderLayer = settings.borderLayer ?? null;
  config.userLocationLayer = settings.userLocationLayer ?? null;
  config.tileLayer = settings.tileLayer ?? null;

  // Wire the callbacks so the React panel can trigger actions
  settingsCallbacks.toggleLayer = toggleLayer;
  settingsCallbacks.toggleDarkMode = toggleDarkMode;

  // Load saved state into the store
  const stored = loadSettings();
  const merged = { ...defaultState, ...stored };
  settingsStore.update({
    trains: merged["chk-trains"],
    subway: merged["chk-subway"],
    border: merged["chk-border"],
    location: merged["chk-location"],
    darkMode: merged["chk-dark"],
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
}
