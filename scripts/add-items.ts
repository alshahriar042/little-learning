/**
 * Adds extra Picture Words items (and new sections) drawn from Google Noto Emoji artwork (Apache-2.0).
 * Idempotent: items whose id already exists are skipped. Writes incoming/ + content/ JSON and incoming/images/*.webp.
 *   npx tsx scripts/add-items.ts && npm run assets
 */
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const root = path.resolve(import.meta.dirname, "..");
const NOTO = "https://cdn.jsdelivr.net/gh/googlefonts/noto-emoji@v2.047/svg/";
const cacheDir = path.join(root, ".cache/noto");
fs.mkdirSync(cacheDir, { recursive: true });

type Row = [en: string, pron: string, bn: string, emoji: string];
type NewSection = { id: string; nameEn: string; nameBn: string; color: string };

const NEW_SECTIONS: NewSection[] = [
  { id: "colors", nameEn: "COLOURS", nameBn: "রং", color: "#e8590c" },
  { id: "shapes", nameEn: "SHAPES", nameBn: "আকার", color: "#7048e8" },
  { id: "clothes", nameEn: "CLOTHES", nameBn: "পোশাক", color: "#d6336c" },
  { id: "home", nameEn: "AT HOME", nameBn: "ঘরের জিনিস", color: "#5c7cfa" },
  { id: "school", nameEn: "SCHOOL", nameBn: "স্কুল", color: "#1c7ed6" },
  { id: "jobs", nameEn: "JOBS", nameBn: "পেশা", color: "#0ca678" },
  { id: "nature", nameEn: "SKY & NATURE", nameBn: "আকাশ ও প্রকৃতি", color: "#2f9bbf" },
  { id: "music", nameEn: "MUSIC", nameBn: "গান-বাজনা", color: "#ae3ec9" },
  { id: "places", nameEn: "PLACES", nameBn: "জায়গা", color: "#6b7280" },
  { id: "toys", nameEn: "TOYS & FUN", nameBn: "খেলনা ও মজা", color: "#e67700" },
];

