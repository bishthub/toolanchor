"use client";

import { useEffect, useRef, useState } from "react";

export default function MemeGenerator() {
  const [src, setSrc] = useState<string | null>(null);
  const [top, setTop] = useState("TOP TEXT");
  const [bottom, setBottom] = useState("BOTTOM TEXT");
  const imgRef = useRef<HTMLImageElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => { imgRef.current = img; setSrc(url); };
    img.src = url;
  }

  useEffect(() => {
    const img = imgRef.current, canvas = canvasRef.current;
    if (!img || !canvas || !src) return;
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(img, 0, 0);
    const fontSize = Math.round(canvas.width / 11);
    ctx.font = `bold ${fontSize}px Impact, "Arial Black", sans-serif`;
    ctx.textAlign = "center";
    ctx.fillStyle = "#fff";
    ctx.strokeStyle = "#000";
    ctx.lineWidth = Math.max(2, fontSize / 12);
    ctx.lineJoin = "round";
    const draw = (text: string, y: number) => {
      const t = text.toUpperCase();
      ctx.strokeText(t, canvas.width / 2, y, canvas.width * 0.95);
      ctx.fillText(t, canvas.width / 2, y, canvas.width * 0.95);
    };
    ctx.textBaseline = "top";
    if (top) draw(top, fontSize * 0.3);
    ctx.textBaseline = "bottom";
    if (bottom) draw(bottom, canvas.height - fontSize * 0.3);
  }, [src, top, bottom]);

  function download() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.toBlob((blob) => {
      if (!blob) return;
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "meme.png";
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
          <div className="row">
            <div className="field"><label>Top text</label><input className="input" value={top} onChange={(e) => setTop(e.target.value)} /></div>
            <div className="field"><label>Bottom text</label><input className="input" value={bottom} onChange={(e) => setBottom(e.target.value)} /></div>
          </div>
          <canvas ref={canvasRef} className="preview-img" style={{ maxHeight: 320 }} />
          <div style={{ marginTop: 12 }}><button className="btn" onClick={download}>⬇ Download meme</button></div>
        </>
      )}
      <p className="privacy-note">🔒 Rendered in your browser — your image is never uploaded.</p>
    </div>
  );
}
