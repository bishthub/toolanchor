"use client";

import { useEffect, useState } from "react";
import { readShared } from "@/lib/share";
import ShareResult from "@/components/ShareResult";

const money = (n: number) =>
  Number.isFinite(n) ? n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "—";

const PRESETS: Record<string, { label: string; pct: number; fixed: number }> = {
  us: { label: "US commercial — 3.49% + $0.49", pct: 3.49, fixed: 0.49 },
  intl: { label: "International commercial — 4.99% + $0.49", pct: 4.99, fixed: 0.49 },
  invoice: { label: "Invoicing — 3.49% + $0.49", pct: 3.49, fixed: 0.49 },
  micro: { label: "Micropayments — 4.99% + $0.09", pct: 4.99, fixed: 0.09 },
};

export default function PaypalFeeCalculator() {
  const [amount, setAmount] = useState("");
  const [preset, setPreset] = useState("us");
  const [customPct, setCustomPct] = useState("3.49");
  const [customFixed, setCustomFixed] = useState("0.49");
  const [mode, setMode] = useState<"receiving" | "target">("receiving");

  useEffect(() => {
    const s = readShared(["amt", "p", "pct", "fx", "mode"]);
    if (s.amt) setAmount(s.amt);
    if (s.p && (s.p in PRESETS || s.p === "custom")) setPreset(s.p);
    if (s.pct) setCustomPct(s.pct);
    if (s.fx) setCustomFixed(s.fx);
    if (s.mode === "receiving" || s.mode === "target") setMode(s.mode);
  }, []);

  const a = parseFloat(amount);
  const pctInput = preset === "custom" ? parseFloat(customPct) : PRESETS[preset].pct;
  const fixed = preset === "custom" ? parseFloat(customFixed) : PRESETS[preset].fixed;
  const pct = pctInput / 100;
  const ready = a > 0 && pct >= 0 && pct < 1 && fixed >= 0;

  let fee = 0, net = 0, ask = 0, effectivePct = 0;
  if (ready) {
    if (mode === "receiving") {
      fee = a * pct + fixed;
      net = a - fee;
      effectivePct = (fee / a) * 100;
    } else {
      ask = (a + fixed) / (1 - pct);
      fee = ask - a;
      effectivePct = (fee / ask) * 100;
    }
  }

  return (
    <div>
      <div className="field">
        <label>Mode</label>
        <div className="row">
          <button type="button" className={`btn ${mode === "receiving" ? "" : "secondary"}`} onClick={() => setMode("receiving")}>I&apos;m receiving</button>
          <button type="button" className={`btn ${mode === "target" ? "" : "secondary"}`} onClick={() => setMode("target")}>I want to receive</button>
        </div>
      </div>
      <div className="row">
        <div className="field" style={{ maxWidth: 180 }}>
          <label>{mode === "receiving" ? "Amount sent to you" : "Amount you want to receive"}</label>
          <input type="number" className="input" min={0} value={amount} onChange={(e) => setAmount(e.target.value)} />
        </div>
        <div className="field" style={{ maxWidth: 320 }}>
          <label>Fee preset</label>
          <select className="input" value={preset} onChange={(e) => setPreset(e.target.value)}>
            {Object.entries(PRESETS).map(([k, p]) => (
              <option key={k} value={k}>{p.label}</option>
            ))}
            <option value="custom">Custom</option>
          </select>
        </div>
      </div>
      {preset === "custom" && (
        <div className="row">
          <div className="field" style={{ maxWidth: 140 }}>
            <label>Fee rate (%)</label>
            <input type="number" className="input" min={0} step="0.01" value={customPct} onChange={(e) => setCustomPct(e.target.value)} />
          </div>
          <div className="field" style={{ maxWidth: 140 }}>
            <label>Fixed fee ($)</label>
            <input type="number" className="input" min={0} step="0.01" value={customFixed} onChange={(e) => setCustomFixed(e.target.value)} />
          </div>
        </div>
      )}

      {ready && (
        <div className="stats">
          <div className="stat"><div className="n">{money(fee)}</div><div className="l">PayPal fee</div></div>
          {mode === "receiving" ? (
            <div className="stat"><div className="n">{money(net)}</div><div className="l">You receive</div></div>
          ) : (
            <div className="stat"><div className="n">{money(ask)}</div><div className="l">Amount to request</div></div>
          )}
          <div className="stat"><div className="n">{effectivePct.toFixed(2)}%</div><div className="l">Effective fee</div></div>
        </div>
      )}
      {ready && (
        <ShareResult
          values={{
            amt: amount,
            p: preset,
            mode,
            ...(preset === "custom" ? { pct: customPct, fx: customFixed } : {}),
          }}
        />
      )}
      <p className="privacy-note">🔒 Calculated instantly in your browser. PayPal rates vary by country and account type — check PayPal&apos;s current fee page for your exact rate.</p>
    </div>
  );
}
