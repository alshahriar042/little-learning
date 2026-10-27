import { describe, expect, it } from "vitest";
import { downloadableModules, getModule, modules } from "../src/modules/registry";

describe("module registry", () => {
  it("has unique ids and routes under /m/", () => {
    expect(new Set(modules.map((m) => m.id)).size).toBe(modules.length);
    for (const m of modules) expect(m.route).toBe(`/m/${m.id}`);
  });
  it("picture-words is ready; poems, alphabet and numbers are coming soon", () => {
    expect(getModule("picture-words")?.status).toBe("ready");
    for (const id of ["poems", "alphabet", "numbers"]) expect(getModule(id)?.status).toBe("coming-soon");
  });
  it("only modules with content and assets are downloadable", () => {
    expect(downloadableModules().map((m) => m.id)).toEqual(["picture-words"]);
  });
});
