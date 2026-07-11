"use client";

import { useEffect, useState } from "react";
import { readShared } from "@/lib/share";
import ShareResult from "@/components/ShareResult";

const fmt = (d: Date) => d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" });
const fmtShort = (d: Date) => d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
const addDays = (d: Date, n: number) => { const out = new Date(d); out.setDate(out.getDate() + n); return out; };

export default function DueDateCalculator() {
  const [date, setDate] = useState("");
  const [cycle, setCycle] = useState("28");
  const [mode, setMode] = useState<"lmp" | "conception">("lmp");

  useEffect(() => {
    const s = readShared(["d", "cl", "mode"]);
    if (s.d) setDate(s.d);
    if (s.cl) setCycle(s.cl);
    if (s.mode === "lmp" || s.mode === "conception") setMode(s.mode);
  }, []);

  const start = date ? new Date(date + "T00:00:00") : null;
  const cycleLen = Math.min(45, Math.max(20, parseInt(cycle, 10) || 28));
  const ready = start != null && !isNaN(start.getTime());

  let dueDate: Date | null = null;
  let effLmp: Date | null = null;
  if (ready && start) {
    if (mode === "lmp") {
      dueDate = addDays(start, 280 + (cycleLen - 28));
      effLmp = start;
    } else {
      dueDate = addDays(start, 266);
      effLmp = addDays(dueDate, -280);
    }
  }

  let gestational = "";
  let daysRemaining = 0;
  let t1 = "", t2 = "", t3 = "";
  if (dueDate && effLmp) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const gestDays = Math.max(0, Math.round((today.getTime() - effLmp.getTime()) / 86400000));
    gestational = `${Math.floor(gestDays / 7)}w ${gestDays % 7}d`;
    daysRemaining = Math.round((dueDate.getTime() - today.getTime()) / 86400000);
    t1 = `${fmtShort(effLmp)} – ${fmtShort(addDays(effLmp, 13 * 7))}`;
    t2 = `${fmtShort(addDays(effLmp, 13 * 7 + 1))} – ${fmtShort(addDays(effLmp, 27 * 7))}`;
    t3 = `${fmtShort(addDays(effLmp, 27 * 7 + 1))} – ${fmtShort(dueDate)}`;
  }

  return (
    <div>
      <div className="field">
        <label>Calculate from</label>
        <div className="row">
          <button type="button" className={`btn ${mode === "lmp" ? "" : "secondary"}`} onClick={() => setMode("lmp")}>Last period</button>
          <button type="button" className={`btn ${mode === "conception" ? "" : "secondary"}`} onClick={() => setMode("conception")}>Conception date</button>
        </div>
      </div>
      <div className="row">
        <div className="field" style={{ maxWidth: 280 }}>
          <label>{mode === "lmp" ? "First day of last period" : "Conception date"}</label>
          <input className="input" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        {mode === "lmp" && (
          <div className="field" style={{ maxWidth: 120 }}>
            <label>Cycle length (days)</label>
            <input className="input" type="number" min={20} max={45} value={cycle} onChange={(e) => setCycle(e.target.value)} />
          </div>
        )}
      </div>

      {dueDate && (
        <div className="stats">
          <div className="stat"><div className="n" style={{ fontSize: "1rem" }}>{fmt(dueDate)}</div><div className="l">Estimated due date</div></div>
          <div className="stat"><div className="n">{gestational}</div><div className="l">Gestational age today</div></div>
          <div className="stat"><div className="n">{daysRemaining}</div><div className="l">Days remaining</div></div>
          <div className="stat"><div className="n" style={{ fontSize: "1rem" }}>{t1}</div><div className="l">1st trimester (to end of week 13)</div></div>
          <div className="stat"><div className="n" style={{ fontSize: "1rem" }}>{t2}</div><div className="l">2nd trimester (to end of week 27)</div></div>
          <div className="stat"><div className="n" style={{ fontSize: "1rem" }}>{t3}</div><div className="l">3rd trimester (to due date)</div></div>
        </div>
      )}
      {dueDate && <ShareResult values={{ d: date, cl: cycle, mode }} />}
      <p className="privacy-note">🔒 All calculations run in your browser. Based on average cycle data — estimates only, not a substitute for medical advice.</p>
    </div>
  );
}
