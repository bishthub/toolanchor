"use client";

import { useState, useMemo } from "react";

export default function DogAgeCalculator() {
  const [age, setAge] = useState("3");
  const [size, setSize] = useState<"small" | "medium" | "large" | "giant">("medium");

  const result = useMemo(() => {
    const y = parseFloat(age);
    if (!y || y <= 0) return null;
    // Veterinary consensus: year 1 = 15, year 2 = +9, then varies by size
    const sizeFactors: Record<string, number> = { small: 4, medium: 5, large: 6, giant: 7 };
    const factor = sizeFactors[size] || 5;
    let human: number;
    if (y <= 1) human = 15 * y;
    else if (y <= 2) human = 15 + 9 * (y - 1);
    else human = 15 + 9 + factor * (y - 2);

    let stage: string;
    if (human < 20) stage = "Puppy / Junior";
    else if (human < 35) stage = "Young adult";
    else if (human < 50) stage = "Adult";
    else if (human < 65) stage = "Mature";
    else if (human < 80) stage = "Senior";
    else stage = "Geriatric";

    return { human: Math.round(human * 10) / 10, stage };
  }, [age, size]);

  return (
    <div>
      <div className="row">
        <div className="field" style={{ maxWidth: 150 }}><label>Dog's age (years)</label><input className="input" type="number" min={0} max={30} step={0.5} value={age} onChange={(e) => setAge(e.target.value)} /></div>
        <div className="field" style={{ maxWidth: 200 }}><label>Breed size</label>
          <select className="input" value={size} onChange={(e) => setSize(e.target.value as typeof size)}>
            <option value="small">Small (≤10 kg / 22 lbs)</option>
            <option value="medium">Medium (10–25 kg / 22–55 lbs)</option>
            <option value="large">Large (25–45 kg / 55–99 lbs)</option>
            <option value="giant">Giant (≥45 kg / 99+ lbs)</option>
          </select>
        </div>
      </div>
      {result && (
        <div className="stats">
          <div className="stat"><div className="n" style={{ fontSize: "1.8rem" }}>{result.human}</div><div className="l">Human years</div></div>
          <div className="stat"><div className="n" style={{ fontSize: "1rem" }}>{result.stage}</div><div className="l">Life stage</div></div>
        </div>
      )}
      <p className="privacy-note">🔒 Based on veterinary consensus. All calculations run in your browser.</p>
    </div>
  );
}
