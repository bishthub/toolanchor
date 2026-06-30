"use client";

import { useState } from "react";

export default function CssGradientGenerator() {
  const [c1, setC1] = useState("#7c8cff");
  const [c2, setC2] = useState("#b59bff");
  const [type, setType] = useState<"linear" | "radial">("linear");
  const [angle, setAngle] = useState(135);
  const [copied, setCopied] = useState(false);

  const value = type === "linear"
    ? `linear-gradient(${angle}deg, ${c1}, ${c2})`
    : `radial-gradient(circle, ${c1}, ${c2})`;
  const css = `background: ${value};`;

  async function copy() { await navigator.clipboard.writeText(css); setCopied(true); setTimeout(() => setCopied(false), 1200); }

  return (
    <div>
      <div style={{ height: 160, borderRadius: 12, border: "1px solid var(--border)", background: value, marginBottom: 16 }} />

      <div className="row">
        <div className="field" style={{ maxWidth: 120 }}>
          <label>Colour 1</label>
          <input type="color" value={c1} onChange={(e) => setC1(e.target.value)} style={{ width: 56, height: 40, border: "none", background: "none" }} />
        </div>
        <div className="field" style={{ maxWidth: 120 }}>
          <label>Colour 2</label>
          <input type="color" value={c2} onChange={(e) => setC2(e.target.value)} style={{ width: 56, height: 40, border: "none", background: "none" }} />
        </div>
        <div className="field">
          <label>Type</label>
          <div className="row">
            <button type="button" className={`btn ${type === "linear" ? "" : "secondary"}`} onClick={() => setType("linear")}>Linear</button>
            <button type="button" className={`btn ${type === "radial" ? "" : "secondary"}`} onClick={() => setType("radial")}>Radial</button>
          </div>
        </div>
      </div>

      {type === "linear" && (
        <div className="field" style={{ maxWidth: 280 }}>
          <label>Angle: {angle}°</label>
          <input type="range" min={0} max={360} value={angle} onChange={(e) => setAngle(Number(e.target.value))} style={{ width: "100%" }} />
        </div>
      )}

      <div className="field">
        <label>CSS</label>
        <textarea readOnly value={css} className="mono" style={{ minHeight: 60 }} />
      </div>
      <button className="btn" onClick={copy}>{copied ? "✓ Copied" : "Copy CSS"}</button>
      <p className="privacy-note">🔒 Generated locally in your browser.</p>
    </div>
  );
}
