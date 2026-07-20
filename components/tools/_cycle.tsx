"use client";

// Shared primitives for the women's-health / cycle calculators.
// Self-contained: date helpers, a month-calendar with phase highlighting,
// and a legend — all themed with the Graphite CSS variables.

export type DayKind = "period" | "fertile" | "ovulation" | "due" | "normal";

export function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}
export function addDays(d: Date, n: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}
export function diffDays(a: Date, b: Date) {
  return Math.round((startOfDay(a).getTime() - startOfDay(b).getTime()) / 86400000);
}
export function sameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}
export const fmtLong = (d: Date) =>
  d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" });
export const fmtShort = (d: Date) =>
  d.toLocaleDateString("en-US", { month: "short", day: "numeric" });

/** Collect the unique (year, month) pairs covering the given dates, in order. */
export function monthsCovering(dates: Date[]): { year: number; month: number }[] {
  const seen = new Set<string>();
  const out: { year: number; month: number }[] = [];
  for (const d of dates) {
    const k = `${d.getFullYear()}-${d.getMonth()}`;
    if (!seen.has(k)) {
      seen.add(k);
      out.push({ year: d.getFullYear(), month: d.getMonth() });
    }
  }
  return out;
}

export function MonthCalendar({
  year,
  month,
  kindFor,
  isToday,
}: {
  year: number;
  month: number;
  kindFor: (d: Date) => DayKind;
  isToday?: (d: Date) => boolean;
}) {
  const monthName = new Date(year, month, 1).toLocaleDateString("en-US", { month: "long", year: "numeric" });
  const firstDow = new Date(year, month, 1).getDay();
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
          const today = isToday?.(d);
          return (
            <span key={i} className={`mo-cell mo-${kind}${today ? " mo-today" : ""}`}>
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
        .mo-today { outline: 2px solid var(--text); outline-offset: 1px; }
      `}</style>
    </div>
  );
}

export function CycleLegend({ items }: { items: { cls: string; label: string }[] }) {
  return (
    <div className="ovu-legend">
      {items.map((it) => (
        <span key={it.label} className="ovu-lg"><i className={`dot ${it.cls}`} />{it.label}</span>
      ))}
      <style jsx>{`
        .ovu-legend {
          display: flex; flex-wrap: wrap; gap: 16px; margin-top: 16px;
          font-size: 0.78rem; color: var(--muted);
        }
        .ovu-lg { display: inline-flex; align-items: center; gap: 7px; }
        .ovu-lg .dot { width: 11px; height: 11px; border-radius: 50%; display: inline-block; }
        .ovu-lg .dot.period { background: color-mix(in srgb, #e11d48 30%, transparent); box-shadow: inset 0 0 0 1.5px color-mix(in srgb, #e11d48 60%, transparent); }
        .ovu-lg .dot.fertile { background: var(--accent-soft); box-shadow: inset 0 0 0 1.5px var(--ring); }
        .ovu-lg .dot.ovulation { background: var(--accent); }
        .ovu-lg .dot.due { background: transparent; box-shadow: inset 0 0 0 1.5px color-mix(in srgb, var(--ok) 60%, transparent); }
      `}</style>
    </div>
  );
}

/** Progress ring used by pregnancy tools. size in px, value 0..1. */
export function ProgressRing({
  value,
  size = 132,
  stroke = 11,
  label,
  sub,
}: {
  value: number;
  size?: number;
  stroke?: number;
  label: string;
  sub?: string;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const clamped = Math.max(0, Math.min(1, value));
  return (
    <div className="ring" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--surface-3)" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--accent)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - clamped)}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: "stroke-dashoffset .5s var(--ease-out)" }}
        />
      </svg>
      <div className="ring-c">
        <div className="ring-n">{label}</div>
        {sub && <div className="ring-s">{sub}</div>}
      </div>
      <style jsx>{`
        .ring { position: relative; display: inline-grid; place-items: center; flex: none; }
        .ring svg { position: absolute; inset: 0; }
        .ring-c { text-align: center; }
        .ring-n {
          font-family: var(--font-display), sans-serif; font-weight: 700; font-size: 1.5rem;
          letter-spacing: -0.02em; color: var(--text); line-height: 1;
        }
        .ring-s {
          font-family: var(--font-mono), monospace; font-size: 0.6rem; color: var(--muted);
          text-transform: uppercase; letter-spacing: 0.06em; margin-top: 5px;
        }
      `}</style>
    </div>
  );
}
