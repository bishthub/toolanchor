"use client";

import { useState, useMemo } from "react";

export default function FuelCostCalculator() {
  const [unit, setUnit] = useState<"metric" | "imperial">("metric");
  const [dist, setDist] = useState("");
  const [consumption, setConsumption] = useState("");
  const [price, setPrice] = useState("");

  const result = useMemo(() => {
    const d = parseFloat(dist);
    const c = parseFloat(consumption);
    const p = parseFloat(price);
    if (!d || !c || !p) return null;
    let fuelNeeded: number, totalCost: number;
    if (unit === "metric") {
      fuelNeeded = (d / 100) * c; // litres
      totalCost = fuelNeeded * p;
    } else {
      fuelNeeded = d / c; // gallons
      totalCost = fuelNeeded * p;
    }
    return {
      fuelNeeded: Math.round(fuelNeeded * 100) / 100,
      totalCost: Math.round(totalCost * 100) / 100,
      unit: unit === "metric" ? "L" : "gal",
      currency: "$",
    };
  }, [unit, dist, consumption, price]);

  return (
    <div>
      <div className="field" style={{ maxWidth: 200 }}>
        <label>Units</label>
        <select className="input" value={unit} onChange={(e) => setUnit(e.target.value as typeof unit)}>
          <option value="metric">Metric (km, L/100km)</option>
          <option value="imperial">Imperial (miles, MPG)</option>
        </select>
      </div>
      <div className="row">
        <div className="field"><label>Distance ({unit === "metric" ? "km" : "miles"})</label><input className="input" type="number" value={dist} onChange={(e) => setDist(e.target.value)} placeholder="e.g. 500" /></div>
        <div className="field"><label>Fuel economy ({unit === "metric" ? "L/100km" : "MPG"})</label><input className="input" type="number" value={consumption} onChange={(e) => setConsumption(e.target.value)} placeholder={unit === "metric" ? "e.g. 8" : "e.g. 30"} /></div>
        <div className="field"><label>Price per {unit === "metric" ? "litre" : "gallon"} ($)</label><input className="input" type="number" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="e.g. 1.50" /></div>
      </div>
      {result && (
        <div className="stats">
          <div className="stat"><div className="n">{result.fuelNeeded} {result.unit}</div><div className="l">Fuel needed</div></div>
          <div className="stat"><div className="n">{result.currency}{result.totalCost.toFixed(2)}</div><div className="l">Total cost</div></div>
        </div>
      )}
      <p className="privacy-note">🔒 All calculations run in your browser. Enter the current fuel price for the most accurate estimate.</p>
    </div>
  );
}
