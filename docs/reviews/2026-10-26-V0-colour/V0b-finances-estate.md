# V0b-finances-estate

**Last Updated:** 2026-10-26 08:35 EST

Reviewer report, saved verbatim (read-only review on main).

V0b report, area (b): finances and estate routes plus archetypes. Read-only; nothing changed or committed. Contrast ratios are WCAG, computed with a script from the app.css token hex values and Tailwind v4 default hex values.

## 0. Findings that apply across the whole area

**Token facts (`frontend/src/app.css`):**
- Light theme: `--color-primary` is `#4A7C74`. It reads 4.74 on white, 4.53 on `#f8fafc`, and about 4.2 on a `primary/10` tint.
- Dark theme (`body.theme-dark`, lines 78-90) only swaps the CSS variables: background `#0f172a`, foreground `#f8fafc`, card `#1e293b`, muted-foreground `#94a3b8`.
  - It does not change `primary`. `text-primary` is 3.76 on `#0f172a` and 3.08 on `#1e293b`, so it fails 4.5 on both dark surfaces.
- The accent themes (`theme-color-*`, lines 100-124) re-point `--color-primary` but never touch `--color-primary-foreground`, which is always white.
  - Every `bg-primary text-primary-foreground` button in my area then reads: indigo 4.47, rose 3.67, emerald 2.54, amber 2.15.
  - Carbon `#0f172a` (the accent theme) is the same colour as the dark-theme background.
  - `tone-executor` primary `#1E293B` equals the dark card colour.
- All area-(b) pages hard-code light surfaces (`bg-white`, `bg-slate-50`, `bg-gray-50`, `bg-rose-50`, `bg-amber-50`, and so on). Dark theme never reaches them, so `bg-white` cards stay white on a `#0f172a` page.
  - Three kinds of token text then land on that white or on the dark page:
    - Every `h1`-`h6` without an explicit colour class gets `text-foreground` (app.css base layer, `#f8fafc` in dark). That is 1.05 on white.
    - `text-muted-foreground` is `#94a3b8` in dark, 2.56 on white.
    - Hard-coded dark text sitting directly on the dark page background is invisible (see fix cards below).
  - This is the root cause behind the seeds about "dark-mode heading nearly invisible".
- Eight `<span>` and `<p>` label patterns use `text-slate-400` (2.56 on white, 2.45 on `#f8fafc`). Slate-400 is specified in UI standards §11.2 as placeholder and icon colour only, yet it is used here for real text at 9-12px.
  - Proposed token: `text-slate-500` (4.76 on white, 4.55 on slate-50, 4.34 on slate-100). Use `text-slate-600` where the label sits on slate-100.
- Hex duplicates of tokens: `#4A7C74` hard-coded 27x in AssetManager, 36x in DocumentVault, 24x in TaskDashboard, plus ContactDirectory:472-473 and JargonSlayer:82. `#304743` appears 7x in DocumentVault, 3x in TaskDashboard, 1x in AssetManager and 5x in digital-guardian. `#FBF9EB` and `#FDFBF7` are cream backgrounds. None of these follow the tone-grief (`#5A6B8F`) or tone-executor primary overrides, so archetype pages stay teal when the tone changes.

## 1. Colour map (summary; all `file:line` are under `frontend/src/`)

**Signals via the `primary` token (teal):** primary action, links, selected state.
- Primary add buttons using `bg-primary text-primary-foreground`: `routes/modules/financial-accounts/+page.svelte:158`, `property:517,865,1319`, `subscriptions:382,895`, `pets:229,632`, `insurance:1277`, `digital-guardian:1038`, `home-manual:480,650,759`, `lib/components/archetypes/AssetManager.svelte:582` (now primary, so the old teal-versus-dark seed there is resolved).
- Size and radius differ between these buttons: `rounded-lg px-4 py-2` (AssetManager, home-manual) against `rounded-2xl px-5/6 py-3` (property, insurance, financial-accounts) against `rounded-xl` (the others).

