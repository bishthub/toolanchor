"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import ToolCard from "@/components/ToolCard";
import type { Tool } from "@/lib/tools";

// Tools are passed in already localized by the server page, so the A–Z grouping,
// filtering and card labels all reflect the active locale.
export default function ToolsExplorer({ tools }: { tools: Tool[] }) {
  const t = useTranslations("toolsIndex");
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

  const groups = useMemo(() => {
    const g: Record<string, Tool[]> = {};
    for (const tool of [...tools].sort((a, b) => a.name.localeCompare(b.name))) {
      const first = tool.name[0]?.toUpperCase() ?? "#";
      const key = /[A-Z]/.test(first) ? first : "#";
      (g[key] ??= []).push(tool);
    }
    return g;
  }, [tools]);
  const letters = useMemo(() => Object.keys(groups).sort(), [groups]);

  const matches = useMemo(() => {
    if (!term) return [];
    return tools.filter(
      (tool) =>
        tool.name.toLowerCase().includes(term) ||
        tool.keywords.some((k) => k.toLowerCase().includes(term))
    );
  }, [term, tools]);

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
            placeholder={t("filter")}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            aria-label={t("filter")}
          />
        </div>
      </div>

      {term ? (
        <section style={{ marginTop: 8 }}>
          <p className="section-blurb" aria-live="polite" style={{ marginBottom: 18 }}>
            {t("matching", { count: matches.length, q })}
          </p>
          {matches.length > 0 ? (
            <div className="grid">
              {matches.map((tool) => (
                <ToolCard key={tool.slug} tool={tool} />
              ))}
            </div>
          ) : (
            <p className="search-empty">{t("noMatch")}</p>
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
                {groups[letter].map((tool) => (
                  <ToolCard key={tool.slug} tool={tool} />
                ))}
              </div>
            </section>
          ))}
        </>
      )}
    </>
  );
}
