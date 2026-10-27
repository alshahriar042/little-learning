import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { idbStorage } from "@/lib/db";
import { emit } from "@/services/events";

export interface ModuleProgress {
  /** unit (e.g. section) id -> ids of items viewed */
  seen: Record<string, string[]>;
  stars: number;
  stickers: string[];
}
const empty = (): ModuleProgress => ({ seen: {}, stars: 0, stickers: [] });

interface ProgressState {
  modules: Record<string, ModuleProgress>;
  markSeen: (moduleId: string, unitId: string, itemId: string, unitTotal: number) => void;
  addStars: (moduleId: string, n: number) => void;
  reset: (moduleId?: string) => void;
}

export const useProgress = create<ProgressState>()(
  persist(
    (set, get) => ({
      modules: {},
      markSeen: (moduleId, unitId, itemId, unitTotal) => {
        const m = get().modules[moduleId] ?? empty();
        const seen = m.seen[unitId] ?? [];
        if (seen.includes(itemId)) return;
        const nextSeen = [...seen, itemId];
        let stickers = m.stickers;
        const earned = nextSeen.length >= unitTotal && !stickers.includes(unitId);
        if (earned) stickers = [...stickers, unitId];
        set({ modules: { ...get().modules, [moduleId]: { ...m, seen: { ...m.seen, [unitId]: nextSeen }, stickers } } });
        emit("item:seen", { moduleId, unitId, itemId });
        if (earned) emit("sticker:earned", { moduleId, unitId });
      },
      addStars: (moduleId, n) => {
        const m = get().modules[moduleId] ?? empty();
        set({ modules: { ...get().modules, [moduleId]: { ...m, stars: m.stars + n } } });
        emit("stars:earned", { moduleId, count: n });
      },
      reset: (moduleId) => set({ modules: moduleId ? { ...get().modules, [moduleId]: empty() } : {} }),
    }),
    { name: "progress", storage: createJSONStorage(() => idbStorage) },
  ),
);

export const seenCount = (m: ModuleProgress | undefined, unitId: string) => m?.seen[unitId]?.length ?? 0;
export const totalSeen = (m: ModuleProgress | undefined) => Object.values(m?.seen ?? {}).reduce((a, s) => a + s.length, 0);
