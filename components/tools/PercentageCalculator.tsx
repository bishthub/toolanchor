"use client";

import { useState } from "react";

type Mode = "of" | "isWhat" | "change";

const fmt = (n: number) =>
  Number.isFinite(n) ? n.toLocaleString(undefined, { maximumFractionDigits: 4 }) : "—";

export default function PercentageCalculator() {
  const [mode, setMode] = useState<Mode>("of");
  const [a, setA] = useState("");
  const [b, setB] = useState("");

  const x = parseFloat(a);
  const y = parseFloat(b);
  const ready = !isNaN(x) && !isNaN(y);

  let result = "—";
  if (ready) {
    if (mode === "of") result = fmt((x / 100) * y);
    else if (mode === "isWhat") result = y !== 0 ? `${fmt((x / y) * 100)}%` : "—";
    else result = x !== 0 ? `${fmt(((y - x) / x) * 100)}%` : "—";
  }

  const modes: { id: Mode; label: string; aLabel: string; bLabel: string }[] = [
    { id: "of", label: "X% of Y", aLabel: "Percentage (X)", bLabel: "Of number (Y)" },
    { id: "isWhat", label: "X is what % of Y", aLabel: "Number (X)", bLabel: "Of total (Y)" },
    { id: "change", label: "% change", aLabel: "From (X)", bLabel: "To (Y)" },
  ];
  const current = modes.find((m) => m.id === mode)!;

  return (
    <div>
      <div className="field">
        <label>Calculation</label>
        <div className="row">
          {modes.map((m) => (
            <button key={m.id} type="button" className={`btn ${mode === m.id ? "" : "secondary"}`} onClick={() => setMode(m.id)}>
              {m.label}
            </button>
          ))}
        </div>
      </div>

      <div className="row">
        <div className="field">
          <label>{current.aLabel}</label>
          <input type="number" className="input" value={a} onChange={(e) => setA(e.target.value)} />
        </div>
        <div className="field">
          <label>{current.bLabel}</label>
          <input type="number" className="input" value={b} onChange={(e) => setB(e.target.value)} />
        </div>
      </div>

      <div className="stat">
        <div className="n">{result}</div>
        <div className="l">Result</div>
      </div>

      <p className="privacy-note">🔒 Calculated instantly in your browser.</p>
    </div>
  );
}
