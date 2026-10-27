# Shell, account entry and contacts — plan cross-check

**Last Updated:** 2026-10-26 15:25 EDT

**Source reviewed:** `8751f224b2a1bf0d915940f61242829d08964d18` (`main`). Application source was unchanged during this review. This report is evidence for the canonical execution plan, not another task board. Local F identifiers are report references; the orchestrator assigns canonical cards.

## Result

Five actionable findings: three P1 journey/data-loss defects and two P2 recovery/account-preference defects. All five follow reachable source paths. Four received pinpoint extracted-function runtime confirmation; the passkey retry finding is source-confirmed. No browser, production account, real database or email delivery was exercised.

## Coverage

| Surface | Source/data paths examined | Result |
|---|---|---|
| `/`, `/marketing2` signup pickup | Both reachable email-submit handlers, their CTA links, `keyringStore`, `/start` routing, magic-link server no-user branch | F1; broader marketing content belongs to TOOLS |
| Root layout and navigation | `+layout.svelte`, `+layout.ts`, navigation config, Sidebar, CommandCenter, catalog role filtering, direct-route/public-route handling, auth-init/global-sync trigger | Shared auth-generation issue referred to CONTRACTS; owner role/access scope preserved |
| `/dashboard` | Navigation/card search, record counts/status mappings, first-load conditions, onboarding redirect, greeting; `syncStatusStore`, `GettingStartedTracker` | ExecutorHub/readiness details owned by HANDOVER; no additional confirmed defect in the paths inspected |
| `/catalog` | Role-filtered groups, search, preview markers and destinations | No new confirmed source defect |
| `/help` | Page tabs, FAQSection, GettingStartedWizard step actions/module destinations | Source coverage; no new visual/keyboard runtime claim |
| `/login`, `/signup`, `/auth/verify` | Passkey start/finish and retry, email-link choice, token storage/init, same-site redirect, backend auth signup/passkey/magic-link/me routes | F1/F4; refresh/init generation findings owned by CONTRACTS |
| `/start`, `/onboarding`, `/welcome` | Guided/expert routing, name draft/save, server onboarding PATCH/GET, local onboarding preferences and post-auth destinations | F1; `/welcome` product decision remains HOLD |
| `/settings` | ConciergeSettings profile draft/save, perspective, language, accessibility/theme/colour actions, export navigation; estate/profile/context/preferences stores | Shared persistence paths referred to CONTRACTS; profile-independent estates remain deferred |
| `/settings/data` | Owner-store import list, dynamic registry, sync, meaningful singleton counting, module membership/detail rows, admin generate/purge/audit paths | Source inspected; test-data purge finding referred to TOOLS; Pulse-disabled count rule is a product/counting clarification, not asserted broken here |
| `/modules/contacts` | Add/edit/status/remove, call-tier mapping, custom fields, executor/start-page markers; ContactRow, familyStore, contacts API, recipient panel | F2/F3 |
| Support functional API | `backend/routers/support.py`, support discovery consumer in grief-support page | Fake missing-key discovery results referred to TOOLS; no duplicate finding |

Route load files inspected: root `+layout.ts`; dashboard, help, onboarding, welcome and settings/data `+page.ts`; settings `+page.ts`. Shared source inspected through CodeGraph and narrowly targeted reads: `navigation.ts`, `Sidebar.svelte`, `CommandCenter.svelte`, `RoleSwitcher.svelte`, `ProfileSwitcher.svelte`, `ConciergeSettings.svelte`, `GettingStartedTracker.svelte`, `FAQSection.svelte`, `GettingStartedWizard.svelte`, `ContactRow.svelte`, `RecipientLinkPanel.svelte`, `auth.ts`, `keyringStore.ts`, `preferenceStore.ts`, `profileContext.ts`, `userPreferencesStore.svelte.ts`, `accessibilityStore.ts`, `contextStore.svelte.ts`, `conciergeStore.svelte.ts`, `familyStore.svelte.ts`, `persistence.ts`, the relevant SyncManager delete/account/persistence paths, `syncStatusStore.svelte.ts`, `testDataFactory.ts`, and backend auth/contacts/support controller paths. The primary reviewer owns shared mapper completeness and backend schema coverage. This is functional/source coverage, not a line-by-line visual or translation certification.

## F1 — P1: marketing pickup turns every new email into a returning account

**Classification:** source-confirmed; extracted-function runtime-confirmed. **Plan:** G16 and X215 (both checked complete), E1 usable entry journey.

