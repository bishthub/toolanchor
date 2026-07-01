"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface Preset { id: string; label: string; w: number; h: number; }
// Pixel sizes at 300 DPI — the standard for printed passport/visa photos.
const PRESETS: Preset[] = [
  { id: "us", label: "US / India — 2×2 in (600×600)", w: 600, h: 600 },
  { id: "uk", label: "UK / EU / Schengen — 35×45 mm (413×531)", w: 413, h: 531 },
  { id: "ca", label: "Canada — 50×70 mm (590×826)", w: 590, h: 826 },
  { id: "au", label: "Australia — 35×45 mm (413×531)", w: 413, h: 531 },
];
// A 6×4 inch photo-print sheet at 300 DPI.
const SHEET_W = 1800, SHEET_H = 1200, GAP = 24, MARGIN = 30;

export default function PassportPhotoMaker({ initialFiles }: { initialFiles?: File[] }) {
  const [preset, setPreset] = useState<Preset>(PRESETS[0]);
  const [zoom, setZoom] = useState(1);
  const [offsetY, setOffsetY] = useState(0); // -100..100 (% of vertical overflow)
  const [loaded, setLoaded] = useState(false);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const draw = useCallback((canvas: HTMLCanvasElement, w: number, h: number) => {
    const img = imgRef.current;
    if (!img) return;
    canvas.width = w; canvas.height = h;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, w, h);
    const scale = Math.max(w / img.naturalWidth, h / img.naturalHeight) * zoom;
    const dw = img.naturalWidth * scale, dh = img.naturalHeight * scale;
    const dx = (w - dw) / 2;
    const dy = (h - dh) / 2 + (offsetY / 100) * ((dh - h) / 2);
    ctx.drawImage(img, dx, dy, dw, dh);
  }, [zoom, offsetY]);

  useEffect(() => {
    if (loaded && canvasRef.current) draw(canvasRef.current, preset.w, preset.h);
  }, [loaded, preset, zoom, offsetY, draw]);

  function loadFile(file: File) {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => { imgRef.current = img; setLoaded(true); };
    img.src = url;
  }

  useEffect(() => {
    const f = initialFiles?.find((x) => x.type.startsWith("image/"));
    if (f) loadFile(f);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialFiles]);

  function downloadSingle() {
    const c = document.createElement("canvas");
    draw(c, preset.w, preset.h);
    c.toBlob((b) => { if (b) trigger(b, "passport-photo.jpg"); }, "image/jpeg", 0.95);
  }

  function downloadSheet() {
    const photo = document.createElement("canvas");
    draw(photo, preset.w, preset.h);
    const sheet = document.createElement("canvas");
    sheet.width = SHEET_W; sheet.height = SHEET_H;
    const ctx = sheet.getContext("2d")!;
    ctx.fillStyle = "#ffffff"; ctx.fillRect(0, 0, SHEET_W, SHEET_H);
    const cols = Math.max(1, Math.floor((SHEET_W - 2 * MARGIN + GAP) / (preset.w + GAP)));
    const rows = Math.max(1, Math.floor((SHEET_H - 2 * MARGIN + GAP) / (preset.h + GAP)));
    ctx.strokeStyle = "#dddddd"; ctx.lineWidth = 1;
    for (let r = 0; r < rows; r++) {
      for (let col = 0; col < cols; col++) {
        const x = MARGIN + col * (preset.w + GAP);
        const y = MARGIN + r * (preset.h + GAP);
        ctx.drawImage(photo, x, y);
        ctx.strokeRect(x + 0.5, y + 0.5, preset.w, preset.h);
      }
    }
    sheet.toBlob((b) => { if (b) trigger(b, "passport-print-sheet-6x4.jpg"); }, "image/jpeg", 0.95);
  }

  function trigger(blob: Blob, name: string) {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = name;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  return (
    <div>
      <div className="field">
        <label>Choose a photo</label>
        <input type="file" accept="image/*" onChange={(e) => { const f = e.target.files?.[0]; if (f) loadFile(f); }} className="input" />
      </div>

      <div className="field">
        <label>Photo size</label>
        <select className="input" value={preset.id} onChange={(e) => setPreset(PRESETS.find((p) => p.id === e.target.value)!)}>
          {PRESETS.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
        </select>
      </div>

      {loaded && (
        <>
          <div className="row">
            <div className="field">
              <label>Zoom: {zoom.toFixed(2)}×</label>
              <input type="range" min={1} max={3} step={0.02} value={zoom} onChange={(e) => setZoom(parseFloat(e.target.value))} />
            </div>
            <div className="field">
              <label>Vertical position</label>
              <input type="range" min={-100} max={100} value={offsetY} onChange={(e) => setOffsetY(parseInt(e.target.value, 10))} />
            </div>
          </div>

          <div className="field">
            <label>Preview</label>
            <canvas
              ref={canvasRef}
              style={{ maxHeight: 320, maxWidth: "100%", height: "auto", border: "1px solid var(--border)", borderRadius: 10, background: "#fff" }}
            />
          </div>

          <div className="row">
            <button className="btn" onClick={downloadSingle}>⬇ Download photo (JPG)</button>
            <button className="btn secondary" onClick={downloadSheet}>⬇ Download 6×4 print sheet</button>
          </div>
        </>
      )}

      <p className="privacy-note">
        🔒 Cropped in your browser — your photo is never uploaded. Center the head and leave even space above.
        Need a plain white background? Use the Background Remover first, then place it on white.
      </p>
    </div>
  );
}
