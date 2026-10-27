# V0d-pulse

**Last Updated:** 2026-10-26 08:35 EST

Reviewer report, saved verbatim (read-only review on main).

V0d report: Pulse and guardian pages, colour review. Read-only; nothing changed or committed.

Method: I read every colour utility in these files and computed WCAG ratios from the Tailwind v4 palette. All pulse surfaces are always dark, so there is no light-theme variant to measure. `routes/modules/pulse/+layout.svelte:16` hard-codes `bg-slate-950 text-slate-100` plus the LivingMesh canvas. The token pages (`respond`, `verify`, `portal`) also render on LivingMesh. They ignore `body.theme-dark`, `--color-primary` and the accent themes (app.css:94-121). Light-theme ratios are therefore not applicable to this area. Primary `#4A7C74` is 4.53 on `#f8fafc` and white on primary is 4.74, so the light theme is fine.

## 0. Cross-cutting findings
- **The dark-surface primary is hard-coded teal.** About 100 uses of `teal-400/500` across the pulse files stand in for the primary. The real primary `#4A7C74` is only 3.76 on slate-900 and 3.08 on slate-800, so it cannot be used as text on dark.
  - Proposal: add tokens `--color-primary-on-dark: #2dd4bf` (teal-400; 10.84 on slate-950) and `--color-on-primary-dark: #020617`.
- **Slate-500 and slate-600 as text fail on dark.** Measured ratios:

| Colour | Background | Ratio |
|---|---|---|
| slate-500 | slate-950 | 4.24 |
| slate-500 | slate-900 | 3.75 |
| slate-500 | slate-800 | 3.07 |
| slate-600 | slate-950 | 2.66 |
| slate-600 | slate-900 | 2.36 |
| slate-600 | slate-800 | 1.93 |
| slate-400 | slate-950 | 7.87 |
| slate-400 | slate-800 | 5.71 |

  - Proposal: a token `--color-muted-on-dark: #94a3b8` (slate-400), and ban slate-600 as text or as an interactive icon.
- **White on `bg-teal-500` is 2.49, which fails.** It is used for text and icons on solid teal buttons and chips. Dark text on teal measures 8.10 on teal-500 and 10.84 on teal-400. GuardianPicker and the portal already use `text-slate-950` on teal, so the pulse area is inconsistent. Standardise on `text-slate-950`.
- **Alert palette applied to a non-alarm state.**
  - `+layout.svelte:7-9`: `getMeshStatus` returns "alert" for everything except grace, active and disabled.
  - The store's statuses are `active | grace | not_configured | disabled` (`lib/stores/pulse.svelte.ts:7`).
  - So a user who simply has not set up Pulse (`not_configured`) gets the red-950 `#450a0a` rose mesh (`LivingMesh.svelte:26-30`) behind every pulse page. That is an alarm colour for a calm state.
  - On that red background, slate-500 text measures 3.39.
  - Proposal: map `not_configured` to "disabled" (zinc) or "active", and reserve "alert" for a real escalation.
- **Invalid shadow.** `+page.svelte:138` uses `shadow-[0_0_50px_-10px_rgba(var(--color-primary),0.2)]`. `--color-primary` is a hex value, so `rgba(#4A7C74,…)` is invalid CSS and the glow never renders. Proposal: `shadow-teal-500/20`.
- **Backdrop.** `GuardianPicker.svelte:73` uses `bg-black/80 backdrop-blur-sm`. The standard is `bg-slate-900/60`.

## 1. Colour map (what each colour signals)
- **Teal-400/500 (calm, active, healthy).**
  - Page icons and "Back to Dashboard" links: `history:46,51`, `messages:123,132`, `contacts:9,14`, `escalation:9,14`, `settings:128,133`, `transparency:143,152`.
  - Active toggle: `settings:151`.
  - Primary buttons and chips: `+page:276`, `messages:319`, `history:69-96`, `PulseContactsManager:200,225`.
  - Heartbeat active, timer, "%" and hero ring: `+page:141-179,230,371`, `portal:104,136`, `verify:52,57,77,104`, `respond:99,118,173`.
  - Success: `verify:85` emerald-300 on emerald/20 for "Signal Received", and `PulseContactsManager:315` emerald check. Two success hues (teal and emerald) sit in one flow. Pick teal.
- **Amber (grace, waiting, gentle attention).**
  - The "Explore Connection" card hover and chip: `+page:328,336,349`.
  - Grace messages: `messages:259,266,273`.
  - Portal grace ring and chip: `portal:128,140,153-154,207`.
  - `respond:82,138-149,210`.
  - Vault notices: `vault:233,248,254`.
  - These are appropriate soft attention. Amber-300 on amber/10 over slate measures 10.68.
