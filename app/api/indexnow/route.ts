import { NextRequest, NextResponse } from "next/server";
import { SITE_URL } from "@/lib/site";
import { LIVE_TOOLS, CATEGORIES } from "@/lib/tools";

export const runtime = "nodejs";

function allSiteUrls(): string[] {
  const urls = [
    "", "/tools", "/ask", "/guides", "/alternatives", "/about", "/contact", "/privacy", "/terms",
    ...CATEGORIES.map((c) => `/category/${c.id}`),
    ...LIVE_TOOLS.map((t) => `/tools/${t.slug}`),
  ];
  return urls.map((u) => `${SITE_URL}${u}`);
}

// POST /api/indexnow?key=YOUR_KEY  → pings IndexNow (Bing, Yandex, etc.) so new
// or changed pages get crawled within minutes. Body: {urls?: string[]}.
export async function POST(req: NextRequest) {
  const key = process.env.INDEXNOW_KEY;
  if (!key) return NextResponse.json({ error: "IndexNow is not configured (set INDEXNOW_KEY)." }, { status: 501 });
  if (new URL(req.url).searchParams.get("key") !== key) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let urls: string[] = [];
  try {
    const body = await req.json();
    if (Array.isArray(body?.urls)) urls = body.urls;
  } catch { /* no body → submit everything */ }
  if (!urls.length) urls = allSiteUrls();

  try {
    const res = await fetch("https://api.indexnow.org/indexnow", {
      method: "POST",
      headers: { "content-type": "application/json; charset=utf-8" },
      body: JSON.stringify({
        host: new URL(SITE_URL).host,
        key,
        keyLocation: `${SITE_URL}/indexnow-key.txt`,
        urlList: urls,
      }),
    });
    return NextResponse.json({ submitted: urls.length, indexnow_status: res.status });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Submission failed" }, { status: 502 });
  }
}
