import L from "leaflet";
import { radarQuestions, thermometerQuestions } from "./data";
import {
  computeRadarExclusion,
  computeThermometerExclusion,
  unionExclusionZones,
} from "./exclusion";
import { stationRegistry } from "./station-registry";
import { callbacks, store } from "./store";
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

let thermoStart: [number, number] | null = null;
let thermoEnd: [number, number] | null = null;
let thermoStartMarker: L.Marker | null = null;
let thermoEndMarker: L.Marker | null = null;
let mapClickHandler: ((e: L.LeafletMouseEvent) => void) | null = null;

let radarCenter: [number, number] | null = null;
let radarCenterMarker: L.Marker | null = null;
let radarRadiusPreview: L.Circle | null = null;

const MILES_TO_METERS = 1609.344;

// ── Persistence ────────────────────────────────────────────────
const STORAGE_KEY = "jetlag-questions";
const SETTINGS_KEY = "jetlag-question-settings";

const loadHistory = (): AskedQuestion[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    /* ignore */
  }
  return [];
}
const saveHistory = (h: AskedQuestion[]): void => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(h));
}
const loadSettings = (): { showRemoved: boolean } => {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    /* ignore */
  }
  return { showRemoved: false };
}
const saveSettings = (s: { showRemoved: boolean }): void => {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
}

let questionCounter = 0;
const nextId = (): string => {
  return `q-${Date.now()}-${++questionCounter}`;
}

// ── Exclusion Layer ────────────────────────────────────────────
const updateExclusionLayer = (): void => {
  if (exclusionLayer) {
    map.removeLayer(exclusionLayer);
  }
  const cumulative = unionExclusionZones(exclusionZones.map((z) => z.polygon));
  if (cumulative) {
    exclusionLayer = L.geoJSON(cumulative, {
      style: { color: "#ff4444", weight: 2, fillColor: "#ff4444", fillOpacity: 0.15 },
    }).addTo(map);
  }
}

// ── Station Filtering ──────────────────────────────────────────
const applyStationFilter = (): void => {
  const cumulative = unionExclusionZones(exclusionZones.map((z) => z.polygon));
  stationRegistry.resetAll();
  if (cumulative) {
    for (const id of stationRegistry.getStationIdsInExclusionZone(
      cumulative as GeoJSON.Feature<GeoJSON.Polygon>,
    )) {
      if (showRemovedStations) {
        stationRegistry.grayOutStation(id);
      } else {
        stationRegistry.removeStation(id);
      }
    }
  }
  refreshStationStatuses();
}

// Push the current station exclusion statuses into the store so the
// sidebar can render the station list.
const refreshStationStatuses = (): void => {
  store.update({ stations: stationRegistry.getStationStatuses() });
}

const processQuestion = (question: AskedQuestion): void => {
  const polygon =
    question.type === "radar"
      ? computeRadarExclusion(question.center, question.distance, question.answer)
      : computeThermometerExclusion(question.start, question.end, question.answer);
  exclusionZones.push({ polygon, sourceQuestion: question });
  updateExclusionLayer();
  applyStationFilter();
}

const removeQuestion = (id: string): void => {
  exclusionZones = exclusionZones.filter((z) => z.sourceQuestion.id !== id);
  saveHistory(loadHistory().filter((q) => q.id !== id));
  updateExclusionLayer();
  applyStationFilter();
  renderHistory();
  refreshStationStatuses();
}

