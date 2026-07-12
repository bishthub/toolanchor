"use client";

// Word Editor — open a .docx (mammoth → HTML), edit it in a contenteditable
// "page", then export a real .docx (docx Packer), a vector PDF (print-to-PDF
// iframe, same pattern as WordToPdf), or .txt / .html. Drafts autosave to
// localStorage. Everything runs locally — nothing is uploaded.

import { useEffect, useRef, useState } from "react";
import type { Paragraph, ParagraphChild, Table } from "docx";

const DOCX_MIME = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
const STORAGE_KEY = "word-editor:doc";
const NUMBERING_REF = "we-ol";

type DocxMod = typeof import("docx");
type Alignment = DocxMod["AlignmentType"][keyof DocxMod["AlignmentType"]];
type Heading = DocxMod["HeadingLevel"][keyof DocxMod["HeadingLevel"]];
type DocBlock = Paragraph | Table;

function isDocx(f: File): boolean {
  return f.type === DOCX_MIME || /\.docx$/i.test(f.name);
}

function safeName(t: string): string {
  const cleaned = t.trim().replace(/[\\/:*?"<>|]+/g, "-").replace(/\s+/g, " ");
  return cleaned || "document";
}

function downloadBlob(blob: Blob, filename: string): void {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/** Standalone HTML document — used for the .html download and the PDF print frame. */
function buildExportHtml(bodyHtml: string, title: string): string {
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>${escapeHtml(title)}</title>
<style>
  @page { size: A4; }
  body { font-family: Georgia, "Times New Roman", serif; color: #1a1a1a; line-height: 1.55; padding: 24px; max-width: 52rem; margin: 0 auto; }
  h1 { font-size: 1.7rem; margin: 1.1em 0 .45em; line-height: 1.25; }
  h2 { font-size: 1.35rem; margin: 1em 0 .4em; line-height: 1.3; }
  h3 { font-size: 1.15rem; margin: .9em 0 .35em; }
  h4, h5, h6 { font-size: 1rem; margin: .8em 0 .3em; }
  p { margin: .6em 0; }
  ul, ol { margin: .6em 0; padding-left: 1.6em; }
  table { border-collapse: collapse; width: 100%; margin: 1em 0; }
  th, td { border: 1px solid #999; padding: 6px 10px; text-align: left; vertical-align: top; }
  th { background: #f2f2f2; }
  img { max-width: 100%; height: auto; }
  blockquote { margin: .8em 0; padding-left: 1em; border-left: 3px solid #ccc; color: #444; font-style: italic; }
  pre { font-family: ui-monospace, monospace; font-size: .88em; background: #f4f4f4; padding: .75em 1em; border-radius: 6px; white-space: pre-wrap; }
  a { color: #1a4fa0; }
</style>
</head>
<body>${bodyHtml}</body>
</html>`;
}

// ── Paste cleanup ──────────────────────────────────────────────────────────
// Word / Google Docs clipboard HTML is full of inline styles, classes and
// metadata. Keep the structure, fold bold/italic/underline styles into real
// tags, then strip everything except a few structural attributes.

const KEEP_ATTRS = new Set(["href", "src", "alt", "colspan", "rowspan"]);

function sanitizePastedHtml(html: string): string {
  const doc = new DOMParser().parseFromString(html, "text/html");
  doc.querySelectorAll("meta, style, link, script, title").forEach((n) => n.remove());

  for (const el of Array.from(doc.body.querySelectorAll<HTMLElement>("*"))) {
    const tag = el.tagName.toLowerCase();
    const fw = el.style.fontWeight;
    const fwNum = parseInt(fw, 10);
    const bold = fw === "bold" || fw === "bolder" || fwNum >= 600;
    const notBold = fw === "normal" || (fwNum > 0 && fwNum < 600);

    // Google Docs wraps the whole clipboard in <b style="font-weight:normal">.
    if ((tag === "b" || tag === "strong") && notBold) {
      el.replaceWith(...Array.from(el.childNodes));
      continue;
    }

    const wraps: Array<"b" | "i" | "u" | "s"> = [];
    if (bold && tag !== "b" && tag !== "strong") wraps.push("b");
    if (el.style.fontStyle === "italic" && tag !== "i" && tag !== "em") wraps.push("i");
    const deco = `${el.style.textDecoration} ${el.style.textDecorationLine}`;
    if (deco.includes("underline") && tag !== "u" && tag !== "a") wraps.push("u");
    if (deco.includes("line-through") && tag !== "s" && tag !== "strike" && tag !== "del") wraps.push("s");

    let target: HTMLElement = el;
    for (const w of wraps) {
      const wrap = doc.createElement(w);
      while (target.firstChild) wrap.appendChild(target.firstChild);
      target.appendChild(wrap);
      target = wrap;
    }
  }

  for (const el of Array.from(doc.body.querySelectorAll("*"))) {
    for (const attr of Array.from(el.attributes)) {
      if (!KEEP_ATTRS.has(attr.name.toLowerCase())) el.removeAttribute(attr.name);
    }
  }
  return doc.body.innerHTML;
}

// ── HTML → docx mapping ────────────────────────────────────────────────────

const BLOCK_TAGS = new Set([
  "p", "div", "h1", "h2", "h3", "h4", "h5", "h6", "ul", "ol", "li", "table",
  "blockquote", "pre", "hr", "section", "article", "header", "footer", "main",
  "aside", "figure", "address", "dl", "dt", "dd",
]);

type InlineFmt = {
  bold?: boolean;
  italics?: boolean;
  underline?: boolean;
  strike?: boolean;
  link?: boolean;
};

function makeRun(dx: DocxMod, text: string, fmt: InlineFmt): ParagraphChild {
  return new dx.TextRun({
    text,
    bold: fmt.bold,
    italics: fmt.italics,
    underline: fmt.underline ? {} : undefined,
    strike: fmt.strike,
    style: fmt.link ? "Hyperlink" : undefined,
  });
}

function collectChildren(dx: DocxMod, el: Node, fmt: InlineFmt, out: ParagraphChild[]): void {
  el.childNodes.forEach((child) => collectInline(dx, child, fmt, out));
}

function collectInline(dx: DocxMod, node: Node, fmt: InlineFmt, out: ParagraphChild[]): void {
  if (node.nodeType === Node.TEXT_NODE) {
    const t = (node.textContent ?? "").replace(/\s+/g, " ");
    if (!t || (t === " " && out.length === 0)) return;
    out.push(makeRun(dx, t, fmt));
    return;
  }
  if (!(node instanceof HTMLElement)) return;
  const tag = node.tagName.toLowerCase();
  switch (tag) {
    case "br":
      out.push(new dx.TextRun({ break: 1 }));
      return;
    case "img": // images aren't carried into the .docx export
      return;
    case "strong":
    case "b":
      collectChildren(dx, node, { ...fmt, bold: true }, out);
      return;
    case "em":
    case "i":
      collectChildren(dx, node, { ...fmt, italics: true }, out);
      return;
    case "u":
    case "ins":
      collectChildren(dx, node, { ...fmt, underline: true }, out);
      return;
    case "s":
    case "strike":
    case "del":
      collectChildren(dx, node, { ...fmt, strike: true }, out);
      return;
    case "a": {
      const href = node.getAttribute("href") ?? "";
      if (!href) {
        collectChildren(dx, node, fmt, out);
        return;
      }
      const kids: ParagraphChild[] = [];
      collectChildren(dx, node, { ...fmt, link: true, underline: true }, kids);
      if (kids.length > 0) out.push(new dx.ExternalHyperlink({ children: kids, link: href }));
      return;
    }
    default:
      collectChildren(dx, node, fmt, out);
      return;
  }
}

function alignmentOf(dx: DocxMod, el: HTMLElement): Alignment | undefined {
  const a = (el.style.textAlign || el.getAttribute("align") || "").toLowerCase();
  switch (a) {
    case "center": return dx.AlignmentType.CENTER;
    case "right": return dx.AlignmentType.RIGHT;
    case "justify": return dx.AlignmentType.JUSTIFIED;
    case "left": return dx.AlignmentType.LEFT;
    default: return undefined;
  }
}

function headingOf(dx: DocxMod, tag: string): Heading {
  if (tag === "h1") return dx.HeadingLevel.HEADING_1;
  if (tag === "h2") return dx.HeadingLevel.HEADING_2;
  return dx.HeadingLevel.HEADING_3; // h3–h6
}

function hasBlockChild(el: HTMLElement): boolean {
  return Array.from(el.children).some((c) => BLOCK_TAGS.has(c.tagName.toLowerCase()));
}

function buildTable(dx: DocxMod, el: HTMLElement): Table | null {
  const rows: InstanceType<DocxMod["TableRow"]>[] = [];
  for (const tr of Array.from(el.querySelectorAll("tr"))) {
    if (tr.closest("table") !== el) continue; // skip rows of nested tables
    const cells: InstanceType<DocxMod["TableCell"]>[] = [];
    for (const cell of Array.from(tr.children)) {
      const ct = cell.tagName.toLowerCase();
      if (ct !== "td" && ct !== "th") continue;
      const text = (cell.textContent ?? "").replace(/\s+/g, " ").trim();
      cells.push(new dx.TableCell({
        children: [new dx.Paragraph({
          children: text ? [new dx.TextRun({ text, bold: ct === "th" })] : [],
        })],
      }));
    }
    if (cells.length > 0) rows.push(new dx.TableRow({ children: cells }));
  }
  if (rows.length === 0) return null;
  return new dx.Table({ rows, width: { size: 100, type: dx.WidthType.PERCENTAGE } });
}

function walkList(
  dx: DocxMod,
  list: HTMLElement,
  ordered: boolean,
  level: number,
  instance: number | undefined,
  out: DocBlock[],
  counters: { list: number },
): void {
  const lvl = Math.min(level, 1); // one nesting level in the export
  let inst: number | undefined;
  if (ordered) {
    if (instance === undefined) counters.list += 1;
    inst = instance ?? counters.list;
  }
  for (const child of Array.from(list.children)) {
    if (!(child instanceof HTMLElement) || child.tagName.toLowerCase() !== "li") continue;
    const runs: ParagraphChild[] = [];
    const nested: HTMLElement[] = [];
    for (const part of Array.from(child.childNodes)) {
      const t = part instanceof HTMLElement ? part.tagName.toLowerCase() : "";
      if (t === "ul" || t === "ol") nested.push(part as HTMLElement);
      else collectInline(dx, part, {}, runs);
    }
    out.push(new dx.Paragraph({
      children: runs,
      alignment: alignmentOf(dx, child),
      bullet: ordered ? undefined : { level: lvl },
      numbering: ordered && inst !== undefined
        ? { reference: NUMBERING_REF, level: lvl, instance: inst }
        : undefined,
    }));
    for (const sub of nested) {
      const subOrdered = sub.tagName.toLowerCase() === "ol";
      walkList(dx, sub, subOrdered, level + 1, subOrdered && ordered ? inst : undefined, out, counters);
    }
  }
}

function walkBlocks(
  dx: DocxMod,
  container: Node,
  out: DocBlock[],
  ctx: { quote?: boolean },
  counters: { list: number },
): void {
  const baseFmt = (): InlineFmt => (ctx.quote ? { italics: true } : {});
  let pending: ParagraphChild[] = [];
  const flush = () => {
    if (pending.length > 0) {
      out.push(new dx.Paragraph({
        children: pending,
        indent: ctx.quote ? { left: 720 } : undefined,
      }));
      pending = [];
    }
  };

  for (const node of Array.from(container.childNodes)) {
    if (node.nodeType === Node.TEXT_NODE) {
      if (!(node.textContent ?? "").trim()) continue; // inter-block whitespace
      collectInline(dx, node, baseFmt(), pending);
      continue;
    }
    if (!(node instanceof HTMLElement)) continue;
    const tag = node.tagName.toLowerCase();
    if (!BLOCK_TAGS.has(tag)) {
      collectInline(dx, node, baseFmt(), pending); // loose inline content
      continue;
    }
    flush();
    switch (tag) {
      case "h1": case "h2": case "h3": case "h4": case "h5": case "h6": {
        const runs: ParagraphChild[] = [];
        collectChildren(dx, node, {}, runs);
        out.push(new dx.Paragraph({
          children: runs,
          heading: headingOf(dx, tag),
          alignment: alignmentOf(dx, node),
        }));
        break;
      }
      case "blockquote":
        walkBlocks(dx, node, out, { quote: true }, counters);
        break;
      case "ul":
      case "ol":
        walkList(dx, node, tag === "ol", 0, undefined, out, counters);
        break;
      case "table": {
        const t = buildTable(dx, node);
        if (t) out.push(t);
        else out.push(new dx.Paragraph({ text: (node.textContent ?? "").trim() }));
        break;
      }
      case "hr":
        out.push(new dx.Paragraph({ children: [], thematicBreak: true }));
        break;
      case "pre": {
        for (const line of (node.textContent ?? "").replace(/\r/g, "").split("\n")) {
          out.push(new dx.Paragraph({
            children: [new dx.TextRun({ text: line, font: "Courier New" })],
          }));
        }
        break;
      }
      default: {
        if (hasBlockChild(node)) {
          walkBlocks(dx, node, out, ctx, counters);
          break;
        }
        const runs: ParagraphChild[] = [];
        collectChildren(dx, node, baseFmt(), runs);
        out.push(new dx.Paragraph({
          children: runs,
          alignment: alignmentOf(dx, node),
          indent: ctx.quote ? { left: 720 } : undefined,
        }));
        break;
      }
    }
  }
  flush();
}

function buildDocxBlocks(dx: DocxMod, root: HTMLElement): DocBlock[] {
  const out: DocBlock[] = [];
  walkBlocks(dx, root, out, {}, { list: 0 });
  // A document must end with a paragraph (Word dislikes a trailing table).
  if (out.length === 0 || out[out.length - 1] instanceof dx.Table) {
    out.push(new dx.Paragraph({ children: [] }));
  }
  return out;
}

// ── Scoped editor styles ───────────────────────────────────────────────────

const EDITOR_CSS = `
.we-toolbar {
  position: sticky; top: 70px; z-index: 40;
  display: flex; flex-wrap: wrap; align-items: center; gap: 3px;
  padding: 6px; margin-bottom: 14px;
  background: var(--bg-2); border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.07);
}
.we-tbtn {
  display: inline-flex; align-items: center; justify-content: center;
  min-width: 30px; height: 30px; padding: 0 8px;
  border: 1px solid transparent; border-radius: 7px;
  background: transparent; color: var(--text);
  font-family: inherit; font-size: 0.85rem; line-height: 1;
  cursor: pointer;
}
.we-tbtn:hover { background: var(--accent-soft); }
.we-tbtn[data-active="true"] { background: var(--accent-soft); color: var(--accent); }
.we-sep { width: 1px; height: 20px; margin: 0 5px; background: var(--border); flex: 0 0 auto; }
.we-block {
  height: 30px; padding: 0 6px;
  border: 1px solid var(--border); border-radius: 7px;
  background: var(--bg-2); color: var(--text);
  font-family: inherit; font-size: 0.85rem; cursor: pointer;
}
.we-page {
  max-width: 52rem; min-height: 380px; margin: 0 auto;
  padding: clamp(1.25rem, 4vw, 3rem);
  background: var(--bg-2); color: var(--text);
  border: 1px solid var(--border); border-radius: var(--radius-sm);
  font-family: Georgia, "Times New Roman", serif;
  font-size: 1.02rem; line-height: 1.6;
  outline: none; overflow-wrap: break-word;
}
.we-page:focus { border-color: var(--accent); box-shadow: 0 0 0 3px var(--accent-soft); }
.we-page[data-empty="true"]::before {
  content: attr(data-placeholder);
  color: var(--muted); pointer-events: none; display: block;
}
.we-page > :first-child { margin-top: 0; }
.we-page h1 { font-size: 1.75rem; line-height: 1.25; margin: 1.1em 0 0.45em; }
.we-page h2 { font-size: 1.4rem; line-height: 1.3; margin: 1em 0 0.4em; }
.we-page h3 { font-size: 1.15rem; margin: 0.9em 0 0.35em; }
.we-page h4, .we-page h5, .we-page h6 { font-size: 1rem; margin: 0.8em 0 0.3em; }
.we-page p { margin: 0.6em 0; }
.we-page ul, .we-page ol { margin: 0.6em 0; padding-left: 1.6em; }
.we-page li { margin: 0.25em 0; }
.we-page blockquote {
  margin: 0.8em 0; padding-left: 1em;
  border-left: 3px solid var(--border); color: var(--muted); font-style: italic;
}
.we-page table { border-collapse: collapse; width: 100%; margin: 1em 0; }
.we-page th, .we-page td {
  border: 1px solid var(--border); padding: 6px 10px;
  text-align: left; vertical-align: top;
}
.we-page th { background: rgba(127, 127, 127, 0.08); }
.we-page img { max-width: 100%; height: auto; }
.we-page a { color: var(--accent); }
.we-page pre {
  font-family: var(--font-mono, ui-monospace, monospace); font-size: 0.88em;
  background: rgba(127, 127, 127, 0.08); padding: 0.75em 1em;
  border-radius: 8px; overflow-x: auto;
}
.we-status {
  display: flex; flex-wrap: wrap; align-items: center; gap: 6px 14px;
  margin-top: 10px; color: var(--muted); font-size: 0.82rem;
}
.we-spacer { flex: 1; }
.we-link {
  background: none; border: none; padding: 0;
  color: var(--accent); font: inherit; cursor: pointer; text-decoration: underline;
}
`;

// ── Small toolbar building blocks ──────────────────────────────────────────

function TBtn({ title, active, onClick, style, children }: {
  title: string;
  active?: boolean;
  onClick: () => void;
  style?: React.CSSProperties;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      className="we-tbtn"
      title={title}
      aria-label={title}
      aria-pressed={active === undefined ? undefined : active}
      data-active={active ? "true" : "false"}
      onMouseDown={(e) => e.preventDefault()} // keep the editor selection
      onClick={onClick}
      style={style}
    >
      {children}
    </button>
  );
}

function AlignGlyph({ mode }: { mode: "left" | "center" | "right" }) {
  const mid = mode === "left" ? [2, 9] : mode === "center" ? [4.5, 11.5] : [7, 14];
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true" focusable="false">
      <line x1={2} y1={4} x2={14} y2={4} stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" />
      <line x1={mid[0]} y1={8} x2={mid[1]} y2={8} stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" />
      <line x1={2} y1={12} x2={14} y2={12} stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" />
    </svg>
  );
}

// ── Component ──────────────────────────────────────────────────────────────

export default function WordEditor({ initialFiles }: { initialFiles?: File[] }) {
  const [title, setTitle] = useState("document");
  const [saved, setSaved] = useState(true);
  const [hasDraft, setHasDraft] = useState(false);
  const [warnings, setWarnings] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [words, setWords] = useState(0);
  const [chars, setChars] = useState(0);
  const [empty, setEmpty] = useState(true);
  const [fmt, setFmt] = useState({ bold: false, italic: false, underline: false, strike: false });
  const [block, setBlock] = useState("p");
  const [printSrc, setPrintSrc] = useState("");
  const [pdfHint, setPdfHint] = useState(false);

  const editorRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const statusTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const selThrottle = useRef<ReturnType<typeof setTimeout> | null>(null);
  const titleRef = useRef("document");
  const printPendingRef = useRef(false);

  function refreshStatus() {
    const ed = editorRef.current;
    if (!ed) return;
    const trimmed = (ed.innerText ?? "").replace(/\u00a0/g, " ").trim();
    setWords(trimmed ? trimmed.split(/\s+/).length : 0);
    setChars(trimmed.length);
    setEmpty(!trimmed && !ed.querySelector("img, table, hr"));
  }

  function syncToolbar() {
    const ed = editorRef.current;
    if (!ed) return;
    const sel = window.getSelection();
    if (!sel || !sel.anchorNode || !ed.contains(sel.anchorNode)) return;
    const q = (c: string): boolean => {
      try { return document.queryCommandState(c); } catch { return false; }
    };
    setFmt({ bold: q("bold"), italic: q("italic"), underline: q("underline"), strike: q("strikeThrough") });
    let b = "p";
    try { b = String(document.queryCommandValue("formatBlock") || "p").toLowerCase(); } catch { /* ignore */ }
    setBlock(b === "h1" || b === "h2" || b === "h3" || b === "blockquote" ? b : "p");
  }

  function saveNow() {
    const ed = editorRef.current;
    if (!ed) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ title: titleRef.current, html: ed.innerHTML }));
      setSaved(true);
      setHasDraft(true);
    } catch { /* storage full or blocked — ignore */ }
  }

  function scheduleSave() {
    setSaved(false);
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      saveTimer.current = null;
      saveNow();
    }, 800);
  }

  function onEdited() {
    scheduleSave();
    if (statusTimer.current) clearTimeout(statusTimer.current);
    statusTimer.current = setTimeout(() => {
      statusTimer.current = null;
      refreshStatus();
      syncToolbar();
    }, 250);
  }

  function exec(cmd: string, value?: string) {
    const ed = editorRef.current;
    if (!ed) return;
    ed.focus();
    try { document.execCommand("styleWithCSS", false, "false"); } catch { /* ignore */ }
    try { document.execCommand(cmd, false, value); } catch { /* ignore */ }
    onEdited();
    syncToolbar();
  }

  async function openFile(f: File) {
    setBusy(true);
    setError(null);
    try {
      const mod: any = await import("mammoth"); // eslint-disable-line @typescript-eslint/no-explicit-any
      const mammoth = mod.default ?? mod;
      const arrayBuffer = await f.arrayBuffer();
      const result = await mammoth.convertToHtml({ arrayBuffer });
      const ed = editorRef.current;
      if (!ed) return;
      if (!result.value || !String(result.value).trim()) {
        setError("No readable content was found in this document.");
        return;
      }
      ed.innerHTML = String(result.value);
      const notes = new Set<string>(result.messages.map((m: { message: string }) => m.message));
      setWarnings(notes.size);
      const base = f.name.replace(/\.docx$/i, "").trim() || "document";
      setTitle(base);
      titleRef.current = base;
      refreshStatus();
      scheduleSave();
      ed.focus();
    } catch (err) {
      console.error(err);
      setError("This file doesn't look like a .docx document.");
    } finally {
      setBusy(false);
    }
  }

  // Open a handed-over file, or restore the local draft.
  useEffect(() => {
    const f = initialFiles?.find(isDocx);
    if (f) {
      void openFile(f);
      return;
    }
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const draft = JSON.parse(raw) as { title?: unknown; html?: unknown };
      const ed = editorRef.current;
      if (ed && typeof draft.html === "string" && draft.html.trim()) {
        ed.innerHTML = draft.html;
        if (typeof draft.title === "string" && draft.title.trim()) {
          setTitle(draft.title);
          titleRef.current = draft.title;
        }
        setHasDraft(true);
        refreshStatus();
      }
    } catch { /* corrupted draft — ignore */ }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialFiles]);

  // Reflect bold/italic/… state while the caret moves (throttled).
  useEffect(() => {
    const onSelectionChange = () => {
      if (selThrottle.current) return;
      selThrottle.current = setTimeout(() => {
        selThrottle.current = null;
        syncToolbar();
      }, 150);
    };
    document.addEventListener("selectionchange", onSelectionChange);
    try { document.execCommand("defaultParagraphSeparator", false, "p"); } catch { /* ignore */ }
    return () => {
      document.removeEventListener("selectionchange", onSelectionChange);
      if (selThrottle.current) clearTimeout(selThrottle.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Flush a pending save when leaving the page.
  useEffect(() => {
    return () => {
      if (saveTimer.current) {
        clearTimeout(saveTimer.current);
        saveNow();
      }
      if (statusTimer.current) clearTimeout(statusTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!isDocx(f)) {
      setError("This file doesn't look like a .docx document.");
      e.target.value = "";
      return;
    }
    void openFile(f);
    e.target.value = "";
  }

  function onPaste(e: React.ClipboardEvent<HTMLDivElement>) {
    const htmlData = e.clipboardData.getData("text/html");
    if (!htmlData) return; // plain-text paste — let the browser handle it
    e.preventDefault();
    try {
      document.execCommand("insertHTML", false, sanitizePastedHtml(htmlData));
    } catch {
      const text = e.clipboardData.getData("text/plain");
      if (text) document.execCommand("insertText", false, text);
    }
    onEdited();
  }

  function onTitleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setTitle(e.target.value);
    titleRef.current = e.target.value;
    scheduleSave();
  }

  function newDocument() {
    const ed = editorRef.current;
    if (!ed) return;
    const hasContent = Boolean((ed.textContent ?? "").trim() || ed.querySelector("img, table"));
    if (hasContent && !window.confirm("Start a new document? The current content and its autosaved draft will be discarded.")) return;
    if (saveTimer.current) {
      clearTimeout(saveTimer.current);
      saveTimer.current = null;
    }
    ed.innerHTML = "";
    setTitle("document");
    titleRef.current = "document";
    setWarnings(0);
    setError(null);
    setSaved(true);
    setHasDraft(false);
    try { localStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
    refreshStatus();
    ed.focus();
  }

  function discardDraft() {
    if (!window.confirm("Delete the autosaved draft from this browser? The document stays open here.")) return;
    try { localStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
    setHasDraft(false);
  }

  function addLink() {
    const ed = editorRef.current;
    if (!ed) return;
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed || !sel.anchorNode || !ed.contains(sel.anchorNode)) {
      setError("Select some text first, then add the link.");
      return;
    }
    setError(null);
    const input = window.prompt("Link URL", "https://");
    if (!input || !input.trim() || input.trim() === "https://") return;
    const url = /^(https?:|mailto:)/i.test(input.trim()) ? input.trim() : `https://${input.trim()}`;
    exec("createLink", url);
  }

  function clearFormatting() {
    exec("removeFormat");
    exec("unlink");
  }

  async function downloadDocx() {
    const ed = editorRef.current;
    if (!ed) return;
    setBusy(true);
    setError(null);
    try {
      const dx = await import("docx");
      const blocks = buildDocxBlocks(dx, ed);
      const doc = new dx.Document({
        title: titleRef.current,
        numbering: {
          config: [{
            reference: NUMBERING_REF,
            levels: [0, 1].map((level) => ({
              level,
              format: dx.LevelFormat.DECIMAL,
              text: `%${level + 1}.`,
              alignment: dx.AlignmentType.START,
              style: { paragraph: { indent: { left: 720 * (level + 1), hanging: 360 } } },
            })),
          }],
        },
        sections: [{ children: blocks }],
      });
      const blob = await dx.Packer.toBlob(doc);
      downloadBlob(blob, `${safeName(titleRef.current)}.docx`);
    } catch (err) {
      console.error(err);
      setError("Couldn't build the .docx file. Try simplifying the document (e.g. remove unusual pasted content) and export again.");
    } finally {
      setBusy(false);
    }
  }

  function downloadPdf() {
    const ed = editorRef.current;
    if (!ed) return;
    setError(null);
    setPdfHint(true);
    printPendingRef.current = true;
    // Timestamp comment forces the iframe to reload (and print) every time.
    setPrintSrc(`${buildExportHtml(ed.innerHTML, titleRef.current)}\n<!-- ${Date.now()} -->`);
  }

  function onPrintFrameLoad() {
    if (!printPendingRef.current) return;
    printPendingRef.current = false;
    const win = iframeRef.current?.contentWindow;
    if (!win) {
      setError("The print preview isn't ready yet — try again in a moment.");
      return;
    }
    try {
      win.focus();
      win.print();
    } catch {
      setError("Your browser blocked printing. Try Download PDF again.");
    }
  }

  function downloadTxt() {
    const ed = editorRef.current;
    if (!ed) return;
    downloadBlob(new Blob([ed.innerText], { type: "text/plain;charset=utf-8" }), `${safeName(titleRef.current)}.txt`);
  }

  function downloadHtml() {
    const ed = editorRef.current;
    if (!ed) return;
    downloadBlob(
      new Blob([buildExportHtml(ed.innerHTML, titleRef.current)], { type: "text/html;charset=utf-8" }),
      `${safeName(titleRef.current)}.html`,
    );
  }

  return (
    <div>
      <style dangerouslySetInnerHTML={{ __html: EDITOR_CSS }} />

      <div className="row" style={{ alignItems: "flex-end", flexWrap: "wrap" }}>
        <div className="field" style={{ flex: "1 1 240px" }}>
          <label>Document title</label>
          <input className="input" value={title} onChange={onTitleChange} placeholder="document" />
        </div>
        <div className="field" style={{ flex: "0 0 auto" }}>
          <label>Document</label>
          <div className="row">
            <label className="btn secondary">
              Open .docx
              <input
                type="file"
                accept={`.docx,${DOCX_MIME}`}
                onChange={onFileChange}
                disabled={busy}
                style={{ display: "none" }}
              />
            </label>
            <button type="button" className="btn secondary" onClick={newDocument} disabled={busy}>
              New document
            </button>
          </div>
        </div>
      </div>

      {warnings > 0 && (
        <p style={{ fontSize: ".85rem", color: "var(--muted)" }}>
          Some content was simplified when opening the document ({warnings}{" "}
          {warnings === 1 ? "note" : "notes"}) — intricate layout features like text boxes or
          headers/footers don't carry over one-to-one.
        </p>
      )}
      {busy && <p style={{ color: "var(--muted)" }}>Working…</p>}
      {error && <p style={{ color: "#ff6b6b" }}>⚠ {error}</p>}

      <div className="we-toolbar" role="toolbar" aria-label="Formatting">
        <TBtn title="Undo (Ctrl+Z)" onClick={() => exec("undo")}>↶</TBtn>
        <TBtn title="Redo (Ctrl+Y)" onClick={() => exec("redo")}>↷</TBtn>
        <span className="we-sep" aria-hidden="true" />
        <select
          className="we-block"
          value={block}
          aria-label="Block format"
          onChange={(e) => {
            const v = e.target.value;
            setBlock(v);
            exec("formatBlock", `<${v}>`);
          }}
        >
          <option value="p">Paragraph</option>
          <option value="h1">Heading 1</option>
          <option value="h2">Heading 2</option>
          <option value="h3">Heading 3</option>
          <option value="blockquote">Quote</option>
        </select>
        <span className="we-sep" aria-hidden="true" />
        <TBtn title="Bold (Ctrl+B)" active={fmt.bold} onClick={() => exec("bold")} style={{ fontWeight: 700 }}>B</TBtn>
        <TBtn title="Italic (Ctrl+I)" active={fmt.italic} onClick={() => exec("italic")} style={{ fontStyle: "italic", fontFamily: "Georgia, serif" }}>I</TBtn>
        <TBtn title="Underline (Ctrl+U)" active={fmt.underline} onClick={() => exec("underline")} style={{ textDecoration: "underline" }}>U</TBtn>
        <TBtn title="Strikethrough" active={fmt.strike} onClick={() => exec("strikeThrough")} style={{ textDecoration: "line-through" }}>S</TBtn>
        <span className="we-sep" aria-hidden="true" />
        <TBtn title="Bulleted list" onClick={() => exec("insertUnorderedList")}>•&nbsp;List</TBtn>
        <TBtn title="Numbered list" onClick={() => exec("insertOrderedList")}>1.&nbsp;List</TBtn>
        <TBtn title="Decrease indent" onClick={() => exec("outdent")}>⇤</TBtn>
        <TBtn title="Increase indent" onClick={() => exec("indent")}>⇥</TBtn>
        <span className="we-sep" aria-hidden="true" />
        <TBtn title="Align left" onClick={() => exec("justifyLeft")}><AlignGlyph mode="left" /></TBtn>
        <TBtn title="Align center" onClick={() => exec("justifyCenter")}><AlignGlyph mode="center" /></TBtn>
        <TBtn title="Align right" onClick={() => exec("justifyRight")}><AlignGlyph mode="right" /></TBtn>
        <span className="we-sep" aria-hidden="true" />
        <TBtn title="Insert link" onClick={addLink}>Link</TBtn>
        <TBtn title="Clear formatting" onClick={clearFormatting}>Clear</TBtn>
      </div>

      <div
        ref={editorRef}
        className="we-page"
        contentEditable
        suppressContentEditableWarning
        role="textbox"
        aria-multiline="true"
        aria-label="Document editor"
        spellCheck
        data-empty={empty ? "true" : "false"}
        data-placeholder="Start typing — or open a .docx file to edit it here."
        onInput={onEdited}
        onPaste={onPaste}
      />

      <div className="we-status">
        <span>
          {words} {words === 1 ? "word" : "words"} · {chars} characters
        </span>
        <span className="we-spacer" aria-hidden="true" />
        <span aria-live="polite">{saved ? "Saved" : "Saving…"}</span>
        {hasDraft && (
          <button type="button" className="we-link" onClick={discardDraft}>
            Discard draft
          </button>
        )}
      </div>

      <div className="row" style={{ marginTop: 14, alignItems: "center", flexWrap: "wrap" }}>
        <button type="button" className="btn secondary" onClick={downloadTxt} disabled={busy || empty}>
          Download .txt
        </button>
        <button type="button" className="btn secondary" onClick={downloadHtml} disabled={busy || empty}>
          Download .html
        </button>
        <div style={{ marginLeft: "auto", display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button type="button" className="btn secondary" onClick={downloadPdf} disabled={busy || empty}>
            Download PDF
          </button>
          <button type="button" className="btn" onClick={() => { void downloadDocx(); }} disabled={busy || empty}>
            Download .docx
          </button>
        </div>
      </div>
      {pdfHint && (
        <p style={{ fontSize: ".85rem", opacity: 0.75, marginTop: 8 }}>
          In the print dialog that opens, choose <strong>Save as PDF</strong> as the destination —
          the browser prints the page natively, so the PDF is true vector output with selectable text.
        </p>
      )}

      {printSrc && (
        <iframe
          ref={iframeRef}
          srcDoc={printSrc}
          onLoad={onPrintFrameLoad}
          sandbox="allow-same-origin allow-modals"
          title="PDF export frame"
          aria-hidden="true"
          tabIndex={-1}
          style={{ position: "fixed", right: 0, bottom: 0, width: 1, height: 1, border: 0, opacity: 0, pointerEvents: "none" }}
        />
      )}

      <p className="privacy-note">
        🔒 Everything runs in your browser — documents never leave your device; drafts autosave locally.
      </p>
    </div>
  );
}
