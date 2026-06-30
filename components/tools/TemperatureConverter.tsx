"use client";

import { useState } from "react";

type Unit = "c" | "f" | "k";

function convert(value: number, from: Unit): Record<Unit, number> {
  // Normalise to Celsius first.
  let c: number;
  if (from === "c") c = value;
  else if (from === "f") c = (value - 32) * (5 / 9);
  else c = value - 273.15;
  return { c, f: c * (9 / 5) + 32, k: c + 273.15 };
}

const round = (n: number) => Number.isFinite(n) ? Math.round(n * 100) / 100 : NaN;

export default function TemperatureConverter() {
  const [value, setValue] = useState("100");
  const [unit, setUnit] = useState<Unit>("c");

  const v = parseFloat(value);
  const out = Number.isFinite(v) ? convert(v, unit) : null;

  return (
    <div>
      <div className="row">
        <div className="field">
          <label>Value</label>
          <input type="number" className="input" value={value} onChange={(e) => setValue(e.target.value)} />
        </div>
        <div className="field" style={{ maxWidth: 200 }}>
          <label>From unit</label>
          <select className="input" value={unit} onChange={(e) => setUnit(e.target.value as Unit)}>
            <option value="c">Celsius (°C)</option>
            <option value="f">Fahrenheit (°F)</option>
            <option value="k">Kelvin (K)</option>
          </select>
        </div>
      </div>

      {out && (
        <div className="stats">
          <div className="stat"><div className="n">{round(out.c)}°C</div><div className="l">Celsius</div></div>
          <div className="stat"><div className="n">{round(out.f)}°F</div><div className="l">Fahrenheit</div></div>
          <div className="stat"><div className="n">{round(out.k)} K</div><div className="l">Kelvin</div></div>
        </div>
      )}
      <p className="privacy-note">🔒 Converted instantly in your browser.</p>
    </div>
  );
}
