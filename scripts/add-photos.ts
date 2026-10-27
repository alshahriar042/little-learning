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
  "clothes-trousers": "jeans trousers",
  "clothes-dress": "dress",
  "clothes-sandal": "sandals",
  "clothes-socks": "socks",
  "clothes-hat": "hat",
  "clothes-jacket": "jacket",
  "clothes-scarf": "scarf",
  "clothes-gloves": "gloves",
  "clothes-glasses": "eyeglasses",
  "clothes-necktie": "necktie",
  "clothes-crown": "crown",
  "home-light-bulb": "light bulb",
  "home-bucket": "bucket",
  "home-mirror": "mirror",
  "home-fork-and-plate": "fork plate",
  "home-spoon": "spoon",
  "home-radio": "radio",
  "home-camera": "digital camera",
  "home-mobile-phone": "smartphone",
  "home-bowl": "bowl",
  "school-book": "book",
  "school-pencil": "pencils",
  "school-abacus": "abacus",
  "school-paperclip": "paper clips",
  "jobs-doctor": "doctor",
  "jobs-teacher": "teacher",
  "jobs-pilot": "pilot",
  "jobs-judge": "judge",
  "jobs-factory-worker": "garment worker",
  "nature-fog": "fog",
  "music-drum": "drum",
  "music-violin": "violin",
  "places-hospital": "hospital",
  "places-mosque": "mosque",
  "places-shop": "shop",
  "places-post-office": "post office",
  "places-park": "park",
  "places-office-building": "office building",
  "toys-kite": "kite",
  "toys-doll": "doll",
  "toys-yo-yo": "yo-yo",
  "toys-party": "party",
  "toys-magic-wand": "magic wand"
};

/** MODE=new: photos for the 10 later sections (colours & shapes stay graphic cards: a "red" photo is ambiguous) */
const NEW_SECTIONS = new Set(["clothes", "home", "school", "jobs", "nature", "music", "places", "toys"]);
const HINT: Record<string, string> = { clothes: "clothing", home: "household object", school: "school supplies", jobs: "at work profession", nature: "", music: "musical instrument", places: "building", toys: "toy" };
const Q2: Record<string, string> = {
  "clothes-shirt": "men's shirt clothing", "clothes-trousers": "trousers jeans folded", "clothes-dress": "girl's dress", "clothes-shoes": "sneakers shoes pair", "clothes-sandal": "sandals footwear",
  "clothes-socks": "socks pair", "clothes-cap": "baseball cap", "clothes-hat": "straw hat", "clothes-jacket": "jacket", "clothes-scarf": "woollen scarf", "clothes-gloves": "winter gloves",
  "clothes-glasses": "eyeglasses", "clothes-umbrella": "umbrella open", "clothes-watch": "wristwatch", "clothes-saree": "saree Bangladesh woman", "clothes-boots": "leather boots", "clothes-necktie": "necktie", "clothes-crown": "gold crown",
  "home-bed": "bed bedroom", "home-chair": "wooden chair", "home-door": "wooden door", "home-window": "window", "home-light-bulb": "incandescent light bulb", "home-alarm-clock": "alarm clock",
  "home-television": "television set", "home-mobile-phone": "smartphone", "home-key": "house key", "home-broom": "broom", "home-bucket": "plastic bucket", "home-toothbrush": "toothbrush",
  "home-soap": "bar of soap", "home-mirror": "mirror", "home-sofa": "sofa living room", "home-bathtub": "bathtub", "home-shower": "shower head", "home-candle": "burning candle",
  "home-spoon": "spoon", "home-fork-and-plate": "plate with fork", "home-bowl": "bowl", "home-cooking-pot": "cooking pot", "home-computer": "desktop computer", "home-camera": "camera", "home-radio": "radio",
  "school-book": "open book", "school-books": "stack of books", "school-pencil": "pencil", "school-pen": "ballpoint pen", "school-notebook": "notebook", "school-ruler": "ruler",
  "school-school": "primary school building Bangladesh", "school-school-bag": "school bag backpack", "school-paintbrush": "paintbrush", "school-crayon": "crayons", "school-world-map": "world map globe",
  "school-abacus": "abacus", "school-paperclip": "paper clips", "school-magnifying-glass": "magnifying glass", "school-microscope": "microscope", "school-telescope": "telescope", "school-graduation-cap": "graduation cap mortarboard", "school-colour-palette": "paint palette", "school-letter": "envelope letter",
  "jobs-doctor": "doctor stethoscope", "jobs-teacher": "teacher classroom blackboard", "jobs-farmer": "farmer field Bangladesh", "jobs-cook": "chef cooking kitchen", "jobs-police-officer": "police officer", "jobs-firefighter": "firefighter",
  "jobs-pilot": "airline pilot cockpit", "jobs-astronaut": "astronaut spacesuit", "jobs-mechanic": "car mechanic", "jobs-artist": "painter artist painting", "jobs-scientist": "scientist laboratory", "jobs-judge": "judge gavel court",
  "jobs-builder": "construction worker helmet", "jobs-singer": "singer microphone stage", "jobs-factory-worker": "factory worker garments Bangladesh",
  "nature-sun": "sun sky", "nature-moon": "full moon", "nature-shooting-star": "meteor shower night sky", "nature-cloud": "white clouds blue sky", "nature-rain": "rain falling", "nature-rainbow": "rainbow",
  "nature-lightning": "lightning storm", "nature-snowflake": "snowflake macro", "nature-snowman": "snowman", "nature-wind": "windmill wind blowing trees", "nature-tornado": "tornado", "nature-fire": "campfire flames",
  "nature-water-drop": "water drop", "nature-mountain": "mountain peak", "nature-volcano": "volcano eruption", "nature-earth": "Earth from space", "nature-wave": "ocean wave", "nature-island": "tropical island",
  "nature-desert": "sand dunes desert", "nature-sunrise": "sunrise", "nature-comet": "comet night sky", "nature-fog": "fog morning landscape",
  "music-guitar": "acoustic guitar", "music-piano": "piano keys", "music-drum": "drum", "music-violin": "violin", "music-trumpet": "trumpet", "music-saxophone": "saxophone",
  "music-microphone": "microphone", "music-headphones": "headphones", "music-bell": "brass bell", "music-musical-note": "sheet music notes", "music-banjo": "banjo", "music-long-drum": "dhol drum Bangladesh",
  "places-house": "house", "places-hospital": "hospital building", "places-mosque": "mosque", "places-temple": "Hindu temple", "places-church": "church", "places-shop": "village shop Bangladesh", "places-bank": "bank building",
  "places-post-office": "post office", "places-bridge": "bridge", "places-fountain": "fountain", "places-castle": "castle", "places-tent": "camping tent", "places-park": "park trees", "places-factory": "factory chimneys",
  "places-train-station": "railway station", "places-office-building": "office building skyscraper", "places-hotel": "hotel building", "places-stadium": "football stadium", "places-tower": "tower", "places-hut": "village hut Bangladesh",
  "toys-teddy-bear": "teddy bear", "toys-kite": "kite flying", "toys-balloon": "balloons", "toys-doll": "doll", "toys-puzzle": "jigsaw puzzle", "toys-dice": "dice", "toys-yo-yo": "yo-yo", "toys-toy-robot": "toy robot",
  "toys-gift": "gift box ribbon", "toys-party": "birthday party", "toys-ferris-wheel": "ferris wheel", "toys-carousel-horse": "carousel horse", "toys-magic-wand": "magic wand", "toys-bubbles": "soap bubbles", "toys-boomerang": "boomerang",
};

