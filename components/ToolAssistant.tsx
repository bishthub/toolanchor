"use client";

// ─────────────────────────────────────────────────────────────────────────
// Tool Assistant — a chat-style box. The user types what they want (and can
// attach a file); we match intent with lib/intent.ts (no AI) and render the
// matched tool inline, pre-loading the attachment when the tool supports it.
// ─────────────────────────────────────────────────────────────────────────

import { useRef, useState } from "react";
import Link from "next/link";
import { bestMatches, FILE_AUTOLOAD, type Match } from "@/lib/intent";
import { getCategory } from "@/lib/tools";
import ToolRunner from "@/components/tools/registry";

interface Turn {
  query: string;
  fileNames: string[];
  matches: Match[];
}

const EXAMPLES = [
  "I want to compress a PDF",
  "remove background from my photo",
  "merge these PDFs",
  "extract text from an image",
  "make a QR code",
  "resize image to 1080x1080",
];

// Scoped styles — all selectors are prefixed with .assistant so this never
// collides with the global stylesheet. Uses the site's design tokens.
const ASSISTANT_CSS = `
.assistant { max-width: 760px; margin: 0 auto; position: relative; z-index: 1; }
.assistant-bar {
  display: flex; align-items: center; gap: 8px;
  background: var(--bg-2, #12151f); border: 1px solid var(--border, #242b3d);
  border-radius: 999px; padding: 6px 6px 6px 14px; box-shadow: var(--shadow-sm, 0 1px 2px rgba(0,0,0,.4));
}
.assistant-bar:focus-within { border-color: var(--accent, #7c8cff); box-shadow: 0 0 0 3px var(--accent-soft, rgba(124,140,255,.14)); }
.assistant-attach {
  border: none; background: transparent; cursor: pointer; font-size: 1.15rem;
  width: 34px; height: 34px; border-radius: 50%; flex: none;
}
.assistant-attach:hover { background: var(--surface-2, #1a1f2e); }
.assistant-input {
  flex: 1; border: none; outline: none; background: transparent;
  color: var(--text, #eef1f8); font: inherit; font-size: 1rem; min-width: 0;
}
.assistant-files { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 10px; }
.assistant-chip {
  display: inline-flex; align-items: center; gap: 8px; font-size: .85rem;
  background: var(--surface-2, #1a1f2e); border: 1px solid var(--border, #242b3d);
  border-radius: 999px; padding: 5px 12px; color: var(--muted, #98a2ba);
}
.assistant-chip.mini { font-size: .78rem; padding: 2px 10px; }
.assistant-chip button { border: none; background: none; color: var(--muted); cursor: pointer; font-size: .9rem; }
.assistant-chip button:hover { color: var(--danger, #ff6b6b); }
.assistant-examples { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 16px; justify-content: center; }
.assistant-example {
  background: var(--bg-2, #12151f); border: 1px solid var(--border, #242b3d);
  border-radius: 999px; padding: 7px 14px; font-size: .85rem; color: var(--muted); cursor: pointer;
  transition: transform .25s cubic-bezier(.34,1.56,.64,1), border-color .15s, color .15s;
}
.assistant-example:hover { border-color: var(--accent); color: var(--text); transform: translateY(-2px); }
.assistant-result { margin-top: 20px; display: flex; flex-direction: column; gap: 12px; }
.assistant-msg { padding: 12px 16px; border-radius: 16px; line-height: 1.5; }
.assistant-msg.user {
  align-self: flex-end; background: var(--accent-soft, rgba(124,140,255,.14));
  display: flex; flex-wrap: wrap; gap: 8px; align-items: center; max-width: 90%;
}
.assistant-msg.bot { background: var(--bg-2, #12151f); border: 1px solid var(--border, #242b3d); }
.assistant-msg.bot p { margin: 0; }
.assistant-alts { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; margin-top: 10px; font-size: .85rem; color: var(--muted); }
.assistant-alt {
  background: var(--surface-2, #1a1f2e); border: 1px solid var(--border, #242b3d);
  border-radius: 999px; padding: 5px 12px; font-size: .82rem; color: var(--text); cursor: pointer;
}
.assistant-alt:hover, .assistant-alt.on { border-color: var(--cat, var(--accent)); color: var(--cat, var(--accent)); }
.assistant-tool {
  border: 1px solid var(--border, #242b3d); border-top: 3px solid var(--cat, var(--accent));
  border-radius: 18px; padding: 18px; background: var(--bg-2, #12151f);
  animation: rise .4s cubic-bezier(.22,.61,.36,1) both;
}
.assistant-tool-head { display: flex; align-items: center; margin-bottom: 14px; gap: 10px; }
`;

