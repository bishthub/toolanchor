"use client";

import { useState, useMemo } from "react";

const TOPIC_POOL = [
  { word: "love", tags: ["love", "romance", "relationship", "heart"] },
  { word: "happy", tags: ["joy", "happiness", "positive", "celebration"] },
  { word: "sad", tags: ["sadness", "emotion", "feeling"] },
  { word: "beautiful", tags: ["beauty", "nature", "art", "photography"] },
  { word: "travel", tags: ["travel", "adventure", "explore", "wanderlust", "vacation"] },
  { word: "food", tags: ["food", "cooking", "recipe", "delicious", "yummy"] },
  { word: "fitness", tags: ["fitness", "workout", "health", "exercise"] },
  { word: "business", tags: ["business", "entrepreneur", "startup", "marketing"] },
  { word: "tech", tags: ["technology", "tech", "innovation", "coding"] },
  { word: "art", tags: ["art", "creative", "design", "artist"] },
  { word: "music", tags: ["music", "song", "band", "concert"] },
  { word: "photo", tags: ["photography", "photo", "picture", "image"] },
  { word: "nature", tags: ["nature", "outdoor", "landscape", "environment"] },
  { word: "fashion", tags: ["fashion", "style", "outfit", "trendy"] },
  { word: "family", tags: ["family", "parenting", "mom", "dad"] },
  { word: "friends", tags: ["friendship", "friends", "social"] },
  { word: "success", tags: ["success", "motivation", "goals", "achievement"] },
  { word: "learning", tags: ["education", "learning", "study", "knowledge"] },
  { word: "money", tags: ["money", "finance", "investing", "wealth"] },
  { word: "health", tags: ["health", "wellness", "mentalhealth", "selfcare"] },
];

const BROAD_TAGS = [
  "trending", "viral", "instagood", "photooftheday", "explore", "reels",
  "explorepage", "contentcreator", "influencer", "daily",
];

const MEDIUM_TAGS: Record<string, string[]> = {
  travel: ["travelgram", "travelphotography", "adventuretime", "vacationmode", "wanderer", "traveladdict", "travellife", "exploring"],
  food: ["foodie", "foodphotography", "instafood", "foodstagram", "delicious", "homemade", "foodblogger", "tasty"],
  fitness: ["gym", "workoutmotivation", "fitlife", "healthylifestyle", "fitfam", "exercise", "bodybuilding"],
  fashion: ["fashionblogger", "styleinspo", "outfitideas", "fashionstyle", "streetstyle", "ootd", "trendingstyle"],
  photography: ["photographylovers", "photoshoot", "pictureperfect", "capturethemoment", "lensculture"],
  business: ["entrepreneurlife", "businessowner", "startuplife", "successmindset", "marketingtips", "growthhacking"],
  tech: ["techie", "programming", "developer", "codinglife", "technews", "innovation", "futuretech"],
  music: ["musician", "musiclover", "singer", "bands", "livemusic", "newmusic", "songwriter"],
  art: ["artwork", "digitalart", "artistsofinstagram", "creativeart", "modernart", "instaart"],
  nature: ["naturelovers", "naturephotography", "earthpix", "landscapephotography", "wildlife", "sunsetlovers"],
  wellness: ["mentalhealthmatters", "selfcare", "mindfulness", "wellnessjourney", "healing", "positivemind"],
};

const NICHE_TAGS = [
  "doyoueven", "nofilter", "justgoshoot", "liveauthentic", "theglobewanderer",
  "passionpassport", "roamtheplanet", "beautifuldestinations", "discoverearth",
  "createcommune", "createexplore", "folkcreative", "makersgonnamake",
  "handmadefont", "typetopia", "designdaily", "dailyux", "codecademy",
];

function generateTags(text: string, platform: string): string[] {
  const words = text.toLowerCase().match(/[a-z]+(?:'[a-z]+)?/g) || [];
  const tags = new Set<string>();

  // Find matching topics
  for (const w of words) {
    for (const topic of TOPIC_POOL) {
      if (topic.tags.some(t => w.includes(t) || t.includes(w))) {
        for (const tag of topic.tags) {
          if (topic.word === "love" && w === "love") tags.add("love");
          tags.add(tag);
        }
        // Add platform-specific medium tags
        const medium = MEDIUM_TAGS[topic.word];
        if (medium) medium.slice(0, 4).forEach(t => tags.add(t));
      }
    }
  }

  // Add broad tags
  BROAD_TAGS.slice(0, platform === "instagram" ? 6 : 3).forEach(t => tags.add(t));

  // Add niche tags
  NICHE_TAGS.slice(0, platform === "instagram" ? 6 : 3).forEach(t => tags.add(t));

  // Filter by platform
  if (platform === "linkedin") {
    return [...tags].filter(t => !["reels", "explorepage", "photooftheday"].includes(t)).slice(0, 15);
  }
  if (platform === "twitter") {
    return [...tags].filter(t => t.length < 20).slice(0, 10);
  }
  if (platform === "tiktok") {
    return [...tags].filter(t => !["photography"].includes(t)).slice(0, 20);
  }

  return [...tags].slice(0, 30);
}

export default function HashtagGenerator() {
  const [text, setText] = useState("");
  const [platform, setPlatform] = useState("instagram");
  const [copied, setCopied] = useState(false);

  const tags = useMemo(() => generateTags(text, platform), [text, platform]);

  function copyAll() {
    const tagString = tags.map(t => `#${t}`).join(" ");
    navigator.clipboard.writeText(tagString);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  }

  return (
    <div>
      <div className="field">
        <label>Your caption or topic</label>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Describe your post, paste your caption, or type a topic…"
          style={{ minHeight: 100 }}
        />
      </div>

      <div className="row">
        <div className="field" style={{ maxWidth: 200 }}>
          <label>Platform</label>
          <select className="input" value={platform} onChange={(e) => setPlatform(e.target.value)}>
            <option value="instagram">Instagram</option>
            <option value="tiktok">TikTok</option>
            <option value="twitter">Twitter / X</option>
            <option value="linkedin">LinkedIn</option>
          </select>
        </div>
      </div>

      {tags.length > 0 && (
        <div className="field">
          <label>Suggested hashtags</label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {tags.map((tag, i) => (
              <span key={i} style={{
                padding: "4px 10px", borderRadius: 7, fontSize: ".84rem",
                background: "color-mix(in srgb, var(--accent) 8%, transparent)",
                border: "1px solid color-mix(in srgb, var(--accent) 25%, var(--border))",
                color: "var(--text)",
              }}>
                #{tag}
              </span>
            ))}
          </div>
          <button className="btn" style={{ marginTop: 12 }} onClick={copyAll}>
            {copied ? "✓ Copied" : "Copy all hashtags"}
          </button>
          <p style={{ color: "var(--muted)", fontSize: ".82rem", marginTop: 4 }}>
            {tags.length} hashtags
          </p>
        </div>
      )}

      <p className="privacy-note">🔒 Runs in your browser — no data is uploaded. Generate relevant hashtags from your content locally.</p>
    </div>
  );
}
