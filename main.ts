import L from "leaflet";
import "leaflet-editable";
import "leaflet/dist/leaflet.css";
import { addBorderMask } from "./border";
import { addUserLocation } from "./location";
import { addSubwayLayers } from "./subway";
import { addTrainLayers } from "./train";

const map = L.map("map", { editable: true } as L.MapOptions).setView(
  [43.6532, -79.3832],
  12,
);

L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
  maxZoom: 19,
  attribution:
    '&copy; <a href="https://openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/">CARTO</a>',
}).addTo(map);

addBorderMask(map);
addUserLocation(map);
addSubwayLayers(map);
addTrainLayers(map);

// ── Export Polygons ─────────────────────────────────────────────
document.getElementById("exportBtn")!.addEventListener("click", () => {
  const geojson: GeoJSON.FeatureCollection = {
    type: "FeatureCollection",
    features: [],
  };

  map.eachLayer((layer) => {
    if (layer instanceof L.Polygon && !(layer instanceof L.CircleMarker)) {
      geojson.features.push(layer.toGeoJSON() as GeoJSON.Feature);
    }
  });

  const blob = new Blob([JSON.stringify(geojson, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "polygons.geojson";
  a.click();
  URL.revokeObjectURL(url);
});

// ── Import Polygons ─────────────────────────────────────────────
const importDialog = document.getElementById(
  "importDialog",
) as HTMLDialogElement;
const geojsonInput = document.getElementById(
  "geojsonInput",
) as HTMLTextAreaElement;

document.getElementById("importBtn")!.addEventListener("click", () => {
  geojsonInput.value = "";
  importDialog.showModal();
});

document.getElementById("importCancel")!.addEventListener("click", () => {
  importDialog.close();
});

document.getElementById("importConfirm")!.addEventListener("click", () => {
  try {
    const data = JSON.parse(geojsonInput.value) as GeoJSON.FeatureCollection;
    if (data.type !== "FeatureCollection" || !Array.isArray(data.features)) {
      throw new Error("Invalid GeoJSON: expected a FeatureCollection");
    }

    data.features.forEach((feature) => {
      if (
        feature.geometry &&
        (feature.geometry.type === "Polygon" ||
          feature.geometry.type === "MultiPolygon")
      ) {
        const layer = L.geoJSON(feature, {
          style: {
            color: "#ff4444",
            weight: 2,
            fillColor: "#ff4444",
            fillOpacity: 0.15,
          },
        });
        layer.eachLayer((l) => {
          if (l instanceof L.Polygon) {
            l.addTo(map);
            (l as any).enableEdit();
          }
        });
      }
    });

    importDialog.close();
  } catch (err) {
    alert("Import failed: " + (err as Error).message);
  }
});
