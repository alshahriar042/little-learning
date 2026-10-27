import { expect, test, type Page } from "@playwright/test";

async function passGate(page: Page) {
  const q = await page.getByText(/^\d+ \+ \d+ = \?$/).innerText();
  const [a, b] = q.match(/\d+/g)!.map(Number);
  await page.getByRole("button", { name: String(a + b), exact: true }).click();
}

test("home lists modules; coming-soon modules are present", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("Picture Words").first()).toBeVisible();
  for (const name of ["Poems", "Alphabet", "Numbers"]) await expect(page.getByText(name).first()).toBeVisible();
  await page.getByRole("link", { name: /Alphabet/ }).click();
  await expect(page.getByRole("heading", { name: /Coming soon|শীঘ্রই আসছে/i })).toBeVisible();
});

test("picture words: 22 sections, grid and flashcard render with images", async ({ page }) => {
  await page.goto("/m/picture-words");
  await expect(page.locator("a[href^='/m/picture-words/']").filter({ hasText: /ANIMALS|Animals/i }).first()).toBeVisible();
  await expect(page.locator("a[href^='/m/picture-words/']:not([href$='/games'])")).toHaveCount(22);
  await page.goto("/m/picture-words/animals");
  await expect(page.getByRole("button", { name: /Tiger/ })).toBeVisible();
  await page.getByRole("button", { name: /Tiger/ }).click();
  await expect(page.getByText("(টাইগার)")).toBeVisible();
  await expect(page.getByText("বাঘ", { exact: true })).toBeVisible();
  await expect.poll(() => page.evaluate(() => { const i = document.querySelector<HTMLImageElement>("img"); return !!i && i.complete && i.naturalWidth > 0; })).toBe(true);
  await page.getByRole("button", { name: /Next|পরের/ }).click();
  await expect(page.getByText("(ডগ)")).toBeVisible();
});

test("games: find it round advances once the right picture is tapped; wrong taps are gentle", async ({ page }) => {
  await page.goto("/m/picture-words/games/findit");
  await expect(page.getByText(/^1 \/ 8/)).toBeVisible();
  const opts = page.locator("main .grid button");
  await expect(opts).toHaveCount(4);
  for (let i = 0; i < 4; i++) { await opts.nth(i).click({ force: true }); await page.waitForTimeout(150); }
  await expect(page.getByText(/^2 \/ 8/)).toBeVisible({ timeout: 5000 });
});

test("parental gate protects the parent corner; credits are listed", async ({ page }) => {
  await page.goto("/parent");
  await expect(page.getByRole("heading", { name: /Grown-ups only|শুধু বড়দের/ })).toBeVisible();
  await passGate(page);
  await expect(page.getByRole("heading", { name: /Settings/ })).toBeVisible();
  await page.goto("/parent/credits");
  await passGate(page);
  await expect(page.getByRole("link", { name: /Source|উৎস/ }).first()).toBeVisible();
});

test("OFFLINE: download a section, go offline, reload and still browse", async ({ page, context }) => {
  await page.goto("/");
  await page.evaluate(() => navigator.serviceWorker.ready);
  await expect.poll(() => page.evaluate(() => !!navigator.serviceWorker.controller)).toBe(true);
  // visit content once so it is cached, then download the "drinks" section from the parent corner
  await page.goto("/m/picture-words");
  await expect(page.locator("a[href^='/m/picture-words/']:not([href$='/games'])")).toHaveCount(22);
  await page.goto("/parent");
  await passGate(page);
  await page.getByTestId("dl-expand").click();
  await page.getByTestId("dl-drinks").click();
  await expect(page.getByTestId("dl-drinks")).toHaveAttribute("data-state", "done", { timeout: 60_000 });

  await context.setOffline(true);
  await page.goto("/m/picture-words/drinks");
  await expect(page.getByText("Offline mode").or(page.getByText("অফলাইন মোড"))).toBeVisible();
  await expect(page.getByRole("button", { name: /Coffee/ })).toBeVisible();
  await page.getByRole("button", { name: /Coffee/ }).click();
  await expect(page.getByText("(কফি)")).toBeVisible();
  await expect.poll(() => page.evaluate(() => { const i = document.querySelector<HTMLImageElement>("main img"); return !!i && i.complete && i.naturalWidth > 0; })).toBe(true);
  await page.reload();
  await expect(page.getByText("(কফি)")).toBeVisible();
  await context.setOffline(false);
});
