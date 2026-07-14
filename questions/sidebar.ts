import L from "leaflet";
import { radarQuestions, thermometerQuestions } from "./data";
import {
  computeRadarExclusion,
  computeThermometerExclusion,
  unionExclusionZones,
} from "./exclusion";
import { stationRegistry } from "./station-registry";
import type {
  AskedQuestion,
  AskedRadarQuestion,
  AskedThermometerQuestion,
  ExclusionZone,
} from "./types";

// ── Types ──────────────────────────────────────────────────────
interface QuestionsConfig {
  map: L.Map;
}

// ── State ──────────────────────────────────────────────────────
let map: L.Map;
let exclusionZones: ExclusionZone[] = [];
let exclusionLayer: L.GeoJSON | null = null;
let showRemovedStations = false;

// Thermometer interaction state
let thermoStart: [number, number] | null = null;
let thermoEnd: [number, number] | null = null;
let thermoStartMarker: L.Marker | null = null;
let thermoEndMarker: L.Marker | null = null;
let mapClickHandler: ((e: L.LeafletMouseEvent) => void) | null = null;

// ── Persistence ────────────────────────────────────────────────
const STORAGE_KEY = "jetlag-questions";
const SETTINGS_KEY = "jetlag-question-settings";

function loadHistory(): AskedQuestion[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    /* ignore */
  }
  return [];
}

function saveHistory(history: AskedQuestion[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
}

function loadSettings(): { showRemoved: boolean } {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    /* ignore */
  }
  return { showRemoved: false };
}

function saveSettings(settings: { showRemoved: boolean }): void {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

// ── ID generation ──────────────────────────────────────────────
let questionCounter = 0;
function nextId(): string {
  return `q-${Date.now()}-${++questionCounter}`;
}

// ── Exclusion Zone Rendering ───────────────────────────────────
function updateExclusionLayer(): void {
  if (exclusionLayer) {
    map.removeLayer(exclusionLayer);
  }

  const cumulative = unionExclusionZones(exclusionZones.map((z) => z.polygon));
  if (!cumulative) return;

  exclusionLayer = L.geoJSON(cumulative, {
    style: {
      color: "#ff4444",
      weight: 2,
      fillColor: "#ff4444",
      fillOpacity: 0.15,
    },
  }).addTo(map);
}

// ── Station Filtering ──────────────────────────────────────────
function applyStationFilter(): void {
  const cumulative = unionExclusionZones(exclusionZones.map((z) => z.polygon));

  // Reset all stations first
  stationRegistry.resetAll();

  if (!cumulative) return;

  const excludedIds = stationRegistry.getStationIdsInExclusionZone(cumulative);

  for (const id of excludedIds) {
    if (showRemovedStations) {
      stationRegistry.grayOutStation(id);
    } else {
      stationRegistry.removeStation(id);
    }
  }
}

// ── Process a new question ─────────────────────────────────────
function processQuestion(question: AskedQuestion): void {
  let polygon: ReturnType<typeof computeRadarExclusion>;

  if (question.type === "radar") {
    polygon = computeRadarExclusion(question.center, question.distance, question.answer);
  } else {
    polygon = computeThermometerExclusion(question.start, question.end, question.answer);
  }

  exclusionZones.push({ polygon, sourceQuestion: question });
  updateExclusionLayer();
  applyStationFilter();
}

// ── Remove a question (undo) ───────────────────────────────────
function removeQuestion(id: string): void {
  exclusionZones = exclusionZones.filter((z) => z.sourceQuestion.id !== id);

  const history = loadHistory().filter((q) => q.id !== id);
  saveHistory(history);

  updateExclusionLayer();
  applyStationFilter();
  renderHistory();
}

// ── Clear thermometer markers ──────────────────────────────────
function clearThermoMarkers(): void {
  if (thermoStartMarker) {
    map.removeLayer(thermoStartMarker);
    thermoStartMarker = null;
  }
  if (thermoEndMarker) {
    map.removeLayer(thermoEndMarker);
    thermoEndMarker = null;
  }
  thermoStart = null;
  thermoEnd = null;
  if (mapClickHandler) {
    map.off("click", mapClickHandler);
    mapClickHandler = null;
  }
}

// ── DOM References (set during init) ───────────────────────────
let historyList: HTMLDivElement;
let radarForm: HTMLDivElement;
let thermoForm: HTMLDivElement;
let thermoStatus: HTMLDivElement;
let thermoAnswerBtns: HTMLDivElement;
let radarAnswerBtns: HTMLDivElement;
let radarDistSelect: HTMLSelectElement;
let radarCustomInput: HTMLInputElement;
let thermoDistSelect: HTMLSelectElement;
let showRemovedCb: HTMLInputElement;

// ── Render history list ────────────────────────────────────────
function renderHistory(): void {
  const history = loadHistory();
  if (!historyList) return;

  if (history.length === 0) {
    historyList.innerHTML = '<div class="questions-history-empty">No questions asked yet</div>';
    return;
  }

  historyList.innerHTML = history
    .slice()
    .reverse()
    .map((q) => {
      let desc = "";
      if (q.type === "radar") {
        desc = `Radar ${q.label}: <strong>${q.answer.toUpperCase()}</strong>`;
      } else {
        desc = `Thermometer ${q.label}: <strong>${q.answer.toUpperCase()}</strong>`;
      }
      return `
        <div class="questions-history-item">
          <span class="questions-history-desc">${desc}</span>
          <button class="questions-history-delete" data-id="${q.id}" title="Undo question">✕</button>
        </div>`;
    })
    .join("");

  // Wire up delete buttons
  historyList.querySelectorAll(".questions-history-delete").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const id = (e.currentTarget as HTMLElement).dataset.id;
      if (id) removeQuestion(id);
    });
  });
}

