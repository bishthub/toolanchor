"use client";

import { useState } from "react";

const money = (n: number) =>
  Number.isFinite(n) ? n.toLocaleString(undefined, { maximumFractionDigits: 2 }) : "—";

export default function LoanEmiCalculator() {
  const [principal, setPrincipal] = useState("");
  const [rate, setRate] = useState(""); // annual %
  const [years, setYears] = useState("");

  const p = parseFloat(principal);
  const annual = parseFloat(rate);
  const n = parseFloat(years) * 12;

  let emi = 0, total = 0, interest = 0;
  const ready = p > 0 && annual >= 0 && n > 0;
  if (ready) {
    const r = annual / 12 / 100;
    emi = r === 0 ? p / n : (p * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
    total = emi * n;
    interest = total - p;
  }

  return (
    <div>
      <div className="field">
        <label>Loan amount (principal)</label>
        <input type="number" className="input" value={principal} onChange={(e) => setPrincipal(e.target.value)} />
      </div>
      <div className="row">
        <div className="field">
          <label>Annual interest rate (%)</label>
          <input type="number" className="input" value={rate} onChange={(e) => setRate(e.target.value)} />
        </div>
        <div className="field">
          <label>Tenure (years)</label>
          <input type="number" className="input" value={years} onChange={(e) => setYears(e.target.value)} />
        </div>
      </div>

      {ready && (
        <div className="stats">
          <div className="stat"><div className="n">{money(emi)}</div><div className="l">Monthly EMI</div></div>
          <div className="stat"><div className="n">{money(interest)}</div><div className="l">Total interest</div></div>
          <div className="stat"><div className="n">{money(total)}</div><div className="l">Total payment</div></div>
        </div>
      )}

      <p className="privacy-note">🔒 Calculated instantly in your browser.</p>
    </div>
  );
}
