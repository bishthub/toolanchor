"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { Link } from "@/i18n/navigation";
import { TOOLS, getCategory } from "@/lib/tools";

export default function ToolSearch() {
  const [q, setQ] = useState("");
  const [active, setActive] = useState(0);
  const [focused, setFocused] = useState(false);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  const results = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return [];
    return TOOLS.filter(
      (t) =>
        t.name.toLowerCase().includes(term) ||
        t.keywords.some((k) => k.includes(term))
    ).slice(0, 7);
  }, [q]);

  const open = focused && q.trim().length > 0;

  function go(slug: string, status: string) {
    router.push(status === "live" ? `/tools/${slug}` : "/tools");
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === "Enter") {
      const hit = results[active];
      if (hit) go(hit.slug, hit.status);
      else if (q.trim()) router.push(`/tools?q=${encodeURIComponent(q.trim())}`);
    } else if (e.key === "Escape") {
      inputRef.current?.blur();
    }
  }

  return (
    <div className="search-wrap">
      <div className="search-field">
        <SearchIcon />
        <input
          ref={inputRef}
          type="search"
          placeholder="Search tools — try “merge pdf”, “resize”, “word count”…"
          value={q}
          onChange={(e) => { setQ(e.target.value); setActive(0); }}
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 120)}
          onKeyDown={onKeyDown}
          aria-label="Search tools"
          role="combobox"
          aria-expanded={open}
          aria-controls="search-results"
        />
        {!q && <span className="search-kbd">↵</span>}
      </div>

      {open && (
        <div className="search-pop" id="search-results" role="listbox">
          {results.length > 0 ? (
            results.map((t, i) => (
              <Link
                key={t.slug}
                href={t.status === "live" ? `/tools/${t.slug}` : "/tools"}
                className="search-item"
                role="option"
                aria-selected={i === active}
                data-active={i === active}
                style={{ ["--cat" as string]: `var(--cat-${t.category})` }}
                onMouseEnter={() => setActive(i)}
              >
                <span className="si-icon" aria-hidden="true">
                  {getCategory(t.category)?.emoji ?? "🛠️"}
                </span>
                <span>
                  <span className="si-name">{t.name}</span>
                  <br />
                  <span className="si-cat">{getCategory(t.category)?.name}</span>
                </span>
                <span className="si-go">{t.status === "live" ? "Open →" : "Soon"}</span>
              </Link>
            ))
          ) : (
            <p className="search-empty">
              No tool matches “{q}”. <Link href="/tools" style={{ color: "var(--accent)" }}>Browse all →</Link>
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <circle cx="11" cy="11" r="7" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}
