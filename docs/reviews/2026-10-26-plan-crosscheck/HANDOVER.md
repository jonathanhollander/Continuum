# Handover, exports, executor and readiness cross-check

**Last Updated:** 2026-10-26 15:25 EDT

**Reviewed source:** `8751f224b2a1bf0d915940f61242829d08964d18` (`main`). Review and documentation only; application source unchanged.

## Scope and coverage

| Surface | Code paths reviewed | Boundary |
|---|---|---|
| `/binder`, `/export/preview` | Snapshot acquisition, packet model, attachment loading, printing, PDF and zip generation, scopes, download/error controls | Source review; no browser/print layout run |
| `/for/[token]`, `/for/preview/[contactId]` | Route loading, session handling, recipient service, held-letter/capsule filtering, link lifecycle, attachment ACL/cache, start-page steps/media/full record/download | Source review; synthetic extractor proof below; no actual recipient data |
| `/executor`, dashboard ExecutorHub | Record-page links, tracker/count sources, static area guidance, welcome persistence | Home consolidation remains owner-deferred |
| `/modules/executor-toolkit`, `/modules/executor-guide` | Persisted steps/notes/substeps, scenario filter, record links, redirect | Task-data structure sampled across phase 1–5; legal advice not independently fact-checked |
| `/modules/analytics`, `/admin/readiness`, dashboard audit consumers | Audit scoring, legal facts, account totals, Pulse gap input, loading dependencies and destination links | Source and isolated score-function proof; no interface timing run |

Principal inspected files: `backend/routers/{export,recipient,estate_data}.py`, relevant `backend/estate_models.py` models; `frontend/src/lib/services/{exportService,recipientService,sync.svelte}.ts`; `frontend/src/lib/components/recipient/RecipientStartPage.svelte`; `frontend/src/lib/components/executor/{ExecutorHub,ExecutorProgressTracker,ExecutorTaskDetail,ExecutorWelcome}.svelte`; `frontend/src/lib/stores/{executorStepsStore.svelte,analyticsStore,auditStore.svelte,familyStore.svelte,pulse.svelte,medicalStore.svelte,advancedAssetStore.svelte,digitalGuardianStore.svelte,propertyStore.svelte,contextStore.svelte}.ts`; `frontend/src/lib/utils/readiness.ts`; the routes in the table; supporting evidence uploader and letter/cancellation-PDF paths; executor task index and phase definitions.

CodeGraph was used first to locate/read indexed code. Targeted raw reads filled trimmed spans. Cards D1–D4, G4/G15 and relevant X104, X110–X113, X119/X121, X128, X145/X146, X275 were cross-referenced with their recorded acceptance/proof.

## Confirmed findings

### F1 — P1: PDF exports replace recorded Unicode names and prose with question marks

**Plan:** D1 full text/correct names and screen/PDF agreement; C3/G5 letter output; G12 subscription letter output. **Evidence:** `frontend/src/lib/services/exportService.ts:709–711` replaces every character outside Latin-1 with `?`; `packetPDF` applies it to every field at `:734`. The same destructive operation appears in `routes/modules/letters/+page.svelte:213–218` and subscription cancellation PDF `routes/modules/subscriptions/+page.svelte:330–338`. HTML and structured JSON retain the original text, so the outputs disagree.

**Trigger/impact:** Record a Russian/Hebrew letter or a name such as Łukasz, then use app PDF/download-copy PDF/letter PDF. The meaningful text is changed, not merely rendered with a fallback font. An inline execution of the actual shared transformer produced:

```text
PDF input: Дорогой сын — שלום — Łukasz
Actual latin1 output: ??????? ??? - ???? - ?ukasz
```

**Smallest correction:** Use a Unicode-capable PDF font/rendering path shared by all three exporters; preserve the original string and appropriate script direction. **Acceptance:** Names and full letter text match HTML/JSON and PDF text extraction for Latin accents, Cyrillic and Hebrew; check the rendered pages too. This is one finding shared with the legacy/independent validation reviews.

