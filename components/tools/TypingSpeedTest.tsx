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

  return (
    <div>
      <div className="field">
        <label>Type this passage</label>
        <div
          style={{
            padding: "14px 16px",
            background: "var(--bg-2)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius-sm)",
            fontSize: "1.02rem",
            lineHeight: 1.7,
            userSelect: "none",
          }}
        >
          {passage
            ? passage.split("").map((ch, i) => {
                const isTyped = i < typed.length;
                const isWrong = isTyped && typed[i] !== ch;
                return (
                  <span
                    key={i}
                    style={{
                      color: isTyped ? (isWrong ? "var(--danger)" : "var(--ok)") : "var(--muted)",
                      textDecoration: isWrong ? "underline" : undefined,
                    }}
                  >
                    {ch}
                  </span>
                );
              })
            : "Loading passage…"}
        </div>
      </div>

      <div className="field">
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

      {finished && (
        <div className="mono" style={{ fontSize: "1.4rem", fontWeight: 800, textAlign: "center", margin: "6px 0 4px" }}>
          {wpm} WPM at {accuracy}% accuracy
        </div>
      )}

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
    </div>
  );
}