// ── Switch question type tab ───────────────────────────────────
function switchTab(tab: "radar" | "thermometer"): void {
  const radarTab = document.querySelector(".questions-tab-radar") as HTMLElement;
  const thermoTab = document.querySelector(".questions-tab-thermo") as HTMLElement;

  if (tab === "radar") {
    radarTab?.classList.add("active");
    thermoTab?.classList.remove("active");
    radarForm.style.display = "block";
    thermoForm.style.display = "none";
    clearThermoMarkers();
  } else {
    thermoTab?.classList.add("active");
    radarTab?.classList.remove("active");
    thermoForm.style.display = "block";
    radarForm.style.display = "none";
  }
}

// ── Submit radar question ──────────────────────────────────────
function submitRadar(answer: "yes" | "no"): void {
  const customVal = parseFloat(radarCustomInput.value);
  let distance: number;
  let label: string;

  if (radarDistSelect.value === "custom" && !isNaN(customVal) && customVal > 0) {
    distance = customVal;
    label = `${customVal} Mile${customVal === 1 ? "" : "s"}`;
  } else {
    const selected = radarQuestions.find((q) => q.distance === parseFloat(radarDistSelect.value));
    if (!selected) return;
    distance = selected.distance;
    label = selected.label;
  }

  // Get user's current location as center
  const center = map.getCenter();
  const question: AskedRadarQuestion = {
    id: nextId(),
    type: "radar",
    distance,
    label,
    center: [center.lat, center.lng],
    answer,
    timestamp: Date.now(),
  };

  const history = loadHistory();
  history.push(question);
  saveHistory(history);

  processQuestion(question);
  renderHistory();
}

// ── Submit thermometer question ────────────────────────────────
function submitThermometer(answer: "hotter" | "colder"): void {
  if (!thermoStart || !thermoEnd) return;

  const selected = thermometerQuestions.find(
    (q) => q.distance === parseFloat(thermoDistSelect.value),
  );
  if (!selected) return;

  const question: AskedThermometerQuestion = {
    id: nextId(),
    type: "thermometer",
    distance: selected.distance,
    label: selected.label,
    start: thermoStart,
    end: thermoEnd,
    answer,
    timestamp: Date.now(),
  };

  const history = loadHistory();
  history.push(question);
  saveHistory(history);

  processQuestion(question);
  renderHistory();
  clearThermoMarkers();
  updateThermoUI();
}

// ── Update thermometer UI state ────────────────────────────────
function updateThermoUI(): void {
  if (!thermoStatus || !thermoAnswerBtns) return;

  if (!thermoStart) {
    thermoStatus.innerHTML =
      '<span class="questions-thermo-step">Click the map to set your <strong>start</strong> location</span>';
    thermoAnswerBtns.style.display = "none";
  } else if (thermoEnd) {
    thermoStatus.innerHTML =
      '<span class="questions-thermo-step">Both locations set. Choose answer:</span>';
    thermoAnswerBtns.style.display = "flex";
  } else {
    thermoStatus.innerHTML =
      '<span class="questions-thermo-step">Click the map to set your <strong>end</strong> location</span>';
    thermoAnswerBtns.style.display = "none";
  }
}

