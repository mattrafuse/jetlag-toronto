import L from "leaflet";

// Add CSS for pulsing animation on the user location marker
const style = document.createElement("style");
style.textContent = `
  .user-location-pulse {
    animation: pulse-ring 2s ease-out infinite;
  }
  @keyframes pulse-ring {
    0% { opacity: 0.5; }
    50% { opacity: 0.15; }
    100% { opacity: 0.5; }
  }
`;
document.head.append(style);

// Keep a reference to the map and the last known location so the
// "locate" button can focus the map on the user without re-querying.
let mapRef: L.Map | null = null;
let lastLatLng: L.LatLng | null = null;

// Whether a valid location has ever been obtained. Used to decide
// whether the locate button should be shown at all.
let locationAvailable = false;

// Subscribe to location-availability changes. Returns an unsubscribe fn.
export const onLocationAvailabilityChange = (cb: (available: boolean) => void): (() => void) => {
  availabilityCallbacks.push(cb);
  // Immediately notify with the current state.
  cb(locationAvailable);
  return () => {
    const i = availabilityCallbacks.indexOf(cb);
    if (i >= 0) availabilityCallbacks.splice(i, 1);
  };
};

const availabilityCallbacks: ((available: boolean) => void)[] = [];

const setLocationAvailable = (available: boolean): void => {
  if (locationAvailable === available) return;
  locationAvailable = available;
  for (const cb of availabilityCallbacks) cb(available);
};

// Number of recent positions to average for smoothing out GPS noise.
const SMOOTHING_WINDOW = 5;

// Rolling buffer of the most recent raw positions reported by the browser.
const recentPositions: L.LatLng[] = [];

// Compute the simple average (centroid) of the buffered positions.
const averagePosition = (): L.LatLng | null => {
  if (recentPositions.length === 0) return null;
  let latSum = 0;
  let lngSum = 0;
  for (const p of recentPositions) {
    latSum += p.lat;
    lngSum += p.lng;
  }
  return L.latLng(latSum / recentPositions.length, lngSum / recentPositions.length);
};

export const addUserLocation = (map: L.Map): L.LayerGroup => {
  const group = L.layerGroup();

  // Create a custom pane that sits above everything else
  const pane = map.createPane("userLocation");
  pane.style.zIndex = "1000";

  let marker: L.CircleMarker | null = null;
  let pulseRing: L.CircleMarker | null = null;

  mapRef = map;

  // Watch the user's live location and follow them on the map
  map.locate({
    enableHighAccuracy: true,
    watch: true,
    maxZoom: 16,
  });

  map.on("locationfound", (e: L.LocationEvent) => {
    // Buffer the raw position and keep only the most recent few.
    recentPositions.push(e.latlng);
    if (recentPositions.length > SMOOTHING_WINDOW) {
      recentPositions.shift();
    }

    // Use the smoothed (averaged) position for the marker.
    const smoothed = averagePosition();
    if (!smoothed) return;
    lastLatLng = smoothed;
    setLocationAvailable(true);

    if (marker) {
      // Update existing marker positions as the user moves
      marker.setLatLng(smoothed);
      pulseRing?.setLatLng(smoothed);
    } else {
      // Outer pulsing ring
      pulseRing = L.circleMarker(e.latlng, {
        radius: 12,
        color: "#3388ff",
        fillColor: "#3388ff",
        fillOpacity: 0.3,
        weight: 2,
        pane: "userLocation",
        className: "user-location-pulse",
      }).addTo(group);

      // Inner solid dot
      marker = L.circleMarker(e.latlng, {
        radius: 8,
        color: "#3388ff",
        fillColor: "#3388ff",
        fillOpacity: 1,
        weight: 3,
        pane: "userLocation",
      }).addTo(group);
    }
  });

  // If geolocation fails (denied, unavailable, timeout), hide the button.
  map.on("locationerror", () => {
    setLocationAvailable(false);
  });

  group.addTo(map);
  return group;
};

// ── Focus the map on the user's location ──────────────────────
// Pans/zooms to the last known location, or re-queries if unknown.
export const focusUserLocation = (): void => {
  if (!mapRef) return;

  if (lastLatLng) {
    mapRef.setView(lastLatLng, Math.max(mapRef.getZoom(), 16), { animate: true });
  } else {
    // No location cached yet — ask the browser again.
    mapRef.locate({ enableHighAccuracy: true, setView: true, maxZoom: 16 });
  }
};
