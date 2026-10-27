# Shared contracts cross-check

**Last Updated:** 2026-10-26 15:25 EDT

Source commit: `8751f224b2a1bf0d915940f61242829d08964d18`. Review and documentation only; no application changes, server startup, production access, owner databases, external messages or committed test scripts. Local finding labels below are report references; the orchestrator assigns canonical cards in the existing execution plan.

## Result

Three confirmed implementation gaps affect the shared persistence path. F1 and F2 were reproduced with the actual TypeScript hook/classes transpiled in memory, mocked transport/storage, and Svelte rune/store substitutes. F3 was reproduced with the actual singleton method and controlled response order. These are isolated JavaScript proofs, not browser/API/database end-to-end tests.

| Finding | Priority | Plan relationship | Classification |
|---|---|---|---|
| F1 — Async operations can cross an account boundary | P1 | B5, B5.1, X24, X62, X102; D3 for queued executor saves | Confirmed source and isolated execution; prior account-switch proofs cover only narrower paths |
| F2 — Cache failure converts successful server creation into a failed save and duplicate retry | P1 | B4/B4.1/B4.2, CU-013; shared persistence invariants | Confirmed source and isolated execution |
| F3 — Standalone singleton saves can apply stale responses over newer saves | P2 | B3/B4, C9; X109 solved this for list rows, not standalone singletons | Confirmed source and isolated execution |

## F1 — Async operations need a session/account generation throughout their lifetime

The list migration path captures the original token/account and stops on a generation change (`frontend/src/lib/services/sync.svelte.ts:239`, `:291`, `:356`). That protection is incomplete across the transport wrapper, ordinary creates, standalone singleton writes and queued producers.

Primary evidence:

- `frontend/src/hooks.client.ts:94`–`:109`: after any Bearer request returns 401, the wrapper reads the token currently in localStorage. If it differs from the request's token, it immediately retries with that token. A request sent by A can therefore be replayed as B after the person signs in as B. Capturing A's token in `migrateUp` does not prevent this lower-level substitution.
- `frontend/src/lib/services/sync.svelte.ts:416`–`:425`: ordinary `create()` calls `post()` with the original token, but after the response it appends the returned row and calls `setStored()` without checking the captured account/generation. `reset(false)` at `:210` increments the generation and loads B; the old successful create then appends A's row into B's list and cache.
- `frontend/src/lib/services/sync.svelte.ts:1073`–`:1115`: non-shared `SingletonSyncManager.update()` neither captures a generation nor checks the account before applying its successful response or rollback. Its late A response/rollback writes to the current B namespace through `updateLocal()`/`setStored()`.
- Failed-save callbacks at `sync.svelte.ts:444`, `:586`, `:656`, `:1123` retain the draft/id but acquire credentials when Try Again is clicked. They also need account ownership rather than relying on the current sign-in.

Companion paths cross-checked with the other reviewers:

- `frontend/src/lib/stores/auth.ts:65`–`:78`: a refresh captures one refresh token but persists its late result unconditionally; `:125`–`:133` likewise registers the account from a late `/me` response. Neither checks that the initiating session is still current.
- `frontend/src/lib/services/mediaService.ts:168`–`:176`: XHR uploads retry their old FormData using the current `refreshSession()` result, without confirming the original account.
- `frontend/src/lib/stores/executorStepsStore.svelte.ts:64`–`:76`: queued closures begin after the prior promise settles and call `latest()` plus create/update using the account current at that later time. They never capture the account when the note/tick was queued.
- `frontend/src/routes/modules/digital-guardian/+page.svelte:89`–`:146`: pending checks are captured by a 500 ms timer and later saved through the current singleton manager; the timer/pending object does not carry an account generation. The finance reviewer owns this producer-level detail in its report.

Isolated proof output, using the actual client hook and mocked fetch:

```text
scenario: A write receives 401 after B became current
call 1: POST /api/data/pets, Bearer synthetic-account-A-token, {"name":"Account A draft"}
call 2: POST /api/data/pets, Bearer synthetic-account-B-token, {"name":"Account A draft"}
status: 200
CONFIRMED: account A payload replayed with account B token; zero network traffic.
```

A second proof executed the real `SyncManager` and `SingletonSyncManager` methods, switched the mocked account/token to B, called each manager's real reset, then resolved A's successful request:

