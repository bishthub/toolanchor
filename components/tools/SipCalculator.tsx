"use client";

import { useState } from "react";

const money = (n: number) =>
  Number.isFinite(n) ? n.toLocaleString(undefined, { maximumFractionDigits: 0 }) : "—";

export default function SipCalculator() {
  const [monthly, setMonthly] = useState("");
  const [rate, setRate] = useState("");
  const [years, setYears] = useState("");

  const p = parseFloat(monthly);
  const annual = parseFloat(rate) / 100;
  const t = parseFloat(years);
  const ready = p > 0 && annual >= 0 && t > 0;

  const i = annual / 12;              // monthly rate
  const n = t * 12;                   // number of monthly instalments
  // Future value of a monthly SIP (annuity due — invested at period start).
  const future = ready
    ? i === 0
      ? p * n
      : p * ((Math.pow(1 + i, n) - 1) / i) * (1 + i)
    : 0;
  const invested = ready ? p * n : 0;
  const returns = future - invested;

  return (
    <div>
      <div className="field">
        <label>Monthly investment</label>
        <input type="number" className="input" value={monthly} onChange={(e) => setMonthly(e.target.value)} placeholder="5000" />
      </div>
      <div className="row">
        <div className="field">
          <label>Expected annual return (%)</label>
          <input type="number" className="input" value={rate} onChange={(e) => setRate(e.target.value)} placeholder="12" />
        </div>
        <div className="field">
          <label>Time period (years)</label>
          <input type="number" className="input" value={years} onChange={(e) => setYears(e.target.value)} placeholder="10" />
        </div>
      </div>

      {ready && (
        <div className="stats">
          <div className="stat"><div className="n">{money(invested)}</div><div className="l">Invested</div></div>
          <div className="stat"><div className="n">{money(returns)}</div><div className="l">Est. returns</div></div>
          <div className="stat"><div className="n">{money(future)}</div><div className="l">Total value</div></div>
        </div>
      )}

      <p className="privacy-note">🔒 Calculated instantly in your browser. Estimates only — returns are not guaranteed.</p>
    </div>
  );
}
