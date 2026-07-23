"use client";

import { useEffect, useRef, useState } from "react";

const DURATION_MS = 60_000;

const PASSAGES: string[] = [
  "Good writing is clear thinking made visible. When you draft a message, start with the point you want the reader to remember, then support it with the smallest number of details that still tell the whole story. Short sentences carry more weight than long ones, and plain words almost always beat clever ones.",
  "The morning train pulled into the station exactly on time. Commuters folded their newspapers, gathered their bags, and stepped onto the platform in a quiet, practiced rhythm. Outside, the city was already awake, its streets filling with delivery vans, cyclists, and the steady hum of another working day beginning.",
  "Teams that ship reliable software tend to share a few habits. They keep changes small, review each other's work, and write tests before problems appear in production. Most of all, they treat mistakes as information rather than blame, which makes people far more willing to report issues early.",
  "A well-kept garden rewards patience more than effort. Seeds planted in spring need weeks of steady watering before the first green shoots appear, and even then the gardener must thin, weed, and wait. The harvest, when it finally arrives, feels less like a victory and more like a quiet agreement with the seasons.",
  "Public libraries remain one of the few places where anyone can sit, read, and learn without spending money. Beyond the shelves of books, most branches now offer internet access, quiet study rooms, and community programs. Librarians answer thousands of questions a year, from homework help to local history.",
  "Before the meeting starts, take five minutes to write down the single decision you need from the group. Share it at the top of the agenda, keep the discussion focused on that outcome, and end by confirming who owns the next step. Meetings shrink when their purpose is stated plainly.",
  "The bakery on the corner opens at six, and by seven the smell of fresh bread has reached the end of the street. Regulars arrive in a familiar order: the runner, the teacher, the man with the small grey dog. Each leaves with the same order they have placed for years.",
  "Learning to type quickly is mostly a matter of trust. Keep your eyes on the screen instead of the keyboard, let your fingers find the keys by memory, and accept a few mistakes along the way. Accuracy improves first, and speed follows naturally once each keystroke becomes automatic.",
  "Weather forecasts have improved enormously over the past few decades. Modern models divide the atmosphere into millions of small cells and simulate how heat, wind, and moisture move between them. A five-day forecast today is as accurate as a two-day forecast was thirty years ago, and it keeps improving.",
];

function randomPassage(): string {
  return PASSAGES[Math.floor(Math.random() * PASSAGES.length)];
}

// Rating vs. the widely-cited ~40 WPM average — this is the "what is a good
// typing speed" answer people search for, shown right on their result.
function rating(wpm: number): { label: string; note: string; tier: "hi" | "mid" | "lo" } {
  if (wpm >= 90) return { label: "Professional", note: "Top-tier — faster than about 95% of typists.", tier: "hi" };
  if (wpm >= 70) return { label: "Fast", note: "Well above the ~40 WPM average.", tier: "hi" };
  if (wpm >= 55) return { label: "Above average", note: "Comfortably above the ~40 WPM average.", tier: "hi" };
  if (wpm >= 40) return { label: "Average", note: "Right around the ~40 WPM average.", tier: "mid" };
  if (wpm >= 25) return { label: "Below average", note: "A little under the ~40 WPM average — keep practising.", tier: "lo" };
  return { label: "Beginner", note: "Practice a few minutes a day and speed climbs quickly.", tier: "lo" };
}

