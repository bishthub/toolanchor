"use client";

import { useState, useMemo } from "react";

function fmt(n: number): string {
  return n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function MortgageCalculator() {
  const [amount, setAmount] = useState("300000");
  const [rate, setRate] = useState("6.5");
  const [term, setTerm] = useState("30");
  const [down, setDown] = useState("60000");

  const result = useMemo(() => {
    const p = parseFloat(amount) || 0;
    const r = (parseFloat(rate) || 0) / 100 / 12;
    const n = (parseFloat(term) || 1) * 12;
    const d = parseFloat(down) || 0;
    const loan = Math.max(0, p - d);

    if (loan <= 0 || r <= 0 || n <= 0) return null;

    const monthly = (loan * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
    const totalPaid = monthly * n;
    const totalInterest = totalPaid - loan;

    // Generate amortisation schedule (first 12 months + summary)
    const schedule: { month: number; payment: number; principal: number; interest: number; balance: number }[] = [];
    let bal = loan;
    for (let i = 1; i <= Math.min(n, 360); i++) {
      const interestPortion = bal * r;
      const principalPortion = monthly - interestPortion;
      bal = Math.max(0, bal - principalPortion);
      schedule.push({ month: i, payment: monthly, principal: principalPortion, interest: interestPortion, balance: bal });
      if (bal <= 0) break;
    }

    return { monthly, totalPaid, totalInterest, loan, schedule };
  }, [amount, rate, term, down]);

  return (
    <div>
      <div className="row">
        <div className="field">
          <label>Property price ($)</label>
          <input className="input" type="number" min={0} value={amount} onChange={(e) => setAmount(e.target.value)} />
        </div>
        <div className="field">
          <label>Down payment ($)</label>
          <input className="input" type="number" min={0} value={down} onChange={(e) => setDown(e.target.value)} />
        </div>
        <div className="field">
          <label>Annual interest rate (%)</label>
          <input className="input" type="number" min={0} step="0.01" value={rate} onChange={(e) => setRate(e.target.value)} />
        </div>
        <div className="field">
          <label>Term (years)</label>
          <input className="input" type="number" min={1} max={50} value={term} onChange={(e) => setTerm(e.target.value)} />
        </div>
      </div>

      {result && (
        <>
          <div className="stats" style={{ marginTop: 20 }}>
            <div className="stat"><div className="n">${fmt(result.monthly)}</div><div className="l">Monthly payment</div></div>
            <div className="stat"><div className="n">${fmt(result.loan)}</div><div className="l">Loan amount</div></div>
            <div className="stat"><div className="n">${fmt(result.totalInterest)}</div><div className="l">Total interest</div></div>
            <div className="stat"><div className="n">${fmt(result.totalPaid)}</div><div className="l">Total paid</div></div>
          </div>

          <div className="field" style={{ marginTop: 20 }}>
            <label>Amortisation schedule (first 12 months)</label>
            <div style={{ overflowX: "auto", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: ".82rem", fontVariantNumeric: "tabular-nums" }}>
                <thead>
                  <tr style={{ background: "var(--surface-2)", borderBottom: "1px solid var(--border)" }}>
                    <th style={{ padding: "8px 12px", textAlign: "left" }}>Month</th>
                    <th style={{ padding: "8px 12px", textAlign: "right" }}>Payment</th>
                    <th style={{ padding: "8px 12px", textAlign: "right" }}>Principal</th>
                    <th style={{ padding: "8px 12px", textAlign: "right" }}>Interest</th>
                    <th style={{ padding: "8px 12px", textAlign: "right" }}>Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {result.schedule.slice(0, 12).map((row) => (
                    <tr key={row.month} style={{ borderBottom: "1px solid var(--border)" }}>
                      <td style={{ padding: "8px 12px", fontWeight: 550 }}>{row.month}</td>
                      <td style={{ padding: "8px 12px", textAlign: "right" }}>${fmt(row.payment)}</td>
                      <td style={{ padding: "8px 12px", textAlign: "right", color: "var(--ok)" }}>${fmt(row.principal)}</td>
                      <td style={{ padding: "8px 12px", textAlign: "right", color: "var(--muted)" }}>${fmt(row.interest)}</td>
                      <td style={{ padding: "8px 12px", textAlign: "right" }}>${fmt(row.balance)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      <p className="privacy-note">🔒 All calculations run in your browser. Principal and interest only — does not include taxes, insurance or HOA fees.</p>
    </div>
  );
}