### F2 — P1: Property evidence-gallery media is absent from the snapshot attachment list

**Plan:** D1 actual files/manifest and reader agreement; D2 token-scoped files; G4 snapshot completeness; X128 evidence-media persistence. **Evidence:** `propertyStore.svelte.ts:4–9,32–46,74–76` stores evidence as JSON text containing `{id, filename, mime}` objects and its cover as a numeric thumbnail. `EvidenceGalleryUploader.svelte:80–84` produces that shape. `backend/routers/export.py:144–177` recognizes `_media`, flat `media_id`, download URL and data URL; it never descends into `evidence` or resolves numeric `thumbnail`. `exportService.ts:258–264` consumes the evidence JSON to display filenames. `recipient.py:120–121` authorizes shared files exclusively from snapshot attachments.

**Trigger/impact:** Save a property with an evidence image/video (even with that image set as cover), then open recipient full record or save the copy. The owner gallery works, but the files are excluded from the recipient ACL and zip; `missing_attachments` is also empty, so the manifest gives no warning.

An inline proof compiled the actual Python `_attachments`, `_record_id` and `_data_url_size` definitions through AST, with only synthetic rows/media objects, without importing the app or touching a database:

```text
Actual _attachments for current property evidence array + numeric thumbnail: [] missing: []
```

**Smallest correction:** Parse the current evidence shape (and supported cover reference), add/deduplicate each media ID with owning record/field, and report unresolved references. **Acceptance:** Gallery photos and video appear in snapshot, recipient/shared-file access and zip, with byte-identical content and record membership; missing evidence produces an explicit manifest entry. Media-migration defects are separate, owned by MEDIA.

### F3 — P1: A file-fetch failure becomes a permanent spinner and a falsely complete recipient download

**Plan:** D1 usable attachment copy/manifest; D2 playable media and downloadable copy; shared failure/retry invariant. **Evidence:** `exportService.ts:619–624` catches each file error, logs it and resolves a possibly empty map. `RecipientStartPage.svelte:49–64` retains that resolved attempt in `asked`; `:204–215` fetches only keys never asked, so the recipient's later download cannot retry the failed file. The no-URL branch at `:244–247` continues to say “Opening …” indefinitely. `buildDownloadCopy` includes only blobs available at `exportService.ts:943–957` and records remaining files in JSON at `:986`; no partial-download warning reaches the reader. `RecipientStartPage.svelte:219` nevertheless says “with every file beside it.” Binder load/download also retains the initially incomplete file map (`binder/+page.svelte:36,66`).

Actual-function inline proof, with a rejected synthetic media fetch:

```text
Actual loadAttachmentFiles with rejecting media fetch: resolved Map size=0; no error propagated
```

**Impact:** One transient timeout/404 can leave media inaccessible for the page lifetime, and saving the copy quietly omits its bytes. The structured `files_to_retry` entry is useful evidence but does not make the on-screen loading/success claims true or provide a retry control.

**Smallest correction:** Track successful and failed file loads separately; allow failed keys to retry; expose a settled failure state and accurate partial-copy status/manifest. **Acceptance:** Force one file fetch failure, restore it, retry successfully, and verify recipient media, binder and zip include identical bytes; while still unavailable, the UI settles and states the actual copy coverage.

### F4 — P2: Readiness gives zero contact points to an estate with its one intended recipient

**Plan:** D4 readiness based on real recorded membership; X112/X119 cross-display agreement. **Evidence:** `auditStore.svelte.ts:78–88` treats `items.length <= 1` as “Owner only” and grants zero family points. `familyStore.svelte.ts:96–100` returns the actual `/api/contacts` rows; no owner row is inserted into `members`. A saved sole son/executor/advisor is a real contact, not the owner.

Inline execution of the actual `calculateAudit` function with all other areas empty:

```text
0 actual contacts => family score 0/50, overall 0%
1 actual contacts => family score 0/50, overall 0%
2 actual contacts => family score 50/50, overall 13%
```

