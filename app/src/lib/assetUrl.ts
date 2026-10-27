import { ASSET_BASE, DEV_ASSET_PATH } from "@/config";

/** Full URL for a module asset, e.g. assetUrl("picture-words", "img/480/tiger.webp", "ab12cd34"). */
export function assetUrl(moduleId: string, rel: string, version?: string, base: string = ASSET_BASE): string {
  const root = base || DEV_ASSET_PATH;
  return `${root}/${moduleId}/${rel}${version ? `?v=${version}` : ""}`;
}

/** True when assets are served from another origin (R2): needs CORS + crossorigin attr. */
export const isCrossOrigin = (base: string = ASSET_BASE) => /^https?:\/\//.test(base);
