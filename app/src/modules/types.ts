import type { ComponentType, LazyExoticComponent } from "react";
import type { Credit } from "@/lib/schemas";

export interface CreditEntry { label: string; credit: Credit }

/** Everything the shell needs to know about a learning module. Adding a module = one entry in registry.ts. */
export interface ModuleDef {
  id: string;
  titleEn: string;
  titleBn: string;
  icon: string;
  color: string;
  route: string;
  status: "ready" | "coming-soon";
  minAge: number;
  component: LazyExoticComponent<ComponentType>;
  /** URL of content/<id>/manifest.json (null for placeholders with no content yet). */
  contentManifest: string | null;
  /** First path segment of this module's assets on R2 / dev-assets. */
  assetPrefix: string;
  /** Approximate size of the full offline pack in bytes (shown before the manifest is loaded). */
  offlinePackSize: number;
  /** Optional: lazily yields photo/audio credits for the Credits page. */
  loadCredits?: () => Promise<CreditEntry[]>;
  /** Optional: unit total for the home progress ring (items in the module). */
  progressUnits?: boolean;
}
