"use client";

import { useState, useMemo } from "react";

// AFINN-111 style sentiment lexicon (common English words with valence scores)
const LEXICON: Record<string, number> = {
  // Strong positive
  excellent: 3, outstanding: 3, superb: 3, magnificent: 3, wonderful: 3, fantastic: 3,
  brilliant: 3, amazing: 3, incredible: 3, phenomenal: 3, extraordinary: 3, perfect: 3,
  love: 3, loved: 3, beautiful: 3, gorgeous: 3, stunning: 3, splendid: 3,
  // Positive
  good: 2, great: 2, happy: 2, pleased: 2, delighted: 2, grateful: 2, thankful: 2,
  enjoy: 2, enjoyed: 2, lovely: 2, nice: 2, kind: 2, helpful: 2,
  impressive: 2, positive: 2, optimistic: 2, hopeful: 2, cheerful: 2,
  success: 2, successful: 2, benefit: 2, best: 2, better: 2, win: 2, wins: 2,
  easy: 1, simple: 1, smooth: 1, comfortable: 1, convenient: 1, useful: 1, practical: 1,
  effective: 2, efficient: 2, reliable: 2, safe: 1, secure: 1, trusted: 2, innovative: 2,
  free: 1, fast: 1, quick: 1, worth: 1, recommended: 2, recommend: 2,
  // Strong negative
  terrible: -3, horrible: -3, awful: -3, dreadful: -3, hate: -3, hated: -3,
  disgusting: -3, atrocious: -3, miserable: -3, tragic: -3, nightmare: -3,
  worst: -3, pathetic: -3, shameful: -3, scandalous: -3, outrageous: -3,
  // Negative
  bad: -2, poor: -2, sad: -2, unhappy: -2, angry: -2, upset: -2, frustrated: -2,
  disappointed: -2, disappointing: -2, regret: -2, sorry: -1, stuck: -1, waste: -2,
  difficult: -1, confusing: -2, broken: -2, issue: -1, issues: -1, problem: -1,
  problems: -1, wrong: -2, failed: -2, fail: -2, failure: -2, risk: -1, risky: -1,
  dangerous: -2, scary: -1, worried: -2, worry: -1, ugly: -2,
  // Mild negative
  hard: -1, slow: -1, expensive: -1, complicated: -1, annoying: -1, boring: -1,
  dull: -1, painful: -1, tricky: -1, unclear: -1, missing: -1, lack: -1, lacks: -1,
  // Intensifiers
  very: 0.5, really: 0.5, extremely: 0.8, incredibly: 1, absolutely: 0.8,
  highly: 0.5, deeply: 0.5, truly: 0.5, severely: -0.5, barely: -0.3,
};

const NEGATORS = new Set(["not", "no", "never", "nor", "neither", "cannot", "can't", "don't", "doesn't", "didn't", "won't", "wouldn't", "shouldn't", "wasn't", "aren't", "isn't", "hardly", "scarcely"]);

function analyze(text: string) {
  const words = text.toLowerCase().match(/[a-z']+(?:'[a-z]+)?/g) || [];
  if (words.length === 0) return null;

  let score = 0;
  let posCount = 0, negCount = 0, neutralCount = 0;
  const matched: { word: string; score: number }[] = [];
  let negateNext = false;

  for (const word of words) {
    if (NEGATORS.has(word)) { negateNext = true; continue; }

    const base = LEXICON[word];
    if (base !== undefined) {
      const finalScore = negateNext ? -base : base;
      score += finalScore;
      matched.push({ word, score: finalScore });
      if (finalScore > 0.3) posCount++;
      else if (finalScore < -0.3) negCount++;
      else neutralCount++;
    } else {
      neutralCount++;
    }
    negateNext = false;
  }

  const normalized = words.length > 0 ? score / Math.sqrt(words.length) : 0;
  // Clamp to -1..1
  const finalScore = Math.max(-1, Math.min(1, normalized));

  let category = "Neutral";
  if (finalScore > 0.15) category = "Positive";
  if (finalScore < -0.15) category = "Negative";
  if (finalScore > 0.4) category = "Very Positive";
  if (finalScore < -0.4) category = "Very Negative";

  const posPct = words.length > 0 ? Math.round((posCount / words.length) * 100) : 0;
  const negPct = words.length > 0 ? Math.round((negCount / words.length) * 100) : 0;
  const neuPct = words.length > 0 ? Math.round((neutralCount / words.length) * 100) : 0;

  return {
    score: finalScore,
    category,
    posPct, negPct, neuPct,
    matched: matched.slice(0, 30),
    wordCount: words.length,
  };
}

