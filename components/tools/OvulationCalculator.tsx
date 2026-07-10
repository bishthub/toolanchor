"use client";

import { useState, useMemo } from "react";

export default function OvulationCalculator() {
  const [lmp, setLmp] = useState("");
  const [cycle, setCycle] = useState("28");

  const result = useMemo(() => {
    if (!lmp) return null;
    const start = new Date(lmp + "T00:00:00");
    if (isNaN(start.getTime())) return null;
    const cycleLen = parseInt(cycle, 10) || 28;
    const ovulation = new Date(start);
    ovulation.setDate(ovulation.getDate() + (cycleLen - 14));
    const fertileStart = new Date(ovulation);
    fertileStart.setDate(fertileStart.getDate() - 5);
    const fertileEnd = new Date(ovulation);
    const dueDate = new Date(ovulation);
    dueDate.setDate(dueDate.getDate() + 266); // 38 weeks from conception
    const fmt = (d: Date) => d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" });
    return {
      ovulation: fmt(ovulation),
      fertileStart: fmt(fertileStart),
      fertileEnd: fmt(fertileEnd),
      dueDate: fmt(dueDate),
      cycleDay: cycleLen - 14,
    };
  }, [lmp, cycle]);

  return (
    <div>
      <div className="row">
        <div className="field" style={{ maxWidth: 280 }}>
          <label>First day of last period</label>
          <input className="input" type="date" value={lmp} onChange={(e) => setLmp(e.target.value)} />
        </div>
        <div className="field" style={{ maxWidth: 120 }}>
          <label>Cycle length (days)</label>
          <input className="input" type="number" min={20} max={45} value={cycle} onChange={(e) => setCycle(e.target.value)} />
        </div>
      </div>
      {result && (
        <div className="stats">
          <div className="stat"><div className="n" style={{ fontSize: "1rem" }}>{result.fertileStart}</div><div className="l">Fertile window starts</div></div>
          <div className="stat"><div className="n" style={{ fontSize: "1rem" }}>{result.ovulation}</div><div className="l">Ovulation (cycle day {result.cycleDay})</div></div>
          <div className="stat"><div className="n" style={{ fontSize: "1rem" }}>{result.fertileEnd}</div><div className="l">Fertile window ends</div></div>
          <div className="stat"><div className="n" style={{ fontSize: "1rem" }}>{result.dueDate}</div><div className="l">Estimated due date</div></div>
        </div>
      )}
      <p className="privacy-note">🔒 All calculations run in your browser. Based on average cycle data — not a substitute for medical advice.</p>
    </div>
  );
}
