"use client";

import { useState, useEffect, useRef, useCallback } from "react";

export default function PomodoroTimer() {
  const [focus, setFocus] = useState(25);
  const [shortBreak, setShortBreak] = useState(5);
  const [longBreak, setLongBreak] = useState(15);
  const [mode, setMode] = useState<"focus" | "short" | "long">("focus");
  const [timeLeft, setTimeLeft] = useState(focus * 60);
  const [running, setRunning] = useState(false);
  const [cycles, setCycles] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!running) return;
    intervalRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          // Play notification
          try {
            const ctx = new AudioContext();
            const osc = ctx.createOscillator();
            osc.frequency.value = 800;
            osc.connect(ctx.destination);
            osc.start();
            setTimeout(() => { osc.stop(); ctx.close(); }, 300);
          } catch {}
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [running]);

  const switchMode = useCallback((m: "focus" | "short" | "long") => {
    setRunning(false);
    setMode(m);
    const t = m === "focus" ? focus : m === "short" ? shortBreak : longBreak;
    setTimeLeft(t * 60);
  }, [focus, shortBreak, longBreak]);

  useEffect(() => {
    if (timeLeft > 0) return;
    if (!running) return;
    setRunning(false);
    if (mode === "focus") {
      const newCycles = cycles + 1;
      setCycles(newCycles);
      if (newCycles % 4 === 0) {
        setMode("long");
        setTimeLeft(longBreak * 60);
      } else {
        setMode("short");
        setTimeLeft(shortBreak * 60);
      }
    } else {
      setMode("focus");
      setTimeLeft(focus * 60);
    }
  }, [timeLeft, running, mode, focus, shortBreak, longBreak, cycles]);

  function toggle() { setRunning((r) => !r); }
  function reset() { setRunning(false); setTimeLeft(focus * 60); setMode("focus"); setCycles(0); }

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const total = mode === "focus" ? focus * 60 : mode === "short" ? shortBreak * 60 : longBreak * 60;
  const pct = total > 0 ? (1 - timeLeft / total) * 100 : 0;

  return (
    <div>
      <div style={{ display: "flex", gap: 6, justifyContent: "center", marginBottom: 20 }}>
        {(["focus", "short", "long"] as const).map((m) => (
          <button key={m} type="button" className={mode === m ? "btn" : "btn secondary"} style={{ padding: "8px 14px", fontSize: ".85rem" }} onClick={() => switchMode(m)}>
            {m === "focus" ? "Focus" : m === "short" ? "Short Break" : "Long Break"}
          </button>
        ))}
      </div>
      <div style={{ textAlign: "center" }}>
        <div style={{ position: "relative", width: 220, height: 220, margin: "0 auto 20px" }}>
          <svg viewBox="0 0 100 100" style={{ transform: "rotate(-90deg)", width: 220, height: 220 }}>
            <circle cx="50" cy="50" r="42" fill="none" stroke="var(--border)" strokeWidth="6" />
            <circle cx="50" cy="50" r="42" fill="none" stroke="var(--accent)" strokeWidth="6" strokeDasharray={`${2 * Math.PI * 42}`} strokeDashoffset={`${2 * Math.PI * 42 * (1 - pct / 100)}`} strokeLinecap="round" style={{ transition: "stroke-dashoffset .5s" }} />
          </svg>
          <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontSize: "2.8rem", fontWeight: 700, fontFamily: "var(--font-mono), monospace", fontVariantNumeric: "tabular-nums" }}>
              {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
            </span>
            <span style={{ fontSize: ".8rem", color: "var(--muted)", textTransform: "uppercase", letterSpacing: ".08em" }}>{mode === "focus" ? "Focus" : "Break"} · {cycles} cycles</span>
          </div>
        </div>
        <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
          <button className="btn" onClick={toggle}>{running ? "⏸ Pause" : "▶ Start"}</button>
          <button className="btn secondary" onClick={reset}>↺ Reset</button>
        </div>
      </div>
      <div className="row" style={{ marginTop: 20 }}>
        <div className="field"><label>Focus (min)</label><input className="input" type="number" min={1} max={120} value={focus} onChange={(e) => { const v = parseInt(e.target.value) || 25; setFocus(v); if (mode === "focus") setTimeLeft(v * 60); }} /></div>
        <div className="field"><label>Short break (min)</label><input className="input" type="number" min={1} max={30} value={shortBreak} onChange={(e) => setShortBreak(parseInt(e.target.value) || 5)} /></div>
        <div className="field"><label>Long break (min)</label><input className="input" type="number" min={1} max={60} value={longBreak} onChange={(e) => setLongBreak(parseInt(e.target.value) || 15)} /></div>
      </div>
      <p className="privacy-note">🔒 Runs entirely in your browser, including audio notifications. No data is uploaded.</p>
    </div>
  );
}