const DATA: Record<string, Row[]> = {
  colors: [
    ["Red", "রেড", "লাল", "🔴"], ["Orange", "অরেঞ্জ", "কমলা", "🟠"], ["Yellow", "ইয়েলো", "হলুদ", "🟡"],
    ["Green", "গ্রিন", "সবুজ", "🟢"], ["Blue", "ব্লু", "নীল", "🔵"], ["Purple", "পার্পল", "বেগুনি", "🟣"],
    ["Brown", "ব্রাউন", "বাদামি", "🟤"], ["Black", "ব্ল্যাক", "কালো", "⚫"], ["White", "হোয়াইট", "সাদা", "⚪"],
    ["Pink", "পিংক", "গোলাপি", "🩷"], ["Grey", "গ্রে", "ধূসর", "🩶"],
  ],
  shapes: [
    ["Circle", "সার্কেল", "বৃত্ত", "⭕"], ["Square", "স্কয়ার", "বর্গ", "🟦"], ["Triangle", "ট্রায়াঙ্গেল", "ত্রিভুজ", "🔺"],
    ["Diamond", "ডায়মন্ড", "রম্বস", "🔷"], ["Star", "স্টার", "তারা", "⭐"], ["Heart", "হার্ট", "হৃদয়", "❤️"],
    ["Crescent", "ক্রেসেন্ট", "অর্ধচন্দ্র", "🌙"],
  ],
  clothes: [
    ["Shirt", "শার্ট", "শার্ট", "👕"], ["Trousers", "ট্রাউজার্স", "প্যান্ট", "👖"], ["Dress", "ড্রেস", "ফ্রক", "👗"],
    ["Shoes", "শুজ", "জুতা", "👟"], ["Sandal", "স্যান্ডেল", "স্যান্ডেল", "👡"], ["Socks", "সক্স", "মোজা", "🧦"],
    ["Cap", "ক্যাপ", "টুপি", "🧢"], ["Hat", "হ্যাট", "হ্যাট", "👒"], ["Jacket", "জ্যাকেট", "জ্যাকেট", "🧥"],
    ["Scarf", "স্কার্ফ", "স্কার্ফ", "🧣"], ["Gloves", "গ্লাভস", "দস্তানা", "🧤"], ["Glasses", "গ্লাসেস", "চশমা", "👓"],
    ["Umbrella", "আমব্রেলা", "ছাতা", "☂️"], ["Watch", "ওয়াচ", "হাতঘড়ি", "⌚"], ["Saree", "শাড়ি", "শাড়ি", "🥻"],
    ["Boots", "বুটস", "বুট জুতা", "🥾"], ["Necktie", "নেকটাই", "টাই", "👔"], ["Crown", "ক্রাউন", "মুকুট", "👑"],
  ],
  home: [
    ["Bed", "বেড", "বিছানা", "🛏️"], ["Chair", "চেয়ার", "চেয়ার", "🪑"], ["Door", "ডোর", "দরজা", "🚪"],
    ["Window", "উইন্ডো", "জানালা", "🪟"], ["Light Bulb", "লাইট বাল্ব", "বাতি", "💡"], ["Alarm Clock", "অ্যালার্ম ক্লক", "অ্যালার্ম ঘড়ি", "⏰"],
    ["Television", "টেলিভিশন", "টেলিভিশন", "📺"], ["Mobile Phone", "মোবাইল ফোন", "মোবাইল ফোন", "📱"], ["Key", "কি", "চাবি", "🔑"],
    ["Broom", "ব্রুম", "ঝাড়ু", "🧹"], ["Bucket", "বাকেট", "বালতি", "🪣"], ["Toothbrush", "টুথব্রাশ", "টুথব্রাশ", "🪥"],
    ["Soap", "সোপ", "সাবান", "🧼"], ["Mirror", "মিরর", "আয়না", "🪞"], ["Sofa", "সোফা", "সোফা", "🛋️"],
    ["Bathtub", "বাথটাব", "বাথটাব", "🛁"], ["Shower", "শাওয়ার", "ঝরনা", "🚿"], ["Candle", "ক্যান্ডেল", "মোমবাতি", "🕯️"],
    ["Spoon", "স্পুন", "চামচ", "🥄"], ["Fork and Plate", "ফর্ক অ্যান্ড প্লেট", "থালা ও কাঁটাচামচ", "🍽️"], ["Bowl", "বোল", "বাটি", "🥣"],
    ["Cooking Pot", "কুকিং পট", "হাঁড়ি", "🍲"], ["Computer", "কম্পিউটার", "কম্পিউটার", "💻"], ["Camera", "ক্যামেরা", "ক্যামেরা", "📷"],
    ["Radio", "রেডিও", "রেডিও", "📻"],
  ],
  school: [
    ["Book", "বুক", "বই", "📖"], ["Books", "বুকস", "বইয়ের সারি", "📚"], ["Pencil", "পেনসিল", "পেনসিল", "✏️"],
    ["Pen", "পেন", "কলম", "🖊️"], ["Notebook", "নোটবুক", "খাতা", "📓"], ["Ruler", "রুলার", "স্কেল", "📏"],
    ["School", "স্কুল", "স্কুল", "🏫"], ["School Bag", "স্কুল ব্যাগ", "স্কুল ব্যাগ", "🎒"], ["Paintbrush", "পেইন্টব্রাশ", "তুলি", "🖌️"],
    ["Crayon", "ক্রেয়ন", "ক্রেয়ন", "🖍️"], ["World Map", "ওয়ার্ল্ড ম্যাপ", "মানচিত্র", "🗺️"], ["Abacus", "অ্যাবাকাস", "গণনা যন্ত্র", "🧮"],
    ["Paperclip", "পেপারক্লিপ", "ক্লিপ", "📎"], ["Magnifying Glass", "ম্যাগনিফাইং গ্লাস", "আতশ কাচ", "🔍"], ["Microscope", "মাইক্রোস্কোপ", "অণুবীক্ষণ যন্ত্র", "🔬"],
    ["Telescope", "টেলিস্কোপ", "দূরবীক্ষণ যন্ত্র", "🔭"], ["Graduation Cap", "গ্র্যাজুয়েশন ক্যাপ", "স্নাতকের টুপি", "🎓"], ["Colour Palette", "কালার প্যালেট", "রঙের পাত্র", "🎨"],
    ["Letter", "লেটার", "চিঠি", "✉️"],
  ],
  jobs: [
    ["Doctor", "ডক্টর", "ডাক্তার", "🧑‍⚕️"], ["Teacher", "টিচার", "শিক্ষক", "🧑‍🏫"], ["Farmer", "ফার্মার", "কৃষক", "🧑‍🌾"],
    ["Cook", "কুক", "রাঁধুনি", "🧑‍🍳"], ["Police Officer", "পুলিশ অফিসার", "পুলিশ", "👮"], ["Firefighter", "ফায়ারফাইটার", "দমকলকর্মী", "🧑‍🚒"],
    ["Pilot", "পাইলট", "পাইলট", "🧑‍✈️"], ["Astronaut", "অ্যাস্ট্রোনট", "মহাকাশচারী", "🧑‍🚀"], ["Mechanic", "মেকানিক", "মিস্ত্রি", "🧑‍🔧"],
    ["Artist", "আর্টিস্ট", "শিল্পী", "🧑‍🎨"], ["Scientist", "সায়েন্টিস্ট", "বিজ্ঞানী", "🧑‍🔬"], ["Judge", "জাজ", "বিচারক", "🧑‍⚖️"],
    ["Builder", "বিল্ডার", "নির্মাণশ্রমিক", "👷"], ["Singer", "সিঙ্গার", "গায়ক", "🧑‍🎤"], ["Factory Worker", "ফ্যাক্টরি ওয়ার্কার", "কারখানার কর্মী", "🧑‍🏭"],
  ],
  nature: [
    ["Sun", "সান", "সূর্য", "☀️"], ["Moon", "মুন", "চাঁদ", "🌕"], ["Shooting Star", "শুটিং স্টার", "উল্কা", "🌠"],
    ["Cloud", "ক্লাউড", "মেঘ", "☁️"], ["Rain", "রেইন", "বৃষ্টি", "🌧️"], ["Rainbow", "রেইনবো", "রংধনু", "🌈"],
    ["Lightning", "লাইটনিং", "বজ্রপাত", "⚡"], ["Snowflake", "স্নোফ্লেক", "তুষারকণা", "❄️"], ["Snowman", "স্নোম্যান", "তুষার মানব", "⛄"],
    ["Wind", "উইন্ড", "বাতাস", "🌬️"], ["Tornado", "টর্নেডো", "ঘূর্ণিঝড়", "🌪️"], ["Fire", "ফায়ার", "আগুন", "🔥"],
    ["Water Drop", "ওয়াটার ড্রপ", "পানির ফোঁটা", "💧"], ["Mountain", "মাউন্টেন", "পাহাড়", "⛰️"], ["Volcano", "ভলক্যানো", "আগ্নেয়গিরি", "🌋"],
    ["Earth", "আর্থ", "পৃথিবী", "🌍"], ["Wave", "ওয়েভ", "ঢেউ", "🌊"], ["Island", "আইল্যান্ড", "দ্বীপ", "🏝️"],
    ["Desert", "ডেজার্ট", "মরুভূমি", "🏜️"], ["Sunrise", "সানরাইজ", "সূর্যোদয়", "🌅"], ["Comet", "কমেট", "ধূমকেতু", "☄️"],
    ["Fog", "ফগ", "কুয়াশা", "🌫️"],
  ],
  music: [
    ["Guitar", "গিটার", "গিটার", "🎸"], ["Piano", "পিয়ানো", "পিয়ানো", "🎹"], ["Drum", "ড্রাম", "ঢোল", "🥁"],
    ["Violin", "ভায়োলিন", "বেহালা", "🎻"], ["Trumpet", "ট্রাম্পেট", "ট্রাম্পেট", "🎺"], ["Saxophone", "স্যাক্সোফোন", "স্যাক্সোফোন", "🎷"],
    ["Microphone", "মাইক্রোফোন", "মাইক্রোফোন", "🎤"], ["Headphones", "হেডফোন", "হেডফোন", "🎧"], ["Bell", "বেল", "ঘণ্টা", "🔔"],
    ["Musical Note", "মিউজিক্যাল নোট", "সুর", "🎵"], ["Banjo", "ব্যাঞ্জো", "ব্যাঞ্জো", "🪕"], ["Long Drum", "লং ড্রাম", "মাদল", "🪘"],
  ],
  places: [
    ["House", "হাউস", "বাড়ি", "🏠"], ["Hospital", "হসপিটাল", "হাসপাতাল", "🏥"], ["Mosque", "মস্ক", "মসজিদ", "🕌"],
    ["Temple", "টেম্পল", "মন্দির", "🛕"], ["Church", "চার্চ", "গির্জা", "⛪"], ["Shop", "শপ", "দোকান", "🏪"],
    ["Bank", "ব্যাংক", "ব্যাংক", "🏦"], ["Post Office", "পোস্ট অফিস", "ডাকঘর", "🏣"], ["Bridge", "ব্রিজ", "সেতু", "🌉"],
    ["Fountain", "ফাউন্টেন", "ফোয়ারা", "⛲"], ["Castle", "ক্যাসল", "দুর্গ", "🏰"], ["Tent", "টেন্ট", "তাঁবু", "⛺"],
    ["Park", "পার্ক", "পার্ক", "🏞️"], ["Factory", "ফ্যাক্টরি", "কারখানা", "🏭"], ["Train Station", "ট্রেন স্টেশন", "রেল স্টেশন", "🚉"],
    ["Office Building", "অফিস বিল্ডিং", "অফিস", "🏢"], ["Hotel", "হোটেল", "হোটেল", "🏨"], ["Stadium", "স্টেডিয়াম", "স্টেডিয়াম", "🏟️"],
    ["Tower", "টাওয়ার", "মিনার", "🗼"], ["Hut", "হাট", "কুঁড়েঘর", "🛖"],
  ],
  toys: [
    ["Teddy Bear", "টেডি বিয়ার", "টেডি বিয়ার", "🧸"], ["Kite", "কাইট", "ঘুড়ি", "🪁"], ["Balloon", "বেলুন", "বেলুন", "🎈"],
    ["Doll", "ডল", "পুতুল", "🪆"], ["Puzzle", "পাজল", "ধাঁধার টুকরো", "🧩"], ["Dice", "ডাইস", "লুডুর ছক্কা", "🎲"],
    ["Yo-yo", "ইয়ো-ইয়ো", "ইয়ো-ইয়ো", "🪀"], ["Toy Robot", "টয় রোবট", "রোবট", "🤖"], ["Gift", "গিফট", "উপহার", "🎁"],
    ["Party", "পার্টি", "উৎসব", "🎉"], ["Ferris Wheel", "ফেরিস হুইল", "নাগরদোলা", "🎡"], ["Carousel Horse", "ক্যারাউসেল হর্স", "ঘোড়ার নাগরদোলা", "🎠"],
    ["Magic Wand", "ম্যাজিক ওয়ান্ড", "জাদুকাঠি", "🪄"], ["Bubbles", "বাবলস", "বুদবুদ", "🫧"], ["Boomerang", "বুমেরাং", "বুমেরাং", "🪃"],
  ],
  // extra words for the existing sections
  animals: [
    ["Dinosaur", "ডাইনোসর", "ডাইনোসর", "🦖"], ["Long-neck Dinosaur", "লং-নেক ডাইনোসর", "লম্বা গলার ডাইনোসর", "🦕"],
    ["Hedgehog", "হেজহগ", "সজারু-ছানা", "🦔"], ["Beaver", "বিভার", "বিভার", "🦫"], ["Bison", "বাইসন", "বাইসন", "🦬"], ["Mammoth", "ম্যামথ", "ম্যামথ", "🦣"],
  ],
  birds: [
    ["Turkey", "টার্কি", "টার্কি", "🦃"], ["Chick", "চিক", "মুরগির ছানা", "🐤"], ["Bird", "বার্ড", "পাখি", "🐦"],
    ["Goose", "গুজ", "রাজহাঁস", "🪿"], ["Egg and Chick", "এগ অ্যান্ড চিক", "ডিম থেকে ছানা", "🐣"],
  ],
  fruits: [["Blueberries", "ব্লুবেরিজ", "ব্লুবেরি", "🫐"], ["Olive", "অলিভ", "জলপাই", "🫒"], ["Mandarin", "ম্যান্ডারিন", "মাল্টা", "🍊"]],
  "flowers-plants": [
    ["Seedling", "সিডলিং", "চারা গাছ", "🌱"], ["Leaf", "লিফ", "পাতা", "🍃"], ["Maple Leaf", "ম্যাপল লিফ", "ম্যাপল পাতা", "🍁"],
    ["Clover", "ক্লোভার", "ক্লোভার", "🍀"], ["Herb", "হার্ব", "ঔষধি গাছ", "🌿"], ["Bamboo", "বাম্বু", "বাঁশ", "🎍"],
    ["Rice Plant", "রাইস প্লান্ট", "ধানের শীষ", "🌾"], ["Pine Tree", "পাইন ট্রি", "পাইন গাছ", "🌲"], ["Big Tree", "বিগ ট্রি", "বড় গাছ", "🌳"],
  ],
  "fish-sea": [["Shell", "শেল", "ঝিনুক", "🐚"], ["Oyster", "অয়েস্টার", "বড় ঝিনুক", "🦪"], ["Coral", "কোরাল", "প্রবাল", "🪸"], ["Jellyfish", "জেলিফিশ", "জেলিফিশ", "🪼"]],
  vehicles: [
    ["Skateboard", "স্কেটবোর্ড", "স্কেটবোর্ড", "🛹"], ["Sailboat", "সেইলবোট", "পালতোলা নৌকা", "⛵"], ["Parachute", "প্যারাস্যুট", "প্যারাশুট", "🪂"],
    ["Satellite", "স্যাটেলাইট", "কৃত্রিম উপগ্রহ", "🛰️"], ["Flying Saucer", "ফ্লাইং সসার", "উড়ন্ত চাকতি", "🛸"], ["Steam Train", "স্টিম ট্রেন", "বাষ্পীয় ইঞ্জিন", "🚂"],
    ["Racing Car", "রেসিং কার", "রেসিং কার", "🏎️"], ["Roller Skate", "রোলার স্কেট", "রোলার স্কেট", "🛼"], ["Monorail", "মনোরেল", "মনোরেল", "🚝"],
  ],
  "human-body": [
    ["Lips", "লিপস", "ঠোঁট", "👄"], ["Palm", "পাম", "হাতের তালু", "🖐️"],
    ["Victory Hand", "ভিক্টরি হ্যান্ড", "বিজয় চিহ্ন", "✌️"], ["Thumbs Up", "থাম্বস আপ", "বৃদ্ধাঙ্গুলি তোলা", "👍"],
  ],
  food: [
    ["Pancakes", "প্যানকেকস", "প্যানকেক", "🥞"], ["Waffle", "ওয়াফেল", "ওয়াফেল", "🧇"], ["Cookie", "কুকি", "কুকি", "🍪"], ["Pie", "পাই", "পাই", "🥧"],
    ["Croissant", "ক্রোয়াসঁ", "ক্রোয়াসঁ", "🥐"], ["Taco", "টাকো", "টাকো", "🌮"], ["Sushi", "সুশি", "সুশি", "🍣"], ["Dumpling", "ডাম্পলিং", "পুলি পিঠা", "🥟"],
    ["Cupcake", "কাপকেক", "কাপকেক", "🧁"], ["Lollipop", "ললিপপ", "লজেন্স", "🍭"],
  ],
  drinks: [["Coconut Water", "কোকোনাট ওয়াটার", "ডাবের পানি", "🥥"], ["Mate", "ম্যাট", "ম্যাট চা", "🧉"]],
  sports: [
    ["Bowling", "বোলিং", "বোলিং", "🎳"], ["Darts", "ডার্টস", "লক্ষ্যভেদ", "🎯"], ["Skiing", "স্কিয়িং", "স্কি", "⛷️"],
    ["Surfing", "সার্ফিং", "ঢেউয়ে চড়া", "🏄"], ["Fishing", "ফিশিং", "মাছ ধরা", "🎣"], ["Medal", "মেডেল", "পদক", "🏅"],
  ],
  insects: [["Cricket Insect", "ক্রিকেট ইনসেক্ট", "ঝিঁঝিঁ পোকা", "🦗"], ["Spider Web", "স্পাইডার ওয়েব", "মাকড়সার জাল", "🕸️"], ["Microbe", "মাইক্রোব", "জীবাণু", "🦠"]],
};

