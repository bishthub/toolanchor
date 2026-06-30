"use client";

import { useRef, useState } from "react";

const SIZES = [16, 32, 48, 180, 192, 512];

export default function FaviconGenerator() {
  const [icons, setIcons] = useState<{ size: number; url: string }[]>([]);
  const imgRef = useRef<HTMLImageElement | null>(null);

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      imgRef.current = img;
      const out = SIZES.map((size) => {
        const canvas = document.createElement("canvas");
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext("2d")!;
        ctx.imageSmoothingQuality = "high";
        ctx.drawImage(img, 0, 0, size, size);
        return { size, url: canvas.toDataURL("image/png") };
      });
      setIcons(out);
    };
    img.src = url;
  }

  function download(size: number, url: string) {
    const a = document.createElement("a");
    a.href = url;
    a.download = `favicon-${size}x${size}.png`;
    a.click();
  }

  return (
    <div>
      <div className="field">
        <label>Choose a square image (PNG or SVG works best)</label>
        <input type="file" accept="image/*" onChange={onFile} className="input" />
      </div>

      {icons.length > 0 && (
        <>
          <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))" }}>
            {icons.map(({ size, url }) => (
              <div key={size} className="stat" style={{ padding: 12 }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt={`${size}px`} width={Math.min(size, 64)} height={Math.min(size, 64)} style={{ imageRendering: "auto" }} />
                <div className="l" style={{ marginTop: 8 }}>{size}×{size}</div>
                <button className="btn secondary" style={{ marginTop: 6, width: "100%", padding: "6px 8px" }} onClick={() => download(size, url)}>⬇</button>
              </div>
            ))}
          </div>
          <div className="field" style={{ marginTop: 16 }}>
            <label>Suggested HTML</label>
            <textarea readOnly className="mono" style={{ minHeight: 90 }} value={`<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">\n<link rel="apple-touch-icon" sizes="180x180" href="/favicon-180x180.png">`} />
          </div>
        </>
      )}
      <p className="privacy-note">🔒 Resizing runs in your browser — your image is never uploaded.</p>
    </div>
  );
}
