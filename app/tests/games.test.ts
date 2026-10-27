import { describe, expect, it } from "vitest";
import { buildMatch, buildQuestions, flipCard, mulberry32, resolveOpen, shuffle } from "../src/modules/picture-words/games/engine";
import type { Item } from "../src/lib/schemas";

const mk = (n: number): Item[] =>
  Array.from({ length: n }, (_, i) => ({ id: `i${i}`, sectionId: "s", en: `Word${i}`, bnPron: "p", bnMeaning: "m", emoji: "x", image: null, credit: null }));

describe("question generation", () => {
  it("is deterministic with a seed and always includes the answer among distinct options", () => {
    const a = buildQuestions(mk(20), 8, 4, mulberry32(1));
    const b = buildQuestions(mk(20), 8, 4, mulberry32(1));
    expect(a.map((q) => q.id)).toEqual(b.map((q) => q.id));
    for (const q of a) {
      expect(q.options).toHaveLength(4);
      expect(q.options.map((o) => o.id)).toContain(q.answerId);
      expect(new Set(q.options.map((o) => o.en)).size).toBe(4);
    }
  });
  it("never repeats a target and caps at the pool size", () => {
    const qs = buildQuestions(mk(5), 10, 3);
    expect(qs).toHaveLength(5);
    expect(new Set(qs.map((q) => q.answerId)).size).toBe(5);
  });
  it("avoids distractors with the same English word", () => {
    const items = [...mk(6), { ...mk(1)[0], id: "dup", en: "Word0" }];
    for (const q of buildQuestions(items, 7, 4, mulberry32(3))) expect(new Set(q.options.map((o) => o.en.toLowerCase())).size).toBe(4);
  });
  it("throws when there are too few items", () => {
    expect(() => buildQuestions(mk(2), 3, 4)).toThrow();
  });
  it("shuffle keeps all elements", () => {
    expect(shuffle([1, 2, 3, 4, 5], mulberry32(9)).sort()).toEqual([1, 2, 3, 4, 5]);
  });
});

describe("memory match", () => {
  it("builds pic+word cards for each pair", () => {
    const s = buildMatch(mk(10), 4, mulberry32(2));
    expect(s.cards).toHaveLength(8);
    expect(s.cards.filter((c) => c.kind === "pic")).toHaveLength(4);
  });
  it("matches a pic with its word, flips back a mismatch, and finishes", () => {
    let s = buildMatch(mk(10), 3, mulberry32(4));
    const first = s.cards[0];
    const mate = s.cards.find((c) => c.itemId === first.itemId && c.uid !== first.uid)!;
    const other = s.cards.find((c) => c.itemId !== first.itemId)!;
    s = flipCard(s, first.uid);
    s = flipCard(s, other.uid);
    expect(s.open).toHaveLength(2);
    expect(flipCard(s, mate.uid)).toBe(s); // third flip blocked while a pair is open
    s = resolveOpen(s);
    expect(s.cards.every((c) => !c.flipped)).toBe(true);
    for (const id of new Set(s.cards.map((c) => c.itemId))) {
      for (const c of s.cards.filter((x) => x.itemId === id)) s = flipCard(s, c.uid);
    }
    expect(s.done).toBe(true);
  });
  it("ignores flipping an already-flipped card", () => {
    let s = buildMatch(mk(10), 3, mulberry32(5));
    s = flipCard(s, s.cards[0].uid);
    expect(flipCard(s, s.cards[0].uid)).toBe(s);
  });
});
