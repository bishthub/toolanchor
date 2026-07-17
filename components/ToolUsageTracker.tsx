"use client";

// Records a visit to this tool in local recents and fires a per-tool
// analytics event (clean slug, so locale/preset URL variants aggregate).
// Renders nothing.

import { useEffect } from "react";
import { addRecent } from "@/lib/usage";
import { trackEvent } from "@/lib/track";

export default function ToolUsageTracker({ slug, preset }: { slug: string; preset?: string }) {
  useEffect(() => {
    addRecent(slug);
    trackEvent("tool_view", { tool: slug, ...(preset ? { preset } : {}) });
  }, [slug, preset]);
  return null;
}
