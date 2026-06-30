"use client";

import { useState } from "react";

const money = (n: number) =>
  Number.isFinite(n) ? n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "—";

export default function DiscountCalculator() {
  const [price, setPrice] = useState("");
  const [discount, setDiscount] = useState("");

  const p = parseFloat(price);
  const d = parseFloat(discount);
  const ready = p > 0 && d >= 0;
  const saved = ready ? (p * d) / 100 : 0;
  const final = ready ? p - saved : 0;

  return (
    <div>
      <div className="row">
        <div className="field">
          <label>Original price</label>
          <input type="number" className="input" value={price} onChange={(e) => setPrice(e.target.value)} />
        </div>
        <div className="field">
          <label>Discount (%)</label>
          <input type="number" className="input" value={discount} onChange={(e) => setDiscount(e.target.value)} />
        </div>
      </div>

      {ready && (
        <div className="stats">
          <div className="stat"><div className="n">{money(final)}</div><div className="l">Final price</div></div>
          <div className="stat"><div className="n">{money(saved)}</div><div className="l">You save</div></div>
        </div>
      )}

      <p className="privacy-note">🔒 Calculated instantly in your browser.</p>
    </div>
  );
}
