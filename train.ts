import L from "leaflet";

// Vite glob‑import all Metrolinx GO / UP Express train GeoJSON files
const geojsonModules: Record<string, string> = import.meta.glob("./shapes/metrolinx/*.geojson", {
  query: "?raw",
  import: "default",
  eager: true,
});

export function addTrainLayers(map: L.Map): void {
  for (const data of Object.values(geojsonModules)) {
    const collection: GeoJSON.FeatureCollection = JSON.parse(data);

    const geojsonLayer = L.geoJSON(collection, {
      coordsToLatLng: (coords: [number, number]) => L.latLng(coords[1], coords[0]),
      style: (feature) => {
        const name: string | undefined = feature?.properties?.name;

        // UP Express — distinct light‑blue styling
        if (name?.startsWith("UP Express")) {
          return {
            color: "#0075D2",
            weight: 5,
            opacity: 0.8,
          };
        }

        // GO Train corridor colour map
        const colourMap: Record<string, string> = {
          BR: "#003767", // Barrie
          GT: "#00853e", // Kitchener
          KI: "#00853e",
          LE: "#ff0d00", // Lakeshore East
          LW: "#98002e", // Lakeshore West
          MI: "#f57f25", // Milton
          RH: "#0099c7", // Richmond Hill
          ST: "#794500", // Stouffville
        };

        // Try to match a colour from the route prefix (e.g. "BR - ...")
        let colour = "#666";
        if (name) {
          for (const [prefix, c] of Object.entries(colourMap)) {
            if (name.startsWith(prefix)) {
              colour = c;
              break;
            }
          }
        }

        return {
          color: colour,
          weight: 3,
          opacity: 0.7,
        };
      },
    });

    geojsonLayer.addTo(map);
  }
}
