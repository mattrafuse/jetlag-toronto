import * as turf from "@turf/turf";
import L from "leaflet";
import { QUARTER_MILE } from "../constants";
import type { RegisteredStation } from "./types";

// ── Station Registry ───────────────────────────────────────────
// Singleton that tracks all station markers and their quarter-mile
// radius circles so the question system can hide/restore them.
class StationRegistry {
  private stations: Map<string, RegisteredStation> = new Map();
  private map: L.Map | null = null;

  // Persistent exclusion state keyed by station id. This survives re-registration,
  // which happens when esri-leaflet featureLayers re-fetch and re-render their
  // markers on map zoom/move. Without it, removed/grayed stations would reappear.
  private removedIds: Set<string> = new Set();
  private grayedIds: Set<string> = new Set();

  setMap(map: L.Map): void {
    this.map = map;
  }

  register(
    id: string,
    latlng: L.LatLng,
    circle: L.Circle,
    marker: L.CircleMarker,
    layerGroup: L.FeatureGroup,
  ): void {
    const wasRemoved = this.removedIds.has(id);
    const wasGrayed = this.grayedIds.has(id);

    const station: RegisteredStation = {
      id,
      latlng,
      circle,
      marker,
      layerGroup,
      removed: wasRemoved,
    };
    this.stations.set(id, station);

    // Re-apply persistent exclusion state to the freshly created layer.
    // We hide via opacity (not map removal) so that esri-leaflet featureLayers,
    // which re-add their cached layers on every zoom/move, cannot undo it.
    if (wasRemoved) {
      this.setHidden(station, true);
    } else if (wasGrayed) {
      this.grayOutStation(id);
    }
  }

  getAll(): RegisteredStation[] {
    return Array.from(this.stations.values());
  }

  getActive(): RegisteredStation[] {
    return this.getAll().filter((s) => !s.removed);
  }

  /**
   * Hide/unhide a station by setting its opacity to 0 rather than removing it
   * from the map. This is critical for esri-leaflet featureLayers: they re-add
   * their cached layers to the map on every zoom/move, which would otherwise
   * resurrect a removed station. A layer that is still on the map (just
   * invisible) is never re-added by esri, and esri never resets a FeatureGroup's
   * child styles, so the hidden state survives re-renders.
   */
  private setHidden(station: RegisteredStation, hidden: boolean): void {
    const o = hidden ? 0 : 1;
    station.marker.setStyle({ opacity: o, fillOpacity: o });
    station.circle.setStyle({ opacity: o, fillOpacity: hidden ? 0 : 0.25 });
  }

  removeStation(id: string): void {
    const station = this.stations.get(id);
    if (!station || station.removed) return;
    this.setHidden(station, true);
    station.removed = true;
    this.removedIds.add(id);
  }

  restoreStation(id: string): void {
    const station = this.stations.get(id);
    if (!station || !station.removed) return;
    this.setHidden(station, false);
    station.removed = false;
    this.removedIds.delete(id);
  }

  /** Gray out a station (reduce opacity) without removing it. */
  grayOutStation(id: string): void {
    const station = this.stations.get(id);
    if (!station) return;
    station.marker.setStyle({ fillOpacity: 0.2, opacity: 0.2 });
    station.circle.setStyle({ fillOpacity: 0.05, opacity: 0.1 });
    this.grayedIds.add(id);
  }

  /** Restore a grayed-out station to full opacity. */
  unGrayStation(id: string): void {
    const station = this.stations.get(id);
    if (!station) return;
    station.marker.setStyle({ fillOpacity: 1, opacity: 1 });
    station.circle.setStyle({ fillOpacity: 0.25, opacity: 1 });
    this.grayedIds.delete(id);
  }

  /**
   * Returns IDs of stations whose entire quarter-mile radius circle
   * is fully contained within the given exclusion polygon.
   */
  getStationIdsInExclusionZone(exclusionPolygon: GeoJSON.Feature<GeoJSON.Polygon>): string[] {
    const ids: string[] = [];
    for (const station of this.stations.values()) {
      // Build a GeoJSON circle from the station's lat/lng and quarter-mile radius
      const center = turf.point([station.latlng.lng, station.latlng.lat]);
      const circle = turf.circle(center, QUARTER_MILE / 1000, { units: "kilometers", steps: 32 });

      if (turf.booleanWithin(circle, exclusionPolygon)) {
        ids.push(station.id);
      }
    }
    return ids;
  }

  /** Reset all stations to visible, un-grayed state. */
  resetAll(): void {
    this.removedIds.clear();
    this.grayedIds.clear();
    for (const station of this.stations.values()) {
      if (station.removed) {
        this.restoreStation(station.id);
      }
      this.unGrayStation(station.id);
    }
  }
}

export const stationRegistry = new StationRegistry();
