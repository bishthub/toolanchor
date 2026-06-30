"use client";

import { useState } from "react";

type Order = "az" | "za" | "num" | "len";

export default function SortTextLines() {
  const [text, setText] = useState("");
  const [order, setOrder] = useState<Order>("az");
  const [dedupe, setDedupe] = useState(false);
  const [trimBlank, setTrimBlank] = useState(true);
  const [copied, setCopied] = useState(false);

  function result(): string {
    let lines = text.split(/\r?\n/);
    if (trimBlank) lines = lines.filter((l) => l.trim() !== "");
    if (dedupe) lines = [...new Set(lines)];
    const sorters: Record<Order, (a: string, b: string) => number> = {
      az: (a, b) => a.localeCompare(b),
      za: (a, b) => b.localeCompare(a),
      num: (a, b) => (parseFloat(a) || 0) - (parseFloat(b) || 0),
      len: (a, b) => a.length - b.length,
    };
    return [...lines].sort(sorters[order]).join("\n");
  }
  const out = result();

  async function copy() { await navigator.clipboard.writeText(out); setCopied(true); setTimeout(() => setCopied(false), 1200); }

  return (
    <div>
      <div className="field">
        <label>Lines</label>
        <textarea value={text} onChange={(e) => setText(e.target.value)} placeholder={"banana\napple\ncherry"} />
      </div>
      <div className="field">
        <label>Sort order</label>
        <div className="row">
          {([["az", "A → Z"], ["za", "Z → A"], ["num", "Numeric"], ["len", "By length"]] as [Order, string][]).map(([o, l]) => (
            <button key={o} type="button" className={`btn ${order === o ? "" : "secondary"}`} onClick={() => setOrder(o)}>{l}</button>
          ))}
        </div>
      </div>
      <div className="row" style={{ marginBottom: 14 }}>
        <label style={{ display: "flex", gap: 6, alignItems: "center", color: "var(--muted)", fontSize: ".9rem" }}>
          <input type="checkbox" checked={dedupe} onChange={(e) => setDedupe(e.target.checked)} /> Remove duplicates
        </label>
        <label style={{ display: "flex", gap: 6, alignItems: "center", color: "var(--muted)", fontSize: ".9rem" }}>
          <input type="checkbox" checked={trimBlank} onChange={(e) => setTrimBlank(e.target.checked)} /> Remove blank lines
        </label>
      </div>
      <div className="field">
        <label>Result</label>
        <textarea readOnly value={out} />
      </div>
      <button className="btn" onClick={copy} disabled={!out}>{copied ? "✓ Copied" : "Copy result"}</button>
      <p className="privacy-note">🔒 Sorted locally in your browser.</p>
    </div>
  );
}
