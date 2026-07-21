// v2 verification: three worlds + P2 fixes, full / reduced / mobile passes.
import puppeteer from "puppeteer-core";

const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const URL = "http://localhost:5173/";
const OUT = "scripts/shots/v2";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function scrollToEl(page, sel, offset = -100) {
  await page.evaluate(
    (s, o) => {
      const el = document.querySelector(s);
      if (!el) return;
      window.scrollTo({
        top: el.getBoundingClientRect().top + window.scrollY + o,
        behavior: "instant",
      });
    },
    sel,
    offset,
  );
  await sleep(1600);
}

async function run(reduced, tag, viewport) {
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: "new",
    args: ["--disable-gpu", "--no-first-run", "--hide-scrollbars"],
    defaultViewport: viewport,
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

  const fs = await import("node:fs");
  fs.mkdirSync(OUT, { recursive: true });
  await page.goto(URL, { waitUntil: "networkidle0" });
  await sleep(reduced ? 800 : 5200);

  // World A — Creative: paint a trail with the mouse
  await scrollToEl(page, '[data-world="0"]', -40);
  if (!reduced && viewport.width > 700) {
    const box = await (await page.$('[data-world="0"]')).boundingBox();
    for (let i = 0; i <= 40; i++) {
      await page.mouse.move(
        box.x + box.width * 0.2 + (box.width * 0.55 * i) / 40,
        box.y + box.height * 0.55 + Math.sin(i / 5) * 90,
      );
      await sleep(12);
    }
    await sleep(350);
  }
  await page.screenshot({ path: `${OUT}/${tag}-world-a.png` });

  // World B — Code: let the log finish + metrics count
  await scrollToEl(page, '[data-world="1"]', -40);
  await sleep(reduced ? 400 : 4500);
  await page.screenshot({ path: `${OUT}/${tag}-world-b.png` });

  // World C — Logic: aligned end state
  await scrollToEl(page, "[data-fragments]", -260);
  await sleep(1400);
  await page.screenshot({ path: `${OUT}/${tag}-world-c.png` });

  // Work chapter: cards with image slots + seals
  await scrollToEl(page, "[data-case-card]", -180);
  await page.screenshot({ path: `${OUT}/${tag}-work.png` });

  const checks = await page.evaluate(() => {
    const out = {};
    out.canvas = document.querySelectorAll("canvas").length;
    const lines = [...document.querySelectorAll("[data-log-text]")].map(
      (el) => el.textContent.trim().length,
    );
    out.logLineChars = lines.join(",");
    const vis = [...document.querySelectorAll("[data-log-line]")].filter(
      (el) => getComputedStyle(el).visibility === "visible",
    ).length;
    out.logLinesVisible = vis;
    const frag = document.querySelector("[data-fragment]");
    out.fragmentTransform = frag ? frag.style.transform || "(none)" : "MISSING";
    const metrics = document.querySelector("[data-metrics]");
    out.metricsOpacity = metrics
      ? getComputedStyle(metrics).opacity
      : "MISSING";
    out.metricValues = [...document.querySelectorAll("[data-metric-value]")]
      .map((el) => el.textContent)
      .join(" | ");
    out.imgs = [...document.querySelectorAll("[data-case-card] img")].map(
      (im) => `${im.naturalWidth}x${im.naturalHeight}`,
    ).join(",");
    return out;
  });

  await browser.close();
  return { errors, checks };
}

const full = await run(false, "full", { width: 1440, height: 900 });
console.log("\n=== FULL MOTION ===");
console.log(JSON.stringify(full.checks, null, 1));
console.log(full.errors.length ? `ERRORS:\n${full.errors.join("\n")}` : "no page errors");

const rm = await run(true, "rm", { width: 1440, height: 900 });
console.log("\n=== REDUCED MOTION ===");
console.log(JSON.stringify(rm.checks, null, 1));
console.log(rm.errors.length ? `ERRORS:\n${rm.errors.join("\n")}` : "no page errors");

const mob = await run(false, "m", { width: 390, height: 844, isMobile: true, hasTouch: true });
console.log("\n=== MOBILE ===");
console.log(JSON.stringify(mob.checks, null, 1));
console.log(mob.errors.length ? `ERRORS:\n${mob.errors.join("\n")}` : "no page errors");
