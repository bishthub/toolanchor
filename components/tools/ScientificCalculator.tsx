"use client";

import { useState } from "react";

// ── Safe expression evaluator (tokenizer + recursive descent, no eval) ──

type Tok =
  | { t: "num"; v: number }
  | { t: "id"; v: string }
  | { t: "op"; v: string };

function tokenize(src: string): Tok[] {
  const s = src
    .replace(/×/g, "*")
    .replace(/÷/g, "/")
    .replace(/−/g, "-")
    .replace(/π/g, "pi")
    .replace(/√/g, "sqrt");
  const out: Tok[] = [];
  let i = 0;
  while (i < s.length) {
    const c = s[i];
    if (c === " " || c === "\t") { i++; continue; }
    if (/[0-9.]/.test(c)) {
      let j = i;
      while (j < s.length && /[0-9.]/.test(s[j])) j++;
      const v = Number(s.slice(i, j));
      if (!Number.isFinite(v)) throw new Error("bad number");
      out.push({ t: "num", v });
      i = j;
    } else if (/[a-zA-Z]/.test(c)) {
      let j = i;
      while (j < s.length && /[a-zA-Z]/.test(s[j])) j++;
      out.push({ t: "id", v: s.slice(i, j).toLowerCase() });
      i = j;
    } else if ("+-*/^%!()".includes(c)) {
      out.push({ t: "op", v: c });
      i++;
    } else {
      throw new Error("bad char");
    }
  }
  return out;
}

const toRad = (x: number, deg: boolean) => (deg ? (x * Math.PI) / 180 : x);
const fromRad = (x: number, deg: boolean) => (deg ? (x * 180) / Math.PI : x);

const FUNCS: Record<string, (x: number, deg: boolean) => number> = {
  sin: (x, d) => Math.sin(toRad(x, d)),
  cos: (x, d) => Math.cos(toRad(x, d)),
  tan: (x, d) => Math.tan(toRad(x, d)),
  asin: (x, d) => fromRad(Math.asin(x), d),
  acos: (x, d) => fromRad(Math.acos(x), d),
  atan: (x, d) => fromRad(Math.atan(x), d),
  log: (x) => Math.log10(x),
  ln: (x) => Math.log(x),
  exp: (x) => Math.exp(x),
  sqrt: (x) => Math.sqrt(x),
};

function factorial(n: number): number {
  if (!Number.isInteger(n) || n < 0 || n > 170) throw new Error("bad factorial");
  let r = 1;
  for (let k = 2; k <= n; k++) r *= k;
  return r;
}

function evalExpr(src: string, deg: boolean, ans: number): number {
  const toks = tokenize(src);
  let i = 0;
  const peek = () => (i < toks.length ? toks[i] : null);
  const isOp = (v: string) => { const p = peek(); return p !== null && p.t === "op" && p.v === v; };
  const expect = (v: string) => { if (!isOp(v)) throw new Error(`expected ${v}`); i++; };

  function expr(): number {
    let v = term();
    for (;;) {
      if (isOp("+")) { i++; v += term(); }
      else if (isOp("-")) { i++; v -= term(); }
      else break;
    }
    return v;
  }
  function term(): number {
    let v = unary();
    for (;;) {
      if (isOp("*")) { i++; v *= unary(); }
      else if (isOp("/")) { i++; v /= unary(); }
      else {
        const p = peek();
        // implicit multiplication: 2pi, 2(3+4), (1+2)(3+4)
        if (p && (p.t === "num" || p.t === "id" || (p.t === "op" && p.v === "("))) v *= unary();
        else break;
      }
    }
    return v;
  }
  function unary(): number {
    if (isOp("-")) { i++; return -unary(); }
    if (isOp("+")) { i++; return unary(); }
    return power();
  }
  function power(): number {
    const base = postfix();
    if (isOp("^")) { i++; return Math.pow(base, unary()); }
    return base;
  }
  function postfix(): number {
    let v = atom();
    for (;;) {
      if (isOp("!")) { i++; v = factorial(v); }
      else if (isOp("%")) { i++; v /= 100; }
      else break;
    }
    return v;
  }
  function atom(): number {
    const p = peek();
    if (!p) throw new Error("unexpected end");
    i++;
    if (p.t === "num") return p.v;
    if (p.t === "op" && p.v === "(") {
      const v = expr();
      expect(")");
      return v;
    }
    if (p.t === "id") {
      if (p.v === "pi") return Math.PI;
      if (p.v === "e") return Math.E;
      if (p.v === "ans") return ans;
      const fn = FUNCS[p.v];
      if (!fn) throw new Error("unknown name");
      let arg: number;
      if (isOp("(")) { i++; arg = expr(); expect(")"); }
      else arg = unary();
      return fn(arg, deg);
    }
    throw new Error("unexpected token");
  }

  const v = expr();
  if (i < toks.length) throw new Error("trailing input");
  return v;
}

