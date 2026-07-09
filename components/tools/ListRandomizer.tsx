"use client";

import { useState, useMemo } from "react";

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

type Mode = "shuffle" | "pick" | "pick-n";

export default function ListRandomizer() {
  const [input, setInput] = useState("");
  const [mode, setMode] = useState<Mode>("shuffle");
  const [pickCount, setPickCount] = useState(1);
  const [result, setResult] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);

  const items = useMemo(
    () => input.split("\n").map((s) => s.trim()).filter(Boolean),
    [input]
  );

  function run() {
    if (items.length === 0) return;

    switch (mode) {
      case "shuffle":
        setResult(shuffleArray(items));
        break;
      case "pick": {
        const idx = getCryptoRandomInt(items.length);
        setResult([items[idx]]);
        break;
      }
      case "pick-n": {
        const shuffled = shuffleArray(items);
        setResult(shuffled.slice(0, Math.min(pickCount, items.length)));
        break;
      }
    }
  }

  async function copy() {
    await navigator.clipboard.writeText(result.join("\n"));
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  }

  return (
    <div>
      <div className="field">
        <label>Items (one per line)</label>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={`Alice\nBob\nCharlie\nDiana\nEve`}
          style={{ minHeight: 160, fontFamily: "var(--font-mono), monospace", fontSize: ".88rem" }}
        />
        <p style={{ color: "var(--muted)", fontSize: ".82rem", marginTop: 4 }}>
          {items.length} item{items.length !== 1 ? "s" : ""}
          {items.length > 10000 ? " (cap: 10,000)" : ""}
        </p>
      </div>

      <div className="row">
        <div className="field" style={{ maxWidth: 200 }}>
          <label>Mode</label>
          <select className="input" value={mode} onChange={(e) => setMode(e.target.value as Mode)}>
            <option value="shuffle">Shuffle all</option>
            <option value="pick">Pick one winner</option>
            <option value="pick-n">Pick N items</option>
          </select>
        </div>
        {mode === "pick-n" && (
          <div className="field" style={{ maxWidth: 100 }}>
            <label>Count</label>
            <input className="input" type="number" min={1} max={100} value={pickCount} onChange={(e) => setPickCount(Math.max(1, parseInt(e.target.value, 10) || 1))} />
          </div>
        )}
      </div>

      <button className="btn" onClick={run} disabled={items.length === 0}>
        {mode === "shuffle" ? "🔀 Shuffle" : mode === "pick" ? "🎯 Pick winner" : "🎯 Pick"}
      </button>

      {result.length > 0 && (
        <div className="field" style={{ marginTop: 16 }}>
          <label>Result</label>
          <div
            style={{
              padding: "14px 16px",
              background: "var(--bg-2)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius-sm)",
              fontFamily: "var(--font-mono), monospace",
              fontSize: ".92rem",
              lineHeight: 1.8,
            }}
          >
            {result.map((item, i) => (
              <div key={i}>{i + 1}. {item}</div>
            ))}
          </div>
          <button className="btn" style={{ marginTop: 8 }} onClick={copy}>
            {copied ? "✓ Copied" : "Copy result"}
          </button>
        </div>
      )}

      <p className="privacy-note">🔒 Uses the cryptographically-secure Web Crypto API. Everything runs in your browser — your list is never uploaded.</p>
    </div>
  );
}