**Smallest correction:** Define family readiness against the actual contacts collection rather than assuming a synthetic owner member. **Acceptance:** Zero, one and two saved contacts produce intended documented scoring; dashboard, analytics, Pulse and admin/proof displays agree, including counted membership. The son-only acceptance scenario must receive credit for the recorded person.

### F5 — P2: Analytics always asks the user to choose Pulse guardians

**Plan:** X112/X119 genuine analytics facts; G13 gaps; X154 shared guardian membership. **Evidence:** `analyticsStore.ts:76,118` derives `hasPulseContacts` from `$pulse.contacts`. `pulse.svelte.ts:61,77–81` always supplies `[]` for that compatibility field. The real guardian contacts live in the separate contact collection and tier rule. Therefore the “Choose your Pulse guardians” invitation remains even after an eligible guardian is saved.

**Smallest correction:** Derive the metric from the real shared contact store using the current explicit-tier/call-tier/private rule, with the proper loaded state. **Acceptance:** No guardians → invitation; call-tier-only guardian or explicit Pulse guardian → invitation clears after reload; tierless private contact → invitation remains. Keep analytics and Pulse membership in agreement. This is a live-consumer use of a compatibility stub, not unused placeholder code.

### F6 — P2: Executor welcome closes and suppresses retry when its account save fails

**Plan:** G15 saved welcome name/context; shared failed-save draft invariant. **Evidence:** `ExecutorWelcome.svelte:49–59` catches failed PATCH and only logs. `:62–76` applies local context, starts the save without awaiting it, unconditionally sets `continuum_executor_welcome_seen` and closes the welcome. `contextStore.svelte.ts:143–148` setters are local only. Dashboard `:361–366` uses that device flag to suppress the welcome later.

**Trigger/impact:** Enter a deceased person's name and finish while `/api/auth/onboarding` rejects or is unavailable. The dialog closes as if saved; reload restores the old server name/context, and the dialog's draft/retry path is gone. The verified success path in G15 does not cover this failure.

**Smallest correction:** Await the account save, keep the name draft and a retry state on failure, and mark the welcome seen only after a confirmed save. Scope the seen state to the correct account. **Acceptance:** One forced save failure keeps the entered name and offers retry; retry persists it, then reload/second context show it.

### F7 — P2: Readiness loading guards omit every legacy source added to the audit

**Plan:** X113/X122 false-zero/loading protection; X121 added legacy scoring; D4 truthful readiness. **Evidence:** `auditStore.svelte.ts:120–127` reads heirlooms, letters, funeral wishes, journal, visual memories and capsules. Dashboard `auditLoading` at `dashboard/+page.svelte:320–323` and admin `isLoading` at `admin/readiness/+page.svelte:21–24` wait only for the original five financial/insurance/contact/medical/digital collections.

**Trigger/impact:** In a fresh device context, allow those five reads to finish while delaying the saved legacy records. The score/greeting can render from incomplete legacy data despite the comments saying all audit stores have answered. Dashboard `:394–409` can also redirect on this provisional zero if the account lacks skip/expert/onboarding-complete flags. Source-confirmed dependency omission; no browser-timed redirect reproduction was run.

**Smallest correction:** Use one shared audit loading/answered state covering every dependency, including singleton wishes, and gate all audit consumers on it. **Acceptance:** Delay only legacy fetches and verify dashboard/admin/analytics/Pulse do not present an empty-plan score or redirect before the relevant source answers; after success all displays agree. Distinguish a load failure from a verified empty plan.

## Confirmed coverage omission requiring scope reconciliation

### G1 — “Everything recorded” copy omits advanced financial records and executor notes

`backend/routers/export.py:40–62` selects 21 models and does not include `AdvancedAssetData`, `ExecutorStep` or `DigitalGuardianData`. The packet's fixed `SECTIONS` list also has no corresponding sections. `advancedAssetStore.svelte.ts:67–95` persists claim numbers/notes, transactions and maintenance in the omitted advanced singleton; `executorStepsStore.svelte.ts:71–89` persists user-entered step notes/ticks. They remain readable in the owner's app but are absent even from zip `snapshot.json` because they never enter the snapshot.

