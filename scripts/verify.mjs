// Visual/runtime verification for the CCL site against the dev server.
// Drives the installed Chrome via puppeteer-core: captures console errors,
// clicks the real nav links (exercising the Lenis scroll path), and
// screenshots each chapter. Second pass emulates prefers-reduced-motion.
import puppeteer from "puppeteer-core";

const CHROME =
  "C:/Program Files/Google/Chrome/Application/chrome.exe";
const URL = "http://localhost:5173/";
const OUT = "scripts/shots";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function run(reduced) {
  const tag = reduced ? "rm" : "full";
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: "new",
    args: ["--disable-gpu", "--no-first-run", "--hide-scrollbars"],
    defaultViewport: { width: 1440, height: 900 },
  });
  const page = await browser.newPage();
  const errors = [];
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(`console.error: ${m.text()}`);
  });
  page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));
  page.on("requestfailed", (r) =>
    errors.push(`requestfailed: ${r.url()} ${r.failure()?.errorText}`),
  );

  if (reduced) {
    await page.emulateMediaFeatures([
      { name: "prefers-reduced-motion", value: "reduce" },
    ]);
  }

  await page.goto(URL, { waitUntil: "networkidle0" });
  await sleep(reduced ? 800 : 5200); // let the hero timeline finish

  const fs = await import("node:fs");
  fs.mkdirSync(OUT, { recursive: true });
  await page.screenshot({ path: `${OUT}/${tag}-1-hero.png` });

  // journey via the real nav links
  const stops = [
    ["Work", "2-work"],
    ["Process", "3-process"],
    ["Contact", "4-contact"],
  ];
  for (const [label, name] of stops) {
    await page.evaluate((text) => {
      const links = [...document.querySelectorAll("header nav a")];
      links.find((a) => a.textContent.trim() === text)?.click();
    }, label);
    await sleep(2400);
    await page.screenshot({ path: `${OUT}/${tag}-${name}.png` });
  }

  // scroll into the pillars mid-section for the ch2 glow state
  await page.evaluate(() => {
    document.querySelectorAll("[data-pillar]")[1]?.scrollIntoView({
      block: "center",
      behavior: "instant",
    });
  });
  await sleep(1600);
  await page.screenshot({ path: `${OUT}/${tag}-5-pillars.png` });

  // sanity: content actually visible?
  const checks = await page.evaluate(() => {
    const vis = (sel) => {
      const el = document.querySelector(sel);
      if (!el) return `MISSING ${sel}`;
      const o = parseFloat(getComputedStyle(el).opacity);
      return `${sel} opacity=${o.toFixed(2)}`;
    };
    return [
      vis("[data-pillar]"),
      vis("[data-case-card]"),
      vis("[data-step]"),
      `scrollY=${Math.round(window.scrollY)}`,
      `pageHeight=${Math.round(document.body.scrollHeight)}`,
    ];
  });

  await browser.close();
  return { errors, checks };
}

for (const reduced of [false, true]) {
  const { errors, checks } = await run(reduced);
  console.log(`\n=== ${reduced ? "REDUCED MOTION" : "FULL MOTION"} ===`);
  console.log("checks:", checks.join(" | "));
  console.log(errors.length ? `ERRORS:\n${errors.join("\n")}` : "no page errors");
}