export default function SentimentAnalyzer() {
  const [text, setText] = useState("");

  const result = useMemo(() => analyze(text), [text]);

  return (
    <div>
      <div className="field">
        <label>Text to analyse</label>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Paste your text here to analyse its emotional tone…"
          style={{ minHeight: 160 }}
        />
      </div>

      {result && (
        <>
          <div className="stats">
            <div className="stat">
              <div className="n" style={{ color: result.score > 0.15 ? "var(--ok)" : result.score < -0.15 ? "var(--danger)" : "var(--muted)", fontSize: "1.8rem" }}>
                {result.score >= 0 ? "+" : ""}{result.score.toFixed(2)}
              </div>
              <div className="l">Sentiment score (-1 to +1)</div>
            </div>
            <div className="stat">
              <div className="n" style={{ fontSize: "1.2rem" }}>{result.category}</div>
              <div className="l">Category</div>
            </div>
          </div>

          <div className="field">
            <label>Breakdown</label>
            <div style={{ display: "flex", gap: 4, height: 28, borderRadius: 8, overflow: "hidden", marginBottom: 8 }}>
              {result.posPct > 0 && <div style={{ flex: result.posPct, background: "var(--ok)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: ".72rem", fontWeight: 600, color: "#fff", minWidth: result.posPct > 5 ? undefined : 0 }}>{result.posPct > 5 ? `${result.posPct}%` : ""}</div>}
              {result.neuPct > 0 && <div style={{ flex: result.neuPct, background: "var(--surface-3)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: ".72rem", fontWeight: 600, color: "var(--faint)" }}>{result.neuPct > 5 ? `${result.neuPct}%` : ""}</div>}
              {result.negPct > 0 && <div style={{ flex: result.negPct, background: "var(--danger)", opacity: 0.7, display: "flex", alignItems: "center", justifyContent: "center", fontSize: ".72rem", fontWeight: 600, color: "#fff" }}>{result.negPct > 5 ? `${result.negPct}%` : ""}</div>}
            </div>
            <div style={{ display: "flex", gap: 16, fontSize: ".82rem", color: "var(--muted)" }}>
              <span>🟢 Positive: {result.posPct}%</span>
              <span>⚪ Neutral: {result.neuPct}%</span>
              <span>🔴 Negative: {result.negPct}%</span>
            </div>
          </div>

          {result.matched.length > 0 && (
            <div className="field">
              <label>Signals found ({result.matched.length})</label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {result.matched.map((m, i) => (
                  <span key={i} style={{
                    padding: "3px 10px", borderRadius: 6, fontSize: ".82rem",
                    background: m.score > 0 ? "color-mix(in srgb, var(--ok) 12%, transparent)" : "color-mix(in srgb, var(--danger) 12%, transparent)",
                    color: m.score > 0 ? "var(--ok)" : "var(--danger)",
                    border: `1px solid ${m.score > 0 ? "color-mix(in srgb, var(--ok) 30%, transparent)" : "color-mix(in srgb, var(--danger) 30%, transparent)"}`,
                  }}>
                    {m.word} ({m.score > 0 ? "+" : ""}{m.score.toFixed(1)})
                  </span>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      <p className="privacy-note">🔒 Runs in your browser using a sentiment lexicon — no text is uploaded, no AI API is called.</p>
    </div>
  );
}
