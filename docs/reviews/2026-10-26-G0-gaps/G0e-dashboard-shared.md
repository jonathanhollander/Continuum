# G0e-dashboard-shared

**Last Updated:** 2026-10-26 09:00 EST

Reviewer report, saved verbatim (read-only review on main).

## G0e report: dashboard, navigation, settings, onboarding, marketing, tools, admin

**Method.** I read the code for every route in area (e). I grepped `docs/RECOVERY_EXECUTION_PLAN.md` and left out anything a card already covers, including the long T0 seed list. I also ran the app on port 35740 with a throwaway SQLite DB (`$S/g0e/g0e.db`, `dist` built 08:13 today from main) and visited 36 routes as the owner, then probed four flows. Main is unchanged: nothing committed, `git status` clean, server stopped, port free. Screenshots and probe scripts are in `/private/tmp/claude-501/-Users-jonathanhollander-AI-Code-Continuum/798584f5-5f46-497f-a2f2-975a6b8ca86a/scratchpad/g0e/` and `/private/tmp/claude-501/-Users-jonathanhollander-AI-Code-Continuum/798584f5-5f46-497f-a2f2-975a6b8ca86a/scratchpad/pw/g0e1.mjs` through `g0e5.mjs`.

### Confirmed live (most important)
1. **The profile fields in Settings crash on the first keystroke and never save.** Typing in "Owner name" throws `A.set is not a function`, sends no write, and the value is gone after a reload (server profile still `{}`). The cause: `ConciergeSettings.svelte:223,236,255,269,283` use `bind:value={$estateProfile.x}`, but `estateProfile` (`estateStore.svelte.ts:48-56`) has no `set`. On top of that, `saveProfile` (`:95-116`) only sparkles and says "Artificial delay". This is the only screen where the owner and executor names are entered.
2. **A new visitor cannot get an account from the marketing flow.** Landing (`/`) and `/marketing2` both send the email to `/start?email=…`. `/start` ignores the email and shows "Privacy Secured / Your session is now active". The first chat message returns `401 POST /api/ai/chat` and drops the visitor on `/login`, not `/signup`.
3. **The executor dashboard's Medical Wishes card has no colour.** Its icon tile is transparent and the icon is the default colour, because classes are built at runtime (`bg-{color}-500/10`). Tailwind never generates the cyan ones, and no ExecutorHub/`/executor` colour is safelisted at all, so those classes only work where another file happens to use the same class. The hover borders and the progress tracker's `from-slate-500` and `bg-*-400/30` classes are absent from the built CSS too.

### Proposed cards

**Bugs (X)**
- **X-a (Settings, owner/executor):** make the five profile fields write through `estateProfile.update({...})` (or give it a `set`), make "Save Profile" a real save with the store's result, and remove the artificial delay. Files: `ConciergeSettings.svelte:95-116,223-283`.
- **X-b (new visitor, `/start` and the marketing CTAs):** send a visitor who is not signed in to `/signup?email=…` before the AI journey or "Skip to Dashboard". `/start` should read `email`, and signup should pre-fill it. Files: `start/+page.svelte:44-53,194-197`, `+page.svelte:1315`, `marketing2/+page.svelte:1005`, `signup/+page.svelte:18`.
- **X-c (owner, sidebar):** the "Building Your Foundation" tracker never completes its document or Pulse step. It reads localStorage keys `continuum_documents` and `continuum_pulse_setup` that nothing in the app writes (`GettingStartedTracker.svelte:26,30`). Read `documentStore.items` and the Pulse settings or contacts store instead.
- **X-d (owner, Command Center):** the "Dashboard" result goes to `/`, the marketing page (`CommandCenter.svelte:51`); it should be `/dashboard`. The fixed list also lacks heirlooms, journal, visual memories, time capsule, subscriptions, home manual, Pulse, family hub and settings, and does not filter by role. Build it from `navGroups` and `catalogCategories`, like the catalog does (X127).
- **X-e (owner, QR Access Codes):** printed codes lead nowhere.
  - The pack QR encodes `/access?key=pack-…` (`qrStore.ts:78`), and there is no `/access` route.
  - The heirloom-label check compares to `'heirlooms'` while the type is `'Heirloom'` (`:91`), so every label points at `/modules/property`. Neither page reads `?id=`.
  - Fix: point packs at a real page, or leave packs out; fix the heirloom compare.
- **X-f (owner, Practice Run):**
  - It reads `getStored("assets_assets-main")` (`simulator/+page.svelte:30`), which nothing writes, so "Card List" always fails and Beneficiaries always shows 0%.
  - Any "Other" document passes both the POA and health checks (`:92,97`).
  - Medical directives from the Medical page are ignored.
  - Fix: read `financialAssetsStore`, `documentStore` and `medicalStore`.
- **X-g (executor, ExecutorWelcome):** the name of the person who died, and the "grieving" context, are kept in memory only (`contextStore.setDeceasedName` and `setEmotionalContext`). They are lost on reload, while the welcome is marked seen in localStorage, so it never asks again. The copy also says "stored locally and privately" (`ExecutorWelcome.svelte:194`). Persist both to the account, e.g. a profile slice.
- **X-h (executor, ExecutorHub and `/executor`):**
  - "Important Documents" and "Property & Assets" have no `auditId` (`ExecutorHub.svelte:17-51`), so they never show progress.
  - The tracker's milestone labels ("Contact Network" at 50%, "Asset Inventory" at 75%) don't match what is measured: 3 areas at 0, 33, 67 or 100% (`ExecutorProgressTracker.svelte:70-106`).
  - "Estate Settlement Progress" measures what the owner recorded, not the executor's D3 steps.
  - Fix: drive progress from the persisted executor-toolkit steps, or rename it.