**Primary action in a non-primary colour (inconsistent):**
- `bg-slate-900 text-white`: `insurance:425`, `advanced-registry:210` (hover turns indigo-600) and `:1008`, `subscriptions:791`.
- `bg-[#304743]`: `digital-guardian:1031,1128`.
- `bg-indigo-600`: `ContactDirectory.svelte:228,350`, `SubscriptionRow.svelte:138`.

**Indigo as a second accent:**
- `advanced-registry` focus rings: 13x `focus:ring-indigo-500`, lines 194, 763, 777, 790, 804, 823, 845, 860, 873, 895, 908, 931, 944. Its hover borders and a toggle (`:699`) are also indigo.
- `ContactDirectory` focus rings (`:254-312`) and heading (`:240`).
- `subscriptions:856`, `SubscriptionRow:51`, `insurance:401,808,859`, `home-manual:663`, `digital-guardian:431`.
- Every other page uses `focus:ring-primary/20 focus:border-primary`.

**Backdrop:** `bg-slate-900/60` is correct and consistent everywhere in area (b): `insurance:446,940`, `property:536,1080`, `subscriptions:641,807`, `digital-guardian:1050,1077`, `advanced-registry:726`, `JargonSlayer`, `AssetManager`. `TaskDashboard` has `bg-black/40` and `bg-black/5` (sub-backdrop, flag for U39). `ContactDirectory` has `bg-black/80`.

**Status and alarm colours:**
- Emerald means active or approved: `insurance:393` and `ClaimRow:13`.
- Amber means pending or in review.
- Rose or red means delete, denied, or "high priority".
- Blue, purple and indigo are used for category palettes (`insurance:399-405`, `property:469-475`, `ClaimRow:11-16`, `SubscriptionRow:32-34`).

**Delete and remove:**
- `property:689-702,955-970` uses rose-50 panel, rose-800 text and `bg-rose-600` button for the "Remove… You can add it back anytime" confirm.
- `DocumentVault:926` uses `bg-rose-600`.
- `ContactDirectory` uses red-500 emergency badges (`:445,520`).
- `subscriptions:622`, `insurance:915`, `property:947` use `hover:text-red-500`.
- rose-600 versus red-500 is mixed within the same row of action icons.

## 2. Misses (grouped as fix cards by file)

### Card A: `lib/components/archetypes/AssetManager.svelte` (also renders on `financial-accounts`)
- **:565 (dark, hard-miss):** estate net value uses `text-[#304743]` straight on the page background. Dark theme gives 1.79 on `#0f172a`. Proposed: `text-foreground` or a new `--color-heading` token that is `#304743` in light and `#e2e8f0` in dark.
- **:557 and :575 (dark):** `text-gray-500` (`#6b7280`) on the page background is 4.83 on white in light but about 3.7 on `#0f172a` in dark. Proposed: `text-muted-foreground`.
- **:585 `Add Asset` button:** `rounded-lg px-4 py-2` against the `rounded-2xl px-6 py-3` pattern on property and insurance. Proposed: share one class string (see cross-page card).
- **:640-1110 hex:** replace the 27 `#4A7C74` (`focus:border-[#4A7C74]` and others) with `focus:border-primary`. Replace `#304743` with the heading token. `:1110` `text-stone-400` (2.5) becomes `text-slate-500`.
- **:431-441 `getGradient`:** the amber-600/10, stone-200, emerald-600/10, teal-200 and slate-600/10 category gradients introduce unrelated hues. Proposed: use primary and secondary tints, or a single neutral gradient.
- **:1066 and `:998`:** `text-amber-800` on `bg-amber-50/50` (OK) and `text-emerald-600` on a white card (3.77, fails). Proposed: `text-emerald-700` (5.48).
- **Role banner `~:600`:** `bg-blue-50 border-blue-500 text-blue-900` is an information colour used for role context. OK, but flag the amber and blue banner pair against the subscriptions amber "Inflation Alert".

