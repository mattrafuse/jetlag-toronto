import { describe, expect, it } from "vitest";
import {
  applyStateFromUrl,
  base64urlDecode,
  base64urlEncode,
  buildShareUrl,
  decodeState,
  encodeState,
  readLocalStorage,
  writeLocalStorage,
  type KeyValueStore,
} from "./link";

// ── In-memory KeyValueStore mock ──────────────────────────────
// Mirrors the Web Storage API surface used by the module so the pure
// helpers can be tested without touching the real localStorage.
const makeStore = (): KeyValueStore & { toObject(): Record<string, string> } => {
  const map = new Map<string, string>();
  return {
    get length() {
      return map.size;
    },
    key(index: number) {
      return Array.from(map.keys())[index] ?? null;
    },
    getItem(key: string) {
      return map.has(key) ? (map.get(key) as string) : null;
    },
    setItem(key: string, value: string) {
      map.set(key, value);
    },
    toObject() {
      return Object.fromEntries(map);
    },
  };
};

// ── base64url round-trip ──────────────────────────────────────
describe("base64url", () => {
  it("round-trips plain ASCII JSON", () => {
    const json = JSON.stringify({ a: 1, b: "two" });
    expect(base64urlDecode(base64urlEncode(json))).toBe(json);
  });

  it("round-trips Unicode (non-Latin1) content", () => {
    const json = JSON.stringify({ name: "Café ☕ 🚆 日本語" });
    expect(base64urlDecode(base64urlEncode(json))).toBe(json);
  });

  it("uses URL-safe alphabet (no +, /, or = padding)", () => {
    const encoded = base64urlEncode("any carnal pleasure.");
    expect(encoded).not.toMatch(/[+/=]/);
  });
});

// ── encodeState / decodeState ─────────────────────────────────
describe("encodeState / decodeState", () => {
  it("gives each key its own parameter", () => {
    const params = encodeState({
      "jetlag-map-settings": '{"chk-trains":true}',
      "jetlag-questions": '[{"id":"q1"}]',
    });
    expect(params.has("jetlag-map-settings")).toBe(true);
    expect(params.has("jetlag-questions")).toBe(true);
    expect(params.size).toBe(2);
  });

  it("round-trips a full state map", () => {
    const state = {
      "jetlag-map-settings": '{"chk-dark":false}',
      "jetlag-map-view": '{"center":[43.6,-79.3],"zoom":12}',
      "jetlag-questions": "[]",
      "jetlag-question-settings": '{"showRemoved":true}',
    };
    expect(decodeState(encodeState(state))).toEqual(state);
  });

  it("produces URL-safe values", () => {
    const params = encodeState({ k: '{"x":"y"}' });
    for (const value of params.values()) {
      expect(value).not.toMatch(/[+/=]/);
    }
  });
});

// ── readLocalStorage / writeLocalStorage ──────────────────────
describe("readLocalStorage / writeLocalStorage", () => {
  it("reads every key present in the store", () => {
    const store = makeStore();
    store.setItem("a", "1");
    store.setItem("b", "2");
    expect(readLocalStorage(store)).toEqual({ a: "1", b: "2" });
  });

  it("writes every key into the store", () => {
    const store = makeStore();
    writeLocalStorage({ a: "1", b: "2" }, store);
    expect(store.toObject()).toEqual({ a: "1", b: "2" });
  });
});

// ── buildShareUrl ─────────────────────────────────────────────
describe("buildShareUrl", () => {
  it("encodes all localStorage keys into query parameters", () => {
    const store = makeStore();
    store.setItem("jetlag-map-settings", '{"chk-trains":true}');
    store.setItem("jetlag-questions", "[]");
    const url = buildShareUrl(store, "https://example.com/");
    const parsed = new URL(url);
    expect(parsed.searchParams.get("jetlag-map-settings")).toBe(
      base64urlEncode('{"chk-trains":true}'),
    );
    expect(parsed.searchParams.get("jetlag-questions")).toBe(base64urlEncode("[]"));
  });

  it("drops any pre-existing query string from the base", () => {
    const store = makeStore();
    store.setItem("k", "v");
    const url = buildShareUrl(store, "https://example.com/?stale=1");
    const parsed = new URL(url);
    expect(parsed.searchParams.has("stale")).toBe(false);
    expect(parsed.searchParams.get("k")).toBe(base64urlEncode("v"));
  });

  it("is generic: a newly added key is exported without code changes", () => {
    const store = makeStore();
    store.setItem("jetlag-future-feature", '{"enabled":true}');
    const url = buildShareUrl(store, "https://example.com/");
    const parsed = new URL(url);
    expect(parsed.searchParams.get("jetlag-future-feature")).toBe(
      base64urlEncode('{"enabled":true}'),
    );
  });
});

// ── applyStateFromUrl ─────────────────────────────────────────
describe("applyStateFromUrl", () => {
  it("restores state from the query string into the store", () => {
    const store = makeStore();
    const params = encodeState({ "jetlag-map-settings": '{"chk-dark":true}' });
    const applied = applyStateFromUrl(`?${params.toString()}`, store);
    expect(applied).toBe(true);
    expect(store.getItem("jetlag-map-settings")).toBe('{"chk-dark":true}');
  });

  it("returns false and writes nothing when there are no params", () => {
    const store = makeStore();
    const applied = applyStateFromUrl("", store);
    expect(applied).toBe(false);
    expect(store.length).toBe(0);
  });

  it("is generic: a newly added key is restored without code changes", () => {
    const store = makeStore();
    const params = encodeState({ "jetlag-future-feature": '{"enabled":true}' });
    applyStateFromUrl(`?${params.toString()}`, store);
    expect(store.getItem("jetlag-future-feature")).toBe('{"enabled":true}');
  });

  it("round-trips through buildShareUrl + applyStateFromUrl", () => {
    const source = makeStore();
    source.setItem("jetlag-map-settings", '{"chk-trains":false}');
    source.setItem("jetlag-questions", '[{"id":"q1"}]');
    const url = buildShareUrl(source, "https://example.com/");

    const target = makeStore();
    const applied = applyStateFromUrl(new URL(url).search, target);
    expect(applied).toBe(true);
    expect(target.toObject()).toEqual({
      "jetlag-map-settings": '{"chk-trains":false}',
      "jetlag-questions": '[{"id":"q1"}]',
    });
  });
});
