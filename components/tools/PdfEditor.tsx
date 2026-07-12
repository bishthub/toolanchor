"use client";

import { useEffect, useRef, useState } from "react";
import type { PDFDocumentProxy, PDFDocumentLoadingTask } from "pdfjs-dist";
import WasmProgress from "@/components/WasmProgress";

// ─────────────────────────────────────────────────────────────────────────────
// PDF Editor — fill, annotate, draw, stamp images and OCR, fully in-browser.
//
// Coordinate system: every annotation is stored in PDF POINTS with the origin
// at the TOP-LEFT of its page (y grows downward, like the screen). Rendering
// multiplies by the current view scale; export only needs the y-flip
// (pdfY = pageHeight − y − h) because pdf-lib's origin is bottom-left.
//
// Workspace layout: [toolbar] over [thumbnail rail | canvas | side panel],
// with a floating zoom/page pill over the canvas. The rail and panel collapse
// on narrow viewports; the whole workspace can go fullscreen.
// ─────────────────────────────────────────────────────────────────────────────

type ToolMode = "select" | "text" | "whiteout" | "highlight" | "pen" | "check" | "cross" | "image";
type ColorKey = "black" | "blue" | "red" | "green";
type AnnType = "text" | "whiteout" | "highlight" | "pen" | "check" | "cross" | "image";

interface Ann {
  id: string;
  page: number; // 1-based
  type: AnnType;
  x: number; // PDF points, from left edge
  y: number; // PDF points, from TOP edge
  w: number;
  h: number;
  rotation?: number;
  text?: string;
  fontSize?: number;
  color?: ColorKey;
  points?: { x: number; y: number }[][]; // pen strokes, page-absolute points
  dataUrl?: string; // image source (png/jpg data URI)
  imgW?: number;
  imgH?: number;
}

interface PageView { url: string; wPx: number; hPx: number; scale: number }
interface PagePt { w: number; h: number }
interface OcrWord { text: string; x: number; y: number; w: number; h: number } // points, y from top
interface OcrLine { text: string; x: number; y: number; w: number; h: number } // points, y from top
interface OcrPage { page: number; text: string; words: OcrWord[]; lines: OcrLine[]; conf?: number }

interface DragState {
  kind: "move" | "resize" | "rect" | "pen";
  page: number; // 1-based
  pointerId: number;
  startX: number;
  startY: number;
  base: Ann[]; // annotations snapshot at drag start
  orig?: Ann; // for move / resize
  rectType?: "whiteout" | "highlight";
  points?: { x: number; y: number }[]; // for pen
  moved: boolean;
}

const CSS_COLOR: Record<ColorKey, string> = {
  black: "#111111",
  blue: "#1d4ed8",
  red: "#dc2626",
  green: "#15803d",
};
const PDF_COLOR: Record<ColorKey, [number, number, number]> = {
  black: [0.067, 0.067, 0.067],
  blue: [0.114, 0.306, 0.847],
  red: [0.863, 0.149, 0.149],
  green: [0.082, 0.502, 0.239],
};
const HIGHLIGHT_CSS = "rgba(255, 235, 59, 0.35)";
const HELV = "Helvetica, Arial, sans-serif";
const LINE_HEIGHT = 1.25;
const PEN_WIDTH = 2; // pt
const MARK_SIZE = 14; // pt — default check / cross box
const HISTORY_CAP = 50;
const ZOOM_MIN = 0.5;
const ZOOM_MAX = 2;
const ZOOM_STEP = 0.25;
const BASE_RENDER = 1.5; // pdf.js render scale at 100% zoom

const OCR_LANGS: { id: string; label: string }[] = [
  { id: "eng", label: "English" },
  { id: "spa", label: "Español" },
  { id: "fra", label: "Français" },
  { id: "deu", label: "Deutsch" },
  { id: "ita", label: "Italiano" },
  { id: "por", label: "Português" },
  { id: "hin", label: "हिन्दी" },
];

// Layout hints for Tesseract's page segmentation (PSM).
const OCR_LAYOUTS: { id: "auto" | "column" | "block" | "sparse"; label: string }[] = [
  { id: "auto", label: "Auto layout" },
  { id: "column", label: "Single column" },
  { id: "block", label: "Single block" },
  { id: "sparse", label: "Sparse / label" },
];
// Float ("best") LSTM models — noticeably more accurate than the default
// integer "fast" models, at the cost of a bigger one-time download.
const TESSDATA_BEST = "https://tessdata.projectnaptha.com/4.0.0_best";
const OCR_MAX_DIM = 3000; // px cap for the offscreen OCR render (≈272 DPI on letter)

// tesseract.js defaults to its slim LSTM-only core, which supports the integer
// "fast" models ONLY — float "best" models abort with a missing DotProductSSE
// function. Best quality must load the FULL core build instead. Version must
// stay in lockstep with tesseract.js-core in package.json.
const TESS_CORE_VERSION = "7.0.0";
function fullTessCorePath(): string {
  // wasm-feature-detect's WebAssembly-SIMD probe module.
  const probe = Uint8Array.from([0, 97, 115, 109, 1, 0, 0, 0, 1, 5, 1, 96, 0, 1, 123, 3, 2, 1, 0, 10, 10, 1, 8, 0, 65, 0, 253, 15, 253, 98, 11]);
  let simd = false;
  try { simd = WebAssembly.validate(probe); } catch { /* wasm unavailable — tesseract fails regardless */ }
  return `https://cdn.jsdelivr.net/npm/tesseract.js-core@${TESS_CORE_VERSION}/tesseract-core${simd ? "-simd" : ""}.wasm.js`;
}

let seq = 1;
const newId = () => `a${Date.now().toString(36)}-${seq++}`;
const clamp = (v: number, lo: number, hi: number) => Math.min(Math.max(v, lo), hi);
/** Best-effort WinAnsi fallback: swap unencodable characters for "?". */
const sanitizeWinAnsi = (s: string) => s.replace(/[^ -ÿ]/g, "?");

/**
 * In-place scan cleanup for OCR: grayscale + Bradley adaptive thresholding
 * (integral-image local mean). Handles low contrast and the uneven lighting
 * of phone-photographed pages far better than a global threshold — Tesseract
 * gets clean black-on-white glyphs to work with.
 */
