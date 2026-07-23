"use client";

import { useState, useMemo } from "react";

type DayKind = "period" | "fertile" | "ovulation" | "due" | "normal";

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function addDays(d: Date, n: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

function sameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export default function OvulationCalculator() {
  const [lmp, setLmp] = useState("");
  const [cycle, setCycle] = useState("28");

  const result = useMemo(() => {
    if (!lmp) return null;
    const start = startOfDay(new Date(lmp + "T00:00:00"));
    if (isNaN(start.getTime())) return null;
    const cycleLen = Math.min(45, Math.max(20, parseInt(cycle, 10) || 28));
    const ovDay = cycleLen - 14; // luteal phase ~14 days
    const ovulation = addDays(start, ovDay);
    const fertileStart = addDays(ovulation, -5);
    const fertileEnd = new Date(ovulation);
    const periodEnd = addDays(start, 4); // ~5 day period
    const nextPeriod = addDays(start, cycleLen);
    const dueDate = addDays(ovulation, 266); // 38 weeks from conception
    return { start, cycleLen, ovDay, ovulation, fertileStart, fertileEnd, periodEnd, nextPeriod, dueDate };
  }, [lmp, cycle]);

  const fmt = (d: Date) => d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" });
  const fmtShort = (d: Date) => d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  const fmtRange = (a: Date, b: Date) =>
    a.getMonth() === b.getMonth()
      ? `${a.toLocaleDateString("en-US", { month: "short", day: "numeric" })} – ${b.getDate()}`
      : `${a.toLocaleDateString("en-US", { month: "short", day: "numeric" })} – ${b.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;

  // Classify a calendar date into its cycle phase
  const kindFor = (d: Date): DayKind => {
    if (!result) return "normal";
    if (sameDay(d, result.ovulation)) return "ovulation";
    if (sameDay(d, result.dueDate)) return "due";
    if (d >= result.fertileStart && d <= result.fertileEnd) return "fertile";
    if (d >= result.start && d <= result.periodEnd) return "period";
    return "normal";
  };

  // Which months to render: the period/ovulation month(s)
  const months = useMemo(() => {
    if (!result) return [] as { year: number; month: number }[];
    const keys = new Set<string>();
    const list: { year: number; month: number }[] = [];
    for (const d of [result.start, result.ovulation]) {
      const k = `${d.getFullYear()}-${d.getMonth()}`;
      if (!keys.has(k)) {
        keys.add(k);
        list.push({ year: d.getFullYear(), month: d.getMonth() });
      }
    }
    return list;
  }, [result]);

  // Cycle timeline segments (proportional to cycle length)
  const phases = useMemo(() => {
    if (!result) return [];
    const { cycleLen, ovDay } = result;
    return [
      { label: "Period", from: 1, to: 5, cls: "period" },
      { label: "Follicular", from: 6, to: ovDay - 6, cls: "follicular" },
      { label: "Fertile", from: ovDay - 5, to: ovDay, cls: "fertile" },
      { label: "Luteal", from: ovDay + 1, to: cycleLen, cls: "luteal" },
    ].filter((p) => p.to >= p.from);
  }, [result]);

  return (
    <div className="ovu">
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

      {!result && (
        <div className="ovu-empty">
          <div className="ovu-empty-ico" aria-hidden="true">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" />
            </svg>
          </div>
          <p>Enter the first day of your last period to see your <strong>fertile window</strong>, <strong>ovulation day</strong> and <strong>estimated due date</strong>.</p>
        </div>
      )}

      {result && (
        <>
          {/* Headline answers — the numbers people came for, up front */}
          <div className="ovu-hero">
            <div className="ovu-hcard ovu-hcard--accent">
              <div className="ovu-hk">Ovulation day</div>
              <div className="ovu-hv">{fmtShort(result.ovulation)}</div>
              <div className="ovu-hm">Cycle day {result.ovDay}</div>
            </div>
            <div className="ovu-hcard">
              <div className="ovu-hk">Fertile window</div>
              <div className="ovu-hv">{fmtRange(result.fertileStart, result.fertileEnd)}</div>
              <div className="ovu-hm">Your 6 most fertile days</div>
            </div>
            <div className="ovu-hcard">
              <div className="ovu-hk">Estimated due date</div>
              <div className="ovu-hv">{fmtShort(result.dueDate)}</div>
              <div className="ovu-hm">If you conceive this cycle</div>
            </div>
          </div>

          {/* Cycle phase timeline */}
          <div className="ovu-tl">
            <div className="ovu-tl-bar">
              {phases.map((p) => {
                const span = p.to - p.from + 1;
                return (
                  <div
                    key={p.label}
                    className={`ovu-seg ovu-seg--${p.cls}`}
                    style={{ flex: span }}
                    title={`${p.label}: day ${p.from}–${p.to}`}
                  >
                    <span className="ovu-seg-lbl">{p.label}</span>
                  </div>
                );
              })}
              {/* Ovulation marker */}
              <div
                className="ovu-tl-mark"
                style={{ left: `${((result.ovDay - 0.5) / result.cycleLen) * 100}%` }}
                title={`Ovulation — cycle day ${result.ovDay}`}
              >
                <span className="ovu-tl-mark-dot" />
                <span className="ovu-tl-mark-lbl">Day {result.ovDay}</span>
              </div>
            </div>
            <div className="ovu-tl-axis">
              <span>Day 1</span>
              <span>Day {result.cycleLen}</span>
            </div>
          </div>

          {/* Calendar */}
          <div className="ovu-cals">
            {months.map(({ year, month }) => (
              <Month key={`${year}-${month}`} year={year} month={month} kindFor={kindFor} />
            ))}
          </div>

          {/* Legend */}
          <div className="ovu-legend">
            <span className="ovu-lg"><i className="dot period" />Period</span>
            <span className="ovu-lg"><i className="dot fertile" />Fertile window</span>
            <span className="ovu-lg"><i className="dot ovulation" />Ovulation</span>
          </div>

          {/* Full date breakdown */}
          <div className="ovu-dates">
            <div className="ovu-drow"><span className="ovu-dl">Fertile window starts</span><span className="ovu-dv">{fmt(result.fertileStart)}</span></div>
            <div className="ovu-drow"><span className="ovu-dl">Ovulation day</span><span className="ovu-dv">{fmt(result.ovulation)}</span></div>
            <div className="ovu-drow"><span className="ovu-dl">Fertile window ends</span><span className="ovu-dv">{fmt(result.fertileEnd)}</span></div>
            <div className="ovu-drow"><span className="ovu-dl">Next period expected</span><span className="ovu-dv">{fmt(result.nextPeriod)}</span></div>
            <div className="ovu-drow"><span className="ovu-dl">Estimated due date</span><span className="ovu-dv">{fmt(result.dueDate)}</span></div>
          </div>
        </>
      )}

      <p className="privacy-note">🔒 All calculations run in your browser. Based on average cycle data — not a substitute for medical advice.</p>

      <style jsx>{`
        .ovu-empty {
          margin-top: 8px; display: flex; align-items: center; gap: 14px;
          padding: 18px 20px; border: 1px dashed var(--border); border-radius: var(--radius);
          background: var(--bg-2); color: var(--muted); font-size: 0.9rem; line-height: 1.55;
        }
        .ovu-empty strong { color: var(--text); font-weight: 600; }
        .ovu-empty-ico {
          flex: none; width: 44px; height: 44px; border-radius: 12px; display: grid; place-items: center;
          color: var(--accent); background: var(--accent-soft); border: 1px solid var(--ring);
        }
        /* Headline result cards */
        .ovu-hero {
          display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
          gap: 12px; margin-top: 22px;
        }
        .ovu-hcard {
          padding: 16px 16px 15px; border: 1px solid var(--border); border-radius: var(--radius);
          background: var(--bg-2);
        }
        .ovu-hcard--accent {
          background: var(--accent-soft); border-color: var(--ring);
          box-shadow: 0 0 0 1px var(--ring), var(--shadow-sm);
        }
        .ovu-hk {
          font-family: var(--font-mono), monospace; font-size: 0.62rem; letter-spacing: 0.07em;
          text-transform: uppercase; color: var(--muted); margin-bottom: 8px;
        }
        .ovu-hcard--accent .ovu-hk { color: var(--accent); }
        .ovu-hv {
          font-family: var(--font-display), sans-serif; font-weight: 700; font-size: 1.28rem;
          letter-spacing: -0.02em; line-height: 1.15; color: var(--text);
        }
        .ovu-hcard--accent .ovu-hv { color: var(--accent); }
        .ovu-hm { margin-top: 5px; font-size: 0.76rem; color: var(--muted); }
        /* Full date breakdown */
        .ovu-dates {
          margin-top: 24px; border: 1px solid var(--border); border-radius: var(--radius);
          overflow: hidden; background: var(--bg-2);
        }
        .ovu-drow {
          display: flex; justify-content: space-between; align-items: center; gap: 12px;
          padding: 12px 16px; border-bottom: 1px solid var(--border); font-size: 0.9rem;
        }
        .ovu-drow:last-child { border-bottom: none; }
        .ovu-dl { color: var(--muted); }
        .ovu-dv { font-weight: 600; color: var(--text); font-variant-numeric: tabular-nums; }
        /* Timeline */
        .ovu-tl { margin-top: 22px; }
        .ovu-tl-bar {
          position: relative; display: flex; gap: 3px; height: 44px;
          border-radius: var(--radius-sm); overflow: visible;
        }
        .ovu-seg {
          display: flex; align-items: center; justify-content: center;
          min-width: 0; padding: 0 6px; border-radius: 6px;
          font-family: var(--font-mono), monospace; font-size: 0.6rem;
          text-transform: uppercase; letter-spacing: 0.06em;
          overflow: hidden;
        }
        .ovu-seg-lbl { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .ovu-seg--period { background: color-mix(in srgb, #e11d48 15%, transparent); color: color-mix(in srgb, #e11d48 70%, var(--text)); }
        .ovu-seg--follicular { background: var(--surface-2); color: var(--faint); }
        .ovu-seg--fertile { background: var(--accent-soft); color: var(--accent); border: 1px solid var(--ring); }
        .ovu-seg--luteal { background: var(--surface-2); color: var(--faint); }
        .ovu-tl-mark {
          position: absolute; top: -6px; bottom: -6px; transform: translateX(-50%);
          display: flex; flex-direction: column; align-items: center; pointer-events: none;
        }
        .ovu-tl-mark-dot {
          width: 14px; height: 14px; border-radius: 50%;
          background: var(--accent); border: 3px solid var(--surface);
          box-shadow: 0 0 0 1px var(--accent); margin-top: -1px;
        }
        .ovu-tl-mark-lbl {
          margin-top: auto; font-family: var(--font-mono), monospace; font-size: 0.58rem;
          color: var(--accent); font-weight: 600; white-space: nowrap;
        }
        .ovu-tl-axis {
          display: flex; justify-content: space-between; margin-top: 8px;
          font-family: var(--font-mono), monospace; font-size: 0.6rem; color: var(--faint);
          text-transform: uppercase; letter-spacing: 0.05em;
        }
        /* Calendar */
        .ovu-cals {
          display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          gap: 16px; margin-top: 26px;
        }
        /* Legend */
        .ovu-legend {
          display: flex; flex-wrap: wrap; gap: 16px; margin-top: 16px;
          font-size: 0.78rem; color: var(--muted);
        }
        .ovu-lg { display: inline-flex; align-items: center; gap: 7px; }
        .ovu-lg .dot { width: 11px; height: 11px; border-radius: 50%; display: inline-block; }
        .ovu-lg .dot.period { background: color-mix(in srgb, #e11d48 30%, transparent); box-shadow: inset 0 0 0 1.5px color-mix(in srgb, #e11d48 60%, transparent); }
        .ovu-lg .dot.fertile { background: var(--accent-soft); box-shadow: inset 0 0 0 1.5px var(--ring); }
        .ovu-lg .dot.ovulation { background: var(--accent); }
      `}</style>
    </div>
  );
}

function Month({ year, month, kindFor }: { year: number; month: number; kindFor: (d: Date) => DayKind }) {
  const monthName = new Date(year, month, 1).toLocaleDateString("en-US", { month: "long", year: "numeric" });
  const firstDow = new Date(year, month, 1).getDay(); // 0 = Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (Date | null)[] = [];
  for (let i = 0; i < firstDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));

  return (
    <div className="mo">
      <div className="mo-title">{monthName}</div>
      <div className="mo-grid mo-dow">
        {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
          <span key={i} className="mo-dowc">{d}</span>
        ))}
      </div>
      <div className="mo-grid">
        {cells.map((d, i) => {
          if (!d) return <span key={i} className="mo-cell mo-empty" />;
          const kind = kindFor(d);
          return (
            <span key={i} className={`mo-cell mo-${kind}`}>
              {d.getDate()}
              {kind === "ovulation" && <i className="mo-ov" />}
            </span>
          );
        })}
      </div>
      <style jsx>{`
        .mo {
          border: 1px solid var(--border); border-radius: var(--radius-sm);
          padding: 14px 14px 16px; background: var(--bg-2);
        }
        .mo-title {
          font-family: var(--font-display), sans-serif; font-weight: 700;
          font-size: 0.95rem; letter-spacing: -0.01em; margin-bottom: 12px; color: var(--text);
        }
        .mo-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 3px; }
        .mo-dow { margin-bottom: 4px; }
        .mo-dowc {
          text-align: center; font-family: var(--font-mono), monospace; font-size: 0.6rem;
          color: var(--faint); text-transform: uppercase;
        }
        .mo-cell {
          position: relative; aspect-ratio: 1; display: flex; align-items: center; justify-content: center;
          font-size: 0.82rem; border-radius: 8px; color: var(--text);
          font-variant-numeric: tabular-nums; transition: transform 0.12s var(--ease-out);
        }
        .mo-empty { visibility: hidden; }
        .mo-period {
          background: color-mix(in srgb, #e11d48 13%, transparent);
          color: color-mix(in srgb, #e11d48 72%, var(--text)); font-weight: 600;
        }
        .mo-fertile {
          background: var(--accent-soft); color: var(--accent);
          box-shadow: inset 0 0 0 1px var(--ring); font-weight: 600;
        }
        .mo-ovulation {
          background: var(--accent); color: var(--accent-ink); font-weight: 700;
          box-shadow: 0 4px 12px var(--ring);
        }
        .mo-ovulation:hover { transform: scale(1.08); }
        .mo-ov {
          position: absolute; bottom: 3px; left: 50%; transform: translateX(-50%);
          width: 4px; height: 4px; border-radius: 50%; background: var(--accent-ink);
        }
        .mo-due {
          background: transparent; color: var(--ok); font-weight: 700;
          box-shadow: inset 0 0 0 1.5px color-mix(in srgb, var(--ok) 45%, transparent);
        }
      `}</style>
    </div>
  );
}
