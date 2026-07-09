"use client";

import { useState, useCallback } from "react";

// A large synonym map for common English words.
const SYNONYMS: Record<string, string[]> = {
  good: ["excellent", "fine", "positive", "favorable", "satisfactory", "superb"],
  bad: ["poor", "unfavorable", "negative", "inferior", "substandard", "dreadful"],
  big: ["large", "huge", "enormous", "substantial", "massive", "sizable"],
  small: ["tiny", "compact", "miniature", "diminutive", "modest", "petite"],
  fast: ["quick", "swift", "rapid", "speedy", "brisk", "hasty"],
  slow: ["gradual", "leisurely", "moderate", "sluggish", "unhurried"],
  easy: ["simple", "straightforward", "effortless", "uncomplicated", "painless"],
  hard: ["difficult", "challenging", "tough", "arduous", "demanding"],
  new: ["fresh", "modern", "recent", "current", "novel", "contemporary"],
  old: ["ancient", "aged", "former", "antique", "vintage", "elderly"],
  important: ["significant", "crucial", "essential", "vital", "critical", "key"],
  different: ["distinct", "various", "diverse", "contrasting", "separate", "alternative"],
  beautiful: ["attractive", "lovely", "stunning", "gorgeous", "splendid", "magnificent"],
  interesting: ["engaging", "captivating", "compelling", "intriguing", "fascinating", "absorbing"],
  happy: ["delighted", "cheerful", "content", "pleased", "joyful", "elated"],
  sad: ["unhappy", "sorrowful", "dejected", "melancholy", "downcast", "gloomy"],
  help: ["assist", "aid", "support", "facilitate", "guide", "serve"],
  use: ["utilize", "employ", "apply", "leverage", "operate", "wield"],
  make: ["create", "produce", "construct", "generate", "fashion", "form"],
  show: ["display", "demonstrate", "exhibit", "reveal", "present", "indicate"],
  need: ["require", "necessitate", "demand", "call for"],
  give: ["provide", "supply", "furnish", "grant", "offer", "bestow"],
  get: ["obtain", "acquire", "secure", "attain", "procure", "receive"],
  change: ["modify", "alter", "adjust", "transform", "convert", "revise"],
  improve: ["enhance", "upgrade", "refine", "better", "polish", "optimize"],
  start: ["begin", "commence", "initiate", "launch", "embark on", "activate"],
  end: ["conclude", "terminate", "finish", "cease", "halt", "discontinue"],
  keep: ["retain", "maintain", "preserve", "sustain", "hold", "continue"],
  think: ["believe", "consider", "suppose", "reckon", "deem"],
  say: ["state", "declare", "express", "mention", "remark", "assert"],
  tell: ["inform", "notify", "advise", "brief", "apprise"],
  ask: ["inquire", "query", "question", "request", "solicit"],
  find: ["discover", "locate", "uncover", "detect", "identify"],
  try: ["attempt", "endeavor", "strive", "undertake", "seek"],
  work: ["labor", "toil", "operate", "function"],
  like: ["enjoy", "appreciate", "admire", "favor", "prefer"],
  love: ["adore", "cherish", "treasure", "prize", "revere"],
  want: ["desire", "wish", "yearn", "crave", "covet"],
  can: ["able to", "capable of", "equipped to"],
  very: ["extremely", "exceedingly", "remarkably", "immensely", "profoundly"],
  also: ["additionally", "furthermore", "moreover", "likewise"],
  because: ["since", "as", "due to", "owing to", "given that"],
  so: ["therefore", "thus", "consequently", "accordingly", "hence"],
  then: ["subsequently", "afterward", "next", "thereafter"],
  always: ["consistently", "invariably", "perpetually", "continually"],
  often: ["frequently", "regularly", "commonly", "repeatedly", "habitually"],
  maybe: ["perhaps", "possibly", "potentially"],
  really: ["genuinely", "truly", "actually", "indeed", "authentically"],
  many: ["numerous", "countless", "abundant", "plentiful", "copious"],
  some: ["several", "various", "assorted"],
};

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function paraphrase(text: string, mode: "standard" | "fluency"): string {
  const words = text.split(/(\b\w+\b)/g);
  return words
    .map((word) => {
      const lower = word.toLowerCase();
      const syns = SYNONYMS[lower];
      if (!syns) return word;
      // 60% of the time swap the word in standard mode, 80% in fluency
      if (Math.random() > (mode === "fluency" ? 0.8 : 0.6)) return word;
      const chosen = shuffle(syns)[0];
      // Preserve case
      if (word[0] === word[0]?.toUpperCase() && word.length > 1) {
        return chosen[0].toUpperCase() + chosen.slice(1);
      }
      return chosen;
    })
    .join("");
}

export default function ParaphrasingTool() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [mode, setMode] = useState<"standard" | "fluency">("standard");
  const [copied, setCopied] = useState(false);

  const handleParaphrase = useCallback(() => {
    if (!input.trim()) return;
    setOutput(paraphrase(input, mode));
  }, [input, mode]);

  async function copy() {
    await navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  }

  return (
    <div>
      <div className="field">
        <label>Text to paraphrase</label>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Paste your text here…"
          style={{ minHeight: 160 }}
        />
      </div>

      <div className="row">
        <div className="field">
          <label>Mode</label>
          <select className="input" value={mode} onChange={(e) => setMode(e.target.value as typeof mode)}>
            <option value="standard">Standard — light rewrite</option>
            <option value="fluency">Fluency — stronger restructuring</option>
          </select>
        </div>
      </div>

      <button className="btn" onClick={handleParaphrase} disabled={!input.trim()}>
        ✏️ Paraphrase
      </button>

      {output && (
        <div className="field" style={{ marginTop: 16 }}>
          <label>Paraphrased result</label>
          <textarea readOnly value={output} style={{ minHeight: 160 }} />
          <button className="btn" style={{ marginTop: 8 }} onClick={copy}>
            {copied ? "✓ Copied" : "Copy result"}
          </button>
        </div>
      )}

      <p className="privacy-note">🔒 Runs in your browser — your text is never uploaded. Uses synonym substitution, not AI.</p>
    </div>
  );
}
