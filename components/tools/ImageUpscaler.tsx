"use client";

import { useEffect, useRef, useState } from "react";
import { loadImage, canvasBlob } from "@/lib/canvas";
import SendToTool from "@/components/SendToTool";

const MAX_SIDE = 8000; // guard against enormous canvases / out-of-memory

function fmtBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / 1024 / 1024).toFixed(2)} MB`;
}

/** Enlarge in ~2× steps with high-quality smoothing for a cleaner result than
 *  a single big jump. Returns the final canvas at the target size. */
function upscaleStepped(img: HTMLImageElement, scale: number): HTMLCanvasElement {
  const targetW = Math.round(img.naturalWidth * scale);
  const targetH = Math.round(img.naturalHeight * scale);

  let curW = img.naturalWidth;
  let curH = img.naturalHeight;
  let cur: CanvasImageSource = img;

  const step = (w: number, h: number): HTMLCanvasElement => {
    const c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    const ctx = c.getContext("2d")!;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(cur, 0, 0, w, h);
    return c;
  };

  // Double until the next double would overshoot the target.
  while (curW * 2 < targetW && curH * 2 < targetH) {
    curW *= 2;
    curH *= 2;
    cur = step(curW, curH);
  }
  return step(targetW, targetH);
}

export default function ImageUpscaler({ initialFiles }: { initialFiles?: File[] }) {
  const [src, setSrc] = useState<string | null>(null);
  const [dims, setDims] = useState<{ w: number; h: number } | null>(null);
  const [scale, setScale] = useState(2);
  const [fileName, setFileName] = useState("image");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ url: string; size: number; w: number; h: number } | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);

  async function pick(file: File) {
    setError(null); setResult(null);
    setFileName(file.name.replace(/\.[^.]+$/, ""));
    try {
      const img = await loadImage(file);
      imgRef.current = img;
      setDims({ w: img.naturalWidth, h: img.naturalHeight });
      setSrc(URL.createObjectURL(file));
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

  async function run() {
    const img = imgRef.current;
    if (!img) return;
    if (img.naturalWidth * scale > MAX_SIDE || img.naturalHeight * scale > MAX_SIDE) {
      setError(`That would exceed ${MAX_SIDE}px on a side. Try a smaller scale.`);
      return;
    }
    setBusy(true); setError(null); setResult(null);
    try {
      // Yield a frame so the button shows "Working…" before the heavy draw.
      await new Promise((r) => setTimeout(r, 20));
      const canvas = upscaleStepped(img, scale);
      const blob = await canvasBlob(canvas, "image/png");
      setResult({ url: URL.createObjectURL(blob), size: blob.size, w: canvas.width, h: canvas.height });
    } catch (err) {
      console.error(err);
      setError("Could not upscale this image. Try a smaller scale.");
    } finally {
      setBusy(false);
    }
  }

  const out = dims ? { w: Math.round(dims.w * scale), h: Math.round(dims.h * scale) } : null;

  return (
    <div>
      <div className="field">
        <label>Choose an image</label>
        <input type="file" accept="image/*" onChange={onFile} className="input" disabled={busy} />
      </div>

      {src && dims && (
        <>
          <div className="field">
            <label>Enlarge by: {scale}× {out && `→ ${out.w}×${out.h}px`} (from {dims.w}×{dims.h})</label>
            <div className="row">
              {[2, 3, 4].map((s) => (
                <button key={s} type="button" className={`btn ${scale === s ? "" : "secondary"}`} onClick={() => setScale(s)} disabled={busy}>{s}×</button>
              ))}
            </div>
          </div>

          <button className="btn" onClick={run} disabled={busy}>{busy ? "Enlarging…" : "🔎 Upscale image"}</button>

          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={src} alt="original preview" className="preview-img" style={{ maxHeight: 220, marginTop: 12 }} />
        </>
      )}

      {error && <p style={{ color: "#ff6b6b", marginTop: 12 }}>{error}</p>}

      {result && (
        <div style={{ marginTop: 16 }}>
          <div className="stats">
            <div className="stat"><div className="n">{dims?.w}×{dims?.h}</div><div className="l">Original</div></div>
            <div className="stat"><div className="n">{result.w}×{result.h}</div><div className="l">Upscaled</div></div>
            <div className="stat"><div className="n">{fmtBytes(result.size)}</div><div className="l">New size</div></div>
          </div>
          <a className="btn" href={result.url} download={`${fileName}-${scale}x.png`} style={{ display: "inline-flex", marginTop: 12 }}>⬇ Download upscaled PNG</a>
          <SendToTool
            kind="image"
            exclude="image-upscaler"
            getFile={async () => {
              if (!result) return null;
              const blob = await fetch(result.url).then((r) => r.blob());
              return new File([blob], `${fileName}-${scale}x.png`, { type: "image/png" });
            }}
          />
        </div>
      )}

      <p className="privacy-note">🔒 Upscaling runs in your browser using high-quality resampling — your image is never uploaded. This enlarges and smooths the image; it doesn’t invent new detail like AI super-resolution.</p>
    </div>
  );
}
