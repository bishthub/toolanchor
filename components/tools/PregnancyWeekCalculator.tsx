"use client";

import { useState, useMemo } from "react";
import { startOfDay, addDays, diffDays, fmtLong, ProgressRing } from "./_cycle";

// Approximate crown-to-heel length (cm) and a familiar size comparison by week.
const SIZES: Record<number, { size: string; cm: number }> = {
  4: { size: "poppy seed", cm: 0.4 }, 5: { size: "sesame seed", cm: 0.6 }, 6: { size: "lentil", cm: 0.6 },
  7: { size: "blueberry", cm: 1.3 }, 8: { size: "kidney bean", cm: 1.6 }, 9: { size: "grape", cm: 2.3 },
  10: { size: "kumquat", cm: 3.1 }, 11: { size: "fig", cm: 4.1 }, 12: { size: "lime", cm: 5.4 },
  13: { size: "pea pod", cm: 7.4 }, 14: { size: "lemon", cm: 8.7 }, 15: { size: "apple", cm: 10.1 },
  16: { size: "avocado", cm: 11.6 }, 17: { size: "turnip", cm: 13 }, 18: { size: "bell pepper", cm: 14.2 },
  19: { size: "mango", cm: 15.3 }, 20: { size: "banana", cm: 25.6 }, 21: { size: "carrot", cm: 26.7 },
  22: { size: "spaghetti squash", cm: 27.8 }, 23: { size: "large mango", cm: 28.9 }, 24: { size: "ear of corn", cm: 30 },
  25: { size: "rutabaga", cm: 34.6 }, 26: { size: "head of lettuce", cm: 35.6 }, 27: { size: "cauliflower", cm: 36.6 },
  28: { size: "eggplant", cm: 37.6 }, 29: { size: "butternut squash", cm: 38.6 }, 30: { size: "cabbage", cm: 39.9 },
  31: { size: "coconut", cm: 41.1 }, 32: { size: "jicama", cm: 42.4 }, 33: { size: "pineapple", cm: 43.7 },
  34: { size: "cantaloupe", cm: 45 }, 35: { size: "honeydew melon", cm: 46.2 }, 36: { size: "romaine lettuce", cm: 47.4 },
  37: { size: "Swiss chard", cm: 48.6 }, 38: { size: "leek", cm: 49.8 }, 39: { size: "mini watermelon", cm: 50.7 },
  40: { size: "small pumpkin", cm: 51.2 },
};

