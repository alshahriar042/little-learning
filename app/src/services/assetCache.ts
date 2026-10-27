import { cacheNameForPath } from "@/lib/cacheNames";
import { isCrossOrigin } from "@/lib/assetUrl";
import { withRetry } from "@/lib/pool";

const pathOf = (url: string) => new URL(url, location.href).pathname;

async function cacheFor(url: string): Promise<Cache | null> {
  if (typeof caches === "undefined") return null;
  const name = cacheNameForPath(pathOf(url));
  return name ? caches.open(name) : null;
}

export async function isCached(url: string): Promise<boolean> {
  try { const c = await cacheFor(url); return !!c && !!(await c.match(url)); } catch { return false; }
}

/** Fetch an asset and store it in its per-module cache. Returns false if caching is unavailable. */
export async function fetchAndCache(url: string, signal?: AbortSignal): Promise<void> {
  const cache = await cacheFor(url);
  await withRetry(async () => {
    const res = await fetch(url, { signal, mode: isCrossOrigin() ? "cors" : "same-origin" });
    if (!res.ok) throw new Error(`${url}: HTTP ${res.status}`);
    await cache?.put(url, res);
  });
}

/** How many of `urls` are already cached (cheap: one cache.keys() per cache). */
export async function countCached(urls: string[]): Promise<number> {
  if (typeof caches === "undefined" || !urls.length) return 0;
  const sets = new Map<string, Set<string>>();
  let n = 0;
  for (const u of urls) {
    const name = cacheNameForPath(pathOf(u));
    if (!name) continue;
    if (!sets.has(name)) {
      const c = await caches.open(name);
      sets.set(name, new Set((await c.keys()).map((r) => r.url)));
    }
    if (sets.get(name)!.has(new URL(u, location.href).href)) n++;
  }
  return n;
}

export async function removeModuleCaches(moduleId: string): Promise<void> {
  if (typeof caches === "undefined") return;
  for (const name of await caches.keys()) if (name.startsWith(`${moduleId}-`)) await caches.delete(name);
}

export async function storageEstimate(): Promise<{ usage: number; quota: number } | null> {
  try { const e = await navigator.storage?.estimate?.(); return e ? { usage: e.usage ?? 0, quota: e.quota ?? 0 } : null; } catch { return null; }
}
export async function requestPersistence(): Promise<boolean> {
  try { return (await navigator.storage?.persist?.()) ?? false; } catch { return false; }
}
export const isPersisted = async () => { try { return (await navigator.storage?.persisted?.()) ?? false; } catch { return false; } };

export const formatBytes = (b: number) => (b >= 1e9 ? `${(b / 1e9).toFixed(1)} GB` : b >= 1e6 ? `${(b / 1e6).toFixed(1)} MB` : `${Math.max(1, Math.round(b / 1e3))} KB`);
