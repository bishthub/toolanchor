import type { MetadataRoute } from "next";
import { SITE_NAME, SITE_DESCRIPTION } from "@/lib/site";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: `${SITE_NAME} — Free online tools`,
    short_name: SITE_NAME,
    description: SITE_DESCRIPTION,
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#fafafa",
    theme_color: "#fafafa",
    categories: ["utilities", "productivity"],
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml" },
      { src: "/apple-icon", sizes: "180x180", type: "image/png" },
    ],
    shortcuts: [
      { name: "All tools A–Z", url: "/tools" },
      { name: "Merge PDF", url: "/tools/merge-pdf" },
      { name: "Compress image", url: "/tools/compress-image" },
      { name: "Resize image", url: "/tools/resize-image" },
    ],
  };
}
