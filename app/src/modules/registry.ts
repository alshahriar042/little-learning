import { lazy } from "react";
import type { ModuleDef } from "./types";

/**
 * THE module registry. To add a module: create modules/<id>/, add content/<id>/ (+ R2 assets)
 * and add one entry below. The shell, caching, settings and parent corner pick it up automatically.
 */
export const modules: ModuleDef[] = [
  {
    id: "picture-words", titleEn: "Picture Words", titleBn: "ছবিতে শব্দ", icon: "🖼️", color: "#e8892b", route: "/m/picture-words",
    status: "ready", minAge: 1, component: lazy(() => import("./picture-words")), contentManifest: "/content/picture-words/manifest.json",
    assetPrefix: "picture-words", offlinePackSize: 23_500_000, progressUnits: true,
    loadCredits: () => import("./picture-words/credits").then((m) => m.loadCredits()),
  },
  {
    id: "poems", titleEn: "Poems", titleBn: "ছড়া", icon: "🎵", color: "#d6478a", route: "/m/poems",
    status: "ready", minAge: 1, component: lazy(() => import("./poems")), contentManifest: "/content/poems/manifest.json",
    assetPrefix: "poems", offlinePackSize: 0,
  },
  {
    id: "alphabet", titleEn: "Alphabet", titleBn: "বর্ণমালা", icon: "🔤", color: "#2b86c5", route: "/m/alphabet",
    status: "coming-soon", minAge: 2, component: lazy(() => import("./ComingSoon")), contentManifest: null, assetPrefix: "alphabet", offlinePackSize: 0,
  },
  {
    id: "numbers", titleEn: "Numbers", titleBn: "সংখ্যা", icon: "🔢", color: "#3aa05a", route: "/m/numbers",
    status: "coming-soon", minAge: 2, component: lazy(() => import("./ComingSoon")), contentManifest: null, assetPrefix: "numbers", offlinePackSize: 0,
  },
];

export const getModule = (id: string) => modules.find((m) => m.id === id);
export const downloadableModules = () => modules.filter((m) => m.contentManifest && m.offlinePackSize > 0);
