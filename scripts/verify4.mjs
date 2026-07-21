// v4 verification: hero loop, creative game, ascii playground, logic drag,
// env flag (both ways), process pin. Passes: full / work-true / reduced / mobile.
import puppeteer from "puppeteer-core";

const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const OUT = "scripts/shots/v4";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const fs = await import("node:fs");
fs.mkdirSync(OUT, { recursive: true });

async function newPage(browser, reduced, viewport) {
  const page = await browser.newPage({ viewport });
  const errors = [];
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(`console.error: ${m.text()}`);
  });
  page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));
  if (reduced) {
    await page.emulateMediaFeatures([
      { name: "prefers-reduced-motion", value: "reduce" },
    ]);
  }
  return { page, errors };
}

async function scrollToEl(page, sel, offset = -60) {
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

async function launch(viewport) {
  return puppeteer.launch({
    executablePath: CHROME,
    headless: "new",
    args: ["--disable-gpu", "--no-first-run", "--hide-scrollbars"],
    defaultViewport: viewport,
  });
}

// ---------- pass A: full motion, WORK hidden (5173) -------------------------
{
  const browser = await launch({ width: 1440, height: 900 });
  const { page, errors } = await newPage(browser, false);
  await page.goto("http://localhost:5173/", { waitUntil: "domcontentloaded", timeout: 60000 });
  await sleep(13000); // intro: draw + first cycle + resolve

  const out = {};
  // hero rotation loops
  const opacities = [];
  for (let i = 0; i < 8; i++) {
    opacities.push(
      await page.evaluate(() => {
        const el = document.querySelector("[data-hero-line]");
        return el ? parseFloat(getComputedStyle(el).opacity) : -1;
      }),
    );
    await sleep(900);
  }
  out.heroOverlayOpacities = opacities.map((o) => o.toFixed(2)).join(",");
  out.heroLoopReplayed = opacities.some((o) => o > 0.05);
  await page.screenshot({ path: `${OUT}/full-hero-replay.png` });

  // work hidden
  out.workSection = await page.evaluate(() => !!document.querySelector("#work"));
  out.navLinks = await page.evaluate(() =>
    [...document.querySelectorAll("header nav ul a")].map((a) => a.textContent.trim()).join("|"),
  );

  // creative game
  await scrollToEl(page, '[data-world="0"]');
  await sleep(3400); // entry draw + fill
  await page.screenshot({ path: `${OUT}/full-game.png` });
  out.gameHandles = await page.evaluate(
    () => document.querySelectorAll('button[aria-label^="Drag node"]').length,
  );
  // drag node 5 off-grid
  const handles = await page.$$('button[aria-label^="Drag node"]');
  const hb = await handles[5].boundingBox();
  await page.mouse.move(hb.x + hb.width / 2, hb.y + hb.height / 2);
  await page.mouse.down();
  await page.mouse.move(hb.x + hb.width / 2 + 110, hb.y + hb.height / 2 + 55, { steps: 12 });
  await sleep(250);
  await page.screenshot({ path: `${OUT}/full-game-drag.png` });
  await page.mouse.up();
  await sleep(1600);
  out.gameHandleSettled = await page.evaluate(() => {
    const el = document.querySelectorAll('button[aria-label^="Drag node"]')[5];
    const m = el.style.transform.match(/translate3d\((-?\d+\.?\d*)px, (-?\d+\.?\d*)px/);
    return m ? Math.hypot(parseFloat(m[1]), parseFloat(m[2])) < 0.6 : true;
  });
  // palette: sand stroke
  await page.click('button[aria-label="Line colour: sand gold"]');
  await sleep(400);
  await page.screenshot({ path: `${OUT}/full-game-palette.png` });

  // ascii playground
  await scrollToEl(page, '[data-world="1"]');
  await sleep(500);
  await page.click('input[aria-label="Character"]');
  await page.keyboard.press("#");
  await page.click('input[aria-label="Rows, 3 to 9"]');
  await page.keyboard.down("Control");
  await page.keyboard.press("a");
  await page.keyboard.up("Control");
  await page.keyboard.press("5");
  await page.keyboard.press("Enter");
  await sleep(1400);
  out.asciiOutRows = await page.evaluate(
    () => document.querySelectorAll("[data-ascii-out] > div").length,
  );
  out.asciiOutHasChar = await page.evaluate(() =>
    (document.querySelector("[data-ascii-out]")?.textContent || "").includes("#"),
  );
  await page.screenshot({ path: `${OUT}/full-ascii.png` });

  // logic drag (scroll deep enough that the scrub fully assembles)
  await scrollToEl(page, "[data-fragments]", -150);
  await sleep(1800);
  const frag = await page.$("[data-fragment]");
  const fb = await frag.boundingBox();
  await page.mouse.move(fb.x + 30, fb.y + 10);
  await page.mouse.down();
  await page.mouse.move(fb.x + 150, fb.y + 70, { steps: 10 });
  await sleep(200);
  out.logicDragged = await page.evaluate(() => {
    const m = document.querySelector("[data-fragment]").style.transform;
    const nums = m.match(/-?\d+\.?\d*/g)?.map(Number) ?? [];
    return nums.some((n) => Math.abs(n) > 20);
  });
  await page.mouse.up();
  await sleep(800);
  out.logicSprungBack = await page.evaluate(() => {
    const m = document.querySelector("[data-fragment]").style.transform;
    if (m === "" || m === "translate(0px, 0px)") return true;
    const nums = m.match(/-?\d+\.?\d*/g)?.map(Number) ?? [];
    return nums.filter((n, i) => i >= 4).every((n) => Math.abs(n) < 1);
  });

  // process pin
  await page.evaluate(() => {
    const el = document.querySelector("[data-steps]");
    const y = el.getBoundingClientRect().top + window.scrollY - window.innerHeight / 2;
    window.scrollTo({ top: y + window.innerHeight * 0.7, behavior: "instant" });
  });
  await sleep(1600);
  out.pinSpacer = await page.evaluate(() => !!document.querySelector(".pin-spacer"));
  await page.screenshot({ path: `${OUT}/full-process-pin.png` });

  console.log("\n=== FULL (work=false) ===");
  console.log(JSON.stringify(out, null, 1));
  console.log(errors.length ? `ERRORS:\n${errors.join("\n")}` : "no page errors");
  await browser.close();
}

// ---------- pass B: WORK shown (5174) ---------------------------------------
{
  const browser = await launch({ width: 1440, height: 900 });
  const { page, errors } = await newPage(browser, false);
  await page.goto("http://localhost:5174/", { waitUntil: "domcontentloaded", timeout: 60000 });
  await sleep(3000);
  const out = {};
  out.workSection = await page.evaluate(() => !!document.querySelector("#work"));
  out.navLinks = await page.evaluate(() =>
    [...document.querySelectorAll("header nav ul a")].map((a) => a.textContent.trim()).join("|"),
  );
  out.caseCards = await page.evaluate(
    () => document.querySelectorAll("[data-case-card]").length,
  );
  console.log("\n=== WORK=true ===");
  console.log(JSON.stringify(out, null, 1));
  console.log(errors.length ? `ERRORS:\n${errors.join("\n")}` : "no page errors");
  await browser.close();
}

// ---------- pass C: reduced motion (5173) -----------------------------------
{
  const browser = await launch({ width: 1440, height: 900 });
  const { page, errors } = await newPage(browser, true);
  await page.goto("http://localhost:5173/", { waitUntil: "domcontentloaded", timeout: 60000 });
  await sleep(2500);
  const out = {};
  out.rotatingLine = await page.evaluate(() => !!document.querySelector("[data-hero-line]"));
  await scrollToEl(page, '[data-world="0"]');
  await sleep(700);
  out.gameHandles = await page.evaluate(
    () => document.querySelectorAll('button[aria-label^="Drag node"]').length,
  );
  await page.screenshot({ path: `${OUT}/rm-game.png` });
  // palette still works (static re-render, no crash)
  await page.click('button[aria-label="Fill colour: sand gold"]');
  await sleep(300);
  // ascii renders instantly
  await scrollToEl(page, '[data-world="1"]');
  await page.click('input[aria-label="Character"]');
  await page.keyboard.press("=");
  await page.keyboard.press("Enter");
  await sleep(150);
  out.asciiInstant = await page.evaluate(
    () => document.querySelectorAll("[data-ascii-out] > div").length,
  );
  await scrollToEl(page, "[data-steps]");
  await sleep(800);
  out.pinSpacer = await page.evaluate(() => !!document.querySelector(".pin-spacer"));
  out.connectorFull = await page.evaluate(() => {
    const el = document.querySelector("[data-connector-x]");
    const t = getComputedStyle(el).transform;
    return t === "none" || t.startsWith("matrix(1,");
  });
  console.log("\n=== REDUCED ===");
  console.log(JSON.stringify(out, null, 1));
  console.log(errors.length ? `ERRORS:\n${errors.join("\n")}` : "no page errors");
  await browser.close();
}

// ---------- pass D: mobile (5173) -------------------------------------------
{
  const browser = await launch({ width: 390, height: 844, isMobile: true, hasTouch: true });
  const { page, errors } = await newPage(browser, false);
  await page.goto("http://localhost:5173/", { waitUntil: "domcontentloaded", timeout: 60000 });
  await sleep(13500);
  await page.screenshot({ path: `${OUT}/m-hero.png` });
  await scrollToEl(page, '[data-world="0"]');
  await sleep(3400);
  await page.screenshot({ path: `${OUT}/m-game.png` });
  const out = {};
  out.gameHandles = await page.evaluate(
    () => document.querySelectorAll('button[aria-label^="Drag node"]').length,
  );
  console.log("\n=== MOBILE ===");
  console.log(JSON.stringify(out, null, 1));
  console.log(errors.length ? `ERRORS:\n${errors.join("\n")}` : "no page errors");
  await browser.close();
}
