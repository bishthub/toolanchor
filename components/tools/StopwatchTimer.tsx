"use client";

import { useEffect, useRef, useState } from "react";

function fmt(ms: number): string {
  const sign = ms < 0 ? "-" : "";
  ms = Math.abs(ms);
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  const cs = Math.floor((ms % 1000) / 10);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${sign}${h > 0 ? p(h) + ":" : ""}${p(m)}:${p(s)}.${p(cs)}`;
}

function beep() {
  try {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new Ctx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    osc.frequency.value = 880;
    gain.gain.setValueAtTime(0.25, ctx.currentTime);
    osc.start();
    osc.stop(ctx.currentTime + 0.6);
  } catch { /* ignore */ }
}

export default function StopwatchTimer() {
  const [mode, setMode] = useState<"stopwatch" | "timer">("stopwatch");

  // Stopwatch
  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(false);
  const [laps, setLaps] = useState<number[]>([]);
  const startRef = useRef(0);
  const rafRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Timer
  const [mins, setMins] = useState("5");
  const [remaining, setRemaining] = useState(0);
  const [timerRunning, setTimerRunning] = useState(false);
  const [done, setDone] = useState(false);
  const deadlineRef = useRef(0);

  useEffect(() => {
    if (running) {
      startRef.current = performance.now() - elapsed;
      rafRef.current = setInterval(() => setElapsed(performance.now() - startRef.current), 31);
    }
    return () => { if (rafRef.current) clearInterval(rafRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running]);

  useEffect(() => {
    if (timerRunning) {
      const id = setInterval(() => {
        const left = deadlineRef.current - performance.now();
        if (left <= 0) {
          setRemaining(0);
          setTimerRunning(false);
          setDone(true);
          beep();
          clearInterval(id);
        } else setRemaining(left);
      }, 31);
      return () => clearInterval(id);
    }
  }, [timerRunning]);

  function startTimer() {
    const ms = Math.round(parseFloat(mins || "0") * 60000);
    if (ms <= 0) return;
    deadlineRef.current = performance.now() + ms;
    setRemaining(ms);
    setDone(false);
    setTimerRunning(true);
  }

  return (
    <div>
      <div className="field">
        <div className="row">
          <button type="button" className={`btn ${mode === "stopwatch" ? "" : "secondary"}`} onClick={() => setMode("stopwatch")}>Stopwatch</button>
          <button type="button" className={`btn ${mode === "timer" ? "" : "secondary"}`} onClick={() => setMode("timer")}>Timer</button>
        </div>
      </div>

      {mode === "stopwatch" ? (
        <>
          <div className="mono" style={{ fontSize: "3rem", fontWeight: 800, textAlign: "center", margin: "10px 0" }}>{fmt(elapsed)}</div>
          <div className="row" style={{ justifyContent: "center" }}>
            {!running ? <button className="btn" onClick={() => setRunning(true)}>▶ Start</button>
              : <button className="btn" onClick={() => setRunning(false)}>⏸ Pause</button>}
            <button className="btn secondary" onClick={() => { if (running) setLaps((l) => [...l, elapsed]); }} disabled={!running}>Lap</button>
            <button className="btn secondary" onClick={() => { setRunning(false); setElapsed(0); setLaps([]); }}>Reset</button>
          </div>
          {laps.length > 0 && (
            <ul className="file-list" style={{ marginTop: 14 }}>
              {laps.map((l, i) => <li key={i} className="mono"><span style={{ color: "var(--muted)" }}>Lap {i + 1}</span><span style={{ marginLeft: "auto" }}>{fmt(l)}</span></li>)}
            </ul>
          )}
        </>
      ) : (
        <>
          <div className="mono" style={{ fontSize: "3rem", fontWeight: 800, textAlign: "center", margin: "10px 0", color: done ? "var(--ok, #4fe0a6)" : undefined }}>
            {done ? "Time's up!" : fmt(timerRunning ? remaining : Math.round(parseFloat(mins || "0") * 60000))}
          </div>
          {!timerRunning && (
            <div className="field" style={{ maxWidth: 200, margin: "0 auto" }}>
              <label>Minutes</label>
              <input className="input" type="number" min={0} step="0.5" value={mins} onChange={(e) => setMins(e.target.value)} />
            </div>
          )}
          <div className="row" style={{ justifyContent: "center", marginTop: 10 }}>
            {!timerRunning ? <button className="btn" onClick={startTimer}>▶ Start</button>
              : <button className="btn" onClick={() => setTimerRunning(false)}>⏸ Pause</button>}
            <button className="btn secondary" onClick={() => { setTimerRunning(false); setRemaining(0); setDone(false); }}>Reset</button>
          </div>
        </>
      )}
      <p className="privacy-note">🔒 Runs entirely in your browser.</p>
    </div>
  );
}
