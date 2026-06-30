"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import ToolCard from "@/components/ToolCard";
import { TOOLS, toolsAtoZ } from "@/lib/tools";

export default function ToolsExplorer() {
  const [q, setQ] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Honor the ?q= deep link (SearchAction target) without forcing the page
  // to render dynamically — the full A–Z list is still in the SSR HTML.
  useEffect(() => {
    const param = new URLSearchParams(window.location.search).get("q");
    if (param) {
      setQ(param);
      inputRef.current?.focus();
    }
  }, []);

  const term = q.trim().toLowerCase();
  const groups = useMemo(() => toolsAtoZ(), []);
  const letters = useMemo(() => Object.keys(groups).sort(), [groups]);

  const matches = useMemo(() => {
    if (!term) return [];
    return TOOLS.filter(
      (t) =>
        t.name.toLowerCase().includes(term) ||
        t.keywords.some((k) => k.includes(term))
    );
  }, [term]);

  return (
    <>
      <div className="search-wrap" style={{ margin: "26px 0 8px", maxWidth: 520 }}>
        <div className="search-field">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <circle cx="11" cy="11" r="7" />
            <path d="m21 21-4.3-4.3" />
          </svg>
          <input
            ref={inputRef}
            type="search"
            placeholder="Filter all tools…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            aria-label="Filter tools"
          />
        </div>
      </div>

      {term ? (
        <section style={{ marginTop: 8 }}>
          <p className="section-blurb" aria-live="polite" style={{ marginBottom: 18 }}>
            {matches.length} {matches.length === 1 ? "tool" : "tools"} matching “{q}”
          </p>
          {matches.length > 0 ? (
            <div className="grid">
              {matches.map((t) => (
                <ToolCard key={t.slug} tool={t} />
              ))}
            </div>
          ) : (
            <p className="search-empty">No tools match. Try “pdf”, “image”, or “json”.</p>
          )}
        </section>
      ) : (
        <>
          <nav className="az-nav" aria-label="Jump to letter">
            {letters.map((l) => (
              <a key={l} href={`#letter-${l}`}>{l}</a>
            ))}
          </nav>

          {letters.map((letter) => (
            <section key={letter} id={`letter-${letter}`} className="az-group">
              <div className="letter">{letter}</div>
              <div className="grid">
                {groups[letter].map((t) => (
                  <ToolCard key={t.slug} tool={t} />
                ))}
              </div>
            </section>
          ))}
        </>
      )}
    </>
  );
}
