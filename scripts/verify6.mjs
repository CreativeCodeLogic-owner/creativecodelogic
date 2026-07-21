// v6 verification: hero y-stability across 2 loops, comet ambient, matrix
// terminal, process dot fills, footer line, height budget, reduced + mobile.
import puppeteer from "puppeteer-core";

const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const OUT = "scripts/shots/v6";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const fs = await import("node:fs");
fs.mkdirSync(OUT, { recursive: true });

async function launch(viewport) {
  return puppeteer.launch({
    executablePath: CHROME,
    headless: "new",
    args: ["--disable-gpu", "--no-first-run", "--hide-scrollbars"],
    defaultViewport: viewport,
  });
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

  // --- 1. hero y-stability over two loops -----------------------------------
  await sleep(12500);
  const ys = [];
  for (let i = 0; i < 90; i++) {
    ys.push(
      await page.evaluate(() => {
        const f = document.querySelector("[data-hero-final]");
        const l = document.querySelector("[data-hero-line]");
        return [f?.getBoundingClientRect().y ?? -1, l?.getBoundingClientRect().y ?? -1];
      }),
    );
    await sleep(240);
  }
  const yVals = ys.flat();
  out.heroYDrift = (Math.max(...yVals) - Math.min(...yVals)).toFixed(2);
  out.heroCopy = await page.evaluate(() => ({
    h1: document.querySelector("[data-hero-final]")?.textContent,
    sub: document.querySelector("[data-hero-stagger]")?.textContent?.trim(),
  }));

  // --- 2. creative comet ----------------------------------------------------
  await scrollToEl(page, '[data-world="0"]');
  await sleep(2200); // mid-travel
  await page.screenshot({ path: `${OUT}/full-comet-mid.png` });
  await sleep(4000); // fill + hold
  await page.screenshot({ path: `${OUT}/full-comet-hold.png` });
  out.gameInteractiveLeftovers = await page.evaluate(
    () =>
      document.querySelectorAll('button[aria-label^="Drag node"]').length +
      (document.querySelector('button[aria-label="Reset the mark"]') ? 1 : 0),
  );
  out.paletteLabels = await page.evaluate(() => {
    const t = document.body.innerText.toLowerCase();
    return t.includes("outline color") && t.includes("fill color");
  });
  await page.click('button[aria-label="outline color: sand gold"]');
  await sleep(300);
  await page.screenshot({ path: `${OUT}/full-comet-palette.png` });

  // layout checks for Creative: mark/grid clear of copy, palette in viewport
  out.creativeNoOverlap = await page.evaluate(() => {
    const panel = document.querySelector('[data-world="0"]');
    const copy = panel.querySelector('[data-world-copy]');
    const panelR = panel.getBoundingClientRect();
    const copyR = copy.getBoundingClientRect();
    const gx = panelR.left + parseFloat(getComputedStyle(panel).getPropertyValue('--gx'));
    const gy = panelR.top + parseFloat(getComputedStyle(panel).getPropertyValue('--gy'));
    const gs = parseFloat(getComputedStyle(panel).getPropertyValue('--gs'));
    const markW = (gs * 340) / 512;
    const markH = (gs * 278) / 512;
    const gridSide = gs * 0.8;
    const boxes = [
      { l: gx - markW / 2, r: gx + markW / 2, t: gy - markH / 2, b: gy + markH / 2 },
      { l: gx - gridSide / 2, r: gx + gridSide / 2, t: gy - gridSide / 2, b: gy + gridSide / 2 },
    ];
    return boxes.every(
      (m) =>
        m.r <= copyR.left + 2 ||
        m.l >= copyR.right - 2 ||
        m.b <= copyR.top + 2 ||
        m.t >= copyR.bottom - 2,
    );
  });
  out.paletteInViewport = await page.evaluate(() => {
    const pal = document
      .querySelector('[aria-label="outline color"]')
      ?.closest('.absolute.z-20');
    if (!pal) return false;
    const r = pal.getBoundingClientRect();
    return r.top >= -2 && r.bottom <= window.innerHeight + 2;
  });

  // --- 3. code matrix ---------------------------------------------------------
  await scrollToEl(page, '[data-world="1"]');
  await sleep(9500); // log + metrics + hold + matrix formed
  out.matrixRows = await page.evaluate(() => {
    const t = document.querySelector("[data-ascii-stage]")?.textContent ?? "";
    return t.split("\n").filter((r) => r.trim().length > 0).length;
  });
  out.matrixHasBraille = await page.evaluate(() => {
    const t = document.querySelector("[data-ascii-stage]")?.textContent ?? "";
    return [...t].some((c) => c.charCodeAt(0) >= 0x2800 && c.charCodeAt(0) <= 0x28ff);
  });
  await page.screenshot({ path: `${OUT}/full-matrix.png` });
  // wait for matrix phase, then check the art is fully inside the terminal box
  let matrixCheck = null;
  for (let i = 0; i < 30 && (!matrixCheck || !matrixCheck.ok); i++) {
    await sleep(200);
    matrixCheck = await page.evaluate(() => {
      const stage = document.querySelector('[data-ascii-stage]');
      const body = document.querySelector('[data-terminal-body]');
      if (!stage || !body) return { ok: false };
      if (body.getAttribute('data-phase') !== 'matrix') return { ok: false };
      if (getComputedStyle(stage).display === 'none') return { ok: false };
      const toObj = (r) => ({ top: r.top, left: r.left, bottom: r.bottom, right: r.right });
      const s = toObj(stage.getBoundingClientRect());
      const b = toObj(body.getBoundingClientRect());
      return {
        ok:
          s.top >= b.top - 1 &&
          s.left >= b.left - 1 &&
          s.bottom <= b.bottom + 1 &&
          s.right <= b.right + 1,
      };
    });
  }
  out.matrixInsideTerminal = matrixCheck?.ok ?? false;
  // poll for the loop restart (log visible again, stage hidden)
  out.terminalRestarted = false;
  for (let i = 0; i < 24 && !out.terminalRestarted; i++) {
    await sleep(500);
    out.terminalRestarted = await page.evaluate(() => {
      const first = document.querySelector("[data-log-line]");
      const stage = document.querySelector("[data-ascii-stage]");
      return (
        getComputedStyle(first).visibility === "visible" &&
        getComputedStyle(stage).visibility === "hidden"
      );
    });
  }

  // --- 4. process dots fill ---------------------------------------------------
  await page.evaluate(() => {
    const el = document.querySelector("[data-steps]");
    const y = el.getBoundingClientRect().top + window.scrollY - window.innerHeight / 2;
    window.scrollTo({ top: y + window.innerHeight * 0.14, behavior: "instant" });
  });
  await sleep(1500);
  out.dotsMid = await page.evaluate(() =>
    [...document.querySelectorAll("[data-step-dot]")].map(
      (d) => getComputedStyle(d).backgroundColor === "rgb(87, 211, 254)",
    ),
  );
  await page.evaluate(() => {
    const el = document.querySelector("[data-steps]");
    const y = el.getBoundingClientRect().top + window.scrollY - window.innerHeight / 2;
    window.scrollTo({ top: y + window.innerHeight * 0.5, behavior: "instant" });
  });
  await sleep(1500);
  out.dotsEnd = await page.evaluate(() =>
    [...document.querySelectorAll("[data-step-dot]")].map(
      (d) => getComputedStyle(d).backgroundColor === "rgb(87, 211, 254)",
    ),
  );
  out.sealStamped = await page.evaluate(() => {
    const s = document.querySelector("[data-step] [data-seal]");
    return s ? parseFloat(getComputedStyle(s).opacity) > 0.9 : false;
  });
  await page.screenshot({ path: `${OUT}/full-process.png` });

  // --- 5. footer + budget -----------------------------------------------------
  out.footerLine = await page.evaluate(() => {
    const t = document.querySelector("footer")?.textContent ?? "";
    return t.includes("© 2026 Built with Creative Code Logic") && t.includes("Designed to solve. Built to perform.");
  });
  out.scrollHeight = await page.evaluate(() => Math.round(document.body.scrollHeight));

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
  out.terminalStatic = await page.evaluate(() => {
    const lines = [...document.querySelectorAll("[data-log-line]")].every(
      (el) => getComputedStyle(el).visibility === "visible",
    );
    const stage = document.querySelector("[data-ascii-stage]");
    const formed =
      getComputedStyle(stage).visibility === "visible" &&
      (stage.textContent ?? "").split("\n").filter((r) => r.trim()).length >= 10;
    return lines && formed;
  });
  out.noInteractive = await page.evaluate(
    () =>
      !document.querySelector('input[aria-label="Terminal command"]') &&
      !document.querySelector("[data-hint]") &&
      document.querySelectorAll('button[aria-label^="Drag node"]').length === 0,
  );
  out.pinSpacer = await page.evaluate(() => !!document.querySelector(".pin-spacer"));
  await page.screenshot({ path: `${OUT}/rm-terminal.png` });
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
  await sleep(13000);
  await page.screenshot({ path: `${OUT}/m-hero.png` });
  await scrollToEl(page, '[data-world="0"]');
  await sleep(5500);
  await page.screenshot({ path: `${OUT}/m-comet.png` });
  await scrollToEl(page, '[data-world="1"]');
  await sleep(9500);
  await page.screenshot({ path: `${OUT}/m-matrix.png` });
  const out = {};
  out.matrixRows = await page.evaluate(() => {
    const t = document.querySelector("[data-ascii-stage]")?.textContent ?? "";
    return t.split("\n").filter((r) => r.trim().length > 0).length;
  });
  console.log("\n=== MOBILE ===");
  console.log(JSON.stringify(out, null, 1));
  console.log(errors.length ? `ERRORS:\n${errors.join("\n")}` : "no page errors");
  await browser.close();
}
