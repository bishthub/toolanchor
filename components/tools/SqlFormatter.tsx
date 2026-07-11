"use client";

import { useState } from "react";

type Tok = { t: "str" | "comment" | "word" | "punct"; v: string };

// Tokenize SQL so string literals, quoted identifiers and comments are never altered.
function tokenize(sql: string): Tok[] {
  const toks: Tok[] = [];
  let i = 0;
  while (i < sql.length) {
    const c = sql[i];
    if (/\s/.test(c)) { i++; continue; }
    if (c === "'") {
      let j = i + 1;
      while (j < sql.length) {
        if (sql[j] === "'" && sql[j + 1] === "'") { j += 2; continue; }
        if (sql[j] === "'") { j++; break; }
        j++;
      }
      toks.push({ t: "str", v: sql.slice(i, j) }); i = j; continue;
    }
    if (c === '"' || c === "`") {
      let j = i + 1;
      while (j < sql.length && sql[j] !== c) j++;
      toks.push({ t: "str", v: sql.slice(i, j + 1) }); i = j + 1; continue;
    }
    if (c === "-" && sql[i + 1] === "-") {
      let j = i;
      while (j < sql.length && sql[j] !== "\n") j++;
      toks.push({ t: "comment", v: sql.slice(i, j) }); i = j; continue;
    }
    if (c === "/" && sql[i + 1] === "*") {
      const end = sql.indexOf("*/", i + 2);
      const j = end === -1 ? sql.length : end + 2;
      toks.push({ t: "comment", v: sql.slice(i, j) }); i = j; continue;
    }
    const m = /^[A-Za-z_][A-Za-z0-9_$]*|^[0-9][0-9]*(\.[0-9]+)?/.exec(sql.slice(i));
    if (m) { toks.push({ t: "word", v: m[0] }); i += m[0].length; continue; }
    const op = /^(<=|>=|<>|!=|\|\||::)/.exec(sql.slice(i));
    if (op) { toks.push({ t: "punct", v: op[0] }); i += op[0].length; continue; }
    toks.push({ t: "punct", v: c }); i++;
  }
  return toks;
}

const KEYWORDS = new Set(["SELECT", "FROM", "WHERE", "AND", "OR", "NOT", "GROUP", "BY", "HAVING", "ORDER", "LIMIT", "OFFSET", "INSERT", "INTO", "VALUES", "UPDATE", "SET", "DELETE", "JOIN", "LEFT", "RIGHT", "INNER", "OUTER", "CROSS", "FULL", "ON", "UNION", "ALL", "CREATE", "TABLE", "AS", "IN", "IS", "NULL", "LIKE", "BETWEEN", "EXISTS", "DISTINCT", "CASE", "WHEN", "THEN", "ELSE", "END", "ASC", "DESC", "PRIMARY", "KEY", "FOREIGN", "REFERENCES", "DEFAULT", "UNIQUE", "INDEX", "DROP", "ALTER", "ADD", "IF", "USING"]);
const MAJOR = new Set(["SELECT", "FROM", "WHERE", "GROUP BY", "HAVING", "ORDER BY", "LIMIT", "OFFSET", "UNION", "UNION ALL", "VALUES", "SET", "INSERT INTO", "UPDATE", "DELETE FROM", "CREATE TABLE", "JOIN", "LEFT JOIN", "RIGHT JOIN", "INNER JOIN", "OUTER JOIN", "CROSS JOIN", "FULL JOIN", "LEFT OUTER JOIN", "RIGHT OUTER JOIN", "FULL OUTER JOIN"]);

// Merge multi-word keywords (GROUP BY, LEFT OUTER JOIN, …) into single tokens.
function mergeKeywords(toks: Tok[]): Tok[] {
  const out: Tok[] = [];
  for (let i = 0; i < toks.length; i++) {
    const t = toks[i];
    if (t.t === "word" && KEYWORDS.has(t.v.toUpperCase())) {
      let phrase = t.v.toUpperCase();
      let used = 0;
      for (let n = 2; n >= 1; n--) {
        const parts: string[] = [phrase];
        let k = i, ok = true;
        for (let s = 0; s < n; s++) {
          k++;
          if (toks[k]?.t !== "word") { ok = false; break; }
          parts.push(toks[k].v.toUpperCase());
        }
        if (ok && MAJOR.has(parts.join(" "))) { phrase = parts.join(" "); used = n; break; }
      }
      out.push({ t: "word", v: phrase });
      i += used;
    } else if (t.t === "word") {
      out.push({ t: "word", v: t.v });
    } else out.push(t);
  }
  return out;
}

