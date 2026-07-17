// ─────────────────────────────────────────────────────────────────────────
// Thin analytics event helper. Sends a named event to whatever trackers are
// loaded (GA4 gtag, Plausible) and silently no-ops when none are — so callers
// never need to check. Client-side only.
// ─────────────────────────────────────────────────────────────────────────

type Params = Record<string, string | number | boolean>;

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    plausible?: (event: string, opts?: { props?: Params }) => void;
  }
}

export function trackEvent(name: string, params?: Params) {
  if (typeof window === "undefined") return;
  try {
    window.gtag?.("event", name, params);
    window.plausible?.(name, params ? { props: params } : undefined);
  } catch {
    /* never let analytics break the tool */
  }
}
