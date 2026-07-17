/**
 * Resolves a Google Maps short URL (e.g. https://maps.app.goo.gl/...) by
 * following its redirect chain and extracting the lat/lng that Google hides on
 * the first click.
 *
 * The short link 301/302-redirects to something like:
 *   https://www.google.com/maps/search/43.661323,+-79.664893?entry=tts&...
 * where the coordinates appear as `lat,+-lng` in the path.
 */

const COORD_PAIR = /(-?\d+(?:\.\d+)?)\s*,\s*\+?(-?\d+(?:\.\d+)?)/;
// /@lat,lng,zoom — the "maps view" deep link, e.g.
//   https://www.google.com/maps/@43.6563644,-79.4494082,2050m/data=!3m1!1e3
const AT_COORD_PAIR = /@(-?\d+(?:\.\d+)?)\s*,\s*\+?(-?\d+(?:\.\d+)?)/;

export interface ResolvedLocation {
  url: string;
  lat: number;
  lng: number;
}

/**
 * Extracts a `lat,lng` pair from a Google Maps URL.
 * Handles both the `/search/lat,lng` form and the `/@lat,lng,zoom` "maps view"
 * deep link. Returns `null` when no coordinates can be found.
 */
export const parseCoordinates = (url: string): { lat: number; lng: number } | null => {
  // The /@ form is more specific (coordinates sit right after the @), so try it
  // first to avoid accidentally matching other numbers elsewhere in the URL.
  const atMatch = url.match(AT_COORD_PAIR);
  if (atMatch) {
    const lat = Number.parseFloat(atMatch[1]);
    const lng = Number.parseFloat(atMatch[2]);
    if (Number.isFinite(lat) && Number.isFinite(lng)) {
      return { lat, lng };
    }
  }

  const match = url.match(COORD_PAIR);
  if (!match) {
    return null;
  }
  const lat = Number.parseFloat(match[1]);
  const lng = Number.parseFloat(match[2]);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return null;
  }
  return { lat, lng };
};

/**
 * Resolves a Google Maps URL to its lat/lng.
 *
 * Some Google Maps URLs already embed the coordinates and don't require
 * following a redirect — for example the `/@lat,lng,zoom` "maps view" deep link
 * or a `/search/lat,lng` query. For those we parse the URL directly without
 * hitting the network. Otherwise (e.g. `maps.app.goo.gl` short links) we follow
 * the redirect chain and extract the coordinates from the final URL.
 *
 * Throws if no coordinates can be found.
 */
export const resolveGoogleMapsUrl = async (
  shortUrl: string,
  fetchImpl: typeof fetch = fetch,
): Promise<ResolvedLocation> => {
  // Fast path: coordinates are already in the URL — no network needed.
  const direct = parseCoordinates(shortUrl);
  if (direct) {
    return { url: shortUrl, lat: direct.lat, lng: direct.lng };
  }

  // Slow path: follow redirects (e.g. maps.app.goo.gl short links).
  const response = await fetchImpl(shortUrl, {
    redirect: "follow",
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to resolve URL (status ${response.status})`);
  }

  const coords = parseCoordinates(response.url);
  if (!coords) {
    throw new Error(`No coordinates found in resolved URL: ${response.url}`);
  }

  return { url: response.url, lat: coords.lat, lng: coords.lng };
};
