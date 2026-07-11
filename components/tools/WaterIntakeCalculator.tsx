"use client";

import { useEffect, useState } from "react";
import { readShared } from "@/lib/share";
import ShareResult from "@/components/ShareResult";

const ACTIVITY_ADD: Record<string, number> = { sedentary: 0, light: 0.35, moderate: 0.7, intense: 1.0 };
const CLIMATE_ADD: Record<string, number> = { temperate: 0, hot: 0.5 };

export default function WaterIntakeCalculator() {
  const [weight, setWeight] = useState("");
  const [unit, setUnit] = useState<"kg" | "lb">("kg");
  const [activity, setActivity] = useState("sedentary");
  const [climate, setClimate] = useState("temperate");

  useEffect(() => {
    const s = readShared(["w", "u", "act", "cli"]);
    if (s.w) setWeight(s.w);
    if (s.u === "kg" || s.u === "lb") setUnit(s.u);
    if (s.act && s.act in ACTIVITY_ADD) setActivity(s.act);
    if (s.cli && s.cli in CLIMATE_ADD) setClimate(s.cli);
  }, []);

  const w = parseFloat(weight);
  const ready = w > 0;

  let liters = 0, flOz = 0, glasses = 0;
  if (ready) {
    const kg = unit === "lb" ? w * 0.453592 : w;
    liters = kg * 0.035 + (ACTIVITY_ADD[activity] ?? 0) + (CLIMATE_ADD[climate] ?? 0);
    flOz = liters * 33.814;
    glasses = Math.round((liters * 1000) / 250);
  }

  return (
    <div>
      <div className="row">
        <div className="field" style={{ maxWidth: 160 }}>
          <label>Body weight ({unit})</label>
          <input type="number" className="input" min={0} value={weight} onChange={(e) => setWeight(e.target.value)} />
        </div>
        <div className="field">
          <label>Unit</label>
          <div className="row">
            <button type="button" className={`btn ${unit === "kg" ? "" : "secondary"}`} onClick={() => setUnit("kg")}>kg</button>
            <button type="button" className={`btn ${unit === "lb" ? "" : "secondary"}`} onClick={() => setUnit("lb")}>lb</button>
          </div>
        </div>
      </div>
      <div className="row">
        <div className="field" style={{ maxWidth: 220 }}>
          <label>Activity level</label>
          <select className="input" value={activity} onChange={(e) => setActivity(e.target.value)}>
            <option value="sedentary">Sedentary (little exercise)</option>
            <option value="light">Light (1–3 workouts/week)</option>
            <option value="moderate">Moderate (3–5 workouts/week)</option>
            <option value="intense">Intense (daily hard exercise)</option>
          </select>
        </div>
        <div className="field" style={{ maxWidth: 220 }}>
          <label>Climate</label>
          <select className="input" value={climate} onChange={(e) => setClimate(e.target.value)}>
            <option value="temperate">Temperate</option>
            <option value="hot">Hot / humid</option>
          </select>
        </div>
      </div>

      {ready && (
        <div className="stats">
          <div className="stat"><div className="n">{liters.toFixed(2)} L</div><div className="l">Per day</div></div>
          <div className="stat"><div className="n">{flOz.toFixed(0)} fl oz</div><div className="l">US fluid ounces</div></div>
          <div className="stat"><div className="n">{glasses}</div><div className="l">Glasses (250 ml)</div></div>
        </div>
      )}
      {ready && (
        <p className="privacy-note">
          Assumes a baseline of 35 ml per kg of body weight, plus extra for activity level and hot climates.
        </p>
      )}
      {ready && <ShareResult values={{ w: weight, u: unit, act: activity, cli: climate }} />}
      <p className="privacy-note">🔒 Calculated instantly in your browser. A general guideline only — not medical advice.</p>
    </div>
  );
}
