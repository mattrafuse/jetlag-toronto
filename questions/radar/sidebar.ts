// ── Radar Sidebar Controller ────────────────────────────────────
// Encapsulates all radar-specific map interaction: marker placement,
// radius preview, and submission. The orchestrator creates and
// composes this controller; it never imports thermometer code.

import L from "leaflet";
import { type QuestionsStoreType, roundCoord } from "../store";
import { radarQuestions } from "./data";
import type { AskedRadarQuestion } from "./types";

const MILES_TO_METERS = 1609.344;

export interface RadarControllerDependencies {
  map: L.Map;
  store: QuestionsStoreType;
  nextId: () => string;
  onQuestionAsked: (question: AskedRadarQuestion) => void;
}

export interface RadarController {
  startPicking: () => void;
  clearMarker: () => void;
  submit: (answer: "yes" | "no") => void;
  setCenter: (lat: number, lng: number) => void;
  destroy: () => void;
}

/** Create a radar controller bound to the given map and dependencies. */
export const createRadarController = (deps: RadarControllerDependencies): RadarController => {
  const { map, store, nextId, onQuestionAsked } = deps;

  let center: [number, number] | null = null;
  let centerMarker: L.Marker | null = null;
  let radiusPreview: L.Circle | null = null;
  let clickHandler: ((e: L.LeafletMouseEvent) => void) | null = null;

  // ── Radius preview ──────────────────────────────────────────
  const updateRadiusPreview = (): void => {
    if (!center) return;
    const s = store.get();
    const distance =
      s.radarUseCustom && !Number.isNaN(s.radarCustomDistance) && s.radarCustomDistance > 0
        ? s.radarCustomDistance
        : s.radarDistance;

    if (radiusPreview) {
      map.removeLayer(radiusPreview);
      radiusPreview = null;
    }
    radiusPreview = L.circle(center, {
      radius: distance * MILES_TO_METERS,
      color: "#3388ff",
      weight: 2,
      dashArray: "5, 5",
      fillColor: "#3388ff",
      fillOpacity: 0.08,
    }).addTo(map);
  };

  // ── Marker cleanup ──────────────────────────────────────────
  const clearMarker = (): void => {
    if (centerMarker) {
      map.removeLayer(centerMarker);
      centerMarker = null;
    }
    if (radiusPreview) {
      map.removeLayer(radiusPreview);
      radiusPreview = null;
    }
    center = null;
    store.update({ radarCenter: null, radarLat: "", radarLng: "" });
  };

  // ── Picking ─────────────────────────────────────────────────
  const startPicking = (): void => {
    clearMarker();
    clickHandler = (e: L.LeafletMouseEvent) => {
      const s = store.get();
      if (!s.panelOpen || s.activeTab !== "radar") return;
      center = [e.latlng.lat, e.latlng.lng];
      if (centerMarker) {
        centerMarker.setLatLng(e.latlng);
      } else {
        centerMarker = L.marker(e.latlng, {
          icon: L.divIcon({
            className: "questions-radar-marker",
            html: `
              <div class="questions-radar-bullseye">
                <span class="ring ring-outer"></span>
                <span class="ring ring-mid"></span>
                <span class="ring ring-inner"></span>
              </div>`,
            iconSize: [36, 36],
            iconAnchor: [18, 18],
          }),
        }).addTo(map);
      }
      updateRadiusPreview();
      store.update({
        radarCenter: center,
        radarLat: String(roundCoord(center[0])),
        radarLng: String(roundCoord(center[1])),
      });
    };
    map.on("click", clickHandler);
  };

  // ── Set center from lat/lng inputs ──────────────────────────
  const setCenter = (lat: number, lng: number): void => {
    center = [lat, lng];
    const latlng = L.latLng(lat, lng);
    if (centerMarker) {
      centerMarker.setLatLng(latlng);
    } else {
      centerMarker = L.marker(latlng, {
        icon: L.divIcon({
          className: "questions-radar-marker",
          html: `
            <div class="questions-radar-bullseye">
              <span class="ring ring-outer"></span>
              <span class="ring ring-mid"></span>
              <span class="ring ring-inner"></span>
            </div>`,
          iconSize: [36, 36],
          iconAnchor: [18, 18],
        }),
      }).addTo(map);
    }
    updateRadiusPreview();
    store.update({ radarCenter: center });
  };

  // ── Submission ──────────────────────────────────────────────
  const submit = (answer: "yes" | "no"): void => {
    if (!center) return;
    const s = store.get();
    let distance: number;
    let label: string;

    if (s.radarUseCustom && !Number.isNaN(s.radarCustomDistance) && s.radarCustomDistance > 0) {
      distance = s.radarCustomDistance;
      label = `${s.radarCustomDistance} Mile${s.radarCustomDistance === 1 ? "" : "s"}`;
    } else {
      const selected = radarQuestions.find((q) => q.distance === s.radarDistance);
      if (!selected) return;
      distance = selected.distance;
      label = selected.label;
    }

    const question: AskedRadarQuestion = {
      id: nextId(),
      type: "radar",
      distance,
      label,
      center,
      answer,
      timestamp: Date.now(),
    };

    onQuestionAsked(question);
    clearMarker();
  };

  // Keep the radius preview in sync with distance changes from the UI.
  store.subscribe(() => {
    if (center) updateRadiusPreview();
  });

  return {
    startPicking,
    clearMarker,
    submit,
    setCenter,
    destroy: clearMarker,
  };
};

// Re-export for convenience so the orchestrator can import everything
// from the controller module.
export { radarQuestions } from "./data";
export { computeRadarExclusion } from "./exclusion";
