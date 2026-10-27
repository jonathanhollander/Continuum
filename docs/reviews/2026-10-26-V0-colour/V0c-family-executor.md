# V0c-family-executor

**Last Updated:** 2026-10-26 08:35 EST

Reviewer report, saved verbatim (read-only review on main).

V0c report: colour review of family, contacts, anniversary, calendar, medical, /for recipient view, executor hub/toolkit/guide. Read-only; nothing changed. Contrast ratios are my own computation from the Tailwind hexes and the app.css tokens (WCAG). Paths are under /Users/jonathanhollander/AI Code/Continuum/frontend/src/.

## 0. Tokens in play (app.css)
- Light: `--color-primary` #4A7C74 (teal), bg #f8fafc, card #fff, muted-foreground #64748b.
- `body.theme-dark` (app.css:80) swaps only background/foreground/card/muted/border/input. It does NOT change primary.
- Per-tone primaries: `tone-executor` #1E293B (app.css:64), `tone-grief` #5A6B8F (:58), and accents indigo/emerald/rose/amber/carbon #0f172a (:100-121).
- Result for any `text-primary`: on dark bg #0f172a, teal is 3.76 and navy #1E293B is 1.22. Carbon #0f172a on #0f172a is invisible. This is the root cause of the dark-heading seeds.
- Three competing palettes appear in my area:
  - (A) tokens: `bg-primary`, `text-primary`.
  - (B) hard-coded brand teal #4A7C74 with dark green #304743 and a cream bg (#FDFBF7 / #FAF8F5).
  - (C) raw Tailwind slate/gray/stone with indigo/rose/amber/blue.
- No file in my area has any `dark:` variant or theme-dark handling. Pages with `bg-white` and `text-gray-*` are light-only. Pages with `text-white` and `bg-slate-950` are dark-only.
- Hover border and focus-ring colour on inputs also varies. It is `focus:border-primary` (contacts, medical, RecipientLinkPanel), `focus:ring-indigo-500` (anniversary), `focus:border-[#4A7C74]` (family-hub) or `focus:ring-[#304743]/20` (calendar).

## 1. Colour map (file:line, what it signals)

### Dark shell (/executor, dashboard Executor mode: bg-slate-950 / carbon)
- `routes/executor/+page.svelte:154` is `bg-slate-950 text-slate-200`.
- `lib/components/executor/ExecutorHub.svelte`:
  - Headings are white, body slate-300, secondary slate-400 (:82-85, :110, :148).
  - Section icon is indigo-400 (:107, 5.98), the accent for "progress".
  - Status dot (:131-135): emerald-500 means done, amber-500 means started, slate-600 means not started.
  - Module accent colours (:24-59) are rose, indigo, emerald, amber, cyan. They are interpolated as `bg-{module.color}-500/10`, `text-{module.color}-400` and `hover:border-{module.color}-500/50` (:124, :140, :153, :156). That is the U41/U62 dynamic-class defect.
  - CTA card (:170) is an indigo/purple gradient with an indigo-400 link.
- `ExecutorProgressTracker.svelte`: white title, slate-400 text, emerald-400 check icons (:74-105).
- `ExecutorWelcome.svelte`:
  - Step icons: rose-400 Heart (:70), indigo-400 Clock (:108), purple-400 Shield (:167).
  - emerald-400 ticks (:117, :127, :137).
  - Primary buttons are `bg-white text-slate-900` (:91, :150, :201). Ghost buttons are slate-400.
- `SupportResources.svelte`:
  - Rose/purple gradient card (:31) with a rose-400 Heart (:35).
  - Purple-400 resource icons (:67).
  - Rose-400 "In crisis?" box (:84-86).
  - Rose is a comfort/care colour here, not an alarm. The 988 line is the only genuine alert, and it is correctly present.

### Executor toolkit and guide (light)
- `executor-toolkit/+page.svelte`:
  - Brand dark green #304743 for h1 (:102), active tab (:154, :163), buttons (:248), text (:207, :294) and focus (:219).
  - Teal #4A7C74 is used for hover and focus (:219, :264, :287, :298, :335).
  - Red alert box (:109-116) and a green box (:126-133).
  - "Urgent" badge red-100/red-700 (:328).
  - Cards are `bg-white border-stone-200` (:173).