**Evidence:** `frontend/src/routes/+page.svelte:387–405` and `frontend/src/routes/marketing2/+page.svelte:290–301` call `registerAccount(email)` for a new email, then their success-state links lead to `/start?email=…` (root `:1309`, marketing2 `:1000`). `frontend/src/lib/stores/keyringStore.ts:41–48` adds that email to `keyringEmails` and sets `activeAccountId` immediately. `/start`'s `sendToSignInIfNeeded` (`frontend/src/routes/start/+page.svelte:62–67`) decides returning/new from that same keyring, so the just-entered new email is routed to `/login`, rather than `/signup`.

`backend/routers/auth.py:578–582` returns the normal sent response for an email without a User; it creates neither account nor magic link. Thus the marketing path can lead a first-time visitor to passkey sign-in for a nonexistent account, or a magic-link “sent” state from which no link can arrive. Manually choosing Create account can recover, but the advertised primary journey is disconnected. Entering another email while already signed in also changes the browser persistence namespace while leaving the JWT unchanged (`persistence.ts:10–14,31–38`), outside an authenticated account transition.

The X215 completion note says pickup no longer registers an account before sign-in; that is true of the layout pickup but remains false for these reachable marketing handlers.

**Pinpoint proof:** ran the actual extracted marketing2 submit handler, actual `registerAccount` function and actual `/start` routing function in Node/esbuild with synthetic store/location adapters. The unrelated dynamic persistence import was substituted with a no-op adapter to avoid loading the application. Output:

```text
CONFIRMED new marketing email becomes active before sign-in, then /start treats it as returning and routes to /login?redirect=%2Fstart%3Fpath%3Dexpert&email=fresh-review%40example.com
```

**Smallest correction:** carry email/name as handoff drafts; register/switch the active account only after authentication. Determine returning state from previously authenticated keyring membership before pickup changes it.

**Acceptance:** from a clean synthetic browser, complete each actual marketing form → guided/expert choice → new email opens signup with the email; previously authenticated email opens sign-in; the active account remains unchanged until sign-in completes. Verify entered name survives its intended handoff or avoid promising it is already saved.

## F2 — P1: recipient-note save responses overwrite newer writing

**Classification:** source-confirmed; extracted-function runtime-confirmed. **Plan:** D2/U8, save-state/draft-retention invariant.

**Evidence:** `frontend/src/lib/components/recipient/RecipientLinkPanel.svelte:41–51` awaits a mutation and then unconditionally assigns `note = link.note`. The textarea at `:96–106` stays editable while `busy` is set. Its blur handler starts an automatic save at `:99–101`. A person can blur note A, refocus and type note B while the first request is in flight; the response for A replaces the editor with A, losing B. The same `run` helper is used for flag/link mutations and does not guard the contact identity on return, unlike its initial load guard at `:33–34`.

**Pinpoint proof:** executed the unchanged extracted `run` function with a delayed synthetic save, changed the editor draft before resolving the response, then observed the returned old value overwrite the newer draft:

```text
CONFIRMED recipient note response overwrites newer editable draft: note B -> note A
```

**Smallest correction:** capture the sent draft and contact identity; apply response metadata only for the same contact, and replace editor text only if it still equals the submitted draft. Queue or retain edits made during the save and keep an accurate unsaved state.

**Acceptance:** delay a blur-save, continue writing, resolve the first save; newer words remain visible and unsaved until persisted. Repeat during link/flag mutations and while switching contacts; save failure keeps the latest draft.

## F3 — P1: a failed contact removal can still permanently delete family relationships

**Classification:** source-confirmed; extracted-function ordering confirmed. **Plan:** G14 and shared B4/B4.1 failed-write semantics; family/contact journey.

**Evidence:** `frontend/src/lib/stores/familyStore.svelte.ts:112–116` starts `contactSync.delete(id)` and immediately starts `relationshipSync.delete` for every connected relationship. It awaits neither and does not use SyncManager's `onRemoved` callback. `SyncManager.delete` (`frontend/src/lib/services/sync.svelte.ts:635–658`) rolls back the contact on a failed request, shows retry, and returns normally. Meanwhile the independent relationship deletes may have succeeded. Server contact/relationship deletes each commit separately (`backend/routers/contacts.py:119–139,166–183`).

**Trigger/impact:** remove a connected contact while that contact's DELETE returns 500 but relationship DELETEs succeed. The contact comes back with its relationships gone; retry cannot restore them. This is relationship data loss on a reported failed removal, not just an unhandled-promise problem.

**Pinpoint proof:** executed the unchanged extracted `removeMember` function with a pending contact-delete adapter and one synthetic relationship. Output:

```text
CONFIRMED relationship DELETE starts before contact DELETE result; contact failure cannot roll it back
```

