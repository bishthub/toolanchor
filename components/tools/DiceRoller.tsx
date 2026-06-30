"use client";

import { useState } from "react";

function secureInt(min: number, max: number): number {
  const range = max - min + 1;
  const limit = Math.floor(0xffffffff / range) * range;
  const buf = new Uint32Array(1);
  let v = 0;
  do { crypto.getRandomValues(buf); v = buf[0]; } while (v >= limit);
  return min + (v % range);
}

export default function DiceRoller() {
  const [tab, setTab] = useState<"dice" | "pick">("dice");
  const [count, setCount] = useState(2);
  const [sides, setSides] = useState(6);
  const [rolls, setRolls] = useState<number[]>([]);
  const [list, setList] = useState("");
  const [winner, setWinner] = useState<string | null>(null);

  function roll() {
    const n = Math.min(Math.max(count, 1), 100);
    setRolls(Array.from({ length: n }, () => secureInt(1, Math.max(2, sides))));
  }
  function pick() {
    const items = list.split("\n").map((x) => x.trim()).filter(Boolean);
    setWinner(items.length ? items[secureInt(0, items.length - 1)] : null);
  }

  const total = rolls.reduce((a, b) => a + b, 0);

  return (
    <div>
      <div className="field">
        <div className="row">
          <button type="button" className={`btn ${tab === "dice" ? "" : "secondary"}`} onClick={() => setTab("dice")}>🎲 Dice</button>
          <button type="button" className={`btn ${tab === "pick" ? "" : "secondary"}`} onClick={() => setTab("pick")}>🎯 Random picker</button>
        </div>
      </div>

      {tab === "dice" ? (
        <>
          <div className="row" style={{ alignItems: "flex-end" }}>
            <div className="field" style={{ maxWidth: 120 }}><label>How many</label><input className="input" type="number" min={1} max={100} value={count} onChange={(e) => setCount(Number(e.target.value))} /></div>
            <div className="field" style={{ maxWidth: 120 }}><label>Sides</label><input className="input" type="number" min={2} value={sides} onChange={(e) => setSides(Number(e.target.value))} /></div>
            <div className="field"><button className="btn" onClick={roll}>Roll</button></div>
          </div>
          {rolls.length > 0 && (
            <>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 10, margin: "8px 0" }}>
                {rolls.map((r, i) => (
                  <span key={i} style={{ display: "grid", placeItems: "center", width: 48, height: 48, borderRadius: 10, background: "var(--surface-2, #1a1f2e)", border: "1px solid var(--border)", fontWeight: 800, fontSize: "1.2rem" }}>{r}</span>
                ))}
              </div>
              <div className="stat"><div className="n">{total}</div><div className="l">Total</div></div>
            </>
          )}
        </>
      ) : (
        <>
          <div className="field">
            <label>Options (one per line)</label>
            <textarea value={list} onChange={(e) => setList(e.target.value)} placeholder={"Alice\nBob\nCharlie"} />
          </div>
          <button className="btn" onClick={pick}>Pick a winner</button>
          {winner && <div className="stat" style={{ marginTop: 14 }}><div className="n" style={{ fontSize: "1.3rem" }}>🎉 {winner}</div><div className="l">Winner</div></div>}
        </>
      )}
      <p className="privacy-note">🔒 Uses the secure Web Crypto API for fair, unbiased randomness.</p>
    </div>
  );
}
