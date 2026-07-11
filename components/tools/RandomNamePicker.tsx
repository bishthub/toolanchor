"use client";

import { useMemo, useState } from "react";

function getCryptoRandomInt(max: number): number {
  const array = new Uint32Array(1);
  crypto.getRandomValues(array);
  return array[0] % max;
}

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = getCryptoRandomInt(i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function RandomNamePicker() {
  const [input, setInput] = useState("");
  const [count, setCount] = useState(1);
  const [removeWinners, setRemoveWinners] = useState(false);
  const [winners, setWinners] = useState<string[]>([]);
  const [pickedFrom, setPickedFrom] = useState(0);
  const [copied, setCopied] = useState(false);

  const names = useMemo(
    () => input.split("\n").map((s) => s.trim()).filter(Boolean),
    [input]
  );

  function pick() {
    if (names.length === 0) return;
    const picked = shuffleArray(names).slice(0, Math.min(count, names.length));
    setWinners(picked);
    setPickedFrom(names.length);
    setCopied(false);
    if (removeWinners) {
      const remaining = [...names];
      for (const w of picked) {
        const idx = remaining.indexOf(w);
        if (idx !== -1) remaining.splice(idx, 1);
      }
      setInput(remaining.join("\n"));
    }
  }

  async function copy() {
    await navigator.clipboard.writeText(winners.join("\n"));
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  }

  return (
    <div>
      <div className="field">
        <label>Names (one per line)</label>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={`Alice\nBob\nCharlie\nDiana\nEve`}
          style={{ minHeight: 160, fontFamily: "var(--font-mono), monospace", fontSize: ".88rem" }}
        />
        <p style={{ color: "var(--muted)", fontSize: ".82rem", marginTop: 4 }}>
          {names.length} name{names.length !== 1 ? "s" : ""}
        </p>
      </div>

      <div className="row">
        <div className="field" style={{ maxWidth: 160 }}>
          <label>Winners to pick</label>
          <input
            className="input"
            type="number"
            min={1}
            max={100}
            value={count}
            onChange={(e) => setCount(Math.max(1, parseInt(e.target.value, 10) || 1))}
          />
        </div>
      </div>

      <label style={{ display: "flex", gap: 6, alignItems: "center", color: "var(--muted)", fontSize: ".9rem", marginBottom: 14 }}>
        <input type="checkbox" checked={removeWinners} onChange={(e) => setRemoveWinners(e.target.checked)} /> Remove winners from the list after picking
      </label>

      <button className="btn" onClick={pick} disabled={names.length === 0}>
        🎯 Pick {count === 1 ? "a winner" : `${count} winners`}
      </button>

      {winners.length > 0 && (
        <div className="field" style={{ marginTop: 16 }}>
          <label>{winners.length === 1 ? "Winner" : "Winners"}</label>
          <div
            style={{
              padding: "18px 20px",
              background: "var(--bg-2)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius-sm)",
              textAlign: "center",
            }}
          >
            {winners.map((w, i) => (
              <div key={i} style={{ fontSize: winners.length === 1 ? "1.6rem" : "1.15rem", fontWeight: 700, lineHeight: 1.7 }}>
                {w}
              </div>
            ))}
          </div>
          <p style={{ color: "var(--muted)", fontSize: ".82rem", marginTop: 6 }}>
            Picked {winners.length} of {pickedFrom} name{pickedFrom !== 1 ? "s" : ""}.
          </p>
          <button className="btn" style={{ marginTop: 4 }} onClick={copy}>
            {copied ? "✓ Copied" : "Copy winners"}
          </button>
        </div>
      )}

      <p className="privacy-note">🔒 Uses the cryptographically-secure Web Crypto API. Everything runs in your browser — your list is never uploaded.</p>
    </div>
  );
}
