/**
 * Replaces card images with the lead photo of the matching English Wikipedia article (hosted on Wikimedia Commons).
 * Only CC BY / CC BY-SA / CC0 / public-domain JPEGs are accepted; credit = author + licence + Commons page.
 *   npx tsx scripts/add-wiki-photos.ts   then   npm run assets
 */
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const root = path.resolve(import.meta.dirname, "..");
const contentDir = path.join(root, "content/picture-words");
const incomingDir = path.join(root, "incoming");
const UA = { "User-Agent": "LittleLearnersBD/1.0 (educational PWA; contact via repository owner)" };
const OK_LICENSE = /^(cc[- ]by(-sa)?[- ]\d|cc0|public domain|pd)/i;

/** item id -> English Wikipedia article title */
const MAP: Record<string, string> = {
  "clothes-trousers": "Trousers", "clothes-dress": "Dress", "clothes-sandal": "Sandal", "clothes-socks": "Sock", "clothes-hat": "Hat",
  "clothes-jacket": "Jacket", "clothes-scarf": "Scarf", "clothes-gloves": "Glove", "clothes-glasses": "Glasses", "clothes-necktie": "Necktie", "clothes-crown": "Crown (headgear)",
  "home-light-bulb": "Incandescent light bulb", "home-bucket": "Bucket", "home-mirror": "Mirror", "home-fork-and-plate": "Fork", "home-spoon": "Spoon", "home-radio": "Radio",
  "home-camera": "Camera", "home-mobile-phone": "Smartphone", "home-bowl": "Bowl", "home-window": "Window", "home-chair": "Chair",
  "school-book": "Book", "school-pencil": "Pencil", "school-abacus": "Abacus", "school-paperclip": "Paper clip", "school-ruler": "Ruler", "school-school": "School",
  "jobs-doctor": "Physician", "jobs-teacher": "Teacher", "jobs-pilot": "Aircraft pilot", "jobs-judge": "Judge", "jobs-factory-worker": "Factory",
  "nature-fog": "Fog", "nature-sun": "Sun", "music-drum": "Drum", "music-violin": "Violin",
  "places-hospital": "Hospital", "places-mosque": "Mosque", "places-shop": "Retail", "places-post-office": "Post office", "places-park": "Park", "places-office-building": "Office",
  "toys-kite": "Kite", "toys-doll": "Doll", "toys-yo-yo": "Yo-yo", "toys-party": "Party", "toys-magic-wand": "Wand",
};
const ONLY = process.env.ONLY?.split(",");

async function getJson(url: string): Promise<any> {
  for (let i = 0; i < 6; i++) {
    const r = await fetch(url, { headers: UA });
    if (r.ok) return r.json();
    await new Promise((res) => setTimeout(res, 6000 * (i + 1)));
  }
  throw new Error(`failed ${url}`);
}
const api = (base: string, params: Record<string, string>) => {
  const u = new URL(base);
  for (const [k, v] of Object.entries(params)) u.searchParams.set(k, v);
  return u.toString();
};

async function leadFile(article: string): Promise<string | null> {
  const j = await getJson(api("https://en.wikipedia.org/w/api.php", { action: "query", format: "json", redirects: "1", prop: "pageimages", piprop: "name", titles: article, origin: "*" }));
  const p: any = Object.values(j.query?.pages ?? {})[0];
  return p?.pageimage ? `File:${p.pageimage}` : null;
}

async function fileInfo(title: string) {
  const j = await getJson(api("https://commons.wikimedia.org/w/api.php", { action: "query", format: "json", titles: title, prop: "imageinfo", iiprop: "url|size|mime|extmetadata", iiurlwidth: "1100", origin: "*" }));
  const p: any = Object.values(j.query?.pages ?? {})[0];
  const ii = p?.imageinfo?.[0];
  if (!ii || ii.mime !== "image/jpeg" || ii.width < 700) return null;
  const md = ii.extmetadata ?? {};
  const license = String(md.LicenseShortName?.value ?? "");
  if (!OK_LICENSE.test(license)) return null;
  const author = String(md.Artist?.value ?? "").replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").replace(/\s+/g, " ").trim().slice(0, 80) || "Unknown";
  return { url: (ii.thumburl ?? ii.url) as string, author, license, page: ii.descriptionurl as string };
}

const items: any[] = JSON.parse(fs.readFileSync(path.join(contentDir, "items.json"), "utf8"));
const done: string[] = [];
const failed: string[] = [];
for (const [id, article] of Object.entries(MAP)) {
  if (ONLY && !ONLY.includes(id)) continue;
  const it = items.find((i) => i.id === id);
  if (!it) continue;
  try {
    const file = await leadFile(article);
    const info = file ? await fileInfo(file) : null;
    if (!file || !info) { failed.push(`${id} (${article}: ${file ?? "no lead image"})`); continue; }
    const res = await fetch(info.url, { headers: UA });
    if (!res.ok) { failed.push(`${id} download ${res.status}`); continue; }
    const out = path.join(incomingDir, "images", `${id}.webp`);
    const meta = await sharp(Buffer.from(await res.arrayBuffer())).rotate().resize(960, 560, { fit: "cover", position: sharp.strategy.attention }).webp({ quality: 84 }).toFile(out);
    it.image = { file: `${id}.webp`, w: meta.width, h: meta.height, hasCutout: false };
    it.credit = { author: info.author, license: info.license, sourceUrl: info.page, title: file };
    done.push(`${id}: ${file} | ${info.license} | ${info.author}`);
  } catch (e) { failed.push(`${id} ${(e as Error).message.slice(0, 60)}`); }
  await new Promise((r) => setTimeout(r, 1500));
}
for (const dir of [contentDir, incomingDir]) fs.writeFileSync(path.join(dir, "items.json"), JSON.stringify(items, null, 2) + "\n");
fs.writeFileSync(path.join(root, ".cache/photo-report.txt"), done.join("\n") + "\n");
console.log(`[wiki] replaced ${done.length}, no usable lead photo for ${failed.length}`);
if (failed.length) console.log("  " + failed.join("\n  "));