### Card B: `lib/components/archetypes/DocumentVault.svelte`
- **15x `text-muted-foreground`, 15x `text-slate-500`:** the slate is fine; the muted-foreground ones are 2.56 on white cards in dark (`:305`, `:311` and others).
- **`:926` delete button:** `bg-rose-600 text-white` (4.7 with `#e11d48`; `rose-600` is `#e11d48`, OK). The other remove flow (`property:702`) is also rose-600, so they agree.
- **Amber for non-alarm states:** `:232,322,544,548,726` use amber for "missing title hint" and "needs review". These are gentle hints, but `ring-amber-200` and `border-amber-400` on an input as the user types a title reads as a validation error. Proposed: `border-slate-300` with a `text-slate-600` hint, or primary tint.
- **Hex:** the 36 `#4A7C74`, 7 `#304743`, 3 `#FBF9EB` hard-codes (lines 232-524, 686, 832, 915). Same token substitution as Card A.

### Card C: `lib/components/archetypes/ContactDirectory.svelte`
- **Dark-mode risk:** `glass-card` (bg-white/60) with `text-foreground`/`h5 font-bold` with no colour (`:410,454`) and `text-foreground` (`:529`). In dark, near-white text sits on a mid-grey blend; ratio about 1.5-2.
- **`:228,350` indigo-600 buttons** and indigo focus rings (`:254-312`) against the primary add button elsewhere. Proposed: `bg-primary text-primary-foreground`, `focus:ring-primary/20`.
- **`:360-379` emergency-contact panel (`bg-red-500/5`, `text-red-800`, `text-red-900/80`):** a persistent red block for informational data (emergency contacts exist, nothing has happened). This is an alarm colour for a non-alarm state. `:445,520` red-500 badge on every emergency contact avatar, `:319-334` red-50 form row for the "emergency contact" checkbox. Proposed: primary or slate tint, and `Siren` icon kept as the only signal, or `text-rose-700` on `bg-rose-50` for the checkbox helper only.
- **`:166`** `bg-rose-100 text-rose-600` (role badge, 3.9, fails). Proposed: `text-rose-700` (`#be123c` on `#ffe4e6` is 5.24).
- **`:420`** `hover:border-rose-200` on every family card, not a delete state. Proposed: `hover:border-primary/30`.
- **`:397`** `text-rose-500` heart header; keep, it is decorative.

### Card D: `lib/components/archetypes/TaskDashboard.svelte`
- **Dark risk:** `h5 text-foreground` (`:380,432,477`) on cards that are white; 1.05 in dark.
- **`:242` and `:249`** `#FBF9EB/50` cream panel with `#304743` title: fine in light, hex not token.
- **`:226,328`** `#3b635d` as a hover value, a one-off. Proposed: `hover:bg-primary/90`.
- **`:176-180`** priority colours (`text-amber-700 bg-amber-100`, 4.51, borderline pass).
- **`:23`** `bg-black/40`, `bg-black/5`: align to `bg-slate-900/60` (U39).