export default function TypingSpeedTest() {
  const [passage, setPassage] = useState("");
  const [typed, setTyped] = useState("");
  const [running, setRunning] = useState(false);
  const [finished, setFinished] = useState(false);
  const [elapsed, setElapsed] = useState(0); // ms
  const startRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Pick the passage on mount (client-only, avoids hydration mismatch).
  useEffect(() => {
    setPassage(randomPassage());
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  function stop(finalMs: number) {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    setElapsed(Math.min(finalMs, DURATION_MS));
    setRunning(false);
    setFinished(true);
  }

  function start() {
    startRef.current = performance.now();
    setRunning(true);
    timerRef.current = setInterval(() => {
      const ms = performance.now() - startRef.current;
      if (ms >= DURATION_MS) stop(DURATION_MS);
      else setElapsed(ms);
    }, 100);
  }

  function restart() {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    setTyped("");
    setRunning(false);
    setFinished(false);
    setElapsed(0);
    setPassage(randomPassage());
  }

  function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    if (finished || !passage) return;
    const value = e.target.value.slice(0, passage.length);
    if (!running && value.length > 0) start();
    setTyped(value);
    if (value.length >= passage.length) stop(performance.now() - startRef.current);
  }

  let correct = 0;
  for (let i = 0; i < typed.length; i++) if (typed[i] === passage[i]) correct++;
  const errors = typed.length - correct;
  const minutes = elapsed / 60_000;
  const wpm = minutes > 0 ? Math.round(correct / 5 / minutes) : 0;
  const accuracy = typed.length > 0 ? Math.round((correct / typed.length) * 100) : 100;
  const timeLeft = Math.max(0, Math.ceil((DURATION_MS - elapsed) / 1000));
  const progress = Math.min(100, (elapsed / DURATION_MS) * 100);
  const r = rating(wpm);

  return (
    <div className="tst">
      {/* Result hero — headline WPM + how it compares to the average */}
      {finished && (
        <div className="tst-result">
          <div className="tst-result-num">
            <span className="tst-wpm">{wpm}</span>
            <span className="tst-wpm-u">WPM</span>
          </div>
          <div className="tst-result-info">
            <span className={`tst-badge tst-badge--${r.tier}`}>{r.label}</span>
            <span className="tst-result-note">{r.note}</span>
            <span className="tst-result-sub">{accuracy}% accuracy · {errors} error{errors === 1 ? "" : "s"}</span>
          </div>
        </div>
      )}

      <div className="field">
        <label>Type this passage</label>
        <div className="tst-passage">
          {passage
            ? passage.split("").map((ch, i) => {
                const isTyped = i < typed.length;
                const isWrong = isTyped && typed[i] !== ch;
                const isCaret = !finished && i === typed.length;
                const cls = isCaret ? "tst-caret" : isTyped ? (isWrong ? "tst-wrong" : "tst-right") : "tst-todo";
                return (
                  <span key={i} className={cls}>{ch}</span>
                );
              })
            : "Loading passage…"}
        </div>
      </div>

      {/* Live timer bar */}
      <div className="tst-bar" role="progressbar" aria-valuenow={Math.round(progress)} aria-valuemin={0} aria-valuemax={100}>
        <span style={{ width: `${progress}%` }} className={finished ? "is-done" : ""} />
      </div>

      <div className="field" style={{ marginTop: 16 }}>
        <label htmlFor="tst">Type here — the 60-second timer starts on your first keystroke</label>
        <textarea
          id="tst"
          value={typed}
          onChange={handleChange}
          disabled={finished || !passage}
          placeholder="Start typing to begin…"
          spellCheck={false}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          style={{ minHeight: 120 }}
        />
      </div>

      <div className="stats">
        <div className="stat"><div className="n">{timeLeft}s</div><div className="l">Time left</div></div>
        <div className="stat"><div className="n">{wpm}</div><div className="l">WPM</div></div>
        <div className="stat"><div className="n">{accuracy}%</div><div className="l">Accuracy</div></div>
        <div className="stat"><div className="n">{errors}</div><div className="l">Errors</div></div>
      </div>

      <button className={`btn ${finished ? "" : "secondary"}`} style={{ marginTop: 16 }} onClick={restart}>
        {finished ? "Try again" : "New passage"}
      </button>

      <p className="privacy-note">🔒 The test runs entirely in your browser — nothing you type is uploaded.</p>

      <style jsx>{`
        .tst-result {
          display: flex; align-items: center; gap: 20px; flex-wrap: wrap;
          padding: 20px 22px; margin-bottom: 20px;
          border: 1px solid var(--ring); border-radius: var(--radius);
          background: var(--accent-soft); box-shadow: 0 0 0 1px var(--ring), var(--shadow-sm);
          animation: tst-rise .3s var(--ease-out) both;
        }
        @keyframes tst-rise { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } }
        .tst-result-num { display: flex; align-items: baseline; gap: 7px; }
        .tst-wpm {
          font-family: var(--font-display), sans-serif; font-weight: 800; font-size: 3rem;
          line-height: 1; letter-spacing: -0.03em; color: var(--accent); font-variant-numeric: tabular-nums;
        }
        .tst-wpm-u {
          font-family: var(--font-mono), monospace; font-size: 0.82rem; font-weight: 600;
          letter-spacing: 0.08em; color: var(--accent); text-transform: uppercase;
        }
        .tst-result-info { display: flex; flex-direction: column; gap: 4px; min-width: 0; }
        .tst-badge {
          align-self: flex-start; font-size: 0.72rem; font-weight: 650; letter-spacing: 0.03em;
          text-transform: uppercase; padding: 3px 9px; border-radius: 999px;
        }
        .tst-badge--hi { background: color-mix(in srgb, var(--ok) 16%, transparent); color: var(--ok); }
        .tst-badge--mid { background: var(--accent-soft); color: var(--accent); box-shadow: inset 0 0 0 1px var(--ring); }
        .tst-badge--lo { background: var(--surface-2); color: var(--muted); }
        .tst-result-note { font-size: 0.9rem; color: var(--text); font-weight: 550; }
        .tst-result-sub { font-size: 0.8rem; color: var(--muted); font-variant-numeric: tabular-nums; }

        .tst-passage {
          padding: 14px 16px; background: var(--bg-2); border: 1px solid var(--border);
          border-radius: var(--radius-sm); font-size: 1.02rem; line-height: 1.7; user-select: none;
        }
        .tst-todo { color: var(--muted); }
        .tst-right { color: var(--ok); }
        .tst-wrong { color: var(--danger); text-decoration: underline; text-underline-offset: 2px; }
        .tst-caret {
          color: var(--text); background: var(--accent-soft);
          box-shadow: -2px 0 0 var(--accent); border-radius: 1px;
        }

        .tst-bar {
          height: 6px; margin-top: 14px; border-radius: 999px;
          background: var(--surface-2); overflow: hidden;
        }
        .tst-bar > span {
          display: block; height: 100%; background: var(--accent); border-radius: 999px;
          transition: width .1s linear;
        }
        .tst-bar > span.is-done { background: var(--ok); }
      `}</style>
    </div>
  );
}
