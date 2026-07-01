"use client";

// ─────────────────────────────────────────────────────────────────────────
// usePreset — resolves a tool's preset values from (a) the `preset` prop
// passed by /tools/<tool>/<preset> pages and (b) URL query params, so
// deep links like /tools/resize-image?w=1080&h=1080 also work.
// Query params win over the prop so users can tweak a shared link.
// Resolved once on mount (client-only, keeps tool pages fully static).
// ─────────────────────────────────────────────────────────────────────────

import { useEffect, useState } from "react";

export function usePreset(
  preset: Record<string, string> | undefined,
  keys: string[]
): Record<string, string> | null {
  const [resolved, setResolved] = useState<Record<string, string> | null>(null);

  useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    const out: Record<string, string> = {};
    for (const k of keys) {
      const v = sp.get(k) ?? preset?.[k];
      if (v != null && v !== "") out[k] = v;
    }
    setResolved(out);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return resolved;
}

export function presetNumber(
  values: Record<string, string> | null,
  key: string,
  min: number,
  max: number
): number | undefined {
  const n = Number(values?.[key]);
  if (!Number.isFinite(n)) return undefined;
  return Math.min(max, Math.max(min, n));
}
