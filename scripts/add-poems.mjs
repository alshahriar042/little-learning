// Adds grade-wise (Class 1-5) poems to content/poems/poems.json. Idempotent. Run: node scripts/add-poems.mjs && npm run assets
import fs from "node:fs";

const file = "content/poems/poems.json";
const poems = JSON.parse(fs.readFileSync(file, "utf8"));
const grades = { "chand-mama": 1, "ghum-parani": 1, "ata-gache": 1, "hattima-tim-tim": 1, "tara-jhilmil": 1, "khoka-ghumalo": 2, "brishti-pore": 2, "pakhi-sob": 3, "taal-gach": 3, "chhoto-nodi": 4 };
for (const p of poems) if (grades[p.id]) p.grade = grades[p.id];

const ORIG = "Original for this app (এই অ্যাপের জন্য লেখা)";
const TRAD = "Traditional Bengali rhyme (ঐতিহ্যবাহী ছড়া)";
// [id, grade, titleBn, titleEn, emoji, source, [[bn, en], ...]]
const NEW = [
  ["count-one-ten", 1, "এক দুই তিন", "One Two Three", "🔢", ORIG, [
    ["এক দুই তিন চার, গাছে পাখি চার", "One, two, three, four - four birds in the tree"],
    ["পাঁচ ছয় সাত আট, নদীর ধারে হাট", "Five, six, seven, eight - a market by the river"],
    ["নয় দশ হল শেষ, গুনতে পারি বেশ", "Nine, ten, the end - I can count so well"]]],
  ["ma-amar", 1, "মা আমার", "My Mother", "💛", ORIG, [
    ["মা আমার সোনামণি", "My mother is my golden jewel"],
    ["মায়ের মুখে হাসিখানি", "A smile on my mother's face"],
    ["মা যে আমার আলো", "My mother is my light"],
    ["মাকে বাসি ভালো", "I love my mother"]]],
  ["pakhi-rang", 1, "পাখির রং", "Colours of Birds", "🦜", ORIG, [
    ["টিয়া পাখি সবুজ রঙের", "The parrot is green"],
    ["দোয়েল পাখি সাদা-কালো", "The magpie-robin is black and white"],
    ["কোকিল ডাকে কুহু কুহু", "The koel calls kuhu-kuhu"],
    ["সবাইকে লাগে ভালো", "I like them all"]]],
  ["dol-dolooni", 1, "দোল দোল দোলুনি", "Rock, Rock, Cradle", "🪁", TRAD, [
    ["দোল দোল দোলুনি, রাঙা মাথায় চিরুনি", "Rock, rock, cradle, a comb in her rosy hair"],
    ["বর আসবে এখুনি, নিয়ে যাবে তখুনি", "The groom will come soon and take her away"]]],
  ["rong", 1, "রঙের ছড়া", "Rhyme of Colours", "🎨", ORIG, [
    ["আকাশ নীল, মেঘ সাদা", "The sky is blue, the clouds are white"],
    ["পাতা সবুজ, জবা লাল", "The leaf is green, the hibiscus is red"],
    ["গাঁদা হলুদ, মাটি কালো", "The marigold is yellow, the soil is dark"],
    ["রঙিন এ দুনিয়া ভালো", "This colourful world is lovely"]]],
  ["saf-habit", 2, "পরিষ্কার থাকি", "Staying Clean", "🪥", ORIG, [
    ["সকালে উঠে হাত-মুখ ধুই", "I wake up and wash my hands and face"],
    ["দাঁত মেজে রোজ পরিষ্কার হই", "I brush my teeth and get clean every day"],
    ["খাওয়ার আগে হাত ধুয়ে নিই", "I wash my hands before I eat"],
    ["তাই তো আমি সুস্থ থাকি, ভাই", "That is why I stay healthy, brother"]]],
  ["agdum-bagdum", 2, "আগডুম বাগডুম", "Agdum Bagdum", "🥁", TRAD, [
    ["আগডুম বাগডুম ঘোড়াডুম সাজে", "Agdum bagdum, the horses are dressed"],
    ["ঢাক মৃদঙ্গ ঝাঁঝর বাজে", "Drums and cymbals are playing"],
    ["বাজতে বাজতে চলল ঢুলি", "Playing and playing, the drummer goes"],
    ["ঢুলি গেল কমলাপুলি", "The drummer went to Komolapuli"]]],
  ["saptaha", 2, "সপ্তাহের দিন", "Days of the Week", "📅", ORIG, [
    ["রবি সোম মঙ্গল বুধ বৃহস্পতি", "Sunday, Monday, Tuesday, Wednesday, Thursday"],
    ["পাঁচ দিন স্কুলে যাই, ভালো থাকে মতি", "Five days I go to school, my mind stays bright"],
    ["শুক্র আর শনিবার ছুটির আনন্দ", "Friday and Saturday are the joy of holiday"],
    ["খেলাধুলা গল্পেতে মেতে থাকি ছন্দ", "Playing and storytelling, I am full of rhythm"]]],
  ["nouka", 2, "নদীর বুকে নৌকা", "Boat on the River", "⛵", ORIG, [
    ["নদীর বুকে নৌকা চলে", "A boat moves on the river's chest"],
    ["দোল খায় ঢেউয়ের তালে", "Rocking to the rhythm of the waves"],
    ["মাঝি ভাই গান ধরে", "The boatman starts to sing"],
    ["পাল ওড়ে হাওয়ার জোরে", "The sail flies in the strong wind"]]],
  ["jatiyo-pakhi-ful", 2, "আমার দেশের পাখি-ফুল", "Bird and Flower of My Land", "🇧🇩", ORIG, [
    ["দোয়েল আমাদের জাতীয় পাখি", "The magpie-robin is our national bird"],
    ["শাপলা ফুল ভাসে জলে", "The water lily floats on the water"],
    ["কাঁঠাল ফল, ইলিশ মাছ", "The jackfruit, the hilsa fish"],
    ["সবই আমার দেশের কোলে", "All are in my country's lap"]]],
  ["gach-lagai", 3, "গাছ লাগাই", "Let Us Plant Trees", "🌳", ORIG, [
    ["এসো সবাই গাছ লাগাই", "Come, everyone, let us plant trees"],
    ["ছায়া আর ফল পাই", "We get shade and fruit"],
    ["গাছ দেয় শীতল হাওয়া", "Trees give cool breeze"],
    ["গাছেই পাখির গান গাওয়া", "Birds sing in the trees"],
    ["গাছ বাঁচলে প্রাণ বাঁচে", "When trees live, life lives"],
    ["সবুজ থাকুক সবার কাছে", "May green stay near everyone"]]],
  ["bhasha-dibos", 3, "আমার ভাষা", "My Language", "📖", ORIG, [
    ["বাংলা আমার মায়ের ভাষা", "Bangla is my mother's language"],
    ["বাংলা মুখের গান", "Bangla is the song of my lips"],
    ["এই ভাষাতেই কথা বলতে", "To speak in this language"],
    ["ভাইয়েরা দিল প্রাণ", "Our brothers gave their lives"],
    ["একুশে ফেব্রুয়ারি এলে", "When the twenty-first of February comes"],
    ["শহিদ মিনারে যাই", "I go to the Shaheed Minar"],
    ["ফুল দিয়ে সেই বীরদের", "With flowers to those heroes"],
    ["শ্রদ্ধা জানাই ভাই", "I offer my respect, brother"]]],
  ["chhoy-ritu", 3, "ছয় ঋতু", "Six Seasons", "🌦️", ORIG, [
    ["গ্রীষ্মে পাকে আম-কাঁঠাল", "In summer, mangoes and jackfruit ripen"],
    ["বর্ষায় আসে বাদল-কাল", "In the monsoon, the rainy time comes"],
    ["শরতে ফোটে কাশের ফুল", "In autumn, the kash flowers bloom"],
    ["শিউলি ঝরে, গন্ধে মশগুল", "Shiuli flowers fall, full of fragrance"],
    ["হেমন্তে ধান সোনার মতো", "In late autumn, the rice is like gold"],
    ["শীতে পিঠা খাই যে কত", "In winter, I eat so many pithas"],
    ["বসন্তে ফোটে ফুলের হাসি", "In spring, flowers smile"],
    ["ছয় ঋতুকে ভালোবাসি", "I love all six seasons"]]],
  ["somoy", 4, "সময়ের মূল্য", "The Value of Time", "⏰", ORIG, [
    ["সময় চলে নদীর মতো", "Time flows like a river"],
    ["একবার গেলে আসে না", "Once gone, it never returns"],
    ["যে কাজ আছে আজই করি", "The work that is due, I do today"],
    ["কালকে ফেলে রাখি না", "I do not leave it for tomorrow"],
    ["পড়ার সময় পড়ে যাই", "At study time I study"],
    ["খেলার সময় খেলি", "At play time I play"],
    ["সময় মেনে চললে ভাই", "If we follow the clock, brother"],
    ["সফল হওয়া কঠিন নাই", "Success is not hard"]]],
  ["satya-katha", 4, "সত্য কথা", "Speak the Truth", "🌟", ORIG, [
    ["সত্য কথা বলব আমি", "I will speak the truth"],
    ["থাকব মিথ্যা থেকে দূরে", "I will stay far from lies"],
    ["বড়কে দেব সম্মান, ছোটকে স্নেহ, ভালোবাসা", "I will respect elders, give love and care to little ones"],
    ["মিলেমিশে চলব সুখে, এটাই আমার আশা", "Living together happily is my hope"]]],
  ["amar-gram", 5, "আমার গ্রাম", "My Village", "🏡", ORIG, [
    ["আমার গ্রামটি ছবির মতো, নদীর ধারে ঘর", "My village is like a picture, houses by the river"],
    ["সবুজ ধানের ক্ষেত পেরিয়ে আকাশ অনেক দূর", "Beyond the green rice fields the sky stretches far"],
    ["সকাল হলে দোয়েল ডাকে, শিউলি ঝরে ঘাসে", "At dawn the magpie-robin calls, shiuli falls on the grass"],
    ["সন্ধ্যা নামে ধীরে ধীরে, চাঁদ ওঠে আকাশে", "Evening settles slowly, the moon rises in the sky"],
    ["সহজ সরল মানুষ সবাই, মায়ায় ভরা মন", "Everyone is simple and kind, hearts full of affection"],
    ["গ্রামের মাটি আপন আমার, আপন এ জীবন", "The village soil is mine, and so is this life"]]],
  ["dhono-dhanne", 5, "ধনধান্যে পুষ্পে ভরা", "Rich with Grain and Flowers", "🌾", "Dwijendralal Roy (1863-1913), public domain (first verse)", [
    ["ধনধান্যে পুষ্পে ভরা আমাদের এই বসুন্ধরা", "Rich with grain and flowers is our earth"],
    ["তাহার মাঝে আছে দেশ এক সকল দেশের সেরা", "Among it is one land, the best of all lands"],
    ["ও সে স্বপ্ন দিয়ে তৈরি সে দেশ স্মৃতি দিয়ে ঘেরা", "A land made of dreams and wrapped in memories"],
    ["এমন দেশটি কোথাও খুঁজে পাবে নাকো তুমি", "You will not find such a land anywhere"],
    ["সকল দেশের রানি সে যে আমার জন্মভূমি", "She is the queen of all lands, my motherland"]]],
  ["noton-payra", 2, "নোটন নোটন পায়রাগুলি", "The Fluffy Pigeons", "🕊️", "Jogindranath Sarkar, খুকুমণির ছড়া (1899), public domain - text as printed", [
    ["নোটন নোটন পায়রাগুলি ঝোটন বেঁধেছে", "The crested pigeons have tied their topknots"],
    ["ও পারেতে দুটি মেয়ে নাইতে নেমেছে", "Over there two girls have gone down to bathe"],
    ["সরু সরু চুলগুলি ঝাড়তে লেগেছে", "They have started to shake out their fine hair"],
    ["কে দেখেছে, কে দেখেছে? দাদা দেখেছে", "Who saw, who saw? Elder brother saw"],
    ["দাদার হাতে বাজুবন্ধ ছুড়ে মেরেছে", "She threw the armlet in brother's hand at him"],
    ["উহুহু, বড্ড লেগেছে!", "Ouch, that hurt a lot!"]]],
  ["amar-pon", 3, "আমার পণ", "My Promise", "🌅", "Madan Mohan Tarkalankar (1817-1858), public domain (opening lines)", [
    ["সকালে উঠিয়া আমি মনে মনে বলি", "Waking up in the morning I say to myself"],
    ["সারাদিন আমি যেন ভালো হয়ে চলি", "May I behave well all day long"],
    ["আদেশ করেন যাহা মোর গুরুজনে", "Whatever my elders ask of me"],
    ["আমি যেন সেই কাজ করি ভালো মনে", "May I do it with a good heart"]]],
  ["chhoto-pakhi",1,"ছোট্ট পাখি","Little Bird","🐤",ORIG,[
    ["ছোট্ট পাখি ডাকে ভোরে","A little bird calls at dawn"],
    ["ঘুম ভাঙে সবার ঘরে","Sleep ends in every home"],
    ["আমিও উঠি তাড়াতাড়ি","I get up quickly too"],
    ["মুখ ধুই, যাই স্কুলবাড়ি","I wash my face and go to school"]]],
  ["biral-chhana",1,"বিড়াল ছানা","Kitten","🐱",ORIG,[
    ["মিউ মিউ বিড়াল ছানা","Meow meow, little kitten"],
    ["দুধ খেতে করে না মানা","She never says no to milk"],
    ["লেজটি নাড়ে দুলে দুলে","She swishes her tail, swaying"],
    ["ঘুমিয়ে পড়ে মায়ের কোলে","And falls asleep in her mother's lap"]]],
  ["skul-jai",1,"স্কুলে যাই","I Go to School","🏫",ORIG,[
    ["সকাল হলে স্কুলে যাই","In the morning I go to school"],
    ["নতুন নতুন বন্ধু পাই","I find new friends"],
    ["শিক্ষক শেখান যত্ন করে","The teacher teaches with care"],
    ["শিখি আমি মনটি ভরে","I learn with a full heart"]]],
  ["dadur-bari",2,"দাদুর বাড়ি","Grandpa's House","🏠",ORIG,[
    ["চলো যাই দাদুর বাড়ি","Let us go to Grandpa's house"],
    ["সঙ্গে নিয়ে মিষ্টি হাঁড়ি","Taking a pot of sweets along"],
    ["দাদু বলেন গল্প কত","Grandpa tells so many stories"],
    ["শুনে আমি খুশি যত","The more I hear, the happier I am"]]],
  ["jonaki",2,"জোনাকি","Fireflies","✨",ORIG,[
    ["সন্ধ্যা হলে বনের ধারে","At dusk by the edge of the forest"],
    ["জোনাকিরা আলো ছড়ায়","Fireflies spread their light"],
    ["টিমটিমিয়ে জ্বলে-নেভে","Twinkling on and off"],
    ["তারার মতো ঘুরে বেড়ায়","They wander like little stars"]]],
  ["dhan",4,"সোনালি ধান","Golden Rice","🌾",ORIG,[
    ["সোনালি ধান মাঠে দোলে","Golden rice sways in the field"],
    ["কৃষক ভাইয়ের হাসি ফোটে","The farmer's face smiles"],
    ["কৃষকের ঘামে ধান ফলে","The rice grows from the farmer's sweat"],
    ["তাই তো আমরা ভাত খাই","That is why we get to eat rice"],
    ["ভাত ফেলে না দিই কভু","Never throw rice away"],
    ["কৃষককে মনে রাখি ভাই","Remember the farmer, brother"]]],
];