// ── Start thermometer location picking ─────────────────────────
function startThermoPicking(): void {
  clearThermoMarkers();

  mapClickHandler = (e: L.LeafletMouseEvent) => {
    if (!thermoStart) {
      thermoStart = [e.latlng.lat, e.latlng.lng];
      thermoStartMarker = L.marker(e.latlng, {
        icon: L.divIcon({
          className: "questions-thermo-marker",
          html: '<div class="questions-thermo-marker-dot start">S</div>',
          iconSize: [24, 24],
          iconAnchor: [12, 12],
        }),
      }).addTo(map);
      updateThermoUI();
    } else if (!thermoEnd) {
      thermoEnd = [e.latlng.lat, e.latlng.lng];
      thermoEndMarker = L.marker(e.latlng, {
        icon: L.divIcon({
          className: "questions-thermo-marker",
          html: '<div class="questions-thermo-marker-dot end">E</div>',
          iconSize: [24, 24],
          iconAnchor: [12, 12],
        }),
      }).addTo(map);

      // Draw a line between start and end
      if (thermoStartMarker) {
        const startLatLng = thermoStartMarker.getLatLng();
        L.polyline([startLatLng, e.latlng], {
          color: "#3388ff",
          weight: 2,
          dashArray: "5, 5",
        }).addTo(map);
      }

      updateThermoUI();
      // Stop listening after both points are set
      if (mapClickHandler) {
        map.off("click", mapClickHandler);
        mapClickHandler = null;
      }
    }
  };

  map.on("click", mapClickHandler);
  updateThermoUI();
}

// ── Inject styles ──────────────────────────────────────────────
function injectStyles(): void {
  const style = document.createElement("style");
  style.textContent = `
    .questions-toggle {
      position: absolute;
      top: 50px;
      right: 10px;
      z-index: 1001;
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
    .questions-toggle.open {
      right: 330px;
    }

    .questions-panel {
      position: absolute;
      top: 0;
      right: -320px;
      width: 320px;
      height: 100%;
      z-index: 1000;
      background: white;
      box-shadow: -2px 0 8px rgba(0,0,0,0.2);
      transition: right 0.3s ease;
      padding: 16px;
      overflow-y: auto;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      display: flex;
      flex-direction: column;
    }
    .questions-panel.open {
      right: 0;
    }

    .questions-panel h2 {
      font-size: 16px;
      font-weight: 600;
      margin-bottom: 12px;
      color: #333;
    }

    .questions-tabs {
      display: flex;
      gap: 0;
      margin-bottom: 12px;
      border-bottom: 2px solid #e0e0e0;
    }
    .questions-tab {
      flex: 1;
      padding: 8px 12px;
      border: none;
      background: none;
      font-size: 13px;
      font-weight: 500;
      color: #888;
      cursor: pointer;
      border-bottom: 2px solid transparent;
      margin-bottom: -2px;
      transition: color 0.2s, border-color 0.2s;
    }
    .questions-tab.active {
      color: #3388ff;
      border-bottom-color: #3388ff;
    }
    .questions-tab:hover {
      color: #555;
    }

    .questions-form {
      margin-bottom: 12px;
    }
    .questions-form label {
      display: block;
      font-size: 12px;
      font-weight: 500;
      color: #666;
      margin-bottom: 4px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .questions-form select,
    .questions-form input {
      width: 100%;
      padding: 8px 10px;
      border: 1px solid #ddd;
      border-radius: 4px;
      font-size: 14px;
      margin-bottom: 10px;
      background: white;
    }
    .questions-form select:focus,
    .questions-form input:focus {
      outline: none;
      border-color: #3388ff;
    }

    .questions-custom-row {
      display: none;
      margin-top: -6px;
    }
    .questions-custom-row.visible {
      display: block;
    }

    .questions-answer-btns {
      display: flex;
      gap: 8px;
      margin-top: 4px;
    }
    .questions-answer-btn {
      flex: 1;
      padding: 10px;
      border: none;
      border-radius: 4px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.2s;
    }
    .questions-answer-btn.yes,
    .questions-answer-btn.hotter {
      background: #4caf50;
      color: white;
    }
    .questions-answer-btn.yes:hover,
    .questions-answer-btn.hotter:hover {
      background: #43a047;
    }
    .questions-answer-btn.no,
    .questions-answer-btn.colder {
      background: #f44336;
      color: white;
    }
    .questions-answer-btn.no:hover,
    .questions-answer-btn.colder:hover {
      background: #e53935;
    }

    .questions-thermo-status {
      font-size: 13px;
      color: #555;
      margin-bottom: 8px;
      padding: 8px;
      background: #f5f5f5;
      border-radius: 4px;
    }
    .questions-thermo-step {
      display: block;
    }
    .questions-thermo-reset {
      display: inline-block;
      margin-top: 6px;
      font-size: 12px;
      color: #f44336;
      cursor: pointer;
      background: none;
      border: none;
      padding: 0;
      text-decoration: underline;
    }

    .questions-thermo-marker-dot {
      width: 24px;
      height: 24px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 11px;
      font-weight: 700;
      color: white;
      box-shadow: 0 2px 4px rgba(0,0,0,0.3);
    }
    .questions-thermo-marker-dot.start {
      background: #4caf50;
    }
    .questions-thermo-marker-dot.end {
      background: #f44336;
    }

    .questions-divider {
      border: none;
      border-top: 1px solid #e0e0e0;
      margin: 12px 0;
    }

    .questions-history-title {
      font-size: 13px;
      font-weight: 600;
      color: #333;
      margin-bottom: 8px;
    }
    .questions-history-list {
      flex: 1;
      overflow-y: auto;
      min-height: 0;
    }
    .questions-history-empty {
      font-size: 13px;
      color: #999;
      font-style: italic;
      padding: 8px 0;
    }
    .questions-history-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 6px 8px;
      font-size: 12px;
      border-bottom: 1px solid #f0f0f0;
    }
    .questions-history-item:last-child {
      border-bottom: none;
    }
    .questions-history-desc {
      flex: 1;
      color: #444;
    }
    .questions-history-delete {
      background: none;
      border: none;
      color: #ccc;
      cursor: pointer;
      font-size: 14px;
      padding: 2px 6px;
      border-radius: 3px;
      transition: color 0.2s, background 0.2s;
    }
    .questions-history-delete:hover {
      color: #f44336;
      background: #fce4ec;
    }

    .questions-settings-row {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-top: 8px;
      padding-top: 8px;
      border-top: 1px solid #e0e0e0;
    }
    .questions-settings-row label {
      font-size: 12px;
      color: #666;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .questions-settings-row input[type="checkbox"] {
      width: 14px;
      height: 14px;
      cursor: pointer;
    }
  `;
  document.head.append(style);
}

