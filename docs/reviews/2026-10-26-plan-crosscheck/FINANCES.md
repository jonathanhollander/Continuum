# Finance, household and care records — plan cross-check

**Last Updated:** 2026-10-26 15:25 EDT

**Source commit:** `8751f224b2a1bf0d915940f61242829d08964d18`.

This is a source review with pinpoint inline synthetic checks, not a new full browser or production run. Application code was unchanged. Findings below use local identifiers for orchestration; the canonical execution plan owns the final card IDs and status.

## Coverage

| Route | Paths inspected | Result |
|---|---|---|
| `/modules/financial-accounts` | Page loading/wizard, AssetManager add/edit/remove/CSV, form state and displayed values; financial store, money helpers, generic model/API mapping, packet value/summary interface | F1 and F2; legacy debt conversion cross-reference below |
| `/modules/insurance` | Wizard, create/edit/reset, filters, active premium summaries, policy-number/expiry/agent/notes/document fields; insurance store and model | F1; supplied model fields are mapped through the shared write/read contract |
| `/modules/property` | Wizard, create/edit/remove, evidence/cover flow, retry snapshots, ownership-document open, valuation/type totals; property store and Asset category | Property has the captured-draft implementation missing in F1's other forms; document lifecycle passed to media reviewer |
| `/modules/subscriptions` | Form, create/edit/close, cycle mapper, totals, filter, cancellation-letter print/PDF, row component, snapshot/packet interface | F1, F3, F4 |
| `/modules/digital-guardian` | Account add/edit/remove, wishes, wizard, setup/fire-drill singleton, pending debounce/retry, account closure store | F6 and account-generation cross-reference; error retry captures an account payload, unlike F1 |
| `/modules/heirlooms` | Wizard queue, add/edit, recipient picker, story/provenance/custom fields, media-bound VisionUploader, card/QR actions, store/category | F1 and F8; public family QR access remains an explicit deferral |
| `/modules/pets` | Create/edit/remove, guardian/vet/food/medical/microchip/notes/custom fields, attached-care-document lifecycle; store/model | F1, including attachment implications |
| `/modules/home-manual` | Vendor/access/utility forms, edit/remove, vendor links, access instructions, stored utility mapping and rendered cards; three stores and models | F7; utility instructions and custom fields are owner-deferred |
| `/modules/medical` | Profile read/edit, directives create/edit/remove, contact/phone fill, attached file/custom fields, modal reset; medical store and dedicated router | F1, including attachment implications |
| `/modules/advanced-registry` | Transactions, maintenance, claims, Account Wishes, add/edit/remove, claim status, reference selections, initial sync, singleton store/model | F5; snapshot completeness passed to handover reviewer |

Primary source files inspected: the ten route `+page.svelte` files above; `lib/components/archetypes/AssetManager.svelte`; `lib/stores/{financialAssetsStore,insuranceStore,propertyStore,subscriptionStore,digitalAssetsStore,advancedAssetStore,heirloomStore,petStore,medicalStore,homeAccessStore,vendorStore,utilityStore}.svelte.ts`; `lib/components/modules/heirlooms/{HeirloomCard,VisionUploader}.svelte`; `lib/components/modules/subscriptions/SubscriptionRow.svelte`; `lib/utils/money.ts`; the relevant mapper/create/update/singleton/retry portions of `lib/services/sync.svelte.ts`; relevant financial/home/care models in `backend/estate_models.py`; generic routes in `backend/routers/estate_data.py`; dedicated `backend/routers/medical.py`; the snapshot model list/row serialization in `backend/routers/export.py`; and subscription/financial fields and totals in `lib/services/exportService.ts`.

CodeGraph was used before source exploration. Targeted raw reads filled source sections omitted by its capped responses. Cross-referenced cards include C7.1/C7.3/C7.4/C9/C10, D1/D4, G10–G14, X116/X120/X128/X132/X136/X148/X149/X201/X293 and their status evidence.

## Confirmed findings

### F1 — P1: failed-create Retry can save a different form draft

**Status:** source-confirmed; subscription callback behavior reproduced with the actual source-extracted form methods and synthetic dependencies. No browser claim.

`SyncManager.create` keeps its caller-provided `onRetry` and invokes it later (`frontend/src/lib/services/sync.svelte.ts:416`, `:440`, `:444`). Several callers provide a method that rereads mutable page state, rather than a captured draft:

