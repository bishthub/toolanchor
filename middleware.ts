import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

export default createMiddleware(routing);

export const config = {
  // Run on everything except API routes, Next internals, and any path with a
  // dot (static files + route handlers like /sitemap.xml, /llms.txt, /robots.txt,
  // /manifest.webmanifest, /sw.js, /indexnow-key.txt).
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