// ── Build the sidebar DOM ──────────────────────────────────────
function buildSidebar(): { toggleBtn: HTMLButtonElement; panel: HTMLDivElement } {
  const toggleBtn = document.createElement("button");
  toggleBtn.className = "questions-toggle";
  toggleBtn.setAttribute("aria-label", "Toggle questions panel");
  toggleBtn.textContent = "❓";

  const panel = document.createElement("div");
  panel.className = "questions-panel";

  panel.innerHTML = `
    <h2>Ask a Question</h2>

    <div class="questions-tabs">
      <button class="questions-tab questions-tab-radar active">Radar</button>
      <button class="questions-tab questions-tab-thermo">Thermometer</button>
    </div>

    <div class="questions-form" id="radar-form">
      <label for="radar-distance">Distance</label>
      <select id="radar-distance">
        ${radarQuestions.map((q) => `<option value="${q.distance}">${q.label}</option>`).join("")}
        <option value="custom">Custom…</option>
      </select>
      <div class="questions-custom-row" id="radar-custom-row">
        <input type="number" id="radar-custom" placeholder="Enter miles…" min="0.1" step="0.1" />
      </div>
      <div class="questions-answer-btns" id="radar-answer-btns">
        <button class="questions-answer-btn yes" id="radar-btn-yes">Yes (in range)</button>
        <button class="questions-answer-btn no" id="radar-btn-no">No (out of range)</button>
      </div>
    </div>

    <div class="questions-form" id="thermo-form" style="display:none">
      <label for="thermo-distance">Travel Distance</label>
      <select id="thermo-distance">
        ${thermometerQuestions.map((q) => `<option value="${q.distance}">${q.label}${q.gameSize === "small" ? "" : ` (${q.gameSize})`}</option>`).join("")}
      </select>
      <div class="questions-thermo-status" id="thermo-status">
        <span class="questions-thermo-step">Click the map to set your <strong>start</strong> location</span>
      </div>
      <button class="questions-thermo-reset" id="thermo-reset" style="display:none">Reset locations</button>
      <div class="questions-answer-btns" id="thermo-answer-btns" style="display:none">
        <button class="questions-answer-btn hotter" id="thermo-btn-hotter">Hotter</button>
        <button class="questions-answer-btn colder" id="thermo-btn-colder">Colder</button>
      </div>
    </div>

    <hr class="questions-divider" />

    <div class="questions-history-title">Question History</div>
    <div class="questions-history-list" id="questions-history-list"></div>

    <div class="questions-settings-row">
      <label>
        <input type="checkbox" id="questions-show-removed" />
        Show removed stations
      </label>
    </div>
  `;

  document.body.append(toggleBtn);
  document.body.append(panel);

  return { toggleBtn, panel };
}

