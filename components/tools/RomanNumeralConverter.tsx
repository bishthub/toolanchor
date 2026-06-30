"use client";

import { useState } from "react";

const MAP: [number, string][] = [
  [1000, "M"], [900, "CM"], [500, "D"], [400, "CD"], [100, "C"], [90, "XC"],
  [50, "L"], [40, "XL"], [10, "X"], [9, "IX"], [5, "V"], [4, "IV"], [1, "I"],
];

function toRoman(n: number): string {
  let out = "";
  for (const [v, s] of MAP) while (n >= v) { out += s; n -= v; }
  return out;
}
function fromRoman(s: string): number | null {
  const str = s.toUpperCase().trim();
  if (!/^[MDCLXVI]+$/.test(str)) return null;
  let i = 0, n = 0;
  for (const [v, sym] of MAP) {
    while (str.startsWith(sym, i)) { n += v; i += sym.length; }
  }
  // Round-trip check guarantees a valid, canonical numeral.
  return i === str.length && toRoman(n) === str ? n : null;
}

export default function RomanNumeralConverter() {
  const [num, setNum] = useState("");
  const [roman, setRoman] = useState("");

  function onNum(v: string) {
    setNum(v);
    const n = parseInt(v, 10);
    setRoman(n >= 1 && n <= 3999 ? toRoman(n) : "");
  }
  function onRoman(v: string) {
    setRoman(v);
    const n = fromRoman(v);
    setNum(n !== null ? String(n) : "");
  }

  const numValid = num === "" || (parseInt(num, 10) >= 1 && parseInt(num, 10) <= 3999);
  const romanValid = roman === "" || fromRoman(roman) !== null;

  return (
    <div>
      <div className="field">
        <label>Number (1–3999)</label>
        <input className="input" type="number" value={num} onChange={(e) => onNum(e.target.value)} placeholder="2026" />
        {!numValid && <p style={{ color: "#ff6b6b", fontSize: ".82rem", marginTop: 6 }}>Enter a number from 1 to 3999.</p>}
      </div>
      <div className="field">
        <label>Roman numeral</label>
        <input className="input mono" value={roman} onChange={(e) => onRoman(e.target.value)} placeholder="MMXXVI" />
        {!romanValid && <p style={{ color: "#ff6b6b", fontSize: ".82rem", marginTop: 6 }}>Not a valid Roman numeral.</p>}
      </div>
      <p className="privacy-note">🔒 Converted instantly in your browser.</p>
    </div>
  );
}
