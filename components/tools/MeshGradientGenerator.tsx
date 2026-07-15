"use client";

import { useCallback, useEffect, useRef, useState } from "react";

// Mesh-gradient wallpaper generator: layered radial gradients on canvas,
// optional film grain, exported at up to 4K. All rendering is local.

interface Palette { name: string; base: string; colors: string[]; }

const PALETTES: Palette[] = [
  { name: "Aurora",   base: "#0b1026", colors: ["#22d3ee", "#818cf8", "#34d399", "#a78bfa"] },
  { name: "Sunset",   base: "#2a0e2e", colors: ["#f97316", "#f43f5e", "#fbbf24", "#c026d3"] },
  { name: "Ocean",    base: "#062038", colors: ["#0ea5e9", "#2dd4bf", "#6366f1", "#38bdf8"] },
  { name: "Peach",    base: "#fff1eb", colors: ["#fda4af", "#fdba74", "#f9a8d4", "#fde68a"] },
  { name: "Meadow",   base: "#0c2415", colors: ["#4ade80", "#a3e635", "#2dd4bf", "#fbbf24"] },
  { name: "Berry",    base: "#1e0a2e", colors: ["#e879f9", "#f472b6", "#8b5cf6", "#fb7185"] },
  { name: "Slate",    base: "#0f1115", colors: ["#64748b", "#94a3b8", "#475569", "#7c86ff"] },
  { name: "Daylight", base: "#eef2ff", colors: ["#93c5fd", "#c4b5fd", "#a5f3fc", "#fbcfe8"] },
];

const SIZES = [
  { label: "Desktop · 1920×1080", w: 1920, h: 1080 },
  { label: "Desktop · 2560×1440", w: 2560, h: 1440 },
  { label: "4K · 3840×2160", w: 3840, h: 2160 },
  { label: "Phone · 1170×2532", w: 1170, h: 2532 },
  { label: "Square · 2048×2048", w: 2048, h: 2048 },
];

interface Blob { x: number; y: number; r: number; c: number; }

function rand(): number {
  const a = new Uint32Array(1);
  crypto.getRandomValues(a);
  return a[0] / 0xffffffff;
}

function makeBlobs(count: number, colorCount: number): Blob[] {
  return Array.from({ length: count }, (_, i) => ({
    x: rand(),
    y: rand(),
    r: 0.45 + rand() * 0.45,          // radius as a fraction of the long edge
    c: i % colorCount,                 // cycle palette so every color appears
  }));
}

function draw(
  canvas: HTMLCanvasElement,
  w: number,
  h: number,
  palette: Palette,
  blobs: Blob[],
  grain: boolean
) {
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  ctx.fillStyle = palette.base;
  ctx.fillRect(0, 0, w, h);

  const long = Math.max(w, h);
  ctx.globalCompositeOperation = "lighter";
  for (const b of blobs) {
    const r = b.r * long;
    const g = ctx.createRadialGradient(b.x * w, b.y * h, 0, b.x * w, b.y * h, r);
    const color = palette.colors[b.c % palette.colors.length];
    g.addColorStop(0, color + "cc");   // ~80% alpha core
    g.addColorStop(0.55, color + "44");
    g.addColorStop(1, color + "00");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  }
  ctx.globalCompositeOperation = "source-over";

  if (grain) {
    // Subtle monochrome noise, tiled from a small pattern for speed.
    const tile = document.createElement("canvas");
    tile.width = tile.height = 128;
    const tctx = tile.getContext("2d")!;
    const img = tctx.createImageData(128, 128);
    for (let i = 0; i < img.data.length; i += 4) {
      const v = Math.floor(Math.random() * 255);
      img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
      img.data[i + 3] = 14; // ~5% opacity
    }
    tctx.putImageData(img, 0, 0);
    ctx.fillStyle = ctx.createPattern(tile, "repeat")!;
    ctx.fillRect(0, 0, w, h);
  }
}

export default function MeshGradientGenerator() {
  const previewRef = useRef<HTMLCanvasElement>(null);
  const [paletteIdx, setPaletteIdx] = useState(0);
  const [blobCount, setBlobCount] = useState(5);
  const [grain, setGrain] = useState(true);
  const [sizeIdx, setSizeIdx] = useState(0);
  const [blobs, setBlobs] = useState<Blob[]>([]);
  const [busy, setBusy] = useState(false);

  const palette = PALETTES[paletteIdx];
  const size = SIZES[sizeIdx];

  const shuffle = useCallback(() => {
    setBlobs(makeBlobs(blobCount, PALETTES[paletteIdx].colors.length));
  }, [blobCount, paletteIdx]);

  // First render + re-roll when the blob count changes.
  useEffect(() => { shuffle(); }, [shuffle]);

  // Re-draw the preview whenever anything changes (preview at display size,
  // same normalized blobs as the full-res export → identical composition).
  useEffect(() => {
    const canvas = previewRef.current;
    if (!canvas || blobs.length === 0) return;
    const ratio = size.w / size.h;
    const pw = 720;
    draw(canvas, pw, Math.round(pw / ratio), palette, blobs, grain);
  }, [blobs, palette, grain, size]);

  async function download() {
    if (blobs.length === 0) return;
    setBusy(true);
    // Let the button repaint before the heavy full-res render.
    await new Promise((r) => setTimeout(r, 30));
    const full = document.createElement("canvas");
    draw(full, size.w, size.h, palette, blobs, grain);
    full.toBlob((blob) => {
      setBusy(false);
      if (!blob) return;
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `gradient-${palette.name.toLowerCase()}-${size.w}x${size.h}.png`;
      a.click();
      URL.revokeObjectURL(a.href);
    }, "image/png");
  }

  return (
    <div>
      <div className="row">
        <div className="field">
          <label>Palette</label>
          <select className="input" value={paletteIdx} onChange={(e) => setPaletteIdx(Number(e.target.value))}>
            {PALETTES.map((p, i) => <option key={p.name} value={i}>{p.name}</option>)}
          </select>
        </div>
        <div className="field" style={{ maxWidth: 140 }}>
          <label>Color blobs: {blobCount}</label>
          <input type="range" min={3} max={8} value={blobCount}
            onChange={(e) => setBlobCount(Number(e.target.value))} style={{ width: "100%" }} />
        </div>
        <div className="field" style={{ maxWidth: 220 }}>
          <label>Download size</label>
          <select className="input" value={sizeIdx} onChange={(e) => setSizeIdx(Number(e.target.value))}>
            {SIZES.map((s, i) => <option key={s.label} value={i}>{s.label}</option>)}
          </select>
        </div>
      </div>

      <div className="row" style={{ alignItems: "center", gap: 16 }}>
        <label style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <input type="checkbox" checked={grain} onChange={(e) => setGrain(e.target.checked)} />
          Film grain
        </label>
        <button className="btn secondary" onClick={shuffle}>Shuffle composition</button>
        <button className="btn" onClick={download} disabled={busy}>
          {busy ? "Rendering…" : `Download PNG (${size.w}×${size.h})`}
        </button>
      </div>

      <div style={{ marginTop: 16 }}>
        <canvas
          ref={previewRef}
          style={{ width: "100%", height: "auto", borderRadius: 12, border: "1px solid var(--border)", display: "block" }}
          aria-label="Gradient wallpaper preview"
        />
      </div>

      <p className="privacy-note">🔒 Rendered entirely in your browser with the Canvas API — nothing is uploaded, and downloads are watermark-free.</p>
    </div>
  );
}
