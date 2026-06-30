"use client";

import { useState } from "react";

type Op = { type: "same" | "add" | "del"; line: string };

// Line-based LCS diff.
function diff(a: string[], b: string[]): Op[] {
  const n = a.length, m = b.length;
  const dp: number[][] = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));
  for (let i = n - 1; i >= 0; i--)
    for (let j = m - 1; j >= 0; j--)
      dp[i][j] = a[i] === b[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);

  const ops: Op[] = [];
  let i = 0, j = 0;
  while (i < n && j < m) {
    if (a[i] === b[j]) { ops.push({ type: "same", line: a[i] }); i++; j++; }
    else if (dp[i + 1][j] >= dp[i][j + 1]) { ops.push({ type: "del", line: a[i] }); i++; }
    else { ops.push({ type: "add", line: b[j] }); j++; }
  }
  while (i < n) ops.push({ type: "del", line: a[i++] });
  while (j < m) ops.push({ type: "add", line: b[j++] });
  return ops;
}

export default function TextDiff() {
  const [left, setLeft] = useState("");
  const [right, setRight] = useState("");
  const [ops, setOps] = useState<Op[] | null>(null);

  function compare() {
    setOps(diff(left.split("\n"), right.split("\n")));
  }

  const colors: Record<Op["type"], string> = {
    same: "transparent",
    add: "rgba(79, 224, 166, 0.16)",
    del: "rgba(255, 107, 107, 0.16)",
  };
  const marks: Record<Op["type"], string> = { same: " ", add: "+", del: "−" };

  const added = ops?.filter((o) => o.type === "add").length ?? 0;
  const removed = ops?.filter((o) => o.type === "del").length ?? 0;

  return (
    <div>
      <div className="row">
        <div className="field"><label>Original</label><textarea value={left} onChange={(e) => setLeft(e.target.value)} className="mono" /></div>
        <div className="field"><label>Changed</label><textarea value={right} onChange={(e) => setRight(e.target.value)} className="mono" /></div>
      </div>
      <button className="btn" onClick={compare}>Compare</button>

      {ops && (
        <>
          <p style={{ color: "var(--muted)", fontSize: ".85rem", marginTop: 12 }}>
            <span style={{ color: "var(--ok, #4fe0a6)" }}>+{added} added</span> · <span style={{ color: "#ff6b6b" }}>−{removed} removed</span>
          </p>
          <div className="mono" style={{ background: "var(--bg, #0a0c12)", border: "1px solid var(--border)", borderRadius: 10, padding: 12, overflowX: "auto", fontSize: ".85rem" }}>
            {ops.map((o, i) => (
              <div key={i} style={{ background: colors[o.type], whiteSpace: "pre-wrap", padding: "1px 6px" }}>
                <span style={{ opacity: 0.5, userSelect: "none" }}>{marks[o.type]} </span>{o.line || " "}
              </div>
            ))}
          </div>
        </>
      )}
      <p className="privacy-note">🔒 Compared locally in your browser.</p>
    </div>
  );
}
