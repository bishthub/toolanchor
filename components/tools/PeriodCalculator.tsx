"use client";

import { useState, useMemo } from "react";
import { startOfDay, addDays, diffDays, sameDay, fmtLong, fmtShort, monthsCovering, MonthCalendar, CycleLegend, DayKind } from "./_cycle";

export default function PeriodCalculator() {
  const [lmp, setLmp] = useState("");
  const [cycle, setCycle] = useState("28");
  const [periodLen, setPeriodLen] = useState("5");
  const [count, setCount] = useState("4");

  const model = useMemo(() => {
    if (!lmp) return null;
    const start = startOfDay(new Date(lmp + "T00:00:00"));
    if (isNaN(start.getTime())) return null;
    const cycleLen = Math.min(45, Math.max(20, parseInt(cycle, 10) || 28));
    const pLen = Math.min(10, Math.max(1, parseInt(periodLen, 10) || 5));
    const n = Math.min(12, Math.max(1, parseInt(count, 10) || 4));
    const cycles = Array.from({ length: n + 1 }, (_, i) => {
      const pStart = addDays(start, cycleLen * i);
      const pEnd = addDays(pStart, pLen - 1);
      const ovulation = addDays(pStart, cycleLen - 14);
      return { pStart, pEnd, ovulation, fertileStart: addDays(ovulation, -5), fertileEnd: ovulation };
    });
    return { cycles, cycleLen, pLen };
  }, [lmp, cycle, periodLen, count]);

  const today = startOfDay(new Date());

  const kindFor = (d: Date): DayKind => {
    if (!model) return "normal";
    for (const c of model.cycles) {
      if (sameDay(d, c.ovulation)) return "ovulation";
      if (d >= c.fertileStart && d <= c.fertileEnd) return "fertile";
      if (d >= c.pStart && d <= c.pEnd) return "period";
    }
    return "normal";
  };

  const months = useMemo(() => {
    if (!model) return [];
    const all: Date[] = [];
    for (const c of model.cycles) { all.push(c.pStart); all.push(c.pEnd); all.push(c.ovulation); }
    return monthsCovering(all);
  }, [model]);

  // Next upcoming period (first whose start is today or later)
  const next = useMemo(() => {
    if (!model) return null;
    return model.cycles.find((c) => diffDays(c.pStart, today) >= 0) ?? model.cycles[0];
  }, [model]);

  return (
    <div>
      <div className="row">
        <div className="field" style={{ maxWidth: 220 }}>
          <label>First day of last period</label>
          <input className="input" type="date" value={lmp} onChange={(e) => setLmp(e.target.value)} />
        </div>
        <div className="field" style={{ maxWidth: 130 }}>
          <label>Cycle length (days)</label>
          <input className="input" type="number" min={20} max={45} value={cycle} onChange={(e) => setCycle(e.target.value)} />
        </div>
        <div className="field" style={{ maxWidth: 130 }}>
          <label>Period length</label>
          <input className="input" type="number" min={1} max={10} value={periodLen} onChange={(e) => setPeriodLen(e.target.value)} />
        </div>
        <div className="field" style={{ maxWidth: 130 }}>
          <label>Cycles to predict</label>
          <input className="input" type="number" min={1} max={12} value={count} onChange={(e) => setCount(e.target.value)} />
        </div>
      </div>

      {!model && (
        <p className="empty">Enter the first day of your last period to predict your upcoming periods and fertile windows.</p>
      )}

      {model && next && (
        <>
          <div className="stats">
            <div className="stat"><div className="n" style={{ fontSize: "1rem" }}>{fmtLong(next.pStart)}</div><div className="l">Next period starts</div></div>
            <div className="stat"><div className="n">{Math.max(0, diffDays(next.pStart, today))}</div><div className="l">Days until next period</div></div>
            <div className="stat"><div className="n" style={{ fontSize: "1rem" }}>{fmtLong(next.ovulation)}</div><div className="l">Next ovulation</div></div>
            <div className="stat"><div className="n" style={{ fontSize: ".9rem" }}>{fmtShort(next.fertileStart)} – {fmtShort(next.fertileEnd)}</div><div className="l">Next fertile window</div></div>
          </div>

          <div className="cals">
            {months.map(({ year, month }) => (
              <MonthCalendar key={`${year}-${month}`} year={year} month={month} kindFor={kindFor} isToday={(d) => sameDay(d, today)} />
            ))}
          </div>

          <CycleLegend items={[
            { cls: "period", label: "Period" },
            { cls: "fertile", label: "Fertile window" },
            { cls: "ovulation", label: "Ovulation" },
          ]} />
        </>
      )}

      <p className="privacy-note">🔒 All calculations run in your browser. Predictions assume regular cycles — not a substitute for medical advice.</p>

      <style jsx>{`
        .empty { margin-top: 4px; color: var(--muted); font-size: 0.9rem; line-height: 1.55; }
        .cals {
          display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          gap: 16px; margin-top: 24px;
        }
      `}</style>
    </div>
  );
}
