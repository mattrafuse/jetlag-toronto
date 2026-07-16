import * as turf from "@turf/turf";
import { featureLayer } from "esri-leaflet";
import type { Feature, LineString } from "geojson";
import L from "leaflet";
import { borderGeoJSON } from "./border";
import { createStation } from "./station";

const borderFeature = borderGeoJSON as GeoJSON.Feature<GeoJSON.Polygon, Record<string, unknown>>;

export const addSubwayLayers = (map: L.Map, onReady?: () => void): L.LayerGroup => {
  const group = L.layerGroup();

  // ── Custom panes for proper stacking ────────────────────────────
  // Radius circles sit at the bottom, route lines above them, station markers on top
  map.createPane("subwayRadius");
  map.createPane("subwayRoutes");
  map.createPane("subwayStations");
  const radiusPane = map.getPane("subwayRadius")!;
  const routesPane = map.getPane("subwayRoutes")!;
  const stationsPane = map.getPane("subwayStations")!;
  radiusPane.style.zIndex = "400";
  routesPane.style.zIndex = "410";
  stationsPane.style.zIndex = "420";

  // ── TTC Subway Routes (ArcGIS) ──────────────────────────────────
  const routes = featureLayer({
    url: "https://gis.toronto.ca/arcgis/rest/services/cot_geospatial7/mapserver/11",
    isModern: true,
    style: (feature: Feature<LineString>) => {
      if ([4, 6].includes(feature.properties?.ROUTE_ID)) {
        return { opacity: 0 };
      }

      return {
        color: `#${feature.properties?.ROUTE_COLOR || "444"}`,
        weight: 5,
        opacity: 0.7,
      };
    },
  });

  group.addLayer(routes);

  group.addLayer(
    featureLayer({
      url: "https://gis.toronto.ca/arcgis/rest/services/cot_geospatial7/MapServer/1",
      // Filter for Eglinton Line 5 stations specifically, and exclude westbound stations
      where: "(ARRIVAL_TIMES LIKE '%Line 5%') AND (STOP_NAME NOT LIKE '%Westbound%')",
      isModern: true,
      pointToLayer: (_feature, latlng) => {
        const ll = latlng as L.LatLng;
        const rawName = _feature.properties?.STOP_NAME ?? "";
        const label = rawName
          .replace(/Eastbound Platform/g, "")
          .replace(/LRT Station/g, "")
          .replace(/LRT Platform/g, "")
          .replace(/\s+/g, " ")
          .trim();
        const { group } = createStation(
          `subway-line5-${_feature.properties?.OBJECTID ?? _feature.id}`,
          ll,
          {
            fillColor: "#FF8000",
            markerPane: "subwayStations",
            circlePane: "subwayRadius",
            label,
          },
        );
        return group;
      },
    }),
  );

  // ── TTC Subway Stations (ArcGIS) ───────────────────────────────
  const stationsLayer = featureLayer({
    url: "https://gis.toronto.ca/arcgis/rest/services/cot_geospatial7/mapserver/8",
    isModern: true,
    pointToLayer: (feature, latlng) => {
      let closest: [number, Feature<LineString>] | null = null;
      routes.eachFeature((subwayLine) => {
        if (![4, 5, 6].includes(subwayLine.feature.properties?.ROUTE_ID)) {
          const currentDistance = turf.nearestPointOnLine(subwayLine.feature, feature).properties
            .pointDistance;

          if (!closest || closest[0] > currentDistance) {
            closest = [currentDistance, subwayLine.feature as Feature<LineString>];
          }
        }
      });

      if (turf.booleanPointInPolygon(feature.geometry, borderFeature)) {
        return L.circleMarker(latlng, {
          opacity: 0,
          fillOpacity: 0,
        });
      }

      const ll = latlng as L.LatLng;
      const colour = `#${closest ? (closest[1] as Feature<LineString>).properties?.ROUTE_COLOR : "666"}`;
      const rawName = feature.properties?.PT_NAME ?? "";
      const label = rawName.toLowerCase().replace(/\b\w/g, (c: string) => c.toUpperCase());
      const { group } = createStation(`subway-${feature.properties?.STOP_ID ?? feature.id}`, ll, {
        fillColor: colour,
        markerPane: "subwayStations",
        circlePane: "subwayRadius",
        label,
      });
      return group;
    },
  });

  // Fire onReady once the stations have loaded and registered, so the caller
  // can perform cross-layer work (e.g. merging hub stations) after all
  // stations are present.
  if (onReady) {
    stationsLayer.on("load", onReady);
  }
  group.addLayer(stationsLayer);

  group.addTo(map);
  return group;
};
