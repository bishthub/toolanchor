"use client";

import { useState } from "react";

function gcd(a: number, b: number): number {
  return b === 0 ? a : gcd(b, a % b);
}

interface FractionResult {
  numerator: number;
  denominator: number;
  whole: number;
  steps: string[];
}

function decimalToFraction(decimal: number): FractionResult | null {
  if (!isFinite(decimal) || isNaN(decimal)) return null;

  const steps: string[] = [];
  const sign = decimal < 0 ? -1 : 1;
  decimal = Math.abs(decimal);

  const whole = Math.floor(decimal);
  const frac = decimal - whole;
  steps.push(`Decimal: ${sign === 1 ? "" : "-"}${sign * decimal}`);
  if (whole > 0) steps.push(`Whole part: ${whole}`);

  if (frac === 0) {
    const numerator = whole * sign;
    const denominator = 1;
    steps.push(`${numerator} / ${denominator}`);
    return { numerator, denominator, whole: whole * sign, steps };
  }

  // Check for repeating decimal patterns
  let numerator: number;
  let denominator: number;

  // Use continued fractions for clean conversion
  const precision = 1e-12;
  let z = frac;
  let n1 = 0, n2 = 1;
  let d1 = 1, d2 = 0;

  steps.push(`Converting fractional part ${frac.toFixed(12)}…`);

  for (let i = 0; i < 100; i++) {
    const ai = Math.floor(z);
    let nNew = ai * n2 + n1;
    let dNew = ai * d2 + d1;

    if (Math.abs(frac - nNew / dNew) < precision) {
      numerator = nNew + whole * dNew;
      denominator = dNew;
      const g = gcd(Math.abs(numerator), denominator);
      numerator /= g;
      denominator /= g;
      numerator *= sign;

      steps.push(`${numerator}/${denominator} (gcd reduced)`);
      return { numerator, denominator, whole: whole * sign, steps };
    }

    n1 = n2; n2 = nNew;
    d1 = d2; d2 = dNew;

    const nextZ = z - ai;
    if (nextZ === 0) break;
    z = 1 / nextZ;
  }

  // Fallback: direct decimal conversion
  const digits = frac.toString().replace(/^0\./, "");
  const power = Math.pow(10, digits.length);
  numerator = Math.round(frac * power) + whole * power;
  denominator = power;
  const g = gcd(Math.abs(numerator), denominator);
  numerator /= g;
  denominator /= g;
  numerator *= sign;

  steps.push(`Reduced to simplest form: ${numerator}/${denominator}`);
  return { numerator, denominator, whole: whole * sign, steps };
}

export default function DecimalToFraction() {
  const [input, setInput] = useState("");

  const result = (() => {
    const n = parseFloat(input);
    if (isNaN(n)) return null;
    return decimalToFraction(n);
  })();

  return (
    <div>
      <div className="field" style={{ maxWidth: 280 }}>
        <label>Decimal number</label>
        <input
          className="input"
          type="text"
          inputMode="decimal"
          placeholder="e.g. 0.75, 1.333, 2.5"
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
      </div>

      {input && result && (
        <div className="stats">
          <div className="stat">
            <div className="n">
              {result.whole !== 0 && (
                <span>{result.whole} </span>
              )}
              <sup style={{ fontSize: ".85rem" }}>{result.numerator % result.denominator === 0 ? "" : (Math.abs(result.numerator) - Math.abs(result.whole) * result.denominator)}</sup>
              {Math.abs(result.numerator) % result.denominator !== 0 && (
                <sub style={{ fontSize: ".7rem" }}>/{result.denominator}</sub>
              )}
            </div>
            <div className="l">Fraction</div>
          </div>
        </div>
      )}

      {input && !result && (
        <p style={{ color: "var(--muted)" }}>Enter a valid decimal number.</p>
      )}

      {result && result.steps.length > 0 && (
        <div className="field" style={{ marginTop: 16 }}>
          <label>Step-by-step working</label>
          <div style={{ padding: "12px 16px", background: "var(--bg-2)", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", fontSize: ".85rem", fontFamily: "var(--font-mono), monospace", lineHeight: 1.8 }}>
            {result.steps.map((s, i) => (
              <div key={i}>{i + 1}. {s}</div>
            ))}
          </div>
        </div>
      )}

      <p className="privacy-note">🔒 Uses exact integer GCD reduction in your browser. Handles terminating and repeating decimals.</p>
    </div>
  );
}