- **X-i (executor, navigation):** there are five overlapping executor homes: the dashboard ExecutorHub, `/executor` (nothing links to it, and its task lists are static text), `/modules/executor-hub`, `/modules/executor-toolkit` and `/modules/executor-guide`. This is an owner intent question; my recommendation is to keep the dashboard hub plus the toolkit and retire `/executor`.
- **X-j (owner, Profile switcher):** "Add Family Member" creates a device-only profile and labels the sidebar "Planning For {name}" (`ProfileSwitcher.svelte:42-62,111,237`). It only changes the local cache namespace (`sync.svelte.ts:217`); the records are the same server account. Remove it, or make it real.
- **X-k (admin):** `/admin/*` has no admin check (`settings/data` uses `$auth.user?.id === 1`) and no entry point anywhere. Health has a red "Risk Level" box even at Low, "Timestamp data mock not yet active", and a non-empty zombie list renders nothing ("Future implementation for version 4.1", `admin/health/+page.svelte:99,103`). UI Quality ticks are a hard-coded list that is never saved. Fix: guard with the existing admin rule, add a link from Settings › Data for admins, and leave the scaffolding cards out.
- **X-l (cleanup):** these routes are unlinked, mock or developer-only:
  - `/estate/[id]` ("The Anderson Legacy" mock, `estate/[id]/+page.svelte:9-44`), only reachable from the unused `EstateCard`.
  - `/debug-textarea`, `/test-registry` and `/concierge-window` (nothing opens it).
  - `/welcome` (unlinked; greets "Welcome, Dev" from the email prefix, `:77`; `?welcome=true` is never read).
  - The dead `behaviour: "background-tab"` "Treasure Hunt Opened" branches in `Sidebar.svelte:184-192` and `dashboard/+page.svelte:330-343`.
  - Fix: move them to `_archive`. `/welcome` is the owner's call.
- **X-m (onboarding):** `completeOnboarding` (`onboarding/+page.svelte:~91`) ignores a failed PATCH and marks it complete locally only. Use `apiFetch`, and on failure show the gentle error and stay on the page.
- **X-n (performance, sidebar):** the sidebar re-fetches `/api/recipient/links` with raw `fetch` on every navigation (`Sidebar.svelte:76`). Fetch once per sign-in and after a recipient change.

**Polish (U)**
- **U-a:** the mobile bottom nav ignores role; Family taps "Documents" and bounces to the dashboard (`MobileBottomNav.svelte:9`). It also says "Pulse" where the sidebar says "Wellness Check-in". Filter by `allowedRoles` and use the nav labels.
- **U-b:** on the dashboard for Family, the Policies and Open accounts tiles link to pages the guard redirects away from (`dashboard/+page.svelte` tiles). Hide them for roles the page excludes.
- **U-c:** onboarding has no way to edit the name after Continue (the input is disabled). Add a "change" link.
- **U-d:** Treasure Hunt has no onward step to record a found asset. Add a link to Financial Accounts.
- **U-e:** Builder Tools tasks name pages that don't exist ("Living Will – Sample Document", "Trust – Sample Outline", "remove helpers when finished", `acceptanceStore.svelte.ts:18-34`) and have no links. Link each task to its page and drop the Notion-era rows.
- **U-f:** `/help` has no entry point in the nav or settings. Add it to Extras.

**Wording (T0)** — none of these appear in the T0 seeds.
- Marketing claims the app doesn't back up (the owner's call):
  - "End-to-end encryption / encrypted before it leaves your device", "we can't read it" (`marketing2Dictionary.ts:58-60`): the server stores plaintext, and nothing in backend or frontend source encrypts.
  - "We make money from subscriptions" (`:62`): there is no billing.
  - "QR code access for guardians" (`:133`): see X-e.
  - "Visual Archivist… Our AI identifies it" (`marketingDictionary.ts:22`): there is no image AI.
  - "Sequence Sent to {email}" and "initialization sequence" (`:32,35`): nothing is sent.
- `/start`: "Privacy Secured / Your session is now active", "System Booting", "Bypass the guide… returning experts".
- Executor help:
  - The "Grief Support Hotline… 24/7 trained counselors" link to griefhelpline.org (`SupportResources.svelte:14-19`) is unverified; check it or use 988 only.
  - The help directory says "vetted… verified for quality" (`help/+page.svelte:107`) over `mockProfessionals`, which are invented people with 555 numbers. Leave the directory out.
- Dashboard (`dashboard/+page.svelte`):
  - "Nothing found for…" (`:674`).
  - "No modules with this status" (`:764`).
  - The filter heading shows the raw key, e.g. "safe" or "local" (`:757`).
- Treasure Hunt tooltip "Interactive guide to finding important items" (`navigation.ts:365`) is untrue; it is an information page plus an external link.
- Login's "We've sent a secure sign-in link to X" also shows for unregistered emails; add a gentle "if this email has an account" and the signup link.

**Colour (V0)**
- **V-a:** replace the runtime-built Tailwind classes in `ExecutorHub.svelte:124,140,153,156`, `ExecutorProgressTracker.svelte:49,57,64` and `routes/executor/+page.svelte` (lines ~213-293: icon tiles, bars, %, buttons, resource cards) with a static class map. Medical/cyan currently has no tile or icon colour; the hover borders and pulse bars are missing.

### Routes with nothing new beyond existing cards
Catalog (X127), Settings › Data (X48/X170/X178/U43), binder and export preview (U34/X110), grief support (U41/X167/X184), AI audit (X157/X166/X177), Insights and Future Scenarios (X112/X119/X146/U6/X73), preparation and executor hubs (X207/X208), auth/verify (X193), signup's passkey path (X158/X186). The `/export/preview` page error I saw came from my test's init script running in the PDF blob frame; it is not an app bug
