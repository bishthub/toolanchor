"use client";

import { useEffect, useState } from "react";
import { PDFDocument } from "pdf-lib";

export default function DeletePdfPages({ initialFiles }: { initialFiles?: File[] }) {
  const [file, setFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [toDelete, setToDelete] = useState<Set<number>>(new Set());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load(f: File) {
    setError(null);
    setFile(f);
    setToDelete(new Set());
    try {
      const doc = await PDFDocument.load(await f.arrayBuffer());
      setPageCount(doc.getPageCount());
    } catch (err) {
      setError("Could not read this PDF. It may be encrypted or corrupted.");
      setPageCount(0);
      console.error(err);
    }
  }

  useEffect(() => {
    const f = initialFiles?.find((x) => x.type === "application/pdf");
    if (f) load(f);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialFiles]);

  function toggle(i: number) {
    setToDelete((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i); else next.add(i);
      return next;
    });
  }

  const keptCount = pageCount - toDelete.size;

  async function run() {
    if (!file || keptCount <= 0) return;
    setBusy(true);
    setError(null);
    try {
      const src = await PDFDocument.load(await file.arrayBuffer());
      const out = await PDFDocument.create();
      const keep = src.getPageIndices().filter((i) => !toDelete.has(i));
      const copied = await out.copyPages(src, keep);
      copied.forEach((p) => out.addPage(p));
      const bytes = await out.save();
      const blob = new Blob([bytes.slice().buffer], { type: "application/pdf" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `${file.name.replace(/\.pdf$/i, "")}-pages-removed.pdf`;
      a.click();
      URL.revokeObjectURL(a.href);
    } catch (err) {
      setError("Could not rebuild this PDF.");
      console.error(err);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <div className="field">
        <label>Choose a PDF file</label>
        <input
          type="file"
          accept="application/pdf"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) load(f); }}
          className="input"
        />
      </div>

      {pageCount > 0 && (
        <>
          <div className="field">
            <label>Tap the pages you want to delete ({toDelete.size} selected, {keptCount} will remain)</label>
            <div className="page-grid">
              {Array.from({ length: pageCount }, (_, i) => (
                <button
                  key={i}
                  type="button"
                  className={`page-cell ${toDelete.has(i) ? "is-deleting" : ""}`}
                  onClick={() => toggle(i)}
                  aria-pressed={toDelete.has(i)}
                >
                  <span className="page-num">{i + 1}</span>
                  {toDelete.has(i) && <span className="page-x" aria-hidden="true">✕</span>}
                </button>
              ))}
            </div>
          </div>
          <button className="btn" onClick={run} disabled={busy || toDelete.size === 0 || keptCount <= 0}>
            {busy ? "Building…" : `⬇ Delete ${toDelete.size} page${toDelete.size === 1 ? "" : "s"} & download`}
          </button>
          {keptCount <= 0 && <p style={{ color: "#ff6b6b", marginTop: 10 }}>You can’t delete every page — keep at least one.</p>}
        </>
      )}

      {error && <p style={{ color: "#ff6b6b", marginTop: 12 }}>{error}</p>}
      <p className="privacy-note">🔒 Your PDF is edited in your browser — never uploaded.</p>
    </div>
  );
}
