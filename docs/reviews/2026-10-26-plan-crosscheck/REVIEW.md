# Code and implementation-plan cross-check

**Last Updated:** 2026-10-26 15:32 EDT

**Source snapshot:** `8751f224b2a1bf0d915940f61242829d08964d18`. This is the later source review requested after recovery closure, not another browser release test.

The review found **55 concrete follow-up cards: 27 P1 and 28 P2**. There are 54 implementation-correction cards and one full-copy scope-reconciliation card (X320). **29 previously completed acceptance rows are reopened**, linked to their corrective cards in the [canonical execution plan](../../RECOVERY_EXECUTION_PLAN.md). Those parent rows are not 29 additional independent defects. Prior proof results remain recorded with their narrower scenarios.

No application fixes were made. No deployment, paid AI/provider request, external message, owner database access or scheduled loop occurred. The work produced this report, nine area reports, independent validation, and reconciled plan/handoff documentation.

## Most consequential findings

- **Account ownership is incomplete across async work.** An A request receiving a late 401 can be replayed using B's token; late successful creates and singleton replies write A content into B's cache. Queued work, browser media recovery and Concierge history have additional ownership gaps (X303–X309). Actual hooks/classes reproduced the main request/cache failures with mocked transport.
- **A successful server save can be reported as failed.** A localStorage quota exception after POST 200 offers another create, producing duplicate server records on Retry (X310). Old mutable form callbacks can instead submit a different draft (X314). Profile first-create/merge races can create duplicate roots or lose disjoint saved keys (X312).
- **Useful copies can lose text and files.** Shared and standalone PDFs replace non-Latin-1 names/prose with question marks (X317). Property evidence is missing from the attachment scanner and therefore from recipient authorization/zip files (X318). Failed binary reads become permanent opening states and partial downloads with an all-files success claim (X319). Media migration deletes originals while leaving parent references browser-dependent (X309).
- **Financial figures disagree.** A valid negative checking balance displays positive on its record; legacy annual subscriptions can inflate handover expenses twelvefold; legacy credit/loan types can be counted as assets (X329, X330, X313). These are conditional synthetic/source findings, not assertions about the owner's current records.
- **Pulse proof/status views overstate reality.** Local outbox files become “reached them by email,” tier logs become “contacted,” and transparency's visible-note list ignores the actual release switch. Early individual alerts can miss all-clear, and progressing tiers can abandon earlier retry attempts (X342–X347).
- **Live stubs remain in reachable paths.** Unconfigured grief discovery returns invented practitioners as genuine results; normal AI action intents are disconnected from their consumer; QR packs promise access grants that their ordinary navigation URLs do not implement (X351, X352, X354).

## Coverage and evidence

Nine area agents reviewed separate functional domains; a tenth agent independently validated the account-boundary, Unicode-PDF and mutable-Retry findings. The root reviewer reconciled duplicates, checked high-impact source paths, assigned the canonical cards and reopened contradicted acceptance. The root did not rerun every agent's isolated proof.

The repository inventory contains **71 page components across 98 route files**, **13 router Python files** (including package initialization), and **340 tracked TypeScript/Svelte/Python source files in the active-scope inventory**, excluding archived code, tests and migration files from that last count. Schema review separately examined migration paths and executed the full fresh SQLite upgrade. This inventory defines the review boundary; it is not a claim that every line of all 340 files was read or executed.

Every route file and router is assigned in [COVERAGE.md](COVERAGE.md). Area reports enumerate the paths and dependencies actually examined, including deliberate non-findings. This was a functional source/path review across the active application; it was not exhaustive CSS, translation, legal-content or browser-state certification.

