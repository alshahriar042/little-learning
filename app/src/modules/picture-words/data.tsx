import { useEffect, useState } from "react";
import { assetUrl } from "@/lib/assetUrl";
import { ItemsSchema, SectionsSchema, type AssetsFile, type Item, type Section } from "@/lib/schemas";
import { loadAssets, loadContentFile, loadManifest } from "@/services/content";
import { Img } from "@/ui/Img";

export const MODULE_ID = "picture-words";

export interface PWData { sections: Section[]; items: Item[]; assets: AssetsFile | null; bySection: Record<string, Item[]> }

let cache: Promise<PWData> | null = null;
export function loadPW(): Promise<PWData> {
  cache ??= (async () => {
    const manifest = await loadManifest(MODULE_ID);
    const [sections, items, assets] = await Promise.all([
      loadContentFile(MODULE_ID, "sections.json", SectionsSchema),
      loadContentFile(MODULE_ID, "items.json", ItemsSchema),
      loadAssets(MODULE_ID, manifest),
    ]);
    const bySection: Record<string, Item[]> = {};
    for (const it of items) (bySection[it.sectionId] ??= []).push(it);
    return { sections: [...sections].sort((a, b) => a.order - b.order), items, assets, bySection };
  })();
  cache.catch(() => { cache = null; });
  return cache;
}

export function usePW() {
  const [data, setData] = useState<PWData | null>(null);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let live = true;
    setError(false);
    loadPW().then((d) => live && setData(d)).catch(() => live && setError(true));
    return () => { live = false; };
  }, [attempt]);
  return { data, error, retry: () => setAttempt((a) => a + 1) };
}

export function imgInfo(item: Item, size: 480 | 960, assets: AssetsFile | null) {
  if (!item.image) return null;
  const rel = `img/${size}/${item.image.file}`;
  const a = assets?.assets[rel];
  return { src: assetUrl(MODULE_ID, rel, a?.v), color: a?.c ?? "#e5e7eb" };
}

/** The item's photo, or its emoji when it has none / cannot be loaded (e.g. offline and not downloaded). */
export function ItemPicture({ item, assets, size = 480, priority, className = "", fit = "cover", ratio }: {
  item: Item; assets: AssetsFile | null; size?: 480 | 960; priority?: boolean; className?: string; fit?: "cover" | "contain"; ratio?: [number, number];
}) {
  const info = imgInfo(item, size, assets);
  const [w, h] = ratio ?? (item.image ? [item.image.w, item.image.h] : [1, 1]);
  const emoji = <span aria-hidden>{item.emoji}</span>;
  if (!info) {
    return <div role="img" aria-label={item.en} className={`flex items-center justify-center bg-white/70 text-[min(22vw,6rem)] leading-none ${className}`} style={{ aspectRatio: `${w} / ${h}` }}>{emoji}</div>;
  }
  return <Img src={info.src} w={w} h={h} alt={item.en} color={info.color} priority={priority} className={className} fit={fit} fallback={emoji} />;
}
