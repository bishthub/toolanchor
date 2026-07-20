"use client";

import { useState, useMemo } from "react";

type Unit = "metric" | "imperial";

// IOM 2009 guidelines (single pregnancy): total gain range (kg) + post-first-trimester weekly rate (kg/week).
const GUIDE = {
  underweight: { label: "Underweight", total: [12.5, 18], rate: [0.44, 0.58] },
  normal: { label: "Normal weight", total: [11.5, 16], rate: [0.35, 0.5] },
  overweight: { label: "Overweight", total: [7, 11.5], rate: [0.23, 0.33] },
  obese: { label: "Obese", total: [5, 9], rate: [0.17, 0.27] },
} as const;
const FIRST_TRI = [0.5, 2]; // kg gained across weeks 1–13

export default function PregnancyWeightGainCalculator() {
  const [unit, setUnit] = useState<Unit>("metric");
  const [preW, setPreW] = useState("");
  const [heightCm, setHeightCm] = useState("");
  const [ft, setFt] = useState("");
  const [inch, setInch] = useState("");
  const [week, setWeek] = useState("20");
  const [curW, setCurW] = useState("");

  const model = useMemo(() => {
    const lbToKg = (v: number) => v * 0.453592;
    const kgToDisp = (v: number) => (unit === "metric" ? v : v * 2.20462);
    const uw = unit === "metric" ? "kg" : "lb";

    const preRaw = parseFloat(preW);
    if (!preRaw || preRaw <= 0) return null;
    const preKg = unit === "metric" ? preRaw : lbToKg(preRaw);

    let hCm = 0;
    if (unit === "metric") hCm = parseFloat(heightCm) || 0;
    else hCm = ((parseFloat(ft) || 0) * 12 + (parseFloat(inch) || 0)) * 2.54;
    if (hCm <= 0) return null;

    const bmi = preKg / Math.pow(hCm / 100, 2);
    const cat = bmi < 18.5 ? "underweight" : bmi < 25 ? "normal" : bmi < 30 ? "overweight" : "obese";
    const g = GUIDE[cat];
    const wk = Math.min(42, Math.max(1, parseInt(week, 10) || 20));

    // Recommended gain so far (kg) at current week
    const past13 = Math.max(0, wk - 13);
    const recLo = FIRST_TRI[0] + g.rate[0] * past13;
    const recHi = FIRST_TRI[1] + g.rate[1] * past13;

    // Actual gain if current weight given
    const curRaw = parseFloat(curW);
    let actual: number | null = null;
    let status: "under" | "on" | "over" | null = null;
    if (curRaw && curRaw > 0) {
      const curKg = unit === "metric" ? curRaw : lbToKg(curRaw);
      actual = curKg - preKg;
      status = actual < recLo ? "under" : actual > recHi ? "over" : "on";
    }

    return {
      bmi, cat, catLabel: g.label, uw,
      total: [kgToDisp(g.total[0]), kgToDisp(g.total[1])],
      recNow: [kgToDisp(recLo), kgToDisp(recHi)],
      actual: actual === null ? null : kgToDisp(actual),
      status, wk,
    };
  }, [unit, preW, heightCm, ft, inch, week, curW]);

  const fmt = (v: number) => (Math.round(v * 10) / 10).toString();

  return (
    <div>
      <div className="seg-toggle">
        <button className={unit === "metric" ? "on" : ""} onClick={() => setUnit("metric")}>Metric (kg / cm)</button>
        <button className={unit === "imperial" ? "on" : ""} onClick={() => setUnit("imperial")}>Imperial (lb / ft)</button>
      </div>
      <div className="row">
        <div className="field" style={{ maxWidth: 170 }}>
          <label>Pre-pregnancy weight ({unit === "metric" ? "kg" : "lb"})</label>
          <input className="input" type="number" min={0} value={preW} onChange={(e) => setPreW(e.target.value)} />
        </div>
        {unit === "metric" ? (
          <div className="field" style={{ maxWidth: 150 }}>
            <label>Height (cm)</label>
            <input className="input" type="number" min={0} value={heightCm} onChange={(e) => setHeightCm(e.target.value)} />
          </div>
        ) : (
          <>
            <div className="field" style={{ maxWidth: 100 }}>
              <label>Height (ft)</label>
              <input className="input" type="number" min={0} value={ft} onChange={(e) => setFt(e.target.value)} />
            </div>
            <div className="field" style={{ maxWidth: 100 }}>
              <label>(in)</label>
              <input className="input" type="number" min={0} max={11} value={inch} onChange={(e) => setInch(e.target.value)} />
            </div>
          </>
        )}
        <div className="field" style={{ maxWidth: 130 }}>
          <label>Weeks pregnant</label>
          <input className="input" type="number" min={1} max={42} value={week} onChange={(e) => setWeek(e.target.value)} />
        </div>
        <div className="field" style={{ maxWidth: 170 }}>
          <label>Current weight ({unit === "metric" ? "kg" : "lb"}, optional)</label>
          <input className="input" type="number" min={0} value={curW} onChange={(e) => setCurW(e.target.value)} />
        </div>
      </div>

      {!model && <p className="empty">Enter your pre-pregnancy weight and height to see your recommended weight-gain range.</p>}

      {model && (
        <>
          <div className="cat">
            Pre-pregnancy BMI <strong>{fmt(model.bmi)}</strong> — <span className={`pill pill--${model.cat}`}>{model.catLabel}</span>
          </div>

          {/* Range band for this week */}
          <div className="band-wrap">
            <div className="band-title">Recommended gain by week {model.wk}</div>
            <div className="band-val">{fmt(model.recNow[0])}–{fmt(model.recNow[1])} {model.uw}</div>
            {model.actual !== null && model.status && (
              <div className={`band-status band-status--${model.status}`}>
                You've gained {fmt(model.actual)} {model.uw} —{" "}
                {model.status === "on" ? "on track" : model.status === "under" ? "below the range" : "above the range"}
              </div>
            )}
          </div>

          <div className="stats">
            <div className="stat"><div className="n" style={{ fontSize: "1.05rem" }}>{fmt(model.total[0])}–{fmt(model.total[1])}</div><div className="l">Total gain goal ({model.uw})</div></div>
            <div className="stat"><div className="n" style={{ fontSize: "1.05rem" }}>{fmt(model.recNow[0])}–{fmt(model.recNow[1])}</div><div className="l">Target by week {model.wk} ({model.uw})</div></div>
            <div className="stat"><div className="n">{fmt(model.bmi)}</div><div className="l">Pre-pregnancy BMI</div></div>
            {model.actual !== null
              ? <div className="stat"><div className="n" style={{ fontSize: "1.05rem" }}>{fmt(model.actual)} {model.uw}</div><div className="l">Gained so far</div></div>
              : <div className="stat"><div className="n" style={{ fontSize: "1rem" }}>{model.catLabel}</div><div className="l">BMI category</div></div>}
          </div>
        </>
      )}

      <p className="privacy-note">🔒 All calculations run in your browser. Based on IOM guidelines for a single pregnancy — not a substitute for medical advice.</p>

      <style jsx>{`
        .empty { margin-top: 4px; color: var(--muted); font-size: 0.9rem; line-height: 1.55; }
        .seg-toggle { display: inline-flex; gap: 4px; padding: 4px; background: var(--surface-2); border-radius: 10px; margin-bottom: 18px; }
        .seg-toggle button {
          border: none; background: transparent; color: var(--muted); cursor: pointer;
          font-size: 0.82rem; font-weight: 500; padding: 7px 14px; border-radius: 7px; transition: all 0.15s;
        }
        .seg-toggle button.on { background: var(--surface); color: var(--text); box-shadow: var(--shadow-sm); }
        .cat { margin-top: 20px; color: var(--muted); font-size: 0.95rem; }
        .cat strong { color: var(--text); font-variant-numeric: tabular-nums; }
        .pill { display: inline-block; padding: 3px 10px; border-radius: 999px; font-size: 0.8rem; font-weight: 600; }
        .pill--underweight { background: color-mix(in srgb, var(--cat-calculator) 16%, transparent); color: color-mix(in srgb, var(--cat-calculator) 82%, var(--text)); }
        .pill--normal { background: color-mix(in srgb, var(--ok) 16%, transparent); color: color-mix(in srgb, var(--ok) 78%, var(--text)); }
        .pill--overweight { background: color-mix(in srgb, var(--cat-text) 18%, transparent); color: color-mix(in srgb, var(--cat-text) 82%, var(--text)); }
        .pill--obese { background: color-mix(in srgb, var(--danger) 15%, transparent); color: color-mix(in srgb, var(--danger) 82%, var(--text)); }
        .band-wrap {
          margin-top: 18px; padding: 20px; border: 1px solid var(--border);
          border-radius: var(--radius); background: var(--bg-2);
        }
        .band-title { font-family: var(--font-mono), monospace; font-size: 0.62rem; color: var(--muted); text-transform: uppercase; letter-spacing: 0.07em; }
        .band-val { font-family: var(--font-display), sans-serif; font-weight: 700; font-size: 1.9rem; letter-spacing: -0.02em; color: var(--accent); margin-top: 6px; }
        .band-status { margin-top: 10px; font-size: 0.9rem; font-weight: 500; }
        .band-status--on { color: var(--ok); }
        .band-status--under { color: var(--cat-calculator); }
        .band-status--over { color: var(--danger); }
      `}</style>
    </div>
  );
}
