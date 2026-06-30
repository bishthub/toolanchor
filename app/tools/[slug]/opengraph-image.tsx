import { ImageResponse } from "next/og";
import { getTool, getCategory, LIVE_TOOLS } from "@/lib/tools";
import { SITE_NAME } from "@/lib/site";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export function generateStaticParams() {
  return LIVE_TOOLS.map((t) => ({ slug: t.slug }));
}

// ASCII only — no emoji/glyphs (Satori can't fetch their fonts offline).
export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const tool = getTool(slug);
  const cat = tool ? getCategory(tool.category) : undefined;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%", height: "100%", display: "flex", flexDirection: "column",
          justifyContent: "space-between", padding: 80, color: "#eef1f8",
          background: "linear-gradient(135deg,#0a0c12 0%,#141a2e 100%)",
        }}
      >
        <div style={{ display: "flex", fontSize: 30, color: "#98a2ba", textTransform: "uppercase", letterSpacing: 2 }}>
          {cat?.name ?? "Tools"}
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", fontSize: 76, fontWeight: 800, lineHeight: 1.05, letterSpacing: -1.5, maxWidth: 1040 }}>
            {tool?.name ?? SITE_NAME}
          </div>
          <div style={{ display: "flex", fontSize: 30, color: "#98a2ba", marginTop: 24, maxWidth: 1040 }}>
            {(tool?.description ?? "Free online tools").slice(0, 115)}
          </div>
        </div>
        <div style={{ display: "flex", fontSize: 28, fontWeight: 700, color: "#7c8cff" }}>
          {SITE_NAME} — Free, in-browser, no sign-up
        </div>
      </div>
    ),
    size
  );
}
