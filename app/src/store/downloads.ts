import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { idbStorage } from "@/lib/db";

export interface PackRecord { count: number; bytes: number; at: number }
interface DownloadsState {
  /** `${moduleId}:${packId}` -> completed download record (used to detect OS cache eviction) */
  packs: Record<string, PackRecord>;
  /** moduleId -> content version the user last updated to */
  contentVersions: Record<string, string>;
  record: (key: string, r: PackRecord) => void;
  drop: (keyPrefix?: string) => void;
  setVersion: (moduleId: string, v: string) => void;
}
export const useDownloads = create<DownloadsState>()(
  persist(
    (set, get) => ({
      packs: {}, contentVersions: {},
      record: (key, r) => set({ packs: { ...get().packs, [key]: r } }),
      drop: (prefix) =>
        set({ packs: prefix ? Object.fromEntries(Object.entries(get().packs).filter(([k]) => !k.startsWith(prefix))) : {} }),
      setVersion: (moduleId, v) => set({ contentVersions: { ...get().contentVersions, [moduleId]: v } }),
    }),
    { name: "downloads", storage: createJSONStorage(() => idbStorage) },
  ),
);
