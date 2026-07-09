"use client";

import { useState, useCallback } from "react";

type TaskType = "summarise" | "write" | "analyse" | "explain" | "code" | "custom";

interface PromptTemplate {
  label: string;
  placeholder: string;
  templates: Partial<Record<TaskType, string>>;
}

const TEMPLATES: Record<string, PromptTemplate> = {
  topic: {
    label: "Topic or subject",
    placeholder: "e.g. climate change, React hooks, SEO best practices",
    templates: {
      summarise: "Summarise the following text about {value}:\n\n{text}\n\nFocus on the key points only. Use clear, concise language.",
      write: "Write a {tone} piece about {value}.\n\nLength: ~{length} words.\n\nAudience: {audience}\n\nAdditional context:\n{text}",
      analyse: "Analyse the following {value}:\n\n{text}\n\nProvide key insights, patterns and actionable takeaways.",
      explain: "Explain {value} in simple terms.\n\nAudience: {audience}\n\nInclude examples where helpful.\n\nAdditional context:\n{text}",
      code: "Write code to handle the following: {value}\n\nLanguage: {codeLang}\n\nRequirements:\n{text}",
      custom: "{text}",
    },
  },
  audience: {
    label: "Target audience",
    placeholder: "e.g. beginners, experts, children, managers",
    templates: {
      write: "Target audience: {value}.\n",
      explain: "Target audience: {value}.\n",
    },
  },
  tone: {
    label: "Tone / style",
    placeholder: "e.g. professional, casual, persuasive, humorous",
    templates: {
      write: "Write in a {value} tone.\n",
    },
  },
  length: {
    label: "Approximate length",
    placeholder: "e.g. 200, 500, 1000",
    templates: {
      write: "Target length: ~{value} words.\n",
    },
  },
  codeLang: {
    label: "Programming language",
    placeholder: "e.g. Python, JavaScript, TypeScript, Rust",
    templates: {
      code: "Programming language: {value}.\n",
    },
  },
};

const TASK_TYPES: { id: TaskType; label: string; description: string }[] = [
  { id: "summarise", label: "Summarise", description: "Condense a text to key points" },
  { id: "write", label: "Write", description: "Create content on a topic" },
  { id: "analyse", label: "Analyse", description: "Examine and find patterns" },
  { id: "explain", label: "Explain", description: "Simplify a complex topic" },
  { id: "code", label: "Code", description: "Generate or explain code" },
  { id: "custom", label: "Custom", description: "Free-form prompt" },
];

