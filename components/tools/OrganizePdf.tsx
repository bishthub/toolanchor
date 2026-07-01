"use client";

import { useEffect, useState } from "react";
import { PDFDocument } from "pdf-lib";

export default function OrganizePdf({ initialFiles }: { initialFiles?: File[] }) {
  const [file, setFile] = useState<File | null>(null);
  // `order` holds the zero-based source page indices in the desired sequence.
  const [order, setOrder] = useState<number[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load(f: File) {
    setError(null);
    setFile(f);
    try {
      const doc = await PDFDocument.load(await f.arrayBuffer());
      setOrder(doc.getPageIndices());
    } catch (err) {
      setError("Could not read this PDF. It may be encrypted or corrupted.");
      setOrder([]);
      console.error(err);
    }
  }

  useEffect(() => {
    const f = initialFiles?.find((x) => x.type === "application/pdf");
    if (f) load(f);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialFiles]);

  function move(i: number, dir: -1 | 1) {
    setOrder((prev) => {
      const next = [...prev];
      const t = i + dir;
      if (t < 0 || t >= next.length) return prev;
      [next[i], next[t]] = [next[t], next[i]];
      return next;
    });
  }
  function remove(i: number) {
    setOrder((prev) => prev.filter((_, idx) => idx !== i));
  }

  async function run() {
    if (!file || !order.length) return;
    setBusy(true);
    setError(null);
    try {
      const src = await PDFDocument.load(await file.arrayBuffer());
      const out = await PDFDocument.create();
      const copied = await out.copyPages(src, order);
      copied.forEach((p) => out.addPage(p));
      const bytes = await out.save();
      const blob = new Blob([bytes.slice().buffer], { type: "application/pdf" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `${file.name.replace(/\.pdf$/i, "")}-organized.pdf`;
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

      {order.length > 0 && (
        <>
          <div className="field">
            <label>Reorder or remove pages ({order.length} page{order.length === 1 ? "" : "s"})</label>
            <ul className="file-list">
              {order.map((pageIndex, i) => (
                <li key={`${pageIndex}-${i}`}>
                  <span style={{ color: "var(--muted)" }}>{i + 1}.</span>
                  <span>Page {pageIndex + 1}</span>
                  <button className="x" onClick={() => move(i, -1)} title="Move up" disabled={i === 0}>↑</button>
                  <button className="x" onClick={() => move(i, 1)} title="Move down" disabled={i === order.length - 1}>↓</button>
                  <span className="x" onClick={() => remove(i)} title="Remove page">✕</span>
                </li>
              ))}
            </ul>
          </div>
          <button className="btn" onClick={run} disabled={busy}>
            {busy ? "Building…" : "⬇ Save reorganized PDF"}
          </button>
        </>
      )}

      {error && <p style={{ color: "#ff6b6b", marginTop: 12 }}>{error}</p>}
      <p className="privacy-note">🔒 Your PDF is reorganized in your browser — never uploaded.</p>
    </div>
  );
}
