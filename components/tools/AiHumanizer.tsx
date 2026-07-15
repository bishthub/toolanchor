"use client";

import { useState } from "react";

// Words and phrases that AI models over-use, mapped to the plain-English
// alternatives a person would actually write. Order matters: longer phrases
// are replaced before single words.
const PHRASE_SWAPS: [RegExp, string][] = [
  [/\bit(?:'s| is) (?:important|worth) (?:to note|noting) that\s*/gi, ""],
  [/\bit should be noted that\s*/gi, ""],
  [/\bin today's (?:fast-paced|ever-evolving|digital) (?:world|landscape|age),?\s*/gi, ""],
  [/\bin the (?:realm|world|landscape) of\b/gi, "in"],
  [/\bnavigating the complexities of\b/gi, "handling"],
  [/\bserves as a testament to\b/gi, "shows"],
  [/\bis a testament to\b/gi, "shows"],
  [/\bplays a (?:crucial|pivotal|vital) role in\b/gi, "matters for"],
  [/\bin order to\b/gi, "to"],
  [/\bdue to the fact that\b/gi, "because"],
  [/\bwhen it comes to\b/gi, "for"],
  [/\ba wide (?:range|array|variety) of\b/gi, "many"],
  [/\bfirst and foremost\b/gi, "first"],
  [/\blast but not least\b/gi, "finally"],
  [/\bin conclusion,?\s*/gi, ""],
  [/\bto summarize,?\s*/gi, ""],
  [/\bdelve (?:in)?to\b/gi, "look at"],
  [/\bdelving into\b/gi, "looking at"],
  [/\bembark on\b/gi, "start"],
  [/\bboasts\b/gi, "has"],
  [/\bmyriad of\b/gi, "many"],
  [/\bmyriad\b/gi, "many"],
  [/\ba plethora of\b/gi, "plenty of"],
  [/\bleverage\b/gi, "use"],
  [/\bleveraging\b/gi, "using"],
  [/\butilize\b/gi, "use"],
  [/\butilizing\b/gi, "using"],
  [/\bfacilitate\b/gi, "help"],
  [/\bfurthermore,?\b/gi, "also,"],
  [/\bmoreover,?\b/gi, "also,"],
  [/\badditionally,?\b/gi, "also,"],
  [/\bconsequently,?\b/gi, "so"],
  [/\bsubsequently\b/gi, "then"],
  [/\bnevertheless\b/gi, "still"],
  [/\bnotwithstanding\b/gi, "despite"],
  [/\bpivotal\b/gi, "key"],
  [/\bcrucial\b/gi, "key"],
  [/\bseamless(?:ly)?\b/gi, "smooth"],
  [/\brobust\b/gi, "solid"],
  [/\bharness(?:ing)? the power of\b/gi, "using"],
  [/\bunlock the (?:full )?potential of\b/gi, "get more from"],
  [/\bfostering\b/gi, "building"],
  [/\bfosters\b/gi, "builds"],
  [/\bfoster\b/gi, "build"],
  [/\belevate\b/gi, "improve"],
  [/\bgame-?changer\b/gi, "big improvement"],
  [/\bcutting-edge\b/gi, "modern"],
  [/\bstate-of-the-art\b/gi, "modern"],
  [/\bever-evolving\b/gi, "changing"],
  [/\bholistic\b/gi, "complete"],
  [/\bsynergy\b/gi, "teamwork"],
  [/\bparadigm shift\b/gi, "big change"],
  [/\btapestry of\b/gi, "mix of"],
  [/\bunderscores\b/gi, "highlights"],
  [/\bunderscored\b/gi, "highlighted"],
  [/\bexemplifies\b/gi, "shows"],
  [/\bexemplified\b/gi, "showed"],
  [/\bencompasses\b/gi, "covers"],
  [/\bencompassing\b/gi, "covering"],
];

const CONTRACTIONS: [RegExp, string][] = [
  [/\bdo not\b/g, "don't"], [/\bdoes not\b/g, "doesn't"], [/\bdid not\b/g, "didn't"],
  [/\bis not\b/g, "isn't"], [/\bare not\b/g, "aren't"], [/\bwas not\b/g, "wasn't"],
  [/\bwere not\b/g, "weren't"], [/\bhave not\b/g, "haven't"], [/\bhas not\b/g, "hasn't"],
  [/\bhad not\b/g, "hadn't"], [/\bwill not\b/g, "won't"], [/\bwould not\b/g, "wouldn't"],
  [/\bcould not\b/g, "couldn't"], [/\bshould not\b/g, "shouldn't"], [/\bcannot\b/g, "can't"],
  [/\bit is\b/g, "it's"], [/\bthat is\b/g, "that's"], [/\bthere is\b/g, "there's"],
  [/\bwe are\b/g, "we're"], [/\byou are\b/g, "you're"], [/\bthey are\b/g, "they're"],
  [/\bI am\b/g, "I'm"], [/\blet us\b/g, "let's"], [/\bwe will\b/g, "we'll"],
  [/\byou will\b/g, "you'll"], [/\bit will\b/g, "it'll"],
];

function matchCase(replacement: string, original: string): string {
  if (!replacement) return replacement;
  if (original[0] === original[0].toUpperCase()) {
    return replacement[0].toUpperCase() + replacement.slice(1);
  }
  return replacement;
}

function humanize(
  text: string,
  opts: { buzzwords: boolean; contractions: boolean; emdashes: boolean }
): { result: string; changes: number } {
  let out = text;
  let changes = 0;

  if (opts.buzzwords) {
    for (const [re, repl] of PHRASE_SWAPS) {
      out = out.replace(re, (m) => {
        changes++;
        return matchCase(repl, m);
      });
    }
    // Tidy artifacts left by removed phrases: doubled spaces, dangling commas,
    // and sentences now starting lowercase.
    out = out.replace(/ {2,}/g, " ").replace(/([.!?])\s*,\s*/g, "$1 ");
    out = out.replace(/(^|[.!?]\s+)([a-z])/g, (_, pre, c) => pre + c.toUpperCase());
  }

  if (opts.contractions) {
    for (const [re, repl] of CONTRACTIONS) {
      out = out.replace(re, () => {
        changes++;
        return repl;
      });
    }
  }

  if (opts.emdashes) {
    // AI text over-uses em-dash asides; convert them to commas.
    out = out.replace(/\s*—\s*/g, () => {
      changes++;
      return ", ";
    });
  }

  return { result: out, changes };
}

export default function AiHumanizer() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [changes, setChanges] = useState<number | null>(null);
  const [buzzwords, setBuzzwords] = useState(true);
  const [contractions, setContractions] = useState(true);
  const [emdashes, setEmdashes] = useState(false);
  const [copied, setCopied] = useState(false);

  function run() {
    const { result, changes } = humanize(input, { buzzwords, contractions, emdashes });
    setOutput(result);
    setChanges(changes);
    setCopied(false);
  }

  async function copy() {
    await navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  }

  return (
    <div>
      <div className="field">
        <label>AI-generated text to humanize</label>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Paste text from ChatGPT, Claude, Gemini…"
          style={{ minHeight: 180 }}
        />
      </div>

      <div className="row" style={{ alignItems: "center", gap: 16, flexWrap: "wrap" }}>
        <label style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <input type="checkbox" checked={buzzwords} onChange={(e) => setBuzzwords(e.target.checked)} />
          Replace AI buzzwords &amp; filler ("delve", "leverage", "it's important to note"…)
        </label>
        <label style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <input type="checkbox" checked={contractions} onChange={(e) => setContractions(e.target.checked)} />
          Use contractions (it is → it's)
        </label>
        <label style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <input type="checkbox" checked={emdashes} onChange={(e) => setEmdashes(e.target.checked)} />
          Replace em-dashes with commas
        </label>
      </div>

      <button className="btn" onClick={run} disabled={!input.trim()} style={{ marginTop: 12 }}>
        ✍️ Humanize text
      </button>

      {output && (
        <div className="field" style={{ marginTop: 16 }}>
          <label>
            Humanized result{changes !== null && ` — ${changes} ${changes === 1 ? "change" : "changes"} made`}
          </label>
          <textarea readOnly value={output} style={{ minHeight: 180 }} />
          <button className="btn" style={{ marginTop: 8 }} onClick={copy}>
            {copied ? "✓ Copied" : "Copy result"}
          </button>
          {changes === 0 && (
            <p style={{ color: "var(--muted)", marginTop: 8 }}>
              No AI tells found — this text already reads naturally.
            </p>
          )}
        </div>
      )}

      <p className="privacy-note">
        🔒 Runs in your browser — your text is never uploaded. Uses transparent rule-based rewriting
        (no AI model), so review the result before using it.
      </p>
    </div>
  );
}
