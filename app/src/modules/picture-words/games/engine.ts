import type { Item } from "@/lib/schemas";

export type Rng = () => number;

/** Small seedable PRNG so game generation is deterministic in tests. */
export function mulberry32(seed: number): Rng {
  return () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function shuffle<T>(arr: readonly T[], rng: Rng = Math.random): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}

export interface Question { id: string; target: Item; options: Item[]; answerId: string }

/** Build `count` questions; each has `optionCount` distinct options (no duplicate English words) including the target. */
export function buildQuestions(items: readonly Item[], count: number, optionCount: number, rng: Rng = Math.random): Question[] {
  if (items.length < optionCount) throw new Error(`need at least ${optionCount} items`);
  const targets = shuffle(items, rng).slice(0, Math.min(count, items.length));
  return targets.map((target, i) => {
    const distractors: Item[] = [];
    for (const c of shuffle(items, rng)) {
      if (distractors.length === optionCount - 1) break;
      if (c.id !== target.id && c.en.toLowerCase() !== target.en.toLowerCase() && !distractors.some((d) => d.en.toLowerCase() === c.en.toLowerCase())) distractors.push(c);
    }
    return { id: `${i}-${target.id}`, target, options: shuffle([target, ...distractors], rng), answerId: target.id };
  });
}

// ---- Memory match: every item contributes a picture card and a word card -------------------------------

export interface MatchCard { uid: string; itemId: string; kind: "pic" | "word"; flipped: boolean; matched: boolean }
export interface MatchState { cards: MatchCard[]; open: string[]; moves: number; done: boolean }

export function buildMatch(items: readonly Item[], pairs: number, rng: Rng = Math.random): MatchState {
  const chosen = shuffle(items, rng).slice(0, pairs);
  const cards = shuffle(chosen.flatMap((it): MatchCard[] => [
    { uid: `${it.id}:pic`, itemId: it.id, kind: "pic", flipped: false, matched: false },
    { uid: `${it.id}:word`, itemId: it.id, kind: "word", flipped: false, matched: false },
  ]), rng);
  return { cards, open: [], moves: 0, done: false };
}

/** Pure flip reducer. Two open non-matching cards stay open until `resolveOpen` is called. */
export function flipCard(s: MatchState, uid: string): MatchState {
  const card = s.cards.find((c) => c.uid === uid);
  if (!card || card.flipped || card.matched || s.open.length >= 2) return s;
  const cards = s.cards.map((c) => (c.uid === uid ? { ...c, flipped: true } : c));
  const open = [...s.open, uid];
  if (open.length < 2) return { ...s, cards, open };
  const [a, b] = open.map((u) => cards.find((c) => c.uid === u)!);
  if (a.itemId === b.itemId && a.kind !== b.kind) {
    const matched = cards.map((c) => (open.includes(c.uid) ? { ...c, matched: true } : c));
    return { cards: matched, open: [], moves: s.moves + 1, done: matched.every((c) => c.matched) };
  }
  return { ...s, cards, open, moves: s.moves + 1 };
}

/** Flip a non-matching open pair back face-down. */
export function resolveOpen(s: MatchState): MatchState {
  if (s.open.length < 2) return s;
  return { ...s, cards: s.cards.map((c) => (s.open.includes(c.uid) && !c.matched ? { ...c, flipped: false } : c)), open: [] };
}
