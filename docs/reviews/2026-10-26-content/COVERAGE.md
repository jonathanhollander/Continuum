# X390 — recorded-information content

Last Updated: 2026-10-26 EDT. Implementation base: `249763c` on `codex/X390`.

The reviewed pages now describe the records or self-reported answers they actually check. Percentages, formulas, thresholds, record membership, navigation targets and loading/error/cached behavior are unchanged. Record presence no longer stands in for legal authority, freshness, guaranteed access, emergency readiness or a complete handover.

## Page purposes and sources

| Surface | Useful meaning now shown | Existing source |
|---|---|---|
| Analytics | Recorded Information; separate record-coverage score, Legal Records, Financial Records, Personal & Digital Records; practical descriptions of each check | `analyticsStore.ts` and `auditStore.svelte.ts` |
| Fire Drill | Six answers reported for this visit, not saved or verified; 6/6 does not establish that family has everything needed | Component-local six questions and answer booleans |
| Practice Run | Records Found for This Walkthrough / Questions to Review; names category/title checks and beneficiary-field threshold | Document Vault, open financial records, medical directives |
| Future Scenarios | Recorded people and lists; next item is the first missing check in a fixed list, not an emergency/legal priority | Existing four fact lists and source-record disclosures |
| Plan check-in (`/tools/ai-audit`) | Recorded Information Check; explicitly rule-based, not an AI analysis | Same six-area `estateAudit` result |
| Admin overview and matrix | Recorded Information Overview; Areas with Entries, not Total Completion | Existing ten-area `analyzeEstateHealth()` result |
| Admin Record Coverage | Score rules beside each section, existing named-contact proof, plus loaded source IDs/module links | The page's same `auditSources.sources`; no separate fetch or recount dataset |
| Admin record review list | Questions raised by record checks; issue count and list-size band, not record age/currentness | Same `estateAudit.issues` |
| Manual interface checklist | Saved personal checkmarks, not automated results or proof every page passed | Existing `admin_ui_audit` profile slice |

The added source disclosure explicitly lists **loaded rows before scoring filters**, so a closed account, debt, or unchanged default singleton cannot masquerade as a point-earning record. Existing contact names/details remain available. The source helper supplies IDs rather than names for the other lists; those IDs appear alongside actual module links, without invented per-record URLs.

Analytics' missing-topic list differs from its score checks (for example, the living-will checkbox has no matching topic). Its empty state therefore says **No gaps in this topic list**, and explains that the list is separate from the score. The score heading no longer uses “Pulse”; the actual check-in feature remains a separate topic. X391 owns the matching Pulse-page label/help and received the exact score meaning from this card.

## Verification

Approved temporary harness: `T-X390`, `/private/tmp/continuum-x390-proof.mjs`. It mounts the actual route components and actual stores with intercepted synthetic API responses; every external transport is blocked. It uses no owner database, mail, provider inference, production action or persisted application test. Global application navigation/access routing is outside this fixture. Admin captures use the existing dark surface/content-width classes; they omit the global sidebar.

**53 browser assertions passed, 32 baseline/after observations, zero browser page errors.** At 1440px it exercised all eight pages, with Fire Drill as the ninth surface, and captured before/after presentations. Additional 390px captures cover the longer analytics and coverage headings. The two headers stack on narrow screens; analytics help has a minimum rather than fixed height. Score/source logic was not changed for that layout adjustment.

Independent recount of the saved actual-store observations:

| Fixture | Six-area points | Displayed percentage | Legal / financial / personal+digital pillars | Ten-area matrix |
|---|---|---|---|---|
| Empty | 0 / 400 | 0% | 0 / 0 / 0% | 0% |
| Partial | 310 / 400 | 78% | 67 / 73 / 67% | 50% |
| Full score fixture | 400 / 400 | 100% | 100 / 100 / 100% | 90% |

Partial points are financial 60, insurance 50, contacts 50, medical 50, digital 50, legacy 50. The open zero-valued account counts; the debt and closed account remain excluded from the financial audit. The matrix counts a different ten-area population, including checked digital setup steps and filled funeral fields/budget lines. The full-score fixture returned no timeline row because its fixture key differed from `timeline_events`; 90% correctly reflects the actual loaded matrix population. This fixture limitation does not affect the six-area score or source-ID assertions.

All eleven disclosed source-ID lists agree with the actual readiness helper. The contact proof contains exactly synthetic contacts `39021` and `39022`; scenario facts retain executor profile source plus proxy `39031`, digital account `39051`, heirloom `39061`. Baseline and changed pages retain identical audit result/source membership. Six Yes answers yield 6/6; mixed answers yield 3/6. A held empty letter source leaves the score unknown; a 503 retains an error; retry confirms a genuine empty zero. No final zero is inferred from that failed read.

Evidence: `/private/tmp/continuum-x390/proof.json`, screenshots in that directory, `/private/tmp/continuum-x390-proof-resume.log`, and the final visual/check/build logs. Failed attempts are retained: the first fixture reused one Vite inline-module cache path across pages; the second capture was interrupted by source HMR; the third reached all matrix assertions but reopened the Fire Drill before its outro settled. Corrected/resumed proof retained completed observations. Visual-only followups settled transitions and reproduced the admin surface wrapper; they did not repeat the score matrix.