```text
LIST activeAccount B; items [{id:101,name:"Account A private pet",userId:1}]
B:owner:pets = [{id:101,name:"Account A private pet",userId:1}]
SINGLETON activeAccount B; data {id:1,userId:1,wishes:"Account A private wishes"}
B:owner:funeral_data = {id:1,userId:1,wishes:"Account A private wishes"}
CONFIRMED: stale create and non-shared singleton responses persist A data into B cache after reset.
```

Impact: records, private content and queued edits can appear under the next account; retry paths can actually create/change records with the next account's credentials. This is a functional data-integrity failure, within the feature-first scope.

Smallest coherent fix: establish one session/account generation, capture it when work is initiated, retain it in timers/queues/retry callbacks, and require it before credential refresh/replay, persistence, state application or follow-up logging. A refresh may replace a token only within the same account/session. Abort or retain old-account work in its original namespace after a switch; never reinterpret it as the new person's work.

Acceptance: start delayed read/create/update/refresh/upload and queued executor/guardian work as A; switch to B, then settle A's operations or click A's retry. B receives no A requests, records, files, cache entries, drafts, toasts or activity entries. A can resume its own retained work after returning. A same-account token refresh still succeeds.

## F2 — A full or blocked local cache turns one successful create into two records

`frontend/src/lib/stores/persistence.ts:28`–`:38` directly calls `localStorage.setItem()` and allows `QuotaExceededError`/storage-access exceptions to escape. `SyncManager.create()` groups the server POST, successful response and local cache write in one `try` (`sync.svelte.ts:419`–`:444`). If the server returns 200 but the cache write throws at `:423`, the catch reports a database save failure and offers a callback that POSTs the same draft again. The first server record already exists.

The actual methods, with a synthetic quota exception only at `setStored`, produced:

```text
QUOTA first create: {"serverRows":1,"rejected":true,"retryOffered":true}
QUOTA after Retry: {"serverRows":2,"serverNames":["One intended pet","One intended pet"],"localIds":[1,2]}
```

The analogous standalone singleton update writes the optimistic cache before entering its request `try` (`sync.svelte.ts:1077`–`:1083`); the same storage exception prevents its request and bypasses the manager's retry notice. Collection update/delete also perform their initial cache writes before the request try. This is separate from an API rejection or an activity-log failure.

Impact: legitimate browser storage exhaustion or blocked storage can produce duplicate records and misleading save state, or prevent a server save even while the network is available. Large writing collections make storage capacity relevant to this archive.

Smallest fix: treat browser-cache persistence as its own outcome, with a safe in-memory fallback; distinguish a server-confirmed record from an unsent request. A cache exception after POST success must return that server record and must never offer another create POST. Catch cache reads/writes at the persistence boundary and give accurate device-copy status where needed.

Acceptance: force local storage writes to throw while a create returns 200. Exactly one server row exists, the caller receives success/the saved row, and any offered retry only retries local caching. With storage blocked before an edit/delete/singleton save, the server operation still follows the intended save path or presents an accurate recoverable state with the draft retained. Re-fetch confirms the saved data independently.

## F3 — The standalone singleton manager lacks the ordering protection implemented for lists/shared profiles

`SingletonSyncManager.update()` for non-shared records sends immediately at `frontend/src/lib/services/sync.svelte.ts:1083`–`:1094`; every response calls `updateLocal(saved)` at `:1101`, and every failure restores its old snapshot at `:1113`. There is no write queue/sequence or pending-overlay logic. The list manager has per-row serialization, and the shared estate profile has its own queue; neither applies to these standalone singleton stores.

A reachable example is Health & Medical: `frontend/src/routes/modules/medical/+page.svelte:94`–`:100` calls `medicalStore.updateProfile()`, and the Save my updates button at `:440` has no saving guard or disabled state. The person can save blood type, edit it again while the first request is pending, and save again. `medicalStore.svelte.ts:61` and `:78` route these calls to the standalone manager.

Controlled execution with the actual singleton method, requests applied in issue order and responses delivered in reverse, produced:

```text
ORDERING: {"requestedNewest":"A+","server":"A+","local":"O+","concurrentRequests":2}
```

The screen/device cache is left with the stale blood type even though the latest server value is A+. A slow earlier failure similarly restores an old snapshot over a newer successful save. If requests themselves arrive/process in reverse, the manager also supplies no ordering guarantee to prevent the older full payload becoming the server's final value.