const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
const codepoints = (e: string) => Array.from(e).map((c) => c.codePointAt(0)!.toString(16)).filter((h) => h !== "fe0f").join("_");

async function svgFor(emoji: string): Promise<Buffer | null> {
  const name = `emoji_u${codepoints(emoji)}.svg`;
  const cached = path.join(cacheDir, name);
  if (fs.existsSync(cached)) return fs.readFileSync(cached);
  const res = await fetch(NOTO + name);
  if (!res.ok) return null;
  const buf = Buffer.from(await res.arrayBuffer());
  fs.writeFileSync(cached, buf);
  return buf;
}

/** mixes a #rrggbb colour with white */
function tint(hex: string, amount: number) {
  const n = parseInt(hex.slice(1), 16);
  const mix = (c: number) => Math.round(c + (255 - c) * amount);
  return { r: mix(n >> 16), g: mix((n >> 8) & 255), b: mix(n & 255) };
}

const W = 960, H = 720;
async function renderCard(svg: Buffer, color: string, outFile: string) {
  const icon = await sharp(svg, { density: 300 }).resize({ height: 540, width: 540, fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer();
  await sharp({ create: { width: W, height: H, channels: 3, background: tint(color, 0.88) } })
    .composite([{ input: icon, gravity: "center" }]).webp({ quality: 88 }).toFile(outFile);
}

const readJson = (p: string) => JSON.parse(fs.readFileSync(p, "utf8"));
const contentDir = path.join(root, "content/picture-words");
const incomingDir = path.join(root, "incoming");
const sections: any[] = readJson(path.join(contentDir, "sections.json"));
const items: any[] = readJson(path.join(contentDir, "items.json"));

let order = Math.max(...sections.map((s) => s.order));
for (const ns of NEW_SECTIONS) if (!sections.some((s) => s.id === ns.id)) sections.push({ ...ns, order: ++order });

const have = new Set(items.map((i) => i.id));
const haveEn = new Set(items.map((i) => `${i.sectionId}/${i.en.toLowerCase()}`));
let added = 0;
const missing: string[] = [];
for (const [sectionId, rows] of Object.entries(DATA)) {
  const section = sections.find((s) => s.id === sectionId);
  if (!section) throw new Error(`unknown section ${sectionId}`);
  for (const [en, bnPron, bnMeaning, emoji] of rows) {
    const id = `${sectionId}-${slug(en)}`;
    if (have.has(id) || haveEn.has(`${sectionId}/${en.toLowerCase()}`)) continue;
    const svg = await svgFor(emoji);
    if (!svg) { missing.push(`${en} ${emoji}`); continue; }
    const file = `${id}.webp`;
    await renderCard(svg, section.color, path.join(incomingDir, "images", file));
    items.push({
      id, sectionId, en, bnPron, bnMeaning, emoji,
      image: { file, w: W, h: H, hasCutout: false },
      credit: { author: "Google (Noto Emoji)", license: "Apache-2.0", sourceUrl: "https://github.com/googlefonts/noto-emoji", title: `emoji_u${codepoints(emoji)}.svg` },
    });
    have.add(id); added++;
  }
}

// keep items grouped by section order, preserving the existing order inside each section
const rank = new Map(sections.map((s) => [s.id, s.order]));
items.sort((a, b) => (rank.get(a.sectionId)! - rank.get(b.sectionId)!));
for (const dir of [contentDir, incomingDir]) {
  fs.writeFileSync(path.join(dir, "sections.json"), JSON.stringify(sections, null, 2) + "\n");
  fs.writeFileSync(path.join(dir, "items.json"), JSON.stringify(items, null, 2) + "\n");
}
console.log(`[add-items] added ${added} items, ${sections.length} sections, ${items.length} items total`);
if (missing.length) console.log(`[add-items] no Noto artwork for: ${missing.join(", ")}`);
