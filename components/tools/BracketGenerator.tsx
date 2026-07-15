"use client";

import { useMemo, useState } from "react";

function getCryptoRandomInt(max: number): number {
  const array = new Uint32Array(1);
  crypto.getRandomValues(array);
  return array[0] % max;
}

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = getCryptoRandomInt(i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Build single-elimination rounds. Entries are padded with byes up to the
// next power of two; byes are spread so no one meets a bye after round 1.
function buildBracket(teams: string[]): string[][][] {
  const size = 2 ** Math.ceil(Math.log2(Math.max(teams.length, 2)));
  const padded: (string | null)[] = [...teams];
  while (padded.length < size) padded.push(null);

  const rounds: string[][][] = [];
  const first: string[][] = [];
  for (let i = 0; i < size; i += 2) {
    first.push([padded[i] ?? "— bye —", padded[i + 1] ?? "— bye —"]);
  }
  rounds.push(first);

  let slots = size / 2;
  while (slots >= 2) {
    const round: string[][] = [];
    for (let i = 0; i < slots; i += 2) round.push(["?", "?"]);
    rounds.push(round);
    slots /= 2;
  }
  return rounds;
}

function roundName(index: number, total: number): string {
  const fromEnd = total - index;
  if (fromEnd === 1) return "Final";
  if (fromEnd === 2) return "Semi-finals";
  if (fromEnd === 3) return "Quarter-finals";
  return `Round ${index + 1}`;
}

export default function BracketGenerator() {
  const [mode, setMode] = useState<"bracket" | "sweepstake">("bracket");
  const [teamsInput, setTeamsInput] = useState("");
  const [peopleInput, setPeopleInput] = useState("");
  const [shuffled, setShuffled] = useState<string[] | null>(null);
  const [assignments, setAssignments] = useState<[string, string[]][] | null>(null);
  const [copied, setCopied] = useState(false);

  const teams = useMemo(
    () => teamsInput.split("\n").map((s) => s.trim()).filter(Boolean),
    [teamsInput]
  );
  const people = useMemo(
    () => peopleInput.split("\n").map((s) => s.trim()).filter(Boolean),
    [peopleInput]
  );

  const rounds = useMemo(() => (shuffled ? buildBracket(shuffled) : null), [shuffled]);

  function drawBracket() {
    if (teams.length < 2) return;
    setShuffled(shuffleArray(teams));
    setCopied(false);
  }

  function drawSweepstake() {
    if (teams.length === 0 || people.length === 0) return;
    const bag = shuffleArray(teams);
    const order = shuffleArray(people);
    const result = new Map<string, string[]>(order.map((p) => [p, []]));
    // Deal teams round-robin so counts differ by at most one.
    bag.forEach((team, i) => result.get(order[i % order.length])!.push(team));
    setAssignments([...result.entries()]);
    setCopied(false);
  }

  function asText(): string {
    if (mode === "bracket" && rounds) {
      return rounds
        .map((r, i) =>
          `${roundName(i, rounds.length)}\n` +
          r.map((m) => `  ${m[0]}  vs  ${m[1]}`).join("\n")
        )
        .join("\n\n");
    }
    if (mode === "sweepstake" && assignments) {
      return assignments.map(([p, ts]) => `${p}: ${ts.join(", ") || "—"}`).join("\n");
    }
    return "";
  }

  async function copy() {
    await navigator.clipboard.writeText(asText());
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  }

  return (
    <div>
      <div className="field" style={{ maxWidth: 320 }}>
        <label>Mode</label>
        <select className="input" value={mode} onChange={(e) => { setMode(e.target.value as typeof mode); setCopied(false); }}>
          <option value="bracket">Tournament bracket — random matchups</option>
          <option value="sweepstake">Sweepstake — assign teams to people</option>
        </select>
      </div>

      <div className="field">
        <label>Teams or players — one per line ({teams.length})</label>
        <textarea
          value={teamsInput}
          onChange={(e) => setTeamsInput(e.target.value)}
          placeholder={"Brazil\nFrance\nArgentina\nSpain\nEngland\nGermany\nPortugal\nNetherlands"}
          style={{ minHeight: 140 }}
        />
      </div>

      {mode === "sweepstake" && (
        <div className="field">
          <label>People in the sweepstake — one per line ({people.length})</label>
          <textarea
            value={peopleInput}
            onChange={(e) => setPeopleInput(e.target.value)}
            placeholder={"Alice\nBen\nChloe\nDev"}
            style={{ minHeight: 100 }}
          />
        </div>
      )}

      {mode === "bracket" ? (
        <button className="btn" onClick={drawBracket} disabled={teams.length < 2}>
          🎲 Draw bracket
        </button>
      ) : (
        <button className="btn" onClick={drawSweepstake} disabled={teams.length === 0 || people.length === 0}>
          🎲 Draw sweepstake
        </button>
      )}

      {mode === "bracket" && rounds && (
        <div style={{ marginTop: 16, overflowX: "auto" }}>
          <div style={{ display: "flex", gap: 24, alignItems: "flex-start", minWidth: "min-content" }}>
            {rounds.map((round, ri) => (
              <div key={ri} style={{ display: "flex", flexDirection: "column", gap: 12, justifyContent: "space-around", minWidth: 180 }}>
                <strong style={{ fontSize: ".85rem", color: "var(--muted)" }}>{roundName(ri, rounds.length)}</strong>
                {round.map((m, mi) => (
                  <div key={mi} style={{ border: "1px solid var(--border)", borderRadius: 8, overflow: "hidden" }}>
                    {m.map((t, ti) => (
                      <div key={ti} style={{
                        padding: "6px 10px",
                        borderTop: ti === 1 ? "1px solid var(--border)" : "none",
                        color: t === "— bye —" || t === "?" ? "var(--muted)" : "inherit",
                        whiteSpace: "nowrap",
                      }}>{t}</div>
                    ))}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}

      {mode === "sweepstake" && assignments && (
        <div style={{ marginTop: 16, display: "grid", gap: 8 }}>
          {assignments.map(([person, ts]) => (
            <div key={person} style={{ border: "1px solid var(--border)", borderRadius: 8, padding: "8px 12px" }}>
              <strong>{person}</strong>
              <span style={{ color: "var(--muted)" }}> → </span>
              {ts.join(", ") || "—"}
            </div>
          ))}
        </div>
      )}

      {((mode === "bracket" && rounds) || (mode === "sweepstake" && assignments)) && (
        <button className="btn" style={{ marginTop: 12 }} onClick={copy}>
          {copied ? "✓ Copied" : "Copy as text"}
        </button>
      )}

      <p className="privacy-note">🔒 Draws use the cryptographically-secure Web Crypto API and run entirely in your browser — nothing is uploaded.</p>
    </div>
  );
}
