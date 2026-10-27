// Links poems to YouTube videos (embedded with YouTube's privacy-enhanced player; nothing is downloaded or copied).
// The list below was checked with YouTube's oEmbed endpoint (video exists and allows embedding). Re-run: node scripts/add-poem-videos.mjs
import fs from "node:fs";
const file = "content/poems/poems.json";
const poems = JSON.parse(fs.readFileSync(file, "utf8"));
// poemId -> [videoId, channel, title]
const V = {
  "chand-mama": ["ihGVgAuX-Tk", "Hutum School Rhymes - বাংলা ছড়া", "Aye Aye Chand Mama | আয় আয় চাঁদ মামা"],
  "ghum-parani": ["9pIBPWO0BTo", "Kheyal Khushi Bengali Rhymes", "Ghum parani mashi pishi | ঘুম পাড়ানি মাসি পিসি"],
  "ata-gache": ["9xgh8bww0uc", "PDL Kids", "Ata Gache Tota Pakhi | আতা গাছে তোতা পাখি"],
  "khoka-ghumalo": ["NREmKD7ZqHo", "Infobells Bangla", "খোকা ঘুমালো পাড়া জুড়ালো"],
  "brishti-pore": ["2xvlFsrXOC0", "Hasi Khushi Rhymes", "বৃষ্টি পড়ে টাপুর টুপুর"],
  "pakhi-sob": ["l3ipHXbDxIg", "SHISHU SHIKKHA", "পাখি সব করে রব রাতি পোহাইল"],
  "chhoto-nodi": ["9U61EOIX5VQ", "Trimatrikbd", "আমাদের ছোট নদী"],
  "hattima-tim-tim": ["OXYJLlMU974", "Coco Kids BD", "হাট্টিমাটিম টিম"],
  "taal-gach": ["7NJ2WAQsNss", "Meghbarni", "তালগাছ - রবীন্দ্রনাথ ঠাকুর"],
  "agdum-bagdum": ["Jfh5riMKhfg", "Totomoni Rhymes", "আগডুম বাগডুম"],
  "dol-dolooni": ["YVoEvZ89DpQ", "Shishu Vubon", "দোল দোল দোলনি রাঙা মাথায় চিরুনি"],
  "noton-payra": ["gxn98yoh2MQ", "Hutum School Rhymes - বাংলা ছড়া", "নোটন নোটন পায়রাগুলি"],
  "amar-pon": ["sz_W1EPPY8Q", "Sa Re Ga Ma Academy", "আমার পণ"],
};
for (const p of poems) if (V[p.id]) { const [id, channel, title] = V[p.id]; p.video = { id, channel, title }; }
fs.writeFileSync(file, JSON.stringify(poems, null, 2) + "\n");
console.log(Object.keys(V).length, "poems linked to videos");
