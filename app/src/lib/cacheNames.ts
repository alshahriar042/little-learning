/** Shared by the service worker and the app: maps an asset URL to its per-module cache name. */
const RE = /\/([a-z0-9-]+)\/(img|audio)\//;

export function isModuleAssetPath(pathname: string): boolean {
  return RE.test(pathname);
}

/** e.g. /dev-assets/picture-words/img/480/x.webp -> "picture-words-img-v1" */
export function cacheNameForPath(pathname: string): string | null {
  const m = RE.exec(pathname);
  return m ? `${m[1]}-${m[2]}-v1` : null;
}

export const CONTENT_CACHE = "content-v1";
