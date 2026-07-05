// Read shareable input values from the URL query (client-only). Calculators
// call this on mount to restore a shared link's inputs.

export function readShared(keys: string[]): Record<string, string> {
  if (typeof window === "undefined") return {};
  const sp = new URLSearchParams(window.location.search);
  const out: Record<string, string> = {};
  for (const k of keys) {
    const v = sp.get(k);
    if (v != null && v !== "") out[k] = v;
  }
  return out;
}
