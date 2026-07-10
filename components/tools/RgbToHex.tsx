"use client";

import { useState, useMemo } from "react";

function toHex(n: number): string {
  return Math.round(Math.max(0, Math.min(255, n))).toString(16).padStart(2, "0");
}

function parseHex(hex: string): { r: number; g: number; b: number; a: number } | null {
  const h = hex.replace("#", "").trim();
  if (h.length === 3) {
    const [r, g, b] = h.split("").map((c) => parseInt(c.repeat(2), 16));
    return { r, g, b, a: 1 };
  }
  if (h.length === 6) {
    const r = parseInt(h.slice(0, 2), 16);
    const g = parseInt(h.slice(2, 4), 16);
    const b = parseInt(h.slice(4, 6), 16);
    if (isNaN(r + g + b)) return null;
    return { r, g, b, a: 1 };
  }
  if (h.length === 8) {
    const r = parseInt(h.slice(0, 2), 16);
    const g = parseInt(h.slice(2, 4), 16);
    const b = parseInt(h.slice(4, 6), 16);
    const a = Math.round((parseInt(h.slice(6, 8), 16) / 255) * 100) / 100;
    if (isNaN(r + g + b + a)) return null;
    return { r, g, b, a };
  }
  return null;
}

export default function RgbToHex() {
  const [r, setR] = useState("140");
  const [g, setG] = useState("82");
  const [b, setB] = useState("255");
  const [alpha, setAlpha] = useState("1");
  const [hexInput, setHexInput] = useState("#8c52ff");

  const [source, setSource] = useState<"rgb" | "hex">("rgb");

  const rgbResult = useMemo(() => {
    const rr = parseInt(r) || 0;
    const gg = parseInt(g) || 0;
    const bb = parseInt(b) || 0;
    const aa = parseFloat(alpha) || 1;
    const hex = "#" + toHex(rr) + toHex(gg) + toHex(bb);
    const hex8 = "#" + toHex(rr) + toHex(gg) + toHex(bb) + toHex(Math.round(aa * 255));
    return { hex, hex8, rgba: `rgba(${rr}, ${gg}, ${bb}, ${aa})`, rgb: `${rr}, ${gg}, ${bb}`, hsl: rgbToHsl(rr, gg, bb) };
  }, [r, g, b, alpha]);

  const hexResult = useMemo(() => {
    const parsed = parseHex(hexInput);
    if (!parsed) return null;
    return { r: parsed.r, g: parsed.g, b: parsed.b, a: parsed.a, hex: "#" + toHex(parsed.r) + toHex(parsed.g) + toHex(parsed.b) };
  }, [hexInput]);

  const display = source === "rgb" ? rgbResult : hexResult;
  const bgColor = source === "rgb" ? rgbResult.hex : (hexResult?.hex ?? "#000");

  return (
    <div>
      <div className="field" style={{ maxWidth: 200 }}>
        <label>Input mode</label>
        <div style={{ display: "flex", gap: 6 }}>
          <button type="button" className={source === "rgb" ? "btn" : "btn secondary"} style={{ padding: "8px 14px", fontSize: ".85rem" }} onClick={() => setSource("rgb")}>RGB / HSL</button>
          <button type="button" className={source === "hex" ? "btn" : "btn secondary"} style={{ padding: "8px 14px", fontSize: ".85rem" }} onClick={() => setSource("hex")}>HEX</button>
        </div>
      </div>

      {source === "rgb" ? (
        <div className="row">
          <div className="field"><label>Red (0–255)</label><input className="input" type="number" min={0} max={255} value={r} onChange={(e) => setR(e.target.value)} /></div>
          <div className="field"><label>Green (0–255)</label><input className="input" type="number" min={0} max={255} value={g} onChange={(e) => setG(e.target.value)} /></div>
          <div className="field"><label>Blue (0–255)</label><input className="input" type="number" min={0} max={255} value={b} onChange={(e) => setB(e.target.value)} /></div>
          <div className="field" style={{ maxWidth: 120 }}><label>Alpha</label><input className="input" type="number" min={0} max={1} step={0.05} value={alpha} onChange={(e) => setAlpha(e.target.value)} /></div>
        </div>
      ) : (
        <div className="field" style={{ maxWidth: 250 }}>
          <label>HEX color</label>
          <input className="input" style={{ fontFamily: "var(--font-mono), monospace", fontSize: "1.1rem" }} value={hexInput} onChange={(e) => setHexInput(e.target.value)} placeholder="#8c52ff" />
        </div>
      )}

      <div style={{ display: "flex", gap: 16, alignItems: "flex-start", marginTop: 16 }}>
        <div style={{ width: 100, height: 100, borderRadius: "var(--radius-sm)", background: bgColor, border: "1px solid var(--border)", flex: "none" }} />
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
          {source === "rgb" && (
            <>
              <CopyField label="HEX" value={rgbResult.hex} />
              <CopyField label="HEX (alpha)" value={rgbResult.hex8} />
              <CopyField label="RGBA" value={rgbResult.rgba} />
              <CopyField label="HSL" value={rgbResult.hsl} />
            </>
          )}
          {source === "hex" && hexResult && (
            <>
              <CopyField label="HEX" value={hexResult.hex} />
              <CopyField label="RGB" value={`${hexResult.r}, ${hexResult.g}, ${hexResult.b}`} />
              <CopyField label="RGBA" value={`rgba(${hexResult.r}, ${hexResult.g}, ${hexResult.b}, ${hexResult.a})`} />
            </>
          )}
        </div>
      </div>

      <p className="privacy-note">🔒 All conversions run in your browser. Supports HEX, RGB, RGBA and HSL formats.</p>
    </div>
  );
}

function CopyField({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <span style={{ fontSize: ".8rem", fontWeight: 550, minWidth: 60, color: "var(--muted)" }}>{label}</span>
      <code style={{ fontSize: ".85rem", padding: "4px 8px", background: "var(--bg-2)", border: "1px solid var(--border)", borderRadius: 5, flex: 1 }}>{value}</code>
      <button className="btn secondary" style={{ padding: "3px 8px", fontSize: ".72rem" }} onClick={() => { navigator.clipboard.writeText(value); setCopied(true); setTimeout(() => setCopied(false), 1000); }}>
        {copied ? "✓" : "Copy"}
      </button>
    </div>
  );
}

function rgbToHsl(r: number, g: number, b: number): string {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0, l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  return `hsl(${Math.round(h * 360)}, ${Math.round(s * 100)}%, ${Math.round(l * 100)}%)`;
}
