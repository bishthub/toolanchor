"use client";

import { useState } from "react";

const fmt = (n: number) =>
  Number.isFinite(n) ? n.toLocaleString(undefined, { maximumFractionDigits: 4 }) : "—";

function median(nums: number[]): number {
  const s = [...nums].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

export default function AverageCalculator() {
  const [raw, setRaw] = useState("");

  const nums = raw
    .split(/[\s,]+/)
    .map((x) => x.trim())
    .filter(Boolean)
    .map(Number)
    .filter((n) => Number.isFinite(n));

  const sum = nums.reduce((a, b) => a + b, 0);
  const mean = nums.length ? sum / nums.length : NaN;

  return (
    <div>
      <div className="field">
        <label>Numbers (separated by spaces, commas or new lines)</label>
        <textarea value={raw} onChange={(e) => setRaw(e.target.value)} placeholder="12, 8, 5&#10;20 17" />
      </div>

      {nums.length > 0 && (
        <div className="stats">
          <div className="stat"><div className="n">{fmt(mean)}</div><div className="l">Mean</div></div>
          <div className="stat"><div className="n">{fmt(median(nums))}</div><div className="l">Median</div></div>
          <div className="stat"><div className="n">{fmt(sum)}</div><div className="l">Sum</div></div>
          <div className="stat"><div className="n">{nums.length}</div><div className="l">Count</div></div>
          <div className="stat"><div className="n">{fmt(Math.min(...nums))}</div><div className="l">Min</div></div>
          <div className="stat"><div className="n">{fmt(Math.max(...nums))}</div><div className="l">Max</div></div>
        </div>
      )}

      <p className="privacy-note">🔒 Calculated instantly in your browser.</p>
    </div>
  );
}
