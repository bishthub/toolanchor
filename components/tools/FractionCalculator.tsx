"use client";

import { useEffect, useState } from "react";
import { readShared } from "@/lib/share";
import ShareResult from "@/components/ShareResult";

type Op = "add" | "sub" | "mul" | "div";

const OPS: { id: Op; sign: string }[] = [
  { id: "add", sign: "+" },
  { id: "sub", sign: "−" },
  { id: "mul", sign: "×" },
  { id: "div", sign: "÷" },
];

const gcd = (a: number, b: number): number => (b === 0 ? Math.abs(a) : gcd(b, a % b));

const fracStr = (n: number, d: number) => (d === 1 ? String(n) : `${n}/${d}`);

const mixedStr = (n: number, d: number) => {
  if (d === 1) return String(n);
  const sign = n < 0 ? "-" : "";
  const abs = Math.abs(n);
  const whole = Math.floor(abs / d);
  const rem = abs % d;
  if (whole === 0) return `${sign}${abs}/${d}`;
  if (rem === 0) return `${sign}${whole}`;
  return `${sign}${whole} ${rem}/${d}`;
};

const isInt = (s: string) => s === "" || /^-?\d+$/.test(s.trim());

export default function FractionCalculator() {
  const [w1, setW1] = useState("");
  const [n1, setN1] = useState("");
  const [d1, setD1] = useState("");
  const [op, setOp] = useState<Op>("add");
  const [w2, setW2] = useState("");
  const [n2, setN2] = useState("");
  const [d2, setD2] = useState("");

  useEffect(() => {
    const s = readShared(["w1", "n1", "d1", "op", "w2", "n2", "d2"]);
    if (s.w1) setW1(s.w1);
    if (s.n1) setN1(s.n1);
    if (s.d1) setD1(s.d1);
    if (s.op === "add" || s.op === "sub" || s.op === "mul" || s.op === "div") setOp(s.op);
    if (s.w2) setW2(s.w2);
    if (s.n2) setN2(s.n2);
    if (s.d2) setD2(s.d2);
  }, []);

  const sign = OPS.find((o) => o.id === op)!.sign;

  // Parse each side into an improper fraction (integer math throughout).
  const allInts = [w1, n1, d1, w2, n2, d2].every(isInt);
  const parse = (w: string, n: string, d: string): [number, number] | null => {
    const whole = w.trim() === "" ? 0 : parseInt(w, 10);
    const num = n.trim() === "" ? 0 : parseInt(n, 10);
    const den = d.trim() === "" ? 1 : parseInt(d, 10);
    if (den === 0) return null;
    const ad = Math.abs(den);
    const sd = Math.sign(den);
    if (whole === 0) return [num * sd, ad];
    // Mixed-number convention: the sign of the whole part applies to the whole value.
    const s = whole < 0 ? -1 : 1;
    return [s * (Math.abs(whole) * ad + Math.abs(num)) * sd, ad];
  };

  const entered = (w: string, n: string) => w.trim() !== "" || n.trim() !== "";
  const f1 = allInts && entered(w1, n1) ? parse(w1, n1, d1) : null;
  const f2 = allInts && entered(w2, n2) ? parse(w2, n2, d2) : null;

  let error: string | null = null;
  if (allInts && entered(w1, n1) && entered(w2, n2)) {
    if (!f1 || !f2) error = "Denominators can't be zero.";
    else if (op === "div" && f2[0] === 0) error = "Cannot divide by zero.";
  } else if (!allInts) {
    error = "Use whole numbers only (numerators, denominators and whole parts).";
  }

  let ready = false;
  let rn = 0, rd = 1;
  let working = "";
  if (f1 && f2 && !error) {
    ready = true;
    const [a, b] = f1;
    const [c, d] = f2;
    if (op === "add" || op === "sub") {
      const l = (b / gcd(b, d)) * d; // least common denominator
      const a2 = a * (l / b);
      const c2 = c * (l / d);
      rn = op === "add" ? a2 + c2 : a2 - c2;
      rd = l;
      working =
        b !== d
          ? `${fracStr(a, b)} ${sign} ${fracStr(c, d)} = ${fracStr(a2, l)} ${sign} ${fracStr(c2, l)} = ${fracStr(rn, rd)}`
          : `${fracStr(a, b)} ${sign} ${fracStr(c, d)} = ${fracStr(rn, rd)}`;
    } else if (op === "mul") {
      rn = a * c;
      rd = b * d;
      working = `${fracStr(a, b)} × ${fracStr(c, d)} = ${fracStr(rn, rd)}`;
    } else {
      rn = a * d;
      rd = b * c;
      working = `${fracStr(a, b)} ÷ ${fracStr(c, d)} = ${fracStr(a, b)} × ${fracStr(d, c)} = ${fracStr(rn, rd)}`;
    }
    // Normalise sign and simplify with GCD.
    if (rd < 0) { rn = -rn; rd = -rd; }
    const g = gcd(rn, rd) || 1;
    const sn = rn / g, sd = rd / g;
    if (sn !== rn || sd !== rd) working += ` = ${fracStr(sn, sd)}`;
    rn = sn;
    rd = sd;
  }

  const decimal = ready ? String(Number((rn / rd).toPrecision(6))) : "—";

  const fractionInputs = (
    w: string, n: string, d: string,
    setW: (v: string) => void, setN: (v: string) => void, setD: (v: string) => void,
    label: string
  ) => (
    <div className="field">
      <label>{label}</label>
      <div className="row">
        <input type="number" className="input" placeholder="Whole" value={w} onChange={(e) => setW(e.target.value)} style={{ maxWidth: 90 }} />
        <input type="number" className="input" placeholder="Numerator" value={n} onChange={(e) => setN(e.target.value)} />
        <input type="number" className="input" placeholder="Denominator" value={d} onChange={(e) => setD(e.target.value)} />
      </div>
    </div>
  );

  return (
    <div>
      {fractionInputs(w1, n1, d1, setW1, setN1, setD1, "First fraction (whole part optional)")}

      <div className="field">
        <label>Operation</label>
        <div className="row">
          {OPS.map((o) => (
            <button key={o.id} type="button" className={`btn ${op === o.id ? "" : "secondary"}`} onClick={() => setOp(o.id)}>
              {o.sign}
            </button>
          ))}
        </div>
      </div>

      {fractionInputs(w2, n2, d2, setW2, setN2, setD2, "Second fraction (whole part optional)")}

      {error && <p style={{ color: "#ff6b6b" }}>{error}</p>}

      {ready && (
        <>
          <div className="stats">
            <div className="stat"><div className="n">{fracStr(rn, rd)}</div><div className="l">Fraction</div></div>
            <div className="stat"><div className="n">{mixedStr(rn, rd)}</div><div className="l">Mixed number</div></div>
            <div className="stat"><div className="n">{decimal}</div><div className="l">Decimal</div></div>
          </div>
          <p style={{ color: "var(--muted)", fontSize: ".85rem", marginTop: 10 }}>{working}</p>
          <ShareResult values={{ w1, n1, d1, op, w2, n2, d2 }} />
        </>
      )}

      <p className="privacy-note">🔒 Calculated instantly in your browser.</p>
    </div>
  );
}