export default function PromptGenerator() {
  const [task, setTask] = useState<TaskType>("write");
  const [fields, setFields] = useState<Record<string, string>>({});
  const [extra, setExtra] = useState("");
  const [output, setOutput] = useState("");
  const [copied, setCopied] = useState(false);

  function updateField(key: string, value: string) {
    setFields((prev) => ({ ...prev, [key]: value }));
  }

  const generate = useCallback(() => {
    const parts: string[] = [];

    // Role
    if (task === "code") parts.push("You are an expert software developer.");
    else if (task === "analyse") parts.push("You are an expert analyst with deep domain knowledge.");
    else if (task === "explain") parts.push("You are a patient teacher who explains things simply.");
    else if (task === "write") parts.push("You are a skilled writer.");

    // Task definition
    switch (task) {
      case "summarise":
        parts.push("Summarise the following text. Focus on the key points. Use clear, concise language.");
        break;
      case "write":
        parts.push("Write content based on the instructions below.");
        break;
      case "analyse":
        parts.push("Analyse the following and provide key insights, patterns and actionable takeaways.");
        break;
      case "explain":
        parts.push("Explain the following in simple terms. Include examples where helpful.");
        break;
      case "code":
        parts.push("Write code for the following task. Include comments and follow best practices.");
        break;
    }

    // Tone / audience / length
    if (task === "write" || task === "explain") {
      if (fields.tone) parts.push(`Tone: ${fields.tone}`);
      if (fields.audience) parts.push(`Target audience: ${fields.audience}`);
      if (fields.length) parts.push(`Approximate length: ${fields.length} words`);
    }
    if (task === "code" && fields.codeLang) parts.push(`Programming language: ${fields.codeLang}`);

    // Topic / subject
    if (fields.topic) parts.push(`\nTopic: ${fields.topic}`);

    // Extra text
    const text = extra.trim();
    if (text) {
      if (task === "summarise") parts.push(`\nText to summarise:\n${text}`);
      else if (task === "analyse") parts.push(`\nInput to analyse:\n${text}`);
      else if (task === "explain") parts.push(`\nTopic details:\n${text}`);
      else if (task === "code") parts.push(`\nRequirements:\n${text}`);
      else if (task === "write") parts.push(`\nAdditional context:\n${text}`);
      else parts.push(`\n${text}`);
    }

    // Formatting
    if (task !== "custom") {
      parts.push("\n---");
      parts.push("Please respond clearly and directly. Do not add disclaimers unless genuinely necessary.");
    }

    setOutput(parts.join("\n\n"));
  }, [task, fields, extra]);

  async function copy() {
    await navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  }

  return (
    <div>
      <div className="field">
        <label>What kind of prompt do you need?</label>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {TASK_TYPES.map((t) => (
            <button
              key={t.id}
              type="button"
              className={task === t.id ? "btn" : "btn secondary"}
              style={{ padding: "8px 14px", fontSize: ".85rem" }}
              onClick={() => setTask(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>
        <p style={{ color: "var(--muted)", fontSize: ".82rem", marginTop: 6 }}>
          {TASK_TYPES.find((t) => t.id === task)?.description}
        </p>
      </div>

      <div className="field">
        <label>Topic or subject</label>
        <input
          className="input"
          placeholder="e.g. climate change, React hooks, SEO best practices"
          value={fields.topic ?? ""}
          onChange={(e) => updateField("topic", e.target.value)}
        />
      </div>

      {(task === "write" || task === "explain") && (
        <div className="row">
          <div className="field">
            <label>Target audience</label>
            <input
              className="input"
              placeholder="e.g. beginners, experts, children"
              value={fields.audience ?? ""}
              onChange={(e) => updateField("audience", e.target.value)}
            />
          </div>
          <div className="field">
            <label>Tone / style</label>
            <input
              className="input"
              placeholder="e.g. professional, casual"
              value={fields.tone ?? ""}
              onChange={(e) => updateField("tone", e.target.value)}
            />
          </div>
          {task === "write" && (
            <div className="field">
              <label>Length (words)</label>
              <input
                className="input"
                type="number"
                placeholder="e.g. 500"
                value={fields.length ?? ""}
                onChange={(e) => updateField("length", e.target.value)}
              />
            </div>
          )}
        </div>
      )}

      {task === "code" && (
        <div className="field" style={{ maxWidth: 280 }}>
          <label>Programming language</label>
          <input
            className="input"
            placeholder="e.g. Python, JavaScript"
            value={fields.codeLang ?? ""}
            onChange={(e) => updateField("codeLang", e.target.value)}
          />
        </div>
      )}

      <div className="field">
        <label>{task === "summarise" ? "Text to summarise" : task === "analyse" ? "Input to analyse" : task === "explain" ? "Topic details" : task === "code" ? "Requirements" : task === "write" ? "Additional context" : "Details"}</label>
        <textarea
          value={extra}
          onChange={(e) => setExtra(e.target.value)}
          placeholder="Add any details, requirements or text here…"
          style={{ minHeight: 100 }}
        />
      </div>

      <button className="btn" onClick={generate}>
        🎯 Generate prompt
      </button>

      {output && (
        <div className="field" style={{ marginTop: 16 }}>
          <label>Your prompt — copy and paste into ChatGPT, Claude or Gemini</label>
          <textarea readOnly value={output} style={{ minHeight: 180, fontFamily: "var(--font-mono), monospace", fontSize: ".85rem" }} />
          <button className="btn" style={{ marginTop: 8 }} onClick={copy}>
            {copied ? "✓ Copied" : "Copy prompt"}
          </button>
        </div>
      )}

      <p className="privacy-note">🔒 Does not connect to any AI — only generates prompt text. Everything runs in your browser; no data is uploaded.</p>
    </div>
  );
}
