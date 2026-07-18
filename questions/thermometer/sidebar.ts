// ── Thermometer Sidebar Controller ───────────────────────────────
// Encapsulates all thermometer-specific map interaction: start/end
// marker placement, connecting line, and submission. The orchestrator
// creates and composes this controller; it never imports radar code.

import L from "leaflet";
import type { QuestionsStoreType } from "../store";
import { roundCoord } from "../store";
import { thermometerQuestions } from "./data";
import type { AskedThermometerQuestion } from "./types";

export interface ThermometerControllerDependencies {
  map: L.Map;
  store: QuestionsStoreType;
  nextId: () => string;
  onQuestionAsked: (question: AskedThermometerQuestion) => void;
}

export interface ThermometerController {
  startPicking: () => void;
  clearMarkers: () => void;
  submit: (answer: "hotter" | "colder") => void;
  setStart: (lat: number, lng: number) => void;
  setEnd: (lat: number, lng: number) => void;
  destroy: () => void;
}

/** Create a thermometer controller bound to the given map and dependencies. */
export const createThermometerController = (
  deps: ThermometerControllerDependencies,
): ThermometerController => {
  const { map, store, nextId, onQuestionAsked } = deps;

  let start: [number, number] | null = null;
  let end: [number, number] | null = null;
  let startMarker: L.CircleMarker | null = null;
  let endMarker: L.CircleMarker | null = null;
  let line: L.Polyline | null = null;
  let clickHandler: ((e: L.LeafletMouseEvent) => void) | null = null;

  // ── Marker cleanup ──────────────────────────────────────────
  const clearMarkers = (): void => {
    if (startMarker) {
      map.removeLayer(startMarker);
      startMarker = null;
    }
    if (endMarker) {
      map.removeLayer(endMarker);
      endMarker = null;
    }
    if (line) {
      map.removeLayer(line);
      line = null;
    }
    start = null;
    end = null;
    if (clickHandler) {
      map.off("click", clickHandler);
      clickHandler = null;
    }
    store.update({
      thermoStart: null,
      thermoEnd: null,
      thermoStartLat: "",
      thermoStartLng: "",
      thermoEndLat: "",
      thermoEndLng: "",
    });
  };

  // ── Picking ─────────────────────────────────────────────────
  const startPicking = (): void => {
    clearMarkers();
    clickHandler = (e: L.LeafletMouseEvent) => {
      if (!start) {
        start = [e.latlng.lat, e.latlng.lng];
        startMarker = placeMarker(startMarker, e.latlng, "#3388ff", "Thermometer Start");
        store.update({
          thermoStart: start,
          thermoStartLat: String(roundCoord(start[0])),
          thermoStartLng: String(roundCoord(start[1])),
        });
      } else if (!end) {
        end = [e.latlng.lat, e.latlng.lng];
        endMarker = placeMarker(endMarker, e.latlng, "#ff3333", "Thermometer End");
        placeLine();
        store.update({
          thermoEnd: end,
          thermoEndLat: String(roundCoord(end[0])),
          thermoEndLng: String(roundCoord(end[1])),
        });
        // Stop listening after both points are placed.
        const h = clickHandler;
        if (h) {
          map.off("click", h);
          clickHandler = null;
        }
      }
    };
    map.on("click", clickHandler);
  };

  // Create-or-update a circle marker at `latlng`, binding the given tooltip.
  // Returns the (possibly newly created) marker so callers can chain.
  const placeMarker = (
    ref: L.CircleMarker | null,
    latlng: L.LatLng,
    color: string,
    tooltip: string,
  ): L.CircleMarker => {
    if (ref) {
      ref.setLatLng(latlng);
      return ref;
    }
    const marker = L.circleMarker(latlng, {
      radius: 7,
      color,
      fillColor: color,
      fillOpacity: 1,
      weight: 2,
    }).addTo(map);
    marker.bindTooltip(tooltip, {
      permanent: true,
      direction: "top",
      className: "label",
      offset: [0, -4],
    });
    return marker;
  };

  // Rebuild the dashed connecting line between the two markers, replacing any
  // existing line. No-op if either marker is missing.
  const placeLine = (): void => {
    if (!startMarker || !endMarker) return;
    if (line) {
      map.removeLayer(line);
      line = null;
    }
    line = L.polyline([startMarker.getLatLng(), endMarker.getLatLng()], {
      color: "#3388ff",
      weight: 2,
      dashArray: "5, 5",
    }).addTo(map);
  };

  // ── Set start from lat/lng inputs ───────────────────────────
  const setStart = (lat: number, lng: number): void => {
    start = [lat, lng];
    startMarker = placeMarker(startMarker, L.latLng(lat, lng), "#3388ff", "Thermometer Start");
    placeLine();
    store.update({ thermoStart: start });
  };

  // ── Set end from lat/lng inputs ─────────────────────────────
  const setEnd = (lat: number, lng: number): void => {
    end = [lat, lng];
    endMarker = placeMarker(endMarker, L.latLng(lat, lng), "#ff3333", "Thermometer End");
    placeLine();
    store.update({ thermoEnd: end });
  };

  // ── Submission ──────────────────────────────────────────────
  const submit = (answer: "hotter" | "colder"): void => {
    if (!start || !end) {
      return;
    }
    const s = store.get();
    const selected = thermometerQuestions.find((q) => q.distance === s.thermoDistance);
    if (!selected) {
      return;
    }

    const question: AskedThermometerQuestion = {
      id: nextId(),
      type: "thermometer",
      distance: selected.distance,
      label: selected.label,
      start,
      end,
      answer,
      timestamp: Date.now(),
    };

    onQuestionAsked(question);
    clearMarkers();
  };

  return {
    startPicking,
    clearMarkers,
    submit,
    setStart,
    setEnd,
    destroy: clearMarkers,
  };
};

// Re-export for convenience.
export { thermometerQuestions } from "./data";
export { computeThermometerExclusion } from "./exclusion";