- `ExecutorTaskDetail.svelte`: #304743 headings (:23, :29), gold #D4AF37 chevron and numbers (:31, :81), teal bullets (:69), gold left border on quotes (:112).
- `executor-guide/+page.svelte`:
  - Blue-100/blue-600 header icon (:69) and blue chevron (:102).
  - Indigo-900 promo card (:108) with indigo-200 text (:112).
  - Yellow-50/100/600/800/900 "Pro Tip" (:167-178).
  - Gray-500 body (:74, :97), `rounded-[40px]` card (:131).
  - Step number hover blue (:150).
  - The module's palette is blue/indigo/yellow. Executor-toolkit is green. Executor hub is indigo/rose on dark. Three different "executor" looks.

### Recipient (/for/... via RecipientStartPage, always light)
- Palette B throughout: cream #FAF8F5 page (:249), #304743 headings, buttons and links, gold #D4AF37 bar (:260), stone-500/600/800 text, `bg-white border-stone-200` cards. Preview banner is #304743 (:251).
- Tier chip is gold/15 with #7a6420 text (:300): 5.16.
- `RecipientPageState.svelte`: same palette (:8-26).
- `RecipientLinkPanel.svelte` (inside contacts modal) uses tokens (`bg-primary`, `text-primary`, slate-200) plus #4A7C74 for the accent and check (:84, :116).
- Note: this is the only page that is legitimately its own design, since the recipient sees it outside the app. But it stays cream-green while the app primary is teal #4A7C74 and a different token set.

### family-hub
- Page bg #FDFBF7 (:299), #304743 headings (:316, :756), teal #4A7C74 tabs, inputs and CTA (:332-443).
- Memory type colours (:720): photo blue, recipe amber, etc.
- Rose-100/700 "Add Memory" pill (:552).
- Indigo-50/600 pill (:565).
- Card hover: group-hover:text-rose-600 (:638), amber-50 card (:650-663).
- Edit icons hover blue-500 and delete icons red-500 (:612, :620, :730, :736).
- Journey card is #304743 with emerald-100/80 text (:756, :772). Emerald-500 map pin and dot (:786, :797).
- Dark slideshow overlay with white text and `bg-black/20` (:848-921).

### FamilyTreeGraph (SVG hex)
- Hex palette: owner #4A7C74, spouse/partner #E11D48 (:72), amber #F59E0B (:79), slate #64748B (:81), line #CBD5E1 (:138).
- Pulse ring teal (:154). Rose-500 icon (:186). `text-red-500` remove button (:315).

### EducationalResources
- #304743 titles, #4A7C74 icons and hover (:111-136), `bg-slate-50` cards, `text-gray-400` close X (:175).

### contacts
- Token primary for CTA, filter tabs and the Primary-contact box (:305, :375, :385, :725).
- Stat cards (:334-364): rose-50 "Pending Immediate", green-50 done, and a slate neutral for the total.
- Tier headers: rose-600 (:432, tier 1 "Call Now" badge :439), orange-600 (:452, tier 2), tier 3 (:474).
- Delete icon hover red (:494, :607).
- Concierge-extraction highlight is `amber-glow border-amber-500/50` (:640-717), with an amber-500 "badge" (:646).
- `text-indigo-500` hint (:742).
- `ContactRow.svelte`: white card with `hover:border-indigo-300` (:22). The note chip is amber-50/600 (:41). The active status button is `bg-slate-800 text-white` (:65).

### anniversary-manager
- Event type colours (:66-69): birthday amber, anniversary rose, passing indigo, ritual emerald.
- CTA is `bg-primary rounded-full` (:174).
- Date block header is solid indigo-600 with white text (:264).
- Card hover is indigo-200 (:256, :261).
- Ritual guide panel is indigo-50 (:412-439), tips are indigo-400/800.
- Form focus is `focus:ring-indigo-500` (:507-568). Everything else here uses tokens.
- The sample grid is at `opacity-60` (:226).
- Heading is `font-serif` (:199, :273, :484), so U41's "sans heading" is the LivingBlueprintHeader h1 (see below).

