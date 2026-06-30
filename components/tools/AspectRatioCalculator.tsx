"use client";

import { useState } from "react";

const PRESETS = ["16:9", "4:3", "21:9", "1:1", "3:2", "9:16"];

export default function AspectRatioCalculator() {
  const [ratio, setRatio] = useState("16:9");
  const [w, setW] = useState("1920");
  const [h, setH] = useState("");
  const [last, setLast] = useState<"w" | "h">("w");

  const m = ratio.match(/^(\d+(?:\.\d+)?)\s*[:/x]\s*(\d+(?:\.\d+)?)$/);
  const rw = m ? parseFloat(m[1]) : NaN;
  const rh = m ? parseFloat(m[2]) : NaN;
  const validRatio = m && rw > 0 && rh > 0;

  let outW = w, outH = h;
  if (validRatio) {
    if (last === "w" && parseFloat(w) > 0) outH = String(Math.round((parseFloat(w) * rh) / rw));
    else if (last === "h" && parseFloat(h) > 0) outW = String(Math.round((parseFloat(h) * rw) / rh));
  }

  return (
    <div>
      <div className="field">
        <label>Aspect ratio</label>
        <input className="input" value={ratio} onChange={(e) => setRatio(e.target.value)} placeholder="16:9" />
        <div className="row" style={{ marginTop: 8 }}>
          {PRESETS.map((p) => (
            <button key={p} type="button" className={`btn ${ratio === p ? "" : "secondary"}`} style={{ padding: "6px 12px" }} onClick={() => setRatio(p)}>{p}</button>
          ))}
        </div>
      </div>
      {!validRatio && <p style={{ color: "#ff6b6b" }}>Enter a ratio like 16:9.</p>}
      <div className="row">
        <div className="field">
          <label>Width (px)</label>
          <input className="input" type="number" value={outW} onChange={(e) => { setW(e.target.value); setLast("w"); }} />
        </div>
        <div className="field">
          <label>Height (px)</label>
          <input className="input" type="number" value={outH} onChange={(e) => { setH(e.target.value); setLast("h"); }} />
        </div>
      </div>
      <p className="privacy-note">🔒 Enter the ratio and one dimension — the other is calculated instantly.</p>
    </div>
  );
}
