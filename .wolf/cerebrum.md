# Cerebrum

> OpenWolf's learning memory. Updated automatically as the AI learns from interactions.
> Do not edit manually unless correcting an error.
> Last updated: 2026-07-21

## User Preferences

<!-- How the user likes things done. Code style, tools, patterns, communication. -->

## Key Learnings

- **Project:** ccl-website
- AGENTS.md is deprecated as of 2026-07-21 — CLAUDE.md is the sole convention source.
- VITE_SHOW_WORK env flag toggles the Work chapter (SignatureLives) via src/lib/flags.ts.
- src/data/triquetra.ts is generated from .brief/branding/Triquetra_Fill.png by scripts/extract_triquetra.py — regenerate only if the brand mark changes.
- verify scripts hard-code the local Chrome path (C:/Program Files/Google/Chrome/Application/chrome.exe).

## Do-Not-Repeat

<!-- Mistakes made and corrected. Each entry prevents the same mistake recurring. -->
<!-- Format: [YYYY-MM-DD] Description of what went wrong and what to do instead. -->
- [2026-07-21] Don't reveal a container with gsap `autoAlpha` (or otherwise toggle visibility:hidden) if you need to `focus()` a control inside it in the same tick — a visibility:hidden ancestor makes the element unfocusable, so focus silently no-ops. Use `opacity` for the reveal, or move focus in the tween's onComplete.

## Decision Log

<!-- Significant technical decisions with rationale. Why X was chosen over Y. -->
- [2026-07-21] World Logic (03) reworked from UI-fragment assembly (fake emails/names/metric cards) to blueprint-construction of the triquetra: a scrubbed technical drawing where dashed guides draw in, the three loops trace over them, then fills whisper in with the guides fading back. Now all three worlds resolve into the mark (01 comet draws it, 02 matrix assembles it, 03 constructs it). No personal data or text lives inside the visuals. Data attrs: data-blueprint, data-guide, data-loop, data-tick; drag interaction moved from [data-fragment] to [data-loop] (loop springs back with back.out(1.7)). verify6.mjs previously had zero Logic-world coverage — added a structural check (guides=5, loops=3, ticks=12, fragments=0, no personal text, loops grabbable when assembled).
- [2026-07-21] World Logic drafting-detail pass: added a plotter head riding the drawing tip (data-plotter, driven from the scrub onUpdate via self.animation.time(); loop trace ease switched to "none" so a linear tip sample matches the reveal), a dimension/annotation layer (data-dim: dim lines with end ticks, radius leaders, a 120° arc, mono labels "1:1"/"R1-3"/"120°" — abstract drafting notation only), four registration marks (data-regmark) framing the SVG sheet corners, and per-loop lock-in pulses. Key GSAP call: each guide circle's resolve-fade is FOLDED INTO its pulse keyframe (0.35→0.8→0.14 in one tween at loop-completion) so no second tween touches strokeOpacity on the same target — keeps it scrub-reversible. Regmarks sit at viewBox corners (the drawing square), not the full-width stage rect, because they live inside the square SVG.
- [2026-07-21] Inline brief flow (src/components/BriefForm.tsx, wired into Invitation.tsx): the "Start your brief" CTA opens a 3-question flow in place (no modal/route). Backend = Formspark POST to https://submit-form.com/${VITE_FORMSPARK_FORM_ID} (flag read via src/lib/flags.ts, empty → mailto: fallback to hello@creativecodelogic.com so the form never dead-ends). Honeypot field _gotcha. Height stability: Invitation reserves a fixed swap box (min-h-[22rem] md:min-h-[19rem]) sized to the tallest state so open==closed==success height and the footer never shifts — this deliberately makes the CLOSED page ~238px taller than pre-feature (a form taller than a button cannot both leave closed height untouched AND not shift the footer on open; chose footer stability). GOTCHA: step-reveal animation must use `opacity` not `autoAlpha` — autoAlpha sets visibility:hidden at the from-state, which makes focus() fail to land on the step's first control. verify6 section 6 walks all three steps (keyboard + click), asserts focus management + submit-disabled-until-valid, and STOPS before submitting (no network in CI).
