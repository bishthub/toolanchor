"use client";

import { useEffect, useMemo, useState } from "react";

// Dictionary: the public-domain ENABLE list (~168k words, 2–15 letters) served
// as a static asset from our own domain — fetched once on first use, then held
// in memory (and cached offline by the service worker). The user's letters are
// never sent anywhere.
const WORDLIST_URL = "/wordlists/enable1.txt";

const SCRABBLE_POINTS: Record<string, number> = {
  a: 1, b: 3, c: 3, d: 2, e: 1, f: 4, g: 2, h: 4, i: 1, j: 8, k: 5, l: 1, m: 3,
  n: 1, o: 1, p: 3, q: 10, r: 1, s: 1, t: 1, u: 1, v: 4, w: 4, x: 8, y: 4, z: 10,
};

function scrabbleScore(word: string): number {
  let s = 0;
  for (const c of word) s += SCRABBLE_POINTS[c] ?? 0;
  return s;
}

const A = "a".charCodeAt(0);

/** Can `word` be formed from the available letter counts plus `blanks` wildcards? */
function canForm(word: string, avail: Int32Array, blanks: number): boolean {
  const need = new Int32Array(26);
  let deficit = 0;
  for (let i = 0; i < word.length; i++) {
    const idx = word.charCodeAt(i) - A;
    need[idx]++;
    if (need[idx] > avail[idx]) {
      deficit++;
      if (deficit > blanks) return false;
    }
  }
  return true;
}

export default function WordUnscrambler() {
  const [dict, setDict] = useState<string[] | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [lettersRaw, setLettersRaw] = useState("");
  const [startsWith, setStartsWith] = useState("");
  const [endsWith, setEndsWith] = useState("");
  const [contains, setContains] = useState("");
  const [exactLength, setExactLength] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch(WORDLIST_URL)
      .then((r) => {
        if (!r.ok) throw new Error(String(r.status));
        return r.text();
      })
      .then((text) => {
        if (!cancelled) setDict(text.split("\n").filter(Boolean));
      })
      .catch(() => {
        if (!cancelled) setLoadError(true);
      });
    return () => { cancelled = true; };
  }, []);

  const letters = lettersRaw.toLowerCase().replace(/[^a-z?]/g, "").slice(0, 15);
  const blanks = Math.min((letters.match(/\?/g) ?? []).length, 3);
  const plain = letters.replace(/\?/g, "");

  const results = useMemo(() => {
    if (!dict || plain.length + blanks < 2) return null;

    const avail = new Int32Array(26);
    for (const c of plain) avail[c.charCodeAt(0) - A]++;
    const maxLen = plain.length + blanks;

    const sw = startsWith.toLowerCase().replace(/[^a-z]/g, "");
    const ew = endsWith.toLowerCase().replace(/[^a-z]/g, "");
    const ct = contains.toLowerCase().replace(/[^a-z]/g, "");
    const len = parseInt(exactLength, 10) || 0;

    const found: string[] = [];
    for (const w of dict) {
      if (w.length > maxLen) continue;
      if (len && w.length !== len) continue;
      if (sw && !w.startsWith(sw)) continue;
      if (ew && !w.endsWith(ew)) continue;
      if (ct && !w.includes(ct)) continue;
      if (canForm(w, avail, blanks)) found.push(w);
    }

    // Longest first; within a length, highest Scrabble score first.
    found.sort((a, b) => b.length - a.length || scrabbleScore(b) - scrabbleScore(a) || a.localeCompare(b));

    const byLength = new Map<number, string[]>();
    for (const w of found) {
      const group = byLength.get(w.length);
      if (group) group.push(w);
      else byLength.set(w.length, [w]);
    }
    return { total: found.length, byLength: [...byLength.entries()], all: found };
  }, [dict, plain, blanks, startsWith, endsWith, contains, exactLength]);

  async function copy() {
    if (!results) return;
    await navigator.clipboard.writeText(results.all.join(", "));
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  }

  return (
    <div>
      <div className="field">
        <label>Your letters — use ? for a blank tile (up to 3)</label>
        <input
          className="input"
          value={lettersRaw}
          onChange={(e) => { setLettersRaw(e.target.value); setCopied(false); }}
          placeholder="e.g. AETRSN?"
          maxLength={20}
          style={{ maxWidth: 340, textTransform: "uppercase", letterSpacing: "0.15em", fontWeight: 600 }}
        />
      </div>

      <div className="row">
        <div className="field" style={{ maxWidth: 140 }}>
          <label>Starts with</label>
          <input className="input" value={startsWith} maxLength={5} onChange={(e) => setStartsWith(e.target.value)} />
        </div>
        <div className="field" style={{ maxWidth: 140 }}>
          <label>Ends with</label>
          <input className="input" value={endsWith} maxLength={5} onChange={(e) => setEndsWith(e.target.value)} />
        </div>
        <div className="field" style={{ maxWidth: 140 }}>
          <label>Contains</label>
          <input className="input" value={contains} maxLength={5} onChange={(e) => setContains(e.target.value)} />
        </div>
        <div className="field" style={{ maxWidth: 140 }}>
          <label>Exact length</label>
          <input className="input" type="number" min={2} max={15} value={exactLength} onChange={(e) => setExactLength(e.target.value)} />
        </div>
      </div>

      {loadError && (
        <p style={{ color: "var(--muted)" }}>
          Couldn't load the dictionary — check your connection and reload the page.
        </p>
      )}
      {!dict && !loadError && (
        <p style={{ color: "var(--muted)" }}>Loading dictionary ({"~"}500 KB, one-time)…</p>
      )}

      {dict && !results && (
        <p style={{ color: "var(--muted)" }}>
          Dictionary ready — {dict.length.toLocaleString()} words. Enter at least 2 letters.
        </p>
      )}

      {results && (
        <div style={{ marginTop: 8 }}>
          <div className="field">
            <label>
              {results.total === 0
                ? "No words found — try adding a blank (?) or removing filters"
                : `${results.total.toLocaleString()} ${results.total === 1 ? "word" : "words"} found`}
            </label>
          </div>
          {results.byLength.map(([len, words]) => (
            <div key={len} className="field">
              <label>{len} letters ({words.length})</label>
              <div style={{
                display: "flex", flexWrap: "wrap", gap: 8, padding: 12,
                background: "var(--bg-2)", borderRadius: 8, maxHeight: 200, overflowY: "auto",
              }}>
                {words.slice(0, 300).map((w) => (
                  <span key={w} style={{ whiteSpace: "nowrap" }}>
                    <code style={{ fontSize: ".95rem" }}>{w}</code>
                    <sup style={{ color: "var(--muted)", marginLeft: 2 }}>{scrabbleScore(w)}</sup>
                  </span>
                ))}
                {words.length > 300 && <span style={{ color: "var(--muted)" }}>…{words.length - 300} more</span>}
              </div>
            </div>
          ))}
          {results.total > 0 && (
            <button className="btn" onClick={copy}>{copied ? "✓ Copied" : "Copy all words"}</button>
          )}
        </div>
      )}

      <p className="privacy-note">
        🔒 The dictionary downloads once from this site; unscrambling runs entirely in your browser —
        your letters are never sent anywhere. Small numbers show Scrabble points.
      </p>
    </div>
  );
}
