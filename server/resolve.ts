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

export interface ResolvedLocation {
  url: string;
  lat: number;
  lng: number;
}

/**
 * Extracts a `lat,lng` pair from a resolved Google Maps URL.
 * Returns `null` when no coordinates can be found.
 */
export function parseCoordinates(resolvedUrl: string): { lat: number; lng: number } | null {
  const match = resolvedUrl.match(COORD_PAIR);
  if (!match) {
    return null;
  }
  const lat = Number.parseFloat(match[1]);
  const lng = Number.parseFloat(match[2]);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return null;
  }
  return { lat, lng };
}

/**
 * Follows the redirect chain for `shortUrl` and returns the resolved location.
 * Throws if the URL cannot be fetched or no coordinates are present.
 */
export async function resolveGoogleMapsUrl(
  shortUrl: string,
  fetchImpl: typeof fetch = fetch,
): Promise<ResolvedLocation> {
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
}
