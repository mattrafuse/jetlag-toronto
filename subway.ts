import * as turf from "@turf/turf";
import { featureLayer } from "esri-leaflet";
import L from "leaflet";
import { borderGeoJSON } from "./border";

const borderFeature = borderGeoJSON.features[0] as GeoJSON.Feature<
  GeoJSON.Polygon,
  Record<string, unknown>
>;

export function addSubwayLayers(map: L.Map): void {
  // ── TTC Subway Routes (ArcGIS) ──────────────────────────────────
  featureLayer({
    url: "https://gis.toronto.ca/arcgis/rest/services/cot_geospatial7/mapserver/11",
    style: (feature) => {
      if ([4, 6].includes(feature.properties?.ROUTE_ID)) {
        return { opacity: 0 };
      }

      return {
        color: `#${feature.properties?.ROUTE_COLOR || "444"}`,
        weight: 5,
        opacity: 0.7,
      };
    },
  }).addTo(map);

  // ── TTC Subway Stations (ArcGIS) ───────────────────────────────
  featureLayer({
    url: "https://gis.toronto.ca/arcgis/rest/services/cot_geospatial7/mapserver/8",
    pointToLayer: (_feature, latlng) => {
      if (!turf.booleanPointInPolygon(_feature.geometry, borderFeature)) {
        return null;
      }

      return L.circleMarker(latlng, {
        radius: 5,
        fillColor: "#666",
        color: "#fff",
        weight: 2,
        fillOpacity: 1,
      });
    },
  }).addTo(map);
}