// ── Wire up event handlers ─────────────────────────────────────
function wireEvents(toggleBtn: HTMLButtonElement, panel: HTMLDivElement): void {
  // Toggle
  toggleBtn.addEventListener("click", () => {
    panel.classList.toggle("open");
    toggleBtn.classList.toggle("open");
  });

  // Tab switching
  const radarTab = panel.querySelector(".questions-tab-radar") as HTMLElement;
  const thermoTab = panel.querySelector(".questions-tab-thermo") as HTMLElement;
  radarTab.addEventListener("click", () => switchTab("radar"));
  thermoTab.addEventListener("click", () => switchTab("thermometer"));

  // Radar form
  radarForm = panel.querySelector("#radar-form") as HTMLDivElement;
  thermoForm = panel.querySelector("#thermo-form") as HTMLDivElement;
  radarDistSelect = panel.querySelector("#radar-distance") as HTMLSelectElement;
  radarCustomInput = panel.querySelector("#radar-custom") as HTMLInputElement;
  radarAnswerBtns = panel.querySelector("#radar-answer-btns") as HTMLDivElement;
  const radarCustomRow = panel.querySelector("#radar-custom-row") as HTMLDivElement;

  radarDistSelect.addEventListener("change", () => {
    if (radarDistSelect.value === "custom") {
      radarCustomRow.classList.add("visible");
    } else {
      radarCustomRow.classList.remove("visible");
    }
  });

  panel.querySelector("#radar-btn-yes")?.addEventListener("click", () => submitRadar("yes"));
  panel.querySelector("#radar-btn-no")?.addEventListener("click", () => submitRadar("no"));

  // Thermometer form
  thermoDistSelect = panel.querySelector("#thermo-distance") as HTMLSelectElement;
  thermoStatus = panel.querySelector("#thermo-status") as HTMLDivElement;
  thermoAnswerBtns = panel.querySelector("#thermo-answer-btns") as HTMLDivElement;
  const thermoReset = panel.querySelector("#thermo-reset") as HTMLButtonElement;

  // Start picking when thermometer tab is shown or distance changes
  thermoDistSelect.addEventListener("change", () => {
    clearThermoMarkers();
    startThermoPicking();
  });

  thermoReset.addEventListener("click", () => {
    clearThermoMarkers();
    startThermoPicking();
  });

  panel
    .querySelector("#thermo-btn-hotter")
    ?.addEventListener("click", () => submitThermometer("hotter"));
  panel
    .querySelector("#thermo-btn-colder")
    ?.addEventListener("click", () => submitThermometer("colder"));

  // History
  historyList = panel.querySelector("#questions-history-list") as HTMLDivElement;

  // Show removed stations toggle
  showRemovedCb = panel.querySelector("#questions-show-removed") as HTMLInputElement;
  const savedSettings = loadSettings();
  showRemovedStations = savedSettings.showRemoved;
  showRemovedCb.checked = showRemovedStations;

  showRemovedCb.addEventListener("change", () => {
    showRemovedStations = showRemovedCb.checked;
    saveSettings({ showRemoved: showRemovedStations });
    applyStationFilter();
  });
}

// ── Public init ────────────────────────────────────────────────
export function initQuestions(config: QuestionsConfig): void {
  map = config.map;
  injectStyles();

  const { toggleBtn, panel } = buildSidebar();
  wireEvents(toggleBtn, panel);

  // Restore history
  const history = loadHistory();
  for (const q of history) {
    let polygon: ReturnType<typeof computeRadarExclusion>;
    if (q.type === "radar") {
      polygon = computeRadarExclusion(q.center, q.distance, q.answer);
    } else {
      polygon = computeThermometerExclusion(q.start, q.end, q.answer);
    }
    exclusionZones.push({ polygon, sourceQuestion: q });
  }

  updateExclusionLayer();
  applyStationFilter();
  renderHistory();

  // Start thermometer picking when thermo tab is first shown
  startThermoPicking();
}