| Area | Evidence report |
|---|---|
| Shared synchronization, cache, account/session and API contracts | [CONTRACTS.md](CONTRACTS.md) |
| Letters, journal, capsules, timeline, dates, funeral and family memories | [LEGACY.md](LEGACY.md) |
| Financial, insurance, property, digital, heirloom, household, pet, medical and advanced records | [FINANCES.md](FINANCES.md) |
| Snapshot, recipient, binder/PDF/zip, executor and readiness | [HANDOVER.md](HANDOVER.md) |
| Media, documents, recording, migration and storage interfaces | [MEDIA.md](MEDIA.md) |
| Pulse owner/guardian paths, schedule, delivery and access proof | [PULSE.md](PULSE.md) |
| Account entry, navigation, preferences, contacts and personal recipient note | [SHELL.md](SHELL.md) |
| Extras, public pages, AI/writing, simulations and functional admin tools | [TOOLS.md](TOOLS.md) |
| Schema history, model/API consistency, profile concurrency and legacy debt conversion | [SCHEMA.md](SCHEMA.md) |
| Independent challenge of the three shared high-impact findings | [VALIDATION.md](VALIDATION.md) |

Evidence is classified per finding:

- **Source-confirmed:** a reachable current-code path deterministically contradicts its contract; no browser outcome is claimed.
- **Isolated execution:** actual functions/classes or the actual migrated schema were exercised with synthetic inputs and mocked dependencies. This is narrower than a browser/API/production test.
- **Scope/verification gap:** code coverage or evidence is absent, but the desired optional scope or external facts need reconciliation. X320 is explicitly this category; dated executor legal guidance remains an unverified-content observation rather than a claimed current-law defect.
- **Owner-deferred:** an explicit prior decision remains on hold and is not a new implementation failure.

Successful isolated checks reproduced the cited defects; they are not passing application acceptance tests. Full failure output from corrected proof-harness invocations is retained in the review tool transcript and acknowledged in the relevant reports. No test/script/fixture files were added.

Schema evidence also provides a useful negative result: fresh Alembic reached head with **46 registered tables and no missing model columns**. The concurrency and legacy-classification defects persist despite that schema-shape result.

## Canonical finding index

Implementation ownership, progress and acceptance live only in [RECOVERY_EXECUTION_PLAN.md](../../RECOVERY_EXECUTION_PLAN.md), cards X303–X357. This index is an evidence locator, not a second task board. A shared root cause was split only where different producers/lifetimes need distinct small corrections; overlapping area reports point at the same canonical correction.

