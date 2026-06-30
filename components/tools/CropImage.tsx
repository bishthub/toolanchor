"use client";

import { useRef, useState } from "react";

interface Rect { x: number; y: number; w: number; h: number; } // in displayed px

export default function CropImage() {
  const [src, setSrc] = useState<string | null>(null);
  const [rect, setRect] = useState<Rect | null>(null);
  const [fileName, setFileName] = useState("image");
  const imgRef = useRef<HTMLImageElement | null>(null);
  const dragStart = useRef<{ x: number; y: number } | null>(null);

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name.replace(/\.[^.]+$/, ""));
    setRect(null);
    setSrc(URL.createObjectURL(file));
  }

  function relative(e: React.PointerEvent) {
    const img = imgRef.current!;
    const r = img.getBoundingClientRect();
    return {
      x: Math.max(0, Math.min(e.clientX - r.left, r.width)),
      y: Math.max(0, Math.min(e.clientY - r.top, r.height)),
    };
  }

  function onDown(e: React.PointerEvent) {
    if (!imgRef.current) return;
    (e.target as Element).setPointerCapture(e.pointerId);
    const p = relative(e);
    dragStart.current = p;
    setRect({ x: p.x, y: p.y, w: 0, h: 0 });
  }
  function onMove(e: React.PointerEvent) {
    if (!dragStart.current) return;
    const p = relative(e);
    const s = dragStart.current;
    setRect({ x: Math.min(s.x, p.x), y: Math.min(s.y, p.y), w: Math.abs(p.x - s.x), h: Math.abs(p.y - s.y) });
  }
  function onUp() { dragStart.current = null; }

  // Live pixel dimensions in the ORIGINAL image's coordinate space.
  function naturalDims(): { w: number; h: number } | null {
    const img = imgRef.current;
    if (!img || !rect) return null;
    const scale = img.naturalWidth / img.getBoundingClientRect().width;
    return { w: Math.round(rect.w * scale), h: Math.round(rect.h * scale) };
  }

  function crop() {
    const img = imgRef.current;
    if (!img || !rect || rect.w < 2 || rect.h < 2) return;
    const scale = img.naturalWidth / img.getBoundingClientRect().width;
    const sx = rect.x * scale, sy = rect.y * scale, sw = rect.w * scale, sh = rect.h * scale;
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(sw);
    canvas.height = Math.round(sh);
    canvas.getContext("2d")!.drawImage(img, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
    canvas.toBlob((blob) => {
      if (!blob) return;
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `${fileName}-cropped.png`;
      a.click();
      URL.revokeObjectURL(a.href);
    }, "image/png");
  }

  const dims = naturalDims();

  return (
    <div>
      <div className="field">
        <label>Choose an image</label>
        <input type="file" accept="image/*" onChange={onFile} className="input" />
      </div>

      {src && (
        <>
          <p style={{ color: "var(--muted)", fontSize: ".9rem" }}>Drag on the image to draw a crop region.</p>
          <div style={{ position: "relative", display: "inline-block", maxWidth: "100%", touchAction: "none" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              ref={imgRef}
              src={src}
              alt="crop source"
              className="preview-img"
              style={{ maxHeight: 360, display: "block", cursor: "crosshair", userSelect: "none" }}
              onPointerDown={onDown}
              onPointerMove={onMove}
              onPointerUp={onUp}
              draggable={false}
            />
            {rect && rect.w > 0 && (
              <div
                style={{
                  position: "absolute", left: rect.x, top: rect.y, width: rect.w, height: rect.h,
                  border: "2px solid var(--accent)", background: "rgba(91,140,255,0.18)", pointerEvents: "none",
                }}
              />
            )}
          </div>

          <div style={{ marginTop: 14 }}>
            <button className="btn" onClick={crop} disabled={!dims || dims.w < 2}>
              ⬇ Crop & download {dims && dims.w > 1 ? `(${dims.w}×${dims.h})` : ""}
            </button>
          </div>
        </>
      )}

      <p className="privacy-note">🔒 Cropping runs in your browser — your image is never uploaded.</p>
    </div>
  );
}
