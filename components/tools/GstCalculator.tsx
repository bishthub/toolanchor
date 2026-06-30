"use client";

import { useState } from "react";

const money = (n: number) =>
  Number.isFinite(n) ? n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "—";

export default function GstCalculator() {
  const [amount, setAmount] = useState("");
  const [rate, setRate] = useState("18");
  const [mode, setMode] = useState<"add" | "remove">("add");

  const a = parseFloat(amount);
  const r = parseFloat(rate) / 100;
  const ready = a > 0 && r >= 0;

  let net = 0, tax = 0, gross = 0;
  if (ready) {
    if (mode === "add") { net = a; tax = a * r; gross = a + tax; }
    else { gross = a; net = a / (1 + r); tax = gross - net; }
  }

  return (
    <div>
      <div className="row">
        <div className="field">
          <label>{mode === "add" ? "Net amount" : "Gross amount (incl. tax)"}</label>
          <input type="number" className="input" value={amount} onChange={(e) => setAmount(e.target.value)} />
        </div>
        <div className="field" style={{ maxWidth: 140 }}>
          <label>Tax rate (%)</label>
          <input type="number" className="input" value={rate} onChange={(e) => setRate(e.target.value)} />
        </div>
      </div>
      <div className="field">
        <label>Mode</label>
        <div className="row">
          <button type="button" className={`btn ${mode === "add" ? "" : "secondary"}`} onClick={() => setMode("add")}>Add tax</button>
          <button type="button" className={`btn ${mode === "remove" ? "" : "secondary"}`} onClick={() => setMode("remove")}>Remove tax</button>
        </div>
      </div>

      {ready && (
        <div className="stats">
          <div className="stat"><div className="n">{money(net)}</div><div className="l">Net</div></div>
          <div className="stat"><div className="n">{money(tax)}</div><div className="l">Tax</div></div>
          <div className="stat"><div className="n">{money(gross)}</div><div className="l">Gross</div></div>
        </div>
      )}
      <p className="privacy-note">🔒 Calculated instantly in your browser.</p>
    </div>
  );
}
