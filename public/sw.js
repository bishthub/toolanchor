/* ToolAnchor service worker — offline-first for a fully client-side toolbox.
   Strategy:
   - Navigations (HTML): network-first, fall back to cache, then /offline.
     Every page you visit becomes available offline.
   - Static assets (/_next/static, fonts, images, scripts, styles):
     cache-first — immutable hashed files, safe to keep.
   Bump VERSION to invalidate all caches on deploy of breaking changes. */

const VERSION = "ta-v1";
const PAGES = `${VERSION}-pages`;
const ASSETS = `${VERSION}-assets`;
const PRECACHE_URLS = ["/", "/tools", "/offline"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(PAGES)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((k) => !k.startsWith(VERSION))
            .map((k) => caches.delete(k))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  // Never intercept API calls.
  if (url.pathname.startsWith("/api/")) return;

  // Page navigations: network-first so content stays fresh.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(PAGES).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(() =>
          caches
            .match(request)
            .then((hit) => hit || caches.match("/offline"))
        )
    );
    return;
  }

  // Hashed build assets + fonts + images: cache-first.
  const isAsset =
    url.pathname.startsWith("/_next/static/") ||
    ["style", "script", "font", "image", "worker"].includes(request.destination);
  if (isAsset) {
    event.respondWith(
      caches.match(request).then(
        (hit) =>
          hit ||
          fetch(request).then((response) => {
            if (response.ok) {
              const copy = response.clone();
              caches.open(ASSETS).then((cache) => cache.put(request, copy));
            }
            return response;
          })
      )
    );
  }
});
