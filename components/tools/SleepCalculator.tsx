"use client";

import { useState, useMemo } from "react";

const CYCLE = 90; // minutes
const FALL_ASLEEP = 14; // average

export default function SleepCalculator() {
  const [mode, setMode] = useState<"wake" | "bed">("wake");
  const [wakeTime, setWakeTime] = useState("07:00");
  const [bedTime, setBedTime] = useState("23:00");
  const [fallAsleep, setFallAsleep] = useState(FALL_ASLEEP);

  const results = useMemo(() => {
    const out: { time: string; label: string; cycles: number }[] = [];
    if (mode === "wake") {
      const [h, m] = wakeTime.split(":").map(Number);
      if (isNaN(h) || isNaN(m)) return [];
      const wakeMinutes = h * 60 + m;
      for (let c = 6; c >= 4; c--) {
        const bed = wakeMinutes - (c * CYCLE + parseInt(String(fallAsleep)));
        let bedH = Math.floor(bed / 60) % 24;
        const bedM = bed % 60;
        const period = bedH < 12 ? "AM" : "PM";
        if (bedH === 0) bedH = 12;
        if (bedH > 12) bedH -= 12;
        out.push({ time: `${bedH}:${String(bedM).padStart(2, "0")} ${period}`, label: `Go to bed`, cycles: c });
      }
    } else {
      const [h, m] = bedTime.split(":").map(Number);
      if (isNaN(h) || isNaN(m)) return [];
      const bedTotal = h * 60 + m + parseInt(String(fallAsleep));
      for (let c = 6; c >= 4; c--) {
        const wake = bedTotal + c * CYCLE;
        let wakeH = Math.floor(wake / 60) % 24;
        const wakeM = wake % 60;
        const period = wakeH < 12 ? "AM" : "PM";
        const displayH = wakeH === 0 ? 12 : wakeH > 12 ? wakeH - 12 : wakeH;
        out.push({ time: `${displayH}:${String(wakeM).padStart(2, "0")} ${period}`, label: `Wake up (${c} cycles)`, cycles: c });
      }
    }
    return out;
  }, [mode, wakeTime, bedTime, fallAsleep]);

  return (
    <div>
      <div className="field" style={{ maxWidth: 300 }}>
        <label>Mode</label>
        <div style={{ display: "flex", gap: 6 }}>
          <button type="button" className={mode === "wake" ? "btn" : "btn secondary"} style={{ padding: "8px 14px", fontSize: ".85rem" }} onClick={() => setMode("wake")}>Plan bedtime</button>
          <button type="button" className={mode === "bed" ? "btn" : "btn secondary"} style={{ padding: "8px 14px", fontSize: ".85rem" }} onClick={() => setMode("bed")}>Plan wake-up</button>
        </div>
      </div>

      {mode === "wake" ? (
        <div className="field" style={{ maxWidth: 200 }}>
          <label>I need to wake up at</label>
          <input className="input" type="time" value={wakeTime} onChange={(e) => setWakeTime(e.target.value)} />
        </div>
      ) : (
        <div className="field" style={{ maxWidth: 200 }}>
          <label>I'm going to bed at</label>
          <input className="input" type="time" value={bedTime} onChange={(e) => setBedTime(e.target.value)} />
        </div>
      )}

      <div className="field" style={{ maxWidth: 150 }}>
        <label>Time to fall asleep (min)</label>
        <input className="input" type="number" min={0} max={60} value={fallAsleep} onChange={(e) => setFallAsleep(parseInt(e.target.value) || 14)} />
      </div>

      {results.length > 0 && (
        <div className="field">
          <label>{mode === "wake" ? "Best times to go to bed" : "Best times to wake up"}</label>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {results.map((r, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 14, padding: "10px 14px", background: i === 0 ? "color-mix(in srgb, var(--accent) 8%, var(--surface))" : "var(--bg-2)", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)" }}>
                <span style={{ fontSize: "1.2rem", fontWeight: 700, fontFamily: "var(--font-mono), monospace", minWidth: 100 }}>{r.time}</span>
                <span style={{ color: "var(--muted)", fontSize: ".88rem" }}>{r.cycles} sleep cycles · {r.cycles * CYCLE} min sleep</span>
                {i === 0 && <span className="badge">Recommended</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      <p className="privacy-note">🔒 Based on 90-minute sleep cycles. All calculations run in your browser. Not medical advice.</p>
    </div>
  );
}
