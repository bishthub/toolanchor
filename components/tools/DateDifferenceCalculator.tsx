"use client";

import { useMemo, useState } from "react";
import DatePicker from "@/components/DatePicker";

function breakdown(aISO: string, bISO: string) {
  let from = new Date(aISO);
  let to = new Date(bISO);
  if (isNaN(+from) || isNaN(+to)) return null;
  if (from > to) [from, to] = [to, from];

  let years = to.getFullYear() - from.getFullYear();
  let months = to.getMonth() - from.getMonth();
  let days = to.getDate() - from.getDate();
  if (days < 0) {
    months -= 1;
    days += new Date(to.getFullYear(), to.getMonth(), 0).getDate();
  }
  if (months < 0) { years -= 1; months += 12; }

  const totalDays = Math.round((+to - +from) / 86400000);
  return {
    years, months, days,
    totalDays,
    totalWeeks: Math.floor(totalDays / 7),
    totalHours: totalDays * 24,
  };
}

export default function DateDifferenceCalculator() {
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const r = useMemo(() => (start && end ? breakdown(start, end) : null), [start, end]);

  return (
    <div>
      <div className="row">
        <div className="field">
          <label htmlFor="start">Start date</label>
          <DatePicker id="start" value={start} onChange={setStart} placeholder="e.g. 2024-01-01 or “today”" />
        </div>
        <div className="field">
          <label htmlFor="end">End date</label>
          <DatePicker id="end" value={end} onChange={setEnd} placeholder="e.g. 12 Jan 2026 or “in 30 days”" />
        </div>
      </div>

      {r && (
        <>
          <div className="stat" style={{ marginTop: 8 }}>
            <div className="n">{r.years}y {r.months}m {r.days}d</div>
            <div className="l">Duration</div>
          </div>
          <div className="stats">
            <div className="stat"><div className="n">{r.totalDays.toLocaleString()}</div><div className="l">Total days</div></div>
            <div className="stat"><div className="n">{r.totalWeeks.toLocaleString()}</div><div className="l">Total weeks</div></div>
            <div className="stat"><div className="n">{r.totalHours.toLocaleString()}</div><div className="l">Total hours</div></div>
          </div>
        </>
      )}

      <p className="privacy-note">🔒 Calculated instantly in your browser.</p>
    </div>
  );
}