| Card | Priority | Correction | Evidence |
|---|---|---|---|
| X303 | P1 | Bind auth refresh, fetch and upload replay to the initiating session | [CONTRACTS F1](CONTRACTS.md) |
| X304 | P1 | Guard CRUD results, rollback and retry by account generation | [CONTRACTS F1](CONTRACTS.md) |
| X305 | P1 | Bind queued executor and guardian writes to their owner | [CONTRACTS F1](CONTRACTS.md) |
| X306 | P2 | Load and save view preferences for the current account | [SHELL F5](SHELL.md) |
| X307 | P1 | Separate Concierge history, extraction and broadcasts by account | [TOOLS F2](TOOLS.md) |
| X308 | P1 | Give pending media and recovery an account ownership boundary | [MEDIA F2](MEDIA.md) |
| X309 | P1 | Repair durable parent references before declaring media migrated | [MEDIA F1](MEDIA.md) |
| X310 | P1 | Keep local cache failure separate from server save outcome | [CONTRACTS F2](CONTRACTS.md) |
| X311 | P2 | Serialize standalone singleton saves and response application | [CONTRACTS F3](CONTRACTS.md) |
| X312 | P1 | Enforce one estate root and atomic profile merge across contexts | [SCHEMA F1,F2](SCHEMA.md) |
| X313 | P1 | Treat legacy credit-card and loan rows as liabilities | [SCHEMA F3](SCHEMA.md) |
| X314 | P1 | Capture failed form draft and media in Retry callbacks | [FINANCES F1](FINANCES.md) |
| X315 | P1 | Await timeline, family and archive saves before dismissing drafts | [LEGACY F1,F2; MEDIA F3](LEGACY.md) |
| X316 | P1 | Base letter readiness on a resolvable recipient and preserve old names | [LEGACY F4](LEGACY.md) |
| X317 | P1 | Preserve Unicode names and prose in every generated PDF | [HANDOVER F1; LEGACY F3](HANDOVER.md) |
| X318 | P1 | Include property evidence and cover media in handover attachments | [HANDOVER F2](HANDOVER.md) |
| X319 | P1 | Make failed packet files retryable and partial downloads explicit | [HANDOVER F3](HANDOVER.md) |
| X320 | P1 | Reconcile full-copy scope with saved advanced records and executor notes | [HANDOVER G1](HANDOVER.md) |
| X321 | P2 | Count the sole recorded recipient as a real contact in readiness | [HANDOVER F4](HANDOVER.md) |
| X322 | P2 | Read analytics guardian facts from actual enrolled contacts | [HANDOVER F5](HANDOVER.md) |
| X323 | P2 | Wait for every readiness source before scoring or redirecting | [HANDOVER F7](HANDOVER.md) |
| X324 | P2 | Retain executor welcome draft and recovery on failed account save | [HANDOVER F6](HANDOVER.md) |
| X325 | P1 | Preserve newer recipient-note edits against late save replies | [SHELL F2](SHELL.md) |
| X326 | P1 | Make contact and relationship removal atomic | [SHELL F3](SHELL.md) |
| X327 | P1 | Keep marketing intent separate from authenticated account registration | [SHELL F1](SHELL.md) |
| X328 | P2 | Provide fresh options or a truthful continuation for passkey retry | [SHELL F4](SHELL.md) |
| X329 | P1 | Preserve signs for negative ordinary account balances and shares | [FINANCES F2](FINANCES.md) |
| X330 | P1 | Share legacy subscription cadence rules with every output | [FINANCES F3](FINANCES.md) |
| X331 | P2 | Round subscription monthly equivalent after summing annual values | [FINANCES F4](FINANCES.md) |
| X332 | P2 | Apply one-save guards to remaining family, funeral and Full Record forms | [FINANCES F5; LEGACY F6](FINANCES.md) |
| X333 | P2 | Handle digital-account closure save rejections at the control | [FINANCES F6](FINANCES.md) |
| X334 | P2 | Expose saved utility account and support-phone fields in Home Manual | [FINANCES F7](FINANCES.md) |
| X335 | P1 | Bind heirloom save to completion of its selected photo upload | [FINANCES F8](FINANCES.md) |
| X336 | P2 | Keep capsule drafts open when device storage refuses Save Draft | [LEGACY F5](LEGACY.md) |
| X337 | P2 | Keep today's recurring dates in the current year's upcoming list | [LEGACY F7](LEGACY.md) |
| X338 | P2 | Describe scripted learning outlines as the written guides they are | [LEGACY F8](LEGACY.md) |
| X339 | P2 | Show saved gallery media identity and recovery after file-load failure | [MEDIA F4](MEDIA.md) |
| X340 | P2 | Complete document attachment abandonment, replacement and removal lifecycle | [MEDIA F5](MEDIA.md) |
| X341 | P2 | Make external-archive actions visible during keyboard focus | [MEDIA F6](MEDIA.md) |
| X342 | P1 | Distinguish local-outbox saves from provider-accepted Pulse emails | [PULSE F1](PULSE.md) |
| X343 | P1 | Send all-clear to actually alerted early personal-wait guardians | [PULSE F2](PULSE.md) |
| X344 | P1 | Make Pulse transparency and release email claims match actual access | [PULSE F3; supplemental template claims](PULSE.md) |
| X345 | P1 | Expose guardian vault read failures with independent retry | [PULSE F4](PULSE.md) |
| X346 | P2 | Retry unfinished earlier Pulse tiers after global progression | [PULSE F5](PULSE.md) |
| X347 | P2 | Separate Pulse tier progression from actual contacted membership | [PULSE F6](PULSE.md) |
| X348 | P2 | Align Rest Mode copy and expired state with its actual pause behavior | [PULSE F7](PULSE.md) |
| X349 | P2 | Serialize Pulse settings edits and capture rollback state | [PULSE F8](PULSE.md) |
| X350 | P2 | Give Pulse owner history, messages and transparency visible failure recovery | [PULSE additional owner-page error paths](PULSE.md) |
| X351 | P1 | Remove fabricated missing-provider grief discovery results | [TOOLS F1](TOOLS.md) |
| X352 | P2 | Consume the AI service's normalized action intent | [TOOLS F3](TOOLS.md) |
| X353 | P2 | Restore locally redacted facts before accepting AI writing suggestions | [TOOLS F4](TOOLS.md) |
| X354 | P2 | Describe QR packs by their actual authenticated destinations | [TOOLS F5](TOOLS.md) |
| X355 | P2 | Base Future Scenarios assertions on recorded facts and source membership | [TOOLS F6](TOOLS.md) |
| X356 | P2 | Reload generic hub checklist state when the route module changes | [TOOLS F7](TOOLS.md) |
| X357 | P2 | Keep failed sample removals tracked and report accurate purge results | [TOOLS F8](TOOLS.md) |

