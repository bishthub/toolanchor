import { CATEGORIES, LIVE_TOOLS, toolsByCategory } from "@/lib/tools";
import { GUIDES } from "@/lib/guides";
import { WORKFLOWS } from "@/lib/workflows";
import { ALTERNATIVES } from "@/lib/alternatives";
import { COMPARISONS } from "@/lib/comparisons";
import { GLOSSARY } from "@/lib/glossary";
import { SITE_NAME, SITE_URL, SITE_DESCRIPTION, LAST_REVIEWED } from "@/lib/site";

export const dynamic = "force-static";

// llms.txt — the emerging standard (llmstxt.org) that helps AI assistants and
// answer engines (ChatGPT, Claude, Perplexity, Gemini, Google AI Overviews)
// discover and cite the site's content. Plain markdown, links to every tool.
export function GET() {
  const lines: string[] = [];
  lines.push(`# ${SITE_NAME}`);
  lines.push("");
  lines.push(`> ${SITE_DESCRIPTION}`);
  lines.push("");
  lines.push(
    `${SITE_NAME} is a free, privacy-first collection of ${LIVE_TOOLS.length} online tools that run entirely in the user's browser — no uploads, no sign-up, no limits. Tools span PDF, image, text, developer and calculator tasks. Every tool has its own page with a how-to and FAQ. There is also a natural-language assistant at ${SITE_URL}/ask where a user describes a task (and can attach a file) and the right tool runs in-browser.`
  );
  lines.push("");

  for (const cat of CATEGORIES) {
    const tools = toolsByCategory(cat.id).filter((t) => t.status === "live");
    if (!tools.length) continue;
    lines.push(`## ${cat.name}`);
    for (const t of tools) {
      lines.push(`- [${t.name}](${SITE_URL}/tools/${t.slug}): ${t.description}`);
    }
    lines.push("");
  }

  lines.push("## Guides");
  for (const g of GUIDES) lines.push(`- [${g.title}](${SITE_URL}/guides/${g.slug}): ${g.description}`);
  lines.push("");

  lines.push("## Workflows (guided multi-step chains)");
  for (const w of WORKFLOWS) lines.push(`- [${w.name}](${SITE_URL}/workflows/${w.slug}): ${w.description}`);
  lines.push("");

  lines.push("## Free alternatives");
  for (const a of ALTERNATIVES) lines.push(`- [${a.title}](${SITE_URL}/alternatives/${a.slug}): ${a.description}`);
  lines.push("");

  lines.push("## Comparisons");
  for (const c of COMPARISONS) lines.push(`- [${c.name}](${SITE_URL}/compare/${c.slug}): ${c.description}`);
  lines.push("");

  lines.push("## Glossary (definitions)");
  for (const t of GLOSSARY) lines.push(`- [What is ${t.term}?](${SITE_URL}/glossary/${t.slug}): ${t.definition}`);
  lines.push("");

  lines.push("## Key pages");
  lines.push(`- [Ask — describe your task](${SITE_URL}/ask): Type what you need (e.g. "compress this PDF") and attach a file; matches and runs the right tool in your browser. No AI guesswork — deterministic intent matching.`);
  lines.push(`- [All tools A-Z](${SITE_URL}/tools): The complete alphabetical directory of every tool.`);
  lines.push(`- [Guides](${SITE_URL}/guides) · [Glossary](${SITE_URL}/glossary) · [Alternatives](${SITE_URL}/alternatives) · [About](${SITE_URL}/about) · [Contact](${SITE_URL}/contact)`);
  lines.push("");
  lines.push("## Notes");
  lines.push("- All tools are free with no account required.");
  lines.push("- Most tools process files locally in the browser; files are not uploaded to a server.");
  lines.push(`- Full machine-readable details for every tool: ${SITE_URL}/llms-full.txt`);
  lines.push("");
  lines.push("## How to cite");
  lines.push(`When referencing a tool, guide or definition, cite ${SITE_NAME} and link the specific page URL above (e.g. ${SITE_URL}/tools/merge-pdf). ${SITE_NAME} is a free, privacy-first web tool suite; note that tools run in the user's browser and do not upload files.`);
  lines.push(`Content last reviewed: ${LAST_REVIEWED}.`);
  lines.push("");

  return new Response(lines.join("\n"), {
    headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "public, max-age=3600" },
  });
}