### Card E: `routes/modules/insurance/+page.svelte`
- **text-slate-400 real text at 2.56:** `:485,510,535,560,600,684,698,712,742,763,815,887`. Proposed: `text-slate-500`.
- **typeColors (`:399-404`):** `text-emerald-600` on `bg-emerald-50` is 3.58 and `text-amber-600` on `bg-amber-50` is 3.07 (both fail); `text-rose-600` on `bg-rose-50` is 4.28 (fail). Proposed: `-700` shades for text: emerald-700 on emerald-50 5.21, amber-700 on amber-50 4.84, rose-700 on rose-50 5.72. Same fix at `:474,524` (`bg-rose-50 text-rose-600` icon box) and `:1219` (`bg-rose-100 text-rose-600`, `text-[8px]`, 3.9; also below the minimum text size).
- **`Life` category is rose, with a "CRITICAL" rose badge (`:1219`) and a rose-500 section rule (`:1170`):** rose signals alarm. A life-insurance card and the "Legacy Information" form heading are not alarms. Proposed: Life becomes primary or slate. Keep the rose "CRITICAL" only if you want a real warning. Otherwise use a primary tint.
- **`:785` Claims Procedure footer:** `bg-primary` with white text (4.74, OK). It becomes `hover:bg-slate-900` (a different colour for hover). The same element on property is `bg-slate-100 text-slate-900` (property `:790,813`). Inconsistent between the two cards: pick one (proposed: `bg-slate-100 text-slate-900 hover:bg-slate-200`, which reads at 17+).
- **`:425`** primary add button is `bg-slate-900`; property uses `bg-primary`. Proposed: `bg-primary text-primary-foreground`.
- **`:451`** `text-white/50` close affordance over a `bg-slate-900/60` backdrop (about 3.1) with the visible text "Go back" (label only). Proposed: `text-white` with an X icon (also on `property:541`).
- **`:807,858` iconClass `text-indigo-500`** on EmptyState and `:1084` `text-green-500` (2.28 on white): proposed `text-primary` and `text-emerald-700`.
- **Status dot (`:733-736`):** `bg-emerald-500 animate-pulse` for Active, `bg-slate-300` for others. Fine, but a pulsing animation on every active policy is an alarm cue. Proposed: remove `animate-pulse`.

### Card F: `routes/modules/property/+page.svelte`
- **`:577,587,654,715,729,744,750,764,770,1004,1029,1054`** `text-slate-400` text at 2.56. Proposed: `text-slate-500`.
- **`:656`** `MapPin text-primary/60` on white: 2.74 (icon-only, still below 3.0 for graphics). Proposed: `text-primary`.
- **`:474`** `Other: text-purple-600 bg-purple-50` against the other three categories on primary: one outlier hue. Proposed: `text-slate-600 bg-slate-50`.
- **`:689-702, 955-970`** remove confirmation uses rose-50/800/600. The copy is gentle ("You can add it back anytime"); the colour is an alarm. It matches `DocumentVault:926`, so the rose-600 button is consistent, but the rose panel is not used by insurance's confirm. Proposed: slate-50 panel and `bg-slate-900` confirm, or keep rose only on the confirm button.
- **`:1044` `text-amber-600 bg-amber-50`** (3.07, fails). Proposed: amber-700 (4.84).
- **Footers `:790-830`** now slate-100 (seed `:718` resolved); see Card E for the insurance mismatch.
- **`:541`** `text-white/50` "Go back" (see E).

### Card G: `routes/modules/subscriptions/+page.svelte` and `SubscriptionRow.svelte`
- **`:425,458,470,881`** `text-slate-400` text. Proposed: `text-slate-500`.
- **`:481-488`** amber "Inflation Alert" card: `text-amber-700/80` on `bg-amber-50` is 3.42 (fails); `text-amber-500` icon is 2.15. It signals a fact ("prices tend to creep up"), not an alarm. Proposed: `bg-slate-50 border-slate-200`, text `text-slate-700`, icon `text-primary`.
- **`:594-597`** difficulty badges use `bg-green-100 text-green-700 / bg-amber-100 / bg-red-100 text-red-700`, while `SubscriptionRow:32-34` uses emerald. Same element, two palettes. Hard = red is an alarm colour for "hard to cancel". Proposed: one shared map (emerald-700 / amber-700 / slate-700 or rose-700); green-700 on green-100 is 4.57 (marginal pass).
- **`:791`** `bg-slate-900` modal confirm versus `:895` `bg-primary`: two button colours in the same modal family.
- **Mixed `gray-*` and `slate-*`:** 8x `text-gray-500`, `border-gray-100/200`, `bg-gray-50`. The standards call for slate. Proposed: slate.
- **`SubscriptionRow:51,138`** indigo-50/600 avatar and `bg-indigo-600` button. Proposed: primary.

