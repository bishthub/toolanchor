"use client";

import { useState } from "react";

function secureInt(min: number, max: number): number {
  const range = max - min + 1;
  const limit = Math.floor(0xffffffff / range) * range;
  const buf = new Uint32Array(1);
  let v = 0;
  do { crypto.getRandomValues(buf); v = buf[0]; } while (v >= limit);
  return min + (v % range);
}

export default function RandomNumberGenerator() {
  const [min, setMin] = useState("1");
  const [max, setMax] = useState("100");
  const [count, setCount] = useState("1");
  const [unique, setUnique] = useState(false);
  const [results, setResults] = useState<number[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  function generate() {
    setCopied(false);
    const lo = parseInt(min, 10), hi = parseInt(max, 10), n = Math.max(1, parseInt(count, 10) || 1);
    if (isNaN(lo) || isNaN(hi) || lo > hi) { setError("Min must be ≤ max."); return; }
    if (unique && n > hi - lo + 1) { setError("Can't draw that many unique numbers from this range."); return; }
    setError(null);
    if (unique) {
      const pool = new Set<number>();
      while (pool.size < n) pool.add(secureInt(lo, hi));
      setResults([...pool]);
    } else {
      setResults(Array.from({ length: n }, () => secureInt(lo, hi)));
    }
  }

  async function copy() { await navigator.clipboard.writeText(results.join(", ")); setCopied(true); setTimeout(() => setCopied(false), 1200); }

  return (
    <div>
      <div className="row">
        <div className="field"><label>Min</label><input className="input" type="number" value={min} onChange={(e) => setMin(e.target.value)} /></div>
        <div className="field"><label>Max</label><input className="input" type="number" value={max} onChange={(e) => setMax(e.target.value)} /></div>
        <div className="field"><label>How many</label><input className="input" type="number" min={1} value={count} onChange={(e) => setCount(e.target.value)} /></div>
      </div>
      <label style={{ display: "flex", gap: 6, alignItems: "center", color: "var(--muted)", fontSize: ".9rem", marginBottom: 14 }}>
        <input type="checkbox" checked={unique} onChange={(e) => setUnique(e.target.checked)} /> Unique (no repeats)
      </label>
      <button className="btn" onClick={generate}>Generate</button>
      {error && <p style={{ color: "#ff6b6b", marginTop: 12 }}>{error}</p>}
      {results.length > 0 && (
        <div className="field" style={{ marginTop: 16 }}>
          <label>Result</label>
          <textarea readOnly value={results.join(", ")} className="mono" style={{ minHeight: 70 }} />
          <button className="btn" style={{ marginTop: 8 }} onClick={copy}>{copied ? "✓ Copied" : "Copy"}</button>
        </div>
      )}
      <p className="privacy-note">🔒 Generated locally with the Web Crypto API.</p>
    </div>
  );
}
