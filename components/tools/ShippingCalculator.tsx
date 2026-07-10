"use client";

import { useState, useMemo } from "react";

const DIM_FACTOR = 139; // USPS & FedEx
const ZONES = [
  { label: "Local (0–50 mi)", mult: 0.8 },
  { label: "Regional (50–150 mi)", mult: 1.0 },
  { label: "National (150–1000 mi)", mult: 1.4 },
  { label: "Cross-country (1000+ mi)", mult: 1.8 },
];

const CARRIER_BASE: Record<string, number> = { USPS: 7.50, UPS: 8.20, FedEx: 8.50, DHL: 9.00 };

export default function ShippingCalculator() {
  const [weight, setWeight] = useState("");
  const [length, setLength] = useState("");
  const [width, setWidth] = useState("");
  const [height, setHeight] = useState("");
  const [zone, setZone] = useState(1);

  const results = useMemo(() => {
    const w = parseFloat(weight);
    if (!w || w <= 0) return [];

    const l = parseFloat(length) || 0;
    const wi = parseFloat(width) || 0;
    const hi = parseFloat(height) || 0;

    // DIM weight
    let dimWeight = 0;
    if (l > 0 && wi > 0 && hi > 0) {
      dimWeight = (l * wi * hi) / DIM_FACTOR;
    }

    const billable = Math.max(w, dimWeight);
    const zoneMult = ZONES[zone]?.mult ?? 1;

    return Object.entries(CARRIER_BASE).map(([carrier, base]) => {
      const cost = (base + billable * 1.2) * zoneMult;
      return {
        carrier,
        cost: Math.round(cost * 100) / 100,
        weightType: dimWeight > w && dimWeight > 0 ? "DIM" : "Actual",
      };
    });
  }, [weight, length, width, height, zone]);

  return (
    <div>
      <div className="row">
        <div className="field" style={{ maxWidth: 150 }}><label>Weight (lbs)</label><input className="input" type="number" step="0.1" value={weight} onChange={(e) => setWeight(e.target.value)} placeholder="e.g. 5" /></div>
        <div className="field" style={{ maxWidth: 120 }}><label>Length (in)</label><input className="input" type="number" value={length} onChange={(e) => setLength(e.target.value)} placeholder="e.g. 12" /></div>
        <div className="field" style={{ maxWidth: 120 }}><label>Width (in)</label><input className="input" type="number" value={width} onChange={(e) => setWidth(e.target.value)} placeholder="e.g. 10" /></div>
        <div className="field" style={{ maxWidth: 120 }}><label>Height (in)</label><input className="input" type="number" value={height} onChange={(e) => setHeight(e.target.value)} placeholder="e.g. 8" /></div>
      </div>

      <div className="field" style={{ maxWidth: 250 }}>
        <label>Delivery zone</label>
        <select className="input" value={zone} onChange={(e) => setZone(parseInt(e.target.value))}>
          {ZONES.map((z, i) => <option key={i} value={i}>{z.label}</option>)}
        </select>
      </div>

      {weight && results.length > 0 && (
        <div className="field">
          <label>Estimated rates</label>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {results.map((r) => (
              <div key={r.carrier} style={{ display: "flex", alignItems: "center", gap: 14, padding: "10px 14px", background: "var(--bg-2)", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)" }}>
                <span style={{ fontWeight: 650, minWidth: 60 }}>{r.carrier}</span>
                <span style={{ fontFamily: "var(--font-mono), monospace", fontSize: "1rem", fontWeight: 600, marginLeft: "auto" }}>${r.cost.toFixed(2)}</span>
                <span style={{ fontSize: ".78rem", color: "var(--muted)" }}>({r.weightType} weight)</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <p className="privacy-note">🔒 Estimates based on published rates. Actual costs may vary. All calculations run in your browser.</p>
    </div>
  );
}
