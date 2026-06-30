"use client";

import { useState } from "react";

export default function BoxShadowGenerator() {
  const [x, setX] = useState(0);
  const [y, setY] = useState(10);
  const [blur, setBlur] = useState(30);
  const [spread, setSpread] = useState(-5);
  const [color, setColor] = useState("#000000");
  const [opacity, setOpacity] = useState(40);
  const [inset, setInset] = useState(false);
  const [copied, setCopied] = useState(false);

  const r = parseInt(color.slice(1, 3), 16);
  const g = parseInt(color.slice(3, 5), 16);
  const b = parseInt(color.slice(5, 7), 16);
  const value = `${inset ? "inset " : ""}${x}px ${y}px ${blur}px ${spread}px rgba(${r}, ${g}, ${b}, ${(opacity / 100).toFixed(2)})`;
  const css = `box-shadow: ${value};`;

  async function copy() { await navigator.clipboard.writeText(css); setCopied(true); setTimeout(() => setCopied(false), 1200); }

  const Slider = ({ label, v, set, min, max }: { label: string; v: number; set: (n: number) => void; min: number; max: number }) => (
    <div className="field" style={{ minWidth: 130, flex: 1 }}>
      <label>{label}: {v}px</label>
      <input type="range" min={min} max={max} value={v} onChange={(e) => set(Number(e.target.value))} style={{ width: "100%" }} />
    </div>
  );

  return (
    <div>
      <div style={{ display: "grid", placeItems: "center", padding: 40, background: "var(--surface-2, #1a1f2e)", borderRadius: 12, marginBottom: 16 }}>
        <div style={{ width: 120, height: 120, borderRadius: 16, background: "var(--bg-2, #fff)", boxShadow: value }} />
      </div>

      <div className="row" style={{ flexWrap: "wrap" }}>
        <Slider label="X offset" v={x} set={setX} min={-50} max={50} />
        <Slider label="Y offset" v={y} set={setY} min={-50} max={50} />
        <Slider label="Blur" v={blur} set={setBlur} min={0} max={100} />
        <Slider label="Spread" v={spread} set={setSpread} min={-50} max={50} />
      </div>
      <div className="row" style={{ alignItems: "flex-end" }}>
        <div className="field" style={{ maxWidth: 110 }}>
          <label>Colour</label>
          <input type="color" value={color} onChange={(e) => setColor(e.target.value)} style={{ width: 56, height: 40, border: "none", background: "none" }} />
        </div>
        <div className="field" style={{ minWidth: 130 }}>
          <label>Opacity: {opacity}%</label>
          <input type="range" min={0} max={100} value={opacity} onChange={(e) => setOpacity(Number(e.target.value))} style={{ width: "100%" }} />
        </div>
        <label style={{ display: "flex", gap: 6, alignItems: "center", color: "var(--muted)", fontSize: ".9rem", paddingBottom: 12 }}>
          <input type="checkbox" checked={inset} onChange={(e) => setInset(e.target.checked)} /> Inset
        </label>
      </div>

      <div className="field">
        <label>CSS</label>
        <textarea readOnly value={css} className="mono" style={{ minHeight: 60 }} />
      </div>
      <button className="btn" onClick={copy}>{copied ? "✓ Copied" : "Copy CSS"}</button>
      <p className="privacy-note">🔒 Generated locally in your browser.</p>
    </div>
  );
}
