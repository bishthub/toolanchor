"use client";

import { useState } from "react";

const ACTIVITY: [string, number][] = [
  ["Sedentary (little exercise)", 1.2],
  ["Light (1–3 days/week)", 1.375],
  ["Moderate (3–5 days/week)", 1.55],
  ["Active (6–7 days/week)", 1.725],
  ["Very active (hard daily)", 1.9],
];

export default function CalorieCalculator() {
  const [sex, setSex] = useState<"male" | "female">("male");
  const [age, setAge] = useState("");
  const [height, setHeight] = useState(""); // cm
  const [weight, setWeight] = useState(""); // kg
  const [activity, setActivity] = useState(1.55);

  const a = parseFloat(age), hh = parseFloat(height), w = parseFloat(weight);
  const ready = a > 0 && hh > 0 && w > 0;
  // Mifflin-St Jeor
  const bmr = ready ? 10 * w + 6.25 * hh - 5 * a + (sex === "male" ? 5 : -161) : 0;
  const tdee = bmr * activity;

  return (
    <div>
      <div className="field">
        <label>Sex</label>
        <div className="row">
          <button type="button" className={`btn ${sex === "male" ? "" : "secondary"}`} onClick={() => setSex("male")}>Male</button>
          <button type="button" className={`btn ${sex === "female" ? "" : "secondary"}`} onClick={() => setSex("female")}>Female</button>
        </div>
      </div>
      <div className="row">
        <div className="field"><label>Age</label><input className="input" type="number" value={age} onChange={(e) => setAge(e.target.value)} /></div>
        <div className="field"><label>Height (cm)</label><input className="input" type="number" value={height} onChange={(e) => setHeight(e.target.value)} /></div>
        <div className="field"><label>Weight (kg)</label><input className="input" type="number" value={weight} onChange={(e) => setWeight(e.target.value)} /></div>
      </div>
      <div className="field">
        <label>Activity level</label>
        <select className="input" value={activity} onChange={(e) => setActivity(Number(e.target.value))}>
          {ACTIVITY.map(([l, v]) => <option key={v} value={v}>{l}</option>)}
        </select>
      </div>

      {ready && (
        <div className="stats">
          <div className="stat"><div className="n">{Math.round(bmr)}</div><div className="l">BMR (kcal/day)</div></div>
          <div className="stat"><div className="n">{Math.round(tdee)}</div><div className="l">Maintenance (TDEE)</div></div>
          <div className="stat"><div className="n">{Math.round(tdee - 500)}</div><div className="l">Mild weight loss</div></div>
          <div className="stat"><div className="n">{Math.round(tdee + 500)}</div><div className="l">Weight gain</div></div>
        </div>
      )}
      <p className="privacy-note">🔒 Calculated locally with the Mifflin-St Jeor formula. Estimate only, not medical advice.</p>
    </div>
  );
}
