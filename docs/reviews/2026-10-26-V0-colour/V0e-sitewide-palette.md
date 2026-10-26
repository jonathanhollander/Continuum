# V0e-sitewide-palette

**Last Updated:** 2026-10-26 08:50 EST

Reviewer report, saved verbatim (read-only review on main).

V0e REPORT: colour review, area (e) plus cross-page summary. Read-only. I changed nothing and committed nothing. WCAG numbers are computed (relative luminance, alpha blended onto the actual background) with a throwaway script at /private/tmp/claude-501/-Users-jonathanhollander-AI-Code-Continuum/798584f5-5f46-497f-a2f2-975a6b8ca86a/scratchpad/wc.py. All paths below are relative to /Users/jonathanhollander/AI Code/Continuum/frontend/src. Counts come from grep over all *.svelte and *.ts under that folder.

## 0. The root cause behind most findings (verified in code)

1. **The default primary is not teal.** `lib/stores/accessibilityStore.ts:16-17` defaults to `theme:'light', color:'carbon'`. `app.css:119-122` makes `body.theme-color-carbon` set `--color-primary:#0f172a`. So `bg-primary` and `text-primary` render near-black by default, while 342 hard-coded `#4A7C74` teal values sit beside them. That explains "AssetManager teal Add Asset vs the dark primary elsewhere".
2. **Tone overrides are dead code.** `body.tone-grief`, `tone-executor` and `tone-planning` (`app.css:57-72`) have the same specificity as `body.theme-color-*` (`app.css:95-123`). The theme-color rules come later and win, and a theme-color class is always set. The tone primary never applies. Hard-coding teal bypasses theme-color, not tone.
3. **`body.theme-dark` only flips tokens** (`app.css:80-92`). Primary is not re-tuned. `--color-primary` stays `#0f172a` (carbon) or `#4A7C74`. The body gradient (`app.css:46-50`, `hsla(170,40%,96%)`) is never reset, so light blotches show on the dark body. The hard-coded literals (`bg-white` 634 uses in 111 files, `text-slate-700/800/900` 303 uses in 65 files, `border-slate-100/200` 416 uses) never flip.
4. **The 33 `dark:` variants are in 4 files and do not follow the theme toggle.** Files: TakeBreakButton, BreakOffer, RoleSwitcher, `routes/+layout.svelte`. There is no `@custom-variant dark` in the project, so Tailwind v4 uses `prefers-color-scheme`. A `body.theme-dark` user on a light OS gets none of them. This confirms V0a's "zero usable dark variants" and sharpens it.
5. **Primary-foreground is never overridden.** `app.css` sets `--color-primary-foreground:#fff` only once. The user-selectable accents then fail white-on-primary: amber 2.15, emerald 2.54, rose 3.67, indigo 4.47. Carbon is 17:1 and passes.

## 1. Site-wide colour map (occurrences / files)

