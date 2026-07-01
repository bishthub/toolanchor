"use client";

import { useEffect, useState } from "react";
import { PDFDocument, StandardFonts, degrees, rgb } from "pdf-lib";

export default function WatermarkPdf({ initialFiles }: { initialFiles?: File[] }) {
  const [file, setFile] = useState<File | null>(null);
  const [text, setText] = useState("CONFIDENTIAL");
  const [opacity, setOpacity] = useState(0.2);
  const [size, setSize] = useState(52);
  const [diagonal, setDiagonal] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const f = initialFiles?.find((x) => x.type === "application/pdf");
    if (f) { setFile(f); setError(null); }
  }, [initialFiles]);

  async function run() {
    if (!file || !text.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const doc = await PDFDocument.load(await file.arrayBuffer());
      const font = await doc.embedFont(StandardFonts.HelveticaBold);
      for (const page of doc.getPages()) {
        const { width, height } = page.getSize();
        const tw = font.widthOfTextAtSize(text, size);
        const angle = diagonal ? 45 : 0;
        // Anchor near the centre, offset so the text is roughly centred.
        const rad = (angle * Math.PI) / 180;
        const x = width / 2 - (tw / 2) * Math.cos(rad);
        const y = height / 2 - (tw / 2) * Math.sin(rad);
        page.drawText(text, {
          x, y, size, font,
          color: rgb(0.5, 0.5, 0.5),
          opacity,
          rotate: degrees(angle),
        });
      }
      const bytes = await doc.save();
      const blob = new Blob([bytes.slice().buffer], { type: "application/pdf" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `${file.name.replace(/\.pdf$/i, "")}-watermarked.pdf`;
      a.click();
      URL.revokeObjectURL(a.href);
    } catch (err) {
      setError("Could not watermark this PDF. It may be encrypted or corrupted.");
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
        <label>Watermark text</label>
        <input type="text" className="input" value={text} onChange={(e) => setText(e.target.value)} maxLength={40} />
      </div>

      <div className="row">
        <div className="field">
          <label>Opacity: {Math.round(opacity * 100)}%</label>
          <input type="range" min={0.05} max={0.6} step={0.05} value={opacity} onChange={(e) => setOpacity(parseFloat(e.target.value))} />
        </div>
        <div className="field">
          <label>Font size: {size}</label>
          <input type="range" min={16} max={120} step={4} value={size} onChange={(e) => setSize(parseInt(e.target.value, 10))} />
        </div>
        <div className="field">
          <label>Angle</label>
          <label style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 6 }}>
            <input type="checkbox" checked={diagonal} onChange={(e) => setDiagonal(e.target.checked)} />
            <span style={{ color: "var(--muted)" }}>Diagonal (45°)</span>
          </label>
        </div>
      </div>

      <button className="btn" onClick={run} disabled={!file || !text.trim() || busy}>
        {busy ? "Adding…" : "⬇ Add watermark & download"}
      </button>

      {error && <p style={{ color: "#ff6b6b", marginTop: 12 }}>{error}</p>}
      <p className="privacy-note">🔒 Your PDF is watermarked in your browser — never uploaded.</p>
    </div>
  );
}
