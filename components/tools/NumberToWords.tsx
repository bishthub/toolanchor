"use client";

import { useState } from "react";

const ONES = ["", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten",
  "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen"];
const TENS = ["", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"];
const SCALE = ["", "thousand", "million", "billion", "trillion", "quadrillion"];

function chunk(n: number): string {
  let s = "";
  if (n >= 100) { s += ONES[Math.floor(n / 100)] + " hundred"; n %= 100; if (n) s += " "; }
  if (n >= 20) { s += TENS[Math.floor(n / 10)]; if (n % 10) s += "-" + ONES[n % 10]; }
  else if (n > 0) s += ONES[n];
  return s;
}

function toWords(input: string): string {
  const neg = input.trim().startsWith("-");
  const [intPart, decPart] = input.replace(/[^0-9.]/g, "").split(".");
  let n = BigInt(intPart || "0");
  if (n === 0n && !decPart) return "zero";
  const groups: string[] = [];
  let i = 0;
  if (n === 0n) groups.push("zero");
  while (n > 0n) {
    const g = Number(n % 1000n);
    if (g) groups.unshift(chunk(g) + (SCALE[i] ? " " + SCALE[i] : ""));
    n /= 1000n;
    i++;
  }
  let words = groups.join(" ").trim() || "zero";
  if (neg) words = "negative " + words;
  if (decPart && /[0-9]/.test(decPart)) {
    words += " point " + decPart.split("").map((d) => ONES[+d] || "zero").join(" ");
  }
  return words.charAt(0).toUpperCase() + words.slice(1);
}

export default function NumberToWords() {
  const [value, setValue] = useState("");
  const [copied, setCopied] = useState(false);
  let words = "";
  let error: string | null = null;
  if (value.trim()) {
    try {
      if (!/^-?\d{1,18}(\.\d+)?$/.test(value.trim())) throw new Error();
      words = toWords(value);
    } catch { error = "Enter a number up to 18 digits (decimals allowed)."; }
  }

  async function copy() { await navigator.clipboard.writeText(words); setCopied(true); setTimeout(() => setCopied(false), 1200); }

  return (
    <div>
      <div className="field">
        <label>Number</label>
        <input className="input" value={value} onChange={(e) => setValue(e.target.value)} placeholder="1234.5" />
      </div>
      {error && <p style={{ color: "#ff6b6b" }}>{error}</p>}
      {words && (
        <div className="field">
          <label>In words</label>
          <textarea readOnly value={words} style={{ minHeight: 80 }} />
          <button className="btn" style={{ marginTop: 8 }} onClick={copy}>{copied ? "✓ Copied" : "Copy"}</button>
        </div>
      )}
      <p className="privacy-note">🔒 Converted instantly in your browser.</p>
    </div>
  );
}
