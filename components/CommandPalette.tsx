"use client";

// ─────────────────────────────────────────────────────────────────────────
// Command palette — the fastest path to any tool. Opens with ⌘K / Ctrl+K,
// the header search pill, or the hero search bar (both dispatch "ta:palette").
// Fuzzy-filters all tools + categories, full keyboard navigation.
// ─────────────────────────────────────────────────────────────────────────

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { CATEGORIES, POPULAR_TOOLS, TOOLS, getTool, type CategoryId, type Tool } from "@/lib/tools";
import { WORKFLOWS } from "@/lib/workflows";
import { getPins, getRecents } from "@/lib/usage";
import CategoryIcon from "@/components/CategoryIcon";

export const OPEN_PALETTE_EVENT = "ta:palette";

export function openPalette() {
  window.dispatchEvent(new Event(OPEN_PALETTE_EVENT));
}

interface Item {
  key: string;
  name: string;
  desc?: string;
  cat: CategoryId; // category id for colour-coding + icon
  href: string;
  group: string;
}

function toolItem(t: Tool, group: string): Item {
  return {
    key: `tool-${t.slug}`,
    name: t.name,
    desc: t.description,
    cat: t.category,
    href: `/tools/${t.slug}`,
    group,
  };
}

function score(t: Tool, q: string): number {
  const name = t.name.toLowerCase();
  if (name.startsWith(q)) return 4;
  if (name.includes(q)) return 3;
  if (t.keywords.some((k) => k.startsWith(q))) return 2;
  if (t.keywords.some((k) => k.includes(q))) return 1.5;
  if (t.description.toLowerCase().includes(q)) return 1;
  return 0;
}

export default function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [active, setActive] = useState(0);
  const [mine, setMine] = useState<Tool[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Global open triggers: ⌘K / Ctrl+K + the custom event from buttons.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
    }
    function onOpen() {
      setOpen(true);
    }
    window.addEventListener("keydown", onKey);
    window.addEventListener(OPEN_PALETTE_EVENT, onOpen);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener(OPEN_PALETTE_EVENT, onOpen);
    };
  }, []);

  // Reset + focus + scroll-lock while open.
  useEffect(() => {
    if (open) {
      setQ("");
      setActive(0);
      // Pinned first, then recents — the user's own toolbelt on top.
      const pins = getPins();
      const slugs = [...pins, ...getRecents().filter((s) => !pins.includes(s))];
      setMine(
        slugs
          .map((s) => getTool(s))
          .filter((t): t is Tool => !!t && t.status === "live")
          .slice(0, 5)
      );
      document.body.style.overflow = "hidden";
      // Wait a tick so the input exists after the overlay mounts.
      requestAnimationFrame(() => inputRef.current?.focus());
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const items = useMemo<Item[]>(() => {
    const term = q.trim().toLowerCase();
    if (!term) {
      const mineSlugs = new Set(mine.map((t) => t.slug));
      return [
        ...mine.map((t) => toolItem(t, "Your tools")),
        ...POPULAR_TOOLS.filter((t) => !mineSlugs.has(t.slug))
          .slice(0, Math.max(3, 6 - mine.length))
          .map((t) => toolItem(t, "Popular right now")),
        ...CATEGORIES.map((c) => ({
          key: `cat-${c.id}`,
          name: c.name,
          desc: c.blurb,
          cat: c.id,
          href: `/category/${c.id}`,
          group: "Browse a category",
        })),
      ];
    }
    const toolMatches = TOOLS
      .filter((t) => t.status === "live")
      .map((t) => ({ t, s: score(t, term) }))
      .filter((x) => x.s > 0)
      .sort((a, b) => b.s - a.s)
      .slice(0, 12)
      .map((x) => toolItem(x.t, "Tools"));
    const workflowMatches: Item[] = WORKFLOWS
      .filter((w) => w.name.toLowerCase().includes(term) || w.description.toLowerCase().includes(term) || term.includes("workflow"))
      .slice(0, 4)
      .map((w) => ({
        key: `wf-${w.slug}`,
        name: w.name,
        desc: w.description,
        cat: getTool(w.steps[0].tool)?.category ?? "pdf",
        href: `/workflows/${w.slug}`,
        group: "Workflows",
      }));
    return [...toolMatches, ...workflowMatches];
  }, [q, mine]);

  const go = useCallback(
    (item: Item) => {
      setOpen(false);
      router.push(item.href);
    },
    [router]
  );

  function onInputKey(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, items.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === "Enter" && items[active]) {
      e.preventDefault();
      go(items[active]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  // Keep the active row visible while arrowing through the list.
  useEffect(() => {
    listRef.current
      ?.querySelector('[data-active="true"]')
      ?.scrollIntoView({ block: "nearest" });
  }, [active]);

  if (!open) return null;

  let lastGroup = "";

  return (
    <div
      className="cmdk-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Search tools"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) setOpen(false);
      }}
    >
      <div className="cmdk">
        <div className="cmdk-head">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <circle cx="11" cy="11" r="7" />
            <path d="m21 21-4.3-4.3" />
          </svg>
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setActive(0);
            }}
            onKeyDown={onInputKey}
            placeholder={`Search ${TOOLS.filter((t) => t.status === "live").length} tools…`}
            aria-label="Search tools"
          />
          <button type="button" className="cmdk-esc" onClick={() => setOpen(false)}>esc</button>
        </div>

        <div className="cmdk-list" ref={listRef}>
          {items.length === 0 && (
            <p className="cmdk-empty">
              Nothing matches “{q}”. Try “pdf”, “resize”, “json”…
            </p>
          )}
          {items.map((item, i) => {
            const header = item.group !== lastGroup ? item.group : null;
            lastGroup = item.group;
            return (
              <div key={item.key}>
                {header && <div className="cmdk-group">{header}</div>}
                <button
                  type="button"
                  className="cmdk-item"
                  data-active={i === active}
                  style={{ ["--cat" as string]: `var(--cat-${item.cat})` } as React.CSSProperties}
                  onMouseMove={() => setActive(i)}
                  onClick={() => go(item)}
                >
                  <span className="ci-icon" aria-hidden="true"><CategoryIcon id={item.cat} size={16} /></span>
                  <span style={{ minWidth: 0 }}>
                    <span className="ci-name">{item.name}</span>
                    {item.desc && <span className="ci-desc">{item.desc}</span>}
                  </span>
                  <span className="ci-go" aria-hidden="true">↵ Open</span>
                </button>
              </div>
            );
          })}
        </div>

        <div className="cmdk-foot">
          <span><kbd>↑</kbd> <kbd>↓</kbd> navigate</span>
          <span><kbd>↵</kbd> open</span>
          <span><kbd>esc</kbd> close</span>
        </div>
      </div>
    </div>
  );
}

/* Reusable triggers — dispatch the open event from anywhere. */

export function HeaderPaletteButton() {
  return (
    <button type="button" className="palette-btn" onClick={openPalette} aria-label="Search tools (⌘K)">
      <SearchIcon />
      <span className="palette-hint">Search tools</span>
      <kbd>⌘K</kbd>
    </button>
  );
}

export function HeroPaletteButton({ hint }: { hint: string }) {
  return (
    <button type="button" className="hero-search-btn" onClick={openPalette} aria-label="Search tools (⌘K)">
      <SearchIcon />
      <span className="hint">{hint}</span>
      <kbd>⌘K</kbd>
    </button>
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
