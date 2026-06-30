"use client";

import { useEffect, useState } from "react";
import { PDFDocument } from "pdf-lib";

interface Item {
  id: string;
  name: string;
  file: File;
}

export default function MergePdf({ initialFiles }: { initialFiles?: File[] }) {
  const [items, setItems] = useState<Item[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const pdfs = (initialFiles ?? []).filter((f) => f.type === "application/pdf");
    if (pdfs.length) {
      setItems((prev) => [...prev, ...pdfs.map((f) => ({ id: `${f.name}-${f.size}-${Math.random()}`, name: f.name, file: f }))]);
    }
  }, [initialFiles]);

  function addFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []).filter((f) => f.type === "application/pdf");
    setItems((prev) => [
      ...prev,
      ...files.map((f) => ({ id: `${f.name}-${f.size}-${Math.random()}`, name: f.name, file: f })),
    ]);
    e.target.value = "";
  }

  function remove(id: string) {
    setItems((prev) => prev.filter((i) => i.id !== id));
  }

  function move(index: number, dir: -1 | 1) {
    setItems((prev) => {
      const next = [...prev];
      const target = index + dir;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  async function merge() {
    if (items.length < 2) return;
    setBusy(true);
    setError(null);
    try {
      const out = await PDFDocument.create();
      for (const item of items) {
        const bytes = await item.file.arrayBuffer();
        const doc = await PDFDocument.load(bytes);
        const pages = await out.copyPages(doc, doc.getPageIndices());
        pages.forEach((p) => out.addPage(p));
      }
      const merged = await out.save();
      // Copy into a fresh ArrayBuffer so the Blob type is unambiguous.
      const blob = new Blob([merged.slice().buffer], { type: "application/pdf" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "merged.pdf";
      a.click();
      URL.revokeObjectURL(a.href);
    } catch (err) {
      setError("Could not merge these files. Make sure they are valid, unencrypted PDFs.");
      console.error(err);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <div className="field">
        <label>Add PDF files (2 or more)</label>
        <input type="file" accept="application/pdf" multiple onChange={addFiles} className="input" />
      </div>

      {items.length > 0 && (
        <ul className="file-list">
          {items.map((item, i) => (
            <li key={item.id}>
              <span style={{ color: "var(--muted)" }}>{i + 1}.</span>
              <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {item.name}
              </span>
              <button className="x" onClick={() => move(i, -1)} title="Move up" disabled={i === 0}>↑</button>
              <button className="x" onClick={() => move(i, 1)} title="Move down" disabled={i === items.length - 1}>↓</button>
              <span className="x" onClick={() => remove(item.id)} title="Remove">✕</span>
            </li>
          ))}
        </ul>
      )}

      <button className="btn" onClick={merge} disabled={items.length < 2 || busy}>
        {busy ? "Merging…" : `⬇ Merge ${items.length || ""} PDFs`}
      </button>

      {error && <p style={{ color: "#ff6b6b", marginTop: 12 }}>{error}</p>}

      <p className="privacy-note">🔒 Merging runs in your browser — files are never uploaded.</p>
    </div>
  );
}
