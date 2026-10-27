import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { idbStorage } from "@/lib/db";

export type SpeechMode = "en" | "bn" | "both";
export type UiLang = "bn" | "en";

interface SettingsState {
  uiLang: UiLang;
  speechMode: SpeechMode;
  sound: boolean;
  rate: number;
  autoplaySeconds: number;
  matchPairs: 3 | 4 | 6;
  /** moduleId -> enabled section ids; missing = all sections enabled. */
  enabledSections: Record<string, string[]>;
  set: (p: Partial<Omit<SettingsState, "set" | "toggleSection">>) => void;
  toggleSection: (moduleId: string, sectionId: string, all: string[]) => void;
}

export const useSettings = create<SettingsState>()(
  persist(
    (set, get) => ({
      uiLang: "bn", speechMode: "both", sound: true, rate: 0.85, autoplaySeconds: 4, matchPairs: 4, enabledSections: {},
      set: (p) => set(p),
      toggleSection: (moduleId, sectionId, all) => {
        const cur = get().enabledSections[moduleId] ?? all;
        const next = cur.includes(sectionId) ? cur.filter((s) => s !== sectionId) : [...cur, sectionId];
        if (next.length === 0) return; // keep at least one section enabled
        set({ enabledSections: { ...get().enabledSections, [moduleId]: next } });
      },
    }),
    { name: "settings", storage: createJSONStorage(() => idbStorage) },
  ),
);

export function enabledFor(moduleId: string, all: string[], map: Record<string, string[]>): string[] {
  const e = map[moduleId];
  return e ? all.filter((s) => e.includes(s)) : all;
}
