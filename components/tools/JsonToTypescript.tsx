"use client";

import { useMemo, useState } from "react";

// Infer TypeScript interfaces from a JSON value. Nested objects become their
// own named interfaces; arrays infer a merged element type.
function pascal(name: string): string {
  const s = name.replace(/[^a-zA-Z0-9]+/g, " ").trim().split(/\s+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join("");
  return /^[A-Za-z]/.test(s) ? s : "I" + s || "Root";
}

function generate(root: unknown, rootName = "Root"): string {
  const interfaces: string[] = [];
  const seen = new Set<string>();

  function typeOf(value: unknown, nameHint: string): string {
    if (value === null) return "null";
    if (Array.isArray(value)) {
      if (!value.length) return "unknown[]";
      const elemTypes = new Set(value.map((v) => typeOf(v, singular(nameHint))));
      const union = [...elemTypes].join(" | ");
      return elemTypes.size > 1 ? `(${union})[]` : `${union}[]`;
    }
    if (typeof value === "object") {
      const name = uniqueName(pascal(nameHint) || "Obj");
      buildInterface(name, value as Record<string, unknown>);
      return name;
    }
    return typeof value === "number" ? "number" : typeof value === "boolean" ? "boolean" : "string";
  }

  function singular(n: string) { return n.replace(/s$/, "") || n; }

  function uniqueName(base: string): string {
    let name = base, i = 2;
    while (seen.has(name)) name = base + i++;
    seen.add(name);
    return name;
  }

  function buildInterface(name: string, obj: Record<string, unknown>) {
    const lines = [`interface ${name} {`];
    for (const [key, val] of Object.entries(obj)) {
      const t = typeOf(val, key);
      const safeKey = /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(key) ? key : JSON.stringify(key);
      lines.push(`  ${safeKey}: ${t};`);
    }
    lines.push("}");
    interfaces.push(lines.join("\n"));
  }

  if (root === null || typeof root !== "object") {
    return `type ${pascal(rootName)} = ${typeOf(root, rootName)};`;
  }
  if (Array.isArray(root)) {
    const t = typeOf(root, rootName);
    interfaces.push(`type ${pascal(rootName)} = ${t};`);
  } else {
    seen.add(pascal(rootName));
    buildInterface(pascal(rootName), root as Record<string, unknown>);
  }
  // Root interface last-built ends up first; reverse so dependencies read top-down.
  return interfaces.reverse().join("\n\n");
}

const box: React.CSSProperties = {
  fontFamily: "var(--font-mono), monospace", fontSize: ".84rem", whiteSpace: "pre",
  background: "var(--surface)", border: "1px solid var(--border)",
  borderRadius: "var(--radius-sm)", padding: "14px 16px", margin: "6px 0 0", overflowX: "auto",
};

export default function JsonToTypescript() {
  const [input, setInput] = useState(`{\n  "id": 1,\n  "name": "Ada",\n  "active": true,\n  "roles": ["admin", "user"],\n  "profile": { "age": 36, "city": "London" }\n}`);
  const { output, error } = useMemo(() => {
    try {
      const parsed = JSON.parse(input);
      return { output: generate(parsed), error: null as string | null };
    } catch (e) {
      return { output: "", error: (e as Error).message };
    }
  }, [input]);

  return (
    <div>
      <div className="field">
        <label>Paste JSON</label>
        <textarea className="input" style={{ minHeight: 160, fontFamily: "var(--font-mono), monospace" }} value={input} onChange={(e) => setInput(e.target.value)} />
      </div>

      {error ? (
        <p style={{ color: "#ff6b6b" }}>Invalid JSON: {error}</p>
      ) : (
        <div className="field">
          <label>TypeScript interfaces</label>
          <pre style={box}>{output}</pre>
        </div>
      )}

      <p className="privacy-note">🔒 Generated in your browser — your JSON is never uploaded.</p>
    </div>
  );
}