// ata-gache: use the text as collected in Lokosahitya / Chhelebhulano Chhara (public domain)
const ata = poems.find((p) => p.id === "ata-gache");
if (ata) {
  const L = [["আতা গাছে তোতা পাখি", "A parrot in the custard-apple tree"], ["ডালিম গাছে মউ", "Honey in the pomegranate tree"], ["কথা কও না কেন বউ", "Why don't you speak, little bride?"], ["কথা কব কী ছলে", "How can I speak, with what excuse?"], ["কথা কইতে গা জ্বলে", "Speaking makes my body burn"]];
  ata.lines = L.map(([bn, en], i) => ({ bn, en, startMs: i * 4000, endMs: i * 4000 + 4000 }));
  ata.source = "Traditional, as collected in Rabindranath Tagore's ছেলেভুলানো ছড়া (public domain)";
}

for (const [id, grade, titleBn, titleEn, emoji, source, lines] of NEW) {
  if (poems.some((p) => p.id === id)) continue;
  poems.push({ id, titleBn, titleEn, emoji, source, grade, audioKey: null, illustrationKey: null, lines: lines.map(([bn, en], i) => ({ bn, en, startMs: i * 4000, endMs: i * 4000 + 4000 })) });
}
poems.sort((a, b) => (a.grade ?? 9) - (b.grade ?? 9));
fs.writeFileSync(file, JSON.stringify(poems, null, 2) + "\n");

const mf = "content/poems/manifest.json";
const m = JSON.parse(fs.readFileSync(mf, "utf8"));
m.version = "3";
m.packs[0].count = poems.length;
m.packs[0].bytes = Buffer.byteLength(JSON.stringify(poems));
fs.writeFileSync(mf, JSON.stringify(m) + "\n");
console.log(`${poems.length} poems; per class:`, [1, 2, 3, 4, 5].map((g) => poems.filter((p) => p.grade === g).length).join(", "));