Smallest fix: serialize standalone singleton writes per record and preserve the newest pending fields over earlier replies/rollbacks, with the account-generation checks from F1. A caller-level guard is useful for duplicate clicks but does not replace shared ordering across callers.

Acceptance: two differing saves with a delayed first response finish on the newer values on screen, in cache and after reload. An earlier failure does not undo a later successful edit; the latest failed edit reverts only its own changes. Include a non-shared singleton, not only a collection row or estate-profile slice.

## Coverage and limits

| Surface | Actual review coverage | Result |
|---|---|---|
| List manager | Constructor/subscription, reset, sync/migrate, post/create/update/delete, row-write/deletion overlays, audit, registry, on-demand scheduling | F1/F2; existing per-row ordering/migration guards observed |
| Singleton manager | Standalone initialization/sync/wire payload/update/rollback/reset; shared-record sync/slices/pump/queue/reset | F1/F2/F3; shared profile queue present |
| Transport/session | Full hook and API client, auth initialization/login/logout/refresh, account keyring, profile context, layout auth→clear/sync triggers | F1; API client delegates writes through hook |
| Persistence | Entire persistence helper and legacy syncService call-site check | F2; legacy syncService has no live caller (its invocation is commented), so its mock comments are not a user-facing stub finding |
| Generic backend | MODEL_MAP, singleton/category selection, create/update/delete, protected fields, custom-field serialization, JSON singleton encoding, PK handling, enum canonicalization | Shared shapes and category filtering present; no independently confirmed new backend-contract defect in the reviewed path |
| Estate profile | GET object shape, legacy shape handling, null removal and shallow-key merge; shared frontend slice writing | Implemented; per-page shared sequencing present. Concurrent independent-device writes were not runtime tested |
| Mapper examples | Full funeral, digital guardian, medical, property, tone, concierge, scenario and estate mappers; relevant acceptance/preferences registrations | JSON/user custom-field handling inspected. Domain reviewers own exhaustive field-by-field comparisons for their modules |
| Caller examples | Medical profile save/control, funeral wizard draft queue, digital guardian pending queue, executor step queue, selected preference paths | F1/F3; funeral/digital-guardian already serialize their normal page saves, but lack the broader session ownership contract |

Files inspected directly through CodeGraph or targeted omitted-source reads: `frontend/src/lib/services/sync.svelte.ts`, `frontend/src/hooks.client.ts`, `frontend/src/lib/api/client.ts`, `frontend/src/lib/stores/{persistence,auth,keyringStore,profileContext,userPreferencesStore.svelte,medicalStore.svelte,digitalGuardianStore.svelte,funeralStore.svelte,propertyStore.svelte,toneStore.svelte,conciergeStore.svelte,scenarioStore.svelte,estateStore.svelte,acceptanceStore.svelte,executorStepsStore.svelte}.ts`, `frontend/src/lib/services/{syncService,mediaService}.ts`, relevant script/handler portions of `frontend/src/routes/{+layout,modules/medical/+page,modules/digital-guardian/+page}.svelte`, `frontend/src/lib/components/modules/funeral/FuneralWizard.svelte`, `frontend/src/lib/components/ui/EvidenceGalleryUploader.svelte`, `backend/routers/estate_data.py`, and the profile endpoints in `backend/main.py`.

The review read current code after CodeGraph exploration. No whole-suite/build/browser runs were performed. Three successful inline Node proof invocations covered four cases: hook replay, late save application, quota duplicate creation and singleton response ordering. The first late-save proof harness failed before running application methods because removing import AST nodes retained a TypeScript `config_1` alias; stripping import lines before transpilation corrected the harness. Complete failure output remains in this tool transcript; it is not an application failure. No proof scripts were written to disk.

Intentional owner deferrals were not reopened: independent family estates/ProfileSwitcher design, phone/tablet work, X6 key rotation, X141 config apply, broad security/admin infrastructure, public QR scanning and new delivery features. The findings above concern current saves/account correctness rather than those deferred expansions.

## Canonical follow-up references

Progress and implementation status live only in [RECOVERY_EXECUTION_PLAN.md](../../RECOVERY_EXECUTION_PLAN.md). These are evidence cross-references, not another task board.

| Canonical card | Evidence reference |
|---|---|
| X303 | CONTRACTS F1 |
| X304 | CONTRACTS F1 |
| X305 | CONTRACTS F1 |
| X310 | CONTRACTS F2 |
| X311 | CONTRACTS F3 |
