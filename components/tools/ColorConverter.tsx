"use client";

import { useState } from "react";

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const m = hex.replace("#", "").match(/^([0-9a-f]{6})$/i);
  if (!m) return null;
  const n = parseInt(m[1], 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

function rgbToHsl(r: number, g: number, b: number) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h /= 6;
  }
  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
}

function Copyable({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div
      className="stat"
      style={{ cursor: "pointer" }}
      onClick={async () => { await navigator.clipboard.writeText(value); setCopied(true); setTimeout(() => setCopied(false), 1000); }}
      title="Click to copy"
    >
      <div className="n" style={{ fontSize: "1rem", fontFamily: "monospace" }}>{copied ? "✓ Copied" : value}</div>
      <div className="l">{label}</div>
    </div>
  );
}

export default function ColorConverter() {
  const [hex, setHex] = useState("#5b8cff");
  const rgb = hexToRgb(hex);
  const hsl = rgb ? rgbToHsl(rgb.r, rgb.g, rgb.b) : null;

  return (
    <div>
      <div className="row" style={{ alignItems: "flex-end" }}>
        <div className="field" style={{ maxWidth: 90 }}>
          <label>Pick</label>
          <input type="color" value={rgb ? hex : "#000000"} onChange={(e) => setHex(e.target.value)} style={{ width: 56, height: 44, border: "none", background: "none" }} />
        </div>
        <div className="field">
          <label>HEX</label>
          <input className="input" value={hex} onChange={(e) => setHex(e.target.value)} style={{ fontFamily: "monospace" }} />
        </div>
      </div>

      {!rgb && <p style={{ color: "#ff6b6b" }}>Enter a 6-digit hex colour like #5b8cff.</p>}

      {rgb && hsl && (
        <>
          <div style={{ height: 56, borderRadius: 10, border: "1px solid var(--border)", background: hex, margin: "8px 0 14px" }} />
          <div className="stats">
            <Copyable label="HEX" value={hex.toLowerCase()} />
            <Copyable label="RGB" value={`rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`} />
            <Copyable label="HSL" value={`hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`} />
          </div>
        </>
      )}

      <p className="privacy-note">🔒 Converted instantly in your browser. Click a value to copy.</p>
    </div>
  );
}
