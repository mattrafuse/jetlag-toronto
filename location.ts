import L from "leaflet";

export function addUserLocation(map: L.Map): void {
  map.locate({ setView: false, enableHighAccuracy: true });

  map.on("locationfound", (e: L.LocationEvent) => {
    L.circleMarker(e.latlng, {
      radius: 8,
      color: "#3388ff",
      fillColor: "#3388ff",
      fillOpacity: 0.8,
      weight: 2,
    }).addTo(map);
  });

  map.on("locationerror", () => {
    console.log("Location access denied or unavailable.");
  });
}
