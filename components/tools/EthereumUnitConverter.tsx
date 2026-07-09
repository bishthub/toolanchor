"use client";

import { useState, useMemo } from "react";

// 1 ETH = 10^9 Gwei = 10^18 Wei
const GWEI_PER_ETH = 1_000_000_000n;
const WEI_PER_ETH = 1_000_000_000_000_000_000n;
const WEI_PER_GWEI = 1_000_000_000n;

function fmtLarge(n: bigint): string {
  const s = n.toString();
  if (s.length > 12) return s.slice(0, -12) + "." + s.slice(-12, -8) + "T";
  if (s.length > 9) return s.slice(0, -9) + "." + s.slice(-9, -6) + "B";
  if (s.length > 6) return s.slice(0, -6) + "." + s.slice(-6, -3) + "M";
  return s;
}

export default function EthereumUnitConverter() {
  const [eth, setEth] = useState("");
  const [gwei, setGwei] = useState("");
  const [wei, setWei] = useState("");
  const [source, setSource] = useState<"eth" | "gwei" | "wei">("eth");

  const update = (v: string, from: "eth" | "gwei" | "wei") => {
    setSource(from);
    const n = v.trim();
    if (!n || isNaN(Number(n))) {
      if (from !== "eth") setEth("");
      if (from !== "gwei") setGwei("");
      if (from !== "wei") setWei("");
      return;
    }

    try {
      let weiVal: bigint;
      if (from === "eth") {
        // Parse ETH with decimals (up to 18 places)
        const parts = n.split(".");
        const whole = BigInt(parts[0] || "0") * WEI_PER_ETH;
        const frac = parts[1]
          ? BigInt(parts[1].padEnd(18, "0").slice(0, 18))
          : 0n;
        weiVal = whole + frac;
        setEth(n);
      } else if (from === "gwei") {
        const parts = n.split(".");
        const whole = BigInt(parts[0] || "0") * WEI_PER_GWEI;
        const frac = parts[1]
          ? BigInt(parts[1].padEnd(9, "0").slice(0, 9))
          : 0n;
        weiVal = whole + frac;
        setGwei(n);
      } else {
        weiVal = BigInt(n);
        setWei(n);
      }

      if (from !== "eth") setEth(formatEth(weiVal));
      if (from !== "gwei") setGwei(formatGwei(weiVal));
      if (from !== "wei") setWei(weiVal.toString());
    } catch {
      // ignore invalid input
    }
  };

  function formatEth(weiVal: bigint): string {
    const whole = weiVal / WEI_PER_ETH;
    const frac = weiVal % WEI_PER_ETH;
    if (frac === 0n) return whole.toString();
    let f = frac.toString().padStart(18, "0").replace(/0+$/, "");
    return `${whole}.${f}`;
  }

  function formatGwei(weiVal: bigint): string {
    const whole = weiVal / WEI_PER_GWEI;
    const frac = weiVal % WEI_PER_GWEI;
    if (frac === 0n) return whole.toString();
    let f = frac.toString().padStart(9, "0").replace(/0+$/, "");
    return `${whole}.${f}`;
  }

  const [copied, setCopied] = useState("");
  async function copy(val: string, label: string) {
    await navigator.clipboard.writeText(val);
    setCopied(label);
    setTimeout(() => setCopied(""), 1200);
  }

  return (
    <div>
      <div className="row">
        <div className="field">
          <label>Ether (ETH)</label>
          <input
            className="input"
            type="text"
            inputMode="decimal"
            placeholder="1.0"
            value={eth}
            onChange={(e) => update(e.target.value, "eth")}
          />
          <button className="btn secondary" style={{ marginTop: 6, padding: "4px 10px", fontSize: ".78rem" }} onClick={() => copy(eth, "eth")}>
            {copied === "eth" ? "✓ Copied" : "Copy"}
          </button>
        </div>
        <div className="field">
          <label>Gwei</label>
          <input
            className="input"
            type="text"
            inputMode="decimal"
            placeholder="1,000,000,000"
            value={gwei}
            onChange={(e) => update(e.target.value, "gwei")}
          />
          <button className="btn secondary" style={{ marginTop: 6, padding: "4px 10px", fontSize: ".78rem" }} onClick={() => copy(gwei, "gwei")}>
            {copied === "gwei" ? "✓ Copied" : "Copy"}
          </button>
        </div>
        <div className="field">
          <label>Wei</label>
          <input
            className="input"
            type="text"
            inputMode="numeric"
            placeholder="1,000,000,000,000,000,000"
            value={wei}
            onChange={(e) => update(e.target.value, "wei")}
          />
          <button className="btn secondary" style={{ marginTop: 6, padding: "4px 10px", fontSize: ".78rem" }} onClick={() => copy(wei, "wei")}>
            {copied === "wei" ? "✓ Copied" : "Copy"}
          </button>
        </div>
      </div>

      {/* Quick reference */}
      <div className="stats" style={{ marginTop: 20 }}>
        <div className="stat"><div className="n">10⁹</div><div className="l">Gwei per ETH</div></div>
        <div className="stat"><div className="n">10¹⁸</div><div className="l">Wei per ETH</div></div>
        <div className="stat"><div className="n">10⁹</div><div className="l">Wei per Gwei</div></div>
      </div>

      <p className="privacy-note">🔒 Uses JavaScript BigInt for exact precision — no floating point rounding. All conversions run in your browser.</p>
    </div>
  );
}
