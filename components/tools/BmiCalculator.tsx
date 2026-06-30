"use client";

import { useState } from "react";

type Units = "metric" | "imperial";

function category(bmi: number): string {
  if (bmi < 18.5) return "Underweight";
  if (bmi < 25) return "Normal weight";
  if (bmi < 30) return "Overweight";
  return "Obese";
}

export default function BmiCalculator() {
  const [units, setUnits] = useState<Units>("metric");
  const [height, setHeight] = useState(""); // cm or in
  const [weight, setWeight] = useState(""); // kg or lb

  const h = parseFloat(height);
  const w = parseFloat(weight);
  let bmi: number | null = null;
  if (h > 0 && w > 0) {
    bmi = units === "metric" ? w / Math.pow(h / 100, 2) : (703 * w) / (h * h);
  }

  return (
    <div>
      <div className="field">
        <label>Units</label>
        <div className="row">
          <button type="button" className={`btn ${units === "metric" ? "" : "secondary"}`} onClick={() => setUnits("metric")}>Metric (cm / kg)</button>
          <button type="button" className={`btn ${units === "imperial" ? "" : "secondary"}`} onClick={() => setUnits("imperial")}>Imperial (in / lb)</button>
        </div>
      </div>

      <div className="row">
        <div className="field">
          <label>Height ({units === "metric" ? "cm" : "inches"})</label>
          <input type="number" className="input" value={height} onChange={(e) => setHeight(e.target.value)} />
        </div>
        <div className="field">
          <label>Weight ({units === "metric" ? "kg" : "lb"})</label>
          <input type="number" className="input" value={weight} onChange={(e) => setWeight(e.target.value)} />
        </div>
      </div>

      {bmi !== null && Number.isFinite(bmi) && (
        <div className="stats">
          <div className="stat"><div className="n">{bmi.toFixed(1)}</div><div className="l">Your BMI</div></div>
          <div className="stat"><div className="n" style={{ fontSize: "1.1rem" }}>{category(bmi)}</div><div className="l">Category</div></div>
        </div>
      )}

      <p className="privacy-note">🔒 Calculated instantly in your browser.</p>
    </div>
  );
}
