// v5 verification: hero state model (2 loops), creative persistence+reset+
// palette placement, interactive terminal (wrong & right command, hint, reset),
// section rhythm, reduced-motion + mobile. Zero console errors expected.
import puppeteer from "puppeteer-core";

const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const OUT = "scripts/shots/v5";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const fs = await import("node:fs");
fs.mkdirSync(OUT, { recursive: true });

async function launch(viewport) {
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: "new",
    args: ["--disable-gpu", "--no-first-run", "--hide-scrollbars"],
    defaultViewport: viewport,
  });
  return browser;
}

function watch(page) {
  const errors = [];
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(`console.error: ${m.text()}`);
  });
  page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));
  return errors;
}

async function scrollToEl(page, sel, offset = -60) {
  await page.evaluate(
    (s, o) => {
      const el = document.querySelector(s);
      if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY + o, behavior: "instant" });
    },
    sel,
    offset,
  );
}

// ---------- pass A: full motion ---------------------------------------------
{
  const browser = await launch({ width: 1440, height: 900 });
  const page = await browser.newPage();
  const errors = watch(page);
  await page.goto("http://localhost:5173/", { waitUntil: "domcontentloaded", timeout: 60000 });
  const out = {};

  // --- 1. hero: two full loops, final visible exactly once per cycle -------
  await sleep(13000); // intro complete
  const samples = [];
  for (let i = 0; i < 88; i++) {
    samples.push(
      await page.evaluate(() => {
        const f = document.querySelector("[data-hero-final]");
        const l = document.querySelector("[data-hero-line]");
        return [
          f ? parseFloat(getComputedStyle(f).opacity) : -1,
          l ? parseFloat(getComputedStyle(l).opacity) : -1,
        ];
      }),
    );
    await sleep(260);
  }
  const FINAL = 0.3;
  // overlap is only legitimate inside a crossfade (~2 samples at 260ms);
  // flag any both-visible run longer than 3 samples
  let overlapRun = 0;
  let longOverlaps = 0;
  const stretches = [];
  let cur = 0;
  for (const [f, l] of samples) {
    if (f > FINAL && l > FINAL) {
      overlapRun++;
      if (overlapRun > 3) longOverlaps++;
    } else {
      overlapRun = 0;
    }
    if (f > FINAL) cur++;
    else {
      if (cur > 0) stretches.push(cur);
      cur = 0;
    }
  }
  if (cur > 0) stretches.push(cur);
  out.heroFinalStretches = stretches.map((s) => `${(s * 0.26).toFixed(1)}s`).join(",");
  out.heroTwoLoopsOk =
    longOverlaps === 0 && stretches.some((s) => s * 0.26 >= 4);

  // --- 2. creative: persistent distortion + reset + palette placement ------
  await scrollToEl(page, '[data-world="0"]');
  await sleep(3400);
  const handles = await page.$$('button[aria-label^="Drag node"]');
  const hb = await handles[5].boundingBox();
  await page.mouse.move(hb.x + hb.width / 2, hb.y + hb.height / 2);
  await page.mouse.down();
  await page.mouse.move(hb.x + hb.width / 2 + 90, hb.y + hb.height / 2 + 45, { steps: 10 });
  await page.mouse.up();
  await sleep(1200);
  out.distortionPersists = await page.evaluate(() => {
    const el = document.querySelectorAll('button[aria-label^="Drag node"]')[5];
    const m = el.style.transform.match(/translate3d\((-?\d+\.?\d*)px, (-?\d+\.?\d*)px/);
    return m ? Math.hypot(parseFloat(m[1]), parseFloat(m[2])) > 5 : false;
  });
  // palette hugs the mark (x within 12% of panel-width × 0.6)
  out.paletteAligned = await page.evaluate(() => {
    const panel = document.querySelector('[data-world="0"]');
    const pal = document.querySelector('[aria-label="Line colour"]');
    const pr = panel.getBoundingClientRect();
    const br = pal.getBoundingClientRect();
    const cx = br.left + br.width / 2 - pr.left;
    return Math.abs(cx - pr.width * 0.6) < pr.width * 0.12;
  });
  await page.screenshot({ path: `${OUT}/full-game-persist.png` });
  await page.click('button[aria-label="Reset the mark"]');
  await sleep(900);
  out.resetWorks = await page.evaluate(() => {
    const els = document.querySelectorAll('button[aria-label^="Drag node"]');
    return [...els].every((el) => {
      const m = el.style.transform.match(/translate3d\((-?\d+\.?\d*)px, (-?\d+\.?\d*)px/);
      return !m || Math.hypot(parseFloat(m[1]), parseFloat(m[2])) < 0.6;
    });
  });

  // --- 3. terminal: wrong command, right command typed, reset, hint --------
  await scrollToEl(page, '[data-world="1"]');
  await sleep(7500); // log + metrics + prompt
  out.promptShown = await page.evaluate(() => {
    const p = document.querySelector("[data-prompt]");
    return p && getComputedStyle(p).visibility === "visible";
  });
  const input = await page.$('input[aria-label="Terminal command"]');
  await input.type("foo", { delay: 20 });
  await page.keyboard.press("Enter");
  await sleep(400);
  out.wrongCmdError = await page.evaluate(() =>
    (document.querySelector("[data-log]")?.textContent || "").includes("command not found"),
  );
  await input.type("bun run preview", { delay: 15 });
  await page.keyboard.press("Enter");
  await sleep(2200);
  out.finalLineShown = await page.evaluate(() => {
    const f = document.querySelector("[data-final-line]");
    return f && getComputedStyle(f).visibility === "visible";
  });
  out.resetLinkShown = await page.evaluate(
    () => getComputedStyle(document.querySelector("[data-reset-link]")).opacity === "1",
  );
  await page.screenshot({ path: `${OUT}/full-terminal-run.png` });
  await page.click("[data-reset-link]");
  await sleep(1500);
  out.resetReplays = await page.evaluate(() => {
    const first = document.querySelector("[data-log-line]");
    const f = document.querySelector("[data-final-line]");
    return (
      getComputedStyle(first).visibility === "visible" &&
      getComputedStyle(f).visibility === "hidden"
    );
  });
  await sleep(6500); // let it reach prompt again
  await page.click("[data-hint]");
  await sleep(2600);
  out.hintRuns = await page.evaluate(() => {
    const f = document.querySelector("[data-final-line]");
    return f && getComputedStyle(f).visibility === "visible";
  });

  // --- 4. rhythm: ch2 section padding at 1440 -------------------------------
  out.ch2PaddingTop = await page.evaluate(() => {
    const s = document.querySelector('[data-world="0"]').closest("section");
    return getComputedStyle(s).paddingTop;
  });

  console.log("\n=== FULL ===");
  console.log(JSON.stringify(out, null, 1));
  console.log(errors.length ? `ERRORS:\n${errors.join("\n")}` : "no page errors");
  await browser.close();
}

// ---------- pass B: reduced motion ------------------------------------------
{
  const browser = await launch({ width: 1440, height: 900 });
  const page = await browser.newPage();
  await page.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "reduce" }]);
  const errors = watch(page);
  await page.goto("http://localhost:5173/", { waitUntil: "domcontentloaded", timeout: 60000 });
  await sleep(2500);
  const out = {};
  out.rotatingLine = await page.evaluate(() => !!document.querySelector("[data-hero-line]"));
  await scrollToEl(page, '[data-world="1"]');
  await sleep(600);
  out.staticAll = await page.evaluate(() => {
    const lines = [...document.querySelectorAll("[data-log-line]")].every(
      (el) => getComputedStyle(el).visibility === "visible" && el.textContent.trim().length > 4,
    );
    const art = [...document.querySelectorAll("[data-ascii-row]")].every(
      (el) => getComputedStyle(el).visibility === "visible",
    );
    const prompt = getComputedStyle(document.querySelector("[data-prompt]")).visibility === "visible";
    return lines && art && prompt;
  });
  const input = await page.$('input[aria-label="Terminal command"]');
  await input.type("bun run preview");
  await page.keyboard.press("Enter");
  await sleep(300);
  out.runInstant = await page.evaluate(() => {
    const f = document.querySelector("[data-final-line]");
    return f && getComputedStyle(f).visibility === "visible";
  });
  await page.click("[data-reset-link]");
  await sleep(300);
  out.resetStatic = await page.evaluate(() => {
    const lines = [...document.querySelectorAll("[data-log-line]")].every(
      (el) => getComputedStyle(el).visibility === "visible",
    );
    const f = getComputedStyle(document.querySelector("[data-final-line]")).visibility === "hidden";
    return lines && f;
  });
  // creative: drag disabled, reset functional (instant)
  await scrollToEl(page, '[data-world="0"]');
  await sleep(500);
  out.gameHandles = await page.evaluate(
    () => document.querySelectorAll('button[aria-label^="Drag node"]').length,
  );
  console.log("\n=== REDUCED ===");
  console.log(JSON.stringify(out, null, 1));
  console.log(errors.length ? `ERRORS:\n${errors.join("\n")}` : "no page errors");
  await browser.close();
}

// ---------- pass C: mobile --------------------------------------------------
{
  const browser = await launch({ width: 390, height: 844, isMobile: true, hasTouch: true });
  const page = await browser.newPage();
  const errors = watch(page);
  await page.goto("http://localhost:5173/", { waitUntil: "domcontentloaded", timeout: 60000 });
  await sleep(2500);
  const out = {};
  await scrollToEl(page, '[data-world="1"]');
  await sleep(7500);
  await page.tap("[data-hint]");
  await sleep(3000);
  out.hintRunsMobile = await page.evaluate(() => {
    const f = document.querySelector("[data-final-line]");
    return f && getComputedStyle(f).visibility === "visible";
  });
  await page.screenshot({ path: `${OUT}/m-terminal.png` });
  console.log("\n=== MOBILE ===");
  console.log(JSON.stringify(out, null, 1));
  console.log(errors.length ? `ERRORS:\n${errors.join("\n")}` : "no page errors");
  await browser.close();
}
