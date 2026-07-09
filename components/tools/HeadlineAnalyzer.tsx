"use client";

import { useState, useMemo } from "react";

const POWER_WORDS = [
  "essential", "proven", "ultimate", "secret", "guaranteed", "exclusive",
  "instant", "powerful", "simple", "effective", "breakthrough", "remarkable",
  "amazing", "incredible", "massive", "vital", "critical", "urgent",
  "insider", "hidden", "discover", "unlock", "transform", "boost",
  "accelerate", "dominate", "master", "maximize", "minimize", "eliminate",
  "free", "new", "now", "today", "announcing", "introducing", "finally",
  "at last", "surprising", "shocking", "unbelievable", "top", "best",
  "complete", "ultimate", "definitive", "step-by-step", "easy", "fast",
  "results", "success", "profit", "save", "double", "triple",
];

const EMOTIONAL_WORDS = [
  "you", "your", "yourself", "love", "happy", "sad", "beautiful",
  "wonderful", "terrible", "horrible", "amazing", "incredible",
  "heart", "soul", "dream", "fear", "hope", "passion", "joy",
  "painful", "exciting", "thrilling", "heartbreaking", "hilarious",
  "unforgettable", "life-changing", "eye-opening",
];

const COMMON_WORDS = [
  "the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for",
  "of", "with", "by", "is", "it", "as", "be", "are", "was", "were",
  "that", "this", "these", "those", "we", "you", "they", "he", "she",
  "its", "our", "your", "my", "their", "have", "has", "do", "does",
  "can", "will", "not", "no", "so", "if", "all", "just", "about",
];