### calendar
- Event type colours (:271-275): birthday rose, holiday amber, anniversary purple, other blue.
- CTA and modal header are #304743 (:294, :537, :713), with hover #2a3f3b / #20302d (two different hovers for the same colour).
- The wish block is amber-50 with an amber-600 label (:621-636).
- Edit and delete hover blue-500 / red-500 (:372-379, :490-497).
- Sparkles icon is amber-400 (:411).

### medical
- Token primary for the card, CTA and chips (:255-303).
- "Critical Allergies" orange-50 (:313-320) and a blue-50 (:327-342) emergency-contact block.
- Edit icon hover blue-600 and delete icon hover red-600 (:482, :488).
- Info banner is primary/5 (:425-432).

### LivingBlueprintHeader (shared; drives h1 of every module page)
- `lib/components/LivingBlueprintHeader.svelte:45-79`: `bg-background`, h1 `font-serif text-5xl md:text-6xl text-primary`. This h1 shares one colour with all themes. U56 / U0d-34 note: sizes differ between modules (this is one shared header, but the h1 is `text-primary`, so it is poor on dark).

## 2. Misses

### A. Contrast below 4.5

Dark shell (white or lighter text, so mostly fine). Items in these files that fail:
1. `ExecutorHub.svelte:131-135` status dots rely on colour alone: emerald vs amber vs slate-600. Slate-600 on slate-800/40 is 2.36, so the "not started" dot and its border are near invisible. Proposed: dot plus an sr-only label or "Done / Started / When you're ready" text, and the not-started dot at slate-500.
2. `ExecutorHub.svelte:140-156` module accent classes are dynamic, so the icon tile, progress bar and hover border may not be generated (U41/U62). Proposed fix card: replace with a static map `{rose:'bg-rose-500/10 text-rose-300 ...', ...}`.
3. `ExecutorWelcome.svelte:98,157,208`: ghost button slate-400 on the modal. On bg-slate-900 it is 6.96, which passes. Check what bg the modal has; it passes if dark.
4. `SupportResources.svelte:86` rose-400 on rose/10 over slate-950: 7.0. Passes.

Light-theme failures (ratios on white unless stated):
5. `text-slate-400`: 2.56, 2.34 on slate-100, 2.45 on slate-50. Used for UI labels. `text-gray-400`: 2.54. Both fail.
   - contacts:324 (stat label "Total", uppercase), :523, :531 (Phone/Mail icons, decorative OK), :600 (hover link), ContactRow:34 (separator, decorative).
   - family-hub:357, 377, 391, 404, 417, 429 (form labels `text-gray-400` on white, 2.54, real text), :643, :694, :801 (card meta in slate-400).
   - anniversary:225, 344 (tags, `text-[10px]`), 462, 500-561 (all form labels `text-slate-400 uppercase`, 2.56). Proposed: slate-600 (7.58) for labels, slate-500 (4.76) for supporting text.
   - calendar:317, 388 (`text-gray-400` labels), 437 (empty dashed card text).
   - medical:292, 502, 525 (`text-gray-400`, 10px uppercase), :447.
   - executor-toolkit:183 (back link), :335.
   - executor-guide:150 (step numbers).
   - EducationalResources:183 (`text-slate-400` section heading).