export default function ToolAssistant() {
  const [input, setInput] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [turn, setTurn] = useState<Turn | null>(null);
  const [active, setActive] = useState<{ slug: string; files: File[] } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  function submit(text?: string) {
    const query = (text ?? input).trim();
    if (!query && !files.length) return;
    const matches = bestMatches(query || files[0]?.name || "", files[0] ?? null);
    setTurn({ query: query || `(attached ${files.length} file${files.length > 1 ? "s" : ""})`, fileNames: files.map((f) => f.name), matches });
    if (matches.length) openTool(matches[0].tool.slug);
    setInput("");
  }

  function openTool(slug: string) {
    setActive({ slug, files: FILE_AUTOLOAD.has(slug) ? files : [] });
  }

  function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const picked = Array.from(e.target.files ?? []);
    if (picked.length) setFiles(picked);
  }

  const activeMatch = turn?.matches.find((m) => m.tool.slug === active?.slug);
  const autoloaded = active && FILE_AUTOLOAD.has(active.slug) && files.length > 0;

  return (
    <div className="assistant">
      <style>{ASSISTANT_CSS}</style>
      {/* Input bar */}
      <div className="assistant-bar">
        <button type="button" className="assistant-attach" onClick={() => fileRef.current?.click()} title="Attach a file" aria-label="Attach a file">📎</button>
        <input ref={fileRef} type="file" multiple hidden onChange={onPick} />
        <input
          className="assistant-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") submit(); }}
          placeholder="Tell us what you need — e.g. “compress this PDF”…"
          aria-label="Describe what you want to do"
        />
        <button type="button" className="btn" onClick={() => submit()}>Go</button>
      </div>

      {/* Attached file chips */}
      {files.length > 0 && (
        <div className="assistant-files">
          {files.map((f, i) => (
            <span key={i} className="assistant-chip">
              📄 {f.name}
              <button onClick={() => setFiles((prev) => prev.filter((_, j) => j !== i))} aria-label="Remove file">✕</button>
            </span>
          ))}
        </div>
      )}

      {/* Example prompts before first use */}
      {!turn && (
        <div className="assistant-examples">
          {EXAMPLES.map((ex) => (
            <button key={ex} type="button" className="assistant-example" onClick={() => submit(ex)}>{ex}</button>
          ))}
        </div>
      )}

      {/* Conversation result */}
      {turn && (
        <div className="assistant-result">
          <div className="assistant-msg user">
            <span>{turn.query}</span>
            {turn.fileNames.map((n) => <span key={n} className="assistant-chip mini">📄 {n}</span>)}
          </div>

          {turn.matches.length === 0 ? (
            <div className="assistant-msg bot">
              <p>Hmm, I couldn&apos;t match that to a tool. Try different words, or <Link href="/tools" style={{ color: "var(--accent)" }}>browse all tools A–Z</Link>.</p>
            </div>
          ) : (
            <div className="assistant-msg bot">
              <p>
                Sounds like you want <strong>{turn.matches[0].tool.name}</strong>
                {autoloaded ? " — I've loaded your file below 👇" : active && active.files.length === 0 && files.length > 0
                  ? " — open it below and drop your file in." : " — here it is 👇"}
              </p>
              {turn.matches.length > 1 && (
                <div className="assistant-alts">
                  <span>Or did you mean:</span>
                  {turn.matches.slice(1).map((m) => (
                    <button key={m.tool.slug} type="button" className={`assistant-alt ${active?.slug === m.tool.slug ? "on" : ""}`} onClick={() => openTool(m.tool.slug)}>
                      {getCategory(m.tool.category)?.emoji} {m.tool.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Inline tool */}
          {active && activeMatch && (
            <div className="assistant-tool" style={{ ["--cat" as string]: `var(--cat-${activeMatch.tool.category})` }}>
              <div className="assistant-tool-head">
                <strong>{activeMatch.tool.name}</strong>
                <Link href={`/tools/${active.slug}`} className="more" style={{ marginLeft: "auto" }}>Open full page →</Link>
              </div>
              <ToolRunner slug={active.slug} initialFiles={active.files} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
