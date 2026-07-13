"use client";

import { useEffect, useRef, useState } from "react";
import WasmProgress from "@/components/WasmProgress";

const LANGS = [
  { code: "eng", label: "English" },
  { code: "spa", label: "Español" },
  { code: "fra", label: "Français" },
  { code: "deu", label: "Deutsch" },
  { code: "por", label: "Português" },
  { code: "ita", label: "Italiano" },
  { code: "hin", label: "हिन्दी" },
];

export default function OcrPdf({ initialFiles }: { initialFiles?: File[] }) {
  const [file, setFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [lang, setLang] = useState("eng");
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState("");
  const [progressPct, setProgressPct] = useState<number | undefined>(undefined);
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  // The tesseract logger is a closure created once — track the current page here.
  const pageProgress = useRef({ page: 0, total: 0 });

  async function load(f: File) {
    setError(null);
    setText("");
    setFile(f);
    setPageCount(0);
    try {
      const pdfjs = await import("pdfjs-dist");
      pdfjs.GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url).toString();
      const doc = await pdfjs.getDocument({ data: await f.arrayBuffer() }).promise;
      setPageCount(doc.numPages);
    } catch (err) {
      console.error(err);
      setError("Could not open this PDF. It may be encrypted — unlock it first.");
      setFile(null);
    }
  }

  useEffect(() => {
    const f = initialFiles?.find((x) => x.type === "application/pdf" || /\.pdf$/i.test(x.name));
    if (f) load(f);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialFiles]);

  async function run() {
    if (!file || busy) return;
    setBusy(true);
    setError(null);
    setText("");
    setCopied(false);
    setProgressPct(undefined);
    setProgress("Loading OCR engine…");
    try {
      const pdfjs = await import("pdfjs-dist");
      pdfjs.GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url).toString();
      const doc = await pdfjs.getDocument({ data: await file.arrayBuffer() }).promise;
      const total = doc.numPages;
      pageProgress.current = { page: 0, total };

      const { createWorker } = await import("tesseract.js");
      const worker = await createWorker(lang, 1, {
        logger: (m: { status: string; progress: number }) => {
          const p = pageProgress.current;
          if (m.status === "recognizing text" && p.page > 0) {
            const pct = Math.round(m.progress * 100);
            setProgressPct(pct);
            setProgress(`Page ${p.page}/${p.total} — recognising… ${pct}%`);
          }
        },
      });

      try {
        let out = "";
        for (let i = 1; i <= total; i++) {
          pageProgress.current = { page: i, total };
          setProgressPct(undefined);
          setProgress(`Page ${i}/${total} — rendering…`);
          const page = await doc.getPage(i);
          const base = page.getViewport({ scale: 1 });
          // Scale 2 for crisp OCR, but cap canvas width at ~2400px for very large pages.
          const scale = Math.min(2, 2400 / base.width);
          const viewport = page.getViewport({ scale });
          const canvas = document.createElement("canvas");
          canvas.width = Math.floor(viewport.width);
          canvas.height = Math.floor(viewport.height);
          const ctx = canvas.getContext("2d")!;
          await page.render({ canvas, canvasContext: ctx, viewport }).promise;
          const { data } = await worker.recognize(canvas);
          out += `--- Page ${i} ---\n${data.text.trim()}\n\n`;
          setText(out.trim());
        }
        setText(out.trim());
      } finally {
        await worker.terminate();
      }
      setProgress("");
    } catch (err) {
      console.error(err);
      setError("Could not run OCR on this PDF. Please try another file.");
    } finally {
      setBusy(false);
    }
  }

  async function copy() {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  }

  function downloadTxt() {
    const blob = new Blob([text], { type: "text/plain" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = file ? `${file.name.replace(/\.pdf$/i, "")}.txt` : "ocr.txt";
    a.click();
    URL.revokeObjectURL(a.href);
  }

  // If OCR finished but found almost nothing, the scan is probably too poor to read.
  const recognisedChars = text.replace(/--- Page \d+ ---/g, "").replace(/\s+/g, "").length;
  const nearlyEmpty = !busy && text.length > 0 && recognisedChars < 20;

  return (
    <div>
      <div className="field">
        <label>Choose a scanned PDF</label>
        <input
          type="file"
          accept="application/pdf"
          className="input"
          disabled={busy}
          onChange={(e) => { const f = e.target.files?.[0]; if (f) load(f); }}
        />
      </div>

      <div className="field">
        <label>Document language</label>
        <select className="input" value={lang} onChange={(e) => setLang(e.target.value)} disabled={busy}>
          {LANGS.map((l) => (
            <option key={l.code} value={l.code}>{l.label}</option>
          ))}
        </select>
      </div>

      {file && pageCount > 0 && (
        <p style={{ color: "var(--muted)", fontSize: ".85rem" }}>
          {file.name} — {pageCount} page{pageCount === 1 ? "" : "s"}
        </p>
      )}

      {pageCount > 20 && (
        <p style={{ color: "var(--muted)", fontSize: ".85rem" }}>
          OCR runs on your device — long documents take a while; consider splitting first.
        </p>
      )}

      <div className="row" style={{ marginTop: 8 }}>
        <button className="btn" onClick={run} disabled={!file || pageCount === 0 || busy}>
          {busy ? "Working…" : "Run OCR"}
        </button>
      </div>

      {busy && <WasmProgress status={progress || "Working…"} pct={progressPct} />}
      {error && <p style={{ color: "#ff6b6b", marginTop: 12 }}>{error}</p>}

      {text && (
        <div className="field" style={{ marginTop: 14 }}>
          <label>Recognised text</label>
          <textarea readOnly value={text} rows={14} className="input" />
          {nearlyEmpty && (
            <p style={{ color: "var(--muted)", fontSize: ".85rem", marginTop: 6 }}>
              Almost no text was recognised — the scan quality may be too low. Try a higher-resolution scan or a different language.
            </p>
          )}
          <div className="row" style={{ marginTop: 8 }}>
            <button className="btn" onClick={copy}>{copied ? "Copied ✓" : "Copy"}</button>
            <button className="btn secondary" onClick={downloadTxt}>Download .txt</button>
          </div>
        </div>
      )}

      <p className="privacy-note">🔒 OCR runs entirely in your browser — your PDF never leaves your device. The engine downloads once on first use.</p>
    </div>
  );
}
