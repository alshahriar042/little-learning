/**
 * Asset pipeline for Little Learners BD.
 *  1. Resizes incoming/images/*.webp -> 480px + 960px WebP (alpha kept) into app/public/dev-assets/picture-words/img/
 *  2. Copies content/** -> app/public/content/** and writes content/picture-words/manifest.json
 *     (version hash, per-asset bytes + hash + dominant colour, per-section packs).
 *  3. With --upload: pushes the generated assets to Cloudflare R2 (skipped with a message when credentials are absent).
 */
import sharp from "sharp";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { spawn } from "node:child_process";

const root = path.resolve(import.meta.dirname, "..");
const incoming = path.join(root, "incoming/images");
const contentSrc = path.join(root, "content");
const publicDir = path.join(root, "app/public");
const devAssets = path.join(publicDir, "dev-assets/picture-words");
const contentOut = path.join(publicDir, "content");
const SIZES = [480, 960] as const;
const upload = process.argv.includes("--upload");

const sha = (b: Buffer | string) => crypto.createHash("sha1").update(b).digest("hex");

async function dominant(file: string): Promise<string> {
  const { data, info } = await sharp(file).resize(24, 24, { fit: "inside" }).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  let r = 0, g = 0, b = 0, n = 0;
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] < 128) continue;
    r += data[i]; g += data[i + 1]; b += data[i + 2]; n++;
  }
  if (!n) return "#e5e7eb";
  const hex = (v: number) => Math.round(v / n).toString(16).padStart(2, "0");
  void info;
  return `#${hex(r)}${hex(g)}${hex(b)}`;
}

async function main() {
  const sections = JSON.parse(fs.readFileSync(path.join(contentSrc, "picture-words/sections.json"), "utf8"));
  const items = JSON.parse(fs.readFileSync(path.join(contentSrc, "picture-words/items.json"), "utf8"));

  // 1. images
  const assets: Record<string, { b: number; v: string; c: string }> = {};
  let made = 0;
  for (const size of SIZES) fs.mkdirSync(path.join(devAssets, "img", String(size)), { recursive: true });
  for (const it of items) {
    if (!it.image) continue;
    const src = path.join(incoming, it.image.file);
    if (!fs.existsSync(src)) throw new Error(`missing source image ${src}`);
    for (const size of SIZES) {
      const out = path.join(devAssets, "img", String(size), it.image.file);
      if (!fs.existsSync(out) || fs.statSync(out).mtimeMs < fs.statSync(src).mtimeMs) {
        await sharp(src).resize({ width: size, height: size, fit: "inside", withoutEnlargement: true }).webp({ quality: 80, alphaQuality: 90 }).toFile(out);
        made++;
      }
      const buf = fs.readFileSync(out);
      assets[`img/${size}/${it.image.file}`] = { b: buf.length, v: sha(buf).slice(0, 8), c: size === 480 ? await dominant(out) : "" };
    }
  }
  for (const k of Object.keys(assets)) if (k.startsWith("img/960/")) assets[k].c = assets[k.replace("/960/", "/480/")].c;

  // 2. content + manifest
  fs.rmSync(contentOut, { recursive: true, force: true });
  fs.cpSync(contentSrc, contentOut, { recursive: true });
  const packAssets: Record<string, string[]> = {};
  const packs = sections.map((s: any) => {
    const its = items.filter((i: any) => i.sectionId === s.id);
    const keys = its.filter((i: any) => i.image).flatMap((i: any) => SIZES.map((z) => `img/${z}/${i.image.file}`));
    packAssets[s.id] = keys;
    return { id: s.id, titleEn: s.nameEn, titleBn: s.nameBn, count: its.length, bytes: keys.reduce((a: number, k: string) => a + assets[k].b, 0) };
  });
  const files = ["sections.json", "items.json"];
  const version = sha(files.map((f) => fs.readFileSync(path.join(contentSrc, "picture-words", f), "utf8")).join("|") + JSON.stringify(assets)).slice(0, 10);
  const manifest = { module: "picture-words", version, files, assetsFile: "assets.json", packs };
  fs.writeFileSync(path.join(contentOut, "picture-words/manifest.json"), JSON.stringify(manifest));
  fs.writeFileSync(path.join(contentOut, "picture-words/assets.json"), JSON.stringify({ version, assets, packs: packAssets }));
  const total = Object.values(assets).reduce((a, x) => a + x.b, 0);
  console.log(`[assets] ${items.length} items, ${Object.keys(assets).length} files (${(total / 1e6).toFixed(1)} MB), ${made} (re)generated, content v${version}`);

  // 3. upload
  if (upload) await uploadToR2(Object.keys(assets));
  else console.log("[assets] upload skipped (pass --upload to push to R2)");
}

async function uploadToR2(keys: string[]) {
  const bucket = process.env.R2_BUCKET;
  if (!bucket || !(process.env.CLOUDFLARE_API_TOKEN || process.env.CLOUDFLARE_ACCOUNT_ID)) {
    console.log("[assets] R2 upload SKIPPED: set R2_BUCKET and CLOUDFLARE_API_TOKEN (+ CLOUDFLARE_ACCOUNT_ID) to enable. See README 'Asset preparation'.");
    return;
  }
  const run = (key: string) => new Promise<void>((resolve, reject) => {
    const p = spawn("npx", ["wrangler", "r2", "object", "put", `${bucket}/picture-words/${key}`, "--file", path.join(devAssets, key),
      "--content-type", "image/webp", "--cache-control", "public, max-age=31536000, immutable", "--remote"], { stdio: "ignore", shell: true });
    p.on("exit", (c) => (c === 0 ? resolve() : reject(new Error(`upload failed: ${key}`))));
  });
  let done = 0;
  const queue = [...keys];
  await Promise.all(Array.from({ length: 6 }, async () => {
    while (queue.length) { await run(queue.shift()!); if (++done % 50 === 0) console.log(`[assets] uploaded ${done}/${keys.length}`); }
  }));
  console.log(`[assets] uploaded ${done} files to r2://${bucket}/picture-words/`);
}

main().catch((e) => { console.error(e); process.exit(1); });
