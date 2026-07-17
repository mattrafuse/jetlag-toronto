// ── Custom Polygon Sidebar Controller ─────────────────────────
// Lets players draw a custom polygon on the map using leaflet-editable's
// drawing tools, then commit it as an exclusion question. The orchestrator
// creates and composes this controller; it never imports radar/thermometer
// code.

import type L from "leaflet";
import { type QuestionsStoreType, roundCoord } from "../store";
import type { AskedPolygonQuestion } from "./types";

export interface PolygonControllerDependencies {
  map: L.Map;
  store: QuestionsStoreType;
  nextId: () => string;
  onQuestionAsked: (question: AskedPolygonQuestion) => void;
}

export interface PolygonController {
  startPicking: () => void;
  clearPolygon: () => void;
  finishDrawing: () => void;
  submit: (answer: "yes" | "no") => void;
  destroy: () => void;
}

/** Create a custom-polygon controller bound to the given map and dependencies. */
export const createPolygonController = (deps: PolygonControllerDependencies): PolygonController => {
  const { map, store, nextId, onQuestionAsked } = deps;

  let currentLayer: L.Polygon | null = null;
  let createdHandler: ((e: L.LayerEvent) => void) | null = null;
  let vertexNewHandler: L.LeafletEventHandlerFn | null = null;
  let drawingEndHandler: (() => void) | null = null;

  // ── Layer cleanup ──────────────────────────────────────────
  const clearPolygon = (): void => {
    if (createdHandler) {
      map.off("editable:created", createdHandler);
      createdHandler = null;
    }
    if (vertexNewHandler) {
      map.off("editable:vertex:new", vertexNewHandler);
      vertexNewHandler = null;
    }
    if (drawingEndHandler) {
      map.off("editable:drawing:end", drawingEndHandler);
      drawingEndHandler = null;
    }
    if (currentLayer) {
      map.removeLayer(currentLayer);
      currentLayer = null;
    }
    store.update({ polygonDrawing: false, polygonDrawn: false });
  };

  // ── Drawing ───────────────────────────────────────────────
  const startPicking = (): void => {
    clearPolygon();

    let vertexCount = 0;

    // Capture the layer reference from `editable:created`, which fires
    // synchronously inside `startPolygon` (via createLayer).
    const onCreated = (e: L.LayerEvent): void => {
      currentLayer = e.layer as L.Polygon;
    };
    map.on("editable:created", onCreated);
    createdHandler = onCreated;

    // `editable:vertex:new` fires when the user actually places a vertex
    // (first map click). Only then is drawing "in progress" — so the Finish
    // button appears only after the user starts drawing, not on tab switch.
    const onVertexNew = (): void => {
      vertexCount += 1;

      // We have at least a triangle
      if (vertexCount > 2) {
        store.update({ polygonDrawing: true });
      }
    };
    map.on("editable:vertex:new", onVertexNew);
    vertexNewHandler = onVertexNew;

    // Only enable the answer buttons once the user has actually finished the
    // shape. `editable:drawing:end` fires on commit (double-click / close),
    // but ALSO when a mid-draw layer is removed (e.g. by clearPolygon()).
    // Guard against the latter: only treat it as a real commit if the layer
    // still exists and has at least 3 vertices (a valid polygon).
    const onDrawingEnd = (): void => {
      const latlngs = currentLayer?.getLatLngs() as L.LatLng[][] | undefined;
      const vertexCount = latlngs?.[0]?.length ?? 0;
      if (currentLayer && vertexCount >= 3) {
        store.update({ polygonDrawing: false, polygonDrawn: true });
      } else {
        store.update({ polygonDrawing: false, polygonDrawn: false });
      }
    };
    map.on("editable:drawing:end", onDrawingEnd);
    drawingEndHandler = onDrawingEnd;

    const layer = map.editTools.startPolygon(undefined, {
      color: "#9c27b0",
      weight: 2,
      fillColor: "#9c27b0",
      fillOpacity: 0.15,
    });
    currentLayer = layer;
  };

  // ── Finish drawing (programmatic commit) ───────────────────
  const finishDrawing = (): void => {
    if (!currentLayer || !store.get().polygonDrawing) return;
    map.editTools.commitDrawing(undefined as unknown as L.LeafletMouseEvent);
  };

  // ── Submission ─────────────────────────────────────────────
  const submit = (answer: "yes" | "no"): void => {
    if (!currentLayer || !store.get().polygonDrawn) return;

    const latlngs = currentLayer.getLatLngs() as L.LatLng[][];
    const rings: [number, number][][] = latlngs.map((ring) => {
      const coords = ring.map((ll) => [roundCoord(ll.lat), roundCoord(ll.lng)] as [number, number]);
      // Turf requires the ring to be explicitly closed (first == last).
      if (coords.length > 0) {
        const first = coords[0];
        const last = coords[coords.length - 1];
        if (first[0] !== last[0] || first[1] !== last[1]) {
          coords.push([...first]);
        }
      }
      return coords;
    });

    const question: AskedPolygonQuestion = {
      id: nextId(),
      type: "polygon",
      label: "Custom Polygon",
      rings,
      answer,
      timestamp: Date.now(),
    };

    onQuestionAsked(question);
    clearPolygon();
  };

  return {
    startPicking,
    clearPolygon,
    finishDrawing,
    submit,
    destroy: clearPolygon,
  };
};

// Re-export for convenience so the orchestrator can import everything
// from the controller module.
export { computePolygonExclusion } from "./exclusion";
