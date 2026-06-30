"use client";

import { useRef, useState } from "react";

const hex = (r: number, g: number, b: number) =>
  "#" + [r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("");

export default function ImageColorPicker() {
  const [src, setSrc] = useState<string | null>(null);
  const [picked, setPicked] = useState<string | null>(null);
  const [palette, setPalette] = useState<string[]>([]);
  const [copied, setCopied] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const img = new Image();
    img.onload = () => {
      const canvas = canvasRef.current!;
      const maxW = 600;
      const scale = Math.min(1, maxW / img.naturalWidth);
      canvas.width = img.naturalWidth * scale;
      canvas.height = img.naturalHeight * scale;
      canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
      setSrc(file.name);
      setPalette(extractPalette(canvas));
      setPicked(null);
    };
    img.src = URL.createObjectURL(file);
  }

  function extractPalette(canvas: HTMLCanvasElement): string[] {
    const ctx = canvas.getContext("2d")!;
    const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const buckets = new Map<string, { c: number; r: number; g: number; b: number }>();
    for (let i = 0; i < data.length; i += 4 * 20) { // sample every 20th pixel
      if (data[i + 3] < 128) continue;
      const r = data[i], g = data[i + 1], b = data[i + 2];
      const key = `${r >> 5}-${g >> 5}-${b >> 5}`;
      const e = buckets.get(key) ?? { c: 0, r: 0, g: 0, b: 0 };
      e.c++; e.r += r; e.g += g; e.b += b;
      buckets.set(key, e);
    }
    return [...buckets.values()].sort((a, b) => b.c - a.c).slice(0, 8)
      .map((e) => hex(Math.round(e.r / e.c), Math.round(e.g / e.c), Math.round(e.b / e.c)));
  }

  function onClick(e: React.MouseEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left) * (canvas.width / rect.width));
    const y = Math.floor((e.clientY - rect.top) * (canvas.height / rect.height));
    const [r, g, b] = canvas.getContext("2d")!.getImageData(x, y, 1, 1).data;
    setPicked(hex(r, g, b));
  }

  async function copy(c: string) { await navigator.clipboard.writeText(c); setCopied(c); setTimeout(() => setCopied(null), 1000); }

  return (
    <div>
      <div className="field">
        <label>Choose an image</label>
        <input type="file" accept="image/*" onChange={onFile} className="input" />
      </div>

      <canvas ref={canvasRef} onClick={onClick} style={{ maxWidth: "100%", borderRadius: 10, border: "1px solid var(--border)", cursor: src ? "crosshair" : "default", display: src ? "block" : "none" }} />
      {src && <p style={{ color: "var(--muted)", fontSize: ".82rem", marginTop: 6 }}>Click anywhere on the image to pick a colour.</p>}

      {picked && (
        <div className="stat" style={{ marginTop: 10, cursor: "pointer" }} onClick={() => copy(picked)}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, justifyContent: "center" }}>
            <span style={{ width: 24, height: 24, borderRadius: 6, background: picked, border: "1px solid var(--border)" }} />
            <span className="n" style={{ fontSize: "1.1rem" }}>{copied === picked ? "✓ Copied" : picked}</span>
          </div>
          <div className="l">Picked colour (click to copy)</div>
        </div>
      )}

      {palette.length > 0 && (
        <div className="field" style={{ marginTop: 14 }}>
          <label>Dominant palette (click to copy)</label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {palette.map((c) => (
              <button key={c} type="button" onClick={() => copy(c)} title={c}
                style={{ width: 64, height: 48, borderRadius: 8, background: c, border: "1px solid var(--border)", cursor: "pointer", color: "#fff", fontSize: ".62rem", textShadow: "0 1px 2px rgba(0,0,0,.6)", display: "flex", alignItems: "flex-end", justifyContent: "center", paddingBottom: 3 }}>
                {copied === c ? "✓" : c}
              </button>
            ))}
          </div>
        </div>
      )}
      <p className="privacy-note">🔒 Colours are read locally — your image is never uploaded.</p>
    </div>
  );
}
