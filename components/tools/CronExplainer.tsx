"use client";

import { useState } from "react";

// Parse one cron field into the set of allowed values in [min,max].
function parseField(field: string, min: number, max: number): number[] | null {
  const out = new Set<number>();
  for (const part of field.split(",")) {
    const stepMatch = part.match(/^(.+?)\/(\d+)$/);
    const step = stepMatch ? parseInt(stepMatch[2], 10) : 1;
    const range = stepMatch ? stepMatch[1] : part;
    let lo = min, hi = max;
    if (range !== "*") {
      const rm = range.match(/^(\d+)(?:-(\d+))?$/);
      if (!rm) return null;
      lo = parseInt(rm[1], 10);
      hi = rm[2] !== undefined ? parseInt(rm[2], 10) : (stepMatch ? max : lo);
    }
    if (lo < min || hi > max || lo > hi || step < 1) return null;
    for (let v = lo; v <= hi; v += step) out.add(v);
  }
  return [...out].sort((a, b) => a - b);
}

const DOW = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const MON = ["", "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

function describe(f: string[], sets: number[][]): string {
  const [min, hr, dom, mon, dow] = f;
  const everyMin = min === "*", everyHr = hr === "*";
  let time: string;
  if (everyMin && everyHr) time = "every minute";
  else if (everyHr) time = `every hour at minute ${min}`;
  else if (everyMin) time = `every minute during hour ${hr}`;
  else time = `at ${sets[1].map((h) => `${String(h).padStart(2, "0")}:${String(sets[0][0]).padStart(2, "0")}`).join(", ")}`;

  const parts = [time];
  if (dom !== "*") parts.push(`on day-of-month ${sets[2].join(", ")}`);
  if (mon !== "*") parts.push(`in ${sets[3].map((m) => MON[m]).join(", ")}`);
  if (dow !== "*") parts.push(`on ${sets[4].map((d) => DOW[d % 7]).join(", ")}`);
  return parts.join(", ");
}

function nextRuns(sets: number[][], n: number): string[] {
  const [mins, hrs, doms, mons, dows] = sets.map((s) => new Set(s));
  const out: string[] = [];
  const d = new Date();
  d.setSeconds(0, 0);
  d.setMinutes(d.getMinutes() + 1);
  for (let i = 0; i < 525600 && out.length < n; i++) {
    if (
      mins.has(d.getMinutes()) && hrs.has(d.getHours()) &&
      doms.has(d.getDate()) && mons.has(d.getMonth() + 1) && dows.has(d.getDay())
    ) {
      out.push(d.toLocaleString());
    }
    d.setMinutes(d.getMinutes() + 1);
  }
  return out;
}

export default function CronExplainer() {
  const [expr, setExpr] = useState("0 9 * * 1-5");

  const fields = expr.trim().split(/\s+/);
  let error: string | null = null;
  let desc = "";
  let runs: string[] = [];

  if (fields.length !== 5) {
    error = "Enter a 5-field cron expression: minute hour day-of-month month day-of-week.";
  } else {
    const ranges: [number, number][] = [[0, 59], [0, 23], [1, 31], [1, 12], [0, 6]];
    const sets = fields.map((f, i) => parseField(f, ranges[i][0], ranges[i][1]));
    if (sets.some((s) => s === null)) error = "One of the fields is invalid.";
    else {
      const valid = sets as number[][];
      desc = "Runs " + describe(fields, valid) + ".";
      runs = nextRuns(valid, 5);
    }
  }

  return (
    <div>
      <div className="field">
        <label>Cron expression</label>
        <input className="input mono" value={expr} onChange={(e) => setExpr(e.target.value)} placeholder="0 9 * * 1-5" />
        <p style={{ color: "var(--muted)", fontSize: ".78rem", marginTop: 6 }}>Format: minute hour day-of-month month day-of-week</p>
      </div>

      {error && <p style={{ color: "#ff6b6b" }}>{error}</p>}

      {!error && (
        <>
          <div className="stat" style={{ marginBottom: 14 }}>
            <div className="n" style={{ fontSize: "1.05rem" }}>{desc}</div>
            <div className="l">Schedule</div>
          </div>
          <div className="field">
            <label>Next runs</label>
            <ul className="file-list">
              {runs.length ? runs.map((r, i) => <li key={i} className="mono">{r}</li>) : <li>No upcoming runs within a year.</li>}
            </ul>
          </div>
        </>
      )}
      <p className="privacy-note">🔒 Parsed locally in your browser.</p>
    </div>
  );
}