- Financial: `AssetManager.svelte:292`–`:310` passes `saveAsset`; `resetForm` at `:356` clears the fields and ID.
- Subscriptions: `subscriptions/+page.svelte:162`–`:174` passes `saveSubscription`; `resetForm` at `:199` replaces `newSub`.
- Insurance: `insurance/+page.svelte:360`–`:362` passes `handleAddPolicy`; reset at `:279` replaces the draft.
- Medical: `medical/+page.svelte:151`–`:154` passes `saveDirective`; reset at `:220` removes unsaved media and clears the draft.
- Pets: `pets/+page.svelte:112` passes `savePet`; reset at `:184` removes unsaved media and clears the draft.
- Heirlooms: `heirlooms/+page.svelte:224`–`:231` passes `saveHeirloom`; opening a new form at `:158` replaces its draft.

**Trigger:** Draft A's create fails; close/reset it and begin Draft B; use the older failure notice's Retry. The callback now submits B (or does nothing for an empty reset form), while the notice is about A. Pet/medical close also removes A's uploaded attachment. A newly opened edit can turn that old create Retry into an edit of another record.

Inline proof output:

```text
ACTUAL EXTRACTED subscription retry attempts: ["Draft A","Draft B"]
```

The harness extracted the page's existing `saveSubscription`/`saveSubscriptionOnce` functions, supplied a first-create rejection and captured the fourth create argument, then changed `newSub` before invoking it. It wrote no files and started no server.

**Plan relation:** B4/B4.1 failed-save and retry guarantees; C7.x full round trip; X136 already solves the same problem for property by capturing an immutable draft and retaining its uploads (`property/+page.svelte:405`–`:428`). The general completion claim needs narrowing until the other producers have equivalent semantics.

**Smallest fix / acceptance:** capture the attempted record, operation and required media before create; let Retry replay that draft exactly once, with lifecycle cleanup tied to that draft. Force A's create to fail, close/open B, retry A, and verify only A is saved with A's attachment; B remains unchanged. Coordinate the shared account-generation protections from CONTRACTS.

### F2 — P1: negative financial balances lose their sign on screen

**Status:** source-confirmed and reproduced with the actual source-extracted formatter and financial total functions.

`AssetManager.svelte:504`–`:505` always applies `Math.abs` to the value and adds a minus sign only for `Debt`/`Liability`. The input at `:720`–`:724` accepts signed numbers; `FinancialAccount.value` is an optional float (`backend/estate_models.py:105`) and the generic write path does not prohibit a negative balance. `estateTotals` preserves the negative sign for an ordinary account (`financialAssetsStore.svelte.ts:14`–`:30`), and the packet preserves it for that row (`exportService.ts:228`–`:230`). The owned-share text also applies `Math.abs` (`AssetManager.svelte:1000` and `:1213`).

**Trigger/impact:** a checking account with a valid overdraft balance of −$500 displays $500.00 on its card/table, while the net total subtracts it and the handover prints −$500.00. At 50% ownership the share caption is positive although its contribution is −$250.

```text
ACTUAL financial display: $500.00 net: -250 packet value: -$500.00
```

**Plan relation:** D4's trustworthy financial figures and screen/output agreement; C10/X201 ownership treatment.

**Smallest fix / acceptance:** preserve signed balances for non-debt rows; retain the explicit owed treatment for debts. Verify negative, zero and positive checking balances at 0/50/100% ownership across card, table, totals and packet.

### F3 — P1: legacy annual subscriptions become monthly expenses in handover totals

**Status:** source-confirmed and reproduced with the actual source-extracted page cycle resolver and packet total helper.

The page's `subscriptionStore.svelte.ts:20`–`:25` treats legacy `cycle="monthly", frequency="annual"` as Yearly. X148's verified status explicitly says lowercase server rows remain unchanged until saved. Snapshot serialization returns raw model fields (`backend/routers/export.py:92`–`:100`, `:186`–`:191`), without the page mapper. Packet totals instead test the raw expression `(r.cycle || r.frequency) === 'Yearly'` (`exportService.ts:200`–`:204`), and the billed label also uses the raw expression (`:443`).

**Trigger/impact:** a stored $120 annual subscription with legacy lowercase cadence renders $120/year in the application, but the binder/recipient packet says $120/month and $1,440/year. This affects pre-existing/imported rows; this review makes no assertion about the current production data population.

```text
ACTUAL legacy page cadence: Yearly
ACTUAL packet totals: [{"label":"Monthly total","value":"$120.00"},{"label":"Yearly total","value":"$1,440.00"}]
```

**Plan relation:** X148's normalization was applied only in the page store; D1/D4/X220 require matching screen and packet totals/membership.

