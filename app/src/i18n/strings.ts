import { useSettings } from "@/store/settings";

const en = {
  "app.name": "Little Learners BD",
  "common.back": "Back", "common.close": "Close", "common.ok": "OK", "common.cancel": "Cancel", "common.home": "Home",
  "common.offline": "Offline mode", "common.loading": "Loading…", "common.retry": "Try again",
  "common.grownups": "Grown-ups", "common.items": "words", "common.of": "of",
  "home.title": "What shall we learn today?", "home.coming": "Coming soon",
  "home.evicted": "Some saved pictures were removed by your device. Open the Grown-ups corner to download them again.",
  "soon.title": "Coming soon!", "soon.msg": "We are still making this one with love. Come back soon!", "soon.preview": "Peek at a sample",
  "pw.sections": "Pick a group", "pw.games": "Games", "pw.cards": "Flashcards", "pw.start": "Start", "pw.stickers": "Stickers", "pw.stars": "Stars",
  "pw.missing": "Could not load the words. Please connect to the internet once and try again.",
  "flash.next": "Next", "flash.prev": "Previous", "flash.auto": "Auto-play", "flash.pause": "Pause", "flash.done": "You saw them all! 🎉",
  "flash.speak": "Say it", "flash.of": "of",
  "poems.title": "Poems", "poems.play": "Listen", "poems.stop": "Stop", "poems.tap": "Tap a line to hear it", "poems.source": "Source", "poems.all": "All", "poems.video": "Watch the video", "poems.videoHide": "Hide the video", "poems.videoNote": "From YouTube (needs internet). Watch together with a grown-up.", "poems.videoOffline": "No internet connection. The video needs internet.", "poems.videoBy": "Video", "poems.class": "Class", "poems.none": "No poems yet.",
  "games.title": "Games", "games.findit": "Find it!", "games.findit.desc": "Listen and tap the picture", "games.match": "Match", "games.match.desc": "Flip and find the pairs",
  "games.which": "Which word?", "games.which.desc": "Look and pick the word", "games.listen": "Where is it?", "games.again": "Try again 💛", "games.great": "Great job!",
  "games.playAgain": "Play again", "games.done": "All done!", "games.stars": "stars", "games.pairs": "pairs", "games.pick": "Pick a game",
  "games.sections": "Playing with", "games.moves": "moves",
  "gate.title": "Grown-ups only", "gate.solve": "Solve to enter:", "gate.wrong": "Not quite. Try again.", "gate.hint": "This keeps little fingers out of the settings.",
  "parent.title": "Grown-ups corner", "parent.lang": "App language", "parent.speech": "Voice language", "parent.speechEn": "English", "parent.speechBn": "বাংলা", "parent.speechBoth": "Both",
  "parent.sound": "Sound", "parent.speed": "Speaking speed", "parent.slow": "Slow", "parent.fast": "Fast", "parent.auto": "Auto-play seconds", "parent.pairs": "Match pairs",
  "parent.gameSections": "Sections used in games", "parent.noBn": "This device has no Bangla voice. Install Bangla text-to-speech in your device settings, or recorded audio can be added later.",
  "parent.noTts": "This browser cannot speak words aloud.",
  "parent.offline": "Offline downloads", "parent.download": "Download", "parent.downloaded": "Downloaded ✓", "parent.downloadAll": "Download everything", "parent.remove": "Remove downloads",
  "parent.removeConfirm": "Remove all downloaded pictures from this device?", "parent.storage": "Storage used", "parent.persist": "Protect downloads from being cleared", "parent.persisted": "Downloads are protected ✓",
  "parent.cancel": "Stop", "parent.failed": "Some files failed. Check your connection and press Download again.", "parent.redownload": "Download again",
  "parent.progress": "Learning progress", "parent.reset": "Reset progress", "parent.resetConfirm": "Reset all stars, stickers and progress?",
  "parent.updates": "Content updates", "parent.upToDate": "Everything is up to date.", "parent.newContent": "New content available", "parent.updateNow": "Update", "parent.check": "Check for updates",
  "parent.about": "About", "parent.privacy": "Privacy", "parent.credits": "Photo credits", "parent.install": "Add to Home Screen",
  "parent.aboutText": "Little Learners BD helps children aged 1–5 learn words in Bangla and English. No ads, no login, no tracking.",
  "parent.privacyText": "Nothing leaves this device. There are no accounts, cookies, analytics or ads. Progress and settings are stored only on this device. The only exception: if a grown-up opens a poem video, it is played by YouTube (privacy-enhanced mode), which then sees that visit.",
  "parent.installText": "iPhone/iPad: tap the Share button in Safari, then “Add to Home Screen”. Android: open the browser menu and choose “Install app”.",
  "parent.exit": "Lock", "parent.sectionsDl": "By group",
  "credits.title": "Photo credits", "credits.intro": "Pictures come from Wikimedia Commons and other open sources. Thank you to every photographer!",
  "credits.none": "No credit information on file for this picture.", "credits.by": "by", "credits.source": "Source",
  "update.new": "New version available", "update.btn": "Update", "update.later": "Later", "update.ready": "Ready to use offline",
  "nf.title": "Oops!", "nf.msg": "We could not find that page.",
} as const;