- **Indigo (locked, vault, private).** `vault:126-155,227,266,291,373,383`, `portal:253-280`, `PulseContactsManager:421`, `settings:255,272`. Indigo-600 button with white text measures 6.29, which passes. The vault button is indigo while every other primary action is teal. Defensible as "locked" semantics, but it is a second primary-button colour.
- **Purple (location and safety).** `settings:214,229,232,242`, `transparency:73-75` (tier 4).
- **Rose and red.**
  - `+page:244` "Cancel Monitoring": rose-400 on rose/10 measures 6.09. Acceptable, since it stops a safety timer.
  - `transparency:67-69,235` "Critical" chip and tier 3.
  - `PulseContactsManager:272,371` delete-icon hover.
  - `GuardianPicker:171` rose-300 inline error: fine.
  - `portal:109-111` and `respond:104-106` rose border, rose-500 icon and rose-950 panel for an inactive or expired link. That is not an alarm. See Miss 4.
  - `PulseContactsManager:169-171` red panel with a pulsing red dot for "circle is taking a moment to load". That is not an alarm. See Miss 4.
  - `verify:66` rose-400 "Link Inactive" label.
- **Transparency tiers (`transparency:36-75`).** Tier 0 teal, tier 1 amber, tier 2 orange, tier 3 rose, tier 4 purple. This is a severity ramp for what guardians can see. Orange and amber are near-indistinguishable, and rose and purple at tiers 3-4 read as alarm. Rose is justified only for actual escalation of access. Rose also reads as warning for the "Critical" item chip (`:235`), where the item type is "critical data" and not a danger.
- **Neutrals.** Slate-950 to 700 surfaces and borders; slate-100/200/300 headings and body.

## 2. Misses by file (proposed fix cards)

### Card V0d-1: `frontend/src/routes/modules/pulse/+layout.svelte` and `lib/components/pulse/LivingMesh.svelte`
1. `+layout:7-9`: `not_configured` is treated as alarm, so a calm unconfigured state gets the red-950 mesh. Fix: `if (status==="active"||status==="grace") …; if (status==="disabled"||status==="not_configured") return "disabled"; return "alert"`. Real alarm statuses would be added deliberately.
2. `LivingMesh:22` grace background `#1e1b4b` (indigo-950) puts slate-500 text at 3.36. This is resolved by the slate-400 token below. Optional: keep the grace palette amber but calm.
3. `PetalDrift.svelte:32` uses pastel pink `#fce7f3` among the petal colours. It is decorative, so it is low priority.

### Card V0d-2: `frontend/src/routes/modules/pulse/+page.svelte`
- `:138` invalid `rgba(var(--color-primary),0.2)` shadow. Use `shadow-teal-500/20`.
- `:276` `text-white` on `bg-teal-500` = 2.49. Use `text-slate-950` (8.10).
- `:237` `text-teal-400/60` on slate-900 = 4.18, below 4.5. Drop the opacity (9.59).
- `:282,313,343,365` `text-slate-500` body and label text on slate-950/40 or slate-900/40 = about 4.0-4.2, and 3.75 on the slate-900/40 card at `:365`. Use slate-400.
- `:159` `text-slate-400` on slate-900 = 6.96, fine.
- `:319` teal-400 chip and `:349` `text-amber-500` chip are fine (9.39).
- Seeds: `text-primary` on dark at `:305,358` and "+15%" are already gone. Only "Explore Connection" remains (`:320`), now teal-400 or slate-400, so the seed is resolved.

### Card V0d-3: `frontend/src/routes/modules/pulse/messages/+page.svelte`
- `:319` white icon on `bg-teal-500` (and `hover:bg-teal-500/80` = 3.56 with white) fails. Use `text-slate-950`.
- `:146,175,185,199,225,294,327` slate-500 text on slate-900 or slate-950 = 3.75-4.24. Use slate-400.
- `:194` Inbox icon `text-slate-600` = 2.36-2.66. It is decorative but below the 3:1 graphic minimum. Use slate-500 (3.75).
- `:259-273` amber grace-message bubble is fine (amber-100 12.43, amber-500 label 6.44, amber-300/80 6.69).

### Card V0d-4: `frontend/src/routes/modules/pulse/history/+page.svelte`
- `:69,78,87,96` `bg-teal-500 text-white` filter chips = 2.49. Use `text-slate-950`.
- `:142` teal-500 on teal-500/10 = about 6.2-7.3, which passes.
- `:61,133,151` slate-500 text = 4.24 or worse. Use slate-400.

### Card V0d-5: `frontend/src/routes/modules/pulse/vault/+page.svelte`
- `:360` and `:397` `text-slate-600` text = 2.66 (and 2.36 on slate-900). Use slate-400.
- `:291` `text-indigo-400/70` = 3.58. Use `text-indigo-300` (about 9).
- `:187,196,214,242,393` slate-500 labels = 3.75-4.24. Use slate-400.
- `:332,343` slate-500 icon buttons: hover colours are fine, resting 3.75. Use slate-400.
- `:227` indigo button: white on indigo-600 = 6.29. Keep, or move to teal for one primary-button colour. Decision for the owner.
- `:233,248,254` amber alert bars are fine.

