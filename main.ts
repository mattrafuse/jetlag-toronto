import L from "leaflet";
import "leaflet-editable";
import "leaflet/dist/leaflet.css";
import { addBorderMask } from "./layers/border";
import { addUserLocation } from "./layers/location";
import { addSubwayLayers } from "./layers/subway";
import { addTrainLayers } from "./layers/train";
import { initMapView } from "./map-view";
import { initOverlay } from "./overlay";
import { initQuestions, stationRegistry } from "./questions";
import { initSettings } from "./settings";
import { applyStateFromUrl } from "./settings/link";

// Restore a shared game state from the URL (if present) before anything
// reads from localStorage, so the imported settings/view/questions take
// effect on load.
applyStateFromUrl();

const map = L.map("map", { editable: true } as L.MapOptions).setView([43.6532, -79.3832], 12);

// Restore the user's last-viewed position (center + zoom) from localStorage.
initMapView(map);

const tileLayer = L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}@2x.png", {
  maxZoom: 19,
  // Request retina (@2x) tiles so the map prints at a much higher resolution
  // than the screen-rendered tiles.
  detectRetina: true,
  attribution:
    '&copy; <a href="https://openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/">CARTO</a>',
}).addTo(map);

// Set map on station registry before layers register stations
stationRegistry.setMap(map);

const borderLayer = addBorderMask(map);
const subwayLayer = addSubwayLayers(map, () => stationRegistry.mergeHubs());
const trainLayer = addTrainLayers(map);
const userLocationLayer = addUserLocation(map);

// Train (and any synchronous) layers have already registered their stations by
// this point; mergeHubs() is also called once the async subway layer finishes
// loading (see addSubwayLayers onReady callback above).
stationRegistry.mergeHubs();

initSettings({ map, trainLayer, subwayLayer, borderLayer, userLocationLayer, tileLayer });
initOverlay();
initQuestions({ map });
