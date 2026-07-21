// Resolves localized content by overlaying per-locale prose on the structural
// registries in lib/tools.ts. Missing tool/field/locale → English fallback, so
// we can ship locale-by-locale and tool-by-tool without breaking anything.

import { getTool, getCategory, type Tool, type Category, type CategoryId } from "@/lib/tools";
import { ES_TOOLS } from "@/content/es/tools";
import { ES_CATEGORIES } from "@/content/es/categories";
import { PT_TOOLS } from "@/content/pt/tools";
import { PT_CATEGORIES } from "@/content/pt/categories";
import { HI_TOOLS } from "@/content/hi/tools";
import { HI_CATEGORIES } from "@/content/hi/categories";

const TOOL_OVERRIDES: Record<string, Record<string, Partial<Tool>>> = { es: ES_TOOLS, pt: PT_TOOLS, hi: HI_TOOLS };
const CATEGORY_OVERRIDES: Record<string, Partial<Record<CategoryId, Partial<Category>>>> = { es: ES_CATEGORIES, pt: PT_CATEGORIES, hi: HI_CATEGORIES };

export function localizeTool(tool: Tool, locale: string): Tool {
  const o = TOOL_OVERRIDES[locale]?.[tool.slug];
  return o ? { ...tool, ...o } : tool;
}

export function getLocalizedTool(slug: string, locale: string): Tool | undefined {
  const t = getTool(slug);
  return t ? localizeTool(t, locale) : undefined;
}

export function localizeCategory(cat: Category, locale: string): Category {
  const o = CATEGORY_OVERRIDES[locale]?.[cat.id];
  return o ? { ...cat, ...o } : cat;
}

export function getLocalizedCategory(id: CategoryId, locale: string): Category | undefined {
  const c = getCategory(id);
  return c ? localizeCategory(c, locale) : undefined;
}
