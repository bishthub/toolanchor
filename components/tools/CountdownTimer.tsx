"use client";

import { useEffect, useRef, useState } from "react";
import { usePreset, presetNumber } from "@/lib/preset";

const PRESETS = [
  { label: "1 min", ms: 60_000 },
  { label: "5 min", ms: 300_000 },
  { label: "10 min", ms: 600_000 },
  { label: "25 min", ms: 1_500_000 },
  { label: "1 hour", ms: 3_600_000 },
];

function fmt(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const p = (n: number) => String(n).padStart(2, "0");
  return h > 0 ? `${p(h)}:${p(m)}:${p(s)}` : `${p(m)}:${p(s)}`;
}

type Status = "idle" | "running" | "paused" | "done";

export default function CountdownTimer({ preset }: { preset?: Record<string, string> }) {
  const [hours, setHours] = useState("0");
  const [minutes, setMinutes] = useState("5");
  const [seconds, setSeconds] = useState("0");

  // Preset pages (/tools/countdown-timer/<slug>) and ?m= deep links preset the
  // duration in minutes.
  const presetValues = usePreset(preset, ["m"]);
  useEffect(() => {
    const m = presetNumber(presetValues, "m", 1, 24 * 60);
    if (m == null) return;
    setHours(String(Math.floor(m / 60)));
    setMinutes(String(m % 60));
    setSeconds("0");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [presetValues]);
  const [status, setStatus] = useState<Status>("idle");
  const [remaining, setRemaining] = useState(0);
  const [flashOn, setFlashOn] = useState(false);
  const endRef = useRef(0);
  const baseTitleRef = useRef("");
  const audioRef = useRef<AudioContext | null>(null);

  const inputMs =
    (Math.max(0, parseInt(hours) || 0) * 3600 +
      Math.max(0, parseInt(minutes) || 0) * 60 +
      Math.max(0, parseInt(seconds) || 0)) * 1000;

  function beep() {
    try {
      const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new Ctx();
      audioRef.current = ctx;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "sine";
      osc.frequency.value = 880;
      gain.gain.setValueAtTime(0.0001, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.3, ctx.currentTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.7);
      osc.start();
      osc.stop(ctx.currentTime + 0.75);
      osc.onended = () => {
        if (audioRef.current === ctx) audioRef.current = null;
        void ctx.close();
      };
    } catch { /* ignore */ }
  }

  // Remember the page title once, restore it on unmount; close any live audio.
  useEffect(() => {
    baseTitleRef.current = document.title;
    return () => {
      document.title = baseTitleRef.current;
      if (audioRef.current && audioRef.current.state !== "closed") void audioRef.current.close();
    };
  }, []);

  // Timestamp-based tick: compute the delta to the deadline so the countdown
  // stays accurate even when the tab is throttled in the background.
  useEffect(() => {
    if (status !== "running") return;
    const id = setInterval(() => {
      const left = endRef.current - Date.now();
      if (left <= 0) {
        setRemaining(0);
        setStatus("done");
        beep();
      } else {
        setRemaining(left);
        document.title = `${fmt(left)} — Countdown Timer`;
      }
    }, 250);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  // Restore the title whenever the timer is not running.
  useEffect(() => {
    if (status === "running" || !baseTitleRef.current) return;
    document.title = status === "done" ? "Time's up! — Countdown Timer" : baseTitleRef.current;
  }, [status]);

  // Flash the display a few times on completion.
  useEffect(() => {
    if (status !== "done") { setFlashOn(false); return; }
    let count = 0;
    const id = setInterval(() => {
      count++;
      setFlashOn((f) => !f);
      if (count >= 8) clearInterval(id);
    }, 300);
    return () => clearInterval(id);
  }, [status]);

  function start() {
    if (inputMs <= 0) return;
    endRef.current = Date.now() + inputMs;
    setRemaining(inputMs);
    setStatus("running");
  }

  function pause() {
    setRemaining(Math.max(0, endRef.current - Date.now()));
    setStatus("paused");
  }

  function resume() {
    endRef.current = Date.now() + remaining;
    setStatus("running");
  }

  function reset() {
    setStatus("idle");
    setRemaining(0);
  }

  function applyPreset(ms: number) {
    setHours(String(Math.floor(ms / 3_600_000)));
    setMinutes(String(Math.floor((ms % 3_600_000) / 60_000)));
    setSeconds(String(Math.floor((ms % 60_000) / 1000)));
    setStatus("idle");
    setRemaining(0);
  }

  const done = status === "done";
  const displayMs = status === "idle" ? inputMs : remaining;

  return (
    <div>
      <div
        className="mono"
        style={{
          fontSize: "3rem",
          fontWeight: 800,
          textAlign: "center",
          margin: "10px 0",
          color: done ? "var(--ok, #4fe0a6)" : undefined,
          opacity: done && !flashOn ? 0.25 : 1,
          transition: "opacity .15s",
        }}
      >
        {done ? "Time's up!" : fmt(displayMs)}
      </div>

      {status === "idle" && (
        <>
          <div className="row" style={{ justifyContent: "center" }}>
            <div className="field" style={{ maxWidth: 110 }}>
              <label>Hours</label>
              <input className="input" type="number" min={0} max={99} value={hours} onChange={(e) => setHours(e.target.value)} />
            </div>
            <div className="field" style={{ maxWidth: 110 }}>
              <label>Minutes</label>
              <input className="input" type="number" min={0} max={59} value={minutes} onChange={(e) => setMinutes(e.target.value)} />
            </div>
            <div className="field" style={{ maxWidth: 110 }}>
              <label>Seconds</label>
              <input className="input" type="number" min={0} max={59} value={seconds} onChange={(e) => setSeconds(e.target.value)} />
            </div>
          </div>
          <div className="field">
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", justifyContent: "center" }}>
              {PRESETS.map((p) => (
                <button key={p.label} type="button" className="btn secondary" style={{ padding: "6px 12px", fontSize: ".8rem" }} onClick={() => applyPreset(p.ms)}>
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      <div className="row" style={{ justifyContent: "center", marginTop: 10 }}>
        {status === "idle" && <button className="btn" onClick={start} disabled={inputMs <= 0}>▶ Start</button>}
        {status === "running" && <button className="btn" onClick={pause}>⏸ Pause</button>}
        {status === "paused" && <button className="btn" onClick={resume}>▶ Resume</button>}
        {status !== "idle" && <button className="btn secondary" onClick={reset}>↺ Reset</button>}
      </div>

      <p className="privacy-note">🔒 Runs entirely in your browser, including the alarm sound. Nothing is uploaded.</p>
    </div>
  );
}
