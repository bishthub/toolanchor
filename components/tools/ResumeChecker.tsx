"use client";

import { useEffect, useMemo, useState } from "react";

type CheckStatus = "pass" | "warn" | "fail";

interface Check {
  id: string;
  label: string;
  status: CheckStatus;
  message: string;
}

interface KeywordMatch {
  found: string[];
  missing: string[];
}

interface Analysis {
  checks: Check[];
  keywords: KeywordMatch | null;
  score: number;
  verdict: string;
}

// Weights sum to 100 with a PDF + job description. When either is absent, the
// score is computed over the applicable weights only, so missing inputs
// redistribute proportionally instead of penalising the user.
const CHECK_WEIGHTS: Record<string, number> = {
  parse: 20,
  contact: 10,
  sections: 15,
  dates: 10,
  quantified: 15,
  verbs: 10,
  length: 10,
};
const KEYWORD_WEIGHT = 10;

const ACTION_VERBS = [
  "led", "built", "managed", "launched", "improved", "designed", "developed", "created",
  "increased", "reduced", "delivered", "implemented", "shipped", "owned", "drove", "negotiated",
  "mentored", "automated", "migrated", "optimized", "architected", "scaled", "established",
  "streamlined", "spearheaded", "coordinated", "analyzed", "researched", "published", "presented",
  "trained", "resolved", "achieved", "generated", "grew", "cut", "saved", "won", "founded",
  "initiated", "transformed",
];
const VERB_RE = new RegExp(`\\b(?:${ACTION_VERBS.join("|")})\\b`, "gi");

// Common English words + generic job-posting filler, so JD keyword extraction
// surfaces the terms that actually differentiate the role.
const STOPWORDS = new Set([
  "the", "and", "for", "with", "you", "your", "our", "are", "will", "this", "that", "have",
  "has", "had", "not", "but", "from", "they", "their", "them", "its", "was", "were", "been",
  "being", "can", "could", "should", "would", "may", "might", "must", "shall", "who", "whom",
  "what", "when", "where", "which", "while", "why", "how", "about", "into", "over", "under",
  "more", "most", "other", "others", "some", "such", "than", "then", "these", "those",
  "through", "across", "also", "all", "any", "both", "each", "per", "via", "using", "use",
  "used", "able", "well", "within", "without", "out", "own", "off", "one", "two", "new",
  "like", "just", "very", "only", "every", "ensure", "etc", "get", "does", "did", "make",
  "makes", "made", "take", "help", "helps", "need", "needs", "needed", "plus",
  // generic job words
  "experience", "experiences", "experienced", "team", "teams", "work", "working", "works",
  "role", "roles", "company", "companies", "candidate", "candidates", "ability", "abilities",
  "strong", "years", "year", "required", "require", "requires", "requirements", "requirement",
  "preferred", "preferably", "responsibilities", "responsibility", "responsible", "skills",
  "skill", "including", "include", "includes", "looking", "join", "opportunity",
  "opportunities", "position", "positions", "job", "jobs", "knowledge", "understanding",
  "excellent", "good", "great", "ideal", "related", "relevant", "based", "environment",
  "build", "builds", "building",
]);

function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function verdictFor(score: number): string {
  if (score >= 80) return "ATS-ready";
  if (score >= 60) return "Nearly there — fix the warnings";
  return "Likely to be filtered — fix the failures first";
}

function scoreColor(score: number): string {
  if (score >= 80) return "var(--accent)";
  if (score >= 60) return "#e8a13c";
  return "#ff6b6b";
}

const PARSE_FAIL_MESSAGE =
  "This PDF has little or no extractable text — likely an image-only/scanned export. " +
  "ATS parsers will see an empty resume. Re-export from a word processor.";

