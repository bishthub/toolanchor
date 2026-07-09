"use client";

import { useState, useMemo } from "react";

const STOP_WORDS = new Set([
  "the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for",
  "of", "with", "by", "is", "it", "as", "be", "are", "was", "were",
  "been", "being", "have", "has", "had", "do", "does", "did", "will",
  "would", "could", "should", "may", "might", "shall", "can", "need",
  "this", "that", "these", "those", "i", "you", "he", "she", "we", "they",
  "not", "no", "so", "if", "then", "than", "too", "very", "just", "also",
  "about", "up", "out", "over", "after", "before", "between", "through",
  "during", "because", "from", "which", "what", "when", "where", "how",
  "all", "each", "every", "both", "few", "more", "most", "other", "some",
  "such", "only", "own", "same", "here", "there", "again", "further",
  "into", "upon", "who", "whom", "whose", "why", "while", "any", "has",
  "had", "having", "its", "am", "my", "your", "his", "her", "our", "their",
  "me", "him", "us", "them", "myself", "yourself", "himself", "herself",
  "itself", "themselves", "get", "got", "gets", "make", "made", "makes",
  "like", "just", "also", "well", "even", "still", "already", "yet",
]);

function tokenize(text: string): string[] {
  return text.toLowerCase().match(/[a-z]+(?:'[a-z]+)?/g) || [];
}

function extract(text: string, mode: "words" | "phrases" | "both") {
  const words = tokenize(text);
  if (words.length === 0) return null;

  const filtered = words.filter(w => w.length > 2 && !STOP_WORDS.has(w));
  const freq: Record<string, number> = {};
  for (const w of filtered) freq[w] = (freq[w] ?? 0) + 1;

  // TF-IDF-like: score = frequency * (1 + wordLengthBonus)
  const scored = Object.entries(freq)
    .map(([word, count]) => {
      const lengthBonus = Math.min(0.5, word.length / 20);
      const score = count * (1 + lengthBonus);
      return { word, count, score: Math.round(score * 100) / 100 };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 40);

  // Phrases (bigrams)
  let phrases: { phrase: string; count: number; score: number }[] = [];
  if (mode === "phrases" || mode === "both") {
    const phraseFreq: Record<string, number> = {};
    for (let i = 0; i < filtered.length - 1; i++) {
      const phrase = `${filtered[i]} ${filtered[i + 1]}`;
      phraseFreq[phrase] = (phraseFreq[phrase] ?? 0) + 1;
    }
    phrases = Object.entries(phraseFreq)
      .filter(([, count]) => count >= 2)
      .map(([phrase, count]) => {
        const score = count * (1 + Math.min(0.3, phrase.length / 30));
        return { phrase, count, score: Math.round(score * 100) / 100 };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 20);
  }

  return { words: scored, phrases, totalWords: filtered.length };
}

export default function KeywordExtractor() {
  const [text, setText] = useState("");
  const [mode, setMode] = useState<"words" | "phrases" | "both">("both");

  const result = useMemo(() => extract(text, mode), [text, mode]);

  return (
    <div>
      <div className="field">
        <label>Text to analyse</label>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Paste your article, essay or document…"
          style={{ minHeight: 160 }}
        />
      </div>

      <div className="field" style={{ maxWidth: 240 }}>
        <label>Extraction mode</label>
        <select className="input" value={mode} onChange={(e) => setMode(e.target.value as typeof mode)}>
          <option value="both">Words + phrases</option>
          <option value="words">Single words only</option>
          <option value="phrases">Phrases (bigrams) only</option>
        </select>
      </div>

      {result && (
        <>
          <p style={{ color: "var(--muted)", fontSize: ".85rem", marginBottom: 12 }}>
            {result.totalWords} content words found in text
          </p>

          {mode !== "phrases" && result.words.length > 0 && (
            <div className="field">
              <label>Top keywords</label>
              <div style={{ overflowX: "auto", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: ".85rem" }}>
                  <thead>
                    <tr style={{ background: "var(--surface-2)", borderBottom: "1px solid var(--border)" }}>
                      <th style={{ padding: "8px 12px", textAlign: "left" }}>#</th>
                      <th style={{ padding: "8px 12px", textAlign: "left" }}>Keyword</th>
                      <th style={{ padding: "8px 12px", textAlign: "right" }}>Count</th>
                      <th style={{ padding: "8px 12px", textAlign: "right" }}>Relevance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.words.slice(0, 25).map((kw, i) => (
                      <tr key={kw.word} style={{ borderBottom: "1px solid var(--border)" }}>
                        <td style={{ padding: "6px 12px", color: "var(--faint)", fontFamily: "var(--font-mono), monospace", fontSize: ".78rem" }}>{i + 1}</td>
                        <td style={{ padding: "6px 12px", fontWeight: 550 }}>{kw.word}</td>
                        <td style={{ padding: "6px 12px", textAlign: "right", fontFamily: "var(--font-mono), monospace" }}>{kw.count}</td>
                        <td style={{ padding: "6px 12px", textAlign: "right" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "flex-end" }}>
                            <div style={{ width: 60, height: 6, background: "var(--border)", borderRadius: 999, overflow: "hidden" }}>
                              <div style={{ width: `${Math.min(100, (kw.score / result.words[0].score) * 100)}%`, height: "100%", background: "var(--accent)", borderRadius: 999 }} />
                            </div>
                            <span style={{ fontFamily: "var(--font-mono), monospace", fontSize: ".78rem", color: "var(--muted)" }}>{kw.score.toFixed(1)}</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {mode !== "words" && result.phrases.length > 0 && (
            <div className="field" style={{ marginTop: 16 }}>
              <label>Key phrases</label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {result.phrases.map((p) => (
                  <span key={p.phrase} style={{
                    padding: "4px 10px", borderRadius: 6, fontSize: ".84rem",
                    background: "color-mix(in srgb, var(--accent) 8%, transparent)",
                    border: "1px solid color-mix(in srgb, var(--accent) 22%, var(--border))",
                    color: "var(--text)",
                  }}>
                    {p.phrase}
                    <span style={{ marginLeft: 6, fontFamily: "var(--font-mono), monospace", fontSize: ".72rem", color: "var(--muted)" }}>×{p.count}</span>
                  </span>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      <p className="privacy-note">🔒 Runs in your browser using TF-IDF scoring — your text never leaves your device.</p>
    </div>
  );
}
