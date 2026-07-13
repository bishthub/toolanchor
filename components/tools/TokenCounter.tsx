"use client";

import { useEffect, useMemo, useRef, useState } from "react";

interface ModelRow {
  name: string;
  family: "claude" | "other";
  input: number;  // $ per 1M input tokens
  output: number; // $ per 1M output tokens
}

// Editable defaults — published rates as of July 2026.
const DEFAULT_MODELS: ModelRow[] = [
  { name: "Claude Fable 5", family: "claude", input: 10, output: 50 },
  { name: "Claude Opus 4.8", family: "claude", input: 5, output: 25 },
  { name: "Claude Sonnet 5", family: "claude", input: 3, output: 15 },
  { name: "Claude Haiku 4.5", family: "claude", input: 1, output: 5 },
  { name: "GPT-5.1", family: "other", input: 1.25, output: 10 },
  { name: "GPT-5 mini", family: "other", input: 0.25, output: 2 },
  { name: "GPT-4o", family: "other", input: 2.5, output: 10 },
  { name: "Gemini 2.5 Pro", family: "other", input: 1.25, output: 10 },
  { name: "Gemini 2.5 Flash", family: "other", input: 0.3, output: 2.5 },
];

function fmtCost(v: number): string {
  if (!Number.isFinite(v)) return "—";
  return v >= 0.01 ? `$${v.toFixed(4)}` : `$${v.toFixed(6)}`;
}

export default function TokenCounter() {
  const [text, setText] = useState("");
  const [outTokens, setOutTokens] = useState(500);
  const [models, setModels] = useState<ModelRow[]>(DEFAULT_MODELS);
  const [tokens, setTokens] = useState<number | null>(null);
  const [loadingTok, setLoadingTok] = useState(false);
  const counter = useRef<((t: string) => number) | null>(null);

  // Lazy-load the o200k tokenizer on first input.
  useEffect(() => {
    if (!text || counter.current || loadingTok) return;
    setLoadingTok(true);
    import("gpt-tokenizer/encoding/o200k_base")
      .then((mod) => { counter.current = (t: string) => mod.countTokens(t); })
      .finally(() => setLoadingTok(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text]);

  useEffect(() => {
    if (!counter.current) { setTokens(text ? null : 0); return; }
    setTokens(counter.current(text));
  }, [text, loadingTok]);

  const words = useMemo(() => (text.trim() ? text.trim().split(/\s+/).length : 0), [text]);
  const claudeTokens = tokens === null ? null : Math.ceil(tokens * 1.15);

  function setPrice(i: number, key: "input" | "output", v: string) {
    const n = parseFloat(v);
    setModels((rows) => rows.map((r, idx) => (idx === i ? { ...r, [key]: Number.isFinite(n) ? n : 0 } : r)));
  }

  const stat = (label: string, value: string, note?: string) => (
    <div style={{ border: "1px solid var(--border)", borderRadius: 8, padding: "10px 14px", flex: 1, minWidth: 120 }}>
      <div style={{ fontSize: "1.5rem", fontWeight: 700 }}>{value}</div>
      <div style={{ color: "var(--muted)", fontSize: ".8rem" }}>{label}{note && <em> · {note}</em>}</div>
    </div>
  );

  return (
    <div>
      <div className="field">
        <label>Your prompt or document</label>
        <textarea className="input" rows={8} value={text} placeholder="Paste your prompt…"
          onChange={(e) => setText(e.target.value)} />
      </div>

      {loadingTok && <p style={{ color: "var(--muted)", fontSize: ".85rem" }}>Loading tokenizer…</p>}

      <div className="row" style={{ gap: 10, flexWrap: "wrap", marginBottom: 14 }}>
        {stat("Tokens (o200k — exact for GPT)", tokens === null ? "…" : String(tokens))}
        {stat("Claude tokens", claudeTokens === null ? "…" : `≈ ${claudeTokens}`, "estimate")}
        {stat("Characters", String(text.length))}
        {stat("Words", String(words))}
      </div>

      <div className="field" style={{ maxWidth: 260 }}>
        <label>Expected output tokens</label>
        <input type="number" min={0} className="input" value={outTokens}
          onChange={(e) => setOutTokens(Math.max(0, Number(e.target.value)))} />
      </div>

      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: ".9rem" }}>
          <thead>
            <tr style={{ textAlign: "left", color: "var(--muted)" }}>
              <th style={{ padding: "6px 8px" }}>Model</th>
              <th style={{ padding: "6px 8px" }}>Input $/1M</th>
              <th style={{ padding: "6px 8px" }}>Output $/1M</th>
              <th style={{ padding: "6px 8px" }}>Cost for this prompt</th>
            </tr>
          </thead>
          <tbody>
            {models.map((m, i) => {
              const inTok = m.family === "claude" ? claudeTokens ?? 0 : tokens ?? 0;
              const cost = (inTok / 1e6) * m.input + (outTokens / 1e6) * m.output;
              return (
                <tr key={m.name} style={{ borderTop: "1px solid var(--border)" }}>
                  <td style={{ padding: "6px 8px", whiteSpace: "nowrap" }}>{m.name}</td>
                  <td style={{ padding: "6px 8px" }}>
                    <input type="number" step="any" min={0} className="input" value={m.input}
                      onChange={(e) => setPrice(i, "input", e.target.value)} style={{ width: 90 }} />
                  </td>
                  <td style={{ padding: "6px 8px" }}>
                    <input type="number" step="any" min={0} className="input" value={m.output}
                      onChange={(e) => setPrice(i, "output", e.target.value)} style={{ width: 90 }} />
                  </td>
                  <td style={{ padding: "6px 8px", fontVariantNumeric: "tabular-nums" }}>
                    {tokens === null ? "—" : fmtCost(cost)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p style={{ color: "var(--muted)", fontSize: ".8rem", marginTop: 10 }}>
        Prices are editable defaults as of July 2026 — verify with each provider before budgeting.
        Claude and Gemini counts are estimates: their tokenizers aren&apos;t public, and Claude typically
        tokenizes 10–20% higher than GPT for the same text. For billing-accurate Claude counts, use
        Anthropic&apos;s count-tokens API.
      </p>

      <p className="privacy-note">🔒 Tokenization runs entirely in your browser — your prompt is never uploaded.</p>
    </div>
  );
}
