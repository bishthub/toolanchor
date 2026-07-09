"use client";

import { useState } from "react";

const EMOJI_MAP: [string, string[]][] = [
  ["😀", ["happy", "joy", "cheerful", "delighted", "grin", "smile"]],
  ["😂", ["laugh", "funny", "hilarious", "lol", "haha", "joke"]],
  ["🥹", ["emotional", "touched", "cry", "tears"]],
  ["😢", ["sad", "cry", "tear", "unhappy", "sorrow"]],
  ["😍", ["love", "adore", "crush", "beautiful", "gorgeous"]],
  ["😊", ["nice", "kind", "warm", "gentle", "happy"]],
  ["🤔", ["think", "wonder", "curious", "hmm", "confused"]],
  ["😮", ["wow", "surprise", "shock", "amazing", "astonished"]],
  ["😎", ["cool", "awesome", "slick", "stylish", "smooth"]],
  ["🥳", ["celebrate", "party", "birthday", "festive"]],
  ["😴", ["sleep", "tired", "bored", "yawn"]],
  ["😡", ["angry", "mad", "furious", "rage", "annoyed"]],
  ["🥰", ["love", "romance", "sweet", "affection"]],
  ["🤩", ["amazing", "fantastic", "star", "brilliant"]],
  ["😱", ["shock", "horror", "scared", "terrified"]],
  ["🙏", ["please", "thank", "grateful", "pray"]],
  ["💪", ["strong", "power", "workout", "muscle"]],
  ["🔥", ["hot", "fire", "amazing", "lit", "sizzling"]],
  ["✨", ["magic", "sparkle", "shiny", "beautiful"]],
  ["🌟", ["star", "shine", "brilliant", "talent"]],
  ["❤️", ["love", "heart", "passion"]],
  ["💯", ["perfect", "hundred", "score", "complete"]],
  ["🎉", ["party", "celebrate", "confetti"]],
  ["🏆", ["win", "champion", "trophy", "victory"]],
  ["🚀", ["rocket", "launch", "space", "fast", "growth"]],
  ["💡", ["idea", "lightbulb", "bright", "innovation"]],
  ["📚", ["book", "study", "learn", "education", "reading"]],
  ["🎵", ["music", "song", "melody", "tune"]],
  ["🎨", ["art", "painting", "creative", "design"]],
  ["🌍", ["world", "global", "earth", "planet"]],
  ["🌈", ["rainbow", "colorful", "hope"]],
  ["⭐", ["star", "favorite", "excellent"]],
  ["💰", ["money", "rich", "wealth", "cash"]],
  ["🎯", ["goal", "target", "bullseye", "focus"]],
  ["💻", ["computer", "laptop", "coding", "tech"]],
  ["📱", ["phone", "mobile", "smartphone"]],
  ["☕", ["coffee", "tea", "cafe"]],
  ["🍕", ["pizza", "food", "delicious"]],
  ["🌮", ["taco", "mexican"]],
  ["🍔", ["burger", "hamburger"]],
  ["🏖️", ["beach", "vacation", "tropical"]],
  ["✈️", ["flight", "travel", "airplane", "trip"]],
  ["🗽", ["new york", "nyc", "statue"]],
  ["🎬", ["movie", "film", "cinema", "hollywood"]],
  ["📸", ["photo", "camera", "photography"]],
  ["🔧", ["fix", "repair", "tool", "maintenance"]],
  ["🧠", ["brain", "smart", "intelligence"]],
  ["👀", ["look", "see", "watch", "peek"]],
  ["🤝", ["handshake", "deal", "agreement", "partnership"]],
  ["✅", ["done", "complete", "check", "approve"]],
  ["❌", ["wrong", "error", "cancel", "no"]],
  ["⚠️", ["warning", "caution", "careful"]],
  ["🔴", ["live", "red", "recording"]],
  ["🟢", ["green", "go", "online"]],
  ["🔵", ["blue", "water"]],
  ["💬", ["chat", "message", "talk", "conversation"]],
  ["📝", ["note", "write", "document", "memo"]],
  ["🗓️", ["calendar", "schedule", "date"]],
  ["⏰", ["clock", "time", "alarm"]],
  ["🎁", ["gift", "present", "surprise"]],
  ["👑", ["king", "queen", "royal", "crown"]],
  ["🏅", ["medal", "achievement", "award"]],
  ["🧘", ["yoga", "meditation", "relax"]],
  ["🏃", ["run", "sprint", "race"]],
  ["🍀", ["luck", "clover", "irish"]],
  ["🎄", ["christmas", "xmas", "holiday"]],
  ["🎂", ["birthday", "cake", "celebration"]],
  ["👋", ["hello", "hi", "wave", "bye", "goodbye"]],
  ["🙌", ["hooray", "yes", "celebrate", "praise"]],
  ["👏", ["clap", "applause", "congratulations"]],
  ["💕", ["love", "affection", "sweet"]],
  ["🫶", ["support", "help", "care", "love"]],
];

function textToEmoji(text: string): string {
  let result = text;
  for (const [emoji, words] of EMOJI_MAP) {
    // Replace whole words only
    for (const word of words) {
      const regex = new RegExp(`\\b${word}\\b`, "gi");
      result = result.replace(regex, (match) => {
        // Only replace if it's the exact word, not inside a larger word
        return `${emoji}`;
      });
    }
  }
  return result;
}

const REVERSE_MAP = new Map<string, string>();
for (const [emoji, words] of EMOJI_MAP) {
  REVERSE_MAP.set(emoji, words[0]);
}

function emojiToText(text: string): string {
  let result = text;
  for (const [emoji, desc] of REVERSE_MAP) {
    result = result.replaceAll(emoji, `:${desc}:`);
  }
  return result;
}

type Mode = "to-emoji" | "from-emoji";

export default function EmojiTranslator() {
  const [input, setInput] = useState("");
  const [mode, setMode] = useState<Mode>("to-emoji");
  const [copied, setCopied] = useState(false);

  const output = mode === "to-emoji" ? textToEmoji(input) : emojiToText(input);

  async function copy() {
    await navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  }

  return (
    <div>
      <div className="field">
        <label>Mode</label>
        <div style={{ display: "flex", gap: 6 }}>
          <button type="button" className={mode === "to-emoji" ? "btn" : "btn secondary"} style={{ padding: "8px 14px", fontSize: ".85rem" }} onClick={() => setMode("to-emoji")}>
            Text → Emoji
          </button>
          <button type="button" className={mode === "from-emoji" ? "btn" : "btn secondary"} style={{ padding: "8px 14px", fontSize: ".85rem" }} onClick={() => setMode("from-emoji")}>
            Emoji → Text
          </button>
        </div>
      </div>

      <div className="field">
        <label>{mode === "to-emoji" ? "Text input" : "Emoji input"}</label>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={mode === "to-emoji" ? "Type something like 'I am so happy today!'" : "Paste emoji like 'I am so 😀 today!'"}
          style={{ minHeight: 100 }}
        />
      </div>

      {input && (
        <div className="field">
          <label>Result</label>
          <textarea
            readOnly
            value={output}
            style={{ minHeight: 100, fontSize: mode === "to-emoji" ? "1.3rem" : ".95rem", lineHeight: 1.7 }}
          />
          <button className="btn" style={{ marginTop: 8 }} onClick={copy}>
            {copied ? "✓ Copied" : "Copy result"}
          </button>
        </div>
      )}

      <p className="privacy-note">🔒 Runs entirely in your browser — nothing is uploaded. Uses a dictionary of 70+ emoji with 200+ word mappings.</p>
    </div>
  );
}