Final `npm run check`: **0 errors, 0 warnings**. `npm run build`: **passed**. `git diff --check`: **passed**. The local server/browser are stopped after each proof/capture run. Source was unchanged between the final functional observations and responsive/settled captures except for the two header layout classes; final check/build include those classes.

## Boundaries and remaining issue

- `exportService.ts`, `/export/preview` and `/binder` do not export these audit/pillar percentages or Fire Drill answers. Their separate document review/access states were not relabelled. No handover data or attachment membership changed. Existing scenario handover-preview link is retained.
- **Initial X390 finding, resolved in the X392 appendix below:** `frontend/src/routes/modules/simulator/+page.svelte`, `runSimulation`, awaits `Promise.allSettled` then reads current documents/accounts/directives without a source-specific unknown/error guard. Wording does not repair that pre-existing behavior; failed refreshes can still produce results from available store data.
- Content changes cannot establish legal validity, current financial facts, access or end-to-end handover completeness. API persistence and real recipient access were not retested by this presentation-only fixture.

Full sources read: the ten changed Svelte files; `analyticsStore.ts`, `auditStore.svelte.ts`, `auditReadiness.svelte.ts`, `readiness.ts`, `AuditSourceStatus.svelte`, admin `ScenarioMode.svelte` and layout. Narrow supporting paths read: source-store mappings/registrations, auth initialization and `syncAll`, dashboard/Pulse score consumers, and export document-state handling. CodeGraph was consulted first; its child-worktree warning led to exact worktree-source reads. No generated indexes were changed.

## X392 appendix — confirmed scenario sources

Last Updated: 2026-10-26 EDT. Base: X390 `9ed4fde`; branch `codex/X392`. This followup closes the simulator refresh limitation recorded above. Only `simulator/+page.svelte` and this appendix change.

Each run now waits for and confirms exactly its evidence: documents + financial accounts for wallet/passing, documents + medical directives for hospitalization. A source must have `lastSync` and `status === 'synced'`; `Promise.allSettled` alone is insufficient because the managers catch read errors. The medical profile is not a required source. Findings, category/title matching and the existing beneficiary threshold are unchanged.

A failed/unconfirmed read shows **Records Not Confirmed**, names the affected source modules and offers **Try Again**. It retains the selected scenario and existing manager cache without displaying a pass or missing-record conclusion. A successful empty response remains a valid empty finding. A run version and captured session invalidate late completions after Back, a newer run, unmount or account change; the account-change notice invites a fresh read for the current account.

The approved private X390 harness was extended behind `X392=1`, without adding a repository test. **19 focused browser assertions passed**, using actual component/managers/auth lifecycle and intercepted synthetic APIs: swallowed failure with empty/cache data, genuine empty success, same-scenario retry, passing financial gate, unrelated profile/account errors with successful medical evidence, late Back/new-scenario completion, and account switch followed by current-account retry. Zero page errors and zero mutation requests. The X390 score matrix was not repeated. One initial text assertion needed whitespace normalization; its full failure output is retained.

Evidence: `/private/tmp/continuum-x392/proof.json`, `/private/tmp/continuum-x392-proof.log`, and five inspected 1440px screenshots in that directory. Empty/cache failure presentations are intentionally identical; their saved actual-manager observations distinguish null/previous `lastSync` and preserved IDs. Final check: **0 errors, 0 warnings**; build and diff check passed. Browser and Vite server on port 36392 stopped. No real database, provider, mail, production action, application-setting change or deployment was involved. These remain presentation/source-manager proofs, not API persistence or recipient-access proofs.

## X396 appendix — analytics executor-profile source

Last Updated: 2026-10-26 EDT. Base: X390 `9ed4fde`; branch `codex/X396`. Only Analytics and this appendix change; X392's simulator work is independent.

The legal pillar also reads `estateProfile.executorName`, a source outside the audit's eleven lists. The page now waits for the existing profile store's confirmed `synced` state before displaying a definitive legal percentage/checkboxes. A successfully loaded contact list may independently prove a positive executor check, using the exact existing `findExecutorName({}, contactSync.items)` helper. An absent contact does not establish that an unavailable profile is empty. No formula or membership rule changes.

Profile loading/error text remains visible, and **Try Again** calls the existing `estateProfile.sync()`. Profile-dependent review topics also wait for confirmation because they read executor/beneficiary profile fields. The guardian gate remains; overall, financial and personal/digital figures retain their own existing source rules.

The approved existing private harness was extended behind `X396=1`: **13 focused browser assertions passed**, without repeating X390's matrix. With two directives and no executor contact, all eleven audit sources can load while the profile remains held/503: the UI displays an unknown legal figure, no missing-executor conclusion and no finalized profile topics. Retry with an actual successful empty profile gives the correct 67%. A confirmed executor contact retains 100% through held/failed profile reads, with an explicit source notice; successful-empty profile retry preserves that same contact membership. Unaffected scores/source IDs agree throughout. Zero runtime errors or mutation requests.

Evidence: `/private/tmp/continuum-x396/proof.json`, four inspected 1440px captures and `/private/tmp/continuum-x396-proof.log`. Final check: **0 errors, 0 warnings**; build and diff check passed. Browser/server on port 36396 stopped. No shared helper, API/model, production setting, private-access flag, database, provider, mail or deployment changed. As with X390, intercepted synthetic APIs prove UI/store behavior, not API persistence or recipient access. The separate admin-matrix source limitation remains deferred.
