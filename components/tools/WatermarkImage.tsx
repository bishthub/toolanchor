"use client";

import { useEffect, useRef, useState } from "react";

const POSITIONS = ["Bottom-right", "Bottom-left", "Top-right", "Top-left", "Center", "Tiled"] as const;

export default function WatermarkImage() {
  const [src, setSrc] = useState<string | null>(null);
  const [textWm, setTextWm] = useState("© Your Name");
  const [size, setSize] = useState(32);
  const [opacity, setOpacity] = useState(50);
  const [position, setPosition] = useState<(typeof POSITIONS)[number]>("Bottom-right");
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
    const img = imgRef.current, canvas = canvasRef.current;
    if (!img || !canvas || !src) return;
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(img, 0, 0);
    ctx.globalAlpha = opacity / 100;
    ctx.fillStyle = "#ffffff";
    ctx.strokeStyle = "rgba(0,0,0,0.4)";
    ctx.lineWidth = Math.max(1, size / 16);
    ctx.font = `bold ${size}px sans-serif`;
    ctx.textBaseline = "middle";
    const pad = size * 0.6;
    const w = ctx.measureText(textWm).width;
    const draw = (x: number, y: number) => { ctx.strokeText(textWm, x, y); ctx.fillText(textWm, x, y); };

    if (position === "Tiled") {
      for (let y = size; y < canvas.height; y += size * 3)
        for (let x = 0; x < canvas.width; x += w + size * 2) draw(x, y);
    } else {
      const right = canvas.width - w - pad, left = pad, midX = (canvas.width - w) / 2;
      const top = size, bottom = canvas.height - size, midY = canvas.height / 2;
      const map: Record<string, [number, number]> = {
        "Bottom-right": [right, bottom], "Bottom-left": [left, bottom],
        "Top-right": [right, top], "Top-left": [left, top], Center: [midX, midY],
      };
      const [x, y] = map[position];
      ctx.textAlign = "left";
      draw(x, y);
    }
    ctx.globalAlpha = 1;
  }, [src, textWm, size, opacity, position]);

  function download() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.toBlob((blob) => {
      if (!blob) return;
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `${fileName}-watermarked.png`;
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
          <div className="field">
            <label>Watermark text</label>
            <input className="input" value={textWm} onChange={(e) => setTextWm(e.target.value)} />
          </div>
          <div className="row">
            <div className="field"><label>Size: {size}px</label><input type="range" min={12} max={120} value={size} onChange={(e) => setSize(Number(e.target.value))} style={{ width: "100%" }} /></div>
            <div className="field"><label>Opacity: {opacity}%</label><input type="range" min={5} max={100} value={opacity} onChange={(e) => setOpacity(Number(e.target.value))} style={{ width: "100%" }} /></div>
            <div className="field"><label>Position</label>
              <select className="input" value={position} onChange={(e) => setPosition(e.target.value as typeof position)}>
                {POSITIONS.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          </div>
          <canvas ref={canvasRef} className="preview-img" style={{ maxHeight: 300 }} />
          <div style={{ marginTop: 12 }}><button className="btn" onClick={download}>⬇ Download watermarked image</button></div>
        </>
      )}
      <p className="privacy-note">🔒 Watermarking runs in your browser — your image is never uploaded.</p>
    </div>
  );
}
