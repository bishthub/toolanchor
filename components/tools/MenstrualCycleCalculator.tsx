"use client";

import { useState, useMemo } from "react";
import { startOfDay, addDays, diffDays, fmtLong } from "./_cycle";

export default function MenstrualCycleCalculator() {
  const [lmp, setLmp] = useState("");
  const [cycle, setCycle] = useState("28");
  const [periodLen, setPeriodLen] = useState("5");

  const model = useMemo(() => {
    if (!lmp) return null;
    const start = startOfDay(new Date(lmp + "T00:00:00"));
    if (isNaN(start.getTime())) return null;
    const cycleLen = Math.min(45, Math.max(20, parseInt(cycle, 10) || 28));
    const pLen = Math.min(10, Math.max(1, parseInt(periodLen, 10) || 5));
    const ovDay = cycleLen - 14; // day within cycle (1-indexed)
    const today = startOfDay(new Date());

    // Cycle day today (1-indexed), wrapping across completed cycles
    let elapsed = diffDays(today, start);
    if (elapsed < 0) elapsed = 0;
    const cycleDay = (elapsed % cycleLen) + 1;
    const cyclesDone = Math.floor(elapsed / cycleLen);
    const currentStart = addDays(start, cyclesDone * cycleLen);
    const nextPeriod = addDays(currentStart, cycleLen);
    const ovulation = addDays(currentStart, ovDay - 1);

    // Phase for a given cycle day
    const phaseOf = (day: number) => {
      if (day <= pLen) return "menstrual";
      if (day >= ovDay - 1 && day <= ovDay + 1) return "ovulation";
      if (day < ovDay - 1) return "follicular";
      return "luteal";
    };
    const phase = phaseOf(cycleDay);

    const phases = [
      { key: "menstrual", label: "Menstrual", from: 1, to: pLen },
      { key: "follicular", label: "Follicular", from: pLen + 1, to: ovDay - 2 },
      { key: "ovulation", label: "Ovulation", from: ovDay - 1, to: ovDay + 1 },
      { key: "luteal", label: "Luteal", from: ovDay + 2, to: cycleLen },
    ].filter((p) => p.to >= p.from);

    const phaseInfo: Record<string, string> = {
      menstrual: "Your period — the uterine lining sheds. Energy is often lower.",
      follicular: "Follicles mature and estrogen rises. Energy typically builds toward ovulation.",
      ovulation: "An egg is released — your most fertile days.",
      luteal: "Progesterone rises after ovulation. PMS symptoms can appear late in this phase.",
    };

    return { cycleLen, pLen, ovDay, cycleDay, phase, phases, nextPeriod, ovulation, daysToNext: diffDays(nextPeriod, today), info: phaseInfo[phase] };
  }, [lmp, cycle, periodLen]);

  return (
    <div>
      <div className="row">
        <div className="field" style={{ maxWidth: 220 }}>
          <label>First day of last period</label>
          <input className="input" type="date" value={lmp} onChange={(e) => setLmp(e.target.value)} />
        </div>
        <div className="field" style={{ maxWidth: 140 }}>
          <label>Cycle length (days)</label>
          <input className="input" type="number" min={20} max={45} value={cycle} onChange={(e) => setCycle(e.target.value)} />
        </div>
        <div className="field" style={{ maxWidth: 140 }}>
          <label>Period length</label>
          <input className="input" type="number" min={1} max={10} value={periodLen} onChange={(e) => setPeriodLen(e.target.value)} />
        </div>
      </div>

      {!model && <p className="empty">Enter the first day of your last period to see exactly where you are in your cycle today.</p>}

      {model && (
        <>
          <div className="hero">
            <div className="hero-day">
              <div className="hd-n">{model.cycleDay}</div>
              <div className="hd-l">Cycle day of {model.cycleLen}</div>
            </div>
            <div className="hero-phase">
              <div className={`badge badge--${model.phase}`}>{model.phase} phase</div>
              <p className="hero-info">{model.info}</p>
            </div>
          </div>

          {/* Phase timeline with today marker */}
          <div className="tl">
            <div className="tl-bar">
              {model.phases.map((p) => (
                <div key={p.key} className={`seg seg--${p.key}`} style={{ flex: p.to - p.from + 1 }} title={`${p.label}: day ${p.from}–${p.to}`}>
                  <span className="seg-l">{p.label}</span>
                </div>
              ))}
              <div className="mark" style={{ left: `${((model.cycleDay - 0.5) / model.cycleLen) * 100}%` }} title={`Today — cycle day ${model.cycleDay}`}>
                <span className="mark-dot" />
                <span className="mark-l">Today</span>
              </div>
            </div>
            <div className="tl-axis"><span>Day 1</span><span>Day {model.cycleLen}</span></div>
          </div>

          <div className="stats">
            <div className="stat"><div className="n" style={{ textTransform: "capitalize", fontSize: "1.1rem" }}>{model.phase}</div><div className="l">Current phase</div></div>
            <div className="stat"><div className="n">{Math.max(0, model.daysToNext)}</div><div className="l">Days to next period</div></div>
            <div className="stat"><div className="n" style={{ fontSize: "1rem" }}>{fmtLong(model.ovulation)}</div><div className="l">This cycle's ovulation</div></div>
            <div className="stat"><div className="n" style={{ fontSize: "1rem" }}>{fmtLong(model.nextPeriod)}</div><div className="l">Next period</div></div>
          </div>
        </>
      )}

      <p className="privacy-note">🔒 All calculations run in your browser. Based on average cycle data — not a substitute for medical advice.</p>

      <style jsx>{`
        .empty { margin-top: 4px; color: var(--muted); font-size: 0.9rem; line-height: 1.55; }
        .hero {
          display: flex; gap: 20px; align-items: center; flex-wrap: wrap;
          margin-top: 22px; padding: 20px; border: 1px solid var(--border);
          border-radius: var(--radius); background: var(--bg-2);
        }
        .hero-day { text-align: center; flex: none; min-width: 108px; }
        .hd-n {
          font-family: var(--font-display), sans-serif; font-weight: 700; font-size: 3.2rem;
          line-height: 1; letter-spacing: -0.03em; color: var(--accent); font-variant-numeric: tabular-nums;
        }
        .hd-l { font-family: var(--font-mono), monospace; font-size: 0.62rem; color: var(--muted); text-transform: uppercase; letter-spacing: 0.06em; margin-top: 6px; }
        .hero-phase { flex: 1; min-width: 200px; }
        .badge {
          display: inline-block; text-transform: capitalize; font-weight: 600; font-size: 0.82rem;
          padding: 5px 12px; border-radius: 999px; letter-spacing: 0.01em;
        }
        .badge--menstrual { background: color-mix(in srgb, #e11d48 14%, transparent); color: color-mix(in srgb, #e11d48 78%, var(--text)); }
        .badge--follicular { background: var(--surface-2); color: var(--muted); }
        .badge--ovulation { background: var(--accent); color: var(--accent-ink); }
        .badge--luteal { background: color-mix(in srgb, var(--cat-text) 16%, transparent); color: color-mix(in srgb, var(--cat-text) 82%, var(--text)); }
        .hero-info { margin: 10px 0 0; color: var(--muted); font-size: 0.9rem; line-height: 1.5; }
        .tl { margin-top: 22px; }
        .tl-bar { position: relative; display: flex; gap: 3px; height: 44px; }
        .seg {
          display: flex; align-items: center; justify-content: center; min-width: 0; padding: 0 6px;
          border-radius: 6px; font-family: var(--font-mono), monospace; font-size: 0.6rem;
          text-transform: uppercase; letter-spacing: 0.06em; overflow: hidden;
        }
        .seg-l { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .seg--menstrual { background: color-mix(in srgb, #e11d48 15%, transparent); color: color-mix(in srgb, #e11d48 70%, var(--text)); }
        .seg--follicular { background: var(--surface-2); color: var(--faint); }
        .seg--ovulation { background: var(--accent-soft); color: var(--accent); box-shadow: inset 0 0 0 1px var(--ring); }
        .seg--luteal { background: color-mix(in srgb, var(--cat-text) 12%, transparent); color: color-mix(in srgb, var(--cat-text) 70%, var(--text)); }
        .mark { position: absolute; top: -6px; bottom: -6px; transform: translateX(-50%); display: flex; flex-direction: column; align-items: center; pointer-events: none; }
        .mark-dot { width: 14px; height: 14px; border-radius: 50%; background: var(--text); border: 3px solid var(--surface); box-shadow: 0 0 0 1px var(--text); }
        .mark-l { margin-top: auto; font-family: var(--font-mono), monospace; font-size: 0.58rem; color: var(--text); font-weight: 600; }
        .tl-axis { display: flex; justify-content: space-between; margin-top: 8px; font-family: var(--font-mono), monospace; font-size: 0.6rem; color: var(--faint); text-transform: uppercase; letter-spacing: 0.05em; }
      `}</style>
    </div>
  );
}
