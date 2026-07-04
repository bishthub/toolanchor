"use client";

import { useEffect, useRef, useState } from "react";
import { loadImage, canvasBlob } from "@/lib/canvas";

// Tasteful, neutral backgrounds — no loud AI-gradient clichés.
const BACKGROUNDS: { id: string; label: string; paint: (ctx: CanvasRenderingContext2D, w: number, h: number) => void }[] = [
  { id: "slate", label: "Slate", paint: (c, w, h) => { const g = c.createLinearGradient(0, 0, w, h); g.addColorStop(0, "#3a4152"); g.addColorStop(1, "#20242e"); c.fillStyle = g; c.fillRect(0, 0, w, h); } },
  { id: "mist", label: "Mist", paint: (c, w, h) => { const g = c.createLinearGradient(0, 0, w, h); g.addColorStop(0, "#e9edf2"); g.addColorStop(1, "#cdd5e0"); c.fillStyle = g; c.fillRect(0, 0, w, h); } },
  { id: "sand", label: "Sand", paint: (c, w, h) => { const g = c.createLinearGradient(0, 0, w, h); g.addColorStop(0, "#efe7db"); g.addColorStop(1, "#d9cbb5"); c.fillStyle = g; c.fillRect(0, 0, w, h); } },
  { id: "ink", label: "Ink", paint: (c, w, h) => { c.fillStyle = "#101216"; c.fillRect(0, 0, w, h); } },
  { id: "white", label: "White", paint: (c, w, h) => { c.fillStyle = "#ffffff"; c.fillRect(0, 0, w, h); } },
];

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

export default function ScreenshotBeautifier({ initialFiles }: { initialFiles?: File[] }) {
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  const [bg, setBg] = useState("slate");
  const [padding, setPadding] = useState(80);
  const [radius, setRadius] = useState(16);
  const [shadow, setShadow] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  async function pick(file: File) {
    setError(null);
    try {
      setImg(await loadImage(file));
    } catch {
      setError("Could not read this image.");
    }
  }

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f) pick(f);
  }

  useEffect(() => {
    const f = initialFiles?.find((x) => x.type.startsWith("image/"));
    if (f) pick(f);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialFiles]);

  // Repaint the preview whenever inputs change.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !img) return;
    const iw = img.naturalWidth;
    const ih = img.naturalHeight;
    const W = iw + padding * 2;
    const H = ih + padding * 2;
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext("2d")!;
    BACKGROUNDS.find((b) => b.id === bg)!.paint(ctx, W, H);
    if (shadow) {
      ctx.save();
      ctx.shadowColor = "rgba(0,0,0,0.35)";
      ctx.shadowBlur = Math.max(24, padding * 0.5);
      ctx.shadowOffsetY = Math.max(10, padding * 0.2);
      ctx.fillStyle = "#000";
      roundRect(ctx, padding, padding, iw, ih, radius);
      ctx.fill();
      ctx.restore();
    }
    ctx.save();
    roundRect(ctx, padding, padding, iw, ih, radius);
    ctx.clip();
    ctx.drawImage(img, padding, padding, iw, ih);
    ctx.restore();
  }, [img, bg, padding, radius, shadow]);

  async function download() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const blob = await canvasBlob(canvas, "image/png");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "screenshot.png";
    a.click();
    URL.revokeObjectURL(a.href);
  }

  return (
    <div>
      <div className="field">
        <label>Choose a screenshot or image</label>
        <input type="file" accept="image/*" onChange={onFile} className="input" />
        <p style={{ color: "var(--muted)", fontSize: ".8rem", marginTop: 6 }}>Tip: you can also copy a screenshot and paste it anywhere on the site.</p>
      </div>

      {img && (
        <>
          <div className="field">
            <label>Background</label>
            <div className="row" style={{ flexWrap: "wrap" }}>
              {BACKGROUNDS.map((b) => (
                <button key={b.id} type="button" className={`btn ${bg === b.id ? "" : "secondary"}`} onClick={() => setBg(b.id)}>{b.label}</button>
              ))}
            </div>
          </div>
          <div className="row">
            <div className="field">
              <label>Padding: {padding}px</label>
              <input type="range" min={0} max={200} step={4} value={padding} onChange={(e) => setPadding(Number(e.target.value))} style={{ width: "100%" }} />
            </div>
            <div className="field">
              <label>Corner radius: {radius}px</label>
              <input type="range" min={0} max={48} step={2} value={radius} onChange={(e) => setRadius(Number(e.target.value))} style={{ width: "100%" }} />
            </div>
          </div>
          <label style={{ display: "flex", gap: 8, alignItems: "center", color: "var(--muted)", fontSize: ".9rem" }}>
            <input type="checkbox" checked={shadow} onChange={(e) => setShadow(e.target.checked)} />
            Drop shadow
          </label>

          <canvas ref={canvasRef} style={{ maxWidth: "100%", height: "auto", marginTop: 12, borderRadius: 6, border: "1px solid var(--border)" }} />

          <div style={{ marginTop: 12 }}>
            <button className="btn" onClick={download}>⬇ Download PNG</button>
          </div>
        </>
      )}

      {error && <p style={{ color: "#ff6b6b", marginTop: 12 }}>{error}</p>}
      <p className="privacy-note">🔒 The image is composed in your browser with the Canvas API — nothing is uploaded.</p>
    </div>
  );
}
