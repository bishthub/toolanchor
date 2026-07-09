"use client";

import { useState, useCallback } from "react";

// Extractive summarization: score each sentence by TF-IDF-like keyword frequency.
// Returns the top-N sentences in original order.

function tokenize(text: string): string[] {
  return text.toLowerCase().match(/[a-z0-9]+(?:'[a-z]+)?/g) ?? [];
}

function sentenceScores(text: string): { sentence: string; score: number }[] {
  // Split on sentence-ending punctuation
  const raw = text.split(/(?<=[.!?])\s+/).filter(Boolean);
  if (raw.length === 0) return [];
  if (raw.length <= 3) return raw.map((s) => ({ sentence: s, score: 1 }));

  // Count word frequencies across the whole text
  const allWords = tokenize(text);
  const freq: Record<string, number> = {};
  for (const w of allWords) freq[w] = (freq[w] ?? 0) + 1;
  const maxFreq = Math.max(...Object.values(freq), 1);

  // Score each sentence by average relative frequency of its words
  const stopWords = new Set([
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
  ]);

  return raw.map((sentence) => {
    const words = tokenize(sentence).filter((w) => !stopWords.has(w) && w.length > 2);
    if (words.length === 0) return { sentence, score: 0 };

    // Bonus for first sentence (often contains the thesis)
    const positionBonus = raw.indexOf(sentence) === 0 ? 0.3 : 0;

    // Bonus for sentences containing title-like words (words from first sentence)
    const firstWords = new Set(tokenize(raw[0]));
    const overlap = words.filter((w) => firstWords.has(w)).length / Math.max(words.length, 1);

    const score =
      words.reduce((sum, w) => sum + (freq[w] ?? 0) / maxFreq, 0) / words.length +
      positionBonus +
      overlap * 0.2;

    return { sentence, score: Math.round(score * 100) / 100 };
  });
}

export default function TextSummarizer() {
  const [input, setInput] = useState("");
  const [numSentences, setNumSentences] = useState(5);
  const [output, setOutput] = useState("");
  const [copied, setCopied] = useState(false);

  const handleSummarize = useCallback(() => {
    if (!input.trim()) return;
    const scored = sentenceScores(input);

    // Pick top-N by score, sort back to original order
    const sorted = [...scored].sort((a, b) => b.score - a.score);
    const top = sorted.slice(0, Math.min(numSentences, sorted.length));
    const originalOrder = top.sort(
      (a, b) => scored.indexOf(a) - scored.indexOf(b)
    );

    setOutput(
      originalOrder
        .filter((s) => s.score > 0)
        .map((s) => s.sentence)
        .join(" ")
    );
  }, [input, numSentences]);

  async function copy() {
    await navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  }

  const sentenceCount = input
    ? input.split(/(?<=[.!?])\s+/).filter(Boolean).length
    : 0;

  return (
    <div>
      <div className="field">
        <label>Text to summarise</label>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Paste the article, essay or document you want to summarise…"
          style={{ minHeight: 200 }}
        />
      </div>

      <div className="row">
        <div className="field" style={{ maxWidth: 200 }}>
          <label>Sentences in summary</label>
          <input
            type="number"
            className="input"
            min={1}
            max={50}
            value={numSentences}
            onChange={(e) => setNumSentences(Math.max(1, parseInt(e.target.value, 10) || 1))}
          />
        </div>
        {sentenceCount > 0 && (
          <p style={{ color: "var(--muted)", fontSize: ".85rem", alignSelf: "flex-end", marginBottom: 4 }}>
            {sentenceCount} sentences in original text
          </p>
        )}
      </div>

      <button className="btn" onClick={handleSummarize} disabled={!input.trim()}>
        📝 Summarise
      </button>

      {output && (
        <div className="field" style={{ marginTop: 16 }}>
          <label>Summary</label>
          <textarea readOnly value={output} style={{ minHeight: 120 }} />
          <button className="btn" style={{ marginTop: 8 }} onClick={copy}>
            {copied ? "✓ Copied" : "Copy summary"}
          </button>
        </div>
      )}

      <p className="privacy-note">🔒 Runs in your browser — your text never leaves your device. Uses keyword-based extractive summarisation, not generative AI.</p>
    </div>
  );
}
