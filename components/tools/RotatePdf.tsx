"use client";

import { useEffect, useState } from "react";
import { PDFDocument, degrees } from "pdf-lib";

export default function RotatePdf({ initialFiles }: { initialFiles?: File[] }) {
  const [file, setFile] = useState<File | null>(null);
  const [angle, setAngle] = useState<90 | 180 | 270>(90);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const f = initialFiles?.find((x) => x.type === "application/pdf");
    if (f) { setFile(f); setError(null); }
  }, [initialFiles]);

  async function rotate() {
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      const doc = await PDFDocument.load(await file.arrayBuffer());
      doc.getPages().forEach((page) => {
        const current = page.getRotation().angle;
        page.setRotation(degrees((current + angle) % 360));
      });
      const bytes = await doc.save();
      const blob = new Blob([bytes.slice().buffer], { type: "application/pdf" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `${file.name.replace(/\.pdf$/i, "")}-rotated.pdf`;
      a.click();
      URL.revokeObjectURL(a.href);
    } catch (err) {
      setError("Could not rotate this PDF. It may be encrypted or corrupted.");
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
        <label>Rotate all pages by</label>
        <div className="row">
          {([90, 180, 270] as const).map((a) => (
            <button
              key={a}
              type="button"
              className={`btn ${angle === a ? "" : "secondary"}`}
              onClick={() => setAngle(a)}
            >
              {a}°
            </button>
          ))}
        </div>
      </div>

      <button className="btn" onClick={rotate} disabled={!file || busy}>
        {busy ? "Rotating…" : "⬇ Rotate & download"}
      </button>

      {error && <p style={{ color: "#ff6b6b", marginTop: 12 }}>{error}</p>}
      <p className="privacy-note">🔒 Your PDF is rotated in your browser — never uploaded.</p>
    </div>
  );
}
