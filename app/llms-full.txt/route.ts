import { CATEGORIES, LIVE_TOOLS, toolsByCategory } from "@/lib/tools";
import { SITE_NAME, SITE_URL, SITE_DESCRIPTION } from "@/lib/site";

export const dynamic = "force-static";

// llms-full.txt — the expanded variant: full description, how-to steps and FAQs
// for every tool, so answer engines have rich, citable, factual context.
export function GET() {
  const out: string[] = [];
  out.push(`# ${SITE_NAME} — full tool reference`);
  out.push("");
  out.push(`> ${SITE_DESCRIPTION}`);
  out.push("");
  out.push(`Base URL: ${SITE_URL} · ${LIVE_TOOLS.length} free, in-browser tools.`);
  out.push("");

  for (const cat of CATEGORIES) {
    const tools = toolsByCategory(cat.id).filter((t) => t.status === "live");
    if (!tools.length) continue;
    out.push(`## ${cat.name}`);
    out.push("");
    for (const t of tools) {
      out.push(`### ${t.name}`);
      out.push(`URL: ${SITE_URL}/tools/${t.slug}`);
      out.push(t.intro);
      out.push("");
      out.push("How to use:");
      t.steps.forEach((s, i) => out.push(`${i + 1}. ${s}`));
      out.push("");
      out.push("FAQ:");
      for (const f of t.faqs) out.push(`- Q: ${f.q}\n  A: ${f.a}`);
      out.push("");
    }
  }

  return new Response(out.join("\n"), {
    headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "public, max-age=3600" },
  });
}
