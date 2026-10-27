/**
 * Replaces the emoji artwork of items added to the ORIGINAL 12 sections with real photographs from Wikimedia Commons
 * (only CC BY / CC BY-SA / CC0 / public domain; author + licence + source are stored as the item's credit).
 *   npx tsx scripts/add-photos.ts [--dry]   then   npm run assets
 */
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const root = path.resolve(import.meta.dirname, "..");
const contentDir = path.join(root, "content/picture-words");
const incomingDir = path.join(root, "incoming");
const dry = process.argv.includes("--dry");
const UA = { "User-Agent": "LittleLearnersBD/1.0 (educational PWA; contact via repository owner)" };

const ORIGINAL = new Set(["animals", "birds", "fruits", "flowers-plants", "vegetables", "fish-sea", "vehicles", "human-body", "food", "drinks", "sports", "insects"]);

/** search phrase overrides (default = the English name + a section hint) */
const Q: Record<string, string> = {
  "animals-dinosaur": "Tyrannosaurus rex skeleton museum", "animals-long-neck-dinosaur": "File:Brachiosaurus brancai Berlin 1.jpg", "animals-hedgehog": "European hedgehog",
  "animals-beaver": "North American beaver", "animals-bison": "American bison", "animals-mammoth": "woolly mammoth museum reconstruction",
  "birds-turkey": "wild turkey bird", "birds-chick": "Gallus gallus domesticus chick yellow chicken", "birds-bird": "small songbird on branch", "birds-goose": "greylag goose",
  "birds-egg-and-chick": "chick hatching egg",
  "fruits-blueberries": "blueberries", "fruits-olive": "olives on tree", "fruits-mandarin": "mandarin oranges",
  "flowers-plants-seedling": "File:Fresh Seedling After Rainfall.jpg",
  "flowers-plants-herb": "fresh herbs basil mint plant", "flowers-plants-bamboo": "bamboo grove", "flowers-plants-rice-plant": "rice plant paddy field Bangladesh", "flowers-plants-pine-tree": "pine tree",
  "flowers-plants-big-tree": "large oak tree",
  "fish-sea-shell": "seashell", "fish-sea-oyster": "oyster shell", "fish-sea-coral": "coral reef", "fish-sea-jellyfish": "jellyfish",
  "vehicles-skateboard": "skateboard", "vehicles-sailboat": "sailboat", "vehicles-parachute": "parachute skydiving", "vehicles-satellite": "artificial satellite in orbit",
  "vehicles-flying-saucer": "flying saucer UFO", "vehicles-steam-train": "steam locomotive", "vehicles-racing-car": "Formula One racing car", "vehicles-roller-skate": "roller skates",
  "vehicles-monorail": "monorail train",
  "human-body-muscle": "File:Biceps flex.jpg",
  "human-body-thumbs-up": "thumbs up hand", "human-body-pointing-up": "pointing finger gesture hand",
  "food-pancakes": "pancakes with syrup", "food-waffle": "waffle", "food-cookie": "chocolate chip cookies", "food-pie": "apple pie", "food-croissant": "croissant",
  "food-taco": "taco", "food-sushi": "sushi", "food-dumpling": "dumplings momo", "food-cupcake": "cupcake", "food-lollipop": "lollipop",
  "drinks-coconut-water": "drinking coconut water green coconut", "drinks-mate": "yerba mate gourd",
  "sports-bowling": "ten-pin bowling", "sports-darts": "dartboard darts", "sports-skiing": "alpine skiing", "sports-surfing": "surfing wave surfer", "sports-fishing": "fishing rod angler",
  "sports-medal": "gold medal",
  "insects-cricket-insect": "field cricket insect", "insects-spider-web": "spider web dew", "insects-microbe": "bacteria microscope",
};

/** second pass: exact Commons file title ("File:...") or a replacement search phrase, chosen after reviewing the first pass */
const PICK: Record<string, string> = {
  "animals-long-neck-dinosaur": "File:Brachiosaurus mount.jpg",
  "birds-chick": "Gallus gallus domesticus chick yellow chicken",
  "flowers-plants-seedling": "File:Fresh Seedling After Rainfall.jpg",
  "flowers-plants-leaf": "green leaf macro veins backlit",
  "flowers-plants-herb": "File:Holy Basil plant leaves.jpg",
  "flowers-plants-pine-tree": "File:Tall pine tree forest in mist and moss.jpg",
  "vehicles-monorail": "File:Tama toshi monorail.JPG",
  "human-body-muscle": "File:Biceps flex.jpg",
  "human-body-lips": "lips mouth close up photo",
  "human-body-victory-hand": "peace sign hand two fingers",
  "human-body-thumbs-up": "File:Thumbs Up.JPG",
  "human-body-pointing-up": "File:Pointing finger.jpg",
  "sports-bowling": "File:Bowling ball and pins for strike - front view.jpg",
  "sports-fishing": "File:Man fishing by a river in rural Bangladesh 01.jpg",
  "vehicles-skateboard": "File:Skateboarder landing on the ground at Skatepark des Ursulines in Brussels (DSCF4506).jpg",
  "vehicles-sailboat": "File:Norderney, Segelboot -- 2025 -- 9153.jpg",
};

