import L from "leaflet";
import borderGeoJSONRaw from "./shapes/border.geojson?raw";

const borderGeoJSON: GeoJSON.FeatureCollection = JSON.parse(borderGeoJSONRaw);

// GeoJSON uses [lng, lat] — swap to Leaflet's [lat, lng]
const borderCoords: [number, number][] = (
  borderGeoJSON.features[0].geometry as GeoJSON.Polygon
).coordinates[0].map(([lng, lat]) => [lat, lng] as [number, number]);

// Large outer rectangle — everything beyond Toronto
const outerBounds: [number, number][] = [
  [-90, -180],
  [90, -180],
  [90, 180],
  [-90, 180],
  [-90, -180],
];

export function addBorderMask(map: L.Map): L.LayerGroup {
  const group = L.layerGroup();
  const mask = L.polygon([outerBounds, borderCoords], {
    color: "#ff4444",
    weight: 2,
    fillColor: "#ff4444",
    fillOpacity: 0.15,
  });
  group.addLayer(mask);
  group.addTo(map);
  return group;
}

export { borderCoords, borderGeoJSON };
