/// <reference lib="webworker" />
import { cleanupOutdatedCaches, createHandlerBoundToURL, precacheAndRoute } from "workbox-precaching";
import { NavigationRoute, registerRoute } from "workbox-routing";
import { CacheFirst, NetworkFirst } from "workbox-strategies";
import { ExpirationPlugin } from "workbox-expiration";
import { CacheableResponsePlugin } from "workbox-cacheable-response";
import { RangeRequestsPlugin } from "workbox-range-requests";
import { CONTENT_CACHE, cacheNameForPath, isModuleAssetPath } from "./lib/cacheNames";

declare const self: ServiceWorkerGlobalScope;

// 1. App shell (JS, CSS, fonts, icons, html). Content JSON + module assets are NOT precached (see below).
precacheAndRoute(self.__WB_MANIFEST);
cleanupOutdatedCaches();

// 2. Module images/audio (R2 or /dev-assets): CacheFirst in one cache per module+kind (e.g. "picture-words-img-v1").
//    Status 0 covers opaque cross-origin responses; the R2 bucket should still send Access-Control-Allow-Origin: *.
const strategies = new Map<string, CacheFirst>();
function strategyFor(cacheName: string) {
  let s = strategies.get(cacheName);
  if (!s) {
    s = new CacheFirst({
      cacheName,
      plugins: [
        new CacheableResponsePlugin({ statuses: [0, 200] }),
        new RangeRequestsPlugin(), // <audio> asks for byte ranges; answer them from the cached full file (offline playback / seeking)
        new ExpirationPlugin({ maxEntries: 2000 }), // no maxAge: downloaded packs must never expire
      ],
    });
    strategies.set(cacheName, s);
  }
  return s;
}
registerRoute(
  ({ url, request }) => request.method === "GET" && isModuleAssetPath(url.pathname),
  ({ url, request, event }) => strategyFor(cacheNameForPath(url.pathname)!).handle({ request, event }),
);

// 3. Versioned content JSON: network first (updates without an app release), falls back to cache offline.
registerRoute(
  ({ url }) => url.origin === self.location.origin && url.pathname.startsWith("/content/"),
  new NetworkFirst({ cacheName: CONTENT_CACHE, networkTimeoutSeconds: 3, plugins: [new CacheableResponsePlugin({ statuses: [200] })] }),
);

// 4. SPA navigation fallback: always serve the cached shell, so the browser error page is never shown offline.
registerRoute(new NavigationRoute(createHandlerBoundToURL("/index.html"), { denylist: [/^\/content\//, /^\/dev-assets\//] }));

self.addEventListener("message", (e) => { if (e.data?.type === "SKIP_WAITING") void self.skipWaiting(); });
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));