export default function PregnancyWeekCalculator() {
  const [mode, setMode] = useState<"lmp" | "due">("lmp");
  const [date, setDate] = useState("");

  const model = useMemo(() => {
    if (!date) return null;
    const input = startOfDay(new Date(date + "T00:00:00"));
    if (isNaN(input.getTime())) return null;
    const lmp = mode === "lmp" ? input : addDays(input, -280);
    const dueDate = addDays(lmp, 280);
    const today = startOfDay(new Date());
    let gaDays = diffDays(today, lmp);
    gaDays = Math.max(0, Math.min(gaDays, 294)); // clamp 0..42w
    const weeks = Math.floor(gaDays / 7);
    const days = gaDays % 7;
    const trimester = weeks < 14 ? 1 : weeks < 28 ? 2 : 3;
    const daysLeft = Math.max(0, diffDays(dueDate, today));
    const sizeKey = Math.max(4, Math.min(40, weeks));
    return { lmp, dueDate, gaDays, weeks, days, trimester, daysLeft, size: SIZES[sizeKey], progress: gaDays / 280 };
  }, [date, mode]);

  const trimesters = [
    { n: 1, label: "1st", range: "Weeks 1–13", span: 13 },
    { n: 2, label: "2nd", range: "Weeks 14–27", span: 14 },
    { n: 3, label: "3rd", range: "Weeks 28–40", span: 13 },
  ];

  return (
    <div>
      <div className="seg-toggle">
        <button className={mode === "lmp" ? "on" : ""} onClick={() => setMode("lmp")}>From last period</button>
        <button className={mode === "due" ? "on" : ""} onClick={() => setMode("due")}>From due date</button>
      </div>
      <div className="row">
        <div className="field" style={{ maxWidth: 280 }}>
          <label>{mode === "lmp" ? "First day of last period" : "Estimated due date"}</label>
          <input className="input" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
      </div>

      {!model && <p className="empty">Enter your {mode === "lmp" ? "last period date" : "due date"} to see how far along you are.</p>}

      {model && (
        <>
          <div className="hero">
            <ProgressRing value={model.progress} label={`${model.weeks}w`} sub={`${model.days} day${model.days === 1 ? "" : "s"}`} />
            <div className="hero-body">
              <div className="ga">{model.weeks} weeks, {model.days} day{model.days === 1 ? "" : "s"} pregnant</div>
              <div className="baby">Baby is about the size of a <strong>{model.size.size}</strong> — roughly {model.size.cm} cm.</div>
              <div className="dd">Estimated due date: <strong>{fmtLong(model.dueDate)}</strong></div>
            </div>
          </div>

          {/* Trimester progress */}
          <div className="tri">
            {trimesters.map((t) => {
              const active = model.trimester === t.n;
              const done = model.trimester > t.n;
              return (
                <div key={t.n} className={`tri-seg${active ? " on" : ""}${done ? " done" : ""}`} style={{ flex: t.span }}>
                  <div className="tri-fill" style={{ width: done ? "100%" : active ? `${Math.min(100, ((model.weeks - (t.n === 1 ? 0 : t.n === 2 ? 14 : 28)) / t.span) * 100)}%` : "0%" }} />
                  <div className="tri-txt"><span className="tri-lbl">{t.label} trimester</span><span className="tri-rng">{t.range}</span></div>
                </div>
              );
            })}
          </div>

          <div className="stats">
            <div className="stat"><div className="n">{model.weeks}<span style={{ fontSize: "1rem" }}>w {model.days}d</span></div><div className="l">Along</div></div>
            <div className="stat"><div className="n">{model.trimester}<span style={{ fontSize: "1rem" }}>{model.trimester === 1 ? "st" : model.trimester === 2 ? "nd" : "rd"}</span></div><div className="l">Trimester</div></div>
            <div className="stat"><div className="n">{model.daysLeft}</div><div className="l">Days to due date</div></div>
            <div className="stat"><div className="n">{Math.round(model.progress * 100)}<span style={{ fontSize: "1rem" }}>%</span></div><div className="l">Complete</div></div>
          </div>
        </>
      )}

      <p className="privacy-note">🔒 All calculations run in your browser. Dated from your last period (40-week term) — your provider's ultrasound dating may differ.</p>

      <style jsx>{`
        .empty { margin-top: 4px; color: var(--muted); font-size: 0.9rem; line-height: 1.55; }
        .seg-toggle { display: inline-flex; gap: 4px; padding: 4px; background: var(--surface-2); border-radius: 10px; margin-bottom: 18px; }
        .seg-toggle button {
          border: none; background: transparent; color: var(--muted); cursor: pointer;
          font-size: 0.82rem; font-weight: 500; padding: 7px 14px; border-radius: 7px; transition: all 0.15s;
        }
        .seg-toggle button.on { background: var(--surface); color: var(--text); box-shadow: var(--shadow-sm); }
        .hero {
          display: flex; gap: 24px; align-items: center; flex-wrap: wrap; margin-top: 22px;
          padding: 22px; border: 1px solid var(--border); border-radius: var(--radius); background: var(--bg-2);
        }
        .hero-body { flex: 1; min-width: 220px; }
        .ga { font-family: var(--font-display), sans-serif; font-weight: 700; font-size: 1.35rem; letter-spacing: -0.02em; color: var(--text); }
        .baby { margin-top: 10px; color: var(--muted); font-size: 0.92rem; line-height: 1.5; }
        .baby strong { color: var(--accent); }
        .dd { margin-top: 8px; color: var(--muted); font-size: 0.88rem; }
        .dd strong, .ga { color: var(--text); }
        .tri { display: flex; gap: 4px; margin-top: 22px; }
        .tri-seg { position: relative; height: 58px; border-radius: 8px; background: var(--surface-2); overflow: hidden; border: 1px solid var(--border); }
        .tri-seg.on { border-color: var(--ring); }
        .tri-fill { position: absolute; inset: 0; background: var(--accent-soft); transition: width 0.5s var(--ease-out); }
        .tri-seg.done .tri-fill { background: color-mix(in srgb, var(--accent) 18%, transparent); }
        .tri-txt { position: relative; padding: 10px 12px; display: flex; flex-direction: column; gap: 2px; }
        .tri-lbl { font-weight: 600; font-size: 0.82rem; color: var(--text); }
        .tri-rng { font-family: var(--font-mono), monospace; font-size: 0.6rem; color: var(--muted); text-transform: uppercase; letter-spacing: 0.05em; }
      `}</style>
    </div>
  );
}
