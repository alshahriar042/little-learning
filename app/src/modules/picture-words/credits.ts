import { loadPW } from "./data";
import type { CreditEntry } from "../types";

/** One credit entry per item that has a credit in content/picture-words/items.json. */
export async function loadCredits(): Promise<CreditEntry[]> {
  const { items } = await loadPW();
  return items.filter((i) => i.credit).map((i) => ({ label: `${i.en} · ${i.bnMeaning}`, credit: i.credit! }));
}
