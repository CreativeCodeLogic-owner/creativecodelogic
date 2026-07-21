// v3 verification: hero rotation, world triquetra embeddings, v2 copy.
import puppeteer from "puppeteer-core";

const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const URL = "http://localhost:5173/";
const OUT = "scripts/shots/v3";
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
  await page.goto(URL, { waitUntil: "domcontentloaded", timeout: 60000 });
  await sleep(2500);
  await sleep(reduced ? 1200 : 12500); // full hero draw + rotation + resolve
  await page.screenshot({ path: `${OUT}/${tag}-hero.png` });

  // World A: trace starts ~immediately once the panel is visible (idle)
  await scrollToEl(page, '[data-world="0"]', -40);
  await sleep(reduced ? 600 : 2300);
  await page.screenshot({ path: `${OUT}/${tag}-world-a.png` });

  // World B: log + metrics + ascii mark (~8s)
  await scrollToEl(page, '[data-world="1"]', -40);
  await sleep(reduced ? 600 : 8000);
  await page.screenshot({ path: `${OUT}/${tag}-world-b.png` });

  // World C: assembled, keystone in place
  await scrollToEl(page, "[data-fragments]", -260);
  await sleep(1500);
  await page.screenshot({ path: `${OUT}/${tag}-world-c.png` });

  const checks = await page.evaluate(() => {
    const finalEl = document.querySelector("[data-hero-final]");
    const lineEl = document.querySelector("[data-hero-line]");
    return {
      heroFinalText: finalEl?.textContent?.trim(),
      heroFinalVisible: finalEl
        ? getComputedStyle(finalEl).visibility === "visible" &&
          parseFloat(getComputedStyle(finalEl).opacity) > 0.95
        : "MISSING",
      rotatingLinePresent: !!lineEl,
      fragments: document.querySelectorAll("[data-fragment]").length,
      logoFragment: !!document.querySelector("[data-fragment] svg"),
      asciiRowsVisible: [...document.querySelectorAll("[data-ascii-row]")].filter(
        (el) => getComputedStyle(el).visibility === "visible",
      ).length,
      canvas: document.querySelectorAll("canvas").length,
      navFirstLink: document.querySelector("header nav ul a")?.textContent,
      signLanguage: document.body.innerText
        .toLowerCase()
        .includes("signature"),
    };
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
