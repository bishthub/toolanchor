"use client";

import { useState, useMemo } from "react";

function syllableCount(word: string): number {
  const w = word.toLowerCase().replace(/[^a-z]/g, "");
  if (!w) return 0;
  if (w.length <= 3) return 1;

  let count = 0;
  let prevVowel = false;

  for (const ch of w) {
    const isVowel = "aeiou".includes(ch);
    if (isVowel && !prevVowel) count++;
    prevVowel = isVowel;
  }

  // Adjust for silent e
  if (w.endsWith("e") && !w.endsWith("le") && count > 1) count--;
  if (w.endsWith("es") || w.endsWith("ed")) count--;
  if (w.endsWith("ing")) count--;

  return Math.max(1, count);
}

function isComplex(word: string, syllables: number): boolean {
  return syllables >= 3;
}

function analyze(text: string) {
  const sentences = text.split(/[.!?]+\s*/).filter(Boolean);
  const words = text.toLowerCase().match(/[a-z]+(?:'[a-z]+)?/g) || [];
  const letters = text.replace(/[^a-zA-Z]/g, "").length;
  const chars = text.length;

  if (words.length === 0 || sentences.length === 0) return null;

  const totalSyllables = words.reduce((sum, w) => sum + syllableCount(w), 0);
  const complexWords = words.filter(w => isComplex(w, syllableCount(w))).length;

  const avgSentenceLength = words.length / sentences.length;
  const avgSyllablesPerWord = totalSyllables / words.length;
  const avgLettersPerWord = letters / words.length;

  // Flesch Reading Ease
  const fleschEase = 206.835 - 1.015 * avgSentenceLength - 84.6 * avgSyllablesPerWord;
  const clampedEase = Math.max(0, Math.min(100, fleschEase));

  // Flesch-Kincaid Grade Level
  const fleschKincaid = 0.39 * avgSentenceLength + 11.8 * avgSyllablesPerWord - 15.59;
  const fkGrade = Math.max(1, Math.round(fleschKincaid * 10) / 10);

  // Gunning Fog
  const fog = 0.4 * (avgSentenceLength + (complexWords / words.length) * 100);
  const fogGrade = Math.max(1, Math.round(fog * 10) / 10);

  // SMOG
  const smog = 1.043 * Math.sqrt(complexWords * (30 / sentences.length)) + 3.1291;
  const smogGrade = Math.max(1, Math.round(smog * 10) / 10);

  // Coleman-Liau
  const l = avgLettersPerWord * 100;
  const s = sentences.length > 0 ? (sentences.length / words.length) * 100 : 0;
  const coleman = 0.0588 * l - 0.296 * s - 15.8;
  const colemanGrade = Math.max(1, Math.round(coleman * 10) / 10);

  // Reading time
  const minutes = words.length / 200;
  const readingTime = minutes < 1 ? `${Math.round(minutes * 60)} seconds` : `${Math.ceil(minutes)} min`;

  return {
    fleschEase: clampedEase,
    fleschKincaid: fkGrade,
    fog: fogGrade,
    smog: smogGrade,
    coleman: colemanGrade,
    avgGrade: Math.round(((fkGrade + fogGrade + smogGrade + colemanGrade) / 4) * 10) / 10,
    words: words.length,
    sentences: sentences.length,
    syllables: totalSyllables,
    complexWords,
    readingTime,
    avgSentenceLength: Math.round(avgSentenceLength * 10) / 10,
  };
}

function easeLabel(score: number): string {
  if (score >= 90) return "Very Easy (5th grade)";
  if (score >= 80) return "Easy (6th grade)";
  if (score >= 70) return "Fairly Easy (7th grade)";
  if (score >= 60) return "Standard (8th-9th grade)";
  if (score >= 50) return "Fairly Difficult (10th-12th grade)";
  if (score >= 30) return "Difficult (College)";
  return "Very Difficult (College Graduate)";
}

export default function ReadabilityChecker() {
  const [text, setText] = useState("");

  const result = useMemo(() => analyze(text), [text]);

  return (
    <div>
      <div className="field">
        <label>Text to analyse</label>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Paste your text here to check readability…"
          style={{ minHeight: 160 }}
        />
      </div>

      {result && (
        <>
          <div className="stats">
            <div className="stat" style={{ gridColumn: "1 / -1" }}>
              <div className="n" style={{ fontSize: "2rem", color: result.fleschEase >= 60 ? "var(--ok)" : result.fleschEase >= 40 ? "#d9944b" : "var(--danger)" }}>
                {Math.round(result.fleschEase)}
              </div>
              <div className="l">Flesch Reading Ease ({easeLabel(result.fleschEase)})</div>
            </div>
          </div>

          <div className="field">
            <label>Grade level scores</label>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: ".88rem", fontVariantNumeric: "tabular-nums" }}>
                <thead>
                  <tr style={{ background: "var(--surface-2)", borderBottom: "1px solid var(--border)" }}>
                    <th style={{ padding: "8px 12px", textAlign: "left" }}>Formula</th>
                    <th style={{ padding: "8px 12px", textAlign: "right" }}>Grade Level</th>
                    <th style={{ padding: "8px 12px", textAlign: "left" }}>Interpretation</th>
                  </tr>
                </thead>
                <tbody>
                  <Row formula="Flesch-Kincaid" grade={result.fleschKincaid} />
                  <Row formula="Gunning Fog" grade={result.fog} />
                  <Row formula="SMOG Index" grade={result.smog} />
                  <Row formula="Coleman-Liau" grade={result.coleman} />
                  <tr style={{ borderTop: "2px solid var(--border)" }}>
                    <td style={{ padding: "8px 12px", fontWeight: 650 }}>Average</td>
                    <td style={{ padding: "8px 12px", textAlign: "right", fontWeight: 650 }}>{result.avgGrade}</td>
                    <td style={{ padding: "8px 12px", color: "var(--muted)" }}>
                      {result.avgGrade <= 6 ? "Elementary" : result.avgGrade <= 9 ? "Middle School" : result.avgGrade <= 12 ? "High School" : result.avgGrade <= 14 ? "College Freshman" : "College Graduate"}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className="stats">
            <div className="stat"><div className="n">{result.words.toLocaleString()}</div><div className="l">Words</div></div>
            <div className="stat"><div className="n">{result.sentences}</div><div className="l">Sentences</div></div>
            <div className="stat"><div className="n">{result.syllables}</div><div className="l">Syllables</div></div>
            <div className="stat"><div className="n">{result.complexWords}</div><div className="l">Complex words</div></div>
            <div className="stat"><div className="n">{result.readingTime}</div><div className="l">Reading time</div></div>
            <div className="stat"><div className="n">{result.avgSentenceLength}</div><div className="l">Avg sentence (words)</div></div>
          </div>
        </>
      )}

      <p className="privacy-note">🔒 All analysis runs in your browser using standard readability formulas — your text never leaves your device.</p>
    </div>
  );
}

function Row({ formula, grade }: { formula: string; grade: number }) {
  return (
    <tr style={{ borderBottom: "1px solid var(--border)" }}>
      <td style={{ padding: "8px 12px", fontWeight: 550 }}>{formula}</td>
      <td style={{ padding: "8px 12px", textAlign: "right" }}>{grade}</td>
      <td style={{ padding: "8px 12px", color: "var(--muted)" }}>
        {grade <= 6 ? "Elementary" : grade <= 9 ? "Middle School" : grade <= 12 ? "High School" : grade <= 14 ? "College" : "Post-Grad"}
      </td>
    </tr>
  );
}
