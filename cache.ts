import { registerRoute } from "workbox-routing";
import { CacheFirst } from "workbox-strategies";

registerRoute(
  ({ url }) => url.origin.includes("gis.toronto.ca") && url.pathname.endsWith("/query"),
  new CacheFirst({
    cacheName: "esri-feature-cache",
  }),
);
