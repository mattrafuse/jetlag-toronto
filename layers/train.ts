import * as turf from "@turf/turf";
import L from "leaflet";
import { QUARTER_MILE } from "../constants";
import { stationRegistry } from "../questions/station-registry";
import { borderGeoJSON } from "./border";

const borderFeature = borderGeoJSON.features[0] as GeoJSON.Feature<
  GeoJSON.Polygon,
  Record<string, unknown>
>;

// Vite glob‑import all Metrolinx GO / UP Express train GeoJSON files
const geojsonModules: Record<string, string> = import.meta.glob("./shapes/metrolinx/*.geojson", {
  query: "?raw",
  import: "default",
  eager: true,
});

// GO Train corridor colour map
const colourMap: Record<string, string> = {
  BR: "#003767", // Barrie
  GT: "#00853e", // Kitchener
  KI: "#00853e",
  LE: "#ff0d00", // Lakeshore East
  LW: "#98002e", // Lakeshore West
  MI: "#f57f25", // Milton
  RH: "#0099c7", // Richmond Hill
  ST: "#794500", // Stouffville
};

const parseColour = (name?: string) => {
  // Try to match a colour from the route prefix (e.g. "BR - ...")
  let colour = "#666";
  if (name) {
    if (name.startsWith("UP Express")) {
      return "#0075D2";
    }

    for (const [prefix, c] of Object.entries(colourMap)) {
      if (name.startsWith(prefix)) {
        colour = c;
        break;
      }
    }
  }

  return colour;
};

export function addTrainLayers(map: L.Map): L.LayerGroup {
  const group = L.layerGroup();

  // Dedicated pane for station radius circles so they don't stack opacity
  map.createPane("trainRadius");
  const radiusPane = map.getPane("trainRadius")!;
  radiusPane.style.zIndex = "405";

  for (const data of Object.values(geojsonModules)) {
    const collection: GeoJSON.FeatureCollection = JSON.parse(data);

    const geojsonLayer = L.geoJSON(collection, {
      coordsToLatLng: (coords: [number, number]) => L.latLng(coords[1], coords[0]),
      filter: (feature) => {
        if (feature.geometry.type === "Point") {
          return turf.booleanPointInPolygon(feature.geometry, borderFeature);
        }

        return true;
      },
      pointToLayer: (feature, latlng) => {
        const isStation = feature?.properties?.marker_symbol === "station";

        if (isStation) {
          const ll = latlng as L.LatLng;
          const marker = L.circleMarker(ll, {
            radius: 5,
            fillColor: parseColour(feature?.properties?.route_name ?? feature?.properties?.name),
            weight: 0,
            fillOpacity: 1,
          });
          const circle = L.circle(ll, {
            radius: QUARTER_MILE,
            fillColor: parseColour(feature?.properties?.route_name ?? feature?.properties?.name),
            fillOpacity: 0.25,
            weight: 0,
          });
          const fg = new L.FeatureGroup([marker, circle]);
          stationRegistry.register(
            `train-${feature?.properties?.name ?? feature.id}`,
            ll,
            circle,
            marker,
            fg,
          );
          return fg;
        }

        return L.circleMarker(latlng, {
          radius: 5,
          fillColor: "#fff",
          weight: 0,
          fillOpacity: 0,
        });
      },
      style: (feature) => {
        if (feature?.geometry.type === "Point") {
          return {};
        }

        return {
          color: parseColour(feature?.properties?.route_name ?? feature?.properties?.name),
          weight: 3,
          opacity: 0.7,
        };
      },
    });

    group.addLayer(geojsonLayer);
  }

  group.addTo(map);
  return group;
}
