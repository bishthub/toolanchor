"use client";

// Pin/unpin a tool — pinned tools surface first on the homepage and in ⌘K.

import { useEffect, useState } from "react";
import { isPinned, togglePin, USAGE_EVENT } from "@/lib/usage";

export default function PinButton({ slug }: { slug: string }) {
  const [mounted, setMounted] = useState(false);
  const [pinned, setPinned] = useState(false);

  useEffect(() => {
    setMounted(true);
    setPinned(isPinned(slug));
    const sync = () => setPinned(isPinned(slug));
    window.addEventListener(USAGE_EVENT, sync);
    return () => window.removeEventListener(USAGE_EVENT, sync);
  }, [slug]);

  // Render a stable placeholder until mounted to avoid hydration mismatch.
  return (
    <button
      type="button"
      className="pin-btn"
      data-on={mounted && pinned}
      aria-pressed={mounted && pinned}
      title={pinned ? "Unpin this tool" : "Pin this tool to your homepage"}
      onClick={() => setPinned(togglePin(slug))}
    >
      <svg viewBox="0 0 24 24" width="15" height="15" fill={mounted && pinned ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M12 2l2.9 6.26 6.6.56-5 4.36 1.5 6.45L12 16.2l-5.99 3.43 1.49-6.45-5-4.36 6.6-.56z" />
      </svg>
      <span>{mounted && pinned ? "Pinned" : "Pin"}</span>
    </button>
  );
}
