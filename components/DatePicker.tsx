"use client";

// ─────────────────────────────────────────────────────────────────────────
// DatePicker — a friendlier alternative to <input type="date">.
//  • Type naturally: "2026-01-12", "12 Jan 2026", "today", "3 weeks ago",
//    even "18 years ago" — with a live "parsed as" preview.
//  • Or pick from a calendar with instant month/year jumping (no endless
//    clicking to reach 1990) and full keyboard navigation.
//  • Emits / accepts ISO "YYYY-MM-DD" strings, so it's a drop-in for the
//    existing date-based tools. Zero dependencies.
// ─────────────────────────────────────────────────────────────────────────

import { useEffect, useMemo, useRef, useState } from "react";

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const MON = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const DOW = ["Su","Mo","Tu","We","Th","Fr","Sa"];
const WD = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

const pad = (n: number) => String(n).padStart(2, "0");
const toISO = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
function fromISO(iso?: string | null): Date | null {
  if (!iso) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) return null;
  const d = new Date(+m[1], +m[2] - 1, +m[3]);
  return isNaN(+d) ? null : d;
}
const long = (d: Date) => `${WD[d.getDay()]}, ${d.getDate()} ${MON[d.getMonth()]} ${d.getFullYear()}`;
const display = (iso: string) => { const d = fromISO(iso); return d ? `${d.getDate()} ${MON[d.getMonth()]} ${d.getFullYear()}` : ""; };
const sameDay = (a: Date | null, b: Date | null) =>
  !!a && !!b && a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

function startOfToday() { const d = new Date(); d.setHours(0, 0, 0, 0); return d; }
function addDays(d: Date, n: number) { const r = new Date(d); r.setDate(r.getDate() + n); return r; }
function addUnit(base: Date, n: number, unit: string) {
  const r = new Date(base);
  if (unit === "day") r.setDate(r.getDate() + n);
  else if (unit === "week") r.setDate(r.getDate() + 7 * n);
  else if (unit === "month") r.setMonth(r.getMonth() + n);
  else r.setFullYear(r.getFullYear() + n);
  return r;
}
function makeValid(y: number, mo: number, da: number): Date | undefined {
  const d = new Date(y, mo - 1, da);
  return d.getFullYear() === y && d.getMonth() === mo - 1 && d.getDate() === da ? d : undefined;
}

/** null = cleared/empty · undefined = unrecognised · Date = parsed. */
function parse(raw: string): Date | null | undefined {
  const s = raw.trim();
  if (!s) return null;
  const lo = s.toLowerCase();
  const today = startOfToday();
  if (lo === "today" || lo === "now") return today;
  if (lo === "yesterday") return addDays(today, -1);
  if (lo === "tomorrow") return addDays(today, 1);

  let m: RegExpMatchArray | null;
  if ((m = lo.match(/^(\d+)\s*(day|week|month|year)s?\s*ago$/))) return addUnit(today, -+m[1], m[2]);
  if ((m = lo.match(/^in\s+(\d+)\s*(day|week|month|year)s?$/))) return addUnit(today, +m[1], m[2]);

  // ISO / year-first: 2026-01-12, 2026/1/12
  if ((m = s.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/))) return makeValid(+m[1], +m[2], +m[3]);

  // Numeric d/m/y (tolerant): infers order when one value is > 12.
  if ((m = s.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{2,4})$/))) {
    const a = +m[1], b = +m[2];
    let y = +m[3];
    if (y < 100) y += y < 50 ? 2000 : 1900;
    let day = a, mo = b;
    if (a > 12 && b <= 12) { day = a; mo = b; }
    else if (b > 12 && a <= 12) { mo = a; day = b; }
    return makeValid(y, mo, day);
  }

  // Month-name formats: "12 Jan 2026", "January 12, 2026"
  const d = new Date(s);
  if (!isNaN(+d)) { d.setHours(0, 0, 0, 0); return d; }
  return undefined;
}

interface Props {
  value: string;                 // ISO "YYYY-MM-DD" or ""
  onChange: (iso: string) => void;
  id?: string;
  min?: string;                  // ISO
  max?: string;                  // ISO
  placeholder?: string;
}

type Mode = "days" | "months" | "years";

