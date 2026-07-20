"use client";

import { useState, useMemo } from "react";

type Unit = "metric" | "imperial";
type Sex = "female" | "male";

export default function IdealWeightCalculator() {
  const [unit, setUnit] = useState<Unit>("metric");
  const [sex, setSex] = useState<Sex>("female");
  const [heightCm, setHeightCm] = useState("");
  const [ft, setFt] = useState("");
  const [inch, setInch] = useState("");

  const model = useMemo(() => {
    let hCm = 0;
    if (unit === "metric") hCm = parseFloat(heightCm) || 0;
    else hCm = ((parseFloat(ft) || 0) * 12 + (parseFloat(inch) || 0)) * 2.54;
    if (hCm < 120 || hCm > 230) return null;

    const inches = hCm / 2.54;
    const over60 = Math.max(0, inches - 60); // inches over 5 ft
    const male = sex === "male";

    // Classic ideal-body-weight formulas (kg)
    const devine = (male ? 50 : 45.5) + 2.3 * over60;
    const robinson = (male ? 52 : 49) + (male ? 1.9 : 1.7) * over60;
    const miller = (male ? 56.2 : 53.1) + (male ? 1.41 : 1.36) * over60;
    const hamwi = (male ? 48 : 45.5) + (male ? 2.7 : 2.2) * over60;

    const m2 = Math.pow(hCm / 100, 2);
    const bmiLo = 18.5 * m2;
    const bmiHi = 24.9 * m2;

    const toDisp = (v: number) => (unit === "metric" ? v : v * 2.20462);
    const uw = unit === "metric" ? "kg" : "lb";

    const formulas = [
      { name: "Devine", kg: devine },
      { name: "Robinson", kg: robinson },
      { name: "Miller", kg: miller },
      { name: "Hamwi", kg: hamwi },
    ];
    return {
      uw,
      formulas: formulas.map((f) => ({ ...f, disp: toDisp(f.kg) })),
      healthy: [toDisp(bmiLo), toDisp(bmiHi)],
      healthyKg: [bmiLo, bmiHi],
    };
  }, [unit, sex, heightCm, ft, inch]);

  const fmt = (v: number) => Math.round(v).toString();

  // Range bar geometry (in display units)
  const bar = useMemo(() => {
    if (!model) return null;
    const min = Math.min(model.healthy[0], ...model.formulas.map((f) => f.disp)) - 4;
    const max = Math.max(model.healthy[1], ...model.formulas.map((f) => f.disp)) + 4;
    const span = max - min || 1;
    const pct = (v: number) => ((v - min) / span) * 100;
    return { min, max, pct };
  }, [model]);

  return (
    <div>
      <div className="seg-toggle">
        <button className={unit === "metric" ? "on" : ""} onClick={() => setUnit("metric")}>Metric (cm)</button>
        <button className={unit === "imperial" ? "on" : ""} onClick={() => setUnit("imperial")}>Imperial (ft)</button>
      </div>
      <div className="row">
        <div className="field" style={{ maxWidth: 160 }}>
          <label>Sex</label>
          <select className="input" value={sex} onChange={(e) => setSex(e.target.value as Sex)}>
            <option value="female">Female</option>
            <option value="male">Male</option>
          </select>
        </div>
        {unit === "metric" ? (
          <div className="field" style={{ maxWidth: 150 }}>
            <label>Height (cm)</label>
            <input className="input" type="number" min={120} max={230} value={heightCm} onChange={(e) => setHeightCm(e.target.value)} />
          </div>
        ) : (
          <>
            <div className="field" style={{ maxWidth: 100 }}>
              <label>Height (ft)</label>
              <input className="input" type="number" min={3} max={7} value={ft} onChange={(e) => setFt(e.target.value)} />
            </div>
            <div className="field" style={{ maxWidth: 100 }}>
              <label>(in)</label>
              <input className="input" type="number" min={0} max={11} value={inch} onChange={(e) => setInch(e.target.value)} />
            </div>
          </>
        )}
      </div>

      {!model && <p className="empty">Enter your height to see your ideal weight range from four established formulas.</p>}

      {model && bar && (
        <>
          <div className="hero">
            <div className="hero-lbl">Healthy weight range (BMI 18.5–24.9)</div>
            <div className="hero-val">{fmt(model.healthy[0])}–{fmt(model.healthy[1])} {model.uw}</div>
          </div>

          {/* Range bar */}
          <div className="bar">
            <div className="bar-track">
              <div className="bar-healthy" style={{ left: `${bar.pct(model.healthy[0])}%`, right: `${100 - bar.pct(model.healthy[1])}%` }} />
              {model.formulas.map((f) => (
                <div key={f.name} className="bar-dot" style={{ left: `${bar.pct(f.disp)}%` }} title={`${f.name}: ${fmt(f.disp)} ${model.uw}`} />
              ))}
            </div>
            <div className="bar-axis"><span>{fmt(bar.min)} {model.uw}</span><span>{fmt(bar.max)} {model.uw}</span></div>
          </div>

          <div className="stats">
            {model.formulas.map((f) => (
              <div className="stat" key={f.name}><div className="n" style={{ fontSize: "1.3rem" }}>{fmt(f.disp)}<span style={{ fontSize: ".8rem", color: "var(--muted)" }}> {model.uw}</span></div><div className="l">{f.name} formula</div></div>
            ))}
          </div>
        </>
      )}

      <p className="privacy-note">🔒 All calculations run in your browser. These formulas use only height and sex — build and body composition also matter.</p>

      <style jsx>{`
        .empty { margin-top: 4px; color: var(--muted); font-size: 0.9rem; line-height: 1.55; }
        .seg-toggle { display: inline-flex; gap: 4px; padding: 4px; background: var(--surface-2); border-radius: 10px; margin-bottom: 18px; }
        .seg-toggle button {
          border: none; background: transparent; color: var(--muted); cursor: pointer;
          font-size: 0.82rem; font-weight: 500; padding: 7px 14px; border-radius: 7px; transition: all 0.15s;
        }
        .seg-toggle button.on { background: var(--surface); color: var(--text); box-shadow: var(--shadow-sm); }
        .hero {
          margin-top: 20px; padding: 20px; border: 1px solid var(--border); border-radius: var(--radius);
          background: var(--bg-2); text-align: center;
        }
        .hero-lbl { font-family: var(--font-mono), monospace; font-size: 0.62rem; color: var(--muted); text-transform: uppercase; letter-spacing: 0.07em; }
        .hero-val { font-family: var(--font-display), sans-serif; font-weight: 700; font-size: 2rem; letter-spacing: -0.02em; color: var(--accent); margin-top: 6px; }
        .bar { margin-top: 40px; }
        .bar-track { position: relative; height: 8px; background: var(--surface-2); border-radius: 999px; margin: 26px 0; }
        .bar-healthy { position: absolute; top: 0; bottom: 0; background: color-mix(in srgb, var(--ok) 30%, transparent); border-radius: 999px; box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--ok) 45%, transparent); }
        .bar-dot { position: absolute; width: 13px; height: 13px; margin-left: -6.5px; top: 50%; transform: translateY(-50%); }
        .bar-dot::after { content: ""; position: absolute; inset: 0; background: var(--accent); border: 3px solid var(--surface); border-radius: 50%; box-shadow: 0 0 0 1px var(--accent); }
        .bar-axis { display: flex; justify-content: space-between; font-family: var(--font-mono), monospace; font-size: 0.6rem; color: var(--faint); text-transform: uppercase; }
      `}</style>
    </div>
  );
}
