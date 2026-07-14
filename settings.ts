import L from "leaflet";

interface SettingsConfig {
  map: L.Map;
  trainLayer: L.LayerGroup | null;
  subwayLayer: L.LayerGroup | null;
  borderLayer: L.Layer | null;
  userLocationLayer: L.Layer | null;
}

const config: SettingsConfig = {
  map: null as unknown as L.Map,
  trainLayer: null,
  subwayLayer: null,
  borderLayer: null,
  userLocationLayer: null,
};

// ── Inject styles ──────────────────────────────────────────────
const style = document.createElement("style");
style.textContent = `
  .settings-toggle {
    position: absolute;
    top: 10px;
    right: 10px;
    z-index: 1000;
    background: white;
    border: none;
    border-radius: 4px;
    padding: 8px 12px;
    font-size: 18px;
    cursor: pointer;
    box-shadow: 0 2px 6px rgba(0,0,0,0.3);
    line-height: 1;
    transition: right 0.3s ease;
  }
  .settings-toggle.open {
    right: 270px;
  }

  .settings-panel {
    position: absolute;
    top: 0;
    right: -260px;
    width: 250px;
    height: 100%;
    z-index: 999;
    background: white;
    box-shadow: -2px 0 8px rgba(0,0,0,0.2);
    transition: right 0.3s ease;
    padding: 50px 16px 16px;
    overflow-y: auto;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  }
  .settings-panel.open {
    right: 0;
  }

  .settings-panel h2 {
    font-size: 16px;
    font-weight: 600;
    margin-bottom: 16px;
    color: #333;
  }

  .settings-group {
    margin-bottom: 12px;
  }
  .settings-group label {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 14px;
    color: #444;
    cursor: pointer;
    padding: 6px 0;
  }
  .settings-group label:hover {
    color: #000;
  }
  .settings-group input[type="checkbox"] {
    width: 16px;
    height: 16px;
    cursor: pointer;
  }
`;
document.head.append(style);

const STORAGE_KEY = "jetlag-map-settings";

type SettingsState = Record<string, boolean>;

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
};
const toggleBtn = document.createElement("button");
toggleBtn.className = "settings-toggle";
toggleBtn.setAttribute("aria-label", "Toggle settings panel");
toggleBtn.textContent = "⚙";

const stored = loadSettings();
const merged = { ...defaultState, ...stored };

const panel = document.createElement("div");
panel.className = "settings-panel";
panel.innerHTML = `
  <h2>Map Settings</h2>
  <div class="settings-group">
    <label><input type="checkbox" id="chk-trains" ${merged["chk-trains"] ? "checked" : ""} /> Train Lines</label>
    <label><input type="checkbox" id="chk-subway" ${merged["chk-subway"] ? "checked" : ""} /> Subway</label>
    <label><input type="checkbox" id="chk-border" ${merged["chk-border"] ? "checked" : ""} /> Border Mask</label>
    <label><input type="checkbox" id="chk-location" ${merged["chk-location"] ? "checked" : ""} /> My Location</label>
  </div>
`;

document.body.append(toggleBtn);
document.body.append(panel);

// ── Toggle behaviour ───────────────────────────────────────────
toggleBtn.addEventListener("click", () => {
  panel.classList.toggle("open");
  toggleBtn.classList.toggle("open");
});

// ── Checkbox handlers ──────────────────────────────────────────
function setupCheckbox(id: string, layer: L.Layer | L.LayerGroup | null): void {
  const cb = document.querySelector(`#${id}`) as HTMLInputElement;
  if (!cb || !layer) return;
  cb.addEventListener("change", () => {
    const state = loadSettings();
    state[id] = cb.checked;
    saveSettings(state);

    if (cb.checked) {
      config.map.addLayer(layer);
    } else {
      config.map.removeLayer(layer);
    }
  });
}

export function initSettings(settings: {
  map: L.Map;
  trainLayer?: L.LayerGroup | null;
  subwayLayer?: L.LayerGroup | null;
  borderLayer?: L.Layer | null;
  userLocationLayer?: L.Layer | null;
}): void {
  config.map = settings.map;
  config.trainLayer = settings.trainLayer ?? null;
  config.subwayLayer = settings.subwayLayer ?? null;
  config.borderLayer = settings.borderLayer ?? null;
  config.userLocationLayer = settings.userLocationLayer ?? null;

  setupCheckbox("chk-trains", config.trainLayer);
  setupCheckbox("chk-subway", config.subwayLayer);
  setupCheckbox("chk-border", config.borderLayer);
  setupCheckbox("chk-location", config.userLocationLayer);

  // Apply saved state — remove layers whose checkboxes are unchecked
  const state = loadSettings();
  const map = config.map;
  const layerMap: Record<string, L.Layer | L.LayerGroup | null> = {
    "chk-trains": config.trainLayer,
    "chk-subway": config.subwayLayer,
    "chk-border": config.borderLayer,
    "chk-location": config.userLocationLayer,
  };
  for (const [id, layer] of Object.entries(layerMap)) {
    if (layer && state[id] === false) {
      map.removeLayer(layer);
    }
  }
}
