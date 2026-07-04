"use client";

import { useEffect, useRef, useState } from "react";
import { canvasBlob } from "@/lib/canvas";

export default function SvgToPng({ initialFiles }: { initialFiles?: File[] }) {
  const [src, setSrc] = useState<string | null>(null);
  const [natural, setNatural] = useState<{ w: number; h: number } | null>(null);
  const [scale, setScale] = useState(2);
  const [fileName, setFileName] = useState("image");
  const [error, setError] = useState<string | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);

  function loadFile(file: File) {
    setError(null);
    setFileName(file.name.replace(/\.[^.]+$/, ""));
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      // SVGs without intrinsic width/height report 0 — fall back to a sane size.
      const w = img.naturalWidth || 512;
      const h = img.naturalHeight || 512;
      imgRef.current = img;
      setNatural({ w, h });
      setSrc(url);
    };
    img.onerror = () => setError("Could not read this SVG. Make sure it's a valid .svg file.");
    img.src = url;
  }

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f) loadFile(f);
  }

  useEffect(() => {
    const f = initialFiles?.find((x) => x.type.includes("svg") || /\.svg$/i.test(x.name));
    if (f) loadFile(f);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialFiles]);

  async function download() {
    if (!imgRef.current || !natural) return;
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(natural.w * scale);
    canvas.height = Math.round(natural.h * scale);
    canvas.getContext("2d")!.drawImage(imgRef.current, 0, 0, canvas.width, canvas.height);
    try {
      const blob = await canvasBlob(canvas, "image/png");
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `${fileName}.png`;
      a.click();
      URL.revokeObjectURL(a.href);
    } catch {
      setError("Could not render this SVG to PNG. It may reference external resources the browser blocks.");
    }
  }

  const out = natural ? { w: Math.round(natural.w * scale), h: Math.round(natural.h * scale) } : null;

  return (
    <div>
      <div className="field">
        <label>Choose an SVG file</label>
        <input type="file" accept=".svg,image/svg+xml" onChange={onFile} className="input" />
      </div>

      {src && natural && (
        <>
          <div className="field">
            <label>Output scale: {scale}× {out && `→ ${out.w}×${out.h}px`}</label>
            <input type="range" min={1} max={8} step={1} value={scale} onChange={(e) => setScale(Number(e.target.value))} style={{ width: "100%" }} />
          </div>
          <div style={{ marginTop: 6 }}>
            <button className="btn" onClick={download}>⬇ Download PNG</button>
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={src} alt="SVG preview" className="preview-img" style={{ maxHeight: 240, marginTop: 12, background: "var(--surface-2)" }} />
        </>
      )}

      {error && <p style={{ color: "#ff6b6b", marginTop: 12 }}>{error}</p>}
      <p className="privacy-note">🔒 Conversion runs in your browser via the Canvas API — your SVG is never uploaded.</p>
    </div>
  );
}
