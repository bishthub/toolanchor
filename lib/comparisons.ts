// ─────────────────────────────────────────────────────────────────────────
// Comparison pages — structured content for "X vs Y" search queries.
// Each comparison has tool-side-by-side attributes and a canonical table.
// These are statically generated, appear in the sitemap, and use
// ComparisonTable / HowTo / FAQPage structured data.
// ─────────────────────────────────────────────────────────────────────────

import { LAST_REVIEWED } from "./site";

export interface ComparisonRow {
  attribute: string;
  a: string;
  b: string;
  c?: string; // optional third column
  best?: "a" | "b" | "c"; // which column wins (or undefined = depends)
}

export interface Comparison {
  slug: string;
  name: string;                    // H1
  description: string;             // meta description
  answer: string;                  // AI-extractable quick answer
  intro: string;                   // lead paragraph
  altName?: string;                // secondary headline (e.g. "PNG vs JPEG vs WebP")
  cols: { label: string; toolSlug?: string }[];
  rows: ComparisonRow[];
  verdict: string;                 // closing verdict paragraph
  relatedToolSlugs?: string[];
  updated?: string;
}

const comparisons: Comparison[] = [
  {
    slug: "jpg-vs-png-vs-webp",
    name: "JPG vs PNG vs WebP — Which Image Format Should You Use?",
    altName: "JPEG, PNG and WebP Compared",
    description: "Compare JPG, PNG and WebP image formats: file size, quality, transparency, animation support and when to use each. Free guide with side-by-side comparison.",
    answer: "JPG is best for photographs (small files, no transparency), PNG is best for graphics with text or sharp edges (lossless, transparency), and WebP combines the strengths of both with 25–35% smaller files. For broadest compatibility use JPG; for web performance use WebP with a JPG fallback.",
    intro: "JPG, PNG and WebP are the three most common image formats on the web. Each has its own strengths — this comparison helps you pick the right one for every use case.",
    cols: [
      { label: "JPG / JPEG" },
      { label: "PNG" },
      { label: "WebP", toolSlug: "jpg-to-webp" },
    ],
    rows: [
      { attribute: "Compression", a: "Lossy", b: "Lossless", c: "Lossy & lossless", best: "c" },
      { attribute: "Transparency", a: "No", b: "Yes", c: "Yes", best: "c" },
      { attribute: "Animation", a: "No", b: "No", c: "Yes", best: "c" },
      { attribute: "File size (photo)", a: "Baseline", b: "2–5× larger", c: "25–35% smaller than JPG", best: "c" },
      { attribute: "File size (graphic)", a: "Poor (artifacts)", b: "Baseline", c: "60–80% smaller than PNG", best: "c" },
      { attribute: "Colour depth", a: "24-bit", b: "24/32-bit", c: "24/32-bit", best: "b" },
      { attribute: "Browser support", a: "Universal", b: "Universal", c: "97% of browsers", best: "a" },
      { attribute: "Best for", a: "Photos, camera images", b: "Logos, screenshots, text", c: "Web images, performance-critical sites", best: "c" },
      { attribute: "Metadata (EXIF)", a: "Yes", b: "Yes", c: "No native EXIF", best: "a" },
    ],
    verdict: "For maximum quality and compatibility, JPG remains the safest choice for photos and PNG for graphics. But if your audience uses modern browsers — and the 97%+ support rate suggests they do — WebP delivers significantly smaller files with the same quality, making pages load faster. The ideal setup: use WebP with a JPG or PNG fallback via the <picture> element.",
    relatedToolSlugs: ["jpg-to-png", "jpg-to-webp", "png-to-webp", "webp-to-jpg", "compress-image"],
  },
  {
    slug: "merge-vs-split-pdf",
    name: "Merge PDF vs Split PDF — Combine or Extract Pages?",
    description: "Compare merging PDFs (combine multiple files into one) versus splitting PDFs (extract pages into a new file). When to use each with free, private in-browser tools.",
    answer: "Use Merge PDF to combine several PDF files into one document (e.g. attaching receipts to a report). Use Split PDF to create a new PDF containing only specific pages from an existing document (e.g. extracting one page from a 50-page file). Both run entirely in your browser with no uploads.",
    intro: "Merge PDF and Split PDF are complementary operations — one combines documents, the other extracts pages. Here's when to reach for each.",
    cols: [
      { label: "Merge PDF", toolSlug: "merge-pdf" },
      { label: "Split PDF", toolSlug: "split-pdf" },
    ],
    rows: [
      { attribute: "What it does", a: "Combines multiple PDFs into one", b: "Extracts specific pages from one PDF", best: undefined },
      { attribute: "Input", a: "2 or more PDF files", b: "1 PDF file", best: undefined },
      { attribute: "Output", a: "A single combined PDF", b: "A new PDF with only selected pages", best: undefined },
      { attribute: "Page order control", a: "Reorder files before merging", b: "Enter page ranges (e.g. 1-3, 5)", best: undefined },
      { attribute: "Privacy", a: "In-browser, no upload", b: "In-browser, no upload", best: undefined },
      { attribute: "Typical use case", a: "Attaching documents together", b: "Extracting a chapter or form from a larger file", best: undefined },
    ],
    verdict: "Both tools complement each other. Merge when you need everything in one file; Split when you only need part of a file. Both are free, private, and run entirely in your browser — no sign-up required.",
    relatedToolSlugs: ["organize-pdf", "rotate-pdf", "compress-pdf"],
  },
];

export const COMPARISONS = comparisons;

export function getComparison(slug: string): Comparison | undefined {
  return comparisons.find((c) => c.slug === slug);
}

export function comparisonUpdated(c: Comparison): string {
  return c.updated ?? LAST_REVIEWED;
}
