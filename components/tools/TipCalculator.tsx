"use client";

import { useState } from "react";

const money = (n: number) =>
  Number.isFinite(n) ? n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "—";

export default function TipCalculator() {
  const [bill, setBill] = useState("");
  const [tipPct, setTipPct] = useState(15);
  const [people, setPeople] = useState(1);

  const b = parseFloat(bill);
  const ready = b > 0;
  const tip = ready ? (b * tipPct) / 100 : 0;
  const total = ready ? b + tip : 0;
  const per = ready && people > 0 ? total / people : 0;

  return (
    <div>
      <div className="field">
        <label>Bill amount</label>
        <input type="number" className="input" value={bill} onChange={(e) => setBill(e.target.value)} />
      </div>

      <div className="field">
        <label>Tip: {tipPct}%</label>
        <div className="row" style={{ marginBottom: 8 }}>
          {[10, 15, 18, 20, 25].map((p) => (
            <button key={p} type="button" className={`btn ${tipPct === p ? "" : "secondary"}`} onClick={() => setTipPct(p)}>{p}%</button>
          ))}
        </div>
        <input type="range" min={0} max={40} value={tipPct} onChange={(e) => setTipPct(Number(e.target.value))} style={{ width: "100%" }} />
      </div>

      <div className="field" style={{ maxWidth: 200 }}>
        <label>Split between (people)</label>
        <input type="number" className="input" min={1} value={people} onChange={(e) => setPeople(Math.max(1, Number(e.target.value)))} />
      </div>

      {ready && (
        <div className="stats">
          <div className="stat"><div className="n">{money(tip)}</div><div className="l">Tip</div></div>
          <div className="stat"><div className="n">{money(total)}</div><div className="l">Total</div></div>
          <div className="stat"><div className="n">{money(per)}</div><div className="l">Per person</div></div>
        </div>
      )}

      <p className="privacy-note">🔒 Calculated instantly in your browser.</p>
    </div>
  );
}