**Smallest fix / acceptance:** one cadence resolver shared by the store and packet, or canonicalize snapshot rows without altering raw recorded values. Check `Monthly`, `Yearly`, lowercase monthly/yearly, annual/Annually/anual and default-cycle-plus-frequency rows, including closed rows, across page/binder/recipient/PDF/download. Handover reviewer cross-references this finding rather than duplicating it.

### F4 — P2: monthly equivalents round each annual row before summing

**Status:** source-confirmed; exact arithmetic expression checked inline.

`subscriptions/+page.svelte:366`–`:370` rounds each annual cost divided by twelve to whole cents before adding it to the monthly total. The packet repeats this in `exportService.ts:203`. With twelve subscriptions costing $1/year, each rounds to $0.08/month and the display totals $0.96/month, although the yearly total is $12 and its monthly equivalent is $1.00. The comment promises rounding once but the reducer rounds once per row.

```text
Subscriptions twelve $1/year rows: monthly 0.96 yearly 12 yearly/12 1
```

**Plan relation:** X148/money accuracy; D4 matching totals. The screen and packet currently agree with each other on the same arithmetic error.

**Smallest fix / acceptance:** sum annual cents and monthly cents separately, convert the annual subtotal to a monthly equivalent, and round the combined result once. Verify multiple fractional annual equivalents, mixed cadence and closed rows in both displays and outputs.

### F5 — P2: Your Full Record was omitted from the single-save protection

**Status:** source-confirmed; actual source-extracted `handleAdd` and `addTransaction` methods reproduced duplicate writes with synthetic delayed dependencies.

`advanced-registry/+page.svelte:125`–`:155` has no in-flight guard, and its Save button at `:1207`–`:1213` has no disabled/busy state. Each `advancedAssetStore.addTransaction` call assigns a new UUID and prepends a row (`advancedAssetStore.svelte.ts:74`–`:79`); the singleton's optimistic update makes the first row available to the second call while the first request is still pending. Maintenance/claims use the same unguarded handler.

```text
ACTUAL extracted Full Record double click: {"POSTs":2,"rows":2}
```

**Plan relation:** X149 says module forms receive one-save guards, but its completed file list omits this page. X293 subsequently added the edit path without adding a guard.

**Smallest fix / acceptance:** guard `handleAdd`, disable/label Save while pending, and apply the same protection to all four add modes and edit. Hold a POST, click twice, release it: one request/record and unchanged draft on failure.

### F6 — P2: closing a digital account leaves a rejected save promise unhandled

**Status:** source-confirmed; no additional runtime probe.

`digitalAssetsStore.svelte.ts:43`–`:49` calls `digitalAssetsSync.update` without returning, awaiting or catching it. The Account Wishes switch calls this method (`advanced-registry/+page.svelte:781`–`:785`). `SyncManager.update` shows the notice/rolls back but then throws (`sync.svelte.ts:560`–`:587`). A rejected request therefore escapes the toggle producer as an unhandled rejection, despite the shared manager having shown a usable retry notice.

This finding does **not** include the ignored delete promises on pets/medical/home manual: `SyncManager.delete` catches failures and returns at `:636`–`:657`, so those were eliminated as false positives.

**Plan relation:** B4 failure isolation, G13 Account Wishes and the release's zero-page-error expectation.

**Smallest fix / acceptance:** return/await/catch the update at the producing control; retain the manager's rollback and single notice. A forced failed closure update should preserve saved status, show one retry and create zero unhandled rejections; retry should persist the selected state.

### F7 — P2: saved utility account/phone details remain inaccessible in Home Manual

**Status:** source-confirmed; conditional on records containing those fields, no current-data assertion.

`Utility` has `account_number` and `support_phone` (`backend/estate_models.py:150`–`:151`), and `utilityStore.svelte.ts:19`–`:27` preserves their read/write spellings. The Home Manual form state and edit/save methods include only service type, provider and location (`home-manual/+page.svelte:95`, `:208`–`:238`). The rendered utility card at `:875`–`:901` also shows only provider and location. Thus a saved support number/account identifier cannot be inspected or edited on its owning page, even though it remains in the API/packet data.

**Plan relation:** the G0 seed explicitly calls out the utility card hiding these saved values; G0b's home-manual coverage entry says the previous cards cover the rest. This remains an omission from that pass, separate from the explicitly deferred instructions/custom-field schema changes.

**Smallest fix / acceptance:** show and edit existing utility identifiers/contact details through the current columns. Seed both values, load/edit/reload them, and verify the owning page and handover agree without erasing a blank intentionally entered by the owner.

### F8 — P1: an heirloom can save before its chosen photo upload finishes

**Status:** source-confirmed race; no browser/network-delay reproduction in this review. Shared-media review is coordinating the broader upload lifecycle.

