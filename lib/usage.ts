// ─────────────────────────────────────────────────────────────────────────
// Local usage memory — recents + pinned tools. Pure localStorage, no
// accounts, no network. Call only from client components.
// ─────────────────────────────────────────────────────────────────────────

const RECENTS_KEY = "ta:recents";
const PINS_KEY = "ta:pins";
const RECENTS_MAX = 12;

/** Fired on window whenever pins/recents change, so UI can live-update. */
export const USAGE_EVENT = "ta:usage";

function read(key: string): string[] {
  try {
    const raw = localStorage.getItem(key);
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr.filter((x) => typeof x === "string") : [];
  } catch {
    return [];
  }
}

function write(key: string, slugs: string[]) {
  try {
    localStorage.setItem(key, JSON.stringify(slugs));
    window.dispatchEvent(new Event(USAGE_EVENT));
  } catch {}
}

/** Most-recent-first list of visited tool slugs. */
export function getRecents(): string[] {
  return read(RECENTS_KEY);
}

export function addRecent(slug: string) {
  const cur = read(RECENTS_KEY);
  // Record the tool→tool move (previous visited → this one) before updating.
  if (cur[0] && cur[0] !== slug) recordTransition(cur[0], slug);
  const next = [slug, ...cur.filter((s) => s !== slug)].slice(0, RECENTS_MAX);
  write(RECENTS_KEY, next);
}

// ─── Tool→tool transitions (local "people do this next" signal) ──────────
const TRANS_KEY = "ta:transitions";
const TRANS_MAX = 80; // cap distinct from>to pairs

export function recordTransition(from: string, to: string) {
  if (!from || !to || from === to) return;
  try {
    const map: Record<string, number> = JSON.parse(localStorage.getItem(TRANS_KEY) || "{}");
    map[`${from}>${to}`] = (map[`${from}>${to}`] || 0) + 1;
    const keys = Object.keys(map);
    if (keys.length > TRANS_MAX) {
      keys.sort((a, b) => map[a] - map[b]);
      for (const k of keys.slice(0, keys.length - TRANS_MAX)) delete map[k];
    }
    localStorage.setItem(TRANS_KEY, JSON.stringify(map));
  } catch {
    /* ignore */
  }
}

/** Most-common tools visited right after `from`, highest first. */
export function getTopNext(from: string, n = 4): string[] {
  try {
    const map: Record<string, number> = JSON.parse(localStorage.getItem(TRANS_KEY) || "{}");
    return Object.entries(map)
      .filter(([k]) => k.startsWith(`${from}>`))
      .sort((a, b) => b[1] - a[1])
      .map(([k]) => k.slice(from.length + 1))
      .slice(0, n);
  } catch {
    return [];
  }
}

export function getPins(): string[] {
  return read(PINS_KEY);
}

export function isPinned(slug: string): boolean {
  return read(PINS_KEY).includes(slug);
}

export function togglePin(slug: string): boolean {
  const pins = read(PINS_KEY);
  const on = pins.includes(slug);
  write(PINS_KEY, on ? pins.filter((s) => s !== slug) : [...pins, slug]);
  return !on;
}