### Card V0d-6: `frontend/src/routes/modules/pulse/transparency/+page.svelte`
- `:36-75` the tier ramp has amber and orange nearly indistinguishable, and rose at tier 3 reads as alarm. Proposal: teal, amber, amber-700/orange-300 (a distinct step), then a calm slate or indigo at tiers 3-4, keeping rose only for "critical" if that is a real alarm. Fix the hue steps; contrast of all of them is above 6.
- `:181,201,259,275` slate-500 text = 3.07-4.24. Use slate-400.
- `:235` "Critical" rose chip is 6.09 and passes. It signals "critical data" and not danger. Use amber or indigo.

### Card V0d-7: `frontend/src/routes/modules/pulse/settings/+page.svelte`
- Toggle and teal colours are fine. `:162,288` white knobs are fine.
- Slate-400 (`:145,260,267`) passes at 5.7 or better. No contrast misses found in the lines I read. Purple location block (`:214-243`) passes (purple-200 on purple-900/30 = 10.23).

### Card V0d-8: `frontend/src/lib/components/modules/pulse/GuardianPicker.svelte`
- `:73` backdrop `bg-black/80` should be `bg-slate-900/60`.
- `:163-164` Confirm Guardian: `text-slate-950` on `bg-teal-500` = 8.10. The seed "dark text on teal" is a contrast pass but an inconsistency with the white-on-teal buttons elsewhere. Once those are changed it will be the standard. The disabled state `text-slate-300` on slate-800 = 9.85, which looks too readable for "disabled". Use `text-slate-500` plus a lower-opacity background.
- `:86,141` slate-500 text on slate-900 = 3.75. Use slate-400.
- `:150` `text-[9px] text-slate-400` on slate-900 = 6.96, but 9px is too small. Use 10px.

### Card V0d-9: `frontend/src/lib/components/modules/pulse/PulseContactsManager.svelte`
- `:169-179` the load-failure panel is `bg-red-500/10 border-red-500/50` with a pulsing red dot and `text-red-200` (13.04 passes). It signals an alarm for a calm "taking a moment to load" message. Use amber or slate.
- `:272,371` delete icon `text-slate-600` = 2.36-2.66. Use slate-400 resting and rose-400 hover.
- `:159,190,260,309,361,384,409` slate-500 = 3.07-4.24. Use slate-400. `:402` `text-slate-600` italic = 2.36 or lower. Use slate-400.
- `:225` `text-slate-950` on `bg-teal-500` = 8.10, which passes.
- `:266,290,334` teal-500 text on slate-800/30 and 900/50 = 5.88-7.17, which passes. Prefer teal-400 for the token.
- `:315` emerald confirm check differs from teal elsewhere. Use teal-400.

### Card V0d-10: `frontend/src/routes/pulse/portal/[token]/+page.svelte`
- `:109-115` the inactive-link panel is rose-500 border and icon (`ShieldAlert`, 4.86 on slate-900). A stale link is not an alarm, and `respond` and `verify` already use calmer or different treatments. Use slate-700 border and a slate-300 or amber-400 icon, like `respond:82`.
- `:161,163` slate-500 10px text = about 4.2. Use slate-400.
- `:197` teal button with `text-slate-950` passes. The disabled state `disabled:text-teal-300` on slate-800 = 9.89, too bright for disabled.
- `:253` indigo-950/20 vault panel and `:288` teal-400 code font: both pass.

### Card V0d-11: `frontend/src/routes/pulse/respond/[token]/+page.svelte`
- `:104-110` the error panel is rose-950/20 with a rose-500 `Shield` icon. Use the same calm treatment as the portal.
- `:181,200,218` slate-500 = 3.75-4.24. Use slate-400.
- Amber grace card (`:138-149`) passes (amber-200 12+, amber-200/70 7.56).

### Card V0d-12: `frontend/src/routes/pulse/verify/[token]/+page.svelte`
- `:66` rose-400 "Link Inactive" label at 10px on slate-900/60 = about 6.1 (passes). A stale link is not an alarm, so use slate-400 or amber.
- `:85` emerald "Signal Received" chip is fine (8.45), but align it to teal (`respond` and `portal` use teal for success).
- `:108` slate-500 10px = 3.75. Use slate-400.
- `routes/pulse/+page.svelte` has no colour content (0 lines).

## 3. Priority
- **P0:** layout `not_configured` mapped to alert (red mesh on a calm state); white on teal-500 at 2.49 (`+page:276`, `messages:319`, `history:69-96`).
- **P1:** slate-500 and slate-600 text and icons below 4.5 across all the cards above; invalid shadow at `+page:138`; GuardianPicker black/80 backdrop; the PulseContactsManager red load-failure panel.
- **P2:** transparency tier hues (amber and orange nearly the same); portal and respond rose "inactive link" panels; teal and emerald, indigo and teal button consistency.
- **Token proposals:** `--color-primary-on-dark #2dd4bf`, `--color-on-primary-dark #020617`, `--color-muted-on-dark #94a3b8`, `--color-alarm-on-dark #fb7185` (rose-400, reserved for real escalation or destructive actions).