const OK_LICENSE = /^(cc[- ]by(-sa)?[- ]\d|cc0|public domain|pd)/i;
const BAD_TITLE = /(map|diagram|logo|icon|drawing|illustration|painting|svg|sketch|chart|stamp|coat of arms|flag|cartoon|vector|poster|screenshot|tabs|scheme)/i;

async function getJson(url: string): Promise<any> {
  for (let i = 0; i < 4; i++) {
    const r = await fetch(url, { headers: UA });
    if (r.ok) return r.json();
    await new Promise((res) => setTimeout(res, 1500 * (i + 1)));
  }
  throw new Error(`failed ${url}`);
}

type Hit = { title: string; url: string; w: number; h: number; author: string; license: string; page: string };

async function byTitle(title: string): Promise<Hit[]> {
  const u = new URL("https://commons.wikimedia.org/w/api.php");
  Object.entries({ action: "query", format: "json", titles: title, prop: "imageinfo", iiprop: "url|size|mime|extmetadata", iiurlwidth: "1100", origin: "*" })
    .forEach(([k, v]) => u.searchParams.set(k, v));
  const j = await getJson(u.toString());
  return parse(Object.values(j.query?.pages ?? {}), false);
}

async function search(q: string): Promise<Hit[]> {
  const u = new URL("https://commons.wikimedia.org/w/api.php");
  Object.entries({
    action: "query", format: "json", generator: "search", gsrnamespace: "6", gsrsearch: `${q} filetype:bitmap`, gsrlimit: "20",
    prop: "imageinfo", iiprop: "url|size|mime|extmetadata", iiurlwidth: "1100", origin: "*",
  }).forEach(([k, v]) => u.searchParams.set(k, v));
  const j = await getJson(u.toString());
  return parse(Object.values(j.query?.pages ?? {}).sort((a: any, b: any) => a.index - b.index), true);
}

function parse(pages: any[], filterTitle: boolean): Hit[] {
  const hits: Hit[] = [];
  for (const p of pages) {
    const ii = p.imageinfo?.[0];
    if (!ii || ii.mime !== "image/jpeg" || (filterTitle && BAD_TITLE.test(p.title))) continue;
    const md = ii.extmetadata ?? {};
    const license = String(md.LicenseShortName?.value ?? "");
    if (!OK_LICENSE.test(license.replace(/^CC BY/i, (m: string) => m))) continue;
    if (ii.width < 800 || ii.height < 500) continue;
    const author = String(md.Artist?.value ?? "").replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim().slice(0, 80) || "Unknown";
    hits.push({ title: p.title, url: ii.thumburl ?? ii.url, w: ii.width, h: ii.height, author, license, page: ii.descriptionurl });
  }
  return hits;
}

const sections: any[] = JSON.parse(fs.readFileSync(path.join(contentDir, "sections.json"), "utf8"));
const items: any[] = JSON.parse(fs.readFileSync(path.join(contentDir, "items.json"), "utf8"));
const only = process.env.ONLY === "pick" ? new Set(Object.keys(PICK)) : null;
const todo = items.filter((i) => (only ? only.has(i.id) : ORIGINAL.has(i.sectionId) && i.credit?.author === "Google (Noto Emoji)"));
console.log(`[photos] ${todo.length} emoji items in original sections`);

const report: string[] = [];
const failed: string[] = [];
for (const it of todo) {
  const pick = only ? PICK[it.id] : undefined;
  const q = pick && !pick.startsWith("File:") ? pick : Q[it.id] ?? `${it.en}`;
  let hits = pick?.startsWith("File:") ? await byTitle(pick) : await search(q);
  if (!hits.length) hits = await search(it.en);
  const hit = hits[0];
  if (!hit) { failed.push(`${it.id} (${q})`); continue; }
  report.push(`${it.id}: ${hit.title} | ${hit.license} | ${hit.author}`);
  if (dry) continue;
  const res = await fetch(hit.url, { headers: UA });
  if (!res.ok) { failed.push(`${it.id} download ${res.status}`); continue; }
  const buf = Buffer.from(await res.arrayBuffer());
  const out = path.join(incomingDir, "images", `${it.id}.webp`);
  const info = await sharp(buf).rotate().resize(960, 560, { fit: "cover", position: sharp.strategy.attention }).webp({ quality: 84 }).toFile(out);
  it.image = { file: `${it.id}.webp`, w: info.width, h: info.height, hasCutout: false };
  it.credit = { author: hit.author, license: hit.license, sourceUrl: hit.page, title: hit.title };
  await new Promise((r) => setTimeout(r, 400));
}

if (!dry) {
  for (const dir of [contentDir, incomingDir]) fs.writeFileSync(path.join(dir, "items.json"), JSON.stringify(items, null, 2) + "\n");
}
fs.writeFileSync(path.join(root, ".cache/photo-report.txt"), report.join("\n") + "\n");
console.log(`[photos] matched ${report.length}, failed ${failed.length}`);
if (failed.length) console.log("failed:\n  " + failed.join("\n  "));
