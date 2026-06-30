import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

// AI / answer-engine crawlers we explicitly welcome (GEO/AEO). Listing them
// signals consent for AI training & retrieval, which improves the odds of
// being cited in ChatGPT, Claude, Perplexity, Gemini and Google AI Overviews.
const AI_BOTS = [
  "GPTBot", "OAI-SearchBot", "ChatGPT-User", "ClaudeBot", "Claude-Web",
  "anthropic-ai", "PerplexityBot", "Perplexity-User", "Google-Extended",
  "Applebot-Extended", "CCBot", "cohere-ai", "Amazonbot", "Meta-ExternalAgent",
  "Bytespider", "YouBot", "Diffbot", "Timpibot",
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: ["/api/"] },
      ...AI_BOTS.map((ua) => ({ userAgent: ua, allow: "/", disallow: ["/api/"] })),
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
