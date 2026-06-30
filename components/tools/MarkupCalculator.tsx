"use client";

import { useState } from "react";

const money = (n: number) => Number.isFinite(n) ? n.toLocaleString(undefined, { maximumFractionDigits: 2 }) : "—";
const pct = (n: number) => Number.isFinite(n) ? n.toFixed(1) + "%" : "—";

export default function MarkupCalculator() {
  const [cost, setCost] = useState("");
  const [price, setPrice] = useState("");

  const c = parseFloat(cost), p = parseFloat(price);
  const ready = c > 0 && p > 0;
  const profit = ready ? p - c : 0;
  const markup = ready ? (profit / c) * 100 : 0;
  const margin = ready ? (profit / p) * 100 : 0;

  return (
    <div>
      <div className="row">
        <div className="field"><label>Cost</label><input className="input" type="number" value={cost} onChange={(e) => setCost(e.target.value)} /></div>
        <div className="field"><label>Selling price</label><input className="input" type="number" value={price} onChange={(e) => setPrice(e.target.value)} /></div>
      </div>
      {ready && (
        <div className="stats">
          <div className="stat"><div className="n">{money(profit)}</div><div className="l">Profit</div></div>
          <div className="stat"><div className="n">{pct(markup)}</div><div className="l">Markup</div></div>
          <div className="stat"><div className="n">{pct(margin)}</div><div className="l">Margin</div></div>
        </div>
      )}
      <p className="privacy-note">🔒 Calculated instantly. Markup is profit ÷ cost; margin is profit ÷ price.</p>
    </div>
  );
}