const fmt = (n: number) => String(Number(n.toPrecision(12)));

// ── Component ──

const KEYS: string[][] = [
  ["sin(", "cos(", "tan(", "(", ")"],
  ["asin(", "acos(", "atan(", "^", "√("],
  ["log(", "ln(", "exp(", "!", "%"],
  ["7", "8", "9", "÷", "AC"],
  ["4", "5", "6", "×", "⌫"],
  ["1", "2", "3", "−", "Ans"],
  ["0", ".", "π", "e", "="],
];

export default function ScientificCalculator() {
  const [expr, setExpr] = useState("");
  const [deg, setDeg] = useState(true);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [ans, setAns] = useState(0);
  const [history, setHistory] = useState<{ e: string; r: string }[]>([]);

  function calc() {
    if (!expr.trim()) return;
    try {
      const v = evalExpr(expr, deg, ans);
      if (!Number.isFinite(v)) throw new Error("not finite");
      const r = fmt(v);
      setResult(r);
      setError(null);
      setAns(v);
      setHistory((h) => [{ e: expr, r }, ...h].slice(0, 5));
    } catch {
      setResult(null);
      setError("Invalid expression");
    }
  }

  function press(k: string) {
    if (k === "=") { calc(); return; }
    if (k === "AC") { setExpr(""); setResult(null); setError(null); return; }
    if (k === "⌫") { setExpr((s) => s.slice(0, -1)); return; }
    setExpr((s) => s + k);
    setError(null);
  }

  return (
    <div>
      <div className="row">
        <div className="field" style={{ flex: 1 }}>
          <label>Expression</label>
          <input
            type="text"
            className="input"
            value={expr}
            placeholder="e.g. sin(30) + 2^10 / 4"
            onChange={(e) => { setExpr(e.target.value); setError(null); }}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); calc(); } }}
          />
        </div>
        <div className="field" style={{ maxWidth: 160 }}>
          <label>Angle unit</label>
          <div className="row">
            <button type="button" className={`btn ${deg ? "" : "secondary"}`} onClick={() => setDeg(true)}>DEG</button>
            <button type="button" className={`btn ${deg ? "secondary" : ""}`} onClick={() => setDeg(false)}>RAD</button>
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 8, marginTop: 8 }}>
        {KEYS.flat().map((k) => (
          <button
            key={k}
            type="button"
            className={`btn ${k === "=" ? "" : "secondary"}`}
            onClick={() => press(k)}
          >
            {k}
          </button>
        ))}
      </div>

      {error && <p style={{ color: "#ff6b6b", marginTop: 12 }}>{error}</p>}

      {result !== null && (
        <div className="stat" style={{ marginTop: 16 }}>
          <div className="n">{result}</div>
          <div className="l">Result{deg ? " (DEG)" : " (RAD)"}</div>
        </div>
      )}

      {history.length > 0 && (
        <div className="field" style={{ marginTop: 16 }}>
          <label>History (click to reuse)</label>
          {history.map((h, idx) => (
            <button
              key={idx}
              type="button"
              className="btn secondary"
              style={{ display: "block", width: "100%", textAlign: "left", marginTop: 6 }}
              onClick={() => { setExpr(h.e); setResult(h.r); setError(null); }}
            >
              {h.e} = {h.r}
            </button>
          ))}
        </div>
      )}

      <p className="privacy-note">🔒 Calculated instantly in your browser.</p>
    </div>
  );
}