6. `text-gray-500` / `text-slate-500` are 4.83 / 4.76 on white but 4.55 on #f8fafc (just passes) and 3.75 on dark bg (#0f172a). Anything using them (about 80 instances) is unusable once theme-dark is on.
7. `text-rose-400` (2.69 on white, 2.45 on rose-50): contacts:337 "Pending Immediate" label; `text-rose-300` icon on rose-50: 1.72 (:350, decorative but also no meaning). Proposed: rose-700 label (5.72).
8. `text-green-600` on green-50: 3.15 (contacts:356). `text-emerald-600` on emerald-100/50: 3.32-3.58 (anniversary:323, 329). Proposed: green-700 (4.79) / emerald-700.
9. Amber: `text-amber-500` on white 2.15 (family-hub:653, icon on white circle; decorative OK). `text-amber-600` on amber-50: 3.07 (calendar:625 label, ContactRow:41 note chip, family-hub amber-50 card). `text-amber-600/70` on amber-50: 2.16 (calendar:636 helper text). `text-amber-800/80` on amber-50: 4.41 (family-hub:663). `text-amber-700` on amber-100 is 4.51 (anniversary:66, passes barely). Proposed: amber-800 text on amber-50.
10. Orange: `text-orange-400` on orange-50: 2.13 (medical:316 "Critical Allergies" label), `text-orange-600` on white/orange-50: 3.35 (contacts:452 tier 2 header). Proposed: orange-800 (or drop orange; see C).
11. Blue: `text-blue-400` on blue-50: 2.34 (medical:339). `text-blue-600` on blue-100: 4.24 (executor-guide:69, family-hub:720 photo chip). Proposed: blue-700.
12. `text-red-500` on white: 3.76 (family-hub:620/736, FamilyTreeGraph:315, calendar:379, contacts:494 hover), on red-50 3.44. Proposed: red-700 (6.5+).
13. `text-yellow-600` on yellow-50: 2.84 (executor-guide:170). yellow-800 (:178) is fine.
14. Gold #D4AF37 on white: 2.1 (ExecutorTaskDetail:31, :81 step numbers `text-[#D4AF37]` on white; bg-white text-gold in `.text-gold` is a gradient). On #304743 it is 4.74. Proposed: #7a6420 (already used on the recipient chip, 5.16) for text, keep gold for bars/borders.
15. White on teal #4A7C74: 4.74 (all `bg-primary text-primary-foreground`). Passes, but hover `bg-primary/90` lowers it (family-hub:443 hover #3b635d improves it).
16. Teal #4A7C74 as text on white 4.74, on `bg-primary/5` 4.45 (fails), on primary/10 4.2 (fails). Hits: medical:276-303 (`text-primary` on `bg-primary/10` chip), :425-432, contacts:375 and 385 (`bg-primary/10` active filter), :419, :725-729, calendar none. Proposed: text `#3b635d` (darker teal, ≥6) on primary tints.
17. Dark-theme: `text-primary` for the LivingBlueprintHeader h1 and many labels is 3.76 on #0f172a, 3.08 on #1e293b card. 3.76 passes only as large text (h1 48px). Small text (medical:278, 303, 353, 429, 432 `text-primary`/`text-primary/80`, contacts:551, 729, ContactRow:54 hover) fails. Under `tone-executor` (primary #1E293B) or `theme-color-carbon` (#0f172a) the h1 is 1.22 / 1.0 on dark: invisible. This is the seed "dark-mode dashboard heading". Proposed: add `--color-primary-text` (teal #4A7C74 light / #7fb5ab dark ≈ 7.9 on #0f172a) and use it for text. Keep `--color-primary` for fills.
18. White/opacity on #304743: white/70 5.86 passes (calendar:545 close X). `text-white/50` on slate-900 5.23 passes (family-hub:903, 921). `text-indigo-800/60` on indigo-50: 3.21 (anniversary:439 footer note). Proposed: indigo-800 solid (≥9).
19. Dark text on dark: `text-[#304743]` (1.79 on #0f172a) is hard-coded for headings at executor-toolkit:102, 207, 294; family-hub:316; calendar:398; EducationalResources:111, 136, 163; ExecutorTaskDetail:23, 29; Recipient pages. If theme-dark is set these become invisible (nearly: card #1e293b is also dark). They only work because the pages are hard-coded `bg-white`/cream. Same root cause as "Estate Readiness Hub" dark-green-on-dark-green.
20. `ExecutorTaskDetail.svelte:112` `text-gray-600` on `bg-gray-50/50` is 6+, fine. `border-gray-300` checkbox: low-contrast, 1.5:1 non-text (WCAG 1.4.11 needs 3:1). Same at executor-toolkit:287 and :104.

### B. Light-only pages vs the dark theme (consistency / theme support)
- family-hub (:299 bg #FDFBF7), executor-toolkit, executor-guide, calendar (modal header #304743 OK in both), recipient pages are light only. Under `body.theme-dark`, their text inherits foreground #f8fafc inside `bg-white` areas wherever text has no explicit colour (e.g. medical `<p>` without a class, contacts input text inside `bg-white`/`bg-slate-50` inputs). So input text is near-white on white. This is the same class as the dark card footers seed.
- Recommendation: replace hard-coded `bg-white` with `bg-card`, `border-slate-200` with `border-border`, `text-slate-800/900` with `text-foreground`, `text-slate-500/gray-500` with `text-muted-foreground`, `bg-slate-50` with `bg-muted`. 67 `bg-white` and 120+ slate/gray text uses in my area.

### C. Alarm colours on non-alarm states
1. `contacts/+page.svelte:333-350` "Pending Immediate" stat card: rose-50/rose-700 with a CircleAlert icon, always shown, including when the count is 0 or nothing has been called. Proposed: neutral card when 0; use amber-700 on amber-50 or primary when > 0.
2. `contacts:430-440` Tier 1 header: rose-600 CircleAlert plus "Call Now" badge, which shows even when tier 1 is empty. Proposed: indigo/primary for the tier header with "Call first" in soft text. Tier 2 orange (:452) is an alarm gradient (rose to orange to ...). Proposed: single teal ramp or slate for tiers, differentiated by icon/number, not alarm hue.
3. `medical:313-320` "Critical Allergies" orange-50 box shown even with "None reported" (:322). Proposed: neutral with a heart/shield icon; only highlight if allergies exist (and then use amber-800 on amber-50, not orange-400).
4. `executor-toolkit:328` red "Urgent" badge on tasks (red-100/700 uppercase). Proposed: amber-100/amber-900, label "Time-sensitive". `:109-116` red "Sudden Passing Mode Active" alert with TriangleAlert in red-500/800/600: this is a grief-mode explanation, not an error. Proposed: slate or indigo-50 info panel, Heart or Info icon.
5. `family-hub:552` rose-100/700 "Add Memory" button. Rose is used elsewhere as an alert (contacts); the family-hub memory button is a primary action; use the primary token. `:565` indigo-50/600 secondary pill.
6. `FamilyTreeGraph:72` rose #E11D48 for spouse/partner and `:186` rose-500 icon; the same rose is the alert colour in contacts. Proposed: keep rose for family-love only if the palette doc says so; otherwise use primary-teal tints.
7. `family-hub:612, 620, 730, 736, calendar:372-379, 490-497, medical:482-488, contacts:494, 607, FamilyTreeGraph:315`: edit = blue-500/600, delete = red-500/600. Red as a hover on a remove action is fine. But every module uses a different shade. Proposed: one `icon-action` pair: slate-500 to primary on edit hover; slate-500 to rose-700 on remove hover.
8. `executor-guide:167-178` yellow Pro Tip: yellow/amber is a warning hue for a tip. Proposed: primary-tinted (`bg-primary/5`) panel with Lightbulb in teal.
9. `contacts:640-717` `amber-glow` plus pulsing `animate-pulse` ring for AI-filled fields. Ring-4 amber/40 plus pulse flags attention as a warning; it is also `animate-bounce` (:646). Proposed: primary/30 ring, no bounce (the plan has reduced-motion and grief mode concerns too).
10. `ExecutorHub:131-135` amber-500 dot meaning "in progress" reads as warning. Proposed: primary teal for started, emerald for done.

### D. Inconsistency with the same element elsewhere
1. Primary action button: `bg-primary text-primary-foreground` in contacts:305, medical:255, anniversary:174, FamilyTreeGraph:206, RecipientLinkPanel:134 (good); `bg-[#4A7C74]` in family-hub:443; `bg-[#304743]` in calendar:294, 713, executor-toolkit:154, 163, 248, RecipientPageState:22; `bg-white text-slate-900` in ExecutorWelcome:91. Proposed: one `bg-primary` everywhere on light, white-on-dark variant only in the dark shell.
2. Brand dark green #304743 vs teal #4A7C74: they are two brands. #304743 appears about 45 times in my area. It should be a token (`--color-primary-strong`) or be replaced by `text-primary`. Under tone-executor/grief the tokens change, but #304743 and #4A7C74 do not, so tone theming is ignored on these pages.
3. Hover for #304743 differs: #2a3f3b (calendar:294), #20302d (calendar:713), #2A3F3B (executor-toolkit:248). Two hovers for one colour.
4. Modal/backdrop: family-hub modal and anniversary use `bg-slate-900/60` (matches the standard). I did not find black/40 or black/10 backdrops in my area, only `bg-black/20` for slideshow buttons (family-hub:892).
5. Focus ring: `focus:ring-indigo-500` (anniversary) vs `focus:ring-primary/20` (contacts, medical, RecipientLinkPanel:104) vs `focus:ring-[#4A7C74]/20-30` (executor-toolkit:219, 264) vs `focus:ring-[#304743]/20` (calendar:565) vs `focus:ring-0` (family-hub:362 removes the ring entirely). Proposed: `focus:ring-2 focus:ring-primary/30 focus:border-primary`.
6. Input padding and radius: anniversary `px-5 py-3 rounded-2xl` vs calendar `px-4 py-2 rounded-xl` vs family-hub `p-3 rounded-xl` (not colour; flag for V1 crossover).
7. Event type colour keys disagree: anniversary (birthday amber, anniversary rose, passing indigo, ritual emerald; :66-69) vs calendar (birthday rose, holiday amber, anniversary purple, other blue; :271-275). Birthday is amber in one and rose in the other; anniversary is rose in one and purple in the other. Same concept, different colour. Proposed: single map in `lib/utils/eventColors.ts`, e.g. birthday amber, anniversary rose, passing slate/indigo, holiday emerald.
8. Cards: executor-toolkit `bg-white rounded-2xl border-stone-200`; executor-guide `rounded-[40px] border-gray-100` and promo `rounded-[32px]`; anniversary `rounded-[2rem]` (:412); contacts `rounded-2xl border-slate-200`; recipient `rounded-2xl border-stone-200`. Border colours stone-200 / gray-100 / slate-200 / slate-100 / gray-200 all appear for the same card element. Proposed: `border-border` (slate-200 token).
9. Neutral family: slate (contacts, anniversary, medical samples, ContactRow, FamilyTreeGraph), gray (calendar, medical labels, family-hub forms, executor-guide, ExecutorTaskDetail), stone (executor-toolkit, recipient). Proposed: slate/tokens only (gray and stone lose about 130 uses).
10. Label style: family-hub forms are `text-xs font-bold uppercase text-gray-400`; calendar `text-gray-500`; anniversary `text-slate-400 font-black`. Proposed: one `.form-label` class `text-xs font-bold uppercase text-muted-foreground`.
11. Sample ("Example entries") grid uses `opacity-60` (anniversary:226, calendar:318) on top of the card background (U17 stacked-opacity warning); text inside falls to roughly 60 percent and fails contrast (e.g. slate-400 at 60%). Proposed: remove opacity, tag with a "Example" chip.
12. Executor hub accent system (dynamic) vs everything else static. Executor hub also uses indigo for progress where the rest of the app uses primary teal. Consider whether "indigo-300 on carbon" (U37) should become primary-light.
13. Anniversary LivingBlueprintHeader: h1 is `font-serif` in the shared header, so "sans-serif heading" is not from this file. The sans-serif I found is the `font-sans` on form buttons (anniversary:584, :590) which are the only buttons in my area forcing sans (the rest inherit; body is sans anyway), so there is no visible difference. The sans heading seen in the audit is likely the `LivingBlueprintHeader` `title` slot when `font-blueprint` is used on the subtitle (LivingBlueprintHeader:87); check `font-blueprint` in app.css. I did not verify this one in a browser.

## 3. Proposed fix cards (by file)

1. **app.css (token card, do first)**: add `--color-primary-text` (light #3b635d or #4A7C74; dark #7fb5ab), `--color-primary-strong` (#304743, replaces the hard-coded green), `--color-primary-soft` (tint bg), `--color-warn`, `--color-warn-bg`, `--color-info`, `--color-info-bg`, `--color-success`, `--color-success-bg` (each with a dark-theme value). Make `tone-executor`, `theme-color-carbon` primaries brighter in theme-dark (or mark them light-only). Ban `gray-*`/`stone-*`.
2. **LivingBlueprintHeader.svelte:79** `text-primary` to `text-primary-text` (fixes dark h1 on every module page, U-seed).
3. **ExecutorHub.svelte:124, 140, 153, 156**: static colour lookup instead of `{module.color}` interpolation; :131-135 status dots with labels, started = primary, not-started slate-500.
4. **ExecutorTaskDetail.svelte** (:23, 29, 31, 69, 81, 104, 112): `text-[#304743]` to `text-foreground`/`text-primary-strong`; gold step numbers to #7a6420; checkbox border to slate-400 (3:1).
5. **executor-toolkit/+page.svelte** (:102, 109-133, 154-163, 173, 183, 207, 219, 248, 264, 287, 294, 298, 302, 305, 319, 328, 335): brand green to tokens, red/green alert boxes to neutral/info panels, Urgent badge to amber "Time-sensitive", `border-stone-200` to `border-border`, `text-gray-400/500` to `text-muted-foreground`.
6. **executor-guide/+page.svelte** (:69, 74, 97, 102, 108-123, 131, 150, 167-178): blue/indigo-900/yellow to primary/info/primary-soft; card radius `rounded-[40px]/[32px]` to `rounded-2xl`.
7. **contacts/+page.svelte** (:324, 334-364, 430-440, 452, 640-717, 742): neutral/zero-state stat cards, tier headers off the rose/orange alarm ramp, `amber-glow` to primary ring without bounce, `text-slate-400` to slate-600/muted, :375/:385/:419/:725 text on primary tints to `primary-text`.
8. **ContactRow.svelte** (:22 `hover:border-indigo-300` to `hover:border-primary`, :41 amber chip to amber-800 on amber-50, :65).
9. **medical/+page.svelte** (:276-303 tint text, :313-320 conditional Critical Allergies box and orange label, :327-342 blue block, :447, :482-488).
10. **anniversary-manager/+page.svelte** (:66-69 shared event colour map, :256-264 indigo-600 header to primary, :323-329 emerald-600 to 700, :412-439 indigo panel with solid 800 text, :507-568 `focus:ring-indigo-500` to primary, :226 remove opacity-60, :500-561 labels to slate-600).
11. **calendar/+page.svelte** (:271-275 shared colour map, :294/537/713 `#304743` to `bg-primary` with one hover, :398/565/609, :411/621-636 amber wish block to amber-800, :317/388/437 gray-400 to muted).
12. **family-hub/+page.svelte** (:299 `bg-[#FDFBF7]` to `bg-background`, :316/332-443 teal and green literals to tokens, :357-429 labels `text-gray-400` to muted, :552 rose button to primary, :565 indigo pill, :612-620/730-736 icon hovers, :638 rose hover, :650-663 amber card text, :756 card to `bg-primary-strong`, :362 restore a focus ring).
13. **FamilyTreeGraph.svelte** (:63-84 hex colours into one exported palette that matches the tokens; :315 red-500 to rose-700).
14. **EducationalResources.svelte** (:111-136, 163, 175 close X `text-gray-400` to slate-600 per U51, :183 slate-400 heading).
15. **Recipient files** (RecipientStartPage, RecipientPageState, RecipientLinkPanel): decide whether the recipient palette is intentionally separate (cream #FAF8F5, #304743, gold). If so, move the three hexes into `--recipient-*` tokens in app.css so there is one definition; fix gold-on-white if any (:260 is a bar, fine). Contrast on this page is good (stone-500 on cream 4.53, stone-600 7.2); no contrast misses found. Optionally align #304743 with the shared `primary-strong`.
16. **ExecutorWelcome / SupportResources / ExecutorProgressTracker**: no contrast failures found (all on slate-900/950, ratios 5.2-9.3). Only action: unify the icon accent (rose/indigo/purple/emerald, four hues across three icon tiles) to one primary-light plus emerald for done.

## 4. Counts (my area)
- Contrast fails (text/label, light theme): about 60 instances in 14 files (slate/gray-400 about 40, rose-400, orange-400, amber-600, primary-on-tint).
- Dark-theme-unsafe hard-coded colour (bg-white, #304743 text, gray/stone text): about 250 instances, every file except the dark shell components.
- Alarm colour used for non-alarm state: 10 places (listed in C).
- Dynamic Tailwind classes: 4 lines in ExecutorHub (:124, :140, :153, :156). No others in my area.

## 5. Not verified
- Browser screenshots were not taken. All contrast values come from class-to-hex arithmetic, so stacked opacities and gradients are approximate.
- Whether ExecutorHub's dynamic classes happen to be generated because the same strings appear literally elsewhere in the codebase (not checked against the built CSS).
- The "anniversary sans-serif heading" seed: I could not reproduce it from source in anniversary-manager (all headings are `font-serif`); it may be the shared header or `font-blueprint`.
