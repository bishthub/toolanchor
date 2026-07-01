"use client";

import { useEffect, useState } from "react";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

type Pos = "left" | "center" | "right";

export default function PdfPageNumbers({ initialFiles }: { initialFiles?: File[] }) {
  const [file, setFile] = useState<File | null>(null);
  const [pos, setPos] = useState<Pos>("center");
  const [start, setStart] = useState("1");
  const [withTotal, setWithTotal] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const f = initialFiles?.find((x) => x.type === "application/pdf");
    if (f) { setFile(f); setError(null); }
  }, [initialFiles]);

  async function run() {
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      const doc = await PDFDocument.load(await file.arrayBuffer());
      const font = await doc.embedFont(StandardFonts.Helvetica);
      const pages = doc.getPages();
      const startAt = parseInt(start, 10) || 1;
      const size = 11;
      const margin = 28;
      pages.forEach((page, i) => {
        const { width } = page.getSize();
        const n = startAt + i;
        const text = withTotal ? `${n} / ${startAt + pages.length - 1}` : `${n}`;
        const tw = font.widthOfTextAtSize(text, size);
        let x = width / 2 - tw / 2;
        if (pos === "left") x = margin;
        if (pos === "right") x = width - margin - tw;
        page.drawText(text, { x, y: margin, size, font, color: rgb(0.15, 0.15, 0.15) });
      });
      const bytes = await doc.save();
      const blob = new Blob([bytes.slice().buffer], { type: "application/pdf" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `${file.name.replace(/\.pdf$/i, "")}-numbered.pdf`;
      a.click();
      URL.revokeObjectURL(a.href);
    } catch (err) {
      setError("Could not add page numbers. The PDF may be encrypted or corrupted.");
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
          onChange={(e) => { setFile(e.target.files?.[0] || null); setError(null); }}
          className="input"
        />
      </div>

      <div className="field">
        <label>Position</label>
        <div className="row">
          {(["left", "center", "right"] as const).map((p) => (
            <button key={p} type="button" className={`btn ${pos === p ? "" : "secondary"}`} onClick={() => setPos(p)}>
              {p[0].toUpperCase() + p.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="row">
        <div className="field">
          <label>Start at</label>
          <input type="number" className="input" value={start} onChange={(e) => setStart(e.target.value)} min={1} />
        </div>
        <div className="field">
          <label>Format</label>
          <label style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 6 }}>
            <input type="checkbox" checked={withTotal} onChange={(e) => setWithTotal(e.target.checked)} />
            <span style={{ color: "var(--muted)" }}>Show “n / total”</span>
          </label>
        </div>
      </div>

      <button className="btn" onClick={run} disabled={!file || busy}>
        {busy ? "Adding…" : "⬇ Add page numbers & download"}
      </button>

      {error && <p style={{ color: "#ff6b6b", marginTop: 12 }}>{error}</p>}
      <p className="privacy-note">🔒 Your PDF is processed in your browser — never uploaded.</p>
    </div>
  );
}
