import { z } from "zod";

export const SectionSchema = z.object({
  id: z.string(), nameEn: z.string(), nameBn: z.string(), color: z.string(), order: z.number(),
});
export const CreditSchema = z.object({
  author: z.string().nullish(), license: z.string().nullish(), sourceUrl: z.string().nullish(), title: z.string().nullish(),
});
export const ItemSchema = z.object({
  id: z.string(), sectionId: z.string(), en: z.string(), bnPron: z.string(), bnMeaning: z.string(), emoji: z.string(),
  image: z.object({ file: z.string(), w: z.number(), h: z.number(), hasCutout: z.boolean() }).nullable(),
  credit: CreditSchema.nullable(),
  audio: z.object({ en: z.string().optional(), bn: z.string().optional() }).optional(),
});
export const SectionsSchema = z.array(SectionSchema);
export const ItemsSchema = z.array(ItemSchema);

export const PackSchema = z.object({ id: z.string(), titleEn: z.string(), titleBn: z.string(), count: z.number(), bytes: z.number() });
export const ManifestSchema = z.object({
  module: z.string(), version: z.string(), files: z.array(z.string()), assetsFile: z.string().nullable(), packs: z.array(PackSchema),
});
export const AssetsSchema = z.object({
  version: z.string(),
  assets: z.record(z.string(), z.object({ b: z.number(), v: z.string(), c: z.string() })),
  packs: z.record(z.string(), z.array(z.string())),
});

export const PoemSchema = z.object({
  id: z.string(), titleBn: z.string(), titleEn: z.string(),
  lines: z.array(z.object({ bn: z.string(), en: z.string().optional(), startMs: z.number(), endMs: z.number() })),
  audioKey: z.string().nullable(), illustrationKey: z.string().nullable(),
  emoji: z.string().optional(), source: z.string().optional(), grade: z.number().int().min(1).max(5).optional(),
});
export const PoemsSchema = z.array(PoemSchema);

export type Section = z.infer<typeof SectionSchema>;
export type Item = z.infer<typeof ItemSchema>;
export type Credit = z.infer<typeof CreditSchema>;
export type Manifest = z.infer<typeof ManifestSchema>;
export type AssetsFile = z.infer<typeof AssetsSchema>;
export type Poem = z.infer<typeof PoemSchema>;
