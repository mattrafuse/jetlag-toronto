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
    this.stations.set(id, {
      id,
      latlng,
      circle,
      marker,
      layerGroup,
      removed: false,
    });
  }

  getAll(): RegisteredStation[] {
    return Array.from(this.stations.values());
  }

  getActive(): RegisteredStation[] {
    return this.getAll().filter((s) => !s.removed);
  }

  removeStation(id: string): void {
    const station = this.stations.get(id);
    if (!station || station.removed) return;
    station.layerGroup.remove();
    station.removed = true;
  }

  restoreStation(id: string): void {
    const station = this.stations.get(id);
    if (!station || !station.removed || !this.map) return;
    station.layerGroup.addTo(this.map);
    station.removed = false;
  }

  /** Gray out a station (reduce opacity) without removing it. */
  grayOutStation(id: string): void {
    const station = this.stations.get(id);
    if (!station) return;
    station.marker.setStyle({ fillOpacity: 0.2, opacity: 0.2 });
    station.circle.setStyle({ fillOpacity: 0.05, opacity: 0.1 });
  }

  /** Restore a grayed-out station to full opacity. */
  unGrayStation(id: string): void {
    const station = this.stations.get(id);
    if (!station) return;
    station.marker.setStyle({ fillOpacity: 1, opacity: 1 });
    station.circle.setStyle({ fillOpacity: 0.25, opacity: 1 });
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
    for (const station of this.stations.values()) {
      if (station.removed) {
        this.restoreStation(station.id);
      }
      this.unGrayStation(station.id);
    }
  }
}

export const stationRegistry = new StationRegistry();
