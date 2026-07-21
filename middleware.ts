import createMiddleware from "next-intl/middleware";
import { NextRequest, NextResponse } from "next/server";
import { routing } from "./i18n/routing";

const intlMiddleware = createMiddleware(routing);

// Cookie-based locale detection is disabled in routing (see i18n/routing.ts) so
// the cookie can't hijack bare English URLs during in-app navigation. Instead
// we "remember" the language only at the entry point: when a returning visitor
// lands on the bare root ("/") and their saved preference is a non-default
// locale, send them to that locale's home. Deep links and in-app navigation
// already carry the locale in the URL, so this is the one spot where the
// remembered preference needs to be applied.
export default function middleware(request: NextRequest) {
  if (request.nextUrl.pathname === "/") {
    const saved = request.cookies.get("NEXT_LOCALE")?.value;
    if (
      saved &&
      saved !== routing.defaultLocale &&
      (routing.locales as readonly string[]).includes(saved)
    ) {
      const url = request.nextUrl.clone();
      url.pathname = `/${saved}`;
      return NextResponse.redirect(url);
    }
  }
  return intlMiddleware(request);
}

export const config = {
  // Run on everything except API routes, Next internals, metadata-image routes
  // (/{locale}/opengraph-image must serve directly, not be locale-redirected),
  // and any path with a dot (static files + route handlers like /sitemap.xml,
  // /llms.txt, /robots.txt, /manifest.webmanifest, /sw.js, /indexnow-key.txt).
  matcher: ["/((?!api|_next|_vercel|.*opengraph-image|.*\\..*).*)"],
};