function enhanceForOcr(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const img = ctx.getImageData(0, 0, w, h);
  const d = img.data;
  const n = w * h;
  const gray = new Uint8ClampedArray(n);
  for (let i = 0; i < n; i++) {
    const j = i * 4;
    gray[i] = (d[j] * 0.299 + d[j + 1] * 0.587 + d[j + 2] * 0.114) | 0;
  }
  // Integral image (row-major, (w+1)×(h+1)); max sum 255·9M fits in Uint32.
  const iw = w + 1;
  const integ = new Uint32Array(iw * (h + 1));
  for (let y = 0; y < h; y++) {
    let row = 0;
    for (let x = 0; x < w; x++) {
      row += gray[y * w + x];
      integ[(y + 1) * iw + x + 1] = integ[y * iw + x + 1] + row;
    }
  }
  const win = Math.max(16, (Math.min(w, h) / 16) | 0);
  const half = win >> 1;
  const T = 0.15; // Bradley threshold sensitivity
  for (let y = 0; y < h; y++) {
    const y1 = Math.max(0, y - half);
    const y2 = Math.min(h - 1, y + half);
    for (let x = 0; x < w; x++) {
      const x1 = Math.max(0, x - half);
      const x2 = Math.min(w - 1, x + half);
      const area = (x2 - x1 + 1) * (y2 - y1 + 1);
      const sum = integ[(y2 + 1) * iw + x2 + 1] - integ[y1 * iw + x2 + 1] - integ[(y2 + 1) * iw + x1] + integ[y1 * iw + x1];
      const v = gray[y * w + x] * area <= sum * (1 - T) ? 0 : 255;
      const j = (y * w + x) * 4;
      d[j] = d[j + 1] = d[j + 2] = v;
      d[j + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
}

// ── Icons (16px, stroke = currentColor) ─────────────────────────────────────
function Ic({ d, fill, vb = "0 0 16 16" }: { d: string; fill?: boolean; vb?: string }) {
  return (
    <svg width="15" height="15" viewBox={vb} aria-hidden="true" style={{ display: "block", flexShrink: 0 }}>
      <path d={d} fill={fill ? "currentColor" : "none"} stroke={fill ? "none" : "currentColor"} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
const ICONS: Record<string, React.ReactNode> = {
  select: <Ic fill d="M4 1.5 L12.2 8.4 L8.6 8.9 L10.6 13 L8.9 13.9 L6.9 9.7 L4 12.3 Z" />,
  text: <Ic d="M3.5 4.5 V3 H12.5 V4.5 M8 3 V13 M6 13 H10" />,
  whiteout: (
    <svg width="15" height="15" viewBox="0 0 16 16" aria-hidden="true" style={{ display: "block", flexShrink: 0 }}>
      <rect x="2.2" y="4.2" width="11.6" height="7.6" rx="1" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <path d="M4.6 6.6 H11.4 M4.6 9.4 H9" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" opacity="0.45" />
    </svg>
  ),
  highlight: (
    <svg width="15" height="15" viewBox="0 0 16 16" aria-hidden="true" style={{ display: "block", flexShrink: 0 }}>
      <path d="M5 9.2 L10.2 4 L12.6 6.4 L7.4 11.6 H5 Z" fill="currentColor" opacity="0.35" />
      <path d="M5 9.2 L10.2 4 L12.6 6.4 L7.4 11.6 H5 Z M3 13.4 H13" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  pen: <Ic d="M3 13.2 L3.9 10.2 L10.8 3.3 L13 5.5 L6.1 12.4 L3 13.2 Z M9.6 4.5 L11.8 6.7" />,
  check: <Ic d="M3 8.6 L6.4 12 L13 4.4" />,
  cross: <Ic d="M4 4 L12 12 M12 4 L4 12" />,
  image: (
    <svg width="15" height="15" viewBox="0 0 16 16" aria-hidden="true" style={{ display: "block", flexShrink: 0 }}>
      <rect x="2.2" y="3.2" width="11.6" height="9.6" rx="1.2" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="5.7" cy="6.5" r="1.1" fill="currentColor" />
      <path d="M4 12 L8.2 7.8 L11 10.6 L12.2 9.4 L13.8 11" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
    </svg>
  ),
  undo: <Ic d="M6.2 3.4 L3.4 6.2 L6.2 9 M3.6 6.2 H9.6 A3.4 3.4 0 1 1 9.6 12.9 H6.8" />,
  redo: <Ic d="M9.8 3.4 L12.6 6.2 L9.8 9 M12.4 6.2 H6.4 A3.4 3.4 0 1 0 6.4 12.9 H9.2" />,
  download: <Ic d="M8 2.5 V10 M4.8 7 L8 10.2 L11.2 7 M3 13 H13" />,
  ocr: <Ic d="M2.5 5 V2.5 H5 M11 2.5 H13.5 V5 M13.5 11 V13.5 H11 M5 13.5 H2.5 V11 M4.5 8 H11.5" />,
  expand: <Ic d="M2.5 6 V2.5 H6 M10 2.5 H13.5 V6 M13.5 10 V13.5 H10 M6 13.5 H2.5 V10" />,
  shrink: <Ic d="M6 2.5 V6 H2.5 M13.5 6 H10 V2.5 M10 13.5 V10 H13.5 M2.5 10 H6 V13.5" />,
  trash: <Ic d="M3 4.6 H13 M6.4 4.4 V3 H9.6 V4.4 M4.6 4.8 L5.2 13 H10.8 L11.4 4.8 M6.8 7 V11 M9.2 7 V11" />,
  copy: <Ic d="M6 6 H12.5 V13 H6 Z M4 10 H3.5 V3 H10 V4" />,
};

const TOOL_DEFS: { id: ToolMode; label: string; title: string }[] = [
  { id: "select", label: "Select", title: "Select, move and resize (V)" },
  { id: "text", label: "Text", title: "Click a page to add text (T)" },
  { id: "whiteout", label: "Whiteout", title: "Drag to cover content with white (W)" },
  { id: "highlight", label: "Highlight", title: "Drag to highlight (H)" },
  { id: "pen", label: "Pen", title: "Draw freehand (P)" },
  { id: "check", label: "Check", title: "Click to place a checkmark" },
  { id: "cross", label: "Cross", title: "Click to place a cross" },
  { id: "image", label: "Image", title: "Stamp a PNG or JPG onto the page" },
];

const ANN_LABEL: Record<AnnType, string> = {
  text: "Text",
  whiteout: "Whiteout",
  highlight: "Highlight",
  pen: "Pen stroke",
  check: "Checkmark",
  cross: "Cross",
  image: "Image",
};

// Scoped stylesheet — the tool shell's default .btn is deliberately chunky for
// simple tools; the editor needs compact, app-like chrome.
const PDFX_CSS = `
.pdfx-ws { border: 1px solid var(--border); border-radius: var(--radius, 10px); background: var(--surface); overflow: hidden; }
.pdfx-ws.fs { border: none; border-radius: 0; width: 100vw; height: 100vh; display: flex; flex-direction: column; }
.pdfx-tbar { display: flex; align-items: center; gap: 4px; flex-wrap: wrap; padding: 8px 10px; border-bottom: 1px solid var(--border); background: var(--surface); position: sticky; z-index: 30; }
.pdfx-ws.fs .pdfx-tbar { position: static; }
.pdfx-group { display: flex; align-items: center; gap: 2px; padding: 0 6px; border-right: 1px solid var(--border-soft, var(--border)); }
.pdfx-group:last-child, .pdfx-group.noline { border-right: none; }
.tool-shell-body .pdfx-ws button.pdfx-tb { display: inline-flex; align-items: center; gap: 6px; padding: 6px 9px; font-size: .78rem; font-weight: 500; line-height: 1;
  border: 1px solid transparent; border-radius: 7px; background: transparent; color: var(--text); cursor: pointer; }
.tool-shell-body .pdfx-ws button.pdfx-tb:hover:not(:disabled) { background: var(--surface-2); }
.tool-shell-body .pdfx-ws button.pdfx-tb:disabled { opacity: .45; cursor: default; }
.tool-shell-body .pdfx-ws button.pdfx-tb.on { background: var(--accent-soft, var(--surface-2)); border-color: var(--accent); color: var(--accent-strong, var(--accent)); }
.tool-shell-body .pdfx-ws button.pdfx-tb.primary { background: var(--accent); color: var(--accent-ink, #fff); font-weight: 600; padding: 7px 14px; }
.tool-shell-body .pdfx-ws button.pdfx-tb.primary:hover:not(:disabled) { background: var(--accent-strong, var(--accent)); }
.tool-shell-body .pdfx-ws button.pdfx-tb.danger:hover:not(:disabled) { color: var(--danger, #e5484d); background: var(--surface-2); }
.pdfx-tb .lbl { white-space: nowrap; }
@media (max-width: 1240px) { .pdfx-tools .pdfx-tb .lbl { display: none; } .pdfx-tools .pdfx-tb { padding: 7px; } }
.pdfx-status { display: flex; align-items: center; gap: 10px; padding: 5px 12px; font-size: .76rem; color: var(--muted); border-bottom: 1px solid var(--border-soft, var(--border)); background: var(--surface); min-height: 27px; }
.pdfx-status .grow { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.pdfx-grid { display: grid; grid-template-columns: 84px minmax(0, 1fr) 252px; background: var(--bg-2, var(--surface-2)); }
.pdfx-ws.fs .pdfx-grid { flex: 1; min-height: 0; }
.pdfx-thumbs { border-right: 1px solid var(--border); background: var(--surface); overflow-y: auto; padding: 10px 8px; display: flex; flex-direction: column; gap: 8px; align-items: center; }
.pdfx-thumb { border: none; background: none; padding: 0; cursor: pointer; display: block; width: 100%; }
.pdfx-thumb img { display: block; width: 100%; border-radius: 3px; border: 2px solid var(--border); background: #fff; }
.pdfx-thumb.on img { border-color: var(--accent); box-shadow: 0 0 0 2px var(--accent-soft, transparent); }
.pdfx-thumb .n { display: block; text-align: center; font-size: .68rem; color: var(--muted); margin-top: 3px; font-family: var(--font-mono, monospace); }
.pdfx-canvaswrap { position: relative; min-width: 0; }
.pdfx-scroll { overflow: auto; height: 72vh; padding: 20px 20px 64px; }
.pdfx-ws.fs .pdfx-scroll { height: calc(100vh - 118px); }
.pdfx-pagechip { text-align: center; font-size: .7rem; color: var(--muted); margin: 6px 0 14px; font-family: var(--font-mono, monospace); }
.pdfx-pill { position: absolute; bottom: 14px; left: 50%; transform: translateX(-50%); z-index: 20; display: flex; align-items: center; gap: 2px;
  background: var(--surface); border: 1px solid var(--border); border-radius: 999px; padding: 3px 6px; box-shadow: var(--shadow-lg, 0 6px 24px rgba(0,0,0,.18)); }
.pdfx-pill .pct, .pdfx-pill .pg { font-size: .74rem; color: var(--text); font-family: var(--font-mono, monospace); padding: 0 4px; white-space: nowrap; }
.pdfx-pill .pg { color: var(--muted); }
.pdfx-pill .sep { width: 1px; height: 16px; background: var(--border); margin: 0 3px; }
.pdfx-panel { border-left: 1px solid var(--border); background: var(--surface); overflow-y: auto; padding: 12px; display: flex; flex-direction: column; gap: 14px; }
.pdfx-ptitle { font-size: .7rem; font-weight: 600; text-transform: uppercase; letter-spacing: .07em; color: var(--muted); margin: 0 0 6px; }
.pdfx-card { border: 1px solid var(--border-soft, var(--border)); border-radius: 8px; padding: 10px; background: var(--surface); }
.pdfx-list { display: flex; flex-direction: column; gap: 2px; }
.pdfx-row { display: flex; align-items: center; gap: 8px; width: 100%; text-align: left; border: 1px solid transparent; background: none; border-radius: 6px; padding: 5px 7px; cursor: pointer; color: var(--text); font-size: .78rem; }
.pdfx-row:hover { background: var(--surface-2); }
.pdfx-row.on { background: var(--accent-soft, var(--surface-2)); border-color: var(--accent); }
.pdfx-row .ico { color: var(--muted); display: flex; }
.pdfx-row .t { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.pdfx-row .pg { font-size: .68rem; color: var(--faint, var(--muted)); font-family: var(--font-mono, monospace); }
.pdfx-row .del { opacity: 0; display: flex; border: none; background: none; padding: 2px; cursor: pointer; color: var(--muted); border-radius: 4px; }
.pdfx-row:hover .del { opacity: 1; }
.pdfx-row .del:hover { color: var(--danger, #e5484d); }
.pdfx-swatches { display: flex; gap: 6px; align-items: center; }
.pdfx-sw { width: 20px; height: 20px; border-radius: 50%; padding: 0; cursor: pointer; border: 2px solid var(--surface); }
.pdfx-empty { font-size: .78rem; color: var(--muted); line-height: 1.5; }
.pdfx-ocrtxt { width: 100%; min-height: 76px; font-size: .78rem; line-height: 1.45; border: 1px solid var(--border-soft, var(--border)); border-radius: 6px; background: var(--surface-2); color: var(--text); padding: 7px 8px; resize: vertical; font-family: inherit; }
.tool-shell-body .pdfx-ws select.pdfx-sel { padding: 5px 7px; font-size: .76rem; border-radius: 6px; border: 1px solid var(--border); background: var(--surface); color: var(--text); }
@media (max-width: 1120px) { .pdfx-grid { grid-template-columns: 84px minmax(0, 1fr); } .pdfx-panel { display: none; } .pdfx-mpanel { display: block; } }
@media (min-width: 1121px) { .pdfx-mpanel { display: none; } }
@media (max-width: 760px) { .pdfx-grid { grid-template-columns: minmax(0, 1fr); } .pdfx-thumbs { display: none; } .pdfx-scroll { padding: 12px 10px 64px; height: 64vh; } }
`;

export default function PdfEditor({ initialFiles }: { initialFiles?: File[] }) {
  // ── Document state ───────────────────────────────────────────────────────
  const [file, setFile] = useState<File | null>(null);
  const bytesRef = useRef<ArrayBuffer | null>(null);
  const docRef = useRef<PDFDocumentProxy | null>(null);
  const loadingTaskRef = useRef<PDFDocumentLoadingTask | null>(null);
  const [docKey, setDocKey] = useState(0);
  const [pagePts, setPagePts] = useState<PagePt[]>([]);
  const [views, setViews] = useState<PageView[]>([]);
  const viewsRef = useRef<PageView[]>([]);
  const [zoom, setZoom] = useState(1);
  const [rotWarn, setRotWarn] = useState(false);
  const [curPage, setCurPage] = useState(1);

  // ── Editing state ────────────────────────────────────────────────────────
  const [tool, setTool] = useState<ToolMode>("select");
  const [color, setColor] = useState<ColorKey>("black");
  const [fontSize, setFontSize] = useState(14);
  const [anns, setAnns] = useState<Ann[]>([]);
  const historyRef = useRef<Ann[][]>([[]]);
  const hIdxRef = useRef(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const editSessionRef = useRef<{ live: boolean; isNew: boolean; prevText: string }>({ live: false, isNew: false, prevText: "" });
  const editMountRef = useRef(0); // guards against focus-steal blur right after placement
  const dragRef = useRef<DragState | null>(null);
  const [draftRect, setDraftRect] = useState<{ page: number; x: number; y: number; w: number; h: number; kind: "whiteout" | "highlight" } | null>(null);
  const [draftStroke, setDraftStroke] = useState<{ page: number; pts: { x: number; y: number }[] } | null>(null);
  const [pendingImage, setPendingImage] = useState<{ dataUrl: string; w: number; h: number } | null>(null);

  // ── Async / feedback state ───────────────────────────────────────────────
  const [opening, setOpening] = useState(false);
  const [rendering, setRendering] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [progress, setProgress] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isFs, setIsFs] = useState(false);
  const wsRef = useRef<HTMLDivElement | null>(null);

  // ── OCR state ────────────────────────────────────────────────────────────
  const [ocrBusy, setOcrBusy] = useState(false);
  const [ocrProgress, setOcrProgress] = useState("");
  const [ocrPct, setOcrPct] = useState<number | undefined>(undefined);
  const [ocrPages, setOcrPages] = useState<OcrPage[]>([]);
  const [ocrLang, setOcrLang] = useState("eng");
  const [ocrQuality, setOcrQuality] = useState<"best" | "fast">("best");
  const [ocrLayout, setOcrLayout] = useState<"auto" | "column" | "block" | "sparse">("auto");
  const [ocrEnhance, setOcrEnhance] = useState(true);
  const [ocrPlusEng, setOcrPlusEng] = useState(true);
  const [embedOcr, setEmbedOcr] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const ocrCancelRef = useRef(false);

  const scrollBoxRef = useRef<HTMLDivElement | null>(null);
  const pageElsRef = useRef<(HTMLDivElement | null)[]>([]);
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const measureRef = useRef<HTMLCanvasElement | null>(null);

  const busy = opening || exporting;
  const canUndo = hIdxRef.current > 0;
  const canRedo = hIdxRef.current < historyRef.current.length - 1;

  // ── File loading ─────────────────────────────────────────────────────────
  useEffect(() => {
    const f = initialFiles?.find((x) => x.type === "application/pdf");
    if (f) openFile(f);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialFiles]);

  async function openFile(f: File) {
    if (opening) return;
    if (f.type !== "application/pdf" && !/\.pdf$/i.test(f.name)) {
      setError("That doesn't look like a PDF file — please choose a .pdf.");
      return;
    }
    setOpening(true);
    setError(null);
    setProgress("Opening PDF…");
    try {
      const bytes = await f.arrayBuffer();
      const pdfjs = await import("pdfjs-dist");
      pdfjs.GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url).toString();
      // pdf.js transfers the buffer to its worker — hand it a copy, keep the
      // original for pdf-lib at export time.
      const task = pdfjs.getDocument({ data: bytes.slice(0) });
      const doc = await task.promise;
      const pts: PagePt[] = [];
      let anyRotated = false;
      for (let p = 1; p <= doc.numPages; p++) {
        const page = await doc.getPage(p);
        const vp = page.getViewport({ scale: 1 });
        pts.push({ w: vp.width, h: vp.height });
        if (page.rotate % 360 !== 0) anyRotated = true;
      }
      if (loadingTaskRef.current) loadingTaskRef.current.destroy().catch(() => undefined);
      loadingTaskRef.current = task;
      docRef.current = doc;
      bytesRef.current = bytes;
      setFile(f);
      setPagePts(pts);
      setRotWarn(anyRotated);
      setAnns([]);
      historyRef.current = [[]];
      hIdxRef.current = 0;
      setSelected(null);
      setEditingId(null);
      editSessionRef.current.live = false;
      dragRef.current = null;
      setDraftRect(null);
      setDraftStroke(null);
      setOcrPages([]);
      setEmbedOcr(false);
      setCurPage(1);
      setViews((prev) => { prev.forEach((v) => URL.revokeObjectURL(v.url)); return []; });
      setDocKey((k) => k + 1);
    } catch {
      setError("Could not open this PDF. If it's password-protected, unlock it first, then try again.");
    } finally {
      setOpening(false);
      setProgress("");
    }
  }

  // Fit-to-width once the workspace exists for this document.
  useEffect(() => {
    if (docKey === 0 || pagePts.length === 0) return;
    const raf = requestAnimationFrame(() => {
      const box = scrollBoxRef.current;
      if (!box) return;
      const maxW = Math.max(...pagePts.map((p) => p.w));
      const avail = box.clientWidth - 44;
      if (avail > 80 && maxW > 0) {
        const fit = clamp(Math.floor((avail / (maxW * BASE_RENDER)) * 20) / 20, ZOOM_MIN, ZOOM_MAX);
        setZoom(fit);
      }
    });
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [docKey]);

  function fitWidth() {
    const box = scrollBoxRef.current;
    if (!box || pagePts.length === 0) return;
    const maxW = Math.max(...pagePts.map((p) => p.w));
    const avail = box.clientWidth - 44;
    if (avail > 80 && maxW > 0) setZoom(clamp(Math.floor((avail / (maxW * BASE_RENDER)) * 20) / 20, ZOOM_MIN, ZOOM_MAX));
  }

  // Re-render page bitmaps whenever the document or zoom changes.
  useEffect(() => {
    const doc = docRef.current;
    if (!doc || docKey === 0) return;
    let cancelled = false;
    const made: string[] = [];
    (async () => {
      setRendering(true);
      try {
        const out: PageView[] = [];
        const scale = zoom * BASE_RENDER;
        for (let p = 1; p <= doc.numPages; p++) {
          if (cancelled) break;
          setProgress(`Rendering page ${p} of ${doc.numPages}…`);
          const page = await doc.getPage(p);
          const vp = page.getViewport({ scale });
          const canvas = document.createElement("canvas");
          canvas.width = Math.max(1, Math.floor(vp.width));
          canvas.height = Math.max(1, Math.floor(vp.height));
          const ctx = canvas.getContext("2d");
          if (!ctx) throw new Error("canvas");
          await page.render({ canvas, canvasContext: ctx, viewport: vp }).promise;
          const url = await new Promise<string>((res, rej) =>
            canvas.toBlob((b) => (b ? res(URL.createObjectURL(b)) : rej(new Error("blob"))), "image/png")
          );
          made.push(url);
          out.push({ url, wPx: canvas.width, hPx: canvas.height, scale });
        }
        if (!cancelled) {
          setViews((prev) => { prev.forEach((v) => URL.revokeObjectURL(v.url)); return out; });
        } else {
          made.forEach((u) => URL.revokeObjectURL(u));
        }
      } catch {
        if (!cancelled) setError("Could not render this PDF — it may be damaged.");
      } finally {
        if (!cancelled) { setRendering(false); setProgress(""); }
      }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [docKey, zoom]);

  useEffect(() => { viewsRef.current = views; }, [views]);
  useEffect(() => () => {
    viewsRef.current.forEach((v) => URL.revokeObjectURL(v.url));
    loadingTaskRef.current?.destroy().catch(() => undefined);
  }, []);

  // ── Fullscreen ───────────────────────────────────────────────────────────
  useEffect(() => {
    const onFs = () => setIsFs(document.fullscreenElement === wsRef.current && wsRef.current !== null);
    document.addEventListener("fullscreenchange", onFs);
    return () => document.removeEventListener("fullscreenchange", onFs);
  }, []);

  function toggleFullscreen() {
    const el = wsRef.current;
    if (!el) return;
    if (document.fullscreenElement) void document.exitFullscreen().catch(() => undefined);
    else void el.requestFullscreen().catch(() => undefined);
  }

  // ── History ──────────────────────────────────────────────────────────────
  function commit(next: Ann[]) {
    const arr = [...historyRef.current.slice(0, hIdxRef.current + 1), next];
    while (arr.length > HISTORY_CAP) arr.shift();
    historyRef.current = arr;
    hIdxRef.current = arr.length - 1;
    setAnns(next);
  }
  function undo() {
    if (editSessionRef.current.live) commitEdit(true);
    if (hIdxRef.current <= 0) return;
    hIdxRef.current -= 1;
    setAnns(historyRef.current[hIdxRef.current]);
    setSelected(null);
  }
  function redo() {
    if (editSessionRef.current.live) commitEdit(true);
    if (hIdxRef.current >= historyRef.current.length - 1) return;
    hIdxRef.current += 1;
    setAnns(historyRef.current[hIdxRef.current]);
    setSelected(null);
  }

  // ── Geometry helpers ─────────────────────────────────────────────────────
  /** Pointer event → PDF points (top-left origin) on the given page. */
  function toPt(e: { clientX: number; clientY: number }, pageIdx: number): { x: number; y: number } {
    const el = pageElsRef.current[pageIdx];
    const pp = pagePts[pageIdx];
    if (!el || !pp) return { x: 0, y: 0 };
    const r = el.getBoundingClientRect();
    const s = r.width / pp.w; // actual on-screen scale — robust to CSS shrink
    return {
      x: clamp((e.clientX - r.left) / s, 0, pp.w),
      y: clamp((e.clientY - r.top) / s, 0, pp.h),
    };
  }

  function sizeText(text: string, fs: number): { w: number; h: number } {
    const lines = text.split("\n");
    let canvas = measureRef.current;
    if (!canvas) { canvas = document.createElement("canvas"); measureRef.current = canvas; }
    const ctx = canvas.getContext("2d");
    let w = 12;
    if (ctx) {
      ctx.font = `${fs}px ${HELV}`;
      for (const ln of lines) w = Math.max(w, ctx.measureText(ln).width);
    } else {
      w = Math.max(12, ...lines.map((l) => l.length * fs * 0.55));
    }
    return { w: w + 4, h: Math.max(1, lines.length) * fs * LINE_HEIGHT };
  }

  function applyMove(base: Ann[], orig: Ann, dx: number, dy: number, pp: PagePt): Ann[] {
    const nx = clamp(orig.x + dx, 0, Math.max(0, pp.w - orig.w));
    const ny = clamp(orig.y + dy, 0, Math.max(0, pp.h - orig.h));
    const ddx = nx - orig.x;
    const ddy = ny - orig.y;
    return base.map((a) =>
      a.id !== orig.id
        ? a
        : {
            ...orig,
            x: nx,
            y: ny,
            points: orig.points?.map((st) => st.map((p) => ({ x: p.x + ddx, y: p.y + ddy }))),
          }
    );
  }

  function applyResize(base: Ann[], orig: Ann, dx: number, dy: number, pp: PagePt): Ann[] {
    const nw = clamp(orig.w + dx, 8, Math.max(8, pp.w - orig.x));
    // Text keeps its automatic height (and font size) — only the box widens.
    const nh = orig.type === "text" ? orig.h : clamp(orig.h + dy, 8, Math.max(8, pp.h - orig.y));
    const sx = orig.w > 0 ? nw / orig.w : 1;
    const sy = orig.h > 0 ? nh / orig.h : 1;
    return base.map((a) =>
      a.id !== orig.id
        ? a
        : {
            ...orig,
            w: nw,
            h: nh,
            points: orig.points?.map((st) =>
              st.map((p) => ({ x: orig.x + (p.x - orig.x) * sx, y: orig.y + (p.y - orig.y) * sy }))
            ),
          }
    );
  }

  // ── Placement ────────────────────────────────────────────────────────────
  function placeText(pageNum: number, pt: { x: number; y: number }) {
    const pp = pagePts[pageNum - 1];
    if (!pp) return;
    const sized = sizeText("", fontSize);
    const a: Ann = {
      id: newId(),
      page: pageNum,
      type: "text",
      x: clamp(pt.x, 0, Math.max(0, pp.w - 24)),
      y: clamp(pt.y, 0, Math.max(0, pp.h - sized.h)),
      w: Math.max(sized.w, 60),
      h: sized.h,
      text: "",
      fontSize,
      color,
    };
    setAnns([...anns, a]); // transient until the edit commits
    setSelected(a.id);
    startEdit(a, true);
  }

  function placeMark(kind: "check" | "cross", pageNum: number, pt: { x: number; y: number }) {
    const pp = pagePts[pageNum - 1];
    if (!pp) return;
    const s = MARK_SIZE;
    const a: Ann = {
      id: newId(),
      page: pageNum,
      type: kind,
      x: clamp(pt.x - s / 2, 0, Math.max(0, pp.w - s)),
      y: clamp(pt.y - s / 2, 0, Math.max(0, pp.h - s)),
      w: s,
      h: s,
      color,
    };
    commit([...anns, a]);
    setSelected(a.id);
    setTool("select"); // hand straight back to Select so the mark can be grabbed
  }

  function placeImage(pageNum: number, pt: { x: number; y: number }) {
    const im = pendingImage;
    const pp = pagePts[pageNum - 1];
    if (!im || !pp) return;
    let w = Math.min(200, pp.w * 0.9);
    let h = w * (im.h / im.w);
    if (h > pp.h * 0.9) { h = pp.h * 0.9; w = h * (im.w / im.h); }
    const a: Ann = {
      id: newId(),
      page: pageNum,
      type: "image",
      x: clamp(pt.x - w / 2, 0, Math.max(0, pp.w - w)),
      y: clamp(pt.y - h / 2, 0, Math.max(0, pp.h - h)),
      w,
      h,
      dataUrl: im.dataUrl,
      imgW: im.w,
      imgH: im.h,
    };
    commit([...anns, a]);
    setSelected(a.id);
    setTool("select");
  }

  function pickImage() { imageInputRef.current?.click(); }

  function onImageChosen(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    e.target.value = ""; // allow picking the same file again later
    if (!f) return;
    if (!/^image\/(png|jpeg)$/.test(f.type)) {
      setError("Please choose a PNG or JPG image.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = String(reader.result);
      const img = new Image();
      img.onload = () => {
        setPendingImage({ dataUrl, w: img.naturalWidth || 1, h: img.naturalHeight || 1 });
        setTool("image");
        setSelected(null);
        setError(null);
      };
      img.onerror = () => setError("Could not read that image.");
      img.src = dataUrl;
    };
    reader.onerror = () => setError("Could not read that image.");
    reader.readAsDataURL(f);
  }

  // ── Inline text editing ──────────────────────────────────────────────────
  function startEdit(a: Ann, isNew: boolean) {
    editSessionRef.current = { live: true, isNew, prevText: a.text ?? "" };
    editMountRef.current = Date.now();
    setEditText(a.text ?? "");
    setEditingId(a.id);
  }

  function commitEdit(cancel: boolean) {
    if (!editSessionRef.current.live) return;
    editSessionRef.current.live = false;
    const id = editingId;
    setEditingId(null);
    if (!id) return;
    const { isNew, prevText } = editSessionRef.current;
    const a = anns.find((x) => x.id === id);
    if (!a) return;
    const t = (cancel ? prevText : editText).replace(/\s+$/, "");
    if (t === "") {
      const next = anns.filter((x) => x.id !== id);
      if (isNew) setAnns(next); // never entered history — drop silently
      else commit(next);
      setSelected(null);
      return;
    }
    if (cancel) {
      if (isNew) { setAnns(anns.filter((x) => x.id !== id)); setSelected(null); }
      return;
    }
    if (!isNew && t === prevText) { setTool("select"); return; }
    const sized = sizeText(t, a.fontSize ?? 14);
    commit(anns.map((x) => (x.id === id ? { ...x, text: t, w: Math.max(sized.w, 24), h: sized.h } : x)));
    setTool("select"); // committed text should be immediately movable
  }

  function deleteAnn(id: string) {
    commit(anns.filter((a) => a.id !== id));
    if (selected === id) setSelected(null);
  }
  function deleteSelected() { if (selected) deleteAnn(selected); }

  function duplicateSelected() {
    const a = anns.find((x) => x.id === selected);
    const pp = a ? pagePts[a.page - 1] : undefined;
    if (!a || !pp) return;
    const dx = Math.min(12, Math.max(0, pp.w - a.w - a.x));
    const dy = Math.min(12, Math.max(0, pp.h - a.h - a.y));
    const copy: Ann = {
      ...a,
      id: newId(),
      x: a.x + dx,
      y: a.y + dy,
      points: a.points?.map((st) => st.map((p) => ({ x: p.x + dx, y: p.y + dy }))),
    };
    commit([...anns, copy]);
    setSelected(copy.id);
  }

  function nudgeSelected(dx: number, dy: number) {
    const a = anns.find((x) => x.id === selected);
    const pp = a ? pagePts[a.page - 1] : undefined;
    if (!a || !pp) return;
    commit(applyMove(anns, a, dx, dy, pp));
  }

  // ── Pointer interactions ─────────────────────────────────────────────────
  function onPagePointerDown(e: React.PointerEvent, pageIdx: number) {
    if (busy || editingId) return; // let an open text edit blur-commit first
    // Cancel the compatibility mouse events' default action (focus change) —
    // otherwise the browser steals focus from a freshly-mounted text editor
    // right after placement and the blur-commit drops the empty annotation.
    e.preventDefault();
    const pageNum = pageIdx + 1;
    const el = pageElsRef.current[pageIdx];
    if (!el) return;
    const pt = toPt(e, pageIdx);

    if (tool === "select") { setSelected(null); return; }
    if (tool === "text") { placeText(pageNum, pt); return; }
    if (tool === "check" || tool === "cross") { placeMark(tool, pageNum, pt); return; }
    if (tool === "image") { placeImage(pageNum, pt); return; }
    if (tool === "whiteout" || tool === "highlight") {
      dragRef.current = { kind: "rect", page: pageNum, pointerId: e.pointerId, startX: pt.x, startY: pt.y, base: anns, rectType: tool, moved: false };
      setDraftRect({ page: pageNum, x: pt.x, y: pt.y, w: 0, h: 0, kind: tool });
      el.setPointerCapture(e.pointerId);
      return;
    }
    if (tool === "pen") {
      dragRef.current = { kind: "pen", page: pageNum, pointerId: e.pointerId, startX: pt.x, startY: pt.y, base: anns, points: [pt], moved: false };
      setDraftStroke({ page: pageNum, pts: [pt] });
      el.setPointerCapture(e.pointerId);
    }
  }

  function onAnnPointerDown(e: React.PointerEvent, a: Ann, pageIdx: number) {
    if (tool !== "select" || busy || editingId) return;
    e.stopPropagation();
    setSelected(a.id);
    const el = pageElsRef.current[pageIdx];
    if (!el) return;
    const pt = toPt(e, pageIdx);
    dragRef.current = { kind: "move", page: a.page, pointerId: e.pointerId, startX: pt.x, startY: pt.y, base: anns, orig: a, moved: false };
    el.setPointerCapture(e.pointerId);
  }

  function onHandlePointerDown(e: React.PointerEvent, a: Ann, pageIdx: number) {
    if (tool !== "select" || busy || editingId) return;
    e.stopPropagation();
    const el = pageElsRef.current[pageIdx];
    if (!el) return;
    const pt = toPt(e, pageIdx);
    dragRef.current = { kind: "resize", page: a.page, pointerId: e.pointerId, startX: pt.x, startY: pt.y, base: anns, orig: a, moved: false };
    el.setPointerCapture(e.pointerId);
  }

  function onPagePointerMove(e: React.PointerEvent, pageIdx: number) {
    const d = dragRef.current;
    if (!d || d.pointerId !== e.pointerId || d.page !== pageIdx + 1) return;
    const pp = pagePts[pageIdx];
    if (!pp) return;
    const pt = toPt(e, pageIdx);
    const dx = pt.x - d.startX;
    const dy = pt.y - d.startY;
    if (!d.moved && Math.abs(dx) + Math.abs(dy) > 0.4) d.moved = true;

    if (d.kind === "rect" && d.rectType) {
      setDraftRect({
        page: d.page,
        x: Math.min(d.startX, pt.x),
        y: Math.min(d.startY, pt.y),
        w: Math.abs(dx),
        h: Math.abs(dy),
        kind: d.rectType,
      });
    } else if (d.kind === "pen" && d.points) {
      const last = d.points[d.points.length - 1];
      if (!last || Math.hypot(pt.x - last.x, pt.y - last.y) > 0.7) {
        d.points.push(pt);
        setDraftStroke({ page: d.page, pts: [...d.points] });
      }
    } else if (d.kind === "move" && d.orig && d.moved) {
      setAnns(applyMove(d.base, d.orig, dx, dy, pp));
    } else if (d.kind === "resize" && d.orig && d.moved) {
      setAnns(applyResize(d.base, d.orig, dx, dy, pp));
    }
  }

  function onPagePointerUp(e: React.PointerEvent, pageIdx: number) {
    const d = dragRef.current;
    if (!d || d.pointerId !== e.pointerId) return;
    dragRef.current = null;
    const pp = pagePts[pageIdx];
    const pt = toPt(e, pageIdx);

    if (d.kind === "rect" && d.rectType) {
      setDraftRect(null);
      const x = Math.min(d.startX, pt.x);
      const y = Math.min(d.startY, pt.y);
      const w = Math.abs(pt.x - d.startX);
      const h = Math.abs(pt.y - d.startY);
      if (w >= 2 && h >= 2) {
        const a: Ann = { id: newId(), page: d.page, type: d.rectType, x, y, w, h };
        commit([...d.base, a]);
        setSelected(a.id);
        setTool("select"); // hand straight back to Select so the box can be grabbed
      }
      return;
    }
    if (d.kind === "pen") {
      setDraftStroke(null);
      const pts = d.points ?? [];
      if (pts.length === 0) return;
      let minX = pts[0].x, maxX = pts[0].x, minY = pts[0].y, maxY = pts[0].y;
      for (const p of pts) {
        minX = Math.min(minX, p.x); maxX = Math.max(maxX, p.x);
        minY = Math.min(minY, p.y); maxY = Math.max(maxY, p.y);
      }
      const pad = PEN_WIDTH;
      const a: Ann = {
        id: newId(),
        page: d.page,
        type: "pen",
        x: Math.max(0, minX - pad),
        y: Math.max(0, minY - pad),
        w: Math.max(maxX - minX + pad * 2, 4),
        h: Math.max(maxY - minY + pad * 2, 4),
        color,
        points: [pts],
      };
      commit([...d.base, a]); // keep the pen active — no selection steal
      return;
    }
    if ((d.kind === "move" || d.kind === "resize") && d.orig && pp) {
      if (!d.moved) return; // plain click — selection already handled
      const dx = pt.x - d.startX;
      const dy = pt.y - d.startY;
      commit(d.kind === "move" ? applyMove(d.base, d.orig, dx, dy, pp) : applyResize(d.base, d.orig, dx, dy, pp));
    }
  }

  function onPagePointerCancel() {
    const d = dragRef.current;
    if (!d) return;
    dragRef.current = null;
    setDraftRect(null);
    setDraftStroke(null);
    if (d.kind === "move" || d.kind === "resize") setAnns(d.base);
  }

  // ── Keyboard shortcuts ───────────────────────────────────────────────────
  useEffect(() => {
    const isTyping = (t: EventTarget | null) =>
      t instanceof HTMLElement && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.tagName === "SELECT" || t.isContentEditable);
    function onKey(e: KeyboardEvent) {
      const mod = e.metaKey || e.ctrlKey;
      if (mod && (e.key === "z" || e.key === "Z")) {
        if (isTyping(e.target)) return;
        e.preventDefault();
        if (e.shiftKey) redo(); else undo();
        return;
      }
      if (mod && (e.key === "y" || e.key === "Y")) {
        if (isTyping(e.target)) return;
        e.preventDefault();
        redo();
        return;
      }
      if (mod && (e.key === "d" || e.key === "D") && selected && !editingId) {
        if (isTyping(e.target)) return;
        e.preventDefault();
        duplicateSelected();
        return;
      }
      if ((e.key === "Delete" || e.key === "Backspace") && selected && !editingId) {
        if (isTyping(e.target)) return;
        e.preventDefault();
        deleteSelected();
        return;
      }
      if (e.key.startsWith("Arrow") && selected && !editingId) {
        if (isTyping(e.target)) return;
        e.preventDefault();
        const step = e.shiftKey ? 10 : 1;
        if (e.key === "ArrowLeft") nudgeSelected(-step, 0);
        else if (e.key === "ArrowRight") nudgeSelected(step, 0);
        else if (e.key === "ArrowUp") nudgeSelected(0, -step);
        else if (e.key === "ArrowDown") nudgeSelected(0, step);
        return;
      }
      if (!mod && !isTyping(e.target) && file && !editingId) {
        const k = e.key.toLowerCase();
        if (k === "v") { setTool("select"); return; }
        if (k === "t") { setTool("text"); setSelected(null); return; }
        if (k === "w") { setTool("whiteout"); setSelected(null); return; }
        if (k === "h") { setTool("highlight"); setSelected(null); return; }
        if (k === "p") { setTool("pen"); setSelected(null); return; }
      }
      if (e.key === "Escape") {
        if (editSessionRef.current.live) { commitEdit(true); return; }
        if (selected) { setSelected(null); return; }
        if (tool === "image") { setTool("select"); setPendingImage(null); }
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  // ── Toolbar actions ──────────────────────────────────────────────────────
  function onToolClick(m: ToolMode) {
    if (editSessionRef.current.live) commitEdit(false);
    if (m === "image") { pickImage(); return; } // tool activates once an image loads
    setTool(m);
    if (m !== "select") setSelected(null);
  }

  function changeColor(c: ColorKey) {
    setColor(c);
    const id = editingId ?? selected;
    const a = id ? anns.find((x) => x.id === id) : undefined;
    if (a && (a.type === "text" || a.type === "pen" || a.type === "check" || a.type === "cross")) {
      const next = anns.map((x) => (x.id === a.id ? { ...x, color: c } : x));
      if (editingId === a.id) setAnns(next); else commit(next);
    }
  }

  function changeFontSize(v: number) {
    setFontSize(v);
    const id = editingId ?? selected;
    const a = id ? anns.find((x) => x.id === id) : undefined;
    if (a && a.type === "text") {
      const sized = sizeText(editingId === a.id ? editText : a.text ?? "", v);
      const next = anns.map((x) => (x.id === a.id ? { ...x, fontSize: v, w: Math.max(sized.w, 24), h: sized.h } : x));
      if (editingId === a.id) setAnns(next); else commit(next);
    }
  }

  function onScrollPages() {
    const box = scrollBoxRef.current;
    if (!box) return;
    const line = box.getBoundingClientRect().top + Math.min(160, box.clientHeight * 0.35);
    let cur = 1;
    pageElsRef.current.forEach((el, i) => {
      if (el && el.getBoundingClientRect().top <= line) cur = i + 1;
    });
    setCurPage(cur);
  }

  function scrollToPage(pageNum: number) {
    pageElsRef.current[pageNum - 1]?.scrollIntoView({ behavior: "smooth", block: "start" });
    setCurPage(pageNum);
  }

  function selectFromList(a: Ann) {
    setTool("select");
    setSelected(a.id);
    scrollToPage(a.page);
  }

  // ── OCR ──────────────────────────────────────────────────────────────────
  async function runOcr() {
    const doc = docRef.current;
    if (!doc || ocrBusy) return;
    ocrCancelRef.current = false;
    setOcrBusy(true);
    setError(null);
    setOcrPages([]);
    setOcrPct(undefined);
    setOcrProgress("Loading OCR engine (downloads once)…");
    try {
      const { createWorker, PSM } = await import("tesseract.js");
      const at = { page: 1, total: doc.numPages };
      // "hin" alone misses Latin names/numbers common in real documents —
      // recognize alongside English unless the user opts out.
      const langs = ocrLang !== "eng" && ocrPlusEng ? `${ocrLang}+eng` : ocrLang;
      const worker = await createWorker(langs, 1, {
        // Best (float) models are markedly more accurate than the default fast
        // ones, and require the full core build. Separate cachePath keeps the
        // two model sets from colliding in IndexedDB.
        ...(ocrQuality === "best"
          ? { langPath: TESSDATA_BEST, cachePath: "tess-best", corePath: fullTessCorePath() }
          : { cachePath: "tess-fast" }),
        logger: (m: { status: string; progress: number }) => {
          if (m.status === "recognizing text") {
            const pct = Math.round(m.progress * 100);
            setOcrPct(pct);
            setOcrProgress(`Reading page ${at.page} of ${at.total} — ${pct}%`);
          }
        },
      });
      try {
        const PSM_MAP = { auto: PSM.AUTO, column: PSM.SINGLE_COLUMN, block: PSM.SINGLE_BLOCK, sparse: PSM.SPARSE_TEXT } as const;
        await worker.setParameters({
          tessedit_pageseg_mode: PSM_MAP[ocrLayout],
          preserve_interword_spaces: "1",
          user_defined_dpi: "300",
        });
        const out: OcrPage[] = [];
        for (let p = 1; p <= doc.numPages; p++) {
          if (docRef.current !== doc || ocrCancelRef.current) return; // replaced or cancelled
          at.page = p;
          setOcrPct(undefined);
          setOcrProgress(`Rendering page ${p} of ${doc.numPages} for OCR…`);
          const page = await doc.getPage(p);
          // Render near 300 DPI (Tesseract's sweet spot), capped for memory.
          const base = page.getViewport({ scale: 1 });
          const S = clamp(OCR_MAX_DIM / Math.max(base.width, base.height), 2, 4.2);
          const vp = page.getViewport({ scale: S });
          const canvas = document.createElement("canvas");
          canvas.width = Math.max(1, Math.floor(vp.width));
          canvas.height = Math.max(1, Math.floor(vp.height));
          const ctx = canvas.getContext("2d");
          if (!ctx) throw new Error("canvas");
          await page.render({ canvas, canvasContext: ctx, viewport: vp }).promise;
          ctx.globalCompositeOperation = "destination-over";
          ctx.fillStyle = "#fff";
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.globalCompositeOperation = "source-over";
          if (ocrEnhance) {
            setOcrProgress(`Enhancing page ${p} for OCR…`);
            await new Promise((r) => setTimeout(r, 0)); // let the progress line paint
            enhanceForOcr(ctx, canvas.width, canvas.height);
          }
          const { data } = await worker.recognize(canvas, {}, { blocks: true, text: true });
          const words: OcrWord[] = [];
          const lines: OcrLine[] = [];
          let confSum = 0;
          let confN = 0;
          for (const b of data.blocks ?? []) {
            for (const par of b.paragraphs) {
              for (const ln of par.lines) {
                const lt = ln.text.replace(/\s+/g, " ").trim();
                if (lt) {
                  lines.push({
                    text: lt,
                    x: ln.bbox.x0 / S,
                    y: ln.bbox.y0 / S,
                    w: (ln.bbox.x1 - ln.bbox.x0) / S,
                    h: (ln.bbox.y1 - ln.bbox.y0) / S,
                  });
                }
                for (const wd of ln.words) {
                  const t = wd.text.trim();
                  if (!t) continue;
                  confSum += wd.confidence ?? 0;
                  confN += 1;
                  words.push({
                    text: t,
                    x: wd.bbox.x0 / S,
                    y: wd.bbox.y0 / S,
                    w: (wd.bbox.x1 - wd.bbox.x0) / S,
                    h: (wd.bbox.y1 - wd.bbox.y0) / S,
                  });
                }
              }
            }
          }
          out.push({ page: p, text: (data.text ?? "").trim(), words, lines, conf: confN ? Math.round(confSum / confN) : undefined });
          setOcrPages([...out]);
        }
        setEmbedOcr(true);
      } finally {
        await worker.terminate().catch(() => undefined);
      }
    } catch {
      if (!ocrCancelRef.current) setError("OCR could not finish on this document — try again, or use a clearer scan.");
    } finally {
      setOcrBusy(false);
      setOcrProgress("");
      setOcrPct(undefined);
    }
  }

  function cancelOcr() { ocrCancelRef.current = true; }

  /**
   * Turn a page's OCR lines into real, editable annotations: each scanned
   * line is covered with whiteout and replaced by a text annotation carrying
   * the recognized string — double-click any line to correct it, drag to
   * move, Delete to remove. Undo restores the untouched scan.
   */
  function makePageEditable(pageNum: number) {
    const op = ocrPages.find((p) => p.page === pageNum);
    const pp = pagePts[pageNum - 1];
    if (!op || !pp || op.lines.length === 0) return;
    if (editSessionRef.current.live) commitEdit(false);
    const covers: Ann[] = [];
    const texts: Ann[] = [];
    for (const ln of op.lines) {
      const fs = clamp(Math.round(ln.h * 0.72), 5, 60);
      covers.push({
        id: newId(),
        page: pageNum,
        type: "whiteout",
        x: Math.max(0, ln.x - 2),
        y: Math.max(0, ln.y - 2),
        w: Math.min(ln.w + 4, pp.w - Math.max(0, ln.x - 2)),
        h: Math.min(ln.h + 4, pp.h - Math.max(0, ln.y - 2)),
      });
      const sized = sizeText(ln.text, fs);
      texts.push({
        id: newId(),
        page: pageNum,
        type: "text",
        x: ln.x,
        y: ln.y,
        w: Math.max(sized.w, 24),
        h: sized.h,
        text: ln.text,
        fontSize: fs,
        color: "black",
      });
    }
    // Whiteouts first so every replacement line renders (and exports) above them.
    commit([...anns, ...covers, ...texts]);
    setSelected(null);
    setTool("select");
    scrollToPage(pageNum);
  }

  async function copyToClipboard(key: string, text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey((k) => (k === key ? null : k)), 1200);
    } catch {
      setError("Could not copy to the clipboard.");
    }
  }

  function downloadOcrTxt() {
    const text = ocrPages.map((p) => p.text).filter(Boolean).join("\n\n");
    if (!text) return;
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${(file?.name ?? "document").replace(/\.pdf$/i, "")}-ocr.txt`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
  }

  // ── Export ───────────────────────────────────────────────────────────────
  async function exportPdf() {
    const bytes = bytesRef.current;
    if (!bytes || !file || exporting) return;
    if (editSessionRef.current.live) commitEdit(false);
    setExporting(true);
    setError(null);
    try {
      const { PDFDocument, StandardFonts, rgb, LineCapStyle } = await import("pdf-lib");
      const doc = await PDFDocument.load(bytes);
      const font = await doc.embedFont(StandardFonts.Helvetica);
      const pdfPages = doc.getPages();
      type Embedded = Awaited<ReturnType<typeof doc.embedPng>>;
      const imgCache = new Map<string, Embedded>();

      for (const a of anns) {
        const page = pdfPages[a.page - 1];
        if (!page) continue;
        const ph = page.getHeight();
        const [cr, cg, cb] = PDF_COLOR[a.color ?? "black"];
        const ink = rgb(cr, cg, cb);

        if (a.type === "whiteout") {
          page.drawRectangle({ x: a.x, y: ph - a.y - a.h, width: a.w, height: a.h, color: rgb(1, 1, 1) });
        } else if (a.type === "highlight") {
          page.drawRectangle({ x: a.x, y: ph - a.y - a.h, width: a.w, height: a.h, color: rgb(1, 0.92, 0.23), opacity: 0.35 });
        } else if (a.type === "text") {
          const fs = a.fontSize ?? 14;
          const lh = fs * LINE_HEIGHT;
          const lines = (a.text ?? "").split("\n");
          for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            if (!line) continue;
            const opts = { x: a.x, y: ph - a.y - i * lh - fs, size: fs, font, color: ink };
            try {
              page.drawText(line, opts);
            } catch {
              try { page.drawText(sanitizeWinAnsi(line), opts); } catch { /* skip unencodable line */ }
            }
          }
        } else if (a.type === "check") {
          // Uniform scale + centring matches the on-screen SVG (xMidYMid meet).
          const u = Math.max(0.1, Math.min(a.w / 12, a.h / 10));
          const x0 = a.x + (a.w - 12 * u) / 2;
          const yTop = a.y + (a.h - 10 * u) / 2;
          page.drawSvgPath("M 0 6 L 4 10 L 12 0", {
            x: x0,
            y: ph - yTop, // svg-path y grows downward from this anchor
            scale: u,
            borderColor: ink,
            borderWidth: Math.max(1, 1.8 * u),
            borderLineCap: LineCapStyle.Round,
          });
        } else if (a.type === "cross") {
          const ix = a.w * 0.14;
          const iy = a.h * 0.14;
          const t = Math.max(1, Math.min(a.w, a.h) * 0.13);
          page.drawLine({ start: { x: a.x + ix, y: ph - a.y - iy }, end: { x: a.x + a.w - ix, y: ph - a.y - a.h + iy }, thickness: t, color: ink, lineCap: LineCapStyle.Round });
          page.drawLine({ start: { x: a.x + a.w - ix, y: ph - a.y - iy }, end: { x: a.x + ix, y: ph - a.y - a.h + iy }, thickness: t, color: ink, lineCap: LineCapStyle.Round });
        } else if (a.type === "pen") {
          for (const st of a.points ?? []) {
            if (st.length === 0) continue;
            if (st.length === 1) {
              page.drawCircle({ x: st[0].x, y: ph - st[0].y, size: PEN_WIDTH / 2 + 0.2, color: ink });
              continue;
            }
            const d = `M ${st[0].x.toFixed(2)} ${st[0].y.toFixed(2)} ` +
              st.slice(1).map((p) => `L ${p.x.toFixed(2)} ${p.y.toFixed(2)}`).join(" ");
            page.drawSvgPath(d, { x: 0, y: ph, borderColor: ink, borderWidth: PEN_WIDTH, borderLineCap: LineCapStyle.Round });
          }
        } else if (a.type === "image" && a.dataUrl) {
          let img = imgCache.get(a.dataUrl);
          if (!img) {
            img = a.dataUrl.startsWith("data:image/png") ? await doc.embedPng(a.dataUrl) : await doc.embedJpg(a.dataUrl);
            imgCache.set(a.dataUrl, img);
          }
          page.drawImage(img, { x: a.x, y: ph - a.y - a.h, width: a.w, height: a.h });
        }
      }

      // Invisible OCR text layer — makes scanned PDFs selectable & searchable.
      if (embedOcr && ocrPages.length > 0) {
        for (const op of ocrPages) {
          const page = pdfPages[op.page - 1];
          if (!page) continue;
          const ph = page.getHeight();
          for (const wd of op.words) {
            const fs = Math.max(4, wd.h * 0.85);
            try {
              page.drawText(wd.text, { x: wd.x, y: ph - wd.y - wd.h, size: fs, font, color: rgb(0, 0, 0), opacity: 0.01 });
            } catch { /* word not WinAnsi-encodable — skip silently */ }
          }
        }
      }

      const outBytes = await doc.save();
      const blob = new Blob([outBytes.slice().buffer], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${file.name.replace(/\.pdf$/i, "")}-edited.pdf`;
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 4000);
    } catch {
      setError("Could not export this PDF. If it's password-protected, unlock it first.");
    } finally {
      setExporting(false);
    }
  }

  // ── Render helpers ───────────────────────────────────────────────────────
  const selectMode = tool === "select" && !editingId;
  const selectedAnn = selected ? anns.find((a) => a.id === selected) : undefined;
  const showFontSize = tool === "text" || editingId !== null || selectedAnn?.type === "text";

  function pageCursor(): string {
    if (tool === "whiteout" || tool === "highlight" || tool === "pen") return "crosshair";
    if (tool === "text" || tool === "check" || tool === "cross" || (tool === "image" && pendingImage)) return "copy";
    return "default";
  }

  function annTitle(a: Ann): string {
    if (a.type === "text" && a.text) {
      const t = a.text.replace(/\s+/g, " ").trim();
      return t.length > 22 ? `${t.slice(0, 22)}…` : t || "Text";
    }
    return ANN_LABEL[a.type];
  }

  function renderAnn(a: Ann, pageIdx: number, s: number) {
    if (a.id === editingId) return null; // the textarea takes over while editing
    const sel = selected === a.id;
    const box: React.CSSProperties = {
      position: "absolute",
      left: a.x * s,
      top: a.y * s,
      width: a.w * s,
      height: a.h * s,
      pointerEvents: selectMode ? "auto" : "none",
      cursor: selectMode ? "move" : undefined,
      outline: sel ? "1.5px solid var(--accent)" : undefined,
      outlineOffset: 1,
      touchAction: "none",
      userSelect: "none",
    };
    const inner = (() => {
      const css = CSS_COLOR[a.color ?? "black"];
      switch (a.type) {
        case "whiteout":
          return <div style={{ width: "100%", height: "100%", background: "#ffffff", boxShadow: sel ? undefined : "inset 0 0 0 1px rgba(0,0,0,0.18)" }} />;
        case "highlight":
          return <div style={{ width: "100%", height: "100%", background: HIGHLIGHT_CSS }} />;
        case "text":
          return (
            <div style={{ fontSize: (a.fontSize ?? 14) * s, lineHeight: LINE_HEIGHT, fontFamily: HELV, color: css, whiteSpace: "pre", overflow: "visible" }}>
              {a.text || " "}
            </div>
          );
        case "check":
          return (
            <svg width="100%" height="100%" viewBox="0 0 12 10" preserveAspectRatio="xMidYMid meet" style={{ display: "block" }} aria-hidden="true">
              <path d="M 0 6 L 4 10 L 12 0" fill="none" stroke={css} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          );
        case "cross":
          return (
            <svg width="100%" height="100%" viewBox="0 0 12 12" preserveAspectRatio="none" style={{ display: "block" }} aria-hidden="true">
              <line x1="1.7" y1="1.7" x2="10.3" y2="10.3" stroke={css} strokeWidth={1.6} strokeLinecap="round" />
              <line x1="10.3" y1="1.7" x2="1.7" y2="10.3" stroke={css} strokeWidth={1.6} strokeLinecap="round" />
            </svg>
          );
        case "image":
          return a.dataUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={a.dataUrl} alt="" draggable={false} style={{ width: "100%", height: "100%", display: "block" }} />
          ) : null;
        case "pen":
          return null; // strokes are drawn on the page-level SVG layer
      }
    })();
    return (
      <div
        key={a.id}
        style={box}
        onPointerDown={(e) => onAnnPointerDown(e, a, pageIdx)}
        onDoubleClick={a.type === "text" ? () => { if (selectMode) startEdit(a, false); } : undefined}
        title={selectMode ? (a.type === "text" ? "Drag to move — double-click to edit" : "Drag to move") : undefined}
      >
        {inner}
        {sel && selectMode && (
          <div
            onPointerDown={(e) => onHandlePointerDown(e, a, pageIdx)}
            title={a.type === "text" ? "Drag to widen the text box" : "Drag to resize"}
            style={{
              position: "absolute", right: -6, bottom: -6, width: 12, height: 12,
              background: "var(--accent)", border: "2px solid var(--surface)",
              borderRadius: 3, cursor: "nwse-resize", touchAction: "none",
            }}
          />
        )}
      </div>
    );
  }

  const hint: string = (() => {
    switch (tool) {
      case "select": return selectedAnn
        ? "Drag to move · corner handle resizes · arrows nudge · Ctrl/Cmd+D duplicates · Delete removes"
        : "Click an annotation to select it. Keys: V select, T text, W whiteout, H highlight, P pen.";
      case "text": return "Click on a page to place a text box. Enter commits, Shift+Enter adds a line.";
      case "whiteout": return "Drag on a page to cover content with an opaque white box.";
      case "highlight": return "Drag on a page to draw a highlight.";
      case "pen": return "Draw freehand — each stroke becomes an annotation you can move later.";
      case "check": return "Click on a page to place a checkmark.";
      case "cross": return "Click on a page to place a cross.";
      case "image": return pendingImage ? "Click on a page to place the image." : "Choose a PNG or JPG to stamp onto a page.";
    }
  })();

  const ocrAllText = ocrPages.map((p) => p.text).filter(Boolean).join("\n\n");
  const downloadDisabled = busy || (anns.length === 0 && !(embedOcr && ocrPages.length > 0));

  // ── Panel sections (shared by side panel and the narrow-viewport block) ──
  function panelContent() {
    return (
      <>
        {/* Selection properties */}
        <div>
          <p className="pdfx-ptitle">Selection</p>
          {selectedAnn ? (
            <div className="pdfx-card">
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                <span style={{ color: "var(--muted)", display: "flex" }}>{ICONS[selectedAnn.type === "pen" ? "pen" : selectedAnn.type]}</span>
                <span style={{ fontSize: ".82rem", fontWeight: 600 }}>{annTitle(selectedAnn)}</span>
                <span style={{ marginLeft: "auto", fontSize: ".7rem", color: "var(--faint, var(--muted))", fontFamily: "var(--font-mono, monospace)" }}>p.{selectedAnn.page}</span>
              </div>
              {(selectedAnn.type === "text" || selectedAnn.type === "pen" || selectedAnn.type === "check" || selectedAnn.type === "cross") && (
                <div className="pdfx-swatches" style={{ marginBottom: 10 }}>
                  {(Object.keys(CSS_COLOR) as ColorKey[]).map((c) => (
                    <button key={c} type="button" className="pdfx-sw" aria-label={`${c} ink`} title={c}
                      onClick={() => changeColor(c)}
                      style={{ background: CSS_COLOR[c], boxShadow: (selectedAnn.color ?? "black") === c ? "0 0 0 2px var(--accent)" : "0 0 0 1px var(--border)" }} />
                  ))}
                  {selectedAnn.type === "text" && (
                    <select className="pdfx-sel" value={selectedAnn.fontSize ?? 14} onChange={(e) => changeFontSize(Number(e.target.value))} aria-label="Text size" style={{ marginLeft: "auto" }}>
                      {[10, 12, 14, 16, 18, 20, 24, 28, 32, 36].map((v) => <option key={v} value={v}>{v} pt</option>)}
                    </select>
                  )}
                </div>
              )}
              <div style={{ display: "flex", gap: 6 }}>
                <button type="button" className="pdfx-tb" onClick={duplicateSelected} title="Duplicate (Ctrl/Cmd+D)" style={{ border: "1px solid var(--border)" }}>
                  {ICONS.copy}<span className="lbl">Duplicate</span>
                </button>
                <button type="button" className="pdfx-tb danger" onClick={deleteSelected} title="Delete (Del)" style={{ border: "1px solid var(--border)" }}>
                  {ICONS.trash}<span className="lbl">Delete</span>
                </button>
              </div>
            </div>
          ) : (
            <p className="pdfx-empty">Nothing selected. Use the Select tool and click any annotation on a page.</p>
          )}
        </div>

        {/* Annotation list */}
        <div>
          <p className="pdfx-ptitle">Annotations{anns.length > 0 ? ` · ${anns.length}` : ""}</p>
          {anns.length === 0 ? (
            <p className="pdfx-empty">None yet — pick a tool in the toolbar and click or drag on a page.</p>
          ) : (
            <div className="pdfx-list">
              {anns.map((a) => (
                <div key={a.id} role="button" tabIndex={0} className={`pdfx-row ${selected === a.id ? "on" : ""}`}
                  onClick={() => selectFromList(a)}
                  onKeyDown={(e) => { if (e.key === "Enter") selectFromList(a); }}>
                  <span className="ico">{ICONS[a.type === "pen" ? "pen" : a.type]}</span>
                  <span className="t">{annTitle(a)}</span>
                  <span className="pg">p.{a.page}</span>
                  <button type="button" className="del" aria-label="Delete annotation" title="Delete"
                    onClick={(e) => { e.stopPropagation(); deleteAnn(a.id); }}>
                    {ICONS.trash}
                  </button>
                </div>
              ))}
              <button type="button" className="pdfx-tb danger" style={{ marginTop: 6, alignSelf: "flex-start" }} onClick={() => { commit([]); setSelected(null); }}>
                Clear all
              </button>
            </div>
          )}
        </div>

        {/* OCR */}
        <div>
          <p className="pdfx-ptitle">OCR — text recognition</p>
          <div className="pdfx-card">
            <div style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 6 }}>
              <select className="pdfx-sel" value={ocrLang} onChange={(e) => setOcrLang(e.target.value)} disabled={ocrBusy} aria-label="OCR language" style={{ flex: 1 }}>
                {OCR_LANGS.map((l) => <option key={l.id} value={l.id}>{l.label}</option>)}
              </select>
              {ocrBusy ? (
                <button type="button" className="pdfx-tb" style={{ border: "1px solid var(--border)" }} onClick={cancelOcr}>Cancel</button>
              ) : (
                <button type="button" className="pdfx-tb" style={{ border: "1px solid var(--border)" }} onClick={runOcr} disabled={busy}>
                  {ICONS.ocr}<span className="lbl">{ocrPages.length > 0 ? "Re-run" : "Run OCR"}</span>
                </button>
              )}
            </div>
            <div style={{ display: "flex", gap: 6, marginBottom: 6 }}>
              <select className="pdfx-sel" value={ocrQuality} onChange={(e) => setOcrQuality(e.target.value as "best" | "fast")} disabled={ocrBusy}
                aria-label="OCR model quality" title="Best = float LSTM models, noticeably more accurate; bigger one-time download" style={{ flex: 1 }}>
                <option value="best">Best accuracy</option>
                <option value="fast">Fast (small download)</option>
              </select>
              <select className="pdfx-sel" value={ocrLayout} onChange={(e) => setOcrLayout(e.target.value as typeof ocrLayout)} disabled={ocrBusy}
                aria-label="Page layout hint" title="Hint for the layout analyser — use Sparse / label for forms, labels and receipts" style={{ flex: 1 }}>
                {OCR_LAYOUTS.map((l) => <option key={l.id} value={l.id}>{l.label}</option>)}
              </select>
            </div>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 8 }}>
              <label style={{ display: "flex", alignItems: "center", gap: 5, fontSize: ".74rem", color: "var(--muted)", cursor: "pointer" }}
                title="Grayscale + adaptive thresholding — recovers low-contrast scans and unevenly-lit phone photos">
                <input type="checkbox" checked={ocrEnhance} onChange={(e) => setOcrEnhance(e.target.checked)} disabled={ocrBusy} />
                Scan cleanup
              </label>
              {ocrLang !== "eng" && (
                <label style={{ display: "flex", alignItems: "center", gap: 5, fontSize: ".74rem", color: "var(--muted)", cursor: "pointer" }}
                  title="Also recognize English — for documents mixing scripts, names or numbers">
                  <input type="checkbox" checked={ocrPlusEng} onChange={(e) => setOcrPlusEng(e.target.checked)} disabled={ocrBusy} />
                  + English
                </label>
              )}
            </div>
            {ocrBusy && <WasmProgress status={ocrProgress || "Working…"} pct={ocrPct} />}
            {!ocrBusy && ocrPages.length === 0 && (
              <p className="pdfx-empty">Reads the text on every page — copy it out, or make a scanned PDF selectable and searchable.</p>
            )}
            {ocrPages.length > 0 && (
              <>
                <label style={{ display: "flex", alignItems: "flex-start", gap: 7, fontSize: ".76rem", color: "var(--muted)", margin: "8px 0 10px", cursor: "pointer", lineHeight: 1.45 }}>
                  <input type="checkbox" checked={embedOcr} onChange={(e) => setEmbedOcr(e.target.checked)} style={{ marginTop: 2 }} />
                  <span>Embed invisible text layer in the download — makes the scan selectable &amp; searchable</span>
                </label>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
                  <button type="button" className="pdfx-tb" style={{ border: "1px solid var(--border)" }} onClick={() => copyToClipboard("all", ocrAllText)} disabled={!ocrAllText}>
                    {copiedKey === "all" ? "Copied ✓" : "Copy all"}
                  </button>
                  <button type="button" className="pdfx-tb" style={{ border: "1px solid var(--border)" }} onClick={downloadOcrTxt} disabled={!ocrAllText}>
                    {ICONS.download}<span className="lbl">.txt</span>
                  </button>
                </div>
                <p className="pdfx-empty" style={{ marginBottom: 10 }}>
                  “Edit on page” covers each scanned line with editable text — double-click any line on the page to
                  correct it, drag to move, Delete to remove. Undo restores the original scan.
                </p>
                {ocrPages.map((p) => (
                  <div key={p.page} style={{ marginBottom: 10 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4, flexWrap: "wrap" }}>
                      <span style={{ fontSize: ".72rem", fontWeight: 600, color: "var(--muted)" }}>Page {p.page}</span>
                      {p.conf != null && <span style={{ fontSize: ".68rem", color: "var(--faint, var(--muted))", fontFamily: "var(--font-mono, monospace)" }}>{p.conf}%</span>}
                      <span style={{ marginLeft: "auto", display: "flex", gap: 4 }}>
                        <button type="button" className="pdfx-tb" style={{ padding: "3px 7px", border: "1px solid var(--border)" }}
                          onClick={() => makePageEditable(p.page)} disabled={busy || p.lines.length === 0}
                          title="Replace this page's scanned lines with editable text annotations">
                          Edit on page
                        </button>
                        <button type="button" className="pdfx-tb" style={{ padding: "3px 7px", border: "1px solid var(--border)" }}
                          onClick={() => copyToClipboard(`p${p.page}`, p.text)} disabled={!p.text}>
                          {copiedKey === `p${p.page}` ? "Copied ✓" : "Copy"}
                        </button>
                      </span>
                    </div>
                    <textarea readOnly className="pdfx-ocrtxt" value={p.text || "(no text found on this page)"} />
                  </div>
                ))}
              </>
            )}
          </div>
        </div>
      </>
    );
  }

  // ── UI ───────────────────────────────────────────────────────────────────
  return (
    <div>
      <style dangerouslySetInnerHTML={{ __html: PDFX_CSS }} />
      {/* Hidden input for the Image tool */}
      <input ref={imageInputRef} type="file" accept="image/png,image/jpeg" style={{ display: "none" }} onChange={onImageChosen} />

      {!file && (
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files?.[0]; if (f) openFile(f); }}
          style={{ border: "1.5px dashed var(--border)", borderRadius: 10, padding: "40px 20px", textAlign: "center", background: "var(--surface)" }}
        >
          <p style={{ fontWeight: 600, marginBottom: 6 }}>Drop a PDF here, or choose a file</p>
          <p style={{ color: "var(--muted)", fontSize: ".85rem", maxWidth: 560, margin: "0 auto 18px" }}>
            Fill forms, add text and checkmarks, whiteout or highlight content, draw with a pen, stamp images —
            and run OCR to copy text out of scans or make them searchable. Everything stays on your device.
          </p>
          <label className="btn" style={{ cursor: "pointer" }}>
            Choose PDF
            <input type="file" accept="application/pdf" style={{ display: "none" }} disabled={opening}
              onChange={(e) => { const f = e.target.files?.[0]; if (f) openFile(f); }} />
          </label>
          {opening && <div style={{ marginTop: 16 }}><WasmProgress status={progress || "Opening PDF…"} /></div>}
        </div>
      )}

      {file && (
        <div ref={wsRef} className={`pdfx-ws ${isFs ? "fs" : ""}`} style={{ background: "var(--surface)" }}>
          {/* ── Toolbar ─────────────────────────────────────────────────── */}
          <div className="pdfx-tbar" style={{ top: isFs ? 0 : 66 }}>
            <div className="pdfx-group" style={{ paddingLeft: 0, maxWidth: 190 }}>
              <span title={file.name} style={{ fontSize: ".76rem", color: "var(--muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {file.name}
              </span>
              <label className="pdfx-tb" style={{ cursor: "pointer", flexShrink: 0 }} title="Open a different PDF">
                <span className="lbl" style={{ textDecoration: "underline", textUnderlineOffset: 3 }}>Replace</span>
                <input type="file" accept="application/pdf" style={{ display: "none" }} disabled={busy}
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) openFile(f); }} />
              </label>
            </div>

            <div className="pdfx-group pdfx-tools">
              {TOOL_DEFS.map((t) => (
                <button key={t.id} type="button" className={`pdfx-tb ${tool === t.id ? "on" : ""}`} title={t.title}
                  aria-pressed={tool === t.id} onClick={() => onToolClick(t.id)} disabled={busy}>
                  {ICONS[t.id]}<span className="lbl">{t.label}</span>
                </button>
              ))}
            </div>

            <div className="pdfx-group">
              <div className="pdfx-swatches">
                {(Object.keys(CSS_COLOR) as ColorKey[]).map((c) => (
                  <button key={c} type="button" className="pdfx-sw" aria-label={`${c} ink`} aria-pressed={color === c} title={`${c[0].toUpperCase()}${c.slice(1)} ink`}
                    onClick={() => changeColor(c)} disabled={busy}
                    style={{ background: CSS_COLOR[c], boxShadow: color === c ? "0 0 0 2px var(--accent)" : "0 0 0 1px var(--border)" }} />
                ))}
              </div>
              {showFontSize && (
                <select className="pdfx-sel" value={fontSize} onChange={(e) => changeFontSize(Number(e.target.value))}
                  title="Text size (pt)" aria-label="Text size" disabled={busy} style={{ marginLeft: 6 }}>
                  {[10, 12, 14, 16, 18, 20, 24, 28, 32, 36].map((v) => <option key={v} value={v}>{v} pt</option>)}
                </select>
              )}
            </div>

            <div className="pdfx-group">
              <button type="button" className="pdfx-tb" onClick={undo} disabled={!canUndo || busy} title="Undo (Ctrl/Cmd+Z)">{ICONS.undo}</button>
              <button type="button" className="pdfx-tb" onClick={redo} disabled={!canRedo || busy} title="Redo (Ctrl/Cmd+Shift+Z)">{ICONS.redo}</button>
            </div>

            <div className="pdfx-group noline" style={{ marginLeft: "auto", paddingRight: 0 }}>
              <button type="button" className="pdfx-tb" onClick={toggleFullscreen} title={isFs ? "Exit fullscreen" : "Fullscreen editor"}>
                {isFs ? ICONS.shrink : ICONS.expand}
              </button>
              <button type="button" className="pdfx-tb primary" onClick={exportPdf} disabled={downloadDisabled}
                title={downloadDisabled && !busy ? "Add an annotation (or run OCR) first" : "Download the edited PDF"}>
                {ICONS.download}<span>{exporting ? "Preparing…" : "Download PDF"}</span>
              </button>
            </div>
          </div>

          {/* ── Status strip ────────────────────────────────────────────── */}
          <div className="pdfx-status">
            <span className="grow">
              {error ? <span style={{ color: "var(--danger, #e5484d)" }}>{error}</span> : hint}
            </span>
            {rotWarn && !error && <span style={{ flexShrink: 0 }}>Rotated pages may place annotations incorrectly.</span>}
            {(rendering || opening) && <span style={{ flexShrink: 0 }}>{progress || "Working…"}</span>}
          </div>

          {/* ── Workspace grid ──────────────────────────────────────────── */}
          <div className="pdfx-grid">
            {/* Thumbnails */}
            <aside className="pdfx-thumbs" aria-label="Page thumbnails">
              {pagePts.map((pp, i) => (
                <button key={i} type="button" className={`pdfx-thumb ${curPage === i + 1 ? "on" : ""}`}
                  onClick={() => scrollToPage(i + 1)} title={`Go to page ${i + 1}`}>
                  {views[i] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={views[i].url} alt={`Page ${i + 1} thumbnail`} loading="lazy" />
                  ) : (
                    <span style={{ display: "block", width: "100%", aspectRatio: `${pp.w} / ${pp.h}`, background: "var(--surface-2)", borderRadius: 3, border: "2px solid var(--border)" }} />
                  )}
                  <span className="n">{i + 1}</span>
                </button>
              ))}
            </aside>

            {/* Canvas */}
            <div className="pdfx-canvaswrap">
              <div ref={scrollBoxRef} className="pdfx-scroll" onScroll={onScrollPages}>
                {views.length === 0 && (
                  <div style={{ maxWidth: 420, margin: "60px auto" }}>
                    <WasmProgress status={progress || "Rendering pages…"} />
                  </div>
                )}
                {views.map((v, i) => {
                  const pageNum = i + 1;
                  const pp = pagePts[i];
                  const s = v.scale; // px per pt for THIS bitmap — stays correct mid-rezoom
                  if (!pp) return null;
                  const editingAnn = editingId ? anns.find((x) => x.id === editingId && x.page === pageNum) : undefined;
                  const editDims = editingAnn ? sizeText(editText || " ", editingAnn.fontSize ?? 14) : null;
                  return (
                    <div key={`${docKey}-${pageNum}`} style={{ width: "max-content", maxWidth: "100%", margin: "0 auto" }}>
                      <div
                        ref={(el) => { pageElsRef.current[i] = el; }}
                        onPointerDown={(e) => onPagePointerDown(e, i)}
                        onPointerMove={(e) => onPagePointerMove(e, i)}
                        onPointerUp={(e) => onPagePointerUp(e, i)}
                        onPointerCancel={onPagePointerCancel}
                        style={{
                          position: "relative", width: v.wPx, height: v.hPx, maxWidth: "100%",
                          touchAction: "none", cursor: pageCursor(), userSelect: "none",
                          background: "#fff", borderRadius: 2,
                          boxShadow: "0 0 0 1px rgba(0,0,0,0.06), 0 2px 10px rgba(0,0,0,0.14)",
                        }}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={v.url} alt={`Page ${pageNum}`} draggable={false}
                          style={{ display: "block", width: "100%", height: "100%", borderRadius: 2, pointerEvents: "none" }} />

                        {anns.filter((a) => a.page === pageNum).map((a) => renderAnn(a, i, s))}

                        {/* Pen strokes (committed + in-progress) in page-point space */}
                        <svg
                          viewBox={`0 0 ${pp.w} ${pp.h}`}
                          preserveAspectRatio="none"
                          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }}
                          aria-hidden="true"
                        >
                          {anns.filter((a) => a.page === pageNum && a.type === "pen").map((a) =>
                            (a.points ?? []).map((st, si) =>
                              st.length === 1 ? (
                                <circle key={`${a.id}-${si}`} cx={st[0].x} cy={st[0].y} r={PEN_WIDTH / 2 + 0.2} fill={CSS_COLOR[a.color ?? "black"]} />
                              ) : (
                                <polyline key={`${a.id}-${si}`} points={st.map((p) => `${p.x},${p.y}`).join(" ")}
                                  fill="none" stroke={CSS_COLOR[a.color ?? "black"]} strokeWidth={PEN_WIDTH}
                                  strokeLinecap="round" strokeLinejoin="round" />
                              )
                            )
                          )}
                          {draftStroke && draftStroke.page === pageNum && (
                            draftStroke.pts.length === 1 ? (
                              <circle cx={draftStroke.pts[0].x} cy={draftStroke.pts[0].y} r={PEN_WIDTH / 2 + 0.2} fill={CSS_COLOR[color]} />
                            ) : (
                              <polyline points={draftStroke.pts.map((p) => `${p.x},${p.y}`).join(" ")}
                                fill="none" stroke={CSS_COLOR[color]} strokeWidth={PEN_WIDTH}
                                strokeLinecap="round" strokeLinejoin="round" />
                            )
                          )}
                        </svg>

                        {/* Whiteout / highlight drag preview */}
                        {draftRect && draftRect.page === pageNum && (
                          <div style={{
                            position: "absolute",
                            left: draftRect.x * s, top: draftRect.y * s,
                            width: draftRect.w * s, height: draftRect.h * s,
                            background: draftRect.kind === "whiteout" ? "rgba(255,255,255,0.92)" : HIGHLIGHT_CSS,
                            boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.3)",
                            pointerEvents: "none",
                          }} />
                        )}

                        {/* Inline text editor */}
                        {editingAnn && editDims && (
                          <textarea
                            autoFocus
                            value={editText}
                            onChange={(e) => setEditText(e.target.value)}
                            onFocus={(e) => { const n = e.target.value.length; e.target.setSelectionRange(n, n); }}
                            onBlur={(e) => {
                              // Safari can steal focus right after placement via the
                              // compatibility mouse events — reclaim it instead of
                              // committing an empty box the user never got to type in.
                              if (Date.now() - editMountRef.current < 250) { e.target.focus(); return; }
                              commitEdit(false);
                            }}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); commitEdit(false); }
                              else if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); commitEdit(true); }
                            }}
                            onPointerDown={(e) => e.stopPropagation()}
                            spellCheck={false}
                            wrap="off"
                            aria-label="Edit text annotation"
                            style={{
                              position: "absolute",
                              left: editingAnn.x * s - 3,
                              top: editingAnn.y * s - 3,
                              width: Math.max(editDims.w * s, 60) + 24,
                              height: editDims.h * s + 10,
                              minWidth: 90,
                              padding: 2,
                              border: "1.5px solid var(--accent)",
                              borderRadius: 3,
                              background: "var(--surface)",
                              color: CSS_COLOR[editingAnn.color ?? "black"],
                              fontSize: (editingAnn.fontSize ?? 14) * s,
                              lineHeight: LINE_HEIGHT,
                              fontFamily: HELV,
                              whiteSpace: "pre",
                              resize: "none",
                              overflow: "hidden",
                              zIndex: 5,
                              minHeight: 0,
                            }}
                          />
                        )}
                      </div>
                      <div className="pdfx-pagechip">{pageNum} / {pagePts.length}</div>
                    </div>
                  );
                })}
              </div>

              {/* Floating zoom / page pill */}
              <div className="pdfx-pill" role="group" aria-label="Zoom and page">
                <button type="button" className="pdfx-tb" title="Zoom out" style={{ padding: "4px 8px" }}
                  onClick={() => setZoom((z) => Math.max(ZOOM_MIN, Math.round((z - ZOOM_STEP) * 100) / 100))}
                  disabled={zoom <= ZOOM_MIN || rendering || busy}>−</button>
                <span className="pct">{Math.round(zoom * 100)}%</span>
                <button type="button" className="pdfx-tb" title="Zoom in" style={{ padding: "4px 8px" }}
                  onClick={() => setZoom((z) => Math.min(ZOOM_MAX, Math.round((z + ZOOM_STEP) * 100) / 100))}
                  disabled={zoom >= ZOOM_MAX || rendering || busy}>+</button>
                <button type="button" className="pdfx-tb" title="Fit page width" style={{ padding: "4px 8px" }}
                  onClick={fitWidth} disabled={rendering || busy}>Fit</button>
                <span className="sep" aria-hidden="true" />
                <span className="pg">{curPage} / {pagePts.length}</span>
              </div>
            </div>

            {/* Side panel (wide viewports) */}
            <aside className="pdfx-panel" aria-label="Editor panel">
              {panelContent()}
            </aside>
          </div>

          {/* Panel content for narrow viewports */}
          <div className="pdfx-mpanel" style={{ padding: 12, borderTop: "1px solid var(--border)", display: undefined }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>{panelContent()}</div>
          </div>
        </div>
      )}

      {!file && error && <p style={{ color: "var(--danger, #ff6b6b)", marginTop: 12 }}>{error}</p>}

      <p className="privacy-note">
        🔒 Your PDF is edited — and OCR runs — entirely in your browser. The file never leaves your device.
      </p>
    </div>
  );
}
