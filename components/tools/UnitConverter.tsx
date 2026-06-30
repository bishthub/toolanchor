"use client";

import { useState } from "react";

// Factors are "how many base units in one of this unit".
type UnitMap = Record<string, number>;
const CATEGORIES: Record<string, UnitMap> = {
  Length: { Millimetre: 0.001, Centimetre: 0.01, Metre: 1, Kilometre: 1000, Inch: 0.0254, Foot: 0.3048, Yard: 0.9144, Mile: 1609.344 },
  Weight: { Milligram: 0.001, Gram: 1, Kilogram: 1000, Tonne: 1e6, Ounce: 28.3495, Pound: 453.592, Stone: 6350.29 },
  Volume: { Millilitre: 0.001, Litre: 1, "Cubic metre": 1000, Teaspoon: 0.00492892, Tablespoon: 0.0147868, "Cup (US)": 0.236588, "Pint (US)": 0.473176, "Gallon (US)": 3.78541 },
  Area: { "Sq metre": 1, "Sq kilometre": 1e6, "Sq foot": 0.092903, "Sq mile": 2.59e6, Acre: 4046.86, Hectare: 10000 },
  Speed: { "m/s": 1, "km/h": 0.277778, mph: 0.44704, Knot: 0.514444 },
};

export default function UnitConverter() {
  const [cat, setCat] = useState("Length");
  const units = Object.keys(CATEGORIES[cat]);
  const [from, setFrom] = useState(units[0]);
  const [to, setTo] = useState(units[2] ?? units[1]);
  const [value, setValue] = useState("1");

  function changeCat(c: string) {
    setCat(c);
    const u = Object.keys(CATEGORIES[c]);
    setFrom(u[0]);
    setTo(u[2] ?? u[1]);
  }

  const v = parseFloat(value);
  const map = CATEGORIES[cat];
  const result = Number.isFinite(v) && map[from] && map[to] ? (v * map[from]) / map[to] : NaN;

  return (
    <div>
      <div className="field">
        <label>Category</label>
        <div className="row" style={{ flexWrap: "wrap" }}>
          {Object.keys(CATEGORIES).map((c) => (
            <button key={c} type="button" className={`btn ${cat === c ? "" : "secondary"}`} style={{ padding: "8px 14px" }} onClick={() => changeCat(c)}>{c}</button>
          ))}
        </div>
      </div>
      <div className="row" style={{ alignItems: "flex-end" }}>
        <div className="field"><label>Value</label><input className="input" type="number" value={value} onChange={(e) => setValue(e.target.value)} /></div>
        <div className="field"><label>From</label>
          <select className="input" value={from} onChange={(e) => setFrom(e.target.value)}>{units.map((u) => <option key={u}>{u}</option>)}</select>
        </div>
        <div className="field"><label>To</label>
          <select className="input" value={to} onChange={(e) => setTo(e.target.value)}>{units.map((u) => <option key={u}>{u}</option>)}</select>
        </div>
      </div>

      {Number.isFinite(result) && (
        <div className="stat">
          <div className="n">{result.toLocaleString(undefined, { maximumFractionDigits: 6 })}</div>
          <div className="l">{value} {from} = {to}</div>
        </div>
      )}
      <p className="privacy-note">🔒 Converted instantly in your browser.</p>
    </div>
  );
}
