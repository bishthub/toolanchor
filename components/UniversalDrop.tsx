"use client";

// ─────────────────────────────────────────────────────────────────────────
// Universal drop zone. Drop (or paste) any file anywhere on the site and get
// an instant panel of tools that can act on it — one click loads the file into
// the chosen tool. Turns the whole site into one instrument.
//
// It never steals a drop from a tool's own file input: window-level dragover
// only preventDefault()s (enabling our capture) when the target is NOT inside
// an <input type=file>, a <label>, or an explicit [data-owns-drop] element, so
// native file inputs keep working. The drag overlay is pointer-events:none for
// the same reason.
// ─────────────────────────────────────────────────────────────────────────

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { setHandoff } from "@/lib/handoff";
import { fileKind, toolsForFile, MULTI_FILE_TOOLS } from "@/lib/intent";
import CategoryIcon from "@/components/CategoryIcon";

function ownsDrop(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null;
  if (!el || typeof el.closest !== "function") return false;
  return !!el.closest('input[type="file"], label, [data-owns-drop]');
}

function editableTarget(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null;
  if (!el || typeof el.closest !== "function") return false;
  return !!el.closest('input, textarea, [contenteditable="true"], [contenteditable=""]');
}

function fmtSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function UniversalDrop() {
  const router = useRouter();
  const [dragging, setDragging] = useState(false);
  const [files, setFiles] = useState<File[] | null>(null);

  const multiple = (files?.length ?? 0) > 1;
  const first = files?.[0] ?? null;
  const tools = useMemo(
    () => (first ? toolsForFile(first, { multiple }) : []),
    [first, multiple]
  );

  const close = useCallback(() => setFiles(null), []);

  // Drag/drop wiring at the window level.
  useEffect(() => {
    let hideTimer: number | undefined;

    function onDragOver(e: DragEvent) {
      if (!e.dataTransfer?.types?.includes("Files")) return;
      if (ownsDrop(e.target)) return; // let native inputs handle their own drops
      e.preventDefault(); // required so a drop fires on the window
      setDragging(true);
      window.clearTimeout(hideTimer);
      hideTimer = window.setTimeout(() => setDragging(false), 200);
    }

    function onDrop(e: DragEvent) {
      setDragging(false);
      window.clearTimeout(hideTimer);
      if (ownsDrop(e.target)) return; // native input already got it
      const dropped = Array.from(e.dataTransfer?.files ?? []);
      if (dropped.length === 0) return;
      e.preventDefault(); // stop the browser from navigating to the file
      setFiles(dropped);
    }

    function onPaste(e: ClipboardEvent) {
      if (editableTarget(e.target)) return; // don't hijack pasting into fields
      const pasted = Array.from(e.clipboardData?.files ?? []);
      if (pasted.length === 0) return;
      setFiles(pasted);
    }

    window.addEventListener("dragover", onDragOver);
    window.addEventListener("drop", onDrop);
    window.addEventListener("dragend", () => setDragging(false));
    window.addEventListener("paste", onPaste);
    return () => {
      window.removeEventListener("dragover", onDragOver);
      window.removeEventListener("drop", onDrop);
      window.removeEventListener("paste", onPaste);
      window.clearTimeout(hideTimer);
    };
  }, []);

  // Esc closes the results panel.
  useEffect(() => {
    if (!files) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") close();
    }
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [files, close]);

  function open(slug: string) {
    if (!files) return;
    // Multi-file-capable tools receive every matching file; everything else
    // gets the first file only.
    const kind = fileKind(first);
    const payload =
      multiple && MULTI_FILE_TOOLS.has(slug)
        ? files.filter((f) => fileKind(f) === kind)
        : [files[0]];
    setHandoff(payload, "drop");
    close();
    router.push(`/tools/${slug}`);
  }

  return (
    <>
      {dragging && (
        <div className="udrop-hint" aria-hidden="true">
          <div className="udrop-hint-card">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M12 3v12" />
              <path d="m7 10 5 5 5-5" />
              <path d="M5 21h14" />
            </svg>
            <span>Drop your file — we&apos;ll show what you can do with it</span>
          </div>
        </div>
      )}

      {files && (
        <div
          className="udrop-overlay"
          role="dialog"
          aria-modal="true"
          aria-label="Choose a tool for your file"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) close();
          }}
        >
          <div className="udrop-panel">
            <div className="udrop-head">
              <div className="udrop-file">
                <span className="udrop-file-name">
                  {first?.name}
                  {multiple && <span className="udrop-more"> +{files.length - 1} more</span>}
                </span>
                <span className="udrop-file-meta">
                  {multiple ? `${files.length} files · ` : ""}
                  {first ? fmtSize(first.size) : ""}
                </span>
              </div>
              <button type="button" className="cmdk-esc" onClick={close}>esc</button>
            </div>

            {tools.length > 0 ? (
              <div className="udrop-list">
                <div className="cmdk-group">What do you want to do?</div>
                {tools.map((t) => {
                  const usesAll = multiple && MULTI_FILE_TOOLS.has(t.slug);
                  return (
                    <button
                      key={t.slug}
                      type="button"
                      className="cmdk-item"
                      style={{ ["--cat" as string]: `var(--cat-${t.category})` } as React.CSSProperties}
                      onClick={() => open(t.slug)}
                    >
                      <span className="ci-icon" aria-hidden="true"><CategoryIcon id={t.category} size={16} /></span>
                      <span style={{ minWidth: 0 }}>
                        <span className="ci-name">
                          {t.name}
                          {usesAll && <span className="udrop-badge"> all {files.length}</span>}
                        </span>
                        <span className="ci-desc">{t.description}</span>
                      </span>
                      <span className="ci-go" aria-hidden="true">↵ Open</span>
                    </button>
                  );
                })}
              </div>
            ) : (
              <p className="cmdk-empty">
                No tool here handles that file type yet. Browse{" "}
                <a href="/tools" style={{ color: "var(--accent)" }}>all tools</a>.
              </p>
            )}
          </div>
        </div>
      )}
    </>
  );
}
