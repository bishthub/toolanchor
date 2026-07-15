"use client";

import { useState, useMemo } from "react";

export default function DaysUntilCalculator({ preset }: { preset?: Record<string, string> }) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [targetDate, setTargetDate] = useState(() => {
    // Preset pages pass a recurring month/day (e.g. Christmas: m=12, d=25) —
    // resolve to the next occurrence so the page is evergreen.
    const m = Number(preset?.m), d = Number(preset?.d);
    if (m >= 1 && m <= 12 && d >= 1 && d <= 31) {
      const next = new Date(today.getFullYear(), m - 1, d);
      if (next < today) next.setFullYear(next.getFullYear() + 1);
      // Format as local yyyy-mm-dd (toISOString would shift across UTC midnight).
      const pad = (n: number) => String(n).padStart(2, "0");
      return `${next.getFullYear()}-${pad(next.getMonth() + 1)}-${pad(next.getDate())}`;
    }
    const next = new Date(today);
    next.setDate(next.getDate() + 7);
    return next.toISOString().slice(0, 10);
  });

  const result = useMemo(() => {
    const target = new Date(targetDate + "T00:00:00");
    if (isNaN(target.getTime())) return null;

    const diff = target.getTime() - today.getTime();
    const diffDays = Math.round(diff / (1000 * 60 * 60 * 24));

    const isPast = diff < 0;
    const absDays = Math.abs(diffDays);
    const weeks = Math.floor(absDays / 7);
    const remainingDays = absDays % 7;
    const months = Math.floor(absDays / 30.44);
    const years = Math.floor(absDays / 365.25);
    const hours = absDays * 24;
    const minutes = absDays * 24 * 60;

    return {
      absDays,
      weeks,
      remainingDays,
      months,
      years,
      hours,
      minutes,
      isPast,
      dateStr: target.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" }),
    };
  }, [targetDate]);

  return (
    <div>
      <div className="field" style={{ maxWidth: 280 }}>
        <label>Target date</label>
        <input
          className="input"
          type="date"
          value={targetDate}
          onChange={(e) => setTargetDate(e.target.value)}
        />
      </div>

      {result && (
        <>
          <p style={{ color: "var(--muted)", fontSize: ".9rem", margin: "4px 0 16px" }}>
            {result.dateStr}
          </p>

          <div className="stats">
            <div className="stat">
              <div className="n" style={{ color: result.isPast ? "var(--muted)" : "var(--accent)" }}>
                {result.absDays.toLocaleString()}
              </div>
              <div className="l">{result.isPast ? "Days ago" : "Days until"}</div>
            </div>
            <div className="stat">
              <div className="n">{result.weeks}w {result.remainingDays}d</div>
              <div className="l">Weeks / days</div>
            </div>
            <div className="stat">
              <div className="n">{result.months}</div>
              <div className="l">Months</div>
            </div>
            <div className="stat">
              <div className="n">{result.years}</div>
              <div className="l">Years</div>
            </div>
            <div className="stat">
              <div className="n">{result.hours.toLocaleString()}</div>
              <div className="l">Hours</div>
            </div>
            <div className="stat">
              <div className="n">{result.minutes.toLocaleString()}</div>
              <div className="l">Minutes</div>
            </div>
          </div>
        </>
      )}

      <p className="privacy-note">🔒 All calculations run in your browser. No data is stored or uploaded.</p>
    </div>
  );
}