function render(toks: Tok[], pretty: boolean): string {
  const lines: string[] = [];
  let cur = "";
  let indent = 0;
  let depth = 0;
  let clause = "";
  let lastWasIdent = false; // previous token was a plain identifier / function name

  const append = (v: string) => {
    const last = cur ? cur[cur.length - 1] : "";
    let space = Boolean(cur);
    if (!last || last === "(" || last === ".") space = false;
    if (v === ")" || v === "," || v === ";" || v === ".") space = false;
    if (v === "(" && lastWasIdent) space = false; // COUNT(*) — but keep "IN ("
    if (space) cur += " ";
    cur += v;
  };
  const flush = (nextIndent: number) => {
    if (cur.trim()) lines.push("  ".repeat(indent) + cur.trim());
    cur = "";
    indent = nextIndent;
  };
  // Does the SELECT list starting at i+1 contain a comma at top parenthesis depth?
  const selectHasTopComma = (i: number) => {
    let d = 0;
    for (let k = i + 1; k < toks.length; k++) {
      const t = toks[k];
      if (t.t === "punct" && t.v === "(") d++;
      else if (t.t === "punct" && t.v === ")") d--;
      else if (t.t === "punct" && t.v === "," && d === 0) return true;
      else if ((t.t === "word" && MAJOR.has(t.v) && d === 0) || (t.t === "punct" && t.v === ";")) return false;
    }
    return false;
  };

  for (let i = 0; i < toks.length; i++) {
    const t = toks[i];
    if (t.t === "comment") {
      append(t.v);
      lastWasIdent = false;
      if (t.v.startsWith("--")) flush(indent); // line comments must end their line
      continue;
    }
    if (t.t === "str") { append(t.v); lastWasIdent = false; continue; }
    if (t.t === "word") {
      const up = t.v.toUpperCase();
      const isKw = KEYWORDS.has(up) || MAJOR.has(up);
      if (pretty && depth === 0 && MAJOR.has(t.v)) {
        flush(0);
        append(t.v);
        clause = t.v;
        lastWasIdent = false;
        if (t.v === "SELECT" && selectHasTopComma(i)) flush(1);
        continue;
      }
      if (pretty && depth === 0 && (up === "AND" || up === "OR") && (clause === "WHERE" || clause === "HAVING" || clause.endsWith("JOIN"))) {
        flush(1); append(up); lastWasIdent = false; continue;
      }
      if (pretty && depth === 0 && up === "ON" && clause.endsWith("JOIN")) {
        flush(1); append(up); lastWasIdent = false; continue;
      }
      append(isKw ? up : t.v);
      lastWasIdent = !isKw;
      continue;
    }
    // punctuation
    if (t.v === "(") { depth++; append("("); lastWasIdent = false; continue; }
    if (t.v === ")") { depth = Math.max(0, depth - 1); append(")"); lastWasIdent = false; continue; }
    if (t.v === ",") {
      append(",");
      lastWasIdent = false;
      if (pretty && depth === 0 && (clause === "SELECT" || clause === "GROUP BY" || clause === "ORDER BY" || clause === "SET" || clause === "VALUES")) flush(1);
      continue;
    }
    if (t.v === ";") {
      append(";");
      lastWasIdent = false;
      if (pretty) { flush(0); lines.push(""); clause = ""; depth = 0; }
      continue;
    }
    append(t.v);
    lastWasIdent = false;
  }
  flush(0);
  // Lines only break in minify mode after `--` comments, where a break is required.
  return lines.join("\n").replace(/\n{3,}/g, "\n\n").trim();
}

function safeFormat(sql: string, pretty: boolean): string {
  try {
    return render(mergeKeywords(tokenize(sql)), pretty);
  } catch {
    return sql.replace(/\s+/g, " ").trim();
  }
}

export default function SqlFormatter() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [copied, setCopied] = useState(false);

  function run(minify: boolean) {
    setCopied(false);
    if (!input.trim()) { setOutput(""); return; }
    setOutput(safeFormat(input, !minify));
  }

  async function copy() {
    await navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  }

  return (
    <div>
      <div className="field">
        <label>Paste SQL</label>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="select id, name, email from users where active = 1 order by name;"
          style={{ minHeight: 160, fontFamily: "var(--font-mono), monospace", fontSize: ".85rem" }}
        />
      </div>

      <div className="row" style={{ marginBottom: 14 }}>
        <button className="btn" onClick={() => run(false)}>Format / Beautify</button>
        <button className="btn secondary" onClick={() => run(true)}>Minify</button>
      </div>

      {output && (
        <div className="field">
          <label>Result</label>
          <textarea readOnly value={output} style={{ minHeight: 220, fontFamily: "var(--font-mono), monospace", fontSize: ".85rem" }} />
          <button className="btn" style={{ marginTop: 10 }} onClick={copy}>{copied ? "✓ Copied" : "Copy result"}</button>
        </div>
      )}

      <p className="privacy-note">🔒 Formatting happens in your browser — your SQL is never uploaded.</p>
    </div>
  );
}