An AST inventory of the actual section list returned:

```text
Snapshot SECTION_MODELS count: 21
ExecutorStep included: False
AdvancedAssetData included: False
DigitalGuardianData included: False
```

The live binder claim at `binder/+page.svelte:79–80` is “Everything you have recorded, in one place to print or keep”; the snapshot module/endpoint uses the same broad description. This omission matters particularly for actual claim/maintenance details and an executor's entered notes. **Qualification:** D1's original acceptance enumerates every *scenario* record, not every table in the product; absence of optional metadata alone does not prove that original acceptance failed. Reconcile the scope/claim explicitly, prioritizing practical user-authored financial information and notes for the useful complete handover requested in AGENTS.md. Do not silently expand into every internal table. Any extension needs matching reader/print/PDF/zip/manifest membership and verification.

## Cross-review findings owned elsewhere

- **Shared account-generation handling (CONTRACTS):** executor per-step queue at `executorStepsStore.svelte.ts:64–76` starts a queued closure after a prior write settles, with no captured account. A queued A note can begin against B after an account switch. Preview route `for/preview/[contactId]/+page.svelte:24–35` loads only when `loadedFor` is null and does not re-evaluate a changed account. These are subpaths of the consolidated contracts finding, not additional handover cards.
- **Subscription annual-cycle normalization (FINANCES):** page mapper normalizes legacy annual fields while `exportService.ts:202,434` uses raw cycle/frequency. Finance owns the totals/billing parity finding.
- **Unassigned letters marked ready (LEGACY):** recipient filtering is verified in `recipient.py:81–92`; the legacy reviewer owns the ready-membership mismatch.
- **Legacy media migration (MEDIA):** parent-record references must reach the export scanner; media owns migration's local-only mapping issue.

## Deferred choices, positive observations and limitations

Caller notes on the start page, executor-home retirement, merging calendar interfaces, broad recipient permissions, phone/tablet work and financial/property total scope remain owner decisions/deferred work. They were not reclassified as defects.

The reviewed source does implement one shared packet model; server-side recipient filtering precedes attachment matching; full prose is preserved in HTML/JSON; revoked/unmarked recipient links are checked before shared-file use; successful executor notes/substeps use server-backed storage; legal pillar facts now share the checkbox inputs. No finding is based solely on `TODO`, a historical “complete” file or missing automated tests.

Executor task data contains dated/general legal/financial statements, e.g. `data/tasks/phase5.ts:21,26` has a 2024 federal estate-tax figure. Current-law/jurisdiction validity was not checked, so this is a **content verification gap**, not a claimed present-law defect. Task deadlines/costs require a separately scoped authoritative-content check if these guides are relied on.

No application, production database, uploads, real contact information or external messaging was used. No browser/authenticated production test, PostgreSQL execution, PDF rendering/text-extraction pass or broad build/test suite was run. The inline proofs executed extracted actual functions only. The first combined Node proof successfully demonstrated swallowed attachment errors, then its untranspiled TypeScript `latin1` expression produced `SyntaxError: Unexpected token ':'`; the corrected TypeScript-transpiled invocation produced the Unicode output above. This harness mistake is not an application defect. No test files were added.

## Canonical follow-up references

Progress and implementation status live only in [RECOVERY_EXECUTION_PLAN.md](../../RECOVERY_EXECUTION_PLAN.md). These are evidence cross-references, not another task board.

| Canonical card | Evidence reference |
|---|---|
| X317 | HANDOVER F1; LEGACY F3 |
| X318 | HANDOVER F2 |
| X319 | HANDOVER F3 |
| X320 | HANDOVER G1 |
| X321 | HANDOVER F4 |
| X322 | HANDOVER F5 |
| X323 | HANDOVER F7 |
| X324 | HANDOVER F6 |
