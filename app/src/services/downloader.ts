import { create } from "zustand";
import { assetUrl } from "@/lib/assetUrl";
import { runPool } from "@/lib/pool";
import { clearContentMemo, loadAssets, loadManifest } from "./content";
import { countCached, fetchAndCache, isCached, removeModuleCaches } from "./assetCache";
import { emit } from "./events";
import { useDownloads } from "@/store/downloads";

export type JobStatus = "running" | "done" | "error" | "cancelled";
export interface Job { done: number; total: number; status: JobStatus; error?: string }

interface JobsState { jobs: Record<string, Job>; patch: (key: string, j: Partial<Job>) => void; clear: (key: string) => void }
export const useJobs = create<JobsState>((set, get) => ({
  jobs: {},
  patch: (key, j) => set({ jobs: { ...get().jobs, [key]: { ...({ done: 0, total: 0, status: "running" } as Job), ...get().jobs[key], ...j } } }),
  clear: (key) => { const { [key]: _drop, ...rest } = get().jobs; void _drop; set({ jobs: rest }); },
}));

const controllers = new Map<string, AbortController>();
export const packKey = (moduleId: string, packId: string) => `${moduleId}:${packId}`;
export const CONCURRENCY = 6;

export interface PackAssets { urls: string[]; bytes: number }

/** Resolve all asset URLs (with cache-busting version) of the given packs of a module. */
export async function resolvePackAssets(moduleId: string, packIds?: string[]): Promise<PackAssets> {
  const manifest = await loadManifest(moduleId);
  const assets = await loadAssets(moduleId, manifest);
  if (!assets) return { urls: [], bytes: 0 };
  const ids = packIds ?? Object.keys(assets.packs);
  const keys = [...new Set(ids.flatMap((id) => assets.packs[id] ?? []))];
  return {
    urls: keys.map((k) => assetUrl(moduleId, k, assets.assets[k].v)),
    bytes: keys.reduce((a, k) => a + assets.assets[k].b, 0),
  };
}

/** Download (resumable: already-cached files are skipped) every asset of a pack, or of the whole module when packId is "*". */
export async function downloadPack(moduleId: string, packId: string | "*"): Promise<void> {
  const key = packKey(moduleId, packId);
  if (controllers.has(key)) return;
  const ctl = new AbortController();
  controllers.set(key, ctl);
  const { patch } = useJobs.getState();
  try {
    const manifest = await loadManifest(moduleId);
    const ids = packId === "*" ? manifest.packs.map((p) => p.id) : [packId];
    const { urls, bytes } = await resolvePackAssets(moduleId, ids);
    patch(key, { done: 0, total: urls.length, status: "running", error: undefined });
    let done = 0, failed = 0;
    await runPool(urls, CONCURRENCY, async (u) => {
      try { if (!(await isCached(u))) await fetchAndCache(u, ctl.signal); } catch (e) { if (!ctl.signal.aborted) failed++; void e; }
      patch(key, { done: ++done });
    }, ctl.signal);
    if (ctl.signal.aborted) { patch(key, { status: "cancelled" }); return; }
    if (failed) { patch(key, { status: "error", error: `${failed} files failed` }); return; }
    const rec = { count: urls.length, bytes, at: Date.now() };
    const state = useDownloads.getState();
    for (const id of ids) {
      const p = manifest.packs.find((x) => x.id === id);
      const assets = await resolvePackAssets(moduleId, [id]);
      state.record(packKey(moduleId, id), { ...rec, count: assets.urls.length, bytes: assets.bytes || (p?.bytes ?? 0) });
      emit("download:done", { moduleId, packId: id });
    }
    state.setVersion(moduleId, manifest.version);
    patch(key, { status: "done" });
  } catch (e) {
    patch(key, { status: "error", error: e instanceof Error ? e.message : String(e) });
  } finally {
    controllers.delete(key);
  }
}

export function cancelDownload(moduleId: string, packId: string | "*") { controllers.get(packKey(moduleId, packId))?.abort(); }

export async function removeDownloads(moduleId?: string) {
  if (moduleId) { await removeModuleCaches(moduleId); useDownloads.getState().drop(`${moduleId}:`); }
  else {
    const { packs } = useDownloads.getState();
    for (const m of new Set(Object.keys(packs).map((k) => k.split(":")[0]))) await removeModuleCaches(m);
    useDownloads.getState().drop();
  }
}

/** Packs recorded as downloaded whose files are no longer all in the cache (e.g. iOS storage eviction). */
export async function findEvictedPacks(): Promise<string[]> {
  const { packs } = useDownloads.getState();
  const evicted: string[] = [];
  for (const key of Object.keys(packs)) {
    const [moduleId, packId] = key.split(":");
    try {
      const { urls } = await resolvePackAssets(moduleId, [packId]);
      if ((await countCached(urls)) < urls.length) evicted.push(key);
    } catch { /* offline & manifest not cached: cannot tell, assume fine */ }
  }
  return evicted;
}

export interface UpdateInfo { moduleId: string; installed: string | null; latest: string }
/** Compare the live manifest version with the version the parent last downloaded. */
export async function checkContentUpdate(moduleId: string): Promise<UpdateInfo | null> {
  try {
    const m = await loadManifest(moduleId, true);
    const installed = useDownloads.getState().contentVersions[moduleId] ?? null;
    const hasPacks = Object.keys(useDownloads.getState().packs).some((k) => k.startsWith(`${moduleId}:`));
    return hasPacks && installed !== m.version ? { moduleId, installed, latest: m.version } : null;
  } catch { return null; }
}

/** Re-download every pack of a module that was previously downloaded, using the latest manifest. */
export async function updateModuleContent(moduleId: string) {
  clearContentMemo(moduleId);
  const had = Object.keys(useDownloads.getState().packs).filter((k) => k.startsWith(`${moduleId}:`)).map((k) => k.split(":")[1]);
  const manifest = await loadManifest(moduleId, true);
  await loadAssets(moduleId, manifest, true);
  for (const id of had) await downloadPack(moduleId, id);
  useDownloads.getState().setVersion(moduleId, manifest.version);
}
