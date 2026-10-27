/**
 * Extracts every photo from the picture-book PDF into incoming/images/{itemId}.webp
 * and rewrites incoming/items.json so every item points at its photo (background kept).
 *
 * Usage: tsx scripts/extract-pdf.ts <path-to.pdf>
 * Pages 3..N hold a 2-column x 3-row card grid; photos appear in items.json order.
 */
import * as mupdf from "mupdf";
import sharp from "sharp";
import fs from "node:fs";
import path from "node:path";

const pdfPath = process.argv[2];
if (!pdfPath) throw new Error("usage: tsx scripts/extract-pdf.ts <pdf>");
const root = path.resolve(import.meta.dirname, "..");
const itemsFile = path.join(root, "incoming/items.json");
const outDir = path.join(root, "incoming/images");
const items: any[] = JSON.parse(fs.readFileSync(itemsFile, "utf8"));

fs.rmSync(outDir, { recursive: true, force: true });
fs.mkdirSync(outDir, { recursive: true });

const doc = mupdf.Document.openDocument(fs.readFileSync(pdfPath), "application/pdf");
const PAGE_W = 1654; // native width of the full-page raster in the PDF
const COLS = [[97, 800], [854, 1557]];
const ROWS = [[303, 714], [934, 1346], [1566, 1978]];

let idx = 0;
const total = doc.countPages();
for (let pageNo = 2; pageNo < total && idx < items.length; pageNo++) {
  const page = doc.loadPage(pageNo);
  const b = page.getBounds();
  const s = PAGE_W / (b[2] - b[0]);
  const pm = page.toPixmap(mupdf.Matrix.scale(s, s), mupdf.ColorSpace.DeviceRGB, false, false);
  const w = pm.getWidth(), h = pm.getHeight(), n = pm.getNumberOfComponents();
  const raw = Buffer.from(pm.getPixels());
  const page_img = sharp(raw, { raw: { width: w, height: h, channels: n as 3 } });
  for (const [y0, y1] of ROWS) for (const [x0, x1] of COLS) {
    const region = await page_img.clone().extract({ left: x0, top: y0, width: x1 - x0, height: y1 - y0 }).png({ compressionLevel: 1 }).toBuffer();
    const st = await sharp(region).stats();
    const sd = st.channels.reduce((a, c) => a + c.stdev, 0) / st.channels.length;
    if (sd < 6) continue; // empty slot (plain cream)
    if (idx >= items.length) throw new Error("more photos than items");
    const it = items[idx++];
    const info = await sharp(region).resize({ width: 960, height: 960, fit: "inside", withoutEnlargement: true })
      .webp({ quality: 84 }).toFile(path.join(outDir, `${it.id}.webp`));
    it.image = { file: `${it.id}.webp`, w: info.width, h: info.height, hasCutout: false };
  }
}
if (idx !== items.length) throw new Error(`extracted ${idx} photos but items.json has ${items.length}`);
fs.writeFileSync(itemsFile, JSON.stringify(items, null, 1));
console.log(`extracted ${idx} photos -> ${outDir}`);
