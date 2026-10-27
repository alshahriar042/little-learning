/** Local-only event bus (no analytics, nothing leaves the device). */
export type AppEvents = {
  "item:seen": { moduleId: string; unitId: string; itemId: string };
  "stars:earned": { moduleId: string; count: number };
  "sticker:earned": { moduleId: string; unitId: string };
  "download:done": { moduleId: string; packId: string };
};
type Handler<K extends keyof AppEvents> = (p: AppEvents[K]) => void;
const handlers = new Map<string, Set<Handler<never>>>();

export function on<K extends keyof AppEvents>(name: K, h: Handler<K>): () => void {
  const set = handlers.get(name) ?? new Set();
  set.add(h as Handler<never>);
  handlers.set(name, set);
  return () => set.delete(h as Handler<never>);
}
export function emit<K extends keyof AppEvents>(name: K, payload: AppEvents[K]) {
  handlers.get(name)?.forEach((h) => (h as Handler<K>)(payload));
}
