import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { TOOLS } from "@/lib/tools";
import { localizeTool } from "@/lib/i18n-content";
import { alternatesFor } from "@/lib/hreflang";
import { SITE_URL, SITE_NAME } from "@/lib/site";
import ToolsExplorer from "@/components/ToolsExplorer";
import JsonLd from "@/components/JsonLd";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "toolsIndex" });
  return {
    title: t("metaTitle"),
    description: t("metaDescription", { site: SITE_NAME }),
    alternates: alternatesFor("/tools", locale),
  };
}

export default async function AtoZPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations("toolsIndex");
  const tools = TOOLS.map((tool) => localizeTool(tool, locale));
  const liveCount = TOOLS.filter((tool) => tool.status === "live").length;

  // ItemList structured data — helps search engines understand the catalogue.
  const itemList = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `All ${SITE_NAME} tools`,
    numberOfItems: liveCount,
    itemListElement: TOOLS.filter((tool) => tool.status === "live").map((tool, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: tool.name,
      url: `${SITE_URL}/tools/${tool.slug}`,
    })),
  };

  return (
    <div className="container tool-page">
      <JsonLd data={itemList} />
      <div className="tool-head">
        <span className="eyebrow">{t("eyebrow")}</span>
        <h1>{t("title")}</h1>
        <p className="lede">{t("lede", { site: SITE_NAME, count: TOOLS.length })}</p>
      </div>

      <ToolsExplorer tools={tools} />
    </div>
  );
}