**Brand hard-codes (confirmed, and worse than V0a's 117):**

| Colour | Uses | Files | Notes |
|---|---|---|---|
| `#4A7C74` | 342 | 39 | 240 are arbitrary utilities such as `bg-[#4A7C74]`. Worst files: `lib/components/archetypes/DocumentVault.svelte` (28), `archetypes/AssetManager.svelte` (27), `modules/funeral/FuneralWizard.svelte` (23), `archetypes/TaskDashboard.svelte` (18), `routes/modules/letters/+page.svelte` (14) |
| `#304743` | 162 | 34 | 141 as `bg-/text-/border-[#304743]`. Worst: `recipient/RecipientStartPage.svelte` (18), `routes/modules/timeline`, `executor-toolkit`, `calendar` (10 each), `routes/help` (9) |
| `#3b635d` hover | 18 | 10 | |
| `#2A3F3B` hover | 8 | | e.g. `routes/binder/+page.svelte:87` |
| `#527B84` | 1 | 1 | `--color-secondary` is defined but essentially unused |
| Token use for comparison | `bg-primary` 166 (39 files), `text-primary` 281 (49), `border-primary` 142 (32) | | `text-primary/NN` 5 uses |

**Accent families:**

| Family | Uses | Files | Typical use |
|---|---|---|---|
| indigo | 432 | 64 | The de-facto second accent. Dashboard icons (`routes/dashboard/+page.svelte:441,467,493,519`, `text-indigo-300`), CustomFieldsManager, GhostRow, ConciergePanel (18), onboarding/start CTAs (`routes/start/+page.svelte:96-125`), time-capsule (21), advanced-registry (21) |
| teal (Tailwind) | 257 | 27 | Login/signup gradients (`routes/login/+page.svelte:261`), BreakOffer `bg-teal-600`, marketing. A third teal alongside `#4A7C74` and the `bg-primary` token |
| amber | 318 | 56 | Warnings and "premium/primary group" (`routes/dashboard/+page.svelte:899-902`), marketing (`routes/+page.svelte` 24, `marketing2/+page.svelte` 13), GettingStartedTracker (13), sidebar "Zap" |
| emerald | 237 | 50 | Success, plus primary actions in places, plus admin identity (`routes/admin/+layout.svelte:24,35`) |
| rose | 205 | 53 | Hearts and care on grief pages (`routes/resources/grief-support/+page.svelte` 13), favourites, remove hovers, `ReadinessMatrix` critical, FocusCard |
| red | 182 | 45 | Deletes, error text, SaveButton error, ConfirmModal destructive, `scenario-mode` (11) |
| blue / sky | 103 / 11 | 28 / 3 | Info |
| green | 98 | 18 | Success. Overlaps emerald; 98 + 237 = two greens |
| purple/violet | 48 | 19 | Gradient partners (`routes/onboarding/+page.svelte`, `SupportResources.svelte`, timeline, pulse settings) |
| orange | 29 | 10 | `GettingStartedTracker.svelte` gradient, SyncBadge "offline" (`SyncBadge.svelte:38-39`), dashboard (5), pets, medical |
| yellow | 16 | 7 | |
| gold (`#D4AF37`, `#C5A028`) | 18 / 2 | | The `text-gold` token is used 0 times. Only `ExecutorTaskDetail.svelte` uses `#D4AF37` as text, which is 2.10 on white |

**Neutral families:** slate 2,835 (121 files), gray 431 (34), stone 257 (22), zinc 38 (2). Neutral text and border shades are scattered across these four families.

**Low-contrast secondary text:** `text-slate-400` 472 (94 files), `text-slate-300` 112, `text-gray-400` 64, `text-stone-400` 39. Total on light surfaces: slate-400/gray-400/stone-400 are 2.56, 2.54, 2.52 on white. `text-slate-500` (426 uses) is 4.76 on white but 4.34 on `bg-muted`/`bg-slate-100`.

**Backdrops:** `bg-black/NN` 55 (23 files), `bg-slate-900/NN` 77 (46). The standard is `bg-slate-900/60` (`lib/components/ui/Modal.svelte:54`).

**Other hex families:** the notification components use Chakra-era literals. `NotificationContainer.svelte:140-189` has `#48bb78`, `#4299e1`, `#a0aec0`. `ErrorNotification.svelte:94-95,182` has `#ff4444` and `#3182ce`.

## 2. Misses in area (e), with measurements

**Surface key:** L = light, D = dark.

### Shell, sidebar, header

- `lib/components/layout/Sidebar.svelte` sits on `bg-primary`.
  - Under the default carbon it is slate-900. White/40 text is 3.81. White/50 is 5.23.
  - Under teal it is `#4A7C74`. White is 4.74, white/50 is 2.41, white/60 is 2.80, white/70 is 3.22 and white/80 is 3.69.
  - Lines 289, 312, 317, 323, 385 (`/40`, 2.04 on teal) and 305, 406 (`/60`, 2.80) fail on teal and sit near the limit on carbon.
  - Lines 370, 432, 456 (`/50`) are 2.41 on teal.
  - Lines 280-282 and 391 use `text-amber-400` and `amber-400/60` (1.88 on teal; 4.54 on carbon). Amber on teal also looks alarm-like for a "premium" label.
  - Proposed: set a dedicated sidebar surface of `primary-deep` `#304743`. White is 9.96, `/70` 5.86, `/60` 4.75, `/50` 3.84. Raise every `/40` and `/50` text to at least `/70`. Use `gold-text` instead of amber for the accent.
- `routes/+layout.svelte` (header over the dark pages `#0F1115`):
  - Line 467-468: the breadcrumb label `text-slate-500` is 3.97 (D). Use slate-400 (7.37) or the proposed `muted-dark`.
  - Line 474: the separator `text-slate-600` is 2.49. That is decorative, but it still appears to be text.
  - Line 357: the loading text is `text-slate-400`, 7.37, which is fine.
  - Lines 540-542: both branches of the ternary are `text-slate-400`, a dead branch.
  - The light-header `text-primary` on `bg-primary/10` (lines 569-570) is fine under carbon. Under the planning teal accent, text-primary on the tint is about 4.1 (computed for `#4A7C74` on `#E8F0EE`), so it fails. Use `primary-hover` text on tints.
  - The Focus Mode header (line ~602) uses `text-indigo-400` and `bg-indigo-500` on slate-900. That is a third accent for a status chip. Use `info` or `primary-dark`.
  - Fixed since the seeds: the dashboard greeting, now slate-400 on `#0F1115` (`routes/dashboard/+page.svelte:418`, 7.37), and the "Dashboard" h1 white (line 421). The X140 greeting seed is closed.
- `lib/components/layout/MobileBottomNav.svelte:26,37,60`: `gray-500` is 4.83 and passes, but the nav uses a gray family and `bg-white` with no dark path. Moves to tokens.

### Command Center and Modal

- `lib/components/ui/CommandCenter.svelte`:
  - Line 228: the backdrop is `bg-slate-900/40`, not the standard `/60`.
  - Line 235: radius is `rounded-3xl`; the standard is 2xl.
  - Lines 243, 261, 289, 298, 315: `text-slate-400` on white or `slate-50` is 2.56 / 2.4. The `kbd` hint (line 251) is too.
  - Line 248: the placeholder `slate-300` is 1.48.
  - Line 270: the selected row is `bg-indigo-50 text-indigo-700`. This is the selection-accent mismatch; it should be `primary-soft` / `primary-hover`.
- `lib/components/ui/Modal.svelte:79`: the close X is `text-slate-400` (2.56). Line 74: `text-slate-500` description (4.76) passes. Line 54 is the correct backdrop and the standard to copy.
- `lib/components/ui/ConfirmModal.svelte:57-59`: confirm is `bg-primary` for non-destructive and `bg-red-600` for destructive. That is acceptable under the rule in section 3, but make it the shared `danger` token.

### SaveButton

- `lib/components/ui/SaveButton.svelte:85-100`:
  - The idle state is `bg-slate-900`, which equals the default carbon primary but is hard-coded, so it will not follow an accent.
  - The `saved` state is `bg-green-600 text-white`, 3.30 (fails).
  - The `error` state is `bg-red-600 text-white` (4.83) in alarm red for a failed save. The app's own tone guide wants "Try Again" language, and this is the loudest red in the shared kit. Use a soft `warning` for "didn't save, draft kept".
  - Fix: `saved` = `success` (white on `#1F6F4A` = 6.12). `error` = `warning-soft` surface with `warning` text. Hover and idle states follow `primary`.

### Notifications

- `lib/components/NotificationContainer.svelte:140-203`: success `#48bb78` icon 2.43 on white, close `#a0aec0` 2.26. The scheme is its own Chakra palette: green `#48bb78`, blue `#4299e1`.
- `lib/components/ErrorNotification.svelte:94-95`: the error left border is `#ff4444` alarm red. Line 182 has a primary button of white on `#3182ce` = 4.03 (fails). Line 207 has `#a0aec0` text, 2.26.
- Proposed: single token set from section 3. The error notification is not an alarm: use `warning` (amber-brown) with a `primary` action.

### Form and shared inputs

- `lib/components/ui/FormInput.svelte`:
  - Line 25: the invalid state is `border-red-400/500` with the error text `text-red-500` (line 45), 3.76 on white (fails).
  - Line 34: a required marker `text-rose-500`, 3.67 (fails).
  - Line 47: helper text `text-slate-400`, 2.56 (fails).
  - Use `danger`-soft `#B42318`... but see the rule: for validation use `warning` (see below).
- `lib/components/ui/SmartInput.svelte:*`: `border-indigo-600` focus and amber nudge (a third and fourth accent in one input). Move to `primary` focus ring, `warning` for suggestion.
- `lib/components/ui/CustomFieldsManager.svelte`: 14 indigo uses (`bg-indigo-600` buttons, `border-indigo-500` on 6 elements), `text-slate-400` helper (line 134), `text-red-400` remove hover (line 216). It is the shared "Add field" control on every data page, so one fix lands everywhere. Move to `primary`.
- `lib/components/ui/GhostRow.svelte`: `hover:bg-indigo-500 hover:text-white`, `text-slate-400`. Primary hover.
- `lib/components/ui/BlueprintCard.svelte`: `bg-indigo-500`, `bg-indigo-100`, `text-indigo-600`, emerald for done. Line 78: `text-slate-400` on white (2.56).
- `lib/components/ui/EmptyStateGuide.svelte`: 171, 195, 198: `slate-400` / `slate-300` text (2.56 / 1.48). `lib/components/EmptyState.svelte:79`: `text-slate-400` (2.56). Both are shared by every module.
- `lib/components/ui/SyncBadge.svelte:19-39`: four state colours: emerald, amber, sky, and orange for offline. The component is documented as "non-anxiety-inducing", but orange is still alarm-adjacent for something that is only "waiting for connection". Line 79: `text-slate-400` label. Proposed: success (synced), info (syncing), muted (offline), warning (needs attention).
- `lib/components/ui/MediaGallery.svelte:253-268,364-376`: red and rose hover for favourites and remove. Favourite should be `gold` (heart or star), not red. Remove is `danger` only in the confirm step. `lib/components/ui/UniversalUploader.svelte:188,208,285` and `ui/FileUploader.svelte:152,170,213`: red error text on upload (3.76).

### Admin

- `lib/components/admin/AutomationCard.svelte` and `WebhookConfig.svelte` (`bg-white`, `text-gray-*`, `#4A7C74`) inside the dark admin shell (`routes/admin/+layout.svelte:24`, `bg-slate-950`). U59 is still open. Also `UserActivityLog.svelte` (`bg-white`, `text-gray-400` at lines 25, 32, 42 on white = 2.54).
- `lib/components/admin/ReadinessMatrix.svelte:48-52, 66`: unhealthy modules use `bg-rose-50 border-rose-100` and `text-rose-700` with a `CircleAlert` icon on "critical". That is the D4 seed: an empty area shows as rose "critical". Use `warning`/muted: "Not started yet" is not an alarm.
- `lib/components/admin/ScenarioMode.svelte:42,56,100`: `bg-red-600 ... shadow-[0_0_15px_rgba(220,38,38,0.5)]` glowing red for an active scenario. Admin tool only; use `info` or `warning`.
- `routes/admin/health/+page.svelte:27-31,68`: `bg-red-500/10 ... ShieldAlert text-red-500` for "issues". This is the one allowed alarm-colour spot in the app (an operator health page), keep it, but via `danger-dark` token.
- `routes/admin/+layout.svelte:35,53`: emerald as the admin identity. Uses emerald for brand where the rest of the app uses teal. Move to `primary-dark`.
- `routes/admin/readiness/+page.svelte:43` h1 is now `text-white` on the dark hero (O2 Wave U seed resolved).

### Settings, welcome, onboarding, start, auth, binder, dashboard

- `routes/settings/data/+page.svelte`: `text-slate-400` at 409, 486, 499, 513, 533 (h2, 2.56), 610, 648-678 (table cells and an italic empty state, 2.56). Line 387: rose outline button for "Remove". That is fine only as the destructive step.
- `routes/welcome/+page.svelte:97`: `text-teal-100` on the teal-500 to teal-600 hero gradient = 3.32 (teal-600) and 2.21 (teal-500). Line 156: slate-300 separator. Line 159: indigo link (`text-indigo-600`, 6.29 passes but a different accent). Lines 112-129: `text-green-600` on `bg-green-100` = 3.00 (fails). Use `success` on `success-soft`.
- `routes/start/+page.svelte` and `routes/onboarding/+page.svelte`: dark `#0F1115` pages with `bg-indigo-500` (white = 4.47, borderline) and `to-purple-600` gradient CTAs, `bg-rose-500/5` blur blob. This is a different brand from login/signup, which use teal gradients with `text-slate-950` on teal-500 (8.10, passes). Pick one.
- `routes/login/+page.svelte:261,351` and `signup/+page.svelte:247,298`: slate-950 text on teal-400/500 passes (8.1 to 9.6). Keep the dark-surface rule but express as `primary-dark` (`#7FB5AB`) fill with `#0f172a` text.
- `routes/binder/+page.svelte:78,87,95,107`: `#304743` and hover `#2A3F3B`; white on `#304743` is 9.96 (passes). Stone neutrals (`stone-200`, `stone-500`) instead of slate. Fine contrast, wrong tokens.
- `routes/dashboard/+page.svelte`: `text-indigo-300` for the 4 stat icons and hover titles (lines 441-519, 721, 835, 1007) and `text-indigo-400` (line 716). Contrast is fine (9.48 and 6.33 on `#0F1115`). U37 asked to confirm: it is not in the palette. Use `primary-dark` `#7FB5AB` (8.19). Emerald `/70` and `/80` text (lines 424, 586, 728, 842): 5.3 at `/70`, passes. Line 565, 932: `text-slate-500` is 3.97 (fails). Amber group header (899-902) is the "primary group" highlight: use `gold-dark`. The dashboard does not use `text-primary` at all, because on the `#0F1115` surface carbon primary is 1.06.
- `lib/components/BreakOffer.svelte:130`: backdrop `bg-black/40`. Teal-600 buttons with white text = 3.74 (fails). Teal-600 text on white = 3.74.
- `lib/components/layout/ConciergePanel.svelte:270`: backdrop `bg-black/10` (the standard is `bg-slate-900/60`). `ConciergePanel.svelte:556`: `bg-rose-500 text-white animate-pulse` for a recording or listening state, a pulsing alarm. Use `primary`.
- `lib/components/GriefResourceCard.svelte:67,71,95,109,143`: `hover:shadow-{color}-500/10`, `bg-{color}-500/10 text-{color}-400`, built dynamically (Tailwind never generates them, so the badges and hover are unstyled). U41 still open.
- `lib/components/GriefSupportBanner.svelte:42-58`: now token-based (`text-foreground`, `bg-card`), so the "We're sitting with you" and "Visit the Sanctuary" seed is resolved for both themes, as long as the tokens are tuned (see section 3).
- `lib/components/GettingStartedTracker.svelte`: amber to orange gradient and `bg-amber-100 text-amber-600` (2.86, fails) for "progress". Progress on a planning checklist is not a warning; use primary.
- `lib/components/executor/SupportResources.svelte` and `ExecutorWelcome.svelte`: rose and purple on the grief support box. `ExecutorTaskDetail.svelte`: `text-[#D4AF37]` 2.10 on white, `bg-red-50 border-red-100 text-red-900` for a "critical" task.
- `lib/components/dashboard/FocusCard.svelte:24`: `bg-rose-500/20 text-rose-300` plus glow for an urgent focus card. `ThePulse.svelte:33`: `bg-rose-500` for a status dot.
- `routes/+page.svelte` and `routes/marketing2/*`: all dark with teal-400, indigo-400, amber-500, rose-400 on `#0F1115`. Contrast passes in the cases I computed (amber-400 11.3, rose-400 7.0, indigo-400 6.3, teal-400 10.2). `text-white/40` is 3.82 (fails) and `text-white/20` is 1.85; `marketing2/+page.svelte` uses `/40` 11 times, `/50` 11 times (5.33, passes) and `/20` 3 times. The three-colour progress bar (`from-amber-500 via-teal-500 to-rose-500`) appears in `marketing2/+page.svelte:362`, `how/+page.svelte:181` and `features/+page.svelte:216`: three accents in one bar.

Not covered in depth in this pass: `routes/tools/ai-audit` (`text-gray-400` uppercase labels, lines 206 and 228, 2.54), `routes/help`, `routes/executor/+page.svelte:158`, `routes/catalog/+page.svelte` (token-based, fine). Treat `routes/export` as nonexistent: there is no such route in the tree (only `routes/binder`).

## 3. Proposed palette (token set)

Principle: keep the brand teal because it already passes (`#4A7C74` is 4.74 on white and 4.53 on `#f8fafc`). Make every colour a token (CSS variable in `@theme`, theme-dark override). Remove indigo, purple, orange, rose, stone, gray and zinc as accents.

| Token | Light | Dark | Contrast |
|---|---|---|---|
| `primary` | `#4A7C74` | `#7FB5AB` | L 4.74 white; D 7.74 on `#0f172a`, 6.34 on card |
| `primary-foreground` | `#ffffff` | `#0f172a` | L 4.74; D 7.74 |
| `primary-hover` / text on tints | `#3B635D` | `#9CC9C0` | L 6.71 white, 5.79 on `#E8F0EE` |
| `primary-deep` (sidebar, dark hero) | `#304743` | `#304743` | white 9.96 |
| `primary-soft` (tint) | `#E8F0EE` | `rgba(127,181,171,.14)` | text on it must be `primary-hover` or darker (primary itself is 4.10, fails) |
| `info` | `#2F5D8A` | `#8DB8E8` | L 6.88 white; D 7.07 on card |
| `success` | `#1F6F4A` | `#7BD1A1` | L 6.12 white; D 7.99 on card |
| `warning` (gentle "needs a look") | `#8A5A00` on `#FFF4DC` | `#F0C36A` | L 5.93 / 5.43 on soft; D 8.86 on card |
| `danger` (destructive confirm only) | `#B42318` on `#FDECEA` | `#F2A6A0` | L 6.57 white, 5.75 on soft; D 7.48 on card |
| `gold` (fill) / `gold-text` | fill `#D4AF37` with `#0f172a` text (8.49); text `#8A6D0B` | `#E0C15A` | L text 4.91 white, 4.70 on `#f8fafc`; D 8.32 on card |
| `foreground` | `#1e293b` | `#f8fafc` | existing |
| `muted-foreground` | `#5B6B80` | `#A3B1C6` | L 5.44 white, 5.20 on `#f8fafc`, 4.97 on `#f1f5f9`; D 8.21 on `#0f172a` |
| `background`, `card`, `border` | `#f8fafc`, `#ffffff`, `#e2e8f0` | `#0f172a`, `#1e293b`, `#334155` | existing |
| Neutral family | slate only | slate only | one family |

Notes on the choices:
- The existing `--color-muted-foreground:#64748b` is 4.34 on `--color-muted:#f1f5f9`, which fails. `#5B6B80` replaces it.
- The existing `--color-accent:#90CDF4` is 1.72 on white. Never use as text. Use as a fill only, or drop in favour of `info`.
- High contrast stays as is.
- **Accent picker:** if the six user accents (teal, indigo, emerald, rose, amber, carbon) stay, each needs its own `primary-foreground` and a darker value that passes white. Safe light values: indigo `#4F46E5` (6.29), emerald `#047857` (5.48), rose `#E11D48` (4.70), amber `#B45309` (5.02), carbon `#0f172a`. Dark equivalents need to be lighter (use the `-300` family) with `#0f172a` foreground.
- **Default:** carbon is the current default, so what the owner sees today as "primary" is near-black. This is the decision for the owner (see section 5).

**Rule for red/orange (and rose):**
- `danger` red: only on a destructive confirm button (Remove permanently), the "Remove" step in a confirm modal, and the operator health page `routes/admin/health`. Never for favourites, hearts, empty states, "critical", percent drops, upload errors or failed saves.
- Orange: retire it. Offline, "behind", and "not started" use `muted` or `info`.
- `warning` (amber-brown): "needs your attention" and "didn't save, your draft is kept". Never a gradient or glow, never on a progress/completion area.
- Rose: not a status colour. Optionally one `care` accent for heart icons on grief pages only (suggest `#E11D48` dark `#FDA4AF` if the owner wants warmth). Otherwise use `primary`.
- Validation: show invalid fields with `warning` text, not red, consistent with the tone guide.

## 4. Proposed fix cards, in order

**Phase 1: tokens first (nothing else is safe until these land)**

- **V1-T1 Tokens.** In `app.css` `@theme`, add the table above (including `-hover`, `-deep`, `-soft`, `info`, `success`, `warning`, `danger`, `gold-text`). Replace `muted-foreground`. Add a `body.theme-dark` block that sets primary, hover, soft, the four status colours, muted, and resets `background-image` to none. Add a `--color-primary-foreground` override per `theme-color-*`. Add `@custom-variant dark (&:where(body.theme-dark, body.theme-dark *));` so the 33 existing `dark:` variants follow the toggle. Move the tone rules after the theme-color rules, or drop them, so they stop being dead.
- **V1-T2 Default and picker (owner decision, see section 5).** Decide whether `color:'carbon'` stays the default. Whichever: the picker values must pass 4.5 with the paired foreground.
- **V1-T3 Notification palette.** Rewrite `NotificationContainer.svelte:140-203` and `ErrorNotification.svelte:94-207` on the tokens (drop `#48bb78`, `#ff4444`, `#3182ce`).

**Phase 2: shared components (each fix lands on every page)**

- **V1-C1 Buttons and SaveButton.** `SaveButton.svelte:85-100`, `ConfirmModal.svelte:51-59`: tokens, `saved` on `success`, `error` on `warning`, no red for failed saves. Destructive button uses `danger`.
- **V1-C2 Modal and backdrops.** `Modal.svelte:79` close X to 4.5+ (`muted-foreground`); `CommandCenter.svelte:228,235,248,251,261,270,289,298,315`; `BreakOffer.svelte:130` and `ConciergePanel.svelte:270` to `bg-slate-900/60`; BreakOffer buttons off `teal-600`.
- **V1-C3 Form kit.** `FormInput.svelte:25,34,45,47`, `SmartInput.svelte`, `CustomFieldsManager.svelte` (14 indigo uses), `GhostRow.svelte`, `BlueprintCard.svelte`, `EmptyState.svelte:79`, `EmptyStateGuide.svelte:171-198`: indigo to `primary`, slate-400/300 text to `muted-foreground`, required marker to `foreground`/`primary-hover`.
- **V1-C4 Status components.** `SyncBadge.svelte:19-39` (drop orange and sky), `ReadinessMatrix.svelte:48-66` (no rose for an empty area), `FocusCard.svelte:24`, `ThePulse.svelte:33`, `GettingStartedTracker.svelte` (amber/orange gradient to primary), `ConciergePanel.svelte:556` (rose pulse to primary), `MediaGallery.svelte:253-376` (favourite to gold, remove red only in confirm), `UniversalUploader`/`FileUploader` error text.
- **V1-C5 Shell.** `Sidebar.svelte` sidebar surface `primary-deep`, raise every `/40`, `/50`, `/60` text to at least `/70`, amber to `gold-text`. `routes/+layout.svelte:467-475,540-542,602` header muted text and Focus header indigo. `MobileBottomNav.svelte` gray to tokens.
- **V1-C6 Dynamic classes.** `GriefResourceCard.svelte:67-143` (`{color}` interpolation) to a fixed map; also the V0 seeds `ConciergeSettings` `border-${scope.color}` and `RoleSwitcher` `bg-{role.color}-100`.
- **V1-C7 Admin shell.** `AutomationCard.svelte`, `WebhookConfig.svelte`, `UserActivityLog.svelte` to dark card tokens inside `routes/admin/+layout.svelte`; emerald identity to `primary-dark`; `ScenarioMode.svelte:42,56,100` off glowing red.

**Phase 3: pages (mechanical codemod, then per-page review)**

- **V1-P1 Codemod.** Replace `bg-/text-/border-[#4A7C74]` with `bg-/text-/border-primary`, `[#304743]` with `primary-deep`, `[#3b635d]`/`[#2A3F3B]` with `primary-hover`. 342 + 162 + 18 + 8 uses in ~45 files. Then replace `bg-white` with `bg-card`, `text-slate-700/800/900` with `text-foreground`, `border-slate-100/200` with `border-border`, `text-slate-400/300/500` on light with `text-muted-foreground` (about 1,000 uses; do it per area). Stone, gray and zinc to slate in the same pass. Review the diff before deploying.
- **V1-P2 Dashboard.** `routes/dashboard/+page.svelte`: indigo-300/400 icons to `primary-dark`, `text-slate-500` (lines 565, 932) to muted, amber group header to `gold-dark`.
- **V1-P3 Onboarding, start, welcome, login, signup.** Pick one brand: teal for all; remove indigo to purple gradients (`onboarding`, `start`), `welcome/+page.svelte:97,112-129,159`.
- **V1-P4 Settings, binder, tools, resources, help, executor.** `routes/settings/data/+page.svelte` (lines above), `routes/binder/+page.svelte` (stone to slate, tokens), `routes/tools/ai-audit/+page.svelte:206,228`, `routes/resources/grief-support/+page.svelte` (indigo/rose mix to `primary` plus optional `care`), `routes/executor/+page.svelte:158`, `SupportResources.svelte`, `ExecutorWelcome.svelte`, `ExecutorTaskDetail.svelte` (gold text and red-50 "critical").
- **V1-P5 Marketing.** `routes/+page.svelte`, `marketing2/*`, `MarketingLayout.svelte`: raise `text-white/40` and `/20` text to `/60` or `/70`; one accent (teal-400, `primary-dark`) plus gold; replace the amber/teal/rose progress bar.
- **V1-P6 Modules (other reviewers' areas, V0a-d).** Apply the same codemod after Phase 2.

## 5. Decisions for the owner (each with recommendation)

1. **Default accent: carbon or teal?** Recommendation: teal `#4A7C74` (with `-hover #3B635D`) as the default. Reason: 342 hard-coded teal uses plus the brand logo already read as teal, and the carbon default (near-black) makes `text-primary` invisible on the dark pages (1.06 on `#0F1115`). Next step once agreed: set the default in `accessibilityStore.ts:16-17` and have `resetDefaults` return to teal.
2. **Keep the six-accent picker?** Recommendation: keep teal and carbon, drop indigo, emerald, rose, amber unless each is given a passing foreground (table in section 3). Reason: every accent today fails white text (2.15 to 4.47) and cascades into 1,000+ `bg-primary` buttons.
3. **Rose as a `care` accent?** Recommendation: drop it and use `primary` for hearts. Reason: rose is currently used as favourite, remove-hover, critical, urgent and heart, so it carries five meanings.

## 6. Corrections to V0a's claims

- Confirmed: `#4A7C74` hard-coding (site-wide 342, not 117), `#304743` (162) and `#3b635d` (18), indigo as second accent (432), emerald for primary actions, red/rose for favourites and remove, stone/slate/gray mix (257/2,835/431, plus zinc 38), `text-slate-400` (472).
- Corrected: "zero `dark:` variants" is wrong; there are 33 in 4 files. They do not respond to `body.theme-dark`, because no custom variant maps `dark` to it.
- Added: carbon is the actual default primary, tone overrides are dead, and `theme-dark` does not retune primary or the body background