## Completion reconciliation

The affected B/C/D/E/U/G/T/X sections and current Release acceptance are marked reopened. A, the recorded O1/O2 work, the historical R0 run, and V's earlier colour evidence remain recorded with their original scope; this review did not manufacture a new failure of those measurements. The historical completion-test rows in the roadmap remain explicitly historical, while its current status points here.

The 29 reopened parent cards are: B3, B4, B5, C2, C3, C7.1, C10, D1, D2, D3, D4, E11, G2, G3, G4, G5, G6, G7, G9, G12, G14, G15, G16, G18, G19, U21, X215, X230, X36. Their linked X cards own the repairs; redispatching both would duplicate work. X154's accepted display-tier mapping is still present. Its related early-individual all-clear omission is new companion work under X343, not evidence that the mapping itself reverted.

The inventory also corrects the earlier handoff's 494-row count: the source snapshot has 496 marked card-status rows (excluding headers), and the reconciled plan has 551 after adding 55. Status IDs are unique. This bookkeeping correction does not add application defects or imply 551 independent open issues.

## Owner deferrals and separate verification limits

X6 key rotation and X141 Railway config apply before 2026-12-01 remain owner follow-ups. Existing holds remain unchanged: independent family estates/ProfileSwitcher direction, executor-home consolidation, recipient caller notes, calendar merger, letter ethical-will/role-order choices, public family QR scanning, upload-size policy, utility-instruction/custom-field schema expansion, mobile completion, broader security/admin/infrastructure/commercial work. The full-copy optional-record boundary is called out under X320 rather than silently expanding it into internal tables.

The review did not sign into production, inspect owner records, run PostgreSQL concurrency, render/export actual PDFs, capture working-interface screenshots, verify legal/medical sufficiency or external links, exercise real WebAuthn hardware, or send real email. Authenticated live verification still needs an owner-provided test account following X5. A documentation-only review does not justify another whole-suite/build run; no new release success is claimed.

## Highest-value next corrections

1. Repair the account/session ownership boundary first (X303–X309), then verify delayed requests, retries, queues and files across A/B switches.
2. Repair save-result/draft/concurrency integrity (X310–X315 and X325/X326), with focused quota, reversed-order and failed-save scenarios that confirm independent reload.
3. Repair handover text/file/value parity (X317–X320, X313/X329/X330), then verify the same source records, names, complete prose, bytes and membership across owner, recipient and all outputs.

These are recommendations for the next implementation task. This review did not authorize automatic fixing, deployment or recurring work.
