import { openDB, type DBSchema, type IDBPDatabase } from "idb";
import type { StateStorage } from "zustand/middleware";

interface LLDB extends DBSchema { kv: { key: string; value: string } }
let dbp: Promise<IDBPDatabase<LLDB>> | null = null;
const db = () => (dbp ??= openDB<LLDB>("little-learners", 1, { upgrade(d) { d.createObjectStore("kv"); } }));

/** zustand storage backed by IndexedDB; falls back to memory if IDB is unavailable. */
const mem = new Map<string, string>();
export const idbStorage: StateStorage = {
  async getItem(k) { try { return (await (await db()).get("kv", k)) ?? null; } catch { return mem.get(k) ?? null; } },
  async setItem(k, v) { try { await (await db()).put("kv", v, k); } catch { mem.set(k, v); } },
  async removeItem(k) { try { await (await db()).delete("kv", k); } catch { mem.delete(k); } },
};
