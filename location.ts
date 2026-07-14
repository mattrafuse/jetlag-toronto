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

export function addUserLocation(map: L.Map): L.LayerGroup {
  const group = L.layerGroup();

  // Create a custom pane that sits above everything else
  const pane = map.createPane("userLocation");
  pane.style.zIndex = "1000";

  let marker: L.CircleMarker | null = null;
  let pulseRing: L.CircleMarker | null = null;

  // Watch the user's live location and follow them on the map
  map.locate({
    enableHighAccuracy: true,
    watch: true,
    maxZoom: 16,
  });

  map.on("locationfound", (e: L.LocationEvent) => {
    if (marker) {
      // Update existing marker positions as the user moves
      marker.setLatLng(e.latlng);
      pulseRing?.setLatLng(e.latlng);
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

  map.on("locationerror", () => {
    console.log("Location access denied or unavailable.");
  });

  group.addTo(map);
  return group;
}