### Card H: `routes/modules/digital-guardian/+page.svelte`
- **Dark risk:** `text-foreground` on `bg-white` cards (`:630,634,719,802,890,955`) and 15x `text-muted-foreground`. Also `h4` at `:840` has no colour class. Proposed: `text-slate-800`/`text-slate-500` on white cards, or switch the cards to `bg-card`.
- **`:459-466` "The Fire Drill":** the verification-mode panel uses `bg-rose-50 border-rose-100` and `border-rose-200` on all six step buttons (`:478,501,524,547,570,593`). It is a practice exercise, not an alarm. Proposed: primary tint (`bg-primary/5 border-primary/20`).
- **`:483,506,529,552,575,598`** `text-white/80` step label on `bg-primary` (about 3.6). Proposed: `text-primary-foreground`.
- **`:687,770`** `text-sky-600` links, a colour used nowhere else (4.1 on white, fails). Proposed: `text-primary` underline.
- **`:1058,1090`** `text-gray-400` close buttons (2.54). Proposed: `text-slate-500` and shape per the X-icon standard (cf. U51).
- **`:1186,1230`** `text-slate-400`/`:1194,1238` `text-red-400` icon buttons on white (2.77). Proposed: `text-slate-500` and `hover:text-rose-600`.
- **`#304743`:** `:466,1021,1031,1096,1128`. Proposed: a heading token and `bg-primary`.
- **`:827`** amber-50 notice (OK on contrast: `text-amber-900`); informational, so proposed slate or primary tint.

### Card I: `routes/modules/advanced-registry/+page.svelte`
- **`text-slate-400` text:** `:257-273` (table headers `text-[10px]`), `:294,343,399,435,504,519,553,632,666,677`, and 15 form labels at `:756-991`. Proposed: `text-slate-500`.
- **`:303-304,511-512`** emerald-600 on emerald-50 (3.58) and amber-600 on amber-50 (3.07); `:414` `text-amber-600` on white (3.19). Proposed: `-700`.
- **`:586-603` Kill Switch panel:** `bg-rose-50 border-rose-100`, `text-rose-900`, `Skull` icon. The heading is "Digital Inheritance Protocols", a settings panel. Proposed: slate-50/primary tint with `Skull` removed or `text-slate-700`.
- **`:642` and `:656`** rose-100 for high priority and a `bg-rose-500` toggle for "closed": a closure setting, not an error. Proposed: primary for the toggle.
- **`:707`** `text-rose-400 italic` text (2.45). Proposed: `text-slate-500`.
- **`:322`** `text-slate-300` delete icon (1.48). Proposed: `text-slate-500`.
- **`:194,763-944`** `focus:ring-indigo-500`; `:958,980,998` `focus:ring-[#304743]`. Proposed: `focus:ring-primary/20`.
- **`:210`** `hover:bg-indigo-600`: proposed `bg-primary`.
- **`:337,429,547`** iconClass indigo-500/amber-500/emerald-500 (EmptyState). Proposed: `text-primary`.

### Card J: `routes/modules/pets/+page.svelte`
- **`:260`** `from-orange-100 to-amber-50` header with `:430` `text-orange-600` on orange-100 (3.11, fails). Orange is not in the standards palette. Proposed: `from-primary/10 to-secondary/10`, icon `text-primary`.
- **`:302-307`** "Designated Guardian" uses `bg-red-50`, `Heart text-red-500`, `text-red-400` label (2.53). It is a role label, not an alarm. Proposed: `bg-primary/5`, `text-primary`, label `text-slate-600`.
- **`:279`** `text-primary/70` icon button on `bg-white/70`: 2.74. Proposed: `text-primary`.
- **`:289`** `text-red-400` delete icon; `:319-360` gray-400 labels at 2.54 and `:531` `text-slate-400` helper text. Proposed: slate-500.
- Mixed gray-400/700/900 and slate: normalise to slate.

### Card K: `routes/modules/home-manual/+page.svelte` (utilities, vendors, home access)
- **`:505,513,582,589,693,700,775,782`** `text-slate-300` action icons (1.48 on white; hover goes to primary/red). Proposed: `text-slate-500`.
- **`:448,466,618,636,726,745`** `text-slate-400` example label and icons (2.56). `:535,684` `text-slate-400` helper text. Proposed: `text-slate-500`.
- **`:663`** `bg-indigo-50 text-indigo-600` icon box and `:492` `hover:border-orange-200`. Proposed: primary tint, `hover:border-primary/30`.

