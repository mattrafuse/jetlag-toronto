import L from "leaflet";
import borderGeoJSONRaw from "./shapes/border.geojson?raw";

const borderGeoJSON: GeoJSON.Feature = JSON.parse(borderGeoJSONRaw);

// GeoJSON uses [lng, lat] — swap to Leaflet's [lat, lng] for every ring.
// The first ring is the outer bounds rectangle; subsequent rings are holes
// (e.g. the Toronto border), forming a donut mask.
const borderRings: [number, number][][] = (
  borderGeoJSON.geometry as GeoJSON.Polygon
).coordinates.map((ring) => ring.map(([lng, lat]) => [lat, lng] as [number, number]));

// Keep a reference to the editable polygon so the settings panel can
// toggle editing and export the current geometry.
let borderMask: L.Polygon | null = null;

export const addBorderMask = (map: L.Map): L.LayerGroup => {
  const group = L.layerGroup();
  const mask = L.polygon(borderRings, {
    color: "#ff4444",
    weight: 2,
    fillColor: "#ff4444",
    fillOpacity: 0.15,
  });
  borderMask = mask;

  group.addLayer(mask);
  group.addTo(map);
  return group;
};

// ── Edit / export helpers ──────────────────────────────────────
export const setBorderEditable = (editable: boolean): void => {
  if (!borderMask) return;
  if (editable) {
    borderMask.enableEdit();
  } else {
    borderMask.disableEdit();
  }
};

export const exportBorderGeoJSON = (): void => {
  if (!borderMask) return;
  const geojson = borderMask.toGeoJSON() as GeoJSON.Feature;
  const blob = new Blob([JSON.stringify(geojson, null, 2)], {
    type: "application/geo+json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "border.geojson";
  a.click();
  URL.revokeObjectURL(url);
};

export { borderGeoJSON };
