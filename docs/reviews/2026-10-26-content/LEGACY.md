# X386 — legacy and instructions content

Verified 2026-10-26 23:19 EDT. Source baseline: `249763c10a0d36acb10344e57d2c2dba3d0f59b3`; scoped changes are in the commit containing this report. Twelve source files changed. No shared AI assets, document bodies, release rules, or persistence contracts changed.

## Page checklist

| Page / source under `frontend/src/` | Useful guidance now provided | Working-interface coverage |
| --- | --- | --- |
| `routes/modules/medical/+page.svelte` | Prepared directives, summaries, original locations, proxy contacts; donor enrollment is recorded information rather than verified enrollment | Saved profile/directive, reload, add dialog, keyboard open/focus/Escape |
| `routes/modules/time-capsule/+page.svelte` | Intended person/occasion; date availability versus explicit milestone release; device draft versus account seal | Device draft with no POST, reload, seal, milestone edit, release, original prose |
| `routes/modules/timeline/+page.svelte` | Specific event details and Journal accomplishment connection; truthful schematic weekly range | Empty, mixed past/current/future, same-year events, furthest year, future-only, keyboard view switch |
| `routes/modules/funeral/traditions/[type]/+page.svelte` | Questions for the chosen community contact/provider and a return to Final Wishes to record choices; meaningful fallback sections without invented doctrine | All seven traditions; existing Christian/Jewish/Secular guides retained |
| `routes/modules/legal-documents/+page.svelte` | Recognizable title, original location, copy, signing/review details | Header guidance; imported DocumentVault controls unchanged |
| `routes/modules/family-hub/+page.svelte` | Contacts versus family memories versus dated events; recipe details; record-gathering checks rather than family completeness | Two/three actual contacts, names, unchanged 0%/33% formula, keyboard collapse/reopen |
| `routes/modules/visual-memories/+page.svelte` | Curated Gallery versus External Archives; opening an item to record people/place/date/story | Header and visible next-action guidance |
| `routes/modules/home-manual/+page.svelte` | Vendors, entry details, equipment locations, provider contacts, actual instructions | Header, utility empty state and location example |
| `routes/modules/heirlooms/+page.svelte` | Recognizable object, history, location, intended recipient, photo; printed QR requires sign-in | Header/empty/form guidance; QR target remains the owner module |
| `routes/modules/legacy-journal/+page.svelte` | Distinct Reflections, Ethical Will, Lessons, and Timeline-backed Accomplishments instructions | All four tabs, accomplishment next action |
| `routes/modules/letters/+page.svelte` and `lib/data/letterTemplates.ts` | Review names/facts/role/access details; documents and follow-up become questions for the relevant institution/person | All 24 metadata entries checked; bank, IRS, pet registry previews; no expert-authority/deadline claims |

## Counts and preservation

The weekly view is **52 schematic squares per year**, not age, birth date, calendar weeks lived, or remaining lifespan. Valid recorded years are positive integers. Start is the earlier of the current year and recorded years; exclusive end is the later of current year + 3 and latest recorded year + 1. This also repairs omission of the latest future year's events. Every record belongs to its year's first square; same-year records remain together.

Independent DOM recounts at the 2026 proof clock matched source and labels:

| State | Inclusive displayed years | Squares | Earlier-year squares | Source membership |
| --- | --- | ---: | ---: | --- |
| Empty | 2026–2028 | 156 | 0 | None; no invented 1990 |
| Mixed | 2020–2033 | 728 | 312 | IDs 1, 2, 3, 4 exactly once; IDs 1/2 share 2020 square |
| Future-only | 2026–2033 | 416 | 0 | ID 4, year 2033, exactly once |

The grid metric has no separate stored/admin/export metric. Timeline source rows remain unchanged in the snapshot, binder, HTML, PDF, ZIP JSON and manifest. The mixed snapshot/download was preserved before deleting only three proof-created rows for the future-only phase. All four original descriptions/reflections/custom-field keys survive that mixed output. Contact IDs 1–3/names agree with snapshot and manifest. The Family Hub threshold/formula is unchanged; labels now state precisely which records it checks.

All 24 static letter body literals remain byte-identical: SHA-256 `44b71033897bc071f015f71ee9d3c6901e838dcfafa1d727ea53caf9b326b8b1` over the newline-joined bodies. Only `requiredDocs`/`followUp` metadata changed. Current runtime draft assets were not edited. Medical and capsule original prose survived actual API writes/reloads and the full copy. Relevant PDF pages 4/6/7 were rendered and visually inspected without clipping; extraction contains all six marker passages plus Hebrew/Cyrillic. Poppler presents Hebrew in visual/bidi order, so literal logical-order extraction equality is not claimed.

## Evidence and limits

Parent approved reuse of `/private/tmp/continuum-x376/server.py` plus an **inline** runner before execution; no new test/script file was created. Disposable SQLite, synthetic JWT/account/contacts and mocked HTTP only; no real records, mail, provider calls, application lifespan, or production changes. Private mode stayed configured throughout. Seven checkpointed phases passed; page errors and gateway calls were both zero.

Evidence retained under `/private/tmp/continuum-x376/`:

- `x386-proof-results.json`, `x386-proof.log`, `x386-resume-console.log`, `x386-browser-observations.json`.
- `x386-source-mixed.json`, `x386-download-copy.zip`, `x386-manifest.json`, `x386-packet.pdf`, `x386-packet.txt`, `x386-packet-render-{4,6,7}.png`.
- Actual 1440×900 screenshots: `x386-weekly-{empty,mixed,future-only}-1440.png`, `x386-family-record-checks-1440.png`, `x386-medical-form-1440.png`, `x386-capsule-{instructions,released}-1440.png`, `x386-institutional-checks-1440.png`, `x386-tradition-other-1440.png`, `x386-journal-accomplishments-1440.png`, plus legal/heirloom/home/visual guidance and binder captures. Key content/count/output images were visually reviewed; captures assert no horizontal overflow.
- Full original failures retained: `x386-proof-console.log` (CSS-uppercase heading assertion; product correct) and `x386-keyboard.log` (detail capture expected title without existing `Blueprint:` prefix). Corrected harness selectors only; resumed unfinished steps, preserving completed phases. `x386-family-detail.log` records the corrected detail capture and keyboard result.
- Final `npm run check`: 0 errors / 0 warnings; `npm run build`: pass. Logs: `/private/tmp/continuum-x386-final-{check,build}.log`. `git diff --check`: pass.

Source review covered the complete changed routes/metadata and relevant store/API/export/header/blueprint/QR callers. This is a content task with one justified timeline membership correction, not a new readiness calculation, religious guide, medical/legal verification, or lifespan feature. Phone layout was not changed or separately re-proven. Final Wishes root/Wizard and shared AI chips remain the separately owned X384/X383/X388 work; existing child DocumentVault score/search behavior is outside this card.
