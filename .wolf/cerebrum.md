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

## Decision Log

<!-- Significant technical decisions with rationale. Why X was chosen over Y. -->
- [2026-07-21] World Logic (03) reworked from UI-fragment assembly (fake emails/names/metric cards) to blueprint-construction of the triquetra: a scrubbed technical drawing where dashed guides draw in, the three loops trace over them, then fills whisper in with the guides fading back. Now all three worlds resolve into the mark (01 comet draws it, 02 matrix assembles it, 03 constructs it). No personal data or text lives inside the visuals. Data attrs: data-blueprint, data-guide, data-loop, data-tick; drag interaction moved from [data-fragment] to [data-loop] (loop springs back with back.out(1.7)). verify6.mjs previously had zero Logic-world coverage — added a structural check (guides=5, loops=3, ticks=12, fragments=0, no personal text, loops grabbable when assembled).
