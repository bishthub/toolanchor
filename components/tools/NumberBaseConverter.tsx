"use client";

import { useState } from "react";

const BASES = [
  { id: 2, label: "Binary", re: /^[01]+$/ },
  { id: 8, label: "Octal", re: /^[0-7]+$/ },
  { id: 10, label: "Decimal", re: /^[0-9]+$/ },
  { id: 16, label: "Hexadecimal", re: /^[0-9a-fA-F]+$/ },
];

export default function NumberBaseConverter() {
  const [value, setValue] = useState("");
  const [from, setFrom] = useState(10);

  const base = BASES.find((b) => b.id === from)!;
  const clean = value.trim();
  const valid = clean === "" || base.re.test(clean);
  const decimal = valid && clean ? parseInt(clean, from) : NaN;

  return (
    <div>
      <div className="row">
        <div className="field">
          <label>Value</label>
          <input className="input" value={value} onChange={(e) => setValue(e.target.value)} placeholder="Enter a number…" />
        </div>
        <div className="field" style={{ maxWidth: 200 }}>
          <label>Input base</label>
          <select className="input" value={from} onChange={(e) => setFrom(Number(e.target.value))}>
            {BASES.map((b) => <option key={b.id} value={b.id}>{b.label} (base {b.id})</option>)}
          </select>
        </div>
      </div>

      {clean && !valid && <p style={{ color: "#ff6b6b" }}>Not a valid {base.label.toLowerCase()} number.</p>}

      {Number.isFinite(decimal) && (
        <div className="stats">
          {BASES.map((b) => (
            <div className="stat" key={b.id}>
              <div className="n" style={{ fontSize: "1.1rem", fontFamily: "monospace", wordBreak: "break-all" }}>
                {decimal.toString(b.id).toUpperCase()}
              </div>
              <div className="l">{b.label}</div>
            </div>
          ))}
        </div>
      )}

      <p className="privacy-note">🔒 Converted instantly in your browser.</p>
    </div>
  );
}
