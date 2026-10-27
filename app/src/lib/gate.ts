import { create } from "zustand";

export interface GateChallenge { a: number; b: number; options: number[]; answer: number }

/** Simple arithmetic a young child cannot do yet: a + b with a, b in 6..9. */
export function makeGateChallenge(rng: () => number = Math.random): GateChallenge {
  const a = 6 + Math.floor(rng() * 4), b = 6 + Math.floor(rng() * 4);
  const answer = a + b;
  const wrong = new Set<number>();
  while (wrong.size < 3) {
    const w = answer + (Math.floor(rng() * 7) - 3);
    if (w !== answer && w > 0) wrong.add(w);
  }
  const options = [answer, ...wrong].sort((x, y) => ((x * 7919) % 13) - ((y * 7919) % 13) || x - y);
  return { a, b, options, answer };
}

const UNLOCK_MS = 10 * 60 * 1000;
interface GateState { until: number; unlock: () => void; lock: () => void }
export const useGate = create<GateState>((set) => ({
  until: 0,
  unlock: () => set({ until: Date.now() + UNLOCK_MS }),
  lock: () => set({ until: 0 }),
}));
export const isUnlocked = (until: number, now = Date.now()) => until > now;
