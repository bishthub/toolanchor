"use client";

import { useState } from "react";

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const m = hex.replace("#", "").match(/^([0-9a-f]{6})$/i);
  if (!m) return null;
  const n = parseInt(m[1], 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

// WCAG 2.1 relative luminance
function luminance({ r, g, b }: { r: number; g: number; b: number }): number {
  const [lr, lg, lb] = [r, g, b].map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * lr + 0.7152 * lg + 0.0722 * lb;
}

function contrastRatio(a: { r: number; g: number; b: number }, b: { r: number; g: number; b: number }): number {
  const l1 = luminance(a);
  const l2 = luminance(b);
  const [hi, lo] = l1 >= l2 ? [l1, l2] : [l2, l1];
  return (hi + 0.05) / (lo + 0.05);
}

function PassChip({ label, min, ratio }: { label: string; min: number; ratio: number }) {
  const pass = ratio >= min;
  return (
    <div className="stat">
      <div className="n" style={{ color: pass ? "var(--ok)" : "#ff6b6b" }}>{pass ? "Pass" : "Fail"}</div>
      <div className="l">{label} (≥ {min}:1)</div>
    </div>
  );
}

function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  const valid = hexToRgb(value) !== null;
  return (
    <div className="row" style={{ alignItems: "flex-end" }}>
      <div className="field" style={{ maxWidth: 90 }}>
        <label>Pick</label>
        <input type="color" value={valid ? value : "#000000"} onChange={(e) => onChange(e.target.value)} style={{ width: 56, height: 44, border: "none", background: "none" }} />
      </div>
      <div className="field">
        <label>{label}</label>
        <input className="input" value={value} onChange={(e) => onChange(e.target.value)} style={{ fontFamily: "monospace" }} />
      </div>
    </div>
  );
}

export default function ContrastChecker() {
  const [fg, setFg] = useState("#1a1a2e");
  const [bg, setBg] = useState("#f5f5f7");

  const fgRgb = hexToRgb(fg);
  const bgRgb = hexToRgb(bg);
  const ratio = fgRgb && bgRgb ? contrastRatio(fgRgb, bgRgb) : null;

  function swap() {
    setFg(bg);
    setBg(fg);
  }

  return (
    <div>
      <ColorField label="Text colour (HEX)" value={fg} onChange={setFg} />
      <ColorField label="Background colour (HEX)" value={bg} onChange={setBg} />

      <div className="row" style={{ marginBottom: 14 }}>
        <button className="btn secondary" onClick={swap}>⇅ Swap colors</button>
      </div>

      {(!fgRgb || !bgRgb) && <p style={{ color: "#ff6b6b" }}>Enter 6-digit hex colours like #1a1a2e.</p>}

      {ratio !== null && fgRgb && bgRgb && (
        <>
          <div className="stats">
            <div className="stat">
              <div className="n">{(Math.round(ratio * 100) / 100).toFixed(2)} : 1</div>
              <div className="l">Contrast ratio</div>
            </div>
            <PassChip label="AA normal" min={4.5} ratio={ratio} />
            <PassChip label="AA large" min={3} ratio={ratio} />
            <PassChip label="AAA normal" min={7} ratio={ratio} />
            <PassChip label="AAA large" min={4.5} ratio={ratio} />
          </div>

          <div style={{ borderRadius: 10, border: "1px solid var(--border)", background: bg, color: fg, padding: "18px 20px", margin: "8px 0 14px" }}>
            <p style={{ fontSize: "1rem", margin: 0 }}>Normal text — the quick brown fox jumps over the lazy dog.</p>
            <p style={{ fontSize: "1.4rem", fontWeight: 700, margin: "10px 0 0" }}>Large bold text — readable at a glance?</p>
          </div>
        </>
      )}

      <p className="privacy-note">🔒 Checked instantly in your browser — nothing is uploaded.</p>
    </div>
  );
}
