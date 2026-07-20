"use client";

import { useState, useMemo } from "react";
import { startOfDay, addDays, fmtLong } from "./_cycle";

export default function ConceptionDateCalculator() {
  const [mode, setMode] = useState<"lmp" | "due" | "birth">("lmp");
  const [date, setDate] = useState("");
  const [cycle, setCycle] = useState("28");

  const model = useMemo(() => {
    if (!date) return null;
    const input = startOfDay(new Date(date + "T00:00:00"));
    if (isNaN(input.getTime())) return null;
    const cycleLen = Math.min(45, Math.max(20, parseInt(cycle, 10) || 28));

    let conception: Date;
    let dueDate: Date;
    if (mode === "lmp") {
      conception = addDays(input, cycleLen - 14);
      dueDate = addDays(input, 280);
    } else if (mode === "due") {
      conception = addDays(input, -266);
      dueDate = input;
    } else {
      // actual birth date → treat like due date
      conception = addDays(input, -266);
      dueDate = input;
    }
    return {
      conception,
      windowStart: addDays(conception, -3),
      windowEnd: addDays(conception, 1),
      dueDate,
      lmp: addDays(dueDate, -280),
    };
  }, [date, mode, cycle]);

  const labels = { lmp: "First day of last period", due: "Estimated due date", birth: "Baby's birth date" };

  return (
    <div>
      <div className="seg-toggle">
        <button className={mode === "lmp" ? "on" : ""} onClick={() => setMode("lmp")}>From last period</button>
        <button className={mode === "due" ? "on" : ""} onClick={() => setMode("due")}>From due date</button>
        <button className={mode === "birth" ? "on" : ""} onClick={() => setMode("birth")}>From birth date</button>
      </div>
      <div className="row">
        <div className="field" style={{ maxWidth: 260 }}>
          <label>{labels[mode]}</label>
          <input className="input" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        {mode === "lmp" && (
          <div className="field" style={{ maxWidth: 130 }}>
            <label>Cycle length (days)</label>
            <input className="input" type="number" min={20} max={45} value={cycle} onChange={(e) => setCycle(e.target.value)} />
          </div>
        )}
      </div>

      {!model && <p className="empty">Choose a starting point and enter the date to estimate when conception likely occurred.</p>}

      {model && (
        <>
          <div className="hero">
            <div className="hero-lbl">Estimated conception date</div>
            <div className="hero-date">{fmtLong(model.conception)}</div>
            <div className="hero-win">Most likely between <strong>{fmtLong(model.windowStart).replace(/,[^,]*$/, "")}</strong> and <strong>{fmtLong(model.windowEnd).replace(/,[^,]*$/, "")}</strong></div>
          </div>

          <div className="stats">
            <div className="stat"><div className="n" style={{ fontSize: "1rem" }}>{fmtLong(model.windowStart)}</div><div className="l">Window opens</div></div>
            <div className="stat"><div className="n" style={{ fontSize: "1rem" }}>{fmtLong(model.conception)}</div><div className="l">Most likely day</div></div>
            <div className="stat"><div className="n" style={{ fontSize: "1rem" }}>{fmtLong(model.windowEnd)}</div><div className="l">Window closes</div></div>
            <div className="stat"><div className="n" style={{ fontSize: "1rem" }}>{fmtLong(model.dueDate)}</div><div className="l">Estimated due date</div></div>
          </div>
        </>
      )}

      <p className="privacy-note">🔒 All calculations run in your browser. Conception spans a fertile window of several days — treat the date as an estimate.</p>

      <style jsx>{`
        .empty { margin-top: 4px; color: var(--muted); font-size: 0.9rem; line-height: 1.55; }
        .seg-toggle { display: inline-flex; flex-wrap: wrap; gap: 4px; padding: 4px; background: var(--surface-2); border-radius: 10px; margin-bottom: 18px; }
        .seg-toggle button {
          border: none; background: transparent; color: var(--muted); cursor: pointer;
          font-size: 0.82rem; font-weight: 500; padding: 7px 14px; border-radius: 7px; transition: all 0.15s;
        }
        .seg-toggle button.on { background: var(--surface); color: var(--text); box-shadow: var(--shadow-sm); }
        .hero {
          margin-top: 22px; padding: 24px; border: 1px solid var(--border); border-radius: var(--radius);
          background: var(--bg-2); text-align: center;
        }
        .hero-lbl { font-family: var(--font-mono), monospace; font-size: 0.62rem; color: var(--muted); text-transform: uppercase; letter-spacing: 0.08em; }
        .hero-date {
          font-family: var(--font-display), sans-serif; font-weight: 700; font-size: 2rem;
          letter-spacing: -0.02em; color: var(--accent); margin-top: 8px; line-height: 1.1;
        }
        .hero-win { margin-top: 10px; color: var(--muted); font-size: 0.9rem; }
        .hero-win strong { color: var(--text); }
      `}</style>
    </div>
  );
}
