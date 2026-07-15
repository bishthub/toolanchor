"use client";

import { useMemo, useState } from "react";
import { WORDLE_WORDS } from "./wordle-words";

// Letter frequency across the answer list, used to rank suggestions so the
// most likely / most informative words appear first.
const FREQ: Record<string, number> = {};
for (const w of WORDLE_WORDS) for (const c of new Set(w)) FREQ[c] = (FREQ[c] ?? 0) + 1;

function scoreWord(w: string): number {
  let s = 0;
  for (const c of new Set(w)) s += FREQ[c] ?? 0;
  return s;
}

const cell: React.CSSProperties = {
  width: 52, height: 52, textAlign: "center", textTransform: "uppercase",
  fontSize: "1.3rem", fontWeight: 700,
};

export default function WordleSolver() {
  const [greens, setGreens] = useState<string[]>(["", "", "", "", ""]);
  const [yellows, setYellows] = useState<string[]>(["", "", "", "", ""]);
  const [grays, setGrays] = useState("");
  const [copied, setCopied] = useState(false);

  function setAt(list: string[], setList: (v: string[]) => void, i: number, v: string) {
    const next = [...list];
    next[i] = v.toLowerCase().replace(/[^a-z]/g, "");
    setList(next);
  }

  const matches = useMemo(() => {
    const yellowLetters = new Set(yellows.join("").split(""));
    const keep = new Set([...greens.filter(Boolean), ...yellowLetters]);
    const excluded = grays.toLowerCase().replace(/[^a-z]/g, "").split("")
      .filter((c) => !keep.has(c));

    return WORDLE_WORDS.filter((w) => {
      for (let i = 0; i < 5; i++) {
        if (greens[i] && w[i] !== greens[i]) return false;          // green: exact spot
        for (const y of yellows[i]) {
          if (!w.includes(y) || w[i] === y) return false;           // yellow: in word, not here
        }
      }
      for (const g of excluded) if (w.includes(g)) return false;    // gray: not in word
      return true;
    }).sort((a, b) => scoreWord(b) - scoreWord(a));
  }, [greens, yellows, grays]);

  async function copy() {
    await navigator.clipboard.writeText(matches.slice(0, 100).join(", "));
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  }

  function reset() {
    setGreens(["", "", "", "", ""]);
    setYellows(["", "", "", "", ""]);
    setGrays("");
  }

  const hasInput = greens.some(Boolean) || yellows.some(Boolean) || grays.trim() !== "";

  return (
    <div>
      <div className="field">
        <label>🟩 Green letters — correct letter, correct spot</label>
        <div style={{ display: "flex", gap: 8 }}>
          {greens.map((g, i) => (
            <input key={i} className="input" style={cell} maxLength={1} value={g}
              aria-label={`Green letter, position ${i + 1}`}
              onChange={(e) => setAt(greens, setGreens, i, e.target.value)} />
          ))}
        </div>
      </div>

      <div className="field">
        <label>🟨 Yellow letters — in the word, but not in that spot (several letters per box OK)</label>
        <div style={{ display: "flex", gap: 8 }}>
          {yellows.map((y, i) => (
            <input key={i} className="input" style={{ ...cell, fontSize: "1rem" }} maxLength={4} value={y}
              aria-label={`Yellow letters seen at position ${i + 1}`}
              onChange={(e) => setAt(yellows, setYellows, i, e.target.value)} />
          ))}
        </div>
      </div>

      <div className="field">
        <label>⬛ Gray letters — not in the word</label>
        <input className="input" placeholder="e.g. troueys" value={grays}
          onChange={(e) => setGrays(e.target.value)} style={{ maxWidth: 320, textTransform: "uppercase" }} />
      </div>

      {hasInput && (
        <button className="btn secondary" onClick={reset} style={{ marginBottom: 12 }}>Reset</button>
      )}

      <div className="field" style={{ marginTop: 8 }}>
        <label>
          {matches.length === 0
            ? "No matching words — double-check your letters"
            : `${matches.length} possible ${matches.length === 1 ? "answer" : "answers"} (best guesses first)`}
        </label>
        <div style={{
          display: "flex", flexWrap: "wrap", gap: 8, padding: 12,
          background: "var(--bg-2)", borderRadius: 8, maxHeight: 320, overflowY: "auto",
        }}>
          {matches.slice(0, 200).map((w) => (
            <code key={w} style={{ fontSize: "1rem", letterSpacing: "0.1em" }}>{w}</code>
          ))}
          {matches.length > 200 && (
            <span style={{ color: "var(--muted)" }}>…and {matches.length - 200} more — add another clue to narrow it down</span>
          )}
        </div>
        {matches.length > 0 && (
          <button className="btn" style={{ marginTop: 8 }} onClick={copy}>
            {copied ? "✓ Copied" : "Copy top matches"}
          </button>
        )}
      </div>

      <p className="privacy-note">🔒 Runs in your browser against the official 2,314-word answer list — nothing is uploaded.</p>
    </div>
  );
}
