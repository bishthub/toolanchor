"use client";

import { useState, useMemo } from "react";

type Unit = "metric" | "imperial";
type Sex = "girl" | "boy";

export default function ChildHeightPredictor() {
  const [unit, setUnit] = useState<Unit>("metric");
  const [sex, setSex] = useState<Sex>("girl");
  const [momCm, setMomCm] = useState("");
  const [dadCm, setDadCm] = useState("");
  const [momFt, setMomFt] = useState(""); const [momIn, setMomIn] = useState("");
  const [dadFt, setDadFt] = useState(""); const [dadIn, setDadIn] = useState("");

  const model = useMemo(() => {
    const toCm = (cm: string, ft: string, inc: string) =>
      unit === "metric" ? parseFloat(cm) || 0 : ((parseFloat(ft) || 0) * 12 + (parseFloat(inc) || 0)) * 2.54;
    const mom = toCm(momCm, momFt, momIn);
    const dad = toCm(dadCm, dadFt, dadIn);
    if (mom < 120 || mom > 230 || dad < 120 || dad > 230) return null;

    const mid = (mom + dad) / 2;
    const predicted = sex === "boy" ? mid + 6.5 : mid - 6.5;
    const lo = predicted - 8.5;
    const hi = predicted + 8.5;
    return { predicted, lo, hi };
  }, [unit, sex, momCm, dadCm, momFt, momIn, dadFt, dadIn]);

  const disp = (cm: number) => {
    if (unit === "metric") return `${Math.round(cm)} cm`;
    const totalIn = cm / 2.54;
    const ft = Math.floor(totalIn / 12);
    const inch = Math.round(totalIn - ft * 12);
    return `${ft}'${inch}"`;
  };

  const bar = useMemo(() => {
    if (!model) return null;
    const min = model.lo - 6, max = model.hi + 6, span = max - min || 1;
    return { min, max, pct: (v: number) => ((v - min) / span) * 100 };
  }, [model]);

  return (
    <div>
      <div className="seg-toggle">
        <button className={unit === "metric" ? "on" : ""} onClick={() => setUnit("metric")}>Metric (cm)</button>
        <button className={unit === "imperial" ? "on" : ""} onClick={() => setUnit("imperial")}>Imperial (ft)</button>
      </div>
      <div className="row">
        <div className="field" style={{ maxWidth: 150 }}>
          <label>Child's sex</label>
          <select className="input" value={sex} onChange={(e) => setSex(e.target.value as Sex)}>
            <option value="girl">Girl</option>
            <option value="boy">Boy</option>
          </select>
        </div>
        {unit === "metric" ? (
          <>
            <div className="field" style={{ maxWidth: 150 }}><label>Mother's height (cm)</label><input className="input" type="number" value={momCm} onChange={(e) => setMomCm(e.target.value)} /></div>
            <div className="field" style={{ maxWidth: 150 }}><label>Father's height (cm)</label><input className="input" type="number" value={dadCm} onChange={(e) => setDadCm(e.target.value)} /></div>
          </>
        ) : (
          <>
            <div className="field" style={{ maxWidth: 90 }}><label>Mother ft</label><input className="input" type="number" value={momFt} onChange={(e) => setMomFt(e.target.value)} /></div>
            <div className="field" style={{ maxWidth: 80 }}><label>in</label><input className="input" type="number" value={momIn} onChange={(e) => setMomIn(e.target.value)} /></div>
            <div className="field" style={{ maxWidth: 90 }}><label>Father ft</label><input className="input" type="number" value={dadFt} onChange={(e) => setDadFt(e.target.value)} /></div>
            <div className="field" style={{ maxWidth: 80 }}><label>in</label><input className="input" type="number" value={dadIn} onChange={(e) => setDadIn(e.target.value)} /></div>
          </>
        )}
      </div>

      {!model && <p className="empty">Enter both parents' heights to estimate your child's adult height.</p>}

      {model && bar && (
        <>
          <div className="hero">
            <div className="hero-lbl">Predicted adult height</div>
            <div className="hero-val">{disp(model.predicted)}</div>
            <div className="hero-range">Typical range: {disp(model.lo)} – {disp(model.hi)}</div>
          </div>

          <div className="bar">
            <div className="bar-track">
              <div className="bar-range" style={{ left: `${bar.pct(model.lo)}%`, right: `${100 - bar.pct(model.hi)}%` }} />
              <div className="bar-dot" style={{ left: `${bar.pct(model.predicted)}%` }}><span className="bar-dot-lbl">{disp(model.predicted)}</span></div>
            </div>
            <div className="bar-axis"><span>{disp(bar.min)}</span><span>{disp(bar.max)}</span></div>
          </div>

          <div className="stats">
            <div className="stat"><div className="n" style={{ fontSize: "1.4rem" }}>{disp(model.predicted)}</div><div className="l">Predicted height</div></div>
            <div className="stat"><div className="n" style={{ fontSize: "1.1rem" }}>{disp(model.lo)}</div><div className="l">Lower estimate</div></div>
            <div className="stat"><div className="n" style={{ fontSize: "1.1rem" }}>{disp(model.hi)}</div><div className="l">Upper estimate</div></div>
          </div>
        </>
      )}

      <p className="privacy-note">🔒 All calculations run in your browser. A genetic estimate (mid-parental method) — nutrition and health also affect final height.</p>

      <style jsx>{`
        .empty { margin-top: 4px; color: var(--muted); font-size: 0.9rem; line-height: 1.55; }
        .seg-toggle { display: inline-flex; gap: 4px; padding: 4px; background: var(--surface-2); border-radius: 10px; margin-bottom: 18px; }
        .seg-toggle button { border: none; background: transparent; color: var(--muted); cursor: pointer; font-size: 0.82rem; font-weight: 500; padding: 7px 14px; border-radius: 7px; transition: all 0.15s; }
        .seg-toggle button.on { background: var(--surface); color: var(--text); box-shadow: var(--shadow-sm); }
        .hero { margin-top: 20px; padding: 22px; border: 1px solid var(--border); border-radius: var(--radius); background: var(--bg-2); text-align: center; }
        .hero-lbl { font-family: var(--font-mono), monospace; font-size: 0.62rem; color: var(--muted); text-transform: uppercase; letter-spacing: 0.07em; }
        .hero-val { font-family: var(--font-display), sans-serif; font-weight: 700; font-size: 2.4rem; letter-spacing: -0.02em; color: var(--accent); margin-top: 6px; line-height: 1; }
        .hero-range { margin-top: 10px; color: var(--muted); font-size: 0.9rem; }
        .bar { margin-top: 34px; }
        .bar-track { position: relative; height: 8px; background: var(--surface-2); border-radius: 999px; margin: 26px 0; }
        .bar-range { position: absolute; top: 0; bottom: 0; background: var(--accent-soft); border-radius: 999px; box-shadow: inset 0 0 0 1px var(--ring); }
        .bar-dot { position: absolute; width: 14px; height: 14px; margin-left: -7px; top: 50%; transform: translateY(-50%); }
        .bar-dot::after { content: ""; position: absolute; inset: 0; background: var(--accent); border: 3px solid var(--surface); border-radius: 50%; box-shadow: 0 0 0 1px var(--accent); }
        .bar-dot-lbl { position: absolute; left: 50%; transform: translateX(-50%); top: -20px; font-family: var(--font-mono), monospace; font-size: 0.6rem; color: var(--accent); font-weight: 600; white-space: nowrap; }
        .bar-axis { display: flex; justify-content: space-between; font-family: var(--font-mono), monospace; font-size: 0.6rem; color: var(--faint); text-transform: uppercase; }
      `}</style>
    </div>
  );
}
