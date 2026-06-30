"use client";

import { useEffect, useRef, useState } from "react";

export default function ResizeImage({ initialFiles }: { initialFiles?: File[] }) {
  const [src, setSrc] = useState<string | null>(null);
  const [origDims, setOrigDims] = useState<{ w: number; h: number } | null>(null);
  const [width, setWidth] = useState<number>(0);
  const [height, setHeight] = useState<number>(0);
  const [lockRatio, setLockRatio] = useState(true);
  const [fileName, setFileName] = useState("image");
  const imgRef = useRef<HTMLImageElement | null>(null);

  function loadFile(file: File) {
    setFileName(file.name.replace(/\.[^.]+$/, ""));
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      setSrc(url);
      setOrigDims({ w: img.naturalWidth, h: img.naturalHeight });
      setWidth(img.naturalWidth);
      setHeight(img.naturalHeight);
      imgRef.current = img;
    };
    img.src = url;
  }

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) loadFile(file);
  }

  useEffect(() => {
    const f = initialFiles?.find((x) => x.type.startsWith("image/"));
    if (f) loadFile(f);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialFiles]);

  function changeWidth(w: number) {
    setWidth(w);
    if (lockRatio && origDims) {
      setHeight(Math.round((w / origDims.w) * origDims.h));
    }
  }
  function changeHeight(h: number) {
    setHeight(h);
    if (lockRatio && origDims) {
      setWidth(Math.round((h / origDims.h) * origDims.w));
    }
  }

  function download() {
    if (!imgRef.current) return;
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(imgRef.current, 0, 0, width, height);
    canvas.toBlob((blob) => {
      if (!blob) return;
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `${fileName}-${width}x${height}.png`;
      a.click();
      URL.revokeObjectURL(a.href);
    }, "image/png");
  }

  return (
    <div>
      <div className="field">
        <label>Choose an image</label>
        <input type="file" accept="image/*" onChange={onFile} className="input" />
      </div>

      {src && origDims && (
        <>
          <div className="row">
            <div className="field">
              <label>Width (px)</label>
              <input
                type="number"
                className="input"
                value={width}
                min={1}
                onChange={(e) => changeWidth(Number(e.target.value))}
              />
            </div>
            <div className="field">
              <label>Height (px)</label>
              <input
                type="number"
                className="input"
                value={height}
                min={1}
                onChange={(e) => changeHeight(Number(e.target.value))}
              />
            </div>
          </div>

          <label style={{ display: "flex", gap: 8, alignItems: "center", color: "var(--muted)", fontSize: ".9rem" }}>
            <input type="checkbox" checked={lockRatio} onChange={(e) => setLockRatio(e.target.checked)} />
            Lock aspect ratio (original {origDims.w}×{origDims.h})
          </label>

          <div style={{ marginTop: 18 }}>
            <button className="btn" onClick={download}>
              ⬇ Download resized PNG
            </button>
          </div>

          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={src} alt="preview" className="preview-img" style={{ maxHeight: 280 }} />
        </>
      )}

      <p className="privacy-note">🔒 Resizing happens locally — your image is never uploaded.</p>
    </div>
  );
}
