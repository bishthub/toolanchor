"use client";

import { useState } from "react";

const FREQ: Record<string, number> = {
  Annually: 1, "Semi-annually": 2, Quarterly: 4, Monthly: 12, Daily: 365,
};

const money = (n: number) =>
  Number.isFinite(n) ? n.toLocaleString(undefined, { maximumFractionDigits: 2 }) : "—";

export default function CompoundInterestCalculator() {
  const [principal, setPrincipal] = useState("");
  const [rate, setRate] = useState("");
  const [years, setYears] = useState("");
  const [freq, setFreq] = useState("Monthly");

  const p = parseFloat(principal);
  const r = parseFloat(rate) / 100;
  const t = parseFloat(years);
  const n = FREQ[freq];
  const ready = p > 0 && r >= 0 && t > 0;

  const future = ready ? p * Math.pow(1 + r / n, n * t) : 0;
  const interest = ready ? future - p : 0;

  return (
    <div>
      <div className="field">
        <label>Principal amount</label>
        <input type="number" className="input" value={principal} onChange={(e) => setPrincipal(e.target.value)} />
      </div>
      <div className="row">
        <div className="field">
          <label>Annual rate (%)</label>
          <input type="number" className="input" value={rate} onChange={(e) => setRate(e.target.value)} />
        </div>
        <div className="field">
          <label>Years</label>
          <input type="number" className="input" value={years} onChange={(e) => setYears(e.target.value)} />
        </div>
        <div className="field">
          <label>Compounding</label>
          <select className="input" value={freq} onChange={(e) => setFreq(e.target.value)}>
            {Object.keys(FREQ).map((f) => <option key={f} value={f}>{f}</option>)}
          </select>
        </div>
      </div>

      {ready && (
        <div className="stats">
          <div className="stat"><div className="n">{money(future)}</div><div className="l">Final balance</div></div>
          <div className="stat"><div className="n">{money(interest)}</div><div className="l">Interest earned</div></div>
        </div>
      )}

      <p className="privacy-note">🔒 Calculated instantly in your browser.</p>
    </div>
  );
}
