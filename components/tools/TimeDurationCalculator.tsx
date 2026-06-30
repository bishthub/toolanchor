"use client";

import { useState } from "react";

function toMinutes(t: string): number | null {
  const m = t.match(/^(\d{1,2}):(\d{2})$/);
  if (!m) return null;
  const h = +m[1], min = +m[2];
  if (h > 23 || min > 59) return null;
  return h * 60 + min;
}

export default function TimeDurationCalculator() {
  const [start, setStart] = useState("09:00");
  const [end, setEnd] = useState("17:30");

  const s = toMinutes(start);
  const e = toMinutes(end);
  let total: number | null = null;
  if (s !== null && e !== null) {
    total = e - s;
    if (total < 0) total += 24 * 60; // assume next day
  }

  return (
    <div>
      <div className="row">
        <div className="field"><label>Start time</label><input type="time" className="input" value={start} onChange={(e) => setStart(e.target.value)} /></div>
        <div className="field"><label>End time</label><input type="time" className="input" value={end} onChange={(e) => setEnd(e.target.value)} /></div>
      </div>

      {total !== null && (
        <div className="stats">
          <div className="stat"><div className="n">{Math.floor(total / 60)}h {total % 60}m</div><div className="l">Duration</div></div>
          <div className="stat"><div className="n">{total}</div><div className="l">Total minutes</div></div>
          <div className="stat"><div className="n">{(total / 60).toFixed(2)}</div><div className="l">Decimal hours</div></div>
        </div>
      )}
      <p className="privacy-note">🔒 Calculated instantly in your browser. End before start is treated as the next day.</p>
    </div>
  );
}
