"use client";

import { useState, useMemo } from "react";

export default function CatAgeCalculator() {
  const [age, setAge] = useState("3");
  const [lifestyle, setLifestyle] = useState<"indoor" | "outdoor" | "both">("indoor");

  const result = useMemo(() => {
    const y = parseFloat(age);
    if (!y || y <= 0) return null;
    let human: number;
    if (y <= 1) human = 15 * y;
    else if (y <= 2) human = 15 + 9 * (y - 1);
    else human = 15 + 9 + 4 * (y - 2);

    let stage: string;
    if (human < 20) stage = "Kitten";
    else if (human < 30) stage = "Junior";
    else if (human < 45) stage = "Adult";
    else if (human < 60) stage = "Mature";
    else if (human < 75) stage = "Senior";
    else stage = "Super-senior";

    const avgLifespan = lifestyle === "indoor" ? "12–18 years" : lifestyle === "outdoor" ? "5–8 years" : "8–15 years";

    return { human: Math.round(human * 10) / 10, stage, avgLifespan };
  }, [age, lifestyle]);

  return (
    <div>
      <div className="row">
        <div className="field" style={{ maxWidth: 150 }}><label>Cat's age (years)</label><input className="input" type="number" min={0} max={30} step={0.5} value={age} onChange={(e) => setAge(e.target.value)} /></div>
        <div className="field" style={{ maxWidth: 200 }}><label>Lifestyle</label>
          <select className="input" value={lifestyle} onChange={(e) => setLifestyle(e.target.value as typeof lifestyle)}>
            <option value="indoor">Indoor only</option>
            <option value="both">Indoor/outdoor</option>
            <option value="outdoor">Outdoor only</option>
          </select>
        </div>
      </div>
      {result && (
        <div className="stats">
          <div className="stat"><div className="n" style={{ fontSize: "1.8rem" }}>{result.human}</div><div className="l">Human years</div></div>
          <div className="stat"><div className="n" style={{ fontSize: "1rem" }}>{result.stage}</div><div className="l">Life stage</div></div>
          <div className="stat"><div className="n" style={{ fontSize: ".9rem" }}>{result.avgLifespan}</div><div className="l">Avg lifespan</div></div>
        </div>
      )}
      <p className="privacy-note">🔒 Uses the standard cat-age formula. All calculations run in your browser.</p>
    </div>
  );
}
