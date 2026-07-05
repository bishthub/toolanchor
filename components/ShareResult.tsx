"use client";

// Keeps the current calculator inputs in the URL (debounced, via replaceState)
// and offers a "Copy link" button, so a result can be shared and reproduced
// exactly. Pure client-side — no navigation, no analytics.

import { useEffect, useRef, useState } from "react";

export default function ShareResult({ values }: { values: Record<string, string> }) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<number | undefined>(undefined);

  // Build a stable query string from the non-empty values.
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(values)) {
    if (v != null && v !== "") sp.set(k, String(v));
  }
  const qs = sp.toString();

  // Debounced write to the URL whenever the inputs change.
  useEffect(() => {
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      const url = qs ? `${window.location.pathname}?${qs}` : window.location.pathname;
      window.history.replaceState(null, "", url);
    }, 300);
    return () => window.clearTimeout(timer.current);
  }, [qs]);

  async function copy() {
    // Make sure the URL reflects the latest inputs before copying.
    const url = qs ? `${window.location.pathname}?${qs}` : window.location.pathname;
    window.history.replaceState(null, "", url);
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* clipboard blocked — the URL bar still holds the shareable link */
    }
  }

  return (
    <button type="button" className="btn secondary share-btn" onClick={copy} style={{ marginTop: 12 }}>
      {copied ? "✓ Link copied" : "🔗 Copy link to this result"}
    </button>
  );
}
