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
  // fonts are self-hosted — no third-party font requests allowed, and the old
  // Inter / Space Grotesk faces must never be fetched after the Aptos switch
  let googleFontReq = false;
  let oldFontReq = false;
  page.on("request", (r) => {
    if (/fonts\.(googleapis|gstatic)\.com/.test(r.url())) googleFontReq = true;
    if (/(inter|space-grotesk)\.woff2?/i.test(r.url())) oldFontReq = true;
  });
  await page.goto("http://localhost:5173/", { waitUntil: "domcontentloaded", timeout: 60000 });
  const out = {};

  // --- 0. self-hosted fonts --------------------------------------------------
  await sleep(1500);
  out.noGoogleFonts = !googleFontReq;
  out.noOldFontReq = !oldFontReq; // no Inter / Space Grotesk fetches
  out.fonts = await page.evaluate(async () => {
    const fam = (sel) => {
      const el = document.querySelector(sel);
      return el ? getComputedStyle(el).fontFamily : null;
    };
    // wait out font-display swap so computed family reflects the loaded face
    if (document.fonts?.ready) await document.fonts.ready;
    const h1 = fam("#hero-heading");
    const body = getComputedStyle(document.body).fontFamily;
    return {
      h1,
      body,
      terminal: fam("[data-terminal-body]"),
      h1IsAptos: /aptos/i.test(h1 || ""),
      bodyIsAptos: /aptos/i.test(body || ""),
      // the weights the site actually uses must be genuinely loaded (no fake bold)
      checkRegular: document.fonts.check('400 16px "Aptos"'),
      checkSemibold: document.fonts.check('600 16px "Aptos"'),
      checkBold: document.fonts.check('700 16px "Aptos"'),
    };
  });

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
    // v2 mark: authored non-square viewBox 460.66×428.07 (fills it). WorldCreative
    // scales by size / max(VB) and the mark spans the full viewBox, so on-screen
    // extent is gs·(VB_W/VB_MAX) × gs·(VB_H/VB_MAX).
    const VB_W = 460.66, VB_H = 428.07, VB_MAX = Math.max(VB_W, VB_H);
    const markW = (gs * VB_W) / VB_MAX;
    const markH = (gs * VB_H) / VB_MAX;
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
  // the assembled stage must be the authored ASCII mark (src/data/triquetraAscii.ts):
  // 19 rows, and a distinctive fragment of the art present verbatim
  out.matrixIsAsciiMark = await page.evaluate(() => {
    const t = document.querySelector("[data-ascii-stage]")?.textContent ?? "";
    const lines = t.split("\n");
    return {
      rows: lines.filter((r) => r.length > 0).length,
      maxCols: Math.max(0, ...lines.map((l) => l.length)),
      hasSignatureLine: t.includes(",mkkkO.") && t.includes("13QRQHw"),
    };
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
        h: body.offsetHeight, // terminal box height while in the matrix phase
      };
    });
  }
  out.matrixInsideTerminal = matrixCheck?.ok ?? false;
  out.terminalHeightMatrix = matrixCheck?.h ?? null;
  // poll for the loop restart (log visible again, stage hidden)
  out.terminalRestarted = false;
  out.terminalHeightLog = null;
  for (let i = 0; i < 24 && !out.terminalRestarted; i++) {
    await sleep(500);
    const r = await page.evaluate(() => {
      const first = document.querySelector("[data-log-line]");
      const stage = document.querySelector("[data-ascii-stage]");
      const body = document.querySelector("[data-terminal-body]");
      return {
        restarted:
          getComputedStyle(first).visibility === "visible" &&
          getComputedStyle(stage).visibility === "hidden",
        h: body.offsetHeight,
      };
    });
    out.terminalRestarted = r.restarted;
    if (r.restarted) out.terminalHeightLog = r.h; // box height back in the log phase
  }
  // the box must never resize between phases (locked to the taller of the two)
  out.terminalHeightConstant =
    out.terminalHeightMatrix != null &&
    out.terminalHeightMatrix === out.terminalHeightLog;

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
    // real construction geometry (src/data/triquetraBuild.ts): 13 circles
    const circles = [...panel.querySelectorAll("circle[data-guide]")];
    // alignment spot-check: the centre circle (r≈37.18) must sit on the composition
    // centre (230.73, 249.51) — proves the build-sheet→mark coordinate transform
    const centre = circles
      .map((c) => ({ cx: +c.getAttribute("cx"), cy: +c.getAttribute("cy"), r: +c.getAttribute("r") }))
      .find((c) => Math.abs(c.r - 37.18) < 0.5);
    const centreResidual = centre
      ? Math.hypot(centre.cx - 230.73, centre.cy - 249.51)
      : null;
    const txt = panel.textContent || "";
    return {
      blueprint: panel.querySelectorAll("[data-blueprint]").length,
      guides: panel.querySelectorAll("[data-guide]").length, // 13 circles + 2 centre lines
      guideCircles: circles.length, // must equal the real build-circle count (13)
      centreResidual: centreResidual == null ? null : +centreResidual.toFixed(3),
      loops: panel.querySelectorAll("[data-loop]").length,
      ticks: panel.querySelectorAll("[data-tick]").length,
      plotter: panel.querySelectorAll("[data-plotter]").length, // drafting-detail pass
      dims: panel.querySelectorAll("[data-dim]").length, // dimension/annotation layer
      regmarks: panel.querySelectorAll("[data-regmark]").length, // sheet corners
      hasAngleLabel: /120°/.test(txt),
      hasSheetDims: /460\s*×\s*428/.test(txt), // real dims replaced the old "1:1"
      noOneToOne: !/\b1:1\b/.test(txt),
      hasCircleLegend: /C1/.test(txt) && /C2/.test(txt) && /C3/.test(txt), // C1–C3 circle legends
      fragments: panel.querySelectorAll("[data-fragment]").length, // old mechanic, must be 0
      hasPersonalText: /ghassan|weekly report|revenue|uptime|save changes|earned/i.test(txt),
    };
  });
  out.logicLoopDrag = await page.evaluate(() => {
    // once assembled the three loops carry the grab cursor (drag → springs back)
    const loops = [...document.querySelectorAll('[data-world="2"] [data-loop]')];
    return loops.length === 3 && loops.every((l) => l.classList.contains("cursor-grab"));
  });
  await page.screenshot({ path: `${OUT}/full-logic.png` });

  // --- 4. process dots fill (pin now draws over +=80% — slower pacing) --------
  await page.evaluate(() => {
    const el = document.querySelector("[data-steps]");
    const y = el.getBoundingClientRect().top + window.scrollY - window.innerHeight / 2;
    window.scrollTo({ top: y + window.innerHeight * 0.4, behavior: "instant" });
  });
  await sleep(1500);
  out.dotsMid = await page.evaluate(() =>
    [...document.querySelectorAll("[data-step-dot]")].map(
      (d) => getComputedStyle(d).backgroundColor === "rgb(83, 210, 255)",
    ),
  );
  // step 04 is now "Ship"
  out.step04Heading = await page.evaluate(
    () => [...document.querySelectorAll("[data-step] h3")].map((h) => h.textContent)[3],
  );
  await page.evaluate(() => {
    const el = document.querySelector("[data-steps]");
    const y = el.getBoundingClientRect().top + window.scrollY - window.innerHeight / 2;
    window.scrollTo({ top: y + window.innerHeight * 0.75, behavior: "instant" });
  });
  await sleep(1500);
  out.dotsEnd = await page.evaluate(() =>
    [...document.querySelectorAll("[data-step-dot]")].map(
      (d) => getComputedStyle(d).backgroundColor === "rgb(83, 210, 255)",
    ),
  );
  // the Ship step's seal stamps during the pin
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

  // --- 9. progress line (edge-glued, capped, tip rides to bottom) + footer ----
  out.progressLine = await page.evaluate(() => {
    const c = document.querySelector("[data-progress]");
    const tip = document.querySelector("[data-progress-tip]");
    return {
      leftEdge: c ? Math.round(c.getBoundingClientRect().left) : null,
      cap: !!document.querySelector("[data-progress-cap]"),
      tip: !!tip,
      // at page bottom the tip rests at the track bottom (≈ viewport bottom)
      tipAtBottom: tip
        ? Math.abs(tip.getBoundingClientRect().top - (window.innerHeight - 5)) <= 14
        : false,
    };
  });
  out.footerFontSize = await page.evaluate(
    () => getComputedStyle(document.querySelector("footer p")).fontSize,
  );
  // exactly two legal links, correct hrefs, keyboard-focusable
  out.footerLegal = await page.evaluate(() => {
    const links = [...document.querySelectorAll("footer a")];
    const terms = document.querySelector('footer a[href="/terms.html"]');
    const privacy = document.querySelector('footer a[href="/privacy.html"]');
    terms?.focus();
    return {
      count: links.length,
      terms: terms?.textContent.trim() === "Terms",
      privacy: privacy?.textContent.trim() === "Privacy",
      focusable: document.activeElement === terms,
    };
  });

  // --- 10. legal pages served with real content ------------------------------
  out.legal = {};
  for (const path of ["/terms.html", "/privacy.html"]) {
    const lp = await browser.newPage();
    const resp = await lp.goto(`http://localhost:5173${path}`, { waitUntil: "domcontentloaded", timeout: 60000 });
    const info = await lp.evaluate(() => ({
      h1: document.querySelector("h1")?.textContent ?? "",
      email: document.body.innerText.includes("info@creativecodelogic.com"),
      brackets: document.body.innerText.includes("["),
    }));
    out.legal[path] = {
      status: resp.status(),
      h1: info.h1.length > 0,
      email: info.email,
      noPlaceholders: !info.brackets,
    };
    await lp.close();
  }

  // --- 11. ambient field (behind everything, per-chapter crossfade, idle) -----
  out.ambient = await page.evaluate(() => {
    const c = document.querySelector("[data-ambient]");
    const cs = c ? getComputedStyle(c) : null;
    return {
      canvas: c?.tagName === "CANVAS",
      pointerEventsNone: cs?.pointerEvents === "none",
      ariaHidden: c?.getAttribute("aria-hidden") === "true",
      belowContent: cs ? parseInt(cs.zIndex, 10) < 0 : false,
    };
  });
  // The field is behind VITE_AMBIENT (off by default). When the flag is off the
  // canvas is never mounted — skip the whole section cleanly rather than erroring.
  if (!out.ambient.canvas) {
    out.ambient = { present: false, skipped: true, reason: "VITE_AMBIENT off — canvas not mounted" };
    console.log("ambient: canvas absent (VITE_AMBIENT off) — skipping ambient checks");
  } else {
  const chaps = new Set();
  for (const f of [0, 0.25, 0.5, 0.75, 1]) {
    await page.evaluate((frac) => window.scrollTo(0, document.documentElement.scrollHeight * frac), f);
    await sleep(800);
    chaps.add(await page.evaluate(() => document.querySelector("[data-ambient]").getAttribute("data-ambient-chapter")));
  }
  out.ambient.distinctChapters = chaps.size;
  // rAF idle: with scroll still, the canvas must not repaint for 2s
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight * 0.5));
  await sleep(1600); // let the crossfade settle
  const af1 = await page.evaluate(() => +document.querySelector("[data-ambient]").getAttribute("data-ambient-frames"));
  await sleep(2000);
  const af2 = await page.evaluate(() => +document.querySelector("[data-ambient]").getAttribute("data-ambient-frames"));
  out.ambient.idleFramesFrozen = af1 === af2;

  // PIXEL readback — a canvas can pass every DOM check while hidden behind an
  // opaque layer, so assert actual painted pixels + the background stacking
  const painted = () =>
    page.evaluate(() => {
      const c = document.querySelector("[data-ambient]");
      const d = c.getContext("2d").getImageData(0, 0, c.width, c.height).data;
      let n = 0;
      for (let i = 3; i < d.length; i += 4) if (d[i] > 0) n++;
      return n;
    });
  await page.evaluate(() => window.scrollTo(0, 0));
  await sleep(1200);
  out.ambient.paintedAtTop = await painted();
  out.ambient.bodyTransparent = await page.evaluate(
    () => getComputedStyle(document.body).backgroundColor === "rgba(0, 0, 0, 0)",
  );
  out.ambient.htmlNavy = await page.evaluate(
    () => getComputedStyle(document.documentElement).backgroundColor === "rgb(9, 18, 32)",
  );
  await page.evaluate(() => document.querySelector('[data-world="0"]').scrollIntoView({ block: "center" }));
  await sleep(1200);
  out.ambient.paintedAtWorlds = await painted();
  // constellation distribution (dev-only debug dump of the active chapter's marks):
  // one anchor + satellites, size hierarchy, edge + text-band clearance,
  // anchor/satellite spacing, and nearest-neighbour rotation coherence
  out.ambient.flow = await page.evaluate(() => {
    const marks = JSON.parse(document.querySelector("[data-ambient]").getAttribute("data-ambient-debug") || "[]");
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const EDGE = 24;
    const SAT_GAP = 120;
    const bandL = 0.16 * vw;
    const bandR = 0.84 * vw;
    const anchors = marks.filter((m) => m.anchor);
    const sats = marks.filter((m) => !m.anchor);
    const anchorSize = anchors[0]?.size ?? 0;
    // exactly one anchor (150-190px) with satellites (48-72px) — no continuum
    const anchorOk = anchors.length === 1 && anchorSize >= 150 - 1 && anchorSize <= 190 + 1;
    const satSizeOk = sats.every((m) => m.size >= 48 - 1 && m.size <= 72 + 1);
    // every mark fully inside the viewport with >= 24px clearance on all edges
    const edgeClearOk = marks.every(
      (m) => m.x - m.size / 2 >= EDGE && m.x + m.size / 2 <= vw - EDGE && m.y - m.size / 2 >= EDGE && m.y + m.size / 2 <= vh - EDGE
    );
    // clear of the central text column
    const allClear = marks.every((m) => m.x + m.size / 2 <= bandL || m.x - m.size / 2 >= bandR);
    // spacing: anchor-to-satellite >= 0.75 * anchorSize, satellite-to-satellite >= 120
    let minAnchorSlack = Infinity;
    let minSatSlack = Infinity;
    let minD = Infinity;
    for (let i = 0; i < marks.length; i++)
      for (let j = i + 1; j < marks.length; j++) {
        const d = Math.hypot(marks[i].x - marks[j].x, marks[i].y - marks[j].y);
        minD = Math.min(minD, d);
        if (marks[i].anchor || marks[j].anchor) minAnchorSlack = Math.min(minAnchorSlack, d - 0.75 * anchorSize);
        else minSatSlack = Math.min(minSatSlack, d - SAT_GAP);
      }
    const spacingOk = (minAnchorSlack === Infinity || minAnchorSlack >= -1) && (minSatSlack === Infinity || minSatSlack >= -1);
    let maxNbr = 0;
    for (const m of marks) {
      let nd = Infinity;
      let na = null;
      for (const o of marks) {
        if (o === m) continue;
        const d = Math.hypot(m.x - o.x, m.y - o.y);
        if (d < nd) { nd = d; na = o; }
      }
      if (na) {
        let diff = Math.abs(m.a - na.a);
        diff = Math.min(diff, 2 * Math.PI - diff);
        maxNbr = Math.max(maxNbr, diff);
      }
    }
    return {
      count: marks.length,
      minDist: Math.round(minD),
      anchorOk,
      satSizeOk,
      edgeClearOk,
      allClear,
      minAnchorSlack: minAnchorSlack === Infinity ? null : +minAnchorSlack.toFixed(1),
      minSatSlack: minSatSlack === Infinity ? null : +minSatSlack.toFixed(1),
      spacingOk,
      maxNbrRotDeg: +((maxNbr * 180) / Math.PI).toFixed(1),
      coherenceOk: (maxNbr * 180) / Math.PI < 45,
    };
  });
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  await sleep(1200);
  out.ambient.paintedAtBottom = await painted();
  }

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
  // ambient field is a single static scatter (frame counter frozen) under reduced motion
  out.ambientStatic = await page.evaluate(() => {
    const c = document.querySelector("[data-ambient]");
    return { present: !!c, chapter: c?.getAttribute("data-ambient-chapter") };
  });
  if (!out.ambientStatic.present) {
    out.ambientStatic.skipped = true;
    out.ambientStatic.reason = "VITE_AMBIENT off — canvas not mounted";
    console.log("ambientStatic: canvas absent (VITE_AMBIENT off) — skipping");
  } else {
    const rf1 = await page.evaluate(() => +document.querySelector("[data-ambient]").getAttribute("data-ambient-frames"));
    await sleep(2000);
    const rf2 = await page.evaluate(() => +document.querySelector("[data-ambient]").getAttribute("data-ambient-frames"));
    out.ambientStatic.framesFrozen = rf1 === rf2;
    out.ambientStatic.painted = await page.evaluate(() => {
      const c = document.querySelector("[data-ambient]");
      const d = c.getContext("2d").getImageData(0, 0, c.width, c.height).data;
      let n = 0;
      for (let i = 3; i < d.length; i += 4) if (d[i] > 0) n++;
      return n;
    });
    out.ambientStatic.flow = await page.evaluate(() => {
      const marks = JSON.parse(document.querySelector("[data-ambient]").getAttribute("data-ambient-debug") || "[]");
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const EDGE = 24;
      const anchors = marks.filter((m) => m.anchor);
      const edgeClearOk = marks.every(
        (m) => m.x - m.size / 2 >= EDGE && m.x + m.size / 2 <= vw - EDGE && m.y - m.size / 2 >= EDGE && m.y + m.size / 2 <= vh - EDGE
      );
      const allClear = marks.every((m) => m.x + m.size / 2 <= 0.16 * vw || m.x - m.size / 2 >= 0.84 * vw);
      return { count: marks.length, anchorOk: anchors.length === 1, edgeClearOk, allClear };
    });
  }
  // progress line renders statically (full-height, both caps) under reduced motion
  out.progressLineStatic = await page.evaluate(() => {
    const line = document.querySelector("[data-progress-line]");
    const cap = document.querySelector("[data-progress-cap]");
    const tip = document.querySelector("[data-progress-tip]");
    return (
      !!line &&
      !!cap &&
      !!tip &&
      line.getBoundingClientRect().height > window.innerHeight * 0.9
    );
  });
  // Ship step renders statically with its seal shown (no stamp animation)
  await scrollToEl(page, "#process");
  await sleep(400);
  out.shipStepReduced = await page.evaluate(() => {
    const headings = [...document.querySelectorAll("[data-step] h3")].map((h) => h.textContent);
    const seal = document.querySelector("[data-step] [data-seal]");
    return headings[3] === "Ship" && !!seal && getComputedStyle(seal).opacity !== "0";
  });
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

  // --- palette must not clip at 390px + must not overlap the body copy --------
  await scrollToEl(page, '[data-world="0"]');
  await sleep(800);
  out.paletteInViewportMobile = await page.evaluate(() => {
    const sw = [...document.querySelectorAll("[data-palette] button")];
    if (sw.length < 8) return false;
    return sw.every((b) => {
      const r = b.getBoundingClientRect();
      return r.left >= 0 && r.right <= 390;
    });
  });
  out.paletteNoBodyOverlap = await page.evaluate(() => {
    const pal = document.querySelector("[data-palette]");
    const body = document.querySelector("[data-world-copy-body]");
    if (!pal || !body) return null;
    return pal.getBoundingClientRect().bottom <= body.getBoundingClientRect().top + 1;
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

  // --- hello drawer must fit narrow viewports (real-device crop bug): at 320
  //     and 390 the panel + Send button sit fully inside the viewport and no
  //     horizontal scroll appears ------------------------------------------------
  const drawerFits = async (w) => {
    const b2 = await launch({ width: w, height: 780, isMobile: true, hasTouch: true });
    const p2 = await b2.newPage();
    await p2.goto("http://localhost:5173/", { waitUntil: "domcontentloaded", timeout: 60000 });
    await sleep(1500);
    await p2.evaluate(() => document.querySelector("[data-hello-open]").click());
    await sleep(800);
    const r = await p2.evaluate((vw) => {
      const inside = (el) => {
        if (!el) return false;
        const b = el.getBoundingClientRect();
        return b.left >= -0.5 && b.right <= vw + 0.5 && b.top >= -0.5 && b.bottom <= window.innerHeight + 0.5;
      };
      return {
        panelInside: inside(document.querySelector('[role="dialog"]')),
        sendInside: inside(document.querySelector("[data-hello-submit]")),
        noHScroll: document.documentElement.scrollWidth <= vw,
      };
    }, w);
    await b2.close();
    return r;
  };
  out.helloDrawer = { w320: await drawerFits(320), w390: await drawerFits(390) };

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