`VisionUploader.svelte:39`–`:54` starts an asynchronous upload and assigns its bound `imageUrl` only after the request completes at `:47`–`:49`. Its `uploading` state is private; the heirloom page only binds image/provenance (`heirlooms/+page.svelte:668`–`:672`). Parent Save is enabled based on name and record-save state alone (`:712`–`:715`), and serializes the current image at `:224`–`:231`.

**Trigger/impact:** with a named heirloom, choose a photo over a slow connection and save the record before upload resolves. The record receives the previous/blank image. The form resets at `:236`–`:238`; the later upload result changes the bound draft, rather than updating the saved heirloom. Reload/recipient/export therefore misses the selected photo despite the completed upload.

**Plan relation:** C2 durable attachments and C7.1 complete heirloom round trip; X149's record-save guard does not wait for the preceding file save.

**Smallest fix / acceptance:** propagate upload pending/success/error state to the form and tie the result to the correct draft. A delayed-upload save must either wait for the selected photo or remain visibly pending; late completion must never attach to a different draft. Verify saved record, reload, recipient and packet photo agree.

## Cross-area findings coordinated with other reviewers

- **Your Full Record transactions/maintenance/claims missing from handover:** `AdvancedAssetData` persists the lists, but `backend/routers/export.py:40`–`:62` excludes its model and the packet has no corresponding section. Handover reviewer owns the primary finding.
- **Delayed Digital Guardian checks cross an account boundary:** page-local pending/timer at `digital-guardian/+page.svelte:89`–`:146` has no account generation capture or timer teardown; the shared manager resolves the current auth when it sends. CONTRACTS owns the consolidated account-generation finding and root validator checks the real switch path.
- **Legacy credit/loan classification:** migration `d5f1b9c3a7e2` and the current `isDebt` resolver misclassify legacy financial types. SCHEMA F3 owns the migration proof; the financial mapper adds no later type correction. This is conditional legacy-data behavior, not a production-row claim.
- **Property ownership-document cleanup:** property evidence/cover helpers exclude `documents` from tracked lifecycle IDs (`propertyStore.svelte.ts:55`–`:61`; page `formMediaIds:276`–`:278`). Passed to shared-media review for lifecycle consolidation rather than creating an independent finance card.

## Intentional deferrals and eliminated suspicions

- Financial-account versus property/digital valuation scope, Family permissions and phone/tablet coverage remain owner-deferred; they are not defects in this review.
- Utility-specific instructions need a model column, as the completed C7.3 status explicitly records. X77 intentionally removed unsaved Home Manual custom-field controls and leaves a future migration to the owner. The closure handoff should keep both follow-ups visible.
- Public QR access for family scans remains on hold; owner-authenticated QR links alone do not reopen that decision.
- `advanced_assets` nested JSON field names are protected by `VERBATIM_VALUE_KEYS` (`sync.svelte.ts:17`–`:20`, `:37`). The suspected nested camel/snake corruption was eliminated; actual JSON names remain verbatim.
- Wizard/example labels and static provider guidance are not treated as live financial analysis or stubs merely because their source is static. The wizard writes blank real-detail fields pending author entry.

## Verification and limits

Commands used: CodeGraph exploration, targeted numbered source reads, `rg` on already located source/plan entries, and two inline `node --input-type=module` invocations using the existing esbuild dependency to execute source-extracted pure/form methods with synthetic dependencies. The first invocation checked mutable Retry, signed financial rendering and annual-equivalent arithmetic; the second checked legacy cadence parity and Full Record duplicate-save behavior. Both exited 0 and produced the outputs reproduced above.

No new test/script/fixture files were written. No build, test suite, real database, production API writes, scheduler startup, browser screenshots, external messages or deployments were performed. These are narrow source/extracted-method proofs; full working-interface/reload/export acceptance remains required when the corresponding fixes are implemented. Shared contracts, schema migrations, attachment retrieval, readiness calculations and export internals receive separate deeper reviews; this report identifies the finance-side interfaces and cross-references those owners instead of claiming their whole scope was re-reviewed here.

## Canonical follow-up references

Progress and implementation status live only in [RECOVERY_EXECUTION_PLAN.md](../../RECOVERY_EXECUTION_PLAN.md). These are evidence cross-references, not another task board.

| Canonical card | Evidence reference |
|---|---|
| X314 | FINANCES F1 |
| X329 | FINANCES F2 |
| X330 | FINANCES F3 |
| X331 | FINANCES F4 |
| X332 | FINANCES F5; LEGACY F6 |
| X333 | FINANCES F6 |
| X334 | FINANCES F7 |
| X335 | FINANCES F8 |
