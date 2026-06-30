"use client";

import { useState } from "react";

const GRADES: Record<string, number> = {
  "A+": 4.0, A: 4.0, "A-": 3.7,
  "B+": 3.3, B: 3.0, "B-": 2.7,
  "C+": 2.3, C: 2.0, "C-": 1.7,
  "D+": 1.3, D: 1.0, F: 0.0,
};

interface Course { id: number; grade: string; credits: string; }

let nextId = 1;

export default function GpaCalculator() {
  const [courses, setCourses] = useState<Course[]>([
    { id: nextId++, grade: "A", credits: "3" },
    { id: nextId++, grade: "B+", credits: "3" },
  ]);

  function update(id: number, patch: Partial<Course>) {
    setCourses((cs) => cs.map((c) => (c.id === id ? { ...c, ...patch } : c)));
  }
  function add() { setCourses((cs) => [...cs, { id: nextId++, grade: "A", credits: "3" }]); }
  function remove(id: number) { setCourses((cs) => cs.filter((c) => c.id !== id)); }

  let points = 0, credits = 0;
  for (const c of courses) {
    const cr = parseFloat(c.credits);
    if (cr > 0 && c.grade in GRADES) { points += GRADES[c.grade] * cr; credits += cr; }
  }
  const gpa = credits > 0 ? points / credits : 0;

  return (
    <div>
      <ul className="file-list">
        {courses.map((c, i) => (
          <li key={c.id} style={{ gap: 8 }}>
            <span style={{ color: "var(--muted)" }}>{i + 1}.</span>
            <select className="input" style={{ maxWidth: 90 }} value={c.grade} onChange={(e) => update(c.id, { grade: e.target.value })}>
              {Object.keys(GRADES).map((g) => <option key={g} value={g}>{g}</option>)}
            </select>
            <input type="number" className="input" style={{ maxWidth: 110 }} value={c.credits} min={0} placeholder="Credits" onChange={(e) => update(c.id, { credits: e.target.value })} />
            <span className="x" onClick={() => remove(c.id)} title="Remove" style={{ marginLeft: "auto" }}>✕</span>
          </li>
        ))}
      </ul>

      <button className="btn secondary" onClick={add} style={{ marginBottom: 16 }}>+ Add course</button>

      <div className="stats">
        <div className="stat"><div className="n">{gpa.toFixed(2)}</div><div className="l">GPA (4.0 scale)</div></div>
        <div className="stat"><div className="n">{credits}</div><div className="l">Total credits</div></div>
      </div>

      <p className="privacy-note">🔒 Calculated instantly in your browser.</p>
    </div>
  );
}
