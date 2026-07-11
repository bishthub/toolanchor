"use client";

import { useState } from "react";

const ELEMENT_NODE = 1;
const TEXT_NODE = 3;
const CDATA_SECTION_NODE = 4;

function elementToJson(el: Element): unknown {
  const obj: Record<string, unknown> = {};
  for (const attr of Array.from(el.attributes)) obj["@" + attr.name] = attr.value;
  let text = "";
  let hasChildElements = false;
  for (const node of Array.from(el.childNodes)) {
    if (node.nodeType === ELEMENT_NODE) {
      hasChildElements = true;
      const child = node as Element;
      const value = elementToJson(child);
      const key = child.tagName;
      if (key in obj) {
        const existing = obj[key];
        if (Array.isArray(existing)) existing.push(value);
        else obj[key] = [existing, value];
      } else {
        obj[key] = value;
      }
    } else if (node.nodeType === TEXT_NODE || node.nodeType === CDATA_SECTION_NODE) {
      text += node.nodeValue ?? "";
    }
  }
  const trimmed = text.trim();
  if (trimmed) {
    if (!hasChildElements && el.attributes.length === 0) return trimmed;
    obj["#text"] = trimmed;
  }
  return obj;
}

function xmlToJson(xml: string): string {
  const doc = new DOMParser().parseFromString(xml, "application/xml");
  const parseError = doc.querySelector("parsererror");
  if (parseError) throw new Error(parseError.textContent?.trim() || "Invalid XML");
  const root = doc.documentElement;
  return JSON.stringify({ [root.tagName]: elementToJson(root) }, null, 2);
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function buildXml(value: unknown, tag: string, pad: string): string {
  if (Array.isArray(value)) {
    return value.map((item) => buildXml(item, tag, pad)).join("\n");
  }
  if (value !== null && typeof value === "object") {
    const obj = value as Record<string, unknown>;
    let attrs = "";
    let text = "";
    const children: string[] = [];
    for (const [key, val] of Object.entries(obj)) {
      if (key.startsWith("@")) attrs += ` ${key.slice(1)}="${escapeXml(String(val))}"`;
      else if (key === "#text") text = escapeXml(String(val));
      else children.push(buildXml(val, key, pad + "  "));
    }
    if (children.length === 0) {
      return text ? `${pad}<${tag}${attrs}>${text}</${tag}>` : `${pad}<${tag}${attrs}/>`;
    }
    const parts = text ? [pad + "  " + text, ...children] : children;
    return `${pad}<${tag}${attrs}>\n${parts.join("\n")}\n${pad}</${tag}>`;
  }
  if (value === null || value === undefined) return `${pad}<${tag}/>`;
  return `${pad}<${tag}>${escapeXml(String(value))}</${tag}>`;
}

function jsonToXml(json: string): string {
  const parsed: unknown = JSON.parse(json);
  if (parsed !== null && typeof parsed === "object" && !Array.isArray(parsed)) {
    const keys = Object.keys(parsed as Record<string, unknown>);
    if (keys.length === 1 && !keys[0].startsWith("@") && keys[0] !== "#text" && !Array.isArray((parsed as Record<string, unknown>)[keys[0]])) {
      return buildXml((parsed as Record<string, unknown>)[keys[0]], keys[0], "");
    }
  }
  return buildXml(parsed, "root", "");
}

export default function XmlToJson() {
  const [mode, setMode] = useState<"x2j" | "j2x">("x2j");
  const [input, setInput] = useState("");
  const [copied, setCopied] = useState(false);

  let output = "";
  let error: string | null = null;
  if (input.trim()) {
    try {
      output = mode === "x2j" ? xmlToJson(input) : jsonToXml(input);
    } catch (e) {
      error = e instanceof Error ? e.message : "Conversion error";
    }
  }

  async function copy() { await navigator.clipboard.writeText(output); setCopied(true); setTimeout(() => setCopied(false), 1200); }

  return (
    <div>
      <div className="field">
        <label>Direction</label>
        <div className="row">
          <button type="button" className={`btn ${mode === "x2j" ? "" : "secondary"}`} onClick={() => setMode("x2j")}>XML → JSON</button>
          <button type="button" className={`btn ${mode === "j2x" ? "" : "secondary"}`} onClick={() => setMode("j2x")}>JSON → XML</button>
        </div>
      </div>
      <div className="field">
        <label>{mode === "x2j" ? "XML" : "JSON"}</label>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="mono"
          placeholder={mode === "x2j"
            ? '<note id="1">\n  <to>Amy</to>\n  <to>Sam</to>\n  <body>Hello</body>\n</note>'
            : '{"note": {"@id": "1", "to": ["Amy", "Sam"], "body": "Hello"}}'}
        />
      </div>
      {error && <p style={{ color: "#ff6b6b" }}>⚠ {error}</p>}
      {output && (
        <div className="field">
          <label>{mode === "x2j" ? "JSON" : "XML"}</label>
          <textarea readOnly value={output} className="mono" style={{ minHeight: 180 }} />
          <button className="btn" style={{ marginTop: 8 }} onClick={copy}>{copied ? "✓ Copied" : "Copy result"}</button>
        </div>
      )}
      <p className="privacy-note">🔒 Converted locally in your browser — your data is never uploaded.</p>
    </div>
  );
}
