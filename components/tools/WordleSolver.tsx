"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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

// Statistically strong openers (highest frequency-coverage words), shown
// before the player has entered any clue.
const STARTERS = [...WORDLE_WORDS].sort((a, b) => scoreWord(b) - scoreWord(a)).slice(0, 6);

const MAX_ROWS = 6;
const WIDTH = 5;

// Tile feedback state. "empty" = no letter yet; the other three mirror the
// three colours Wordle paints a tile.
type State = "empty" | "absent" | "present" | "correct";
type Row = { letters: string[]; states: State[] };

const emptyRow = (): Row => ({
  letters: Array(WIDTH).fill(""),
  states: Array(WIDTH).fill("empty") as State[],
});

const NEXT: Record<Exclude<State, "empty">, State> = {
  absent: "present",
  present: "correct",
  correct: "absent",
};

const KEY_ROWS = ["qwertyuiop", "asdfghjkl", "zxcvbnm"];

export default function WordleSolver() {
  const [rows, setRows] = useState<Row[]>([emptyRow()]);
  const [copied, setCopied] = useState(false);
  const boardRef = useRef<HTMLDivElement>(null);

  const hasContent = rows.some((r) => r.letters.some(Boolean));

  // ── Editing ──────────────────────────────────────────────────────────
  const typeLetter = useCallback((chRaw: string) => {
    const ch = chRaw.toLowerCase();
    if (!/^[a-z]$/.test(ch)) return;
    setRows((prev) => {
      const rows = prev.map((r) => ({ letters: [...r.letters], states: [...r.states] }));
      const last = rows[rows.length - 1];
      const slot = last.letters.findIndex((l) => l === "");
      if (slot !== -1) {
        last.letters[slot] = ch;
        last.states[slot] = "absent"; // default: gray until the player marks it
        return rows;
      }
      // Current row is full — start the next guess automatically.
      if (rows.length < MAX_ROWS) {
        const row = emptyRow();
        row.letters[0] = ch;
        row.states[0] = "absent";
        rows.push(row);
      }
      return rows;
    });
  }, []);

  const backspace = useCallback(() => {
    setRows((prev) => {
      let rows = prev.map((r) => ({ letters: [...r.letters], states: [...r.states] }));
      let i = rows.length - 1;
      while (i > 0 && rows[i].letters.every((l) => l === "")) i--;
      const row = rows[i];
      for (let k = WIDTH - 1; k >= 0; k--) {
        if (row.letters[k] !== "") {
          row.letters[k] = "";
          row.states[k] = "empty";
          break;
        }
      }
      while (rows.length > 1 && rows[rows.length - 1].letters.every((l) => l === "")) rows.pop();
      return rows;
    });
  }, []);

  const enter = useCallback(() => {
    setRows((prev) => {
      const last = prev[prev.length - 1];
      if (last.letters.some((l) => l === "") || prev.length >= MAX_ROWS) return prev;
      return [...prev, emptyRow()];
    });
  }, []);

  const cycleTile = useCallback((ri: number, ci: number) => {
    setRows((prev) => {
      const rows = prev.map((r) => ({ letters: [...r.letters], states: [...r.states] }));
      const st = rows[ri].states[ci];
      if (st === "empty") return prev; // nothing typed here yet
      rows[ri].states[ci] = NEXT[st];
      return rows;
    });
  }, []);

  const reset = useCallback(() => setRows([emptyRow()]), []);

  // Physical keyboard — active whenever the board area holds focus, and on
  // mount, so most players can just start typing.
  useEffect(() => {
    boardRef.current?.focus({ preventScroll: true });
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName)) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === "Backspace") { e.preventDefault(); backspace(); }
      else if (e.key === "Enter") { e.preventDefault(); enter(); }
      else if (/^[a-zA-Z]$/.test(e.key)) { e.preventDefault(); typeLetter(e.key); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [typeLetter, backspace, enter]);

  // ── Solving ──────────────────────────────────────────────────────────
  const matches = useMemo(() => {
    const correctAt: Record<number, string> = {};
    const present: { letter: string; pos: number }[] = [];
    const absent = new Set<string>();
    const keep = new Set<string>();

    for (const row of rows) {
      for (let i = 0; i < WIDTH; i++) {
        const L = row.letters[i];
        if (!L) continue;
        const s = row.states[i];
        if (s === "correct") { correctAt[i] = L; keep.add(L); }
        else if (s === "present") { present.push({ letter: L, pos: i }); keep.add(L); }
        else if (s === "absent") { absent.add(L); }
      }
    }

    const list = WORDLE_WORDS.filter((w) => {
      for (const p in correctAt) if (w[+p] !== correctAt[+p]) return false;
      for (const { letter, pos } of present) if (!w.includes(letter) || w[pos] === letter) return false;
      for (const g of absent) if (!keep.has(g) && w.includes(g)) return false; // dup-letter safe
      return true;
    }).sort((a, b) => scoreWord(b) - scoreWord(a));

    return list;
  }, [rows]);

  // Best known state per letter, to colour the on-screen keyboard.
  const keyState = useMemo(() => {
    const rank: Record<State, number> = { empty: 0, absent: 1, present: 2, correct: 3 };
    const m: Record<string, State> = {};
    for (const row of rows) {
      for (let i = 0; i < WIDTH; i++) {
        const L = row.letters[i];
        const s = row.states[i];
        if (!L || s === "empty") continue;
        if (!m[L] || rank[s] > rank[m[L]]) m[L] = s;
      }
    }
    return m;
  }, [rows]);

  async function copy() {
    await navigator.clipboard.writeText(matches.slice(0, 100).join(", "));
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  }

  const canAddRow = rows.length < MAX_ROWS && rows[rows.length - 1].letters.every(Boolean);

  return (
    <div className="ws">
      {/* Board — type a guess, then tap each tile to match Wordle's colours */}
      <div
        ref={boardRef}
        className="ws-board"
        tabIndex={0}
        role="group"
        aria-label="Wordle guesses — type a word, then tap each tile to set its colour"
      >
        {rows.map((row, ri) => (
          <div className="ws-row" key={ri}>
            {row.letters.map((L, ci) => (
              <button
                type="button"
                key={ci}
                className={`ws-tile ws-tile--${row.states[ci]}`}
                onClick={() => cycleTile(ri, ci)}
                disabled={!L}
                aria-label={
                  L
                    ? `Row ${ri + 1}, letter ${L.toUpperCase()} — ${row.states[ci]}. Tap to change colour.`
                    : `Row ${ri + 1}, empty`
                }
              >
                {L}
              </button>
            ))}
          </div>
        ))}
      </div>

      <div className="ws-hint">
        <span>Type your guess, then <strong>tap each tile</strong> to cycle its colour</span>
        <span className="ws-cyclekey" aria-hidden="true">
          <i className="ws-chip ws-chip--absent" />→<i className="ws-chip ws-chip--present" />→<i className="ws-chip ws-chip--correct" />
        </span>
      </div>

      {/* On-screen keyboard — essential on mobile; reflects known letters */}
      <div className="ws-kb" role="group" aria-label="On-screen keyboard">
        {KEY_ROWS.map((line, i) => (
          <div className="ws-kb-row" key={i}>
            {i === 2 && (
              <button type="button" className="ws-key ws-key--wide" onClick={enter} aria-label="Next guess row">Enter</button>
            )}
            {line.split("").map((k) => (
              <button
                type="button"
                key={k}
                className={`ws-key ws-key--${keyState[k] ?? "idle"}`}
                onClick={() => typeLetter(k)}
                aria-label={`Type ${k.toUpperCase()}`}
              >
                {k}
              </button>
            ))}
            {i === 2 && (
              <button type="button" className="ws-key ws-key--wide" onClick={backspace} aria-label="Delete last letter">⌫</button>
            )}
          </div>
        ))}
      </div>

      <div className="ws-actions">
        {canAddRow && (
          <button type="button" className="btn secondary" onClick={enter}>+ Add guess row</button>
        )}
        {hasContent && (
          <button type="button" className="btn secondary" onClick={reset}>Reset board</button>
        )}
      </div>

      {/* Results */}
      <div className="ws-results">
        {!hasContent ? (
          <>
            <div className="ws-results-head">
              <span className="ws-count">Strong opening words</span>
              <span className="ws-sub">Ranked by letter coverage — great first guesses</span>
            </div>
            <div className="ws-words">
              {STARTERS.map((w) => (
                <span key={w} className="ws-word ws-word--starter">{w}</span>
              ))}
            </div>
          </>
        ) : matches.length === 0 ? (
          <div className="ws-empty">
            <strong>No matching words.</strong> Double-check your tile colours — a letter may be marked the wrong shade.
          </div>
        ) : (
          <>
            <div className="ws-results-head">
              <span className="ws-count">{matches.length} possible {matches.length === 1 ? "answer" : "answers"}</span>
              <span className="ws-sub">Best next guess first</span>
              <button type="button" className="ws-copy" onClick={copy}>
                {copied ? "✓ Copied" : "Copy list"}
              </button>
            </div>
            <div className="ws-words">
              {matches.slice(0, 200).map((w, i) => (
                <span key={w} className={`ws-word${i === 0 ? " ws-word--top" : ""}`}>{w}</span>
              ))}
            </div>
            {matches.length > 200 && (
              <p className="ws-more">…and {matches.length - 200} more — mark another clue to narrow it down.</p>
            )}
          </>
        )}
      </div>

      <p className="privacy-note">🔒 Runs in your browser against the official 2,314-word answer list — nothing is uploaded.</p>

      <style jsx>{`
        .ws { --wg: #6aaa64; --wy: #c9a227; --wa: #787c7e; }

        /* Board */
        .ws-board {
          display: flex; flex-direction: column; gap: clamp(5px, 1.4vw, 8px);
          width: max-content; max-width: 100%; margin: 0 auto; outline: none;
        }
        .ws-board:focus-visible { outline: none; }
        .ws-row { display: flex; gap: clamp(5px, 1.4vw, 8px); }
        .ws-tile {
          width: clamp(46px, 15vw, 60px); height: clamp(46px, 15vw, 60px);
          display: grid; place-items: center; padding: 0;
          font-family: var(--font-display), sans-serif;
          font-size: clamp(1.4rem, 5vw, 1.9rem); font-weight: 700; line-height: 1;
          text-transform: uppercase; color: var(--text);
          background: var(--bg-2); border: 2px solid var(--border);
          border-radius: 10px; cursor: pointer; user-select: none;
          transition: transform .12s var(--ease-spring), background .12s, border-color .12s, color .12s;
        }
        .ws-tile:not(:disabled):hover { transform: translateY(-2px); }
        .ws-tile:not(:disabled):active { transform: translateY(0) scale(.96); }
        .ws-tile:disabled { cursor: default; }
        .ws-tile--empty { border-style: dashed; }
        .ws-tile--absent  { background: var(--wa); border-color: var(--wa); color: #fff; }
        .ws-tile--present { background: var(--wy); border-color: var(--wy); color: #fff; }
        .ws-tile--correct { background: var(--wg); border-color: var(--wg); color: #fff; }

        /* Hint */
        .ws-hint {
          display: flex; align-items: center; justify-content: center; flex-wrap: wrap;
          gap: 8px 12px; margin: 16px 0 20px; font-size: .84rem; color: var(--muted);
        }
        .ws-hint strong { color: var(--text); font-weight: 600; }
        .ws-cyclekey { display: inline-flex; align-items: center; gap: 5px; color: var(--faint); }
        .ws-chip { width: 15px; height: 15px; border-radius: 4px; display: inline-block; }
        .ws-chip--absent { background: var(--wa); }
        .ws-chip--present { background: var(--wy); }
        .ws-chip--correct { background: var(--wg); }

        /* On-screen keyboard */
        .ws-kb { display: flex; flex-direction: column; gap: 6px; align-items: center; }
        .ws-kb-row { display: flex; gap: 5px; justify-content: center; width: 100%; }
        .ws-key {
          flex: 1 1 0; min-width: 0; max-width: 42px; height: 48px; padding: 0;
          display: grid; place-items: center;
          font-family: var(--font-sans), sans-serif; font-size: .9rem; font-weight: 600;
          text-transform: uppercase; color: var(--text);
          background: var(--surface-2); border: 1px solid var(--border);
          border-radius: 8px; cursor: pointer;
          transition: background .12s, border-color .12s, transform .1s, color .12s;
        }
        .ws-key:hover { border-color: var(--faint); }
        .ws-key:active { transform: translateY(1px); }
        .ws-key--wide { flex: 1.6 1 0; max-width: 64px; font-size: .72rem; }
        .ws-key--absent  { background: var(--wa); border-color: var(--wa); color: #fff; opacity: .55; }
        .ws-key--present { background: var(--wy); border-color: var(--wy); color: #fff; }
        .ws-key--correct { background: var(--wg); border-color: var(--wg); color: #fff; }

        /* Actions */
        .ws-actions { display: flex; gap: 10px; flex-wrap: wrap; justify-content: center; margin: 20px 0 4px; }

        /* Results */
        .ws-results {
          margin-top: 22px; padding: 18px; border: 1px solid var(--border);
          border-radius: var(--radius); background: var(--bg-2); min-height: 96px;
        }
        .ws-results-head {
          display: flex; align-items: baseline; flex-wrap: wrap; gap: 6px 12px; margin-bottom: 14px;
        }
        .ws-count {
          font-family: var(--font-display), sans-serif; font-weight: 700;
          font-size: 1.05rem; letter-spacing: -0.01em; color: var(--text);
        }
        .ws-sub { font-size: .78rem; color: var(--muted); }
        .ws-copy {
          margin-left: auto; font-size: .78rem; font-weight: 570; color: var(--accent);
          background: none; border: none; cursor: pointer; padding: 4px 2px;
        }
        .ws-copy:hover { text-decoration: underline; }
        .ws-words { display: flex; flex-wrap: wrap; gap: 7px; max-height: 300px; overflow-y: auto; }
        .ws-word {
          font-family: var(--font-mono), monospace; font-size: .92rem; letter-spacing: .06em;
          text-transform: uppercase; color: var(--text);
          background: var(--surface-2); border: 1px solid var(--border);
          border-radius: 7px; padding: 5px 10px;
        }
        .ws-word--top {
          background: var(--accent-soft); border-color: var(--ring); color: var(--accent);
          font-weight: 700; box-shadow: 0 0 0 1px var(--ring);
        }
        .ws-word--starter { background: var(--accent-soft); border-color: var(--ring); color: var(--accent); font-weight: 600; }
        .ws-more { margin: 12px 0 0; font-size: .8rem; color: var(--muted); }
        .ws-empty { font-size: .9rem; color: var(--muted); line-height: 1.55; }
        .ws-empty strong { color: var(--text); }

        @media (max-width: 420px) {
          .ws-key { height: 44px; }
        }
      `}</style>
    </div>
  );
}
