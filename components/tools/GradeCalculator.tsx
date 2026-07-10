"use client";

import { useState, useMemo } from "react";

interface Item {
  id: number;
  name: string;
  score: string;
  weight: string;
}

let nextId = 1;

export default function GradeCalculator() {
  const [mode, setMode] = useState<"weighted" | "points">("weighted");
  const [items, setItems] = useState<Item[]>([{ id: nextId++, name: "Assignment 1", score: "", weight: "" }]);
  const [target, setTarget] = useState("90");

  const result = useMemo(() => {
    const parsed = items.map((it) => ({
      ...it,
      score: parseFloat(it.score),
      weight: parseFloat(it.weight),
    }));

    if (mode === "weighted") {
      const graded = parsed.filter((p) => !isNaN(p.score) && !isNaN(p.weight));
      const totalWeight = graded.reduce((s, p) => s + p.weight, 0);
      const weightedSum = graded.reduce((s, p) => s + (p.score * p.weight) / 100, 0);
      const currentPct = totalWeight > 0 ? (weightedSum / totalWeight) * 100 : 0;
      const targetPct = parseFloat(target);
      const remainingWeight = 100 - totalWeight;
      let needed = null;
      if (remainingWeight > 0 && targetPct) {
        needed = ((targetPct - currentPct * totalWeight / 100) / remainingWeight) * 100;
      }
      return { current: Math.round(currentPct * 10) / 10, needed: needed !== null ? Math.round(needed * 10) / 10 : null, totalWeight, remainingWeight };
    } else {
      const graded = parsed.filter((p) => !isNaN(p.score));
      const total = graded.reduce((s, p) => s + p.score, 0);
      const targetPct = parseFloat(target);
      const current = items.length > 0 ? total / items.length : 0;
      return { current: Math.round(current * 10) / 10, needed: targetPct ? Math.round((targetPct - current + current) * 10) / 10 : null, totalWeight: items.length, remainingWeight: 0 };
    }
  }, [mode, items, target]);

  function addRow() { setItems((prev) => [...prev, { id: nextId++, name: `Item ${items.length + 1}`, score: "", weight: "" }]); }
  function removeRow(id: number) { setItems((prev) => prev.filter((i) => i.id !== id)); }
  function updateRow(id: number, patch: Partial<Item>) { setItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...patch } : i))); }

  return (
    <div>
      <div className="field" style={{ maxWidth: 200 }}>
        <label>Grading mode</label>
        <select className="input" value={mode} onChange={(e) => setMode(e.target.value as typeof mode)}>
          <option value="weighted">Weighted (%)</option>
          <option value="points">Points-based</option>
        </select>
      </div>

      <div className="field">
        <label>Grades</label>
        {items.map((item) => (
          <div key={item.id} style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 6 }}>
            <input className="input" style={{ flex: 1, padding: "8px 10px", fontSize: ".85rem" }} placeholder="Name" value={item.name} onChange={(e) => updateRow(item.id, { name: e.target.value })} />
            <input className="input" style={{ width: 90, padding: "8px 10px", fontSize: ".85rem" }} type="number" placeholder={mode === "weighted" ? "Grade %" : "Points"} value={item.score} onChange={(e) => updateRow(item.id, { score: e.target.value })} />
            {mode === "weighted" && <input className="input" style={{ width: 80, padding: "8px 10px", fontSize: ".85rem" }} type="number" placeholder="Weight %" value={item.weight} onChange={(e) => updateRow(item.id, { weight: e.target.value })} />}
            <button type="button" style={{ background: "none", border: "1px solid var(--border)", borderRadius: 7, color: "var(--muted)", cursor: "pointer", padding: "6px 10px", fontSize: ".82rem" }} onClick={() => removeRow(item.id)} aria-label="Remove">✕</button>
          </div>
        ))}
        <button type="button" className="btn secondary" style={{ padding: "8px 14px", fontSize: ".85rem" }} onClick={addRow}>+ Add item</button>
      </div>

      <div className="field" style={{ maxWidth: 180 }}>
        <label>Target grade</label>
        <input className="input" type="number" min={0} max={100} value={target} onChange={(e) => setTarget(e.target.value)} />
      </div>

      <div className="stats">
        <div className="stat"><div className="n" style={{ color: result.current >= 90 ? "var(--ok)" : result.current >= 70 ? "#d9944b" : "var(--danger)" }}>{result.current}%</div><div className="l">Current grade</div></div>
        {result.needed !== null && (
          <div className="stat">
            <div className="n" style={{ color: result.needed <= 100 ? "var(--ok)" : "var(--danger)" }}>{result.needed}%</div>
            <div className="l">Needed on remaining</div>
          </div>
        )}
        <div className="stat"><div className="n">{result.totalWeight}{mode === "weighted" ? "%" : " items"}</div><div className="l">Graded so far</div></div>
      </div>

      <p className="privacy-note">🔒 All calculations run in your browser. No data is stored or uploaded.</p>
    </div>
  );
}
