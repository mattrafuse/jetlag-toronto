import L from "leaflet";
import { QUARTER_MILE } from "../constants";
import { stationRegistry } from "../questions/station-registry";

// ── Station factory ────────────────────────────────────────────
// Creates the standard station visual: a small circleMarker dot wrapped
// together with its quarter-mile radius circle inside a FeatureGroup, and
// registers it with the stationRegistry so the question system can
// hide/restore it. Any default can be overridden per-call.

export interface StationOptions {
  /** Base fill colour applied to both the marker and the radius circle. */
  fillColor: string;
  /** Override the marker (circleMarker) defaults. */
  marker?: L.CircleMarkerOptions;
  /** Override the radius circle (circle) defaults. */
  circle?: L.CircleOptions;
  /** Pane to render the marker in (defaults to the map's overlay pane). */
  markerPane?: string;
  /** Pane to render the radius circle in. */
  circlePane?: string;
  /** Optional text label (station name) rendered permanently above the marker. */
  label?: string;
}

export interface CreatedStation {
  marker: L.CircleMarker;
  circle: L.Circle;
  group: L.FeatureGroup;
}

export const createStation = (
  id: string,
  latlng: L.LatLng,
  options: StationOptions,
): CreatedStation => {
  const marker = L.circleMarker(latlng, {
    radius: 5,
    fillColor: options.fillColor,
    weight: 0,
    fillOpacity: 1,
    ...(options.markerPane ? { pane: options.markerPane } : {}),
    ...options.marker,
  });

  const circle = L.circle(latlng, {
    radius: QUARTER_MILE,
    fillColor: options.fillColor,
    fillOpacity: 0.25,
    weight: 0,
    ...(options.circlePane ? { pane: options.circlePane } : {}),
    ...options.circle,
  });

  if (options.label) {
    marker.bindTooltip(options.label, {
      permanent: true,
      direction: "top",
      className: "station-label",
      offset: [0, -4],
    });
  }

  const group = new L.FeatureGroup([marker, circle]);
  stationRegistry.register(id, options.label ?? id, latlng, circle, marker, group);

  return { marker, circle, group };
};
