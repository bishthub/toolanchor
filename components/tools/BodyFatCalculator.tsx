"use client";

import { useState, useMemo } from "react";

function calcBodyFat(gender: "male" | "female", height: number, neck: number, waist: number, hip?: number): number | null {
  if (gender === "male") {
    if (!height || !neck || !waist) return null;
    if (waist <= neck) return null;
    // US Navy: 86.010 × log10(waist - neck) - 70.041 × log10(height) + 36.76
    return 86.010 * Math.log10(waist - neck) - 70.041 * Math.log10(height) + 36.76;
  } else {
    if (!height || !neck || !waist || !hip) return null;
    if (waist + hip <= neck) return null;
    // US Navy: 163.205 × log10(waist + hip - neck) - 97.684 × log10(height) - 78.387
    return 163.205 * Math.log10(waist + hip - neck) - 97.684 * Math.log10(height) - 78.387;
  }
}

function clamp(v: number, min: number, max: number) { return Math.max(min, Math.min(max, v)); }

export default function BodyFatCalculator() {
  const [gender, setGender] = useState<"male" | "female">("male");
  const [height, setHeight] = useState("");
  const [neck, setNeck] = useState("");
  const [waist, setWaist] = useState("");
  const [hip, setHip] = useState("");

  const result = useMemo(() => {
    const h = parseFloat(height);
    const n = parseFloat(neck);
    const w = parseFloat(waist);
    const h2 = parseFloat(hip);
    if (!h || !n || !w) return null;
    if (gender === "female" && !h2) return null;
    const bf = calcBodyFat(gender, h, n, w, gender === "female" ? h2 : undefined);
    if (bf === null) return null;
    const clamped = clamp(bf, 2, 70);
    const weight = 80; // example weight for mass calc
    const fatMass = weight * clamped / 100;
    const leanMass = weight - fatMass;
    return {
      bf: Math.round(clamped * 10) / 10,
      fatMass: Math.round(fatMass * 10) / 10,
      leanMass: Math.round(leanMass * 10) / 10,
      category: clamped < 10 ? "Essential fat" : clamped < 16 ? "Athletic" : clamped < 22 ? "Fitness" : clamped < 28 ? "Average" : "Obese"
    };
  }, [gender, height, neck, waist, hip]);

  return (
    <div>
      <div className="row">
        <div className="field" style={{ maxWidth: 200 }}>
          <label>Gender</label>
          <select className="input" value={gender} onChange={(e) => setGender(e.target.value as typeof gender)}>
            <option value="male">Male</option>
            <option value="female">Female</option>
          </select>
        </div>
      </div>
      <div className="row">
        <div className="field"><label>Height (cm)</label><input className="input" type="number" value={height} onChange={(e) => setHeight(e.target.value)} placeholder="e.g. 175" /></div>
        <div className="field"><label>Neck circumference (cm)</label><input className="input" type="number" value={neck} onChange={(e) => setNeck(e.target.value)} placeholder="e.g. 38" /></div>
        <div className="field"><label>Waist circumference (cm)</label><input className="input" type="number" value={waist} onChange={(e) => setWaist(e.target.value)} placeholder="e.g. 85" /></div>
        {gender === "female" && <div className="field"><label>Hip circumference (cm)</label><input className="input" type="number" value={hip} onChange={(e) => setHip(e.target.value)} placeholder="e.g. 95" /></div>}
      </div>
      {result && (
        <div className="stats">
          <div className="stat"><div className="n">{result.bf}%</div><div className="l">Body fat</div></div>
          <div className="stat"><div className="n">{result.category}</div><div className="l">Category</div></div>
          <div className="stat"><div className="n">{result.fatMass} kg</div><div className="l">Fat mass (est.)</div></div>
          <div className="stat"><div className="n">{result.leanMass} kg</div><div className="l">Lean mass (est.)</div></div>
        </div>
      )}
      <p className="privacy-note">🔒 Uses the US Navy formula. All calculations run in your browser — nothing is uploaded.</p>
    </div>
  );
}