export type StringKey = keyof typeof en;

const bn: Record<StringKey, string> = {
  "app.name": "লিটল লার্নার্স বিডি",
  "common.back": "পিছনে", "common.close": "বন্ধ", "common.ok": "ঠিক আছে", "common.cancel": "বাতিল", "common.home": "হোম",
  "common.offline": "অফলাইন মোড", "common.loading": "লোড হচ্ছে…", "common.retry": "আবার চেষ্টা করুন",
  "common.grownups": "বড়দের জন্য", "common.items": "টি শব্দ", "common.of": "/",
  "home.title": "আজ আমরা কী শিখব?", "home.coming": "শীঘ্রই আসছে",
  "home.evicted": "আপনার ডিভাইস কিছু সংরক্ষিত ছবি মুছে ফেলেছে। আবার ডাউনলোড করতে বড়দের কর্নারে যান।",
  "soon.title": "শীঘ্রই আসছে!", "soon.msg": "আমরা এটি ভালোবাসা দিয়ে বানাচ্ছি। একটু পরে আবার এসো!", "soon.preview": "একটু দেখে নাও",
  "pw.sections": "একটি দল বেছে নাও", "pw.games": "খেলা", "pw.cards": "ফ্ল্যাশকার্ড", "pw.start": "শুরু", "pw.stickers": "স্টিকার", "pw.stars": "তারা",
  "pw.missing": "শব্দগুলো লোড করা যায়নি। একবার ইন্টারনেট চালু করে আবার চেষ্টা করুন।",
  "flash.next": "পরের", "flash.prev": "আগের", "flash.auto": "অটো-প্লে", "flash.pause": "থামাও", "flash.done": "সব দেখে ফেলেছ! 🎉",
  "flash.speak": "বলো", "flash.of": "/",
  "poems.title": "ছড়া", "poems.play": "শোনো", "poems.stop": "থামাও", "poems.tap": "যেকোনো লাইনে ছুঁলে শুনতে পাবে", "poems.source": "উৎস", "poems.all": "সব", "poems.video": "ভিডিও দেখো", "poems.videoHide": "ভিডিও লুকাও", "poems.videoNote": "YouTube থেকে (ইন্টারনেট লাগবে)। বড়দের সাথে দেখো।", "poems.videoOffline": "ইন্টারনেট নেই। ভিডিওর জন্য ইন্টারনেট লাগবে।", "poems.videoBy": "ভিডিও", "poems.class": "শ্রেণি", "poems.none": "এখনও কোনো ছড়া নেই।",
  "games.title": "খেলা", "games.findit": "খুঁজে বের করো!", "games.findit.desc": "শোনো আর ছবিতে ট্যাপ করো", "games.match": "জোড়া মেলাও", "games.match.desc": "উল্টে জোড়া খুঁজে নাও",
  "games.which": "কোন শব্দ?", "games.which.desc": "দেখে সঠিক শব্দটি বাছো", "games.listen": "কোনটা?", "games.again": "আবার চেষ্টা করো 💛", "games.great": "দারুণ!",
  "games.playAgain": "আবার খেলো", "games.done": "শেষ!", "games.stars": "তারা", "games.pairs": "জোড়া", "games.pick": "একটি খেলা বাছো",
  "games.sections": "যা দিয়ে খেলছ", "games.moves": "চাল",
  "gate.title": "শুধু বড়দের জন্য", "gate.solve": "ঢুকতে সমাধান করো:", "gate.wrong": "ঠিক হয়নি। আবার চেষ্টা করুন।", "gate.hint": "এতে ছোটদের আঙুল সেটিংসে যায় না।",
  "parent.title": "বড়দের কর্নার", "parent.lang": "অ্যাপের ভাষা", "parent.speech": "কথার ভাষা", "parent.speechEn": "English", "parent.speechBn": "বাংলা", "parent.speechBoth": "দুটোই",
  "parent.sound": "শব্দ", "parent.speed": "বলার গতি", "parent.slow": "ধীরে", "parent.fast": "দ্রুত", "parent.auto": "অটো-প্লে সেকেন্ড", "parent.pairs": "জোড়ার সংখ্যা",
  "parent.gameSections": "খেলায় যে দলগুলো থাকবে", "parent.noBn": "এই ডিভাইসে বাংলা ভয়েস নেই। ডিভাইস সেটিংসে বাংলা টেক্সট-টু-স্পিচ ইনস্টল করুন।",
  "parent.noTts": "এই ব্রাউজার শব্দ উচ্চারণ করতে পারে না।",
  "parent.offline": "অফলাইন ডাউনলোড", "parent.download": "ডাউনলোড", "parent.downloaded": "ডাউনলোড হয়েছে ✓", "parent.downloadAll": "সব ডাউনলোড করুন", "parent.remove": "ডাউনলোড মুছুন",
  "parent.removeConfirm": "এই ডিভাইস থেকে সব ডাউনলোড করা ছবি মুছবেন?", "parent.storage": "ব্যবহৃত স্টোরেজ", "parent.persist": "ডাউনলোড মুছে যাওয়া থেকে রক্ষা করুন", "parent.persisted": "ডাউনলোড সুরক্ষিত ✓",
  "parent.cancel": "থামান", "parent.failed": "কিছু ফাইল আসেনি। ইন্টারনেট দেখে আবার ডাউনলোড চাপুন।", "parent.redownload": "আবার ডাউনলোড",
  "parent.progress": "শেখার অগ্রগতি", "parent.reset": "অগ্রগতি রিসেট", "parent.resetConfirm": "সব তারা, স্টিকার ও অগ্রগতি রিসেট করবেন?",
  "parent.updates": "কনটেন্ট আপডেট", "parent.upToDate": "সব হালনাগাদ আছে।", "parent.newContent": "নতুন কনটেন্ট এসেছে", "parent.updateNow": "আপডেট", "parent.check": "আপডেট দেখুন",
  "parent.about": "পরিচিতি", "parent.privacy": "গোপনীয়তা", "parent.credits": "ছবির কৃতজ্ঞতা", "parent.install": "হোম স্ক্রিনে যোগ করুন",
  "parent.aboutText": "লিটল লার্নার্স বিডি ১–৫ বছরের শিশুদের বাংলা ও ইংরেজিতে শব্দ শিখতে সাহায্য করে। কোনো বিজ্ঞাপন, লগইন বা ট্র্যাকিং নেই।",
  "parent.privacyText": "কিছুই এই ডিভাইসের বাইরে যায় না। কোনো অ্যাকাউন্ট, কুকি, অ্যানালিটিক্স বা বিজ্ঞাপন নেই। অগ্রগতি ও সেটিংস শুধু এই ডিভাইসে থাকে। একমাত্র ব্যতিক্রম: কোনো বড় ছড়ার ভিডিও খুললে সেটি YouTube (প্রাইভেসি-মোডে) চালায়, তখন YouTube সেই ভিজিট দেখতে পায়।",
  "parent.installText": "আইফোন/আইপ্যাড: সাফারিতে শেয়ার বাটন চেপে “Add to Home Screen” বেছে নিন। অ্যান্ড্রয়েড: ব্রাউজার মেনু থেকে “Install app” বেছে নিন।",
  "parent.exit": "লক", "parent.sectionsDl": "দল অনুযায়ী",
  "credits.title": "ছবির কৃতজ্ঞতা", "credits.intro": "ছবিগুলো উইকিমিডিয়া কমন্স ও অন্যান্য উন্মুক্ত উৎস থেকে নেওয়া। সব আলোকচিত্রীকে ধন্যবাদ!",
  "credits.none": "এই ছবির কৃতজ্ঞতার তথ্য নেই।", "credits.by": "ছবি:", "credits.source": "উৎস",
  "update.new": "নতুন সংস্করণ এসেছে", "update.btn": "আপডেট", "update.later": "পরে", "update.ready": "অফলাইনে ব্যবহারের জন্য প্রস্তুত",
  "nf.title": "ইশ!", "nf.msg": "পাতাটি খুঁজে পাওয়া যায়নি।",
};

export const dictionaries = { en, bn } as const;

export function translate(lang: "en" | "bn", key: StringKey, vars?: Record<string, string | number>): string {
  let s: string = dictionaries[lang][key] ?? en[key];
  if (vars) for (const [k, v] of Object.entries(vars)) s = s.replace(`{${k}}`, String(v));
  return s;
}

/** Hook: `const t = useT(); t("home.title")`. Bangla strings are rendered with lang="bn" by <Bn>. */
export function useT() {
  const lang = useSettings((s) => s.uiLang);
  return (key: StringKey, vars?: Record<string, string | number>) => translate(lang, key, vars);
}
