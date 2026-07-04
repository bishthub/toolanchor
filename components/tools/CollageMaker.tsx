"use client";

import { useEffect, useRef, useState } from "react";
import { loadImage, canvasBlob } from "@/lib/canvas";

// Fixed grid layouts by photo count — no freeform dragging in v1.
const LAYOUTS: Record<number, { cols: number; rows: number }> = {
  2: { cols: 2, rows: 1 },
  3: { cols: 3, rows: 1 },
  4: { cols: 2, rows: 2 },
  5: { cols: 3, rows: 2 },
  6: { cols: 3, rows: 2 },
};

export default function CollageMaker({ initialFiles }: { initialFiles?: File[] }) {
  const [imgs, setImgs] = useState<HTMLImageElement[]>([]);
  const [gap, setGap] = useState(12);
  const [radius, setRadius] = useState(8);
  const [bg, setBg] = useState("#ffffff");
  const [cellSize, setCellSize] = useState(500);
  const [error, setError] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  async function pick(files: File[]) {
    setError(null);
    const images = files.filter((f) => f.type.startsWith("image/")).slice(0, 6);
    if (images.length < 2) { setError("Choose at least 2 images (up to 6)."); return; }
    try {
      setImgs(await Promise.all(images.map((f) => loadImage(f))));
    } catch {
      setError("One of the images couldn't be read.");
    }
  }

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    pick(Array.from(e.target.files ?? []));
  }

  useEffect(() => {
    if (initialFiles?.length) pick(initialFiles);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialFiles]);

  // Redraw whenever inputs change.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || imgs.length < 2) return;
    const n = Math.min(6, imgs.length);
    const { cols, rows } = LAYOUTS[n] ?? { cols: 2, rows: Math.ceil(n / 2) };
    const cw = cellSize;
    const ch = cellSize;
    canvas.width = cols * cw + gap * (cols + 1);
    canvas.height = rows * ch + gap * (rows + 1);
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    imgs.slice(0, n).forEach((img, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const x = gap + col * (cw + gap);
      const y = gap + row * (ch + gap);
      // Cover-fit the image into the cell.
      const scale = Math.max(cw / img.naturalWidth, ch / img.naturalHeight);
      const sw = cw / scale;
      const sh = ch / scale;
      const sx = (img.naturalWidth - sw) / 2;
      const sy = (img.naturalHeight - sh) / 2;
      ctx.save();
      const rr = Math.min(radius, cw / 2, ch / 2);
      ctx.beginPath();
      ctx.moveTo(x + rr, y);
      ctx.arcTo(x + cw, y, x + cw, y + ch, rr);
      ctx.arcTo(x + cw, y + ch, x, y + ch, rr);
      ctx.arcTo(x, y + ch, x, y, rr);
      ctx.arcTo(x, y, x + cw, y, rr);
      ctx.closePath();
      ctx.clip();
      ctx.drawImage(img, sx, sy, sw, sh, x, y, cw, ch);
      ctx.restore();
    });
  }, [imgs, gap, radius, bg, cellSize]);

  async function download() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const blob = await canvasBlob(canvas, "image/png");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "collage.png";
    a.click();
    URL.revokeObjectURL(a.href);
  }

  return (
    <div>
      <div className="field">
        <label>Choose 2–6 images</label>
        <input type="file" accept="image/*" multiple onChange={onFile} className="input" />
      </div>

      {imgs.length >= 2 && (
        <>
          <div className="row">
            <div className="field">
              <label>Gap: {gap}px</label>
              <input type="range" min={0} max={40} step={2} value={gap} onChange={(e) => setGap(Number(e.target.value))} style={{ width: "100%" }} />
            </div>
            <div className="field">
              <label>Corner radius: {radius}px</label>
              <input type="range" min={0} max={40} step={2} value={radius} onChange={(e) => setRadius(Number(e.target.value))} style={{ width: "100%" }} />
            </div>
          </div>
          <div className="field" style={{ maxWidth: 220 }}>
            <label>Background</label>
            <div className="row">
              {["#ffffff", "#000000", "#f1ede6"].map((c) => (
                <button key={c} type="button" className={`btn ${bg === c ? "" : "secondary"}`} onClick={() => setBg(c)} style={{ minWidth: 44 }}>
                  {c === "#ffffff" ? "White" : c === "#000000" ? "Black" : "Cream"}
                </button>
              ))}
            </div>
          </div>

          <canvas ref={canvasRef} style={{ maxWidth: "100%", height: "auto", marginTop: 12, borderRadius: 6, border: "1px solid var(--border)" }} />

          <div style={{ marginTop: 12 }}>
            <button className="btn" onClick={download}>⬇ Download collage (PNG)</button>
          </div>
        </>
      )}

      {error && <p style={{ color: "#ff6b6b", marginTop: 12 }}>{error}</p>}
      <p className="privacy-note">🔒 Your photos are combined in your browser with the Canvas API — nothing is uploaded.</p>
    </div>
  );
}
