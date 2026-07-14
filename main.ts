import L from "leaflet";
import "leaflet-editable";
import "leaflet/dist/leaflet.css";
import { addBorderMask } from "./border";
import { addUserLocation } from "./location";
import { initSettings } from "./settings";
import { addSubwayLayers } from "./subway";
import { addTrainLayers } from "./train";

const map = L.map("map", { editable: true } as L.MapOptions).setView([43.6532, -79.3832], 12);

L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
  maxZoom: 19,
  attribution:
    '&copy; <a href="https://openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/">CARTO</a>',
}).addTo(map);

const borderLayer = addBorderMask(map);
const subwayLayer = addSubwayLayers(map);
const trainLayer = addTrainLayers(map);
const userLocationLayer = addUserLocation(map);

initSettings({ map, trainLayer, subwayLayer, borderLayer, userLocationLayer });