**Smallest correction:** delete the contact and its related relationships in one backend transaction, or at minimum defer relationship cleanup to the successful `onRemoved` follow-up and preserve failed cleanup for retry. Backend atomicity also avoids partial success in the reverse direction.

**Acceptance:** contact DELETE failure preserves both contact and relationships after reload; relationship-delete failure cannot leave an accepted half-removed contact; success removes the intended contact/relationships only.

## F4 — P2: passkey “Try again” cannot recover a consumed/expired registration challenge

**Classification:** source-confirmed; no authenticator/browser runtime proof. **Plan:** X158/X171 recovery controls, X302 challenge persistence. The original spinner/fallback fixes remain valid; this is a remaining retry-path gap.

**Evidence:** `frontend/src/routes/signup/+page.svelte:45–49` retries with `lastOptions` and the same `userId`. Backend register/start first commits a User (`backend/routers/auth.py:287–306`), then stores its challenge for 300 seconds (`:311–315`). Finish consumes the challenge before verification (`:334–342`). After expiry, a refused verification, or a finish response lost after the pop, the retry presents the old challenge again. Reloading starts from the email step, but register/start rejects that now-reserved email (`:287–293`), so it cannot issue fresh options through this route.

**Impact/limit:** the email-link fallback remains available, so this is not total account lockout. The offered passkey retry cannot fulfill its action in these states, and a reserved account may have no enrolled passkey.

**Smallest correction:** provide a recoverable, appropriately verified continuation that issues fresh registration options for the same pending account, or make this state explicitly continue through email sign-in and enroll a fresh passkey there. Do not bypass authentication for existing complete accounts.

**Acceptance:** expire or consume a synthetic pending challenge, choose Try again, and complete registration with newly issued options; no duplicate account. Reloaded incomplete registration has a usable recovery path.

## F5 — P2: view-preference loading can apply account A's settings after switching to B

**Classification:** source-confirmed; extracted-function runtime-confirmed. **Plan:** G19/X230 account-specific saved Cards/Table choices. Related to, but separate from, CONTRACTS' authenticated-request replay defect.

**Evidence:** `frontend/src/lib/stores/userPreferencesStore.svelte.ts:53–74` returns immediately while any `isLoading` is true, then applies an earlier response without checking the captured token/account. Root layout calls `init` once for B's token (`frontend/src/routes/+layout.svelte:197–204`). If A's preference GET is pending, B's call is skipped, and A's late result sets the visible preferences. There is no queued B reload. Changing a view then sends the entire in-memory preference map using the current token (`userPreferencesStore.svelte.ts:87–98`), allowing stale A choices to be saved to B's otherwise unrelated preference keys.

**Pinpoint proof:** ran the unchanged extracted `init` with a deferred A response and a B transition; only one GET occurred, and A's preferences were installed under B:

```text
CONFIRMED preferences: A load in flight suppresses B load and late A result applies under B; {"preferences":{"letters":"table"},"loadedForToken":"A","reads":1}
```

**Smallest correction:** key in-flight loads by authenticated account/generation, discard stale replies and schedule the new account's load. Patch only the changed module preference rather than retransmitting unrelated stale keys.

**Acceptance:** delay A's GET, sign in as B with a different saved mode, settle A; B's own preference is fetched/shown, and changing B's view leaves its other stored module choices intact.

## Cross-area referrals and intentional limits

- CONTRACTS owns authenticated replay/refresh/init generation defects; this report does not count those again.
- TOOLS owns the missing-Tavily-key fake local-support results (`backend/routers/support.py:31–51`) and has received the synthetic-data purge issue: `testDataFactory.purge:78–89` clears markers even when SyncManager.delete returned normally after rollback. Review those in the TOOLS report.
- Independent server estates, removing ProfileSwitcher Add Family Member, retiring executor homes, `/welcome` direction, mobile layouts and broader security/admin work remain owner-deferred. No defect here assumes these decisions were approved.
- Settings/data has no user replacement/additive import or restore surface. ConciergeSettings exposes export via `/export/preview`. A new import feature is not inferred from the review request.
- No new source changes, test files, fixtures, worktrees, commits, deployments or external messages were created. Pinpoint proofs used stdin Node with esbuild and synthetic closures only. They establish the stated function-level behavior, not a fresh end-to-end browser pass. No broad build/check suite was rerun for documentation-only work.

## Canonical follow-up references

Progress and implementation status live only in [RECOVERY_EXECUTION_PLAN.md](../../RECOVERY_EXECUTION_PLAN.md). These are evidence cross-references, not another task board.

| Canonical card | Evidence reference |
|---|---|
| X306 | SHELL F5 |
| X325 | SHELL F2 |
| X326 | SHELL F3 |
| X327 | SHELL F1 |
| X328 | SHELL F4 |