// ── Marker cleanup ─────────────────────────────────────────────
const clearRadarMarker = (): void => {
  if (radarCenterMarker) {
    map.removeLayer(radarCenterMarker);
    radarCenterMarker = null;
  }
  if (radarRadiusPreview) {
    map.removeLayer(radarRadiusPreview);
    radarRadiusPreview = null;
  }
  radarCenter = null;
}
const clearThermoMarkers = (): void => {
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

// ── History rendering ──────────────────────────────────────────
const renderHistory = (): void => {
  const history = loadHistory();
  store.update({ history });
}

// ── Tab switching ──────────────────────────────────────────────
const switchTab = (tab: "radar" | "thermometer"): void => {
  store.update({ activeTab: tab });
  if (tab === "radar") {
    clearThermoMarkers();
    startRadarPicking();
  } else {
    clearRadarMarker();
    startThermoPicking();
  }
}

// ── Radar submission ───────────────────────────────────────────
const submitRadar = (answer: "yes" | "no"): void => {
  if (!radarCenter) return;
  const s = store.get();
  const customVal = s.radarCustomDistance;
  let distance: number;
  let label: string;
  if (s.radarUseCustom && !Number.isNaN(customVal) && customVal > 0) {
    distance = customVal;
    label = `${customVal} Mile${customVal === 1 ? "" : "s"}`;
  } else {
    const selected = radarQuestions.find((q) => q.distance === s.radarDistance);
    if (!selected) return;
    distance = selected.distance;
    label = selected.label;
  }
  const q: AskedRadarQuestion = {
    id: nextId(),
    type: "radar",
    distance,
    label,
    center: radarCenter,
    answer,
    timestamp: Date.now(),
  };
  saveHistory([...loadHistory(), q]);
  processQuestion(q);
  renderHistory();
  clearRadarMarker();
  store.update({ radarCenter: null });
}

// ── Thermometer submission ─────────────────────────────────────
const submitThermometer = (answer: "hotter" | "colder"): void => {
  if (!thermoStart || !thermoEnd) return;
  const s = store.get();
  const selected = thermometerQuestions.find((q) => q.distance === s.thermoDistance);
  if (!selected) return;
  const q: AskedThermometerQuestion = {
    id: nextId(),
    type: "thermometer",
    distance: selected.distance,
    label: selected.label,
    start: thermoStart,
    end: thermoEnd,
    answer,
    timestamp: Date.now(),
  };
  saveHistory([...loadHistory(), q]);
  processQuestion(q);
  renderHistory();
  clearThermoMarkers();
  store.update({ thermoStart: null, thermoEnd: null });
}

// ── Radar UI ───────────────────────────────────────────────────
const setRadarCenter = (center: [number, number] | null): void => {
  store.update({ radarCenter: center });
}

// Draw a circle previewing the radar radius based on the selected distance.
const updateRadarRadiusPreview = (): void => {
  if (!radarCenter) return;
  const s = store.get();
  let distance: number;
  if (s.radarUseCustom && !Number.isNaN(s.radarCustomDistance) && s.radarCustomDistance > 0) {
    distance = s.radarCustomDistance;
  } else {
    distance = s.radarDistance;
  }
  if (radarRadiusPreview) {
    map.removeLayer(radarRadiusPreview);
    radarRadiusPreview = null;
  }
  radarRadiusPreview = L.circle(radarCenter, {
    radius: distance * MILES_TO_METERS,
    color: "#3388ff",
    weight: 2,
    dashArray: "5, 5",
    fillColor: "#3388ff",
    fillOpacity: 0.08,
  }).addTo(map);
}

// ── Thermometer UI ─────────────────────────────────────────────
const setThermoStart = (start: [number, number] | null): void => {
  store.update({ thermoStart: start });
}
const setThermoEnd = (end: [number, number] | null): void => {
  store.update({ thermoEnd: end });
}

const startRadarPicking = (): void => {
  clearRadarMarker();
  store.update({ radarCenter: null });
  mapClickHandler = (e: L.LeafletMouseEvent) => {
    if (radarCenter) return;
    radarCenter = [e.latlng.lat, e.latlng.lng];
    radarCenterMarker = L.marker(e.latlng, {
      icon: L.divIcon({
        className: "questions-radar-marker",
        html: `
          <div class="questions-radar-bullseye">
            <span class="ring ring-outer"></span>
            <span class="ring ring-mid"></span>
            <span class="ring ring-inner"></span>
          </div>`,
        iconSize: [36, 36],
        iconAnchor: [18, 18],
      }),
    }).addTo(map);
    updateRadarRadiusPreview();
    setRadarCenter(radarCenter);
    if (mapClickHandler) {
      map.off("click", mapClickHandler);
      mapClickHandler = null;
    }
  };
  map.on("click", mapClickHandler);
}

const startThermoPicking = (): void => {
  clearThermoMarkers();
  store.update({ thermoStart: null, thermoEnd: null });
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
      setThermoStart(thermoStart);
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
      if (thermoStartMarker) {
        L.polyline([thermoStartMarker.getLatLng(), e.latlng], {
          color: "#3388ff",
          weight: 2,
          dashArray: "5, 5",
        }).addTo(map);
      }
      setThermoEnd(thermoEnd);
      const h = mapClickHandler;
      if (h) {
        map.off("click", h);
        mapClickHandler = null;
      }
    }
  };
  map.on("click", mapClickHandler);
}

// ── Init ───────────────────────────────────────────────────────
export const initQuestions = (config: QuestionsConfig): void => {
  map = config.map;

  // Wire callbacks
  callbacks.submitRadar = submitRadar;
  callbacks.submitThermo = submitThermometer;
  callbacks.switchTab = switchTab;
  callbacks.startRadarPicking = startRadarPicking;
  callbacks.startThermoPicking = startThermoPicking;
  callbacks.clearRadarMarker = clearRadarMarker;
  callbacks.clearThermoMarkers = clearThermoMarkers;
  callbacks.setShowRemoved = (v: boolean) => {
    showRemovedStations = v;
    store.update({ showRemoved: v });
    saveSettings({ showRemoved: v });
    applyStationFilter();
    refreshStationStatuses();
  };

  // Listen for question removal events from the React UI
  window.addEventListener("jetlag-remove-question", ((e: CustomEvent<string>) => {
    removeQuestion(e.detail);
  }) as EventListener);

  for (const q of loadHistory()) {
    const polygon =
      q.type === "radar"
        ? computeRadarExclusion(q.center, q.distance, q.answer)
        : computeThermometerExclusion(q.start, q.end, q.answer);
    exclusionZones.push({ polygon, sourceQuestion: q });
  }

  showRemovedStations = loadSettings().showRemoved;
  store.update({ showRemoved: showRemovedStations });

  updateExclusionLayer();
  applyStationFilter();
  renderHistory();
  startRadarPicking();

  // Keep the radius preview in sync with distance changes from the UI.
  store.subscribe(() => {
    if (radarCenter) updateRadarRadiusPreview();
  });
}
