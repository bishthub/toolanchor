"use client";

import { useEffect, useRef, useState } from "react";

// Annotation coordinates are stored in CANVAS pixels at the render scale of
// their page. Export divides by that scale to get PDF points and flips the
// y-axis (pdf-lib's origin is bottom-left).
type Mode = "text" | "whiteout" | "highlight" | "check" | "erase";
type ColorKey = "black" | "blue" | "red";

interface Ann {
  id: number;
  page: number; // 1-based
  type: "text" | "whiteout" | "highlight" | "check";
  x: number;
  y: number;
  w?: number;
  h?: number;
  text?: string;
  size?: number;
  color?: ColorKey;
}

interface PageInfo { url: string; w: number; h: number; scale: number }

const CSS_COLOR: Record<ColorKey, string> = { black: "#111111", blue: "#1a4fd8", red: "#d81a1a" };
const PDF_COLOR: Record<ColorKey, [number, number, number]> = {
  black: [0.07, 0.07, 0.07],
  blue: [0.1, 0.31, 0.85],
  red: [0.85, 0.1, 0.1],
};

let nextId = 1;

export default function PdfEditor({ initialFiles }: { initialFiles?: File[] }) {
  const [file, setFile] = useState<File | null>(null);
  const [pages, setPages] = useState<PageInfo[]>([]);
  const [anns, setAnns] = useState<Ann[]>([]);
  const [mode, setMode] = useState<Mode>("text");
  const [selected, setSelected] = useState<number | null>(null);
  const [text, setText] = useState("Text");
  const [size, setSize] = useState(14);
  const [color, setColor] = useState<ColorKey>("black");
  const [checkChar, setCheckChar] = useState<"check" | "cross">("check");
  const [drag, setDrag] = useState<{ page: number; x0: number; y0: number; x1: number; y1: number } | null>(null);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [rotWarn, setRotWarn] = useState(false);
  const dragRef = useRef<{ page: number; x0: number; y0: number } | null>(null);

  useEffect(() => {
    const f = initialFiles?.find((x) => x.type === "application/pdf");
    if (f) load(f);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialFiles]);

  async function load(f: File) {
    setBusy(true);
    setError(null);
    setPages([]);
    setAnns([]);
    setSelected(null);
    setRotWarn(false);
    setFile(f);
    try {
      const pdfjs = await import("pdfjs-dist");
      pdfjs.GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url).toString();
      const doc = await pdfjs.getDocument({ data: await f.arrayBuffer() }).promise;
      const out: PageInfo[] = [];
      let anyRotated = false;
      for (let p = 1; p <= doc.numPages; p++) {
        setProgress(`Rendering page ${p} of ${doc.numPages}…`);
        const page = await doc.getPage(p);
        if (page.rotate % 360 !== 0) anyRotated = true;
        const base = page.getViewport({ scale: 1 });
        const scale = Math.min(680, base.width) / base.width;
        const viewport = page.getViewport({ scale });
        const canvas = document.createElement("canvas");
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext("2d")!;
        await page.render({ canvas, canvasContext: ctx, viewport }).promise;
        const url: string = await new Promise((res) =>
          canvas.toBlob((b) => res(URL.createObjectURL(b!)), "image/png")
        );
        out.push({ url, w: canvas.width, h: canvas.height, scale });
      }
      setPages(out);
      setRotWarn(anyRotated);
      setProgress("");
    } catch (err) {
      console.error(err);
      setError("Could not open this PDF. It may be encrypted — unlock it first.");
      setFile(null);
    } finally {
      setBusy(false);
    }
  }

  // ── Pointer helpers ─────────────────────────────────────────────────────
  function toCanvasPt(e: React.PointerEvent, pi: PageInfo, el: HTMLElement) {
    const r = el.getBoundingClientRect();
    return {
      x: Math.max(0, Math.min(pi.w, (e.clientX - r.left) * (pi.w / r.width))),
      y: Math.max(0, Math.min(pi.h, (e.clientY - r.top) * (pi.h / r.height))),
    };
  }

  function onPageDown(e: React.PointerEvent, pageNum: number) {
    if (busy) return;
    const pi = pages[pageNum - 1];
    const el = e.currentTarget as HTMLElement;
    const pt = toCanvasPt(e, pi, el);
    if (mode === "text") {
      const a: Ann = { id: nextId++, page: pageNum, type: "text", x: pt.x, y: pt.y, text: text || "Text", size, color };
      setAnns((s) => [...s, a]);
      setSelected(a.id);
    } else if (mode === "check") {
      const a: Ann = { id: nextId++, page: pageNum, type: "check", x: pt.x, y: pt.y, size: Math.max(size, 12), color, text: checkChar };
      setAnns((s) => [...s, a]);
      setSelected(a.id);
    } else if (mode === "whiteout" || mode === "highlight") {
      dragRef.current = { page: pageNum, x0: pt.x, y0: pt.y };
      setDrag({ page: pageNum, x0: pt.x, y0: pt.y, x1: pt.x, y1: pt.y });
      el.setPointerCapture(e.pointerId);
    } else {
      setSelected(null); // erase mode: clicking empty page deselects
    }
  }

  function onPageMove(e: React.PointerEvent, pageNum: number) {
    const d = dragRef.current;
    if (!d || d.page !== pageNum) return;
    const pt = toCanvasPt(e, pages[pageNum - 1], e.currentTarget as HTMLElement);
    setDrag({ page: d.page, x0: d.x0, y0: d.y0, x1: pt.x, y1: pt.y });
  }

  function onPageUp(e: React.PointerEvent, pageNum: number) {
    const d = dragRef.current;
    dragRef.current = null;
    if (!d || d.page !== pageNum) { setDrag(null); return; }
    const pt = toCanvasPt(e, pages[pageNum - 1], e.currentTarget as HTMLElement);
    const x = Math.min(d.x0, pt.x), y = Math.min(d.y0, pt.y);
    const w = Math.abs(pt.x - d.x0), h = Math.abs(pt.y - d.y0);
    setDrag(null);
    if (w > 3 && h > 3) {
      const a: Ann = { id: nextId++, page: pageNum, type: mode === "whiteout" ? "whiteout" : "highlight", x, y, w, h };
      setAnns((s) => [...s, a]);
      setSelected(a.id);
    }
  }

  function onAnnClick(e: React.PointerEvent, a: Ann) {
    e.stopPropagation();
    if (busy) return;
    if (mode === "erase") {
      setAnns((s) => s.filter((x) => x.id !== a.id));
      if (selected === a.id) setSelected(null);
    } else {
      setSelected(a.id);
      if (a.type === "text") {
        setText(a.text ?? "");
        setSize(a.size ?? 14);
        setColor(a.color ?? "black");
      }
    }
  }

  // Editing the text controls also updates the selected text annotation.
  const selAnn = anns.find((a) => a.id === selected) || null;
  function updateSelectedText(patch: Partial<Ann>) {
    if (selAnn && selAnn.type === "text") {
      setAnns((s) => s.map((a) => (a.id === selAnn.id ? { ...a, ...patch } : a)));
    }
  }

  // ── Export ──────────────────────────────────────────────────────────────
  async function download() {
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      const { PDFDocument, StandardFonts, rgb } = await import("pdf-lib");
      const doc = await PDFDocument.load(await file.arrayBuffer());
      const font = await doc.embedFont(StandardFonts.Helvetica);
      const pdfPages = doc.getPages();
      for (const a of anns) {
        const page = pdfPages[a.page - 1];
        const pi = pages[a.page - 1];
        if (!page || !pi) continue;
        const s = pi.scale;
        const ph = page.getSize().height;
        const [cr, cg, cb] = PDF_COLOR[a.color ?? "black"];
        if (a.type === "whiteout" || a.type === "highlight") {
          const w = (a.w ?? 0) / s, h = (a.h ?? 0) / s;
          page.drawRectangle({
            x: a.x / s,
            y: ph - a.y / s - h, // flip y: top-left canvas → bottom-left pdf
            width: w,
            height: h,
            color: a.type === "whiteout" ? rgb(1, 1, 1) : rgb(1, 0.92, 0.23),
            opacity: a.type === "whiteout" ? 1 : 0.35,
          });
        } else if (a.type === "text") {
          const fs = (a.size ?? 14) / s;
          page.drawText(a.text || " ", {
            x: a.x / s,
            y: ph - a.y / s - fs, // y is the baseline; text box top is at a.y
            size: fs,
            font,
            color: rgb(cr, cg, cb),
          });
        } else if (a.type === "check") {
          const fs = (a.size ?? 16) / s;
          if (a.text === "cross") {
            // "X" is WinAnsi-safe in Helvetica; "✗" is not.
            page.drawText("X", { x: a.x / s, y: ph - a.y / s - fs, size: fs, font, color: rgb(cr, cg, cb) });
          } else {
            // Helvetica has no "✓" glyph — stroke a small vector checkmark instead.
            page.drawSvgPath("M 0 6 L 4 10 L 12 0", {
              x: a.x / s,
              y: ph - a.y / s, // svg path y grows downward from this point
              scale: fs / 12,
              borderColor: rgb(cr, cg, cb),
              borderWidth: Math.max(1, fs / 8),
            });
          }
        }
      }
      const bytes = await doc.save();
      const blob = new Blob([bytes.slice().buffer], { type: "application/pdf" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `${file.name.replace(/\.pdf$/i, "")}-edited.pdf`;
      link.click();
      URL.revokeObjectURL(link.href);
    } catch (err) {
      console.error(err);
      setError("Could not export this PDF. If it's password-protected, unlock it first.");
    } finally {
      setBusy(false);
    }
  }

  // ── Render helpers ──────────────────────────────────────────────────────
  const pct = (v: number, total: number) => `${(v / total) * 100}%`;

  function annStyle(a: Ann, pi: PageInfo): React.CSSProperties {
    const base: React.CSSProperties = {
      position: "absolute",
      left: pct(a.x, pi.w),
      top: pct(a.y, pi.h),
      cursor: mode === "erase" ? "not-allowed" : "pointer",
      outline: selected === a.id ? "2px solid var(--accent, #4c8dff)" : undefined,
      outlineOffset: 1,
    };
    if (a.type === "whiteout")
      return { ...base, width: pct(a.w ?? 0, pi.w), height: pct(a.h ?? 0, pi.h), background: "#fff", border: "1px dashed rgba(0,0,0,.25)" };
    if (a.type === "highlight")
      return { ...base, width: pct(a.w ?? 0, pi.w), height: pct(a.h ?? 0, pi.h), background: "rgba(255,235,59,.45)" };
    return {
      ...base,
      color: CSS_COLOR[a.color ?? "black"],
      fontSize: a.size ?? 14,
      lineHeight: 1,
      fontFamily: "Helvetica, Arial, sans-serif",
      whiteSpace: "pre",
      userSelect: "none",
      padding: "1px 2px",
    };
  }

  const modeHint: Record<Mode, string> = {
    text: "Click on a page to place a text box, then edit it in the controls above.",
    whiteout: "Drag on a page to cover content with an opaque white rectangle.",
    highlight: "Drag on a page to draw a yellow highlight.",
    check: "Click on a page to place the mark.",
    erase: "Click any annotation to remove it.",
  };

  return (
    <div>
      <div className="field">
        <label>Choose a PDF to edit</label>
        <input type="file" accept="application/pdf" className="input" disabled={busy}
          onChange={(e) => { const f = e.target.files?.[0]; if (f) load(f); }} />
      </div>

      {pages.length > 0 && (
        <>
          <div className="field">
            <label>Tool</label>
            <div className="row" style={{ flexWrap: "wrap" }}>
              {(["text", "whiteout", "highlight", "check", "erase"] as Mode[]).map((m) => (
                <button key={m} type="button" className={`btn ${mode === m ? "" : "secondary"}`} onClick={() => setMode(m)}>
                  {m === "text" ? "Text" : m === "whiteout" ? "Whiteout" : m === "highlight" ? "Highlight" : m === "check" ? "Check" : "Erase"}
                </button>
              ))}
            </div>
          </div>

          {(mode === "text" || mode === "check" || (selAnn && selAnn.type === "text")) && (
            <div className="row" style={{ alignItems: "flex-end" }}>
              {(mode === "text" || (selAnn && selAnn.type === "text")) && (
                <div className="field" style={{ flex: 2 }}>
                  <label>{selAnn && selAnn.type === "text" ? "Edit selected text" : "Text to place"}</label>
                  <input type="text" className="input" value={text} maxLength={200}
                    onChange={(e) => { setText(e.target.value); updateSelectedText({ text: e.target.value }); }} />
                </div>
              )}
              <div className="field" style={{ maxWidth: 170 }}>
                <label>Size: {size}</label>
                <input type="range" min={8} max={36} step={1} value={size} style={{ width: "100%" }}
                  onChange={(e) => { const v = Number(e.target.value); setSize(v); updateSelectedText({ size: v }); }} />
              </div>
              <div className="field" style={{ maxWidth: 150 }}>
                <label>Color</label>
                <select className="input" value={color}
                  onChange={(e) => { const v = e.target.value as ColorKey; setColor(v); updateSelectedText({ color: v }); }}>
                  <option value="black">Black</option>
                  <option value="blue">Blue</option>
                  <option value="red">Red</option>
                </select>
              </div>
              {mode === "check" && (
                <div className="field" style={{ maxWidth: 130 }}>
                  <label>Mark</label>
                  <div className="row">
                    <button type="button" className={`btn ${checkChar === "check" ? "" : "secondary"}`} onClick={() => setCheckChar("check")}>✓</button>
                    <button type="button" className={`btn ${checkChar === "cross" ? "" : "secondary"}`} onClick={() => setCheckChar("cross")}>✗</button>
                  </div>
                </div>
              )}
            </div>
          )}

          <p style={{ color: "var(--muted)", fontSize: ".85rem" }}>{modeHint[mode]}</p>
          {rotWarn && (
            <p style={{ color: "var(--muted)", fontSize: ".85rem" }}>
              Note: this document has rotated pages — annotations may be placed incorrectly on them.
            </p>
          )}

          {pages.map((pi, i) => {
            const pageNum = i + 1;
            return (
              <div key={pageNum} style={{ marginBottom: 18 }}>
                <div style={{ color: "var(--muted)", fontSize: ".8rem", marginBottom: 4 }}>Page {pageNum} of {pages.length}</div>
                <div
                  style={{
                    position: "relative",
                    display: "inline-block",
                    width: pi.w,
                    maxWidth: "100%",
                    border: "1px solid var(--border)",
                    borderRadius: 6,
                    touchAction: "none",
                    cursor: mode === "whiteout" || mode === "highlight" ? "crosshair" : mode === "erase" ? "default" : "copy",
                  }}
                  onPointerDown={(e) => onPageDown(e, pageNum)}
                  onPointerMove={(e) => onPageMove(e, pageNum)}
                  onPointerUp={(e) => onPageUp(e, pageNum)}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={pi.url} alt={`Page ${pageNum}`} style={{ display: "block", width: "100%", height: "auto", borderRadius: 6 }} draggable={false} />
                  {anns.filter((a) => a.page === pageNum).map((a) => (
                    <div key={a.id} style={annStyle(a, pi)} onPointerDown={(e) => onAnnClick(e, a)} title={mode === "erase" ? "Click to remove" : "Click to select"}>
                      {a.type === "text" ? (a.text || " ") : a.type === "check" ? (a.text === "cross" ? "✗" : "✓") : null}
                    </div>
                  ))}
                  {drag && drag.page === pageNum && (
                    <div style={{
                      position: "absolute",
                      left: pct(Math.min(drag.x0, drag.x1), pi.w),
                      top: pct(Math.min(drag.y0, drag.y1), pi.h),
                      width: pct(Math.abs(drag.x1 - drag.x0), pi.w),
                      height: pct(Math.abs(drag.y1 - drag.y0), pi.h),
                      background: mode === "whiteout" ? "rgba(255,255,255,.9)" : "rgba(255,235,59,.45)",
                      border: "1px dashed rgba(0,0,0,.35)",
                      pointerEvents: "none",
                    }} />
                  )}
                </div>
              </div>
            );
          })}

          <div className="row" style={{ alignItems: "center" }}>
            <button className="btn" onClick={download} disabled={busy || anns.length === 0}>
              {busy ? "Working…" : "⬇ Download edited PDF"}
            </button>
            {anns.length > 0 && (
              <button type="button" className="btn secondary" onClick={() => { setAnns([]); setSelected(null); }} disabled={busy}>
                Clear all ({anns.length})
              </button>
            )}
          </div>
        </>
      )}

      {busy && progress && <p style={{ color: "var(--muted)", marginTop: 10 }}>{progress}</p>}
      {error && <p style={{ color: "#ff6b6b", marginTop: 12 }}>{error}</p>}

      <p className="privacy-note">🔒 Your PDF is edited entirely in your browser — it is never uploaded to a server.</p>
    </div>
  );
}
