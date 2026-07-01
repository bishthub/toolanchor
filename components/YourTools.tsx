"use client";

// ─────────────────────────────────────────────────────────────────────────
// "Your tools" — pinned + recently used tools, straight from localStorage.
// Invisible to first-time visitors; returning users land on *their* tools.
// ─────────────────────────────────────────────────────────────────────────

import { useEffect, useState } from "react";
import Link from "next/link";
import CategoryIcon from "@/components/CategoryIcon";
import { getTool, type Tool } from "@/lib/tools";
import { getPins, getRecents, togglePin, USAGE_EVENT } from "@/lib/usage";

interface Entry {
  tool: Tool;
  pinned: boolean;
}

const MAX_SHOWN = 8;

export default function YourTools() {
  const [entries, setEntries] = useState<Entry[]>([]);

  useEffect(() => {
    function load() {
      const pins = getPins();
      const recents = getRecents().filter((s) => !pins.includes(s));
      const list = [
        ...pins.map((slug) => ({ slug, pinned: true })),
        ...recents.map((slug) => ({ slug, pinned: false })),
      ]
        .map(({ slug, pinned }) => {
          const tool = getTool(slug);
          return tool && tool.status === "live" ? { tool, pinned } : null;
        })
        .filter((e): e is Entry => e !== null)
        .slice(0, MAX_SHOWN);
      setEntries(list);
    }
    load();
    window.addEventListener(USAGE_EVENT, load);
    return () => window.removeEventListener(USAGE_EVENT, load);
  }, []);

  if (entries.length === 0) return null;

  return (
    <section aria-label="Your tools">
      <div className="section-head" style={{ marginTop: 48 }}>
        <h2>Your tools</h2>
        <span className="count">pinned &amp; recent</span>
      </div>
      <div className="yt-grid">
        {entries.map(({ tool, pinned }) => (
          <div
            key={tool.slug}
            className="yt-item"
            style={{ ["--cat" as string]: `var(--cat-${tool.category})` }}
          >
            <Link href={`/tools/${tool.slug}`} className="yt-link">
              <span className="yt-icon"><CategoryIcon id={tool.category} size={15} /></span>
              <span className="yt-name">{tool.name}</span>
            </Link>
            <button
              type="button"
              className="yt-pin"
              data-on={pinned}
              aria-pressed={pinned}
              aria-label={pinned ? `Unpin ${tool.name}` : `Pin ${tool.name}`}
              title={pinned ? "Unpin" : "Pin to keep it here"}
              onClick={() => togglePin(tool.slug)}
            >
              <svg viewBox="0 0 24 24" width="13" height="13" fill={pinned ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M12 2l2.9 6.26 6.6.56-5 4.36 1.5 6.45L12 16.2l-5.99 3.43 1.49-6.45-5-4.36 6.6-.56z" />
              </svg>
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}
