/** Generates PWA icons, apple-touch-icon, favicon and iOS splash screens from an original SVG mark (open book + sprouting leaf). */
import sharp from "sharp";
import fs from "node:fs";
import path from "node:path";

const out = path.resolve(import.meta.dirname, "../app/public/icons");
fs.mkdirSync(out, { recursive: true });
const BG = "#2f9e8f";
const mark = (s: number) => `
<g transform="translate(${s / 2} ${s / 2}) scale(${s / 512}) translate(-256 -256)">
  <path d="M256 330 C 200 300 130 300 90 320 L 90 200 C 130 180 200 180 256 210 C 312 180 382 180 422 200 L 422 320 C 382 300 312 300 256 330 Z" fill="#fff8ec"/>
  <path d="M256 210 L 256 330" stroke="#e7c98a" stroke-width="8" stroke-linecap="round"/>
  <path d="M256 200 C 256 150 256 130 256 110" stroke="#3a7d44" stroke-width="12" stroke-linecap="round" fill="none"/>
  <path d="M256 140 C 200 140 180 100 190 70 C 235 70 262 100 256 140 Z" fill="#7bc96f"/>
  <path d="M256 120 C 310 120 335 85 325 55 C 280 55 250 85 256 120 Z" fill="#f6a21e"/>
</g>`;
const svg = (s: number, rounded: boolean, scale = 1) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 ${s} ${s}">
  <rect width="${s}" height="${s}" rx="${rounded ? s * 0.22 : 0}" fill="${BG}"/><g transform="translate(${(s * (1 - scale)) / 2} ${(s * (1 - scale)) / 2}) scale(${scale})">${mark(s)}</g></svg>`;
const png = (name: string, s: number, rounded: boolean, scale = 1) =>
  sharp(Buffer.from(svg(s, rounded, scale))).png().toFile(path.join(out, name));

async function main() {
  fs.writeFileSync(path.join(out, "icon.svg"), svg(512, true));
  fs.copyFileSync(path.join(out, "icon.svg"), path.resolve(out, "../favicon.svg"));
  await Promise.all([
    png("icon-192.png", 192, true), png("icon-512.png", 512, true),
    png("maskable-192.png", 192, false, 0.78), png("maskable-512.png", 512, false, 0.78),
    png("apple-touch-icon.png", 180, false),
  ]);
  // iOS splash screens (portrait): [w, h, dpr]
  const splash: [number, number][] = [[1290, 2796], [1179, 2556], [1170, 2532], [1125, 2436], [828, 1792], [750, 1334], [1536, 2048]];
  for (const [w, h] of splash) {
    const icon = await sharp(Buffer.from(svg(512, true))).resize(Math.round(w * 0.3)).png().toBuffer();
    await sharp({ create: { width: w, height: h, channels: 3, background: "#fff8ec" } })
      .composite([{ input: icon, gravity: "center" }]).png().toFile(path.join(out, `splash-${w}x${h}.png`));
  }
  console.log("icons generated in", out);
}
main();
