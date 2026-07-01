"use client";

import { useState } from "react";

const FREQ: Record<string, number> = { Annually: 1, "Half-yearly": 2, Quarterly: 4, Monthly: 12 };
const money = (n: number) =>
  Number.isFinite(n) ? n.toLocaleString(undefined, { maximumFractionDigits: 0 }) : "—";

export default function FdCalculator() {
  const [principal, setPrincipal] = useState("");
  const [rate, setRate] = useState("");
  const [years, setYears] = useState("");
  const [freq, setFreq] = useState("Quarterly");

  const p = parseFloat(principal);
  const r = parseFloat(rate) / 100;
  const t = parseFloat(years);
  const n = FREQ[freq];
  const ready = p > 0 && r >= 0 && t > 0;

  const maturity = ready ? p * Math.pow(1 + r / n, n * t) : 0;
  const interest = maturity - p;

  return (
    <div>
      <div className="field">
        <label>Deposit amount</label>
        <input type="number" className="input" value={principal} onChange={(e) => setPrincipal(e.target.value)} placeholder="100000" />
      </div>
      <div className="row">
        <div className="field">
          <label>Interest rate (% p.a.)</label>
          <input type="number" className="input" value={rate} onChange={(e) => setRate(e.target.value)} placeholder="7" />
        </div>
        <div className="field">
          <label>Term (years)</label>
          <input type="number" className="input" value={years} onChange={(e) => setYears(e.target.value)} placeholder="5" />
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
          <div className="stat"><div className="n">{money(p)}</div><div className="l">Principal</div></div>
          <div className="stat"><div className="n">{money(interest)}</div><div className="l">Interest earned</div></div>
          <div className="stat"><div className="n">{money(maturity)}</div><div className="l">Maturity value</div></div>
        </div>
      )}

      <p className="privacy-note">🔒 Calculated instantly in your browser. Estimate before tax (TDS).</p>
    </div>
  );
}
