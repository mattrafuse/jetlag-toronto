import * as turf from "@turf/turf";
import { featureLayer } from "esri-leaflet";
import { Feature, LineString } from "geojson";
import L from "leaflet";
import { borderGeoJSON } from "./border";
import { QUARTER_MILE } from "./constants";

const borderFeature = borderGeoJSON.features[0] as GeoJSON.Feature<
  GeoJSON.Polygon,
  Record<string, unknown>
>;

export function addSubwayLayers(map: L.Map): L.LayerGroup {
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
      // Filter for Eglinton Line 5 stations specifically
      where: "(ARRIVAL_TIMES LIKE '%Line 5%') AND (STOP_NAME NOT LIKE '%Westbound%')",
      isModern: true,
      pointToLayer: (_feature, latlng) => {
        return new L.FeatureGroup([
          L.circleMarker(latlng, {
            radius: 5,
            fillColor: "#FF8000",
            fillOpacity: 1,
            weight: 0,
            pane: "subwayStations",
          }),
          L.circle(latlng, {
            radius: QUARTER_MILE,
            fillColor: "#FF8000",
            fillOpacity: 0.25,
            weight: 0,
            pane: "subwayRadius",
          }),
        ]);
      },
    }),
  );

  // ── TTC Subway Stations (ArcGIS) ───────────────────────────────
  group.addLayer(
    featureLayer({
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

        if (!turf.booleanPointInPolygon(feature.geometry, borderFeature)) {
          return L.circleMarker(latlng, {
            opacity: 0,
            fillOpacity: 0,
          });
        }

        const marker = L.circleMarker(latlng, {
          radius: 5,
          fillColor: `#${closest ? (closest[1] as Feature<LineString>).properties?.ROUTE_COLOR : "666"}`,
          weight: 0,
          fillOpacity: 1,
          pane: "subwayStations",
        });

        const radius = L.circle(latlng, {
          radius: QUARTER_MILE,
          fillColor: `#${closest ? (closest[1] as Feature<LineString>).properties?.ROUTE_COLOR : "666"}`,
          weight: 0,
          fillOpacity: 0.25,
          pane: "subwayRadius",
        });

        return new L.FeatureGroup([marker, radius]);
      },
    }),
  );

  group.addTo(map);
  return group;
}
