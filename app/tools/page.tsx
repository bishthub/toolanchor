import type { Metadata } from "next";
import { TOOLS } from "@/lib/tools";
import { SITE_URL } from "@/lib/site";
import ToolsExplorer from "@/components/ToolsExplorer";
import JsonLd from "@/components/JsonLd";

export const metadata: Metadata = {
  title: "All Tools A-Z",
  description:
    "The complete A-Z directory of every free online tool on ToolHub — PDF, image, text, developer and calculator tools, all private and in-browser.",
  alternates: { canonical: "/tools" },
};

export default function AtoZPage() {
  // ItemList structured data — helps search engines understand the catalogue.
  const itemList = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "All ToolHub tools",
    numberOfItems: TOOLS.filter((t) => t.status === "live").length,
    itemListElement: TOOLS.filter((t) => t.status === "live").map((t, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: t.name,
      url: `${SITE_URL}/tools/${t.slug}`,
    })),
  };

  return (
    <div className="container tool-page">
      <JsonLd data={itemList} />
      <div className="tool-head">
        <span className="eyebrow">The full toolbox</span>
        <h1>All tools — A to Z</h1>
        <p className="lede">
          Every tool on ToolHub in one place — {TOOLS.length} and counting.
          Jump to a letter, scroll the lot, or filter instantly below.
        </p>
      </div>

      <ToolsExplorer />
    </div>
  );
}
