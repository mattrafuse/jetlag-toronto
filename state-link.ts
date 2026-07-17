// ── Game state link (export / import via URL) ─────────────────
// Encodes the entire localStorage-backed game state into URL query
// parameters so it can be shared as a single link. Each localStorage
// key becomes its own query parameter whose value is the base64url-
// encoded JSON string stored under that key.
//
// This is intentionally generic: the export/import logic scans every
// key currently present in localStorage, so any new key added elsewhere
// in the app is exported and restored automatically — no code changes
// are required here when the set of keys grows.

// Minimal structural type for the parts of the Web Storage API we use.
// Using this (rather than the concrete `Storage`) keeps the pure helpers
// trivially testable with an in-memory mock.
export interface KeyValueStore {
  length: number;
  key(index: number): string | null;
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

// ── base64url helpers (UTF-8 safe) ────────────────────────────
// `btoa`/`atob` only handle Latin1, so we round-trip through bytes via
// TextEncoder/TextDecoder to safely encode arbitrary (e.g. Unicode) JSON.
export const base64urlEncode = (input: string): string => {
  const bytes = new TextEncoder().encode(input);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
};

export const base64urlDecode = (input: string): string => {
  const normalized = input.replace(/-/g, "+").replace(/_/g, "/");
  const binary = atob(normalized);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new TextDecoder().decode(bytes);
};

// ── Pure encode / decode of a state map ───────────────────────
// Each key maps to its own parameter; the value is the base64url-encoded
// raw localStorage string (which is already JSON for this app).
export const encodeState = (state: Record<string, string>): URLSearchParams => {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(state)) {
    params.set(key, base64urlEncode(value));
  }
  return params;
};

export const decodeState = (params: URLSearchParams): Record<string, string> => {
  const state: Record<string, string> = {};
  params.forEach((encoded, key) => {
    state[key] = base64urlDecode(encoded);
  });
  return state;
};

// ── Read / write the full localStorage state ──────────────────
export const readLocalStorage = (storage: KeyValueStore = localStorage): Record<string, string> => {
  const state: Record<string, string> = {};
  for (let i = 0; i < storage.length; i++) {
    const key = storage.key(i);
    if (key === null) continue;
    const value = storage.getItem(key);
    if (value !== null) state[key] = value;
  }
  return state;
};

export const writeLocalStorage = (
  state: Record<string, string>,
  storage: KeyValueStore = localStorage,
): void => {
  for (const [key, value] of Object.entries(state)) {
    storage.setItem(key, value);
  }
};

// ── High-level export / import ────────────────────────────────
// Build a shareable URL whose query string carries the full game state.
// `base` defaults to the current page (origin + pathname, dropping any
// existing query so we don't accumulate stale params on re-export).
export const buildShareUrl = (
  storage: KeyValueStore = localStorage,
  base: string = `${location.origin}${location.pathname}`,
): string => {
  const params = encodeState(readLocalStorage(storage));
  const url = new URL(base);
  url.search = params.toString();
  return url.toString();
};

// Restore game state from a URL's query string into localStorage.
// Returns true if any state was applied, false when there are no
// parameters (i.e. a normal visit with nothing to import).
export const applyStateFromUrl = (
  search: string = location.search,
  storage: KeyValueStore = localStorage,
): boolean => {
  const params = new URLSearchParams(search);
  if (params.size === 0) return false;
  writeLocalStorage(decodeState(params), storage);
  return true;
};
