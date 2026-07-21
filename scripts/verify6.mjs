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
  // ignore third-party reCAPTCHA noise — we only assert on our own code
  const ignore = (t) => /recaptcha|grecaptcha|gstatic|google\.com\/recaptcha/i.test(t || "");
  page.on("console", (m) => {
    if (m.type() === "error" && !ignore(m.text())) errors.push(`console.error: ${m.text()}`);
  });
  page.on("pageerror", (e) => {
    if (!ignore(e.message)) errors.push(`pageerror: ${e.message}`);
  });
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
  // palette swatch: ≥40px hit area while the visible dot stays 16px (offsetWidth
  // ignores the selected scale transform)
  out.paletteHit = await page.evaluate(() => {
    const btn = document.querySelector('button[aria-label^="outline color:"]');
    if (!btn) return null;
    const dot = btn.firstElementChild;
    return {
      hit: Math.min(btn.offsetWidth, btn.offsetHeight),
      dot: dot ? dot.offsetWidth : 0,
    };
  });
  // hamburger is desktop-hidden at ≥768px
  out.hamburgerHiddenDesktop = await page.evaluate(() => {
    const h = document.querySelector('[aria-label="Open menu"]');
    return h ? getComputedStyle(h).display === "none" : false;
  });

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

  // --- 3b. logic blueprint ----------------------------------------------------
  // assemble the mark: put the stage centre ~40% up the viewport (scrub → 1)
  await page.evaluate(() => {
    const stage = document.querySelector('[data-world="2"] [data-stage]');
    const r = stage.getBoundingClientRect();
    const target = r.top + window.scrollY + r.height / 2 - window.innerHeight * 0.4;
    window.scrollTo({ top: target, behavior: "instant" });
  });
  await sleep(1400); // scrub settle
  out.logic = await page.evaluate(() => {
    const panel = document.querySelector('[data-world="2"]');
    if (!panel) return null;
    return {
      blueprint: panel.querySelectorAll("[data-blueprint]").length,
      guides: panel.querySelectorAll("[data-guide]").length, // 3 circles + 2 centre lines
      loops: panel.querySelectorAll("[data-loop]").length,
      ticks: panel.querySelectorAll("[data-tick]").length,
      plotter: panel.querySelectorAll("[data-plotter]").length, // drafting-detail pass
      dims: panel.querySelectorAll("[data-dim]").length, // dimension/annotation layer
      regmarks: panel.querySelectorAll("[data-regmark]").length, // sheet corners
      hasAngleLabel: /120°/.test(panel.textContent || ""),
      fragments: panel.querySelectorAll("[data-fragment]").length, // old mechanic, must be 0
      hasPersonalText: /ghassan|weekly report|revenue|uptime|save changes|earned/i.test(
        panel.textContent || "",
      ),
    };
  });
  out.logicLoopDrag = await page.evaluate(() => {
    // once assembled the three loops carry the grab cursor (drag → springs back)
    const loops = [...document.querySelectorAll('[data-world="2"] [data-loop]')];
    return loops.length === 3 && loops.every((l) => l.classList.contains("cursor-grab"));
  });
  await page.screenshot({ path: `${OUT}/full-logic.png` });

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

  // --- 6. brief flow (opens inline; walked but never actually submitted) ------
  await page.evaluate(() => document.querySelector("#contact").scrollIntoView({ block: "center" }));
  await sleep(400);
  const footTop = () =>
    page.evaluate(() => Math.round(document.querySelector("footer").getBoundingClientRect().top + window.scrollY));
  const docH = () => page.evaluate(() => Math.round(document.documentElement.scrollHeight));
  const shClosed = await docH();
  const footClosed = await footTop();
  const brief = {};
  // lazy-load proof: no reCAPTCHA script before any form is opened
  brief.recaptchaBeforeOpen = await page.evaluate(
    () => !!document.querySelector('script[src*="recaptcha"]'),
  );
  await page.click("[data-brief-open]");
  await sleep(600);
  brief.formShown = await page.evaluate(() => !!document.querySelector("[data-brief-form]"));
  brief.heightStableOnOpen = (await docH()) === shClosed; // scrollHeight unchanged (±0)
  brief.footerStableOnOpen = (await footTop()) === footClosed; // footer does not shift
  brief.focusStep1 = await page.evaluate(() => document.activeElement?.hasAttribute("data-chip") === true);
  // step 1: choose a chip, Enter advances from the optional note field
  await page.click("[data-chip]");
  brief.chipPressed = await page.evaluate(
    () => document.querySelector("[data-chip]").getAttribute("aria-pressed") === "true",
  );
  await page.focus("#brief-kind-note");
  await page.keyboard.press("Enter");
  await sleep(400);
  brief.focusStep2 = await page.evaluate(() => document.activeElement?.tagName === "TEXTAREA");
  brief.nextDisabledShort = await page.evaluate(() => document.querySelector("[data-brief-next]").disabled === true);
  await page.type("#brief-problem", "A booking system for a small clinic.");
  brief.nextEnabledValid = await page.evaluate(() => document.querySelector("[data-brief-next]").disabled === false);
  await page.click("[data-brief-next]");
  await sleep(400);
  brief.focusStep3 = await page.evaluate(() => document.activeElement?.hasAttribute("data-chip") === true);
  brief.submitDisabledInvalid = await page.evaluate(
    () => document.querySelector("[data-brief-submit]").disabled === true,
  );
  await page.click("[data-chip]"); // pick a timing
  await page.type("#brief-email", "sam@clinic.io");
  await sleep(150);
  brief.submitEnabledValid = await page.evaluate(
    () => document.querySelector("[data-brief-submit]").disabled === false,
  );
  // brief loads NO reCAPTCHA — captcha is contact-drawer only now (flipped)
  brief.noRecaptchaAfterBriefWalk = await page.evaluate(
    () => !document.querySelector('script[src*="recaptcha"]'),
  );
  // STOP here — do NOT submit (no network call to submit-form.com in CI)
  await page.screenshot({ path: `${OUT}/full-brief.png` });

  // --- 6b. brief close affordance + state preservation -----------------------
  // brief is open at step 3 (kind/problem/timing/email all set). Close via ×,
  // reopen, and confirm the flow resumes exactly where it was left.
  const briefClose = {};
  const footBeforeClose = await footTop();
  await page.click("[data-brief-close]");
  await sleep(500);
  briefClose.ctaVisibleAfterClose = await page.evaluate(
    () => !!document.querySelector("[data-brief-open]") && !document.querySelector("[data-brief-form]"),
  );
  briefClose.focusOnCta = await page.evaluate(
    () => document.activeElement?.hasAttribute("data-brief-open") === true,
  );
  briefClose.footerUnchanged = (await footTop()) === footBeforeClose;
  // reopen — must resume at step 3 with the email + timing intact
  await page.click("[data-brief-open]");
  await sleep(500);
  briefClose.reopenSameStep = await page.evaluate(() => !!document.querySelector("[data-brief-submit]"));
  briefClose.emailIntact = await page.evaluate(
    () => (document.querySelector("#brief-email")?.value ?? "").includes("@"),
  );
  briefClose.timingChipIntact = await page.evaluate(
    () => [...document.querySelectorAll("[data-chip]")].some((c) => c.getAttribute("aria-pressed") === "true"),
  );
  // step 2 text + step 1 chip also survived (walk back)
  await page.click("[data-brief-back]");
  await sleep(300);
  briefClose.problemIntact = await page.evaluate(
    () => (document.querySelector("#brief-problem")?.value?.length ?? 0) > 0,
  );
  await page.click("[data-brief-back]");
  await sleep(300);
  briefClose.chipIntact = await page.evaluate(
    () => [...document.querySelectorAll("[data-chip]")].some((c) => c.getAttribute("aria-pressed") === "true"),
  );
  // Esc from inside the brief closes it
  await page.focus("#brief-kind-note");
  await page.keyboard.press("Escape");
  await sleep(400);
  briefClose.escInsideCloses = await page.evaluate(() => !document.querySelector("[data-brief-form]"));
  // reopen, then Esc from OUTSIDE the brief (a nav link) must NOT close it
  await page.click("[data-brief-open]");
  await sleep(400);
  await page.focus('header a[href="#process"]');
  await page.keyboard.press("Escape");
  await sleep(300);
  briefClose.escOutsideNoClose = await page.evaluate(() => !!document.querySelector("[data-brief-form]"));
  // tidy up: close the brief before moving on
  await page.click("[data-brief-close]");
  await sleep(400);
  out.briefClose = briefClose;

  // --- 7. hello drawer (opened + closed every way; never submitted) ----------
  const hello = {};
  await page.click("[data-hello-open]");
  await sleep(600);
  hello.dialogRole = await page.evaluate(
    () => !!document.querySelector('[role="dialog"][aria-modal="true"]'),
  );
  hello.focusEmail = await page.evaluate(() => document.activeElement?.id === "hello-email");
  // no email anywhere in the contact UI
  hello.noMailto = await page.evaluate(
    () => document.querySelectorAll('[role="dialog"] a[href^="mailto:"]').length === 0,
  );
  hello.noAtInText = await page.evaluate(
    () => !((document.querySelector('[role="dialog"]')?.innerText) || "").includes("@"),
  );
  // captcha: contact drawer only, lazy-loaded on open. [data-captcha] present ⇒
  // sitekey configured ⇒ script + checkbox iframe must render. Skip if no key.
  hello.captchaConfigured = await page.evaluate(
    () => !!document.querySelector('[role="dialog"] [data-captcha]'),
  );
  if (hello.captchaConfigured) {
    await sleep(2500); // let api.js + the checkbox iframe load
    hello.recaptchaScriptLoaded = await page.evaluate(
      () => !!document.querySelector('script[src*="recaptcha"]'),
    );
    hello.checkboxIframe = await page.evaluate(
      () => !!document.querySelector('[role="dialog"] iframe[src*="recaptcha"]'),
    );
  } else {
    hello.recaptchaScriptLoaded = "skipped (no sitekey)";
    hello.checkboxIframe = "skipped (no sitekey)";
  }
  // valid fields but captcha unsolved → Send stays disabled (CI can't solve it).
  // Without a sitekey there is no captcha gate, so Send is enabled instead.
  await page.type("#hello-email", "sam@clinic.io");
  await page.type("#hello-message", "Quick hello, just a short note.");
  await sleep(150);
  hello.sendGatedByCaptcha = await page.evaluate((configured) => {
    const disabled = document.querySelector("[data-hello-submit]").disabled;
    return configured ? disabled === true : disabled === false;
  }, hello.captchaConfigured);
  await page.screenshot({ path: `${OUT}/full-hello.png` });
  // Tab many times — focus must never leave the dialog
  for (let i = 0; i < 12; i++) await page.keyboard.press("Tab");
  hello.tabStaysInside = await page.evaluate(
    () => document.querySelector('[role="dialog"]')?.contains(document.activeElement) === true,
  );
  await page.keyboard.down("Shift");
  for (let i = 0; i < 4; i++) await page.keyboard.press("Tab");
  await page.keyboard.up("Shift");
  hello.shiftTabStaysInside = await page.evaluate(
    () => document.querySelector('[role="dialog"]')?.contains(document.activeElement) === true,
  );
  // Esc closes + focus returns to the trigger (from a form control, as a user
  // would — Esc inside the cross-origin captcha iframe can't be intercepted)
  await page.focus("#hello-email");
  await page.keyboard.press("Escape");
  await sleep(500);
  hello.closedByEsc = await page.evaluate(() => !document.querySelector('[role="dialog"]'));
  hello.focusBackOnTrigger = await page.evaluate(
    () => document.activeElement?.hasAttribute("data-hello-open") === true,
  );
  // reopen, then backdrop click closes (desktop: panel is right-anchored)
  await page.click("[data-hello-open]");
  await sleep(600);
  await page.mouse.click(20, 20);
  await sleep(500);
  hello.closedByBackdrop = await page.evaluate(() => !document.querySelector('[role="dialog"]'));
  // after the open/close/reopen cycle (still scrolled into contact), the nav's
  // scrolled-state class must survive — no drop from the drawer's teardown
  await sleep(250);
  hello.navScrolledSurvivesCycle = await page.evaluate(
    () => document.querySelector("header")?.classList.contains("nav-scrolled") === true,
  );
  out.brief = brief;
  out.hello = hello;

  // --- 8. nav scrolled-state holds at the very bottom (unbounded trigger) -----
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  await sleep(500);
  out.navScrolledAtBottom = await page.evaluate(
    () => document.querySelector("header")?.classList.contains("nav-scrolled") === true,
  );

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

  // brief close/reopen works with instant swaps under reduced motion
  await page.evaluate(() => document.querySelector("#contact").scrollIntoView({ block: "center" }));
  await sleep(300);
  await page.click("[data-brief-open]");
  await sleep(200);
  out.rmBriefOpens = await page.evaluate(() => !!document.querySelector("[data-brief-form]"));
  await page.click("[data-chip]"); // leave some state
  await page.click("[data-brief-close]");
  await sleep(200);
  out.rmBriefCloses = await page.evaluate(
    () => !!document.querySelector("[data-brief-open]") && !document.querySelector("[data-brief-form]"),
  );
  await page.click("[data-brief-open]");
  await sleep(200);
  out.rmBriefReopensWithState = await page.evaluate(
    () => [...document.querySelectorAll("[data-chip]")].some((c) => c.getAttribute("aria-pressed") === "true"),
  );

  // nav scrolled-state must apply under reduced motion too (would fail pre-fix)
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  await sleep(500);
  out.navScrolledAtBottom = await page.evaluate(
    () => document.querySelector("header")?.classList.contains("nav-scrolled") === true,
  );
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

  // --- mobile menu ------------------------------------------------------------
  await page.evaluate(() => window.scrollTo(0, 0));
  await sleep(400);
  const menu = {};
  menu.hamburgerVisible = await page.evaluate(() => {
    const h = document.querySelector('[aria-label="Open menu"]');
    if (!h) return false;
    const r = h.getBoundingClientRect();
    return getComputedStyle(h).display !== "none" && r.width >= 44 && r.height >= 44;
  });
  await page.click('[aria-label="Open menu"]');
  await sleep(500);
  await page.screenshot({ path: `${OUT}/m-menu.png` });
  menu.dialogRole = await page.evaluate(() => {
    const d = document.querySelector("#mobile-menu");
    return d?.getAttribute("role") === "dialog" && d?.getAttribute("aria-modal") === "true";
  });
  menu.focusInside = await page.evaluate(
    () => document.querySelector("#mobile-menu")?.contains(document.activeElement) === true,
  );
  menu.scrollLocked = await page.evaluate(
    () => getComputedStyle(document.documentElement).overflow === "hidden",
  );
  for (let i = 0; i < 10; i++) await page.keyboard.press("Tab");
  menu.tabStaysInside = await page.evaluate(
    () => document.querySelector("#mobile-menu")?.contains(document.activeElement) === true,
  );
  await page.keyboard.press("Escape");
  await sleep(400);
  menu.closedByEsc = await page.evaluate(() => !document.querySelector("#mobile-menu"));
  menu.focusBackOnHamburger = await page.evaluate(
    () => document.activeElement?.getAttribute("aria-label") === "Open menu",
  );
  menu.scrollUnlocked = await page.evaluate(
    () => getComputedStyle(document.documentElement).overflow !== "hidden",
  );
  // open → click Process → menu closes AND page scrolls to #process
  await page.click('[aria-label="Open menu"]');
  await sleep(500);
  await page.click('#mobile-menu a[href="#process"]');
  await sleep(2000);
  menu.closedByNav = await page.evaluate(() => !document.querySelector("#mobile-menu"));
  menu.scrolledToProcess = await page.evaluate(() => {
    const el = document.querySelector("#process");
    if (!el) return false;
    const top = el.getBoundingClientRect().top;
    return top >= -140 && top <= 340; // near the top (scrollToId offset -64)
  });
  out.menu = menu;

  // reduced-motion: menu opens/closes instantly, no errors
  const rmPage = await browser.newPage();
  const rmErrors = watch(rmPage);
  await rmPage.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "reduce" }]);
  await rmPage.goto("http://localhost:5173/", { waitUntil: "domcontentloaded", timeout: 60000 });
  await sleep(1500);
  await rmPage.click('[aria-label="Open menu"]');
  await sleep(200);
  menu.rmOpens = await rmPage.evaluate(() => !!document.querySelector("#mobile-menu"));
  await rmPage.keyboard.press("Escape");
  await sleep(200);
  menu.rmCloses = await rmPage.evaluate(() => !document.querySelector("#mobile-menu"));
  errors.push(...rmErrors);
  await rmPage.close();

  console.log("\n=== MOBILE ===");
  console.log(JSON.stringify(out, null, 1));
  console.log(errors.length ? `ERRORS:\n${errors.join("\n")}` : "no page errors");
  await browser.close();
}
