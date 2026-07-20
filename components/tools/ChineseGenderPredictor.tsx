"use client";

import { useState, useMemo } from "react";

// Traditional Chinese gender chart — rows are lunar age 18–45, columns Jan–Dec.
// B = boy, G = girl. For entertainment only; no scientific basis.
const CHART: Record<number, string> = {
  18: "BGBGGBBBBBBB", 19: "GBGBBGGBBBGG", 20: "BGBGGBBGGGBB", 21: "GBBBBBBBBBBB",
  22: "BGBGGGBGBBBB", 23: "GBGBBBGBGGBG", 24: "BGBGGGBBBBBB", 25: "GBGGBGGBGBBB",
  26: "BGBGGBBGBBBB", 27: "GBGBGGBBGBBG", 28: "BGBGBBGGGBBB", 29: "GBBBGGGBBGBB",
  30: "BGGGGGGGGGGG", 31: "BBBGGGGGGGBG", 32: "BBBGGGGGGGBB", 33: "GBBBGGGGGGBG",
  34: "BGBBBGGGGGGG", 35: "BBGBBBGGGGGG", 36: "GBBGBBBGGGGG", 37: "BGBBGBBBGBGG",
  38: "GBGBBGBBBGBG", 39: "BGBGBBGBBBGB", 40: "GBGBGBBGBGBG", 41: "BGBGBGBBGBGB",
  42: "GBGBGBGBBGBG", 43: "BGBGBGBGBBGB", 44: "BBGBGBGBGBBG", 45: "GBBGBGBGBGBB",
};
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export default function ChineseGenderPredictor() {
  const [dob, setDob] = useState("");
  const [concMonth, setConcMonth] = useState(""); // yyyy-mm

  const model = useMemo(() => {
    if (!dob || !concMonth) return null;
    const birth = new Date(dob + "T00:00:00");
    const [cy, cm] = concMonth.split("-").map((x) => parseInt(x, 10));
    if (isNaN(birth.getTime()) || !cy || !cm) return null;

    // Age at conception, then +1 for Chinese lunar age (approximation)
    let age = cy - birth.getFullYear();
    if (cm < birth.getMonth() + 1) age -= 1;
    const lunarAge = age + 1;
    if (lunarAge < 18 || lunarAge > 45) return { lunarAge, out: false as const };

    const prediction = CHART[lunarAge][cm - 1] === "B" ? "Boy" : "Girl";
    return { lunarAge, month: cm, prediction, out: true as const };
  }, [dob, concMonth]);

  const ages = Object.keys(CHART).map(Number);

  return (
    <div>
      <div className="row">
        <div className="field" style={{ maxWidth: 220 }}>
          <label>Mother's date of birth</label>
          <input className="input" type="date" value={dob} onChange={(e) => setDob(e.target.value)} />
        </div>
        <div className="field" style={{ maxWidth: 200 }}>
          <label>Month of conception</label>
          <input className="input" type="month" value={concMonth} onChange={(e) => setConcMonth(e.target.value)} />
        </div>
      </div>

      {!model && <p className="empty">Enter the mother's date of birth and the month of conception to read the chart.</p>}

      {model && !model.out && (
        <p className="empty">The traditional chart only covers lunar ages 18–45 (yours is {model.lunarAge}). Try different dates.</p>
      )}

      {model && model.out && (
        <>
          <div className={`result result--${model.prediction.toLowerCase()}`}>
            <div className="result-lbl">The chart predicts</div>
            <div className="result-val">{model.prediction}</div>
            <div className="result-sub">Lunar age {model.lunarAge} · conceived in {MONTHS[model.month - 1]}</div>
          </div>

          <div className="chart-wrap">
            <table className="chart">
              <thead>
                <tr><th className="corner">Age</th>{MONTHS.map((m) => <th key={m}>{m}</th>)}</tr>
              </thead>
              <tbody>
                {ages.map((age) => (
                  <tr key={age} className={age === model.lunarAge ? "rowon" : ""}>
                    <th className={age === model.lunarAge ? "colon" : ""}>{age}</th>
                    {CHART[age].split("").map((v, i) => {
                      const active = age === model.lunarAge && i + 1 === model.month;
                      return <td key={i} className={`c c--${v === "B" ? "boy" : "girl"}${active ? " active" : ""}`}>{v}</td>;
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="disclaimer">For entertainment only — this is a centuries-old tradition with no scientific basis. Ultrasound and genetic testing are the only reliable methods.</p>
        </>
      )}

      <p className="privacy-note">🔒 The prediction is computed in your browser and nothing is saved.</p>

      <style jsx>{`
        .empty { margin-top: 4px; color: var(--muted); font-size: 0.9rem; line-height: 1.55; }
        .result { margin-top: 22px; padding: 24px; border-radius: var(--radius); text-align: center; border: 1px solid var(--border); }
        .result--boy { background: var(--accent-soft); border-color: var(--ring); }
        .result--girl { background: color-mix(in srgb, #e11d48 9%, transparent); border-color: color-mix(in srgb, #e11d48 30%, transparent); }
        .result-lbl { font-family: var(--font-mono), monospace; font-size: 0.62rem; text-transform: uppercase; letter-spacing: 0.08em; color: var(--muted); }
        .result-val { font-family: var(--font-display), sans-serif; font-weight: 700; font-size: 2.6rem; letter-spacing: -0.02em; margin-top: 6px; line-height: 1; }
        .result--boy .result-val { color: var(--accent); }
        .result--girl .result-val { color: color-mix(in srgb, #e11d48 80%, var(--text)); }
        .result-sub { margin-top: 10px; color: var(--muted); font-size: 0.85rem; }
        .chart-wrap { margin-top: 22px; overflow-x: auto; border: 1px solid var(--border); border-radius: var(--radius-sm); }
        .chart { border-collapse: collapse; width: 100%; min-width: 520px; font-variant-numeric: tabular-nums; }
        .chart th, .chart td { text-align: center; padding: 5px 4px; font-size: 0.72rem; }
        .chart thead th { position: sticky; top: 0; background: var(--surface-2); color: var(--muted); font-family: var(--font-mono), monospace; font-weight: 500; font-size: 0.62rem; }
        .chart tbody th { background: var(--surface-2); color: var(--muted); font-family: var(--font-mono), monospace; font-weight: 500; }
        .corner { color: var(--faint) !important; }
        .c { color: var(--faint); font-weight: 600; }
        .c--boy { color: color-mix(in srgb, var(--accent) 65%, var(--faint)); }
        .c--girl { color: color-mix(in srgb, #e11d48 55%, var(--faint)); }
        .rowon td, .rowon th { background: color-mix(in srgb, var(--accent) 6%, transparent); }
        .colon { background: color-mix(in srgb, var(--accent) 12%, transparent) !important; color: var(--text) !important; }
        .c.active { background: var(--accent); color: var(--accent-ink); font-weight: 700; border-radius: 5px; box-shadow: 0 2px 8px var(--ring); }
        .disclaimer { margin-top: 12px; color: var(--faint); font-size: 0.78rem; line-height: 1.5; }
      `}</style>
    </div>
  );
}
