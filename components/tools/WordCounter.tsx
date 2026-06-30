"use client";

import { useMemo, useState } from "react";

export default function WordCounter() {
  const [text, setText] = useState("");

  const stats = useMemo(() => {
    const trimmed = text.trim();
    const words = trimmed ? trimmed.split(/\s+/).length : 0;
    const characters = text.length;
    const charsNoSpaces = text.replace(/\s/g, "").length;
    const sentences = trimmed ? (trimmed.match(/[.!?]+(\s|$)/g) || []).length || 1 : 0;
    const paragraphs = trimmed ? trimmed.split(/\n{2,}/).filter((p) => p.trim()).length : 0;
    const readingTime = Math.ceil(words / 200); // ~200 wpm
    return { words, characters, charsNoSpaces, sentences, paragraphs, readingTime };
  }, [text]);

  return (
    <div>
      <div className="field">
        <label htmlFor="wc">Paste or type your text</label>
        <textarea
          id="wc"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Start typing…"
        />
      </div>

      <div className="stats">
        <div className="stat"><div className="n">{stats.words}</div><div className="l">Words</div></div>
        <div className="stat"><div className="n">{stats.characters}</div><div className="l">Characters</div></div>
        <div className="stat"><div className="n">{stats.charsNoSpaces}</div><div className="l">No spaces</div></div>
        <div className="stat"><div className="n">{stats.sentences}</div><div className="l">Sentences</div></div>
        <div className="stat"><div className="n">{stats.paragraphs}</div><div className="l">Paragraphs</div></div>
        <div className="stat"><div className="n">{stats.readingTime}m</div><div className="l">Read time</div></div>
      </div>

      <p className="privacy-note">🔒 Your text never leaves this browser tab.</p>
    </div>
  );
}
