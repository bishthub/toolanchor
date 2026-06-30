"use client";

import { useEffect, useState } from "react";
import { PDFDocument } from "pdf-lib";

/** Parse "1-3, 5, 8-10" → zero-based, de-duplicated, in-order page indices. */
function parseRanges(input: string, pageCount: number): number[] {
  const out: number[] = [];
  const seen = new Set<number>();
  for (const part of input.split(",")) {
    const chunk = part.trim();
    if (!chunk) continue;
    const m = chunk.match(/^(\d+)\s*-\s*(\d+)$/);
    if (m) {
      let [a, b] = [parseInt(m[1], 10), parseInt(m[2], 10)];
      if (a > b) [a, b] = [b, a];
      for (let p = a; p <= b; p++) addPage(p);
    } else if (/^\d+$/.test(chunk)) {
      addPage(parseInt(chunk, 10));
    }
  }
  function addPage(p: number) {
    if (p >= 1 && p <= pageCount && !seen.has(p)) {
      seen.add(p);
      out.push(p - 1);
    }
  }
  return out;
}

export default function SplitPdf({ initialFiles }: { initialFiles?: File[] }) {
  const [file, setFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState<number | null>(null);
  const [ranges, setRanges] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadFile(f: File | null) {
    setFile(f);
    setError(null);
    setPageCount(null);
    if (!f) return;
    try {
      const doc = await PDFDocument.load(await f.arrayBuffer());
      setPageCount(doc.getPageCount());
    } catch {
      setError("Could not read this PDF. It may be encrypted or corrupted.");
    }
  }

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    loadFile(e.target.files?.[0] || null);
  }

  useEffect(() => {
    const f = initialFiles?.find((x) => x.type === "application/pdf");
    if (f) loadFile(f);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialFiles]);

  async function extract() {
    if (!file || !pageCount) return;
    const indices = parseRanges(ranges, pageCount);
    if (!indices.length) {
      setError(`Enter valid pages between 1 and ${pageCount}, e.g. "1-3, 5".`);
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const src = await PDFDocument.load(await file.arrayBuffer());
      const out = await PDFDocument.create();
      const pages = await out.copyPages(src, indices);
      pages.forEach((p) => out.addPage(p));
      const bytes = await out.save();
      const blob = new Blob([bytes.slice().buffer], { type: "application/pdf" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `${file.name.replace(/\.pdf$/i, "")}-pages.pdf`;
      a.click();
      URL.revokeObjectURL(a.href);
    } catch (err) {
      setError("Could not split this PDF.");
      console.error(err);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <div className="field">
        <label>Choose a PDF file</label>
        <input type="file" accept="application/pdf" onChange={onFile} className="input" />
      </div>

      {pageCount !== null && (
        <>
          <p style={{ color: "var(--muted)", fontSize: ".9rem" }}>
            This PDF has <strong>{pageCount}</strong> page{pageCount === 1 ? "" : "s"}.
          </p>
          <div className="field">
            <label>Pages to extract (e.g. 1-3, 5, 8-{pageCount})</label>
            <input
              className="input"
              value={ranges}
              onChange={(e) => setRanges(e.target.value)}
              placeholder={`1-${Math.min(3, pageCount)}`}
            />
          </div>
          <button className="btn" onClick={extract} disabled={busy}>
            {busy ? "Extracting…" : "⬇ Extract pages"}
          </button>
        </>
      )}

      {error && <p style={{ color: "#ff6b6b", marginTop: 12 }}>{error}</p>}
      <p className="privacy-note">🔒 Your PDF is processed in your browser — never uploaded.</p>
    </div>
  );
}
