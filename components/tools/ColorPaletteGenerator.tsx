"use client";

import { useState } from "react";

function hexToHsl(hex: string): { h: number; s: number; l: number } | null {
  const m = hex.replace("#", "").match(/^([0-9a-f]{6})$/i);
  if (!m) return null;
  const n = parseInt(m[1], 16);
  const r = ((n >> 16) & 255) / 255, g = ((n >> 8) & 255) / 255, b = (n & 255) / 255;
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
  return { h: h * 360, s: s * 100, l: l * 100 };
}

function hslToHex(h: number, s: number, l: number): string {
  h = ((h % 360) + 360) % 360;
  s = Math.min(100, Math.max(0, s)) / 100;
  l = Math.min(100, Math.max(0, l)) / 100;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let r = 0, g = 0, b = 0;
  if (h < 60) { r = c; g = x; }
  else if (h < 120) { r = x; g = c; }
  else if (h < 180) { g = c; b = x; }
  else if (h < 240) { g = x; b = c; }
  else if (h < 300) { r = x; b = c; }
  else { r = c; b = x; }
  const toHex = (v: number) => Math.round((v + m) * 255).toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function labelColorFor(hex: string): string {
  const n = parseInt(hex.replace("#", ""), 16);
  const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.55 ? "#111111" : "#ffffff";
}

function Swatch({ hex }: { hex: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div
      title="Click to copy"
      onClick={async () => { await navigator.clipboard.writeText(hex); setCopied(true); setTimeout(() => setCopied(false), 1000); }}
      style={{
        flex: "1 1 72px", minWidth: 72, height: 64, borderRadius: 8, border: "1px solid var(--border)",
        background: hex, cursor: "pointer", display: "flex", alignItems: "flex-end", justifyContent: "center",
      }}
    >
      <span style={{ color: labelColorFor(hex), fontFamily: "monospace", fontSize: ".72rem", paddingBottom: 6 }}>
        {copied ? "✓ Copied" : hex}
      </span>
    </div>
  );
}

function PaletteRow({ name, colors }: { name: string; colors: string[] }) {
  const [copied, setCopied] = useState(false);
  async function copyAll() {
    await navigator.clipboard.writeText(colors.join(", "));
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  }
  return (
    <div className="field">
      <label>{name}</label>
      <div className="row" style={{ flexWrap: "wrap", gap: 8 }}>
        {colors.map((c, i) => <Swatch key={`${c}-${i}`} hex={c} />)}
      </div>
      <button className="btn secondary" style={{ marginTop: 8 }} onClick={copyAll}>{copied ? "✓ Copied" : "Copy all"}</button>
    </div>
  );
}

export default function ColorPaletteGenerator() {
  const [hex, setHex] = useState("#5b8cff");
  const hsl = hexToHsl(hex);

  function randomize() {
    const h = Math.floor(Math.random() * 360);
    const s = 45 + Math.floor(Math.random() * 45);
    const l = 35 + Math.floor(Math.random() * 30);
    setHex(hslToHex(h, s, l));
  }

  let palettes: { name: string; colors: string[] }[] = [];
  if (hsl) {
    const { h, s, l } = hsl;
    palettes = [
      { name: "Complementary", colors: [hslToHex(h, s, l), hslToHex(h + 180, s, l)] },
      { name: "Analogous", colors: [hslToHex(h - 30, s, l), hslToHex(h, s, l), hslToHex(h + 30, s, l)] },
      { name: "Triadic", colors: [hslToHex(h, s, l), hslToHex(h + 120, s, l), hslToHex(h + 240, s, l)] },
      { name: "Split-complementary", colors: [hslToHex(h, s, l), hslToHex(h + 150, s, l), hslToHex(h + 210, s, l)] },
      { name: "Monochromatic", colors: [90, 70, 50, 32, 16].map((step) => hslToHex(h, s, step)) },
      { name: "Tints & shades", colors: [l + 32, l + 16, l, l - 16, l - 32].map((step) => hslToHex(h, s, Math.min(96, Math.max(6, step)))) },
    ];
  }

  return (
    <div>
      <div className="row" style={{ alignItems: "flex-end" }}>
        <div className="field" style={{ maxWidth: 90 }}>
          <label>Pick</label>
          <input type="color" value={hsl ? hex : "#000000"} onChange={(e) => setHex(e.target.value)} style={{ width: 56, height: 44, border: "none", background: "none" }} />
        </div>
        <div className="field" style={{ maxWidth: 160 }}>
          <label>Base colour (HEX)</label>
          <input className="input" value={hex} onChange={(e) => setHex(e.target.value)} style={{ fontFamily: "monospace" }} />
        </div>
        <div className="field">
          <label>&nbsp;</label>
          <button type="button" className="btn secondary" onClick={randomize}>🎲 Randomize</button>
        </div>
      </div>

      {!hsl && <p style={{ color: "#ff6b6b" }}>Enter a 6-digit hex colour like #5b8cff.</p>}

      {palettes.map((p) => <PaletteRow key={p.name} name={p.name} colors={p.colors} />)}

      <p className="privacy-note">🔒 Palettes are generated instantly in your browser. Click a swatch to copy its hex code.</p>
    </div>
  );
}
