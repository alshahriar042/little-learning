import { describe, expect, it } from "vitest";
import { cacheNameForPath, isModuleAssetPath } from "../src/lib/cacheNames";
import { assetUrl, isCrossOrigin } from "../src/lib/assetUrl";
import { runPool, withRetry } from "../src/lib/pool";
import { makeGateChallenge, isUnlocked } from "../src/lib/gate";
import { findVoice } from "../src/services/speech";
import { translate, dictionaries } from "../src/i18n/strings";
import { mulberry32 } from "../src/modules/picture-words/games/engine";

describe("cache helpers", () => {
  it("maps asset paths to per-module caches", () => {
    expect(cacheNameForPath("/dev-assets/picture-words/img/480/a.webp")).toBe("picture-words-img-v1");
    expect(cacheNameForPath("/picture-words/audio/a.mp3")).toBe("picture-words-audio-v1");
    expect(cacheNameForPath("/content/picture-words/items.json")).toBeNull();
    expect(isModuleAssetPath("/assets/index.js")).toBe(false);
  });
  it("builds asset URLs for dev and R2", () => {
    expect(assetUrl("picture-words", "img/480/a.webp", "abc", "")).toBe("/dev-assets/picture-words/img/480/a.webp?v=abc");
    expect(assetUrl("picture-words", "img/960/a.webp", undefined, "https://cdn.example.com")).toBe("https://cdn.example.com/picture-words/img/960/a.webp");
    expect(isCrossOrigin("https://cdn.example.com")).toBe(true);
    expect(isCrossOrigin("")).toBe(false);
  });
  it("runPool respects the concurrency limit and processes everything", async () => {
    let active = 0, peak = 0, done = 0;
    await runPool(Array.from({ length: 30 }, (_, i) => i), 6, async () => {
      active++; peak = Math.max(peak, active);
      await new Promise((r) => setTimeout(r, 2));
      active--; done++;
    });
    expect(done).toBe(30);
    expect(peak).toBeLessThanOrEqual(6);
    expect(peak).toBeGreaterThan(1);
  });
  it("runPool stops when aborted", async () => {
    const ctl = new AbortController();
    let n = 0;
    await runPool(Array.from({ length: 50 }, (_, i) => i), 2, async () => {
      if (++n === 4) ctl.abort();
      await new Promise((r) => setTimeout(r, 1));
    }, ctl.signal);
    expect(n).toBeLessThan(10);
  });
  it("withRetry backs off exponentially then succeeds or throws", async () => {
    const waits: number[] = [];
    let calls = 0;
    const ok = await withRetry(async () => { if (++calls < 3) throw new Error("x"); return "done"; }, 3, 100, async (ms) => { waits.push(ms); });
    expect(ok).toBe("done");
    expect(waits).toEqual([100, 200]);
    await expect(withRetry(async () => { throw new Error("always"); }, 2, 1, async () => undefined)).rejects.toThrow("always");
  });
});

describe("parental gate", () => {
  it("creates a solvable challenge with 4 distinct options", () => {
    for (let s = 0; s < 50; s++) {
      const c = makeGateChallenge(mulberry32(s));
      expect(c.answer).toBe(c.a + c.b);
      expect(c.options).toHaveLength(4);
      expect(new Set(c.options).size).toBe(4);
      expect(c.options).toContain(c.answer);
    }
  });
  it("unlock window", () => {
    expect(isUnlocked(100, 50)).toBe(true);
    expect(isUnlocked(100, 150)).toBe(false);
  });
});

describe("speech voice picking", () => {
  const v = (lang: string) => ({ lang, name: lang });
  it("prefers bn-BD then bn-IN, and en-US", () => {
    expect(findVoice("bn", [v("bn-IN"), v("bn-BD")])?.lang).toBe("bn-BD");
    expect(findVoice("bn", [v("en-US"), v("bn_IN")])?.lang).toBe("bn_IN");
    expect(findVoice("en", [v("en-GB"), v("en-US")])?.lang).toBe("en-US");
    expect(findVoice("bn", [v("en-US")])).toBeUndefined();
  });
});

describe("i18n", () => {
  it("has a Bangla string for every English key", () => {
    expect(Object.keys(dictionaries.bn).sort()).toEqual(Object.keys(dictionaries.en).sort());
  });
  it("translates", () => {
    expect(translate("en", "common.back")).toBe("Back");
  });
});
