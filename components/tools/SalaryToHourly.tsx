"use client";

import { useState } from "react";

const money = (n: number) => Number.isFinite(n) ? n.toLocaleString(undefined, { maximumFractionDigits: 2 }) : "—";

export default function SalaryToHourly() {
  const [mode, setMode] = useState<"salary" | "hourly">("salary");
  const [amount, setAmount] = useState("");
  const [hoursPerWeek, setHoursPerWeek] = useState("40");
  const [weeksPerYear, setWeeksPerYear] = useState("52");

  const v = parseFloat(amount);
  const hpw = parseFloat(hoursPerWeek);
  const wpy = parseFloat(weeksPerYear);
  const ready = v > 0 && hpw > 0 && wpy > 0;
  const annualHours = hpw * wpy;

  const annual = ready ? (mode === "salary" ? v : v * annualHours) : 0;
  const hourly = ready ? (mode === "salary" ? v / annualHours : v) : 0;

  return (
    <div>
      <div className="field">
        <label>I'll enter</label>
        <div className="row">
          <button type="button" className={`btn ${mode === "salary" ? "" : "secondary"}`} onClick={() => setMode("salary")}>Annual salary</button>
          <button type="button" className={`btn ${mode === "hourly" ? "" : "secondary"}`} onClick={() => setMode("hourly")}>Hourly rate</button>
        </div>
      </div>
      <div className="row">
        <div className="field"><label>{mode === "salary" ? "Annual salary" : "Hourly rate"}</label><input className="input" type="number" value={amount} onChange={(e) => setAmount(e.target.value)} /></div>
        <div className="field"><label>Hours / week</label><input className="input" type="number" value={hoursPerWeek} onChange={(e) => setHoursPerWeek(e.target.value)} /></div>
        <div className="field"><label>Weeks / year</label><input className="input" type="number" value={weeksPerYear} onChange={(e) => setWeeksPerYear(e.target.value)} /></div>
      </div>

      {ready && (
        <div className="stats">
          <div className="stat"><div className="n">{money(hourly)}</div><div className="l">Hourly</div></div>
          <div className="stat"><div className="n">{money(hourly * hpw)}</div><div className="l">Weekly</div></div>
          <div className="stat"><div className="n">{money(annual / 12)}</div><div className="l">Monthly</div></div>
          <div className="stat"><div className="n">{money(annual)}</div><div className="l">Annual</div></div>
        </div>
      )}
      <p className="privacy-note">🔒 Calculated instantly. Figures are gross, before tax.</p>
    </div>
  );
}
