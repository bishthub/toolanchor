"use client";

import { useRef, useState } from "react";

type Fmt = "png" | "jpeg" | "webp";
const MIME: Record<Fmt, string> = { png: "image/png", jpeg: "image/jpeg", webp: "image/webp" };
const EXT: Record<Fmt, string> = { png: "png", jpeg: "jpg", webp: "webp" };

export default function ImageConverter() {
  const [src, setSrc] = useState<string | null>(null);
  const [format, setFormat] = useState<Fmt>("png");
  const [fileName, setFileName] = useState("image");
  const imgRef = useRef<HTMLImageElement | null>(null);

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name.replace(/\.[^.]+$/, ""));
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => { imgRef.current = img; setSrc(url); };
    img.src = url;
  }

  function convert() {
    const img = imgRef.current;
    if (!img) return;
    const canvas = document.createElement("canvas");
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext("2d")!;
    if (format === "jpeg") {
      // JPG has no alpha — fill transparent areas with white.
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    ctx.drawImage(img, 0, 0);
    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = `${fileName}.${EXT[format]}`;
        a.click();
        URL.revokeObjectURL(a.href);
      },
      MIME[format],
      0.92
    );
  }

  return (
    <div>
      <div className="field">
        <label>Choose an image</label>
        <input type="file" accept="image/*" onChange={onFile} className="input" />
      </div>

      {src && (
        <>
          <div className="field">
            <label>Convert to</label>
            <div className="row">
              {(["png", "jpeg", "webp"] as const).map((f) => (
                <button key={f} type="button" className={`btn ${format === f ? "" : "secondary"}`} onClick={() => setFormat(f)}>
                  {f.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
          <button className="btn" onClick={convert}>⬇ Convert &amp; download</button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={src} alt="preview" className="preview-img" style={{ maxHeight: 280 }} />
        </>
      )}

      <p className="privacy-note">🔒 Conversion runs in your browser — your image is never uploaded.</p>
    </div>
  );
}