export default function DatePicker({ value, onChange, id, min, max, placeholder = "Type a date or pick one…" }: Props) {
  const [text, setText] = useState(() => display(value));
  const [editing, setEditing] = useState(false);
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<Mode>("days");
  const [view, setView] = useState(() => { const d = fromISO(value) || startOfToday(); return { y: d.getFullYear(), m: d.getMonth() }; });
  const [focusISO, setFocusISO] = useState<string | null>(null);

  const wrapRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  const selected = fromISO(value);
  const minD = fromISO(min);
  const maxD = fromISO(max);
  const live = useMemo(() => parse(text), [text]);
  const disabledDay = (d: Date) => (!!minD && d < minD) || (!!maxD && d > stripTime(maxD));

  // Keep the textbox synced to the external value when the user isn't typing.
  useEffect(() => { if (!editing) setText(display(value)); }, [value, editing]);

  // Close on outside click / Escape.
  useEffect(() => {
    if (!open) return;
    function onDown(e: PointerEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") setOpen(false); }
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("pointerdown", onDown); document.removeEventListener("keydown", onKey); };
  }, [open]);

  // When opening, jump the calendar to the selected date (or today).
  useEffect(() => {
    if (!open) return;
    const f = selected || clamp(startOfToday(), minD, maxD);
    setView({ y: f.getFullYear(), m: f.getMonth() });
    setMode("days");
    setFocusISO(toISO(f));
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  // Roving focus inside the day grid.
  useEffect(() => {
    if (open && mode === "days" && focusISO) {
      gridRef.current?.querySelector<HTMLButtonElement>(`[data-d="${focusISO}"]`)?.focus();
    }
  }, [focusISO, open, mode, view]);

  function commit() {
    const r = parse(text);
    if (r === null) { onChange(""); setText(""); }
    else if (r === undefined) { setText(display(value)); }       // revert unrecognised
    else if (disabledDay(r)) { setText(display(value)); }        // reject out of range
    else { const iso = toISO(r); onChange(iso); setText(display(iso)); }
    setEditing(false);
  }

  function pick(d: Date) {
    if (disabledDay(d)) return;
    const iso = toISO(d);
    onChange(iso); setText(display(iso)); setEditing(false); setOpen(false);
  }

  function onInputKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") { e.preventDefault(); commit(); (e.target as HTMLInputElement).blur(); }
    else if (e.key === "ArrowDown" && !open) { e.preventDefault(); setOpen(true); }
  }

  function onGridKey(e: React.KeyboardEvent) {
    if (mode !== "days") return;
    const cur = fromISO(focusISO) || startOfToday();
    let next: Date | null = null;
    switch (e.key) {
      case "ArrowLeft": next = addDays(cur, -1); break;
      case "ArrowRight": next = addDays(cur, 1); break;
      case "ArrowUp": next = addDays(cur, -7); break;
      case "ArrowDown": next = addDays(cur, 7); break;
      case "PageUp": next = addUnit(cur, -1, "month"); break;
      case "PageDown": next = addUnit(cur, 1, "month"); break;
      case "Home": next = addDays(cur, -cur.getDay()); break;
      case "End": next = addDays(cur, 6 - cur.getDay()); break;
      case "Enter": case " ": e.preventDefault(); pick(cur); return;
      default: return;
    }
    e.preventDefault();
    setFocusISO(toISO(next));
    setView({ y: next.getFullYear(), m: next.getMonth() });
  }

  // Build the 6×7 day matrix for the current view.
  const cells = useMemo(() => {
    const first = new Date(view.y, view.m, 1);
    const gridStart = addDays(first, -first.getDay());
    return Array.from({ length: 42 }, (_, i) => addDays(gridStart, i));
  }, [view]);

  const today = startOfToday();
  const invalid = editing && text.trim() !== "" && live === undefined;
  const decadeStart = Math.floor(view.y / 12) * 12;

  function step(dir: 1 | -1) {
    if (mode === "days") { const d = new Date(view.y, view.m + dir, 1); setView({ y: d.getFullYear(), m: d.getMonth() }); }
    else if (mode === "months") setView((v) => ({ ...v, y: v.y + dir }));
    else setView((v) => ({ ...v, y: v.y + dir * 12 }));
  }

  return (
    <div className="dp" ref={wrapRef}>
      <div className={`dp-field ${invalid ? "invalid" : ""} ${open ? "open" : ""}`}>
        <CalIcon />
        <input
          id={id}
          type="text"
          inputMode="numeric"
          autoComplete="off"
          spellCheck={false}
          value={text}
          placeholder={placeholder}
          onChange={(e) => { setText(e.target.value); setEditing(true); }}
          onFocus={() => setEditing(true)}
          onBlur={commit}
          onKeyDown={onInputKey}
          aria-label="Date"
          aria-haspopup="dialog"
          aria-expanded={open}
        />
        <button type="button" className="dp-open" aria-label={open ? "Close calendar" : "Open calendar"} onClick={() => setOpen((o) => !o)}>
          <ChevIcon open={open} />
        </button>
      </div>

      {editing && text.trim() !== "" && (
        <div className={`dp-hint ${invalid ? "bad" : "good"}`}>
          {live instanceof Date ? <>→ {long(live)}</> : "Unrecognised — try “2026-01-12”, “12 Jan 2026” or “18 years ago”"}
        </div>
      )}

      {open && (
        <div className="dp-cal" role="dialog" aria-label="Choose date">
          <div className="dp-head">
            <button type="button" className="dp-nav" onClick={() => step(-1)} aria-label="Previous">‹</button>
            <div className="dp-title">
              {mode === "days" && (
                <>
                  <button type="button" onClick={() => setMode("months")}>{MONTHS[view.m]}</button>
                  <button type="button" onClick={() => setMode("years")}>{view.y}</button>
                </>
              )}
              {mode === "months" && <button type="button" onClick={() => setMode("years")}>{view.y}</button>}
              {mode === "years" && <button type="button">{decadeStart}–{decadeStart + 11}</button>}
            </div>
            <button type="button" className="dp-nav" onClick={() => step(1)} aria-label="Next">›</button>
          </div>

          {mode === "days" && (
            <>
              <div className="dp-dow">{DOW.map((d) => <span key={d}>{d}</span>)}</div>
              <div className="dp-grid" ref={gridRef} role="grid" onKeyDown={onGridKey}>
                {cells.map((d) => {
                  const iso = toISO(d);
                  const off = d.getMonth() !== view.m;
                  const dis = disabledDay(d);
                  const cls = ["dp-day", off ? "muted" : "", sameDay(d, today) ? "today" : "", sameDay(d, selected) ? "selected" : ""].join(" ").trim();
                  return (
                    <button
                      key={iso} type="button" data-d={iso} className={cls}
                      role="gridcell" disabled={dis}
                      tabIndex={focusISO === iso ? 0 : -1}
                      aria-selected={sameDay(d, selected)}
                      aria-label={long(d)}
                      onClick={() => pick(d)}
                    >
                      {d.getDate()}
                    </button>
                  );
                })}
              </div>
            </>
          )}

          {mode === "months" && (
            <div className="dp-quad">
              {MON.map((mname, i) => (
                <button key={mname} type="button" className={`dp-cell ${i === view.m ? "selected" : ""}`}
                  onClick={() => { setView((v) => ({ ...v, m: i })); setMode("days"); }}>
                  {mname}
                </button>
              ))}
            </div>
          )}

          {mode === "years" && (
            <div className="dp-quad">
              {Array.from({ length: 12 }, (_, i) => decadeStart + i).map((yr) => (
                <button key={yr} type="button" className={`dp-cell ${yr === view.y ? "selected" : ""}`}
                  onClick={() => { setView((v) => ({ ...v, y: yr })); setMode("months"); }}>
                  {yr}
                </button>
              ))}
            </div>
          )}

          <div className="dp-presets">
            <button type="button" className="dp-chip" onClick={() => pick(clamp(startOfToday(), minD, maxD))}>Today</button>
            <button type="button" className="dp-chip" onClick={() => pick(clamp(addDays(startOfToday(), -1), minD, maxD))}>Yesterday</button>
            {value && (
              <button type="button" className="dp-chip ghost" onClick={() => { onChange(""); setText(""); setOpen(false); }}>Clear</button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function stripTime(d: Date) { const r = new Date(d); r.setHours(0, 0, 0, 0); return r; }
function clamp(d: Date, lo: Date | null, hi: Date | null) {
  if (lo && d < lo) return lo;
  if (hi && d > hi) return hi;
  return d;
}

function CalIcon() {
  return (
    <svg className="dp-cal-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <rect x="3" y="4.5" width="18" height="16" rx="2.5" />
      <path d="M3 9h18M8 2.5v4M16 2.5v4" />
    </svg>
  );
}
function ChevIcon({ open }: { open: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"
      style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform .2s" }} aria-hidden="true">
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}
