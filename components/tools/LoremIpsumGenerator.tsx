"use client";

import { useState } from "react";

const WORDS = ("lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor " +
  "incididunt ut labore et dolore magna aliqua enim ad minim veniam quis nostrud exercitation " +
  "ullamco laboris nisi aliquip ex ea commodo consequat duis aute irure in reprehenderit voluptate " +
  "velit esse cillum eu fugiat nulla pariatur excepteur sint occaecat cupidatat non proident sunt culpa").split(" ");

function pick(n: number, start = 0): string[] {
  const out: string[] = [];
  for (let i = 0; i < n; i++) out.push(WORDS[(start + i) % WORDS.length]);
  return out;
}

function sentence(seed: number): string {
  const len = 8 + (seed % 8);
  const s = pick(len, seed).join(" ");
  return s.charAt(0).toUpperCase() + s.slice(1) + ".";
}

function paragraph(seed: number): string {
  const count = 3 + (seed % 4);
  return Array.from({ length: count }, (_, i) => sentence(seed + i * 5)).join(" ");
}

type Unit = "paragraphs" | "sentences" | "words";

export default function LoremIpsumGenerator() {
  const [unit, setUnit] = useState<Unit>("paragraphs");
  const [count, setCount] = useState(3);
  const [out, setOut] = useState("");
  const [copied, setCopied] = useState(false);

  function generate() {
    const n = Math.min(Math.max(count, 1), 100);
    let text = "";
    if (unit === "paragraphs") text = Array.from({ length: n }, (_, i) => paragraph(i * 7)).join("\n\n");
    else if (unit === "sentences") text = Array.from({ length: n }, (_, i) => sentence(i * 3)).join(" ");
    else text = pick(n).join(" ");
    setOut(text);
    setCopied(false);
  }

  async function copy() {
    await navigator.clipboard.writeText(out);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  }

  return (
    <div>
      <div className="row" style={{ alignItems: "flex-end" }}>
        <div className="field" style={{ maxWidth: 120 }}>
          <label>Amount</label>
          <input type="number" className="input" min={1} max={100} value={count} onChange={(e) => setCount(Number(e.target.value))} />
        </div>
        <div className="field">
          <label>Unit</label>
          <div className="row">
            {(["paragraphs", "sentences", "words"] as const).map((u) => (
              <button key={u} type="button" className={`btn ${unit === u ? "" : "secondary"}`} onClick={() => setUnit(u)}>{u}</button>
            ))}
          </div>
        </div>
      </div>

      <button className="btn" onClick={generate}>Generate</button>

      {out && (
        <div className="field" style={{ marginTop: 16 }}>
          <label>Result</label>
          <textarea readOnly value={out} style={{ minHeight: 200 }} />
          <button className="btn" style={{ marginTop: 10 }} onClick={copy}>{copied ? "✓ Copied" : "Copy text"}</button>
        </div>
      )}

      <p className="privacy-note">🔒 Generated locally in your browser.</p>
    </div>
  );
}
