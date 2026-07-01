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
  const next = [slug, ...read(RECENTS_KEY).filter((s) => s !== slug)].slice(0, RECENTS_MAX);
  write(RECENTS_KEY, next);
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
