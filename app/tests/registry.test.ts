import { describe, expect, it } from "vitest";
import { downloadableModules, getModule, modules } from "../src/modules/registry";

describe("module registry", () => {
  it("has unique ids and routes under /m/", () => {
    expect(new Set(modules.map((m) => m.id)).size).toBe(modules.length);
    for (const m of modules) expect(m.route).toBe(`/m/${m.id}`);
  });
  it("picture-words and poems are ready; alphabet and numbers are coming soon", () => {
    for (const id of ["picture-words", "poems"]) expect(getModule(id)?.status).toBe("ready");
    for (const id of ["alphabet", "numbers"]) expect(getModule(id)?.status).toBe("coming-soon");
  });
  it("only modules with content and assets are downloadable", () => {
    expect(downloadableModules().map((m) => m.id)).toEqual(["picture-words"]);
  });
});
