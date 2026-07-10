"use client";

import { useState, useMemo } from "react";

interface RingRow { label: string; us: string; uk: string; eu: string; jp: string; mm: number }
const RING_TABLE: RingRow[] = [
  { label: "5", us: "5", uk: "J ½", eu: "49", jp: "9", mm: 49.3 },
  { label: "5.5", us: "5.5", uk: "K", eu: "50", jp: "10", mm: 50.6 },
  { label: "6", us: "6", uk: "L", eu: "51", jp: "11", mm: 51.9 },
  { label: "6.5", us: "6.5", uk: "L ½", eu: "53", jp: "12", mm: 53.1 },
  { label: "7", us: "7", uk: "M ½", eu: "54", jp: "13", mm: 54.4 },
  { label: "7.5", us: "7.5", uk: "N", eu: "56", jp: "14", mm: 55.7 },
  { label: "8", us: "8", uk: "O", eu: "57", jp: "15", mm: 57.0 },
  { label: "8.5", us: "8.5", uk: "O ½", eu: "58", jp: "16", mm: 58.3 },
  { label: "9", us: "9", uk: "P", eu: "59", jp: "17", mm: 59.5 },
  { label: "9.5", us: "9.5", uk: "P ½", eu: "60", jp: "18", mm: 60.8 },
  { label: "10", us: "10", uk: "Q ½", eu: "62", jp: "19", mm: 62.1 },
  { label: "10.5", us: "10.5", uk: "R", eu: "63", jp: "20", mm: 63.4 },
  { label: "11", us: "11", uk: "S", eu: "64", jp: "21", mm: 64.6 },
  { label: "11.5", us: "11.5", uk: "S ½", eu: "65", jp: "22", mm: 65.9 },
  { label: "12", us: "12", uk: "T ½", eu: "66", jp: "23", mm: 67.2 },
  { label: "13", us: "13", uk: "U ½", eu: "69", jp: "24", mm: 69.7 },
];

export default function RingSizeCalculator() {
  const [mm, setMm] = useState("");

  const result = useMemo(() => {
    const m = parseFloat(mm);
    if (!m || m < 10 || m > 80) return null;
    const closest = RING_TABLE.reduce((prev, curr) => Math.abs(curr.mm - m) < Math.abs(prev.mm - m) ? curr : prev);
    return closest;
  }, [mm]);

  return (
    <div>
      <div className="field" style={{ maxWidth: 220 }}>
        <label>Finger circumference (mm)</label>
        <input className="input" type="number" step="0.5" value={mm} onChange={(e) => setMm(e.target.value)} placeholder="e.g. 54.4" />
        <p style={{ color: "var(--muted)", fontSize: ".8rem", marginTop: 4 }}>Wrap string around finger, measure length in mm.</p>
      </div>

      {result && (
        <div style={{ border: "1px solid var(--border)", borderRadius: "var(--radius)", background: "var(--surface)", padding: "20px", boxShadow: "var(--shadow)" }}>
          <div style={{ textAlign: "center", marginBottom: 16 }}>
            <span style={{ fontSize: "2.2rem", fontWeight: 700 }}>US {result.us}</span>
            <span style={{ color: "var(--muted)", marginLeft: 12 }}>· {result.mm} mm</span>
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: ".88rem" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border)", background: "var(--surface-2)" }}>
                <th style={{ padding: "8px 12px", textAlign: "left" }}>System</th>
                <th style={{ padding: "8px 12px", textAlign: "center" }}>Size</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: "1px solid var(--border)" }}><td style={{ padding: "8px 12px" }}>US / Canada</td><td style={{ padding: "8px 12px", textAlign: "center", fontWeight: 650 }}>{result.us}</td></tr>
              <tr style={{ borderBottom: "1px solid var(--border)" }}><td style={{ padding: "8px 12px" }}>UK / Australia</td><td style={{ padding: "8px 12px", textAlign: "center" }}>{result.uk}</td></tr>
              <tr style={{ borderBottom: "1px solid var(--border)" }}><td style={{ padding: "8px 12px" }}>Europe</td><td style={{ padding: "8px 12px", textAlign: "center" }}>{result.eu}</td></tr>
              <tr><td style={{ padding: "8px 12px" }}>Japan</td><td style={{ padding: "8px 12px", textAlign: "center" }}>{result.jp}</td></tr>
            </tbody>
          </table>
        </div>
      )}

      <p className="privacy-note">🔒 All calculations run in your browser. Sizes are approximate — try on a physical ring for confirmation.</p>
    </div>
  );
}
