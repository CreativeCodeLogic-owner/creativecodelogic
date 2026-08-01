// Build-time asset step (not shipped, no runtime dep): rasterize each triquetra
// variant SVG in src/assets/triquetra-variants/ to a transparent WebP at 220px
// (2× the 110px max frieze display size), quality 85. NavFrieze loads the WebPs;
// the .svg files stay as the editable source. Re-run after editing a variant:
//   node scripts/rasterize-frieze.mjs
import fs from "node:fs";
import path from "node:path";
import puppeteer from "puppeteer-core";

const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const DIR = "src/assets/triquetra-variants";
const SIZE = 220;
const QUALITY = 85;

const svgs = fs.readdirSync(DIR).filter((f) => f.endsWith(".svg")).sort();
const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: "new",
  args: ["--disable-gpu", "--no-first-run", "--force-device-scale-factor=1"],
});
const page = await browser.newPage();
await page.setViewport({ width: SIZE, height: SIZE, deviceScaleFactor: 1 });

for (const file of svgs) {
  const svg = fs.readFileSync(path.join(DIR, file), "utf8");
  const b64 = Buffer.from(svg, "utf8").toString("base64");
  await page.setContent(
    `<!doctype html><html><body style="margin:0"><img src="data:image/svg+xml;base64,${b64}" style="width:${SIZE}px;height:${SIZE}px;display:block"></body></html>`,
    { waitUntil: "domcontentloaded" },
  );
  await page.evaluate(() => document.querySelector("img").decode());
  const out = path.join(DIR, file.replace(/\.svg$/, ".webp"));
  await page.screenshot({
    path: out,
    type: "webp",
    quality: QUALITY,
    omitBackground: true,
    clip: { x: 0, y: 0, width: SIZE, height: SIZE },
  });
  const before = fs.statSync(path.join(DIR, file)).size;
  const after = fs.statSync(out).size;
  console.log(
    `${file.padEnd(30)} ${(before / 1024).toFixed(1).padStart(6)} KB svg  ->  ${(after / 1024).toFixed(1).padStart(6)} KB webp`,
  );
}

await browser.close();
