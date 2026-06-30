"use client";

import { useEffect, useRef, useState } from "react";

export default function FlipImage() {
  const [src, setSrc] = useState<string | null>(null);
  const [flipH, setFlipH] = useState(false);
  const [flipV, setFlipV] = useState(false);
  const [rotate, setRotate] = useState(0); // 0, 90, 180, 270
  const [fileName, setFileName] = useState("image");
  const imgRef = useRef<HTMLImageElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name.replace(/\.[^.]+$/, ""));
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => { imgRef.current = img; setSrc(url); };
    img.src = url;
  }

  useEffect(() => {
    const img = imgRef.current;
    const canvas = canvasRef.current;
    if (!img || !canvas || !src) return;
    const rot = ((rotate % 360) + 360) % 360;
    const swap = rot === 90 || rot === 270;
    canvas.width = swap ? img.naturalHeight : img.naturalWidth;
    canvas.height = swap ? img.naturalWidth : img.naturalHeight;
    const ctx = canvas.getContext("2d")!;
    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate((rot * Math.PI) / 180);
    ctx.scale(flipH ? -1 : 1, flipV ? -1 : 1);
    ctx.drawImage(img, -img.naturalWidth / 2, -img.naturalHeight / 2);
    ctx.restore();
  }, [src, flipH, flipV, rotate]);

  function download() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.toBlob((blob) => {
      if (!blob) return;
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `${fileName}-edited.png`;
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

      {src && (
        <>
          <div className="row" style={{ marginBottom: 14 }}>
            <button type="button" className={`btn ${flipH ? "" : "secondary"}`} onClick={() => setFlipH((v) => !v)}>↔ Flip horizontal</button>
            <button type="button" className={`btn ${flipV ? "" : "secondary"}`} onClick={() => setFlipV((v) => !v)}>↕ Flip vertical</button>
            <button type="button" className="btn secondary" onClick={() => setRotate((r) => (r + 90) % 360)}>↻ Rotate 90°</button>
          </div>
          <canvas ref={canvasRef} className="preview-img" style={{ maxHeight: 300, background: "transparent" }} />
          <div style={{ marginTop: 14 }}>
            <button className="btn" onClick={download}>⬇ Download image</button>
          </div>
        </>
      )}

      <p className="privacy-note">🔒 Editing runs in your browser — your image is never uploaded.</p>
    </div>
  );
}
