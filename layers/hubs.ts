import type { StationOptions } from "./station";

// ── Hub Stations ───────────────────────────────────────────────
// A "hub" is a station that appears under multiple names / across multiple
// transit layers (e.g. Union Station as a GO corridor stop and a TTC subway
// stop, or Kennedy as both a GO and TTC station). Rather than rendering one
// marker per source, we buffer every matching station and merge them into a
// single averaged entry once all layers have registered.
//
// Add a new hub by appending to HUBS — no other code changes are required.

export interface HubDefinition {
  /** Stable identifier used for the merged station's registry id (`hub-<id>`). */
  id: string;
  /** Display label for the merged station. */
  label: string;
  /** Fill colour applied to the merged marker and radius circle. */
  color: string;
  /** Returns true if a station name belongs to this hub. */
  match: (name: string) => boolean;
}

const HUB_COLOR = "#ff0084";

export const HUBS: HubDefinition[] = [
  {
    id: "Union Station",
    label: "Union Station",
    color: HUB_COLOR,
    match: (name) => name.includes("Union Station") || name === "Union",
  },
  {
    id: "Kennedy",
    label: "Kennedy Station",
    color: HUB_COLOR,
    match: (name) => name.toLowerCase().includes("kennedy"),
  },
  {
    id: "Weston",
    label: "Weston",
    color: HUB_COLOR,
    match: (name) => name.includes("Weston"),
  },
  {
    id: "Mount Dennis",
    label: "Mount Dennis",
    color: HUB_COLOR,
    match: (name) => name.includes("Mount Dennis"),
  },
  {
    id: "Eglinton",
    label: "Eglinton",
    color: HUB_COLOR,
    match: (name) => name === "Eglinton" || name === "Eglinton Station",
  },
  {
    id: "Cedarvale",
    label: "Cedarvale",
    color: HUB_COLOR,
    match: (name) => name === "Cedarvale Station" || name === "Eglinton West",
  },
  {
    id: "Bloor-Yonge",
    label: "Bloor-Yonge",
    color: HUB_COLOR,
    match: (name) => name === "Bloor-Yonge",
  },
  {
    id: "St George",
    label: "St George",
    color: HUB_COLOR,
    match: (name) => name === "St George",
  },
];

export const findHub = (name: string): HubDefinition | undefined =>
  HUBS.find((hub) => hub.match(name));

// Options used when creating the merged hub station. Exposed so callers can
// pass them straight into createStation with `__skipHub` set.
export const hubStationOptions = (hub: HubDefinition): StationOptions => ({
  fillColor: hub.color,
  circle: { fillColor: hub.color, fillOpacity: 0.5 },
  label: hub.label,
  __skipHub: true,
});