function analyze(headline: string) {
  const words = headline.match(/[a-z]+(?:'[a-z]+)?/gi) || [];
  const lower = words.map(w => w.toLowerCase());
  const total = lower.length;

  if (total === 0) return null;

  // Character counts
  const chars = headline.length;

  // Word type breakdown
  const powerCount = lower.filter(w => POWER_WORDS.includes(w)).length;
  const emotionalCount = lower.filter(w => EMOTIONAL_WORDS.includes(w)).length;
  const commonCount = lower.filter(w => COMMON_WORDS.includes(w)).length;
  const uncommonCount = total - commonCount;

  // Sentiment (simplified positive/negative)
  const POS = new Set(["love", "happy", "beautiful", "wonderful", "amazing", "incredible", "exciting", "thrilling", "best", "top", "success", "free", "new", "easy", "fast", "proven", "guaranteed", "breakthrough"]);
  const NEG = new Set(["terrible", "horrible", "sad", "painful", "heartbreaking", "fear", "worst", "wrong", "bad"]);

  const posCount = lower.filter(w => POS.has(w)).length;
  const negCount = lower.filter(w => NEG.has(w)).length;

  // Scoring
  let score = 50; // baseline

  // Length scoring
  if (chars >= 40 && chars <= 70) score += 10; // ideal title length
  else if (chars >= 30 && chars <= 80) score += 5;
  else if (chars > 100) score -= 10;
  else if (chars < 20) score -= 5;

  // Word count sweet spot
  if (total >= 6 && total <= 12) score += 8;
  else if (total >= 4 && total <= 15) score += 3;
  else score -= 5;

  // Power words
  score += Math.min(15, powerCount * 5);

  // Emotional words
  score += Math.min(12, emotionalCount * 4);

  // Uncommon words (curiosity)
  const uncommonRatio = uncommonCount / Math.max(1, total);
  if (uncommonRatio >= 0.3 && uncommonRatio <= 0.6) score += 10;
  else if (uncommonRatio > 0.7) score -= 5; // too many complex words

  // Sentiment
  if (posCount > 0) score += 5;
  if (negCount > 0) score += 3;

  // Emotional marketing value
  const emv = Math.round((emotionalCount / Math.max(1, total)) * 100);
  const emvScore = Math.min(100, emv);

  score = Math.max(0, Math.min(100, score));

  let grade: string;
  if (score >= 80) grade = "Excellent";
  else if (score >= 70) grade = "Great";
  else if (score >= 60) grade = "Good";
  else if (score >= 40) grade = "Average";
  else grade = "Needs work";

  return {
    score,
    grade,
    chars,
    words: total,
    powerWords: powerCount,
    emotionalWords: emotionalCount,
    commonWords: commonCount,
    uncommonWords: uncommonCount,
    emv: emvScore,
    sentiment: posCount > negCount ? "Positive" : negCount > posCount ? "Negative" : "Neutral",
  };
}

export default function HeadlineAnalyzer() {
  const [headline, setHeadline] = useState("");

  const result = useMemo(() => analyze(headline), [headline]);

  return (
    <div>
      <div className="field">
        <label>Your headline</label>
        <input
          className="input"
          type="text"
          placeholder="Enter your headline or title…"
          value={headline}
          onChange={(e) => setHeadline(e.target.value)}
          style={{ fontSize: "1.1rem", fontWeight: 550 }}
        />
      </div>

      {result && (
        <>
          <div className="stats" style={{ marginTop: 20 }}>
            <div className="stat" style={{ gridColumn: "1 / -1" }}>
              <div className="n" style={{
                fontSize: "2.4rem",
                color: result.score >= 70 ? "var(--ok)" : result.score >= 50 ? "#d9944b" : "var(--danger)",
              }}>
                {result.score}/100
              </div>
              <div className="l">{result.grade} — {result.chars} chars, {result.words} words</div>
            </div>
          </div>

          <div className="field">
            <label>Score breakdown</label>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <Meter label="Power words" value={result.powerWords} max={5} hint={`${result.powerWords} found`} />
              <Meter label="Emotional words" value={result.emotionalWords} max={5} hint={`${result.emotionalWords} found`} />
              <Meter label="Uncommon / curiosity words" value={result.uncommonWords} max={8} hint={`${result.uncommonWords} of ${result.words} words`} />
              <Meter label="Emotional Marketing Value" value={Math.round(result.emv / 20)} max={5} hint={`${result.emv}%`} />
            </div>
          </div>

          <div className="field">
            <label>Tips to improve</label>
            <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>
              {result.chars < 30 && <Tip>Headline is short — aim for 40–60 characters for Google search snippets.</Tip>}
              {result.chars > 70 && <Tip>Headline may be truncated in Google search. Keep it under 60 chars if used for SEO.</Tip>}
              {result.powerWords < 1 && <Tip>Add a power word (e.g. "essential", "ultimate", "proven") to increase engagement.</Tip>}
              {result.emotionalWords < 1 && <Tip>Add an emotional word (e.g. "love", "surprising", "unforgettable") to connect with readers.</Tip>}
              {result.words < 5 && <Tip>Try a longer headline (6–12 words performs best).</Tip>}
              {result.words > 15 && <Tip>Headline is long — consider tightening to under 12 words.</Tip>}
              {result.score >= 80 && <Tip>Excellent headline! It has strong emotional appeal and good word balance.</Tip>}
            </ul>
          </div>
        </>
      )}

      <p className="privacy-note">🔒 Analysis runs entirely in your browser — no data is uploaded. Uses word-balance and emotional-impact formulas inspired by CoSchedule.</p>
    </div>
  );
}

function Meter({ label, value, max, hint }: { label: string; value: number; max: number; hint: string }) {
  const pct = Math.min(100, (value / max) * 100);
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: ".85rem", marginBottom: 4 }}>
        <span style={{ fontWeight: 550 }}>{label}</span>
        <span style={{ color: "var(--muted)", fontSize: ".78rem" }}>{hint}</span>
      </div>
      <div style={{ height: 8, background: "var(--border)", borderRadius: 999, overflow: "hidden" }}>
        <div style={{
          width: `${Math.min(100, pct)}%`, height: "100%", background: pct >= 50 ? "var(--ok)" : pct >= 25 ? "#d9944b" : "var(--muted)",
          borderRadius: 999, transition: "width .2s",
        }} />
      </div>
    </div>
  );
}

function Tip({ children }: { children: React.ReactNode }) {
  return (
    <li style={{ padding: "6px 0", color: "var(--muted)", fontSize: ".88rem", display: "flex", gap: 8, alignItems: "flex-start" }}>
      <span style={{ color: "var(--accent)" }}>•</span> {children}
    </li>
  );
}
