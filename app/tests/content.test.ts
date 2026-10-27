import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { ItemsSchema, ManifestSchema, AssetsSchema, PoemsSchema, SectionsSchema } from "../src/lib/schemas";

const root = path.resolve(__dirname, "../..");
const read = (p: string) => JSON.parse(fs.readFileSync(path.join(root, p), "utf8"));

describe("content schemas", () => {
  const sections = SectionsSchema.parse(read("content/picture-words/sections.json"));
  const items = ItemsSchema.parse(read("content/picture-words/items.json"));
  it("has 22 sections and 588 items", () => {
    expect(sections).toHaveLength(22);
    expect(items).toHaveLength(588);
  });
  it("every item belongs to a known section and has an image file on disk", () => {
    const ids = new Set(sections.map((s) => s.id));
    for (const it of items) {
      expect(ids.has(it.sectionId)).toBe(true);
      expect(it.image).not.toBeNull();
      expect(fs.existsSync(path.join(root, "incoming/images", it.image!.file))).toBe(true);
    }
  });
  it("rejects malformed items", () => {
    expect(() => ItemsSchema.parse([{ id: "x" }])).toThrow();
  });
  it("parses poems and the generated manifests", () => {
    expect(PoemsSchema.parse(read("content/poems/poems.json"))).toHaveLength(2);
    const gen = "app/public/content/picture-words";
    if (fs.existsSync(path.join(root, gen, "manifest.json"))) {
      const m = ManifestSchema.parse(read(`${gen}/manifest.json`));
      const a = AssetsSchema.parse(read(`${gen}/assets.json`));
      expect(m.packs.reduce((n, p) => n + p.count, 0)).toBe(588);
      expect(Object.keys(a.assets)).toHaveLength(1176);
    }
  });
});
