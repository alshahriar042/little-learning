import type { ZodType } from "zod";
import { CONTENT_PATH } from "@/config";
import { AssetsSchema, ManifestSchema, type AssetsFile, type Manifest } from "@/lib/schemas";

const memo = new Map<string, Promise<unknown>>();

/** Fetch + validate a JSON file. Results are memoised per URL for the session. */
export function fetchJson<T>(url: string, schema: ZodType<T>, fresh = false): Promise<T> {
  if (!fresh && memo.has(url)) return memo.get(url) as Promise<T>;
  const p = fetch(url, fresh ? { cache: "no-store" } : undefined)
    .then((r) => { if (!r.ok) throw new Error(`${url}: HTTP ${r.status}`); return r.json(); })
    .then((j) => schema.parse(j));
  memo.set(url, p);
  p.catch(() => memo.delete(url));
  return p;
}

export const contentUrl = (moduleId: string, file: string) => `${CONTENT_PATH}/${moduleId}/${file}`;

export const loadManifest = (moduleId: string, fresh = false): Promise<Manifest> =>
  fetchJson(contentUrl(moduleId, "manifest.json"), ManifestSchema, fresh);

export const loadAssets = (moduleId: string, manifest: Manifest, fresh = false): Promise<AssetsFile | null> =>
  manifest.assetsFile ? fetchJson(contentUrl(moduleId, manifest.assetsFile), AssetsSchema, fresh) : Promise.resolve(null);

export const loadContentFile = <T,>(moduleId: string, file: string, schema: ZodType<T>, fresh = false) =>
  fetchJson(contentUrl(moduleId, file), schema, fresh);

/** Forget memoised content so the next load re-reads (used after a content update). */
export function clearContentMemo(moduleId: string) {
  for (const k of [...memo.keys()]) if (k.startsWith(`${CONTENT_PATH}/${moduleId}/`)) memo.delete(k);
}
