"use client";

import { useState, useMemo } from "react";

const PRESETS = [
  { label: '27" 4K (3840×2160)', diag: 27, w: 3840, h: 2160 },
  { label: '24" 1080p (1920×1080)', diag: 24, w: 1920, h: 1080 },
  { label: '32" 1440p (2560×1440)', diag: 32, w: 2560, h: 1440 },
  { label: '15.6" 1080p (1920×1080)', diag: 15.6, w: 1920, h: 1080 },
  { label: '13.3" 2K (2560×1600)', diag: 13.3, w: 2560, h: 1600 },
  { label: '6.1" phone (1170×2532)', diag: 6.1, w: 1170, h: 2532 },
  { label: '6.7" phone (1290×2796)', diag: 6.7, w: 1290, h: 2796 },
  { label: '10.9" tablet (2360×1640)', diag: 10.9, w: 2360, h: 1640 },
  { label: '65" 4K TV (3840×2160)', diag: 65, w: 3840, h: 2160 },
];

export default function PpiCalculator() {
  const [diag, setDiag] = useState("");
  const [w, setW] = useState("");
  const [h, setH] = useState("");

  const result = useMemo(() => {
    const d = parseFloat(diag);
    const width = parseFloat(w);
    const height = parseFloat(h);
    if (!d || !width || !height) return null;
    const diagPx = Math.sqrt(width * width + height * height);
    const ppi = diagPx / d;
    const dotPitch = 25.4 / ppi; // mm
    const totalPixels = width * height;
    const mp = totalPixels / 1_000_000;
    const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
    const g = gcd(width, height);
    return {
      ppi: Math.round(ppi * 10) / 10,
      dotPitch: Math.round(dotPitch * 1000) / 1000,
      totalPixels: totalPixels.toLocaleString(),
      mp: Math.round(mp * 10) / 10,
      aspect: `${width / g}:${height / g}`,
    };
  }, [diag, w, h]);

  function applyPreset(p: typeof PRESETS[number]) {
    setDiag(String(p.diag));
    setW(String(p.w));
    setH(String(p.h));
  }

  return (
    <div>
      <div className="field">
        <label>Common display presets</label>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {PRESETS.map((p) => (
            <button key={p.label} type="button" className="btn secondary" style={{ padding: "6px 10px", fontSize: ".78rem" }} onClick={() => applyPreset(p)}>{p.label}</button>
          ))}
        </div>
      </div>
      <div className="row">
        <div className="field"><label>Diagonal size (inches)</label><input className="input" type="number" step="0.1" value={diag} onChange={(e) => setDiag(e.target.value)} placeholder="e.g. 27" /></div>
        <div className="field"><label>Width (pixels)</label><input className="input" type="number" value={w} onChange={(e) => setW(e.target.value)} placeholder="e.g. 3840" /></div>
        <div className="field"><label>Height (pixels)</label><input className="input" type="number" value={h} onChange={(e) => setH(e.target.value)} placeholder="e.g. 2160" /></div>
      </div>
      {result && (
        <div className="stats">
          <div className="stat"><div className="n">{result.ppi}</div><div className="l">PPI</div></div>
          <div className="stat"><div className="n">{result.dotPitch} mm</div><div className="l">Dot pitch</div></div>
          <div className="stat"><div className="n">{result.aspect}</div><div className="l">Aspect ratio</div></div>
          <div className="stat"><div className="n">{result.mp} MP</div><div className="l">Megapixels</div></div>
        </div>
      )}
      <p className="privacy-note">🔒 All calculations run in your browser. Perfect for comparing display sharpness.</p>
    </div>
  );
}