const OK_LICENSE = /^(cc[- ]by(-sa)?[- ]\d|cc0|public domain|pd)/i;
const BAD_TITLE = /(map|diagram|logo|icon|drawing|illustration|painting|svg|sketch|chart|stamp|coat of arms|flag|cartoon|vector|poster|screenshot|tabs|scheme)/i;

async function getJson(url: string): Promise<any> {
  for (let i = 0; i < 6; i++) {
    const r = await fetch(url, { headers: UA });
    if (r.ok) return r.json();
    await new Promise((res) => setTimeout(res, 6000 * (i + 1)));
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
const newMode = process.env.MODE === "new";
const only = process.env.ONLY === "pick" ? new Set(Object.keys(PICK)) : null;
const todo = items.filter((i) => (newMode ? NEW_SECTIONS.has(i.sectionId) && i.credit?.author === "Google (Noto Emoji)" : only ? only.has(i.id) : ORIGINAL.has(i.sectionId) && i.credit?.author === "Google (Noto Emoji)"));
console.log(`[photos] ${todo.length} emoji items in original sections`);

const report: string[] = [];
const failed: string[] = [];
for (const it of todo) {
  try {
  const pick = only ? PICK[it.id] : undefined;
  const q = pick && !pick.startsWith("File:") ? pick : newMode ? Q2[it.id] ?? `${it.en} ${HINT[it.sectionId] ?? ""}` : Q[it.id] ?? `${it.en}`;
  let hits = pick?.startsWith("File:") ? await byTitle(pick) : await search(q);
  if (!hits.length) hits = await search(it.en);
  const kw = it.en.toLowerCase().split(" ").pop()!.replace(/s$/, "");
  const hit = (newMode || only ? hits.find((h) => h.title.toLowerCase().includes(kw)) : undefined) ?? hits[0];
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
  await new Promise((r) => setTimeout(r, 1500));
  } catch (e) { failed.push(`${it.id} ${(e as Error).message.slice(0, 60)}`); await new Promise((r) => setTimeout(r, 15000)); }
}

if (!dry) {
  for (const dir of [contentDir, incomingDir]) fs.writeFileSync(path.join(dir, "items.json"), JSON.stringify(items, null, 2) + "\n");
}
fs.writeFileSync(path.join(root, ".cache/photo-report.txt"), report.join("\n") + "\n");
console.log(`[photos] matched ${report.length}, failed ${failed.length}`);
if (failed.length) console.log("failed:\n  " + failed.join("\n  "));
