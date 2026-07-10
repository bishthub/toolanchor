"use client";

import { useState, useMemo } from "react";

export default function BraSizeCalculator() {
  const [underbust, setUnderbust] = useState("");
  const [bust, setBust] = useState("");

  const result = useMemo(() => {
    const ub = parseFloat(underbust);
    const b = parseFloat(bust);
    if (!ub || !b) return null;

    const band = Math.round(ub) + (ub % 1 >= 0.5 ? 1 : 0);
    const bandEven = band % 2 === 0 ? band : band + 1;
    const diff = Math.round(b - bandEven);
    const cupIndex = Math.max(0, Math.min(14, diff));
    const cups = ["AA", "A", "B", "C", "D", "DD", "DDD/F", "G", "H", "I", "J", "K", "L", "M", "N"];
    const cup = cups[cupIndex];

    // Sister sizes: same cup volume, different band
    const sisters: { band: number; cup: string }[] = [];
    for (const offset of [-2, 2]) {
      const sb = bandEven + offset;
      if (sb >= 28 && sb <= 48) {
        const si = Math.max(0, Math.min(14, cupIndex - offset / 2));
        sisters.push({ band: sb, cup: cups[si] });
      }
    }

    return { band: bandEven, cup, size: `${bandEven}${cup}`, sisters };
  }, [underbust, bust]);

  return (
    <div>
      <div className="row">
        <div className="field" style={{ maxWidth: 200 }}><label>Underbust (inches)</label><input className="input" type="number" step="0.5" value={underbust} onChange={(e) => setUnderbust(e.target.value)} placeholder="e.g. 32" /></div>
        <div className="field" style={{ maxWidth: 200 }}><label>Bust (inches)</label><input className="input" type="number" step="0.5" value={bust} onChange={(e) => setBust(e.target.value)} placeholder="e.g. 38" /></div>
      </div>
      {result && (
        <>
          <div className="stats">
            <div className="stat" style={{ gridColumn: "1 / -1" }}>
              <div className="n" style={{ fontSize: "2rem" }}>{result.size}</div>
              <div className="l">Your size (band {result.band}, cup {result.cup})</div>
            </div>
          </div>
          {result.sisters.length > 0 && (
            <div className="field">
              <label>Sister sizes (same cup volume)</label>
              <div style={{ display: "flex", gap: 8 }}>
                {result.sisters.map((s) => (
                  <span key={s.band} style={{ padding: "8px 14px", background: "var(--bg-2)", border: "1px solid var(--border)", borderRadius: 8, fontSize: ".9rem", fontWeight: 600 }}>{s.band}{s.cup}</span>
                ))}
              </div>
            </div>
          )}
        </>
      )}
      <p className="privacy-note">🔒 All calculations run in your browser. For best results, measure with a soft tape.</p>
    </div>
  );
}
