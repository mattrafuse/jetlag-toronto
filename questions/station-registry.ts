import * as turf from "@turf/turf";
import L from "leaflet";
import { EXCLUSION_RADIUS_FRACTION, QUARTER_MILE } from "../constants";
import { findHub, HUBS, hubStationOptions } from "layers/hubs";
import { createStation } from "layers/station";
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

  // Pending hub members: stations whose name matches a hub definition but whose
  // merged entry has not yet been created. Keyed by hub id. We buffer them so
  // that stations arriving from different layers (e.g. TTC subway vs GO train)
  // can be averaged into a single merged marker.
  private hubMembers: Map<string, RegisteredStation[]> = new Map();

  // Hubs that have already been merged. Used to keep mergeHubs idempotent in
  // the face of esri-leaflet re-registration (subway markers are re-created and
  // re-registered on every zoom/move). Once a hub is merged, any later member
  // registration is simply hidden rather than buffered again.
  private mergedHubs: Set<string> = new Set();

  setMap(map: L.Map): void {
    this.map = map;
  }

  // Listener invoked whenever the registry's station set changes (e.g. after
  // async layers finish registering and mergeHubs runs). The React UI uses
  // this to keep its station list in sync; without it, stations that arrive
  // after the initial synchronous refresh (e.g. the TTC subway layer, which
  // loads over the network) never appear in the sidebar until a question is
  // resolved and forces a refresh.
  private onChange: (() => void) | null = null;

  setOnChange(fn: () => void): void {
    this.onChange = fn;
  }

  private notifyChange(): void {
    this.onChange?.();
  }

  register(
    id: string,
    name: string,
    latlng: L.LatLng,
    circle: L.Circle,
    marker: L.CircleMarker,
    layerGroup: L.FeatureGroup,
    options?: { __skipHub?: boolean },
  ): void {
    const wasRemoved = this.removedIds.has(id);
    const wasGrayed = this.grayedIds.has(id);

    const station: RegisteredStation = {
      id,
      name,
      latlng,
      circle,
      marker,
      layerGroup,
      removed: wasRemoved,
      grayed: wasGrayed,
    };

    // If this station belongs to a hub (and isn't the merged hub station
    // itself), buffer it instead of registering it directly. We merge all
    // members into a single averaged entry once they've all arrived.
    const hub = options?.__skipHub ? undefined : findHub(name);
    if (hub) {
      if (this.mergedHubs.has(hub.id)) {
        // Hub already merged (e.g. subway re-registered on zoom/move, or a
        // member arrived after the synchronous pre-subway merge). Hide this
        // duplicate member and unbind its tooltip so it doesn't linger.
        this.setHidden(station, true);
        station.marker.unbindTooltip();
        return;
      }

      const members = this.hubMembers.get(hub.id) ?? [];
      members.push(station);
      this.hubMembers.set(hub.id, members);

      // Re-apply persistent exclusion state to the buffered member so it stays
      // consistent with the merged entry once created.
      if (wasRemoved) {
        this.setHidden(station, true);
      } else if (wasGrayed) {
        this.grayOutStation(id);
      }
      return;
    }

    this.stations.set(id, station);

    // Re-apply persistent exclusion state to the freshly created layer.
    // We hide via opacity (not map removal) so that esri-leaflet featureLayers,
    // which re-add their cached layers on every zoom/move, cannot undo it.
    if (wasRemoved) {
      this.setHidden(station, true);
    } else if (wasGrayed) {
      this.grayOutStation(id);
    }
    // Global label visibility is handled via a CSS class on the map container
    // (see setLabelsVisible), so no per-marker work is needed here.
  }

  /**
   * Merge every buffered hub member into a single averaged station entry.
   * Call this once all layers have finished registering their stations. Each
   * hub produces one `hub-<id>` station at the mean of its members' positions;
   * the individual member markers are hidden (not removed, so esri-leaflet
   * re-renders can't resurrect them) and folded into the merged entry.
   */
  mergeHubs(): void {
    for (const [hubId, members] of this.hubMembers) {
      if (members.length === 0) continue;

      const hub = HUBS.find((h) => h.id === hubId)!;
      const avgLat = members.reduce((s, m) => s + m.latlng.lat, 0) / members.length;
      const avgLng = members.reduce((s, m) => s + m.latlng.lng, 0) / members.length;
      const mergedLatLng = L.latLng(avgLat, avgLng);

      const { group: mergedGroup } = createStation(`hub-${hub.id}`, mergedLatLng, {
        ...hubStationOptions(hub),
      });

      // Add the merged marker to the map and hide the individual member markers
      // (keep them on the map so esri re-renders can't undo the merge).
      if (this.map) {
        mergedGroup.addTo(this.map);
      }
      for (const member of members) {
        this.setHidden(member, true);
        // The member's permanent tooltip would otherwise linger on the map even
        // though the marker is invisible, so unbind it entirely.
        member.marker.unbindTooltip();
      }

      const merged: RegisteredStation = {
        id: `hub-${hub.id}`,
        name: hub.label,
        latlng: mergedLatLng,
        circle: mergedGroup.getLayers()[1] as L.Circle,
        marker: mergedGroup.getLayers()[0] as L.CircleMarker,
        layerGroup: mergedGroup,
        removed: false,
        grayed: false,
      };
      this.stations.set(merged.id, merged);
      this.mergedHubs.add(hub.id);
    }

    this.hubMembers.clear();

    // Async layers (e.g. the TTC subway featureLayer) register their stations
    // and then call mergeHubs once their `load` event fires — after the
    // initial synchronous refresh in initQuestions has already run. Notify the
    // listener so the sidebar's station list picks up the newly arrived
    // stations.
    this.notifyChange();
  }

  getAll(): RegisteredStation[] {
    return Array.from(this.stations.values());
  }

  /**
   * Show or hide all station name labels. We toggle a CSS class on the map
   * container rather than opening/closing each tooltip: esri-leaflet
   * featureLayers add their markers to the map asynchronously (and re-add them
   * on every zoom/move), and a permanent tooltip re-opens on the marker's
   * `add` event — which would otherwise undo any closeTooltip() call. A CSS
   * class on the container hides labels no matter when the marker is added.
   */
  setLabelsVisible(visible: boolean): void {
    if (this.map) {
      this.map.getContainer().classList.toggle("hide-labels", !visible);
    }
  }

  /**
   * Show or hide all merged hub stations (e.g. Union, Kennedy). These are added
   * directly to the map rather than to a layer group, so the layer toggles in
   * settings.ts call this to keep them in sync with the train/subway layers.
   */
  setHubStationsVisible(visible: boolean): void {
    for (const station of this.stations.values()) {
      if (station.id.startsWith("hub-")) {
        this.setHidden(station, !visible);
      }
    }
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
  /**
   * (Re-)bind a station's permanent name label. The label is a Leaflet
   * tooltip; unbinding it (rather than just hiding it via CSS) is what keeps
   * it from re-appearing when esri-leaflet re-adds the marker on zoom/move —
   * the binding lives on the marker object, so it survives re-renders.
   */
  private bindLabel(station: RegisteredStation): void {
    station.marker.bindTooltip(station.name, {
      permanent: true,
      direction: "top",
      className: "label",
      offset: [0, -4],
    });
  }

  private setHidden(station: RegisteredStation, hidden: boolean): void {
    const o = hidden ? 0 : 1;
    station.marker.setStyle({ opacity: o, fillOpacity: o });
    station.circle.setStyle({ opacity: o, fillOpacity: hidden ? 0 : 0.25 });
    // A permanent tooltip is a separate DOM element that is NOT affected by the
    // marker's opacity, so an excluded station would still show its label.
    // Unbind it (and re-bind on restore) so the label hides with the station.
    if (hidden) {
      station.marker.unbindTooltip();
    } else {
      this.bindLabel(station);
    }
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
    // Hide the permanent label too (see setHidden for why unbinding is used).
    station.marker.unbindTooltip();
    station.grayed = true;
    this.grayedIds.add(id);
  }

  /** Restore a grayed-out station to full opacity. */
  unGrayStation(id: string): void {
    const station = this.stations.get(id);
    if (!station) return;
    station.marker.setStyle({ fillOpacity: 1, opacity: 1 });
    station.circle.setStyle({ fillOpacity: 0.25, opacity: 1 });
    this.bindLabel(station);
    station.grayed = false;
    this.grayedIds.delete(id);
  }

  /**
   * Returns every registered station with its current exclusion status,
   * sorted alphabetically by name. A station is "excluded" when it has been
   * removed (hidden) or grayed out by the question system.
   */
  getStationStatuses(): { id: string; name: string; excluded: boolean }[] {
    return this.getAll()
      .map((s) => ({ id: s.id, name: s.name, excluded: s.removed || s.grayed }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  /**
   * Returns IDs of stations whose entire quarter-mile radius circle
   * is fully contained within the given exclusion polygon.
   */
  getStationIdsInExclusionZone(exclusionPolygon: GeoJSON.Feature<GeoJSON.Polygon>): string[] {
    const ids: string[] = [];
    for (const station of this.stations.values()) {
      // Build a GeoJSON circle from the station's lat/lng and quarter-mile radius.
      // We shrink the radius by EXCLUSION_RADIUS_FRACTION so that stations near
      // the game border — whose full quarter-mile circle spills outside the
      // border-clipped exclusion polygon — are still correctly excluded.
      const center = turf.point([station.latlng.lng, station.latlng.lat]);
      const circle = turf.circle(center, (QUARTER_MILE / 1000) * EXCLUSION_RADIUS_FRACTION, {
        units: "kilometers",
        steps: 32,
      });

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
