"use client";

import { useState, useMemo } from "react";

function fmt(n: number): string {
  if (Math.abs(n) >= 1_000_000_000) return (n / 1_000_000_000).toFixed(2) + "B";
  if (Math.abs(n) >= 1_000_000) return (n / 1_000_000).toFixed(2) + "M";
  if (Math.abs(n) >= 1_000) return n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 6 });
}

export default function CryptoProfitCalculator() {
  const [buyPrice, setBuyPrice] = useState("");
  const [sellPrice, setSellPrice] = useState("");
  const [quantity, setQuantity] = useState("");

  const result = useMemo(() => {
    const buy = parseFloat(buyPrice);
    const sell = parseFloat(sellPrice);
    const qty = parseFloat(quantity);
    if (!buy || !sell || !qty || buy <= 0 || sell <= 0 || qty <= 0) return null;

    const totalCost = buy * qty;
    const totalReturn = sell * qty;
    const profit = totalReturn - totalCost;
    const roi = (profit / totalCost) * 100;

    return {
      totalCost,
      totalReturn,
      profit,
      roi,
      isProfit: profit >= 0,
    };
  }, [buyPrice, sellPrice, quantity]);

  return (
    <div>
      <div className="row">
        <div className="field">
          <label>Buy price per coin (USD)</label>
          <input
            className="input"
            type="number"
            min={0}
            step="any"
            placeholder="e.g. 45000"
            value={buyPrice}
            onChange={(e) => setBuyPrice(e.target.value)}
          />
        </div>
        <div className="field">
          <label>Sell price per coin (USD)</label>
          <input
            className="input"
            type="number"
            min={0}
            step="any"
            placeholder="e.g. 52000"
            value={sellPrice}
            onChange={(e) => setSellPrice(e.target.value)}
          />
        </div>
        <div className="field">
          <label>Quantity (coins)</label>
          <input
            className="input"
            type="number"
            min={0}
            step="any"
            placeholder="e.g. 0.5"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
          />
        </div>
      </div>

      {result && (
        <div className="stats" style={{ marginTop: 24 }}>
          <div className="stat">
            <div className="n">{fmt(result.totalCost)}</div>
            <div className="l">Total cost (USD)</div>
          </div>
          <div className="stat">
            <div className="n">{fmt(result.totalReturn)}</div>
            <div className="l">Total returned (USD)</div>
          </div>
          <div className="stat">
            <div className="n" style={{ color: result.isProfit ? "var(--ok)" : "var(--danger)" }}>
              {result.isProfit ? "+" : ""}{fmt(result.profit)}
            </div>
            <div className="l">Profit / Loss (USD)</div>
          </div>
          <div className="stat">
            <div className="n" style={{ color: result.isProfit ? "var(--ok)" : "var(--danger)" }}>
              {result.roi >= 0 ? "+" : ""}{result.roi.toFixed(2)}%
            </div>
            <div className="l">ROI</div>
          </div>
        </div>
      )}

      <p className="privacy-note">🔒 All calculations run in your browser. Does not include exchange fees or taxes. For estimates only — not financial advice.</p>
    </div>
  );
}