### Card L: `routes/modules/financial-accounts/+page.svelte` (185 lines)
- Uses tokens only. No miss found beyond inherited AssetManager issues (Card A). Page `max-w` differs per page (U56), unchanged here.

### Card M: `routes/modules/legal-documents/+page.svelte` and `JargonSlayer.svelte`, `LegalDisclaimer.svelte`
- `legal-documents/+page.svelte` has no colour of its own (all comes from DocumentVault).
- `JargonSlayer:198-212` uses scoped hex `#3b82f6`/`#1e40af`/`#eff6ff` and `#f59e0b`/`#92400e`/`#fef3c7` (blue and amber highlight pairs). `:82` hard-coded `#4A7C74`, `:96` `bg-[#FDFBF7]`. `:` `text-amber-200`/`text-amber-400` on `bg-slate-900` (OK). Proposed: Tailwind tokens.
- `LegalDisclaimer` uses an amber callout (`text-amber-900/800/600` on `bg-amber-50`); the disclaimer is a permanent notice, not a warning. Proposed: slate-50/primary tint, keep wording.

### Card N: `routes/estate/[id]/+page.svelte`, `routes/modules/[id]/+page.svelte`
- Both use theme tokens only (`bg-card`, `text-muted-foreground`, `border-border`). These are the pattern to copy; no miss.

### Card O: `frontend/src/app.css` (token layer, for the above to hold in dark)
- Add `--color-heading` (light `#304743`, dark `#e2e8f0`) to replace the `#304743` hard-codes.
- Make `--color-primary-foreground` follow the theme: `#0f172a` for amber/emerald accents, white otherwise.
- Raise dark-theme primary (for example `#6FB3A8`, which gives about 7.5 on `#0f172a`) so `text-primary` reads 4.5 or better.
- Give the carbon accent and `tone-executor` primary a non-background value in dark.
- Add a `--color-card` mapping so area-(b) pages can switch from `bg-white` to `bg-card` (or add `body.theme-dark .bg-white` override).

## 3. Cross-page consistency table (same element, different colour)

| Element | Variants found |
|---|---|
| Primary add button | `bg-primary` (financial, property, subscriptions, pets, DG, home-manual, AssetManager); `bg-slate-900` (insurance, advanced-registry); `bg-indigo-600` (ContactDirectory) |
| Modal confirm | `bg-primary` (insurance, property, pets); `bg-slate-900` (subscriptions, advanced-registry); `bg-[#304743]` (DG) |
| Focus ring | `ring-primary/20` (most); `ring-indigo-500` (advanced-registry, ContactDirectory); `ring-[#304743]` (advanced-registry) |
| Card footer link | primary (insurance); slate-100 (property) |
| Difficulty or status badges | green (subscriptions page) vs emerald (SubscriptionRow, insurance) |
| Close button | `text-white/50` "Go back" (insurance, property), `text-gray-400` (DG), `text-slate-400` (others) |
| Remove confirm | rose panel (property) vs inline (others) |

## 4. Priority suggestion
1. Card O plus dark-surface text fixes (A:565, H, C, D, B): invisible text in dark theme.
2. Contrast sweep: `text-slate-400` to `text-slate-500` and `-600` to `-700` status tints (E, F, G, I, K): a mechanical replacement across about 120 lines.
3. Alarm-colour removals: C emergency panel, E Life/CRITICAL, H Fire Drill, I Kill Switch, J Guardian and F remove panel.
4. Button and focus-ring unification (indigo, slate-900, #304743 to primary).
5. Hex-to-token in archetypes.

I did not verify screenshots in a browser; all measurements come from class strings and the token hex values. Dynamic classes (`{type.color}`) were not found in my area.
