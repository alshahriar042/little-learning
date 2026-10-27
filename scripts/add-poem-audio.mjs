// Attach a recording to a poem.
//   node scripts/add-poem-audio.mjs <poemId> <recording.(mp3|m4a|wav|ogg)> [--times 0,3.9,8.2,...]
//
// - converts to a small mono MP3 (incoming/poem-audio/<poemId>.mp3)
// - sets "audioKey" on the poem
// - sets every line's startMs/endMs: from --times (the START of each line in seconds, one number per line), otherwise
//   automatically from the pauses in the recording (works when there is a short pause between lines).
// Then run:  npm run assets   (copies the audio to app/public/dev-assets/poems/audio; upload that folder to R2 in production)
// ffmpeg must be installed (or set FFMPEG=/path/to/ffmpeg). Only use recordings you own or that are licensed for this use.
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const [poemId, input, ...rest] = process.argv.slice(2);
if (!poemId || !input) { console.error("usage: node scripts/add-poem-audio.mjs <poemId> <recording> [--times 0,3.9,8.2]"); process.exit(1); }
const FF = process.env.FFMPEG || "ffmpeg";
const timesArg = rest[rest.indexOf("--times") + 1];

const file = "content/poems/poems.json";
const poems = JSON.parse(fs.readFileSync(file, "utf8"));
const poem = poems.find((p) => p.id === poemId);
if (!poem) { console.error(`no poem "${poemId}". ids: ${poems.map((p) => p.id).join(", ")}`); process.exit(1); }

const run = (args) => spawnSync(FF, args, { encoding: "utf8" });
const outDir = "incoming/poem-audio";
fs.mkdirSync(outDir, { recursive: true });
const outName = `${poemId}.mp3`;
const conv = run(["-y", "-loglevel", "error", "-i", input, "-vn", "-ac", "1", "-ar", "44100", "-b:a", "64k", path.join(outDir, outName)]);
if (conv.status !== 0) { console.error("ffmpeg failed:\n" + (conv.stderr || conv.error)); process.exit(1); }

// duration
const probe = run(["-i", path.join(outDir, outName), "-f", "null", "-"]);
const durMatch = /time=(\d+):(\d+):(\d+\.\d+)/g;
let total = 0; for (const m of probe.stderr.matchAll(durMatch)) total = +m[1] * 3600 + +m[2] * 60 + +m[3];

let starts;
if (timesArg) {
  starts = timesArg.split(",").map(Number);
} else {
  const sd = run(["-i", path.join(outDir, outName), "-af", "silencedetect=noise=-35dB:d=0.3", "-f", "null", "-"]);
  const ends = [...sd.stderr.matchAll(/silence_end: ([\d.]+)/g)].map((m) => +m[1]);
  const begins = [...sd.stderr.matchAll(/silence_start: ([\d.]+)/g)].map((m) => +m[1]);
  // a line starts at 0 (if the recording begins with speech) and after every silence that is followed by speech
  starts = [ends.length && ends[0] < 0.5 && begins[0] === 0 ? ends[0] : 0, ...ends.filter((e) => e > 0.5 && e < total - 0.4)];
  starts = [...new Set(starts.map((s) => +s.toFixed(2)))];
}

if (starts.length !== poem.lines.length) {
  console.error(`Found ${starts.length} line start(s) [${starts.join(", ")}] but the poem has ${poem.lines.length} lines.`);
  console.error("Re-run with explicit line start times in seconds, e.g.:  --times " + poem.lines.map((_, i) => (i * 4).toFixed(1)).join(","));
  console.error("(audio file was converted but the poem was NOT changed)");
  process.exit(2);
}
poem.audioKey = outName;
poem.lines.forEach((l, i) => { l.startMs = Math.round(starts[i] * 1000); l.endMs = Math.round((i + 1 < starts.length ? starts[i + 1] : total) * 1000); });
fs.writeFileSync(file, JSON.stringify(poems, null, 2) + "\n");
console.log(`"${poemId}": ${outName}, ${total.toFixed(1)} s, line starts (s): ${starts.join(", ")}`);
console.log("next: npm run assets");
