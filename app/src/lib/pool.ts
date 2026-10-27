/** Run `worker` over `items` with at most `concurrency` in flight. Stops scheduling when `signal` aborts. */
export async function runPool<T>(
  items: readonly T[], concurrency: number, worker: (item: T) => Promise<void>, signal?: AbortSignal,
): Promise<void> {
  let next = 0;
  const lanes = Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    while (next < items.length && !signal?.aborted) await worker(items[next++]);
  });
  await Promise.all(lanes);
}

/** Retry with exponential backoff (delay = base * 2^attempt). */
export async function withRetry<T>(
  fn: () => Promise<T>, tries = 3, baseMs = 300, sleep: (ms: number) => Promise<void> = (ms) => new Promise((r) => setTimeout(r, ms)),
): Promise<T> {
  let lastErr: unknown;
  for (let attempt = 0; attempt < tries; attempt++) {
    try { return await fn(); } catch (e) {
      lastErr = e;
      if (attempt < tries - 1) await sleep(baseMs * 2 ** attempt);
    }
  }
  throw lastErr;
}