// Pure text analysis — re-runs automatically (via useMemo) on every edit.
// `pdfChars` is null when the resume was pasted rather than loaded from a PDF.
function analyze(text: string, jd: string, pdfChars: number | null): Analysis | null {
  const trimmed = text.trim();
  if (!trimmed && pdfChars === null) return null;

  // Image-only PDF with nothing pasted on top: every other check would just be
  // noise, so surface the one problem that matters.
  if (pdfChars !== null && pdfChars <= 200 && trimmed.length <= 200) {
    return {
      checks: [{ id: "parse", label: "PDF text extraction", status: "fail", message: PARSE_FAIL_MESSAGE }],
      keywords: null,
      score: 0,
      verdict: verdictFor(0),
    };
  }

  const checks: Check[] = [];

  // ── Parse rate (PDF only) ─────────────────────────────────────────────
  if (pdfChars !== null) {
    checks.push(
      pdfChars > 200
        ? {
            id: "parse", label: "PDF text extraction", status: "pass",
            message: `Extracted ${pdfChars.toLocaleString()} characters of readable text — ATS parsers can read this PDF.`,
          }
        : { id: "parse", label: "PDF text extraction", status: "fail", message: PARSE_FAIL_MESSAGE },
    );
  }

  // ── Contact info ──────────────────────────────────────────────────────
  const hasEmail = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i.test(trimmed);
  // Strip year ranges ("2019 - 2023", "2021–present") so they aren't
  // mistaken for phone numbers, then look for a 7–15 digit run.
  const noYearRanges = trimmed.replace(/\b(19|20)\d{2}\s*[-–—]\s*((19|20)\d{2}|present|current|now|today)\b/gi, " ");
  const phoneCandidates = noYearRanges.match(/\+?\(?\d[\d\s().-]{5,}\d/g) ?? [];
  const hasPhone = phoneCandidates.some((c) => {
    const digits = (c.match(/\d/g) ?? []).length;
    return digits >= 7 && digits <= 15;
  });
  const hasLinkedIn = /linkedin\.com/i.test(trimmed);
  const linkedInBonus = hasLinkedIn ? " LinkedIn URL detected — a nice bonus, recruiters click through." : "";
  if (hasEmail && hasPhone) {
    checks.push({
      id: "contact", label: "Contact information", status: "pass",
      message: `Email and phone number found.${linkedInBonus}`,
    });
  } else if (hasEmail || hasPhone) {
    checks.push({
      id: "contact", label: "Contact information", status: "warn",
      message: hasEmail
        ? `Email found, but no phone number detected. Add one in plain text — many ATS profiles require it.${linkedInBonus}`
        : `Phone number found, but no email detected. Your email is the primary ATS identifier — add it in plain text.${linkedInBonus}`,
    });
  } else {
    checks.push({
      id: "contact", label: "Contact information", status: "fail",
      message: `No email or phone number detected. Put them in plain body text — ATS parsers often skip headers, footers and graphics.${linkedInBonus}`,
    });
  }

  // ── Standard sections ─────────────────────────────────────────────────
  const core: Array<[string, RegExp]> = [
    ["Experience", /experience|work history|employment/i],
    ["Education", /education/i],
    ["Skills", /skills/i],
  ];
  const missingSections = core.filter(([, re]) => !re.test(trimmed)).map(([name]) => name);
  const extras: string[] = [];
  if (/projects/i.test(trimmed)) extras.push("Projects");
  if (/certifications?/i.test(trimmed)) extras.push("Certifications");
  if (/summary/i.test(trimmed)) extras.push("Summary");
  const coreFound = core.length - missingSections.length;
  checks.push({
    id: "sections",
    label: "Standard sections",
    status: coreFound === 3 ? "pass" : coreFound === 2 ? "warn" : "fail",
    message:
      coreFound === 3
        ? `Experience, Education and Skills headings all found.${extras.length ? ` Bonus sections: ${extras.join(", ")}.` : ""}`
        : `Missing: ${missingSections.join(", ")}. ATS parsers sort your content into standard buckets — use these conventional headings so nothing gets dropped.`,
  });

  // ── Dates ─────────────────────────────────────────────────────────────
  const yearCount = (trimmed.match(/\b(19|20)\d{2}\b/g) ?? []).length;
  checks.push({
    id: "dates",
    label: "Work timeline dates",
    status: yearCount >= 3 ? "pass" : yearCount >= 1 ? "warn" : "fail",
    message:
      yearCount >= 3
        ? `${yearCount} year references found — your work timeline is parseable.`
        : yearCount >= 1
          ? `Only ${yearCount} year reference${yearCount === 1 ? "" : "s"} found. Add start–end dates (e.g. 2021 – 2024) to every role.`
          : "No dates found. ATS parsers extract your work timeline from dates — add start and end dates to every role.",
  });

  // ── Quantified results ────────────────────────────────────────────────
  const metricCount = (trimmed.match(/\d+(\.\d+)?%|\$[\d,]+|₹[\d,]+|\b\d{2,}\b/g) ?? []).length;
  checks.push({
    id: "quantified",
    label: "Quantified results",
    status: metricCount >= 5 ? "pass" : metricCount >= 2 ? "warn" : "fail",
    message:
      metricCount >= 5
        ? `${metricCount} numbers and metrics found — measurable impact stands out to both parsers and people.`
        : metricCount >= 2
          ? `Only ${metricCount} metrics found. Recruiters skim for numbers — add results like "reduced load time 40%" or "managed a $50k budget".`
          : "Almost no metrics. Recruiters skim for numbers — add metrics like 'reduced load time 40%'.",
  });

  // ── Action verbs ──────────────────────────────────────────────────────
  const verbMatches = trimmed.match(VERB_RE) ?? [];
  const verbCount = verbMatches.length;
  const distinctVerbs = new Set(verbMatches.map((v) => v.toLowerCase())).size;
  checks.push({
    id: "verbs",
    label: "Action verbs",
    status: verbCount >= 8 ? "pass" : verbCount >= 4 ? "warn" : "fail",
    message:
      verbCount >= 8
        ? `${verbCount} action-verb usages (${distinctVerbs} distinct) — strong, active phrasing.`
        : verbCount >= 4
          ? `Only ${verbCount} action verbs found. Start each bullet with verbs like "led", "built", "shipped" or "reduced".`
          : `Very few action verbs (${verbCount}). Start every bullet with a strong verb — "led", "built", "launched", "optimized" — instead of passive phrases.`,
  });

  // ── Length ────────────────────────────────────────────────────────────
  const wordCount = trimmed ? trimmed.split(/\s+/).length : 0;
  const lengthStatus: CheckStatus =
    wordCount >= 300 && wordCount <= 1100
      ? "pass"
      : (wordCount >= 200 && wordCount <= 299) || (wordCount >= 1101 && wordCount <= 1500)
        ? "warn"
        : "fail";
  checks.push({
    id: "length",
    label: "Length",
    status: lengthStatus,
    message:
      lengthStatus === "pass"
        ? `${wordCount.toLocaleString()} words — a solid length (one page ≈ 450–650 words).`
        : wordCount < 300
          ? `${wordCount.toLocaleString()} words is thin — expand your most recent roles with concrete accomplishments (one page ≈ 450–650 words).`
          : `${wordCount.toLocaleString()} words is long — cut older or less relevant roles down to highlights (one page ≈ 450–650 words).`,
  });

  // ── Keyword match vs job description ──────────────────────────────────
  let keywords: KeywordMatch | null = null;
  if (jd.trim()) {
    const tokens = jd.toLowerCase().match(/[a-z0-9][a-z0-9+#.]*[a-z0-9+#]|[a-z0-9]/g) ?? [];
    const freq = new Map<string, number>();
    for (const t of tokens) {
      if (t.length < 3 || STOPWORDS.has(t) || /^[\d.]+$/.test(t)) continue;
      freq.set(t, (freq.get(t) ?? 0) + 1);
    }
    const top = [...freq.entries()].sort((a, b) => b[1] - a[1]).slice(0, 25).map(([w]) => w);
    if (top.length > 0) {
      const resumeLower = trimmed.toLowerCase();
      const found: string[] = [];
      const missing: string[] = [];
      for (const w of top) {
        const re = new RegExp(`(^|[^a-z0-9])${escapeRe(w)}([^a-z0-9]|$)`);
        (re.test(resumeLower) ? found : missing).push(w);
      }
      keywords = { found, missing };
    }
  }

  // ── Score ─────────────────────────────────────────────────────────────
  let totalWeight = 0;
  let earned = 0;
  for (const c of checks) {
    const w = CHECK_WEIGHTS[c.id] ?? 0;
    totalWeight += w;
    earned += c.status === "pass" ? w : c.status === "warn" ? w / 2 : 0;
  }
  if (keywords) {
    const total = keywords.found.length + keywords.missing.length;
    totalWeight += KEYWORD_WEIGHT;
    earned += (keywords.found.length / total) * KEYWORD_WEIGHT;
  }
  const score = Math.round((earned / totalWeight) * 100);

  return { checks, keywords, score, verdict: verdictFor(score) };
}

const STATUS_ICON: Record<CheckStatus, { glyph: string; color: string }> = {
  pass: { glyph: "✓", color: "var(--accent)" },
  warn: { glyph: "△", color: "#e8a13c" },
  fail: { glyph: "✗", color: "#ff6b6b" },
};

export default function ResumeChecker({ initialFiles }: { initialFiles?: File[] }) {
  const [resumeText, setResumeText] = useState("");
  const [jd, setJd] = useState("");
  const [pdfMeta, setPdfMeta] = useState<{ name: string; chars: number } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const f = initialFiles?.find((x) => x.type === "application/pdf");
    if (f) loadPdf(f);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialFiles]);

  async function loadPdf(f: File) {
    setError(null);
    setBusy(true);
    try {
      const pdfjs = await import("pdfjs-dist");
      pdfjs.GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url).toString();
      const doc = await pdfjs.getDocument({ data: await f.arrayBuffer() }).promise;
      const pages: string[] = [];
      for (let i = 1; i <= doc.numPages; i++) {
        const page = await doc.getPage(i);
        const tc = await page.getTextContent();
        pages.push(tc.items.map((item) => ("str" in item ? item.str : "")).join(" "));
      }
      const text = pages.join("\n").replace(/[ \t]+/g, " ").trim();
      setResumeText(text);
      setPdfMeta({ name: f.name, chars: text.length });
    } catch (err) {
      console.error(err);
      setError("Could not read this PDF. If it's password-protected, unlock it first.");
    } finally {
      setBusy(false);
    }
  }

  const analysis = useMemo(
    () => analyze(resumeText, jd, pdfMeta ? pdfMeta.chars : null),
    [resumeText, jd, pdfMeta],
  );

  const keywordTotal = analysis?.keywords
    ? analysis.keywords.found.length + analysis.keywords.missing.length
    : 0;
  const coveragePct = analysis?.keywords && keywordTotal > 0
    ? Math.round((analysis.keywords.found.length / keywordTotal) * 100)
    : 0;

  return (
    <div>
      <div className="field">
        <label>Upload your resume (PDF)</label>
        <input
          type="file"
          accept="application/pdf"
          className="input"
          disabled={busy}
          onChange={(e) => { const f = e.target.files?.[0]; if (f) loadPdf(f); }}
        />
      </div>

      {busy && <p style={{ color: "var(--muted)" }}>Reading PDF…</p>}
      {error && <p style={{ color: "#ff6b6b" }}>{error}</p>}

      {pdfMeta && !busy && (
        <div className="row" style={{ alignItems: "center", marginBottom: 10 }}>
          <span style={{ color: "var(--muted)", fontSize: ".85rem" }}>
            Loaded {pdfMeta.name} — {pdfMeta.chars.toLocaleString()} characters extracted (editable below)
          </span>
          <button
            type="button"
            className="btn secondary"
            onClick={() => { setPdfMeta(null); setResumeText(""); }}
          >
            Remove
          </button>
        </div>
      )}

      <div className="field">
        <label>— or paste your resume text</label>
        <textarea
          value={resumeText}
          onChange={(e) => setResumeText(e.target.value)}
          placeholder="Paste the full text of your resume here…"
          style={{ minHeight: 160 }}
        />
      </div>

      <div className="field">
        <label>Job description (optional — for keyword matching)</label>
        <textarea
          value={jd}
          onChange={(e) => setJd(e.target.value)}
          placeholder="Paste the job posting to see which of its keywords your resume is missing…"
          style={{ minHeight: 110 }}
        />
      </div>

      {analysis && (
        <div style={{ marginTop: 4 }}>
          {/* Score */}
          <div className="row" style={{ alignItems: "center", gap: 14 }}>
            <span style={{ fontSize: "2.4rem", fontWeight: 700, lineHeight: 1, color: scoreColor(analysis.score) }}>
              {analysis.score}
            </span>
            <div>
              <div style={{ color: "var(--muted)", fontSize: ".78rem", textTransform: "uppercase", letterSpacing: ".06em" }}>
                ATS score / 100
              </div>
              <div style={{ fontWeight: 600 }}>{analysis.verdict}</div>
            </div>
          </div>

          {/* Checks */}
          <div style={{ border: "1px solid var(--border)", borderRadius: 8, marginTop: 14 }}>
            {analysis.checks.map((c, i) => (
              <div
                key={c.id}
                style={{
                  display: "flex",
                  gap: 10,
                  alignItems: "flex-start",
                  padding: "10px 12px",
                  borderTop: i === 0 ? "none" : "1px solid var(--border)",
                }}
              >
                <span style={{ color: STATUS_ICON[c.status].color, fontWeight: 700, width: 18, flexShrink: 0, textAlign: "center" }}>
                  {STATUS_ICON[c.status].glyph}
                </span>
                <div>
                  <div style={{ fontWeight: 600 }}>{c.label}</div>
                  <div style={{ color: "var(--muted)", fontSize: ".85rem" }}>{c.message}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Keyword match */}
          {analysis.keywords && (
            <div style={{ marginTop: 18 }}>
              <div style={{ fontWeight: 600 }}>Keyword match vs job description</div>
              <p style={{ color: "var(--muted)", fontSize: ".85rem", margin: "4px 0 12px" }}>
                Coverage: {coveragePct}% — {analysis.keywords.found.length} of {keywordTotal} top keywords
                from the posting appear in your resume.
              </p>

              {analysis.keywords.found.length > 0 && (
                <div style={{ marginBottom: 12 }}>
                  <div style={{ color: "var(--muted)", fontSize: ".8rem", marginBottom: 6 }}>
                    Found in your resume ({analysis.keywords.found.length})
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {analysis.keywords.found.map((w) => (
                      <span
                        key={w}
                        style={{
                          border: "1px solid var(--accent)",
                          color: "var(--accent)",
                          borderRadius: 999,
                          padding: "3px 10px",
                          fontSize: ".82rem",
                        }}
                      >
                        {w}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {analysis.keywords.missing.length > 0 && (
                <div>
                  <div style={{ color: "var(--muted)", fontSize: ".8rem", marginBottom: 6 }}>
                    Missing ({analysis.keywords.missing.length}) — work these in where they honestly apply
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {analysis.keywords.missing.map((w) => (
                      <span
                        key={w}
                        style={{
                          border: "1px solid var(--border)",
                          color: "var(--muted)",
                          borderRadius: 999,
                          padding: "3px 10px",
                          fontSize: ".82rem",
                        }}
                      >
                        {w}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <p className="privacy-note">🔒 Your resume is analyzed entirely in your browser — it is never uploaded.</p>
    </div>
  );
}
