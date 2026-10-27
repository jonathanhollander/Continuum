# Public pages, optional tools and AI — plan cross-check

**Last Updated:** 2026-10-26 15:25 EDT

**Source reviewed:** `8751f224b2a1bf0d915940f61242829d08964d18` (`main`). Application source was read only. This report is evidence for the canonical execution plan, not another task board. Local F identifiers are references for the orchestrator to reconcile and assign canonical cards.

## Scope and method

Reviewed the assigned route logic, its relevant rendered states and the supporting store/service paths against E2/E5, G16–G18, B4/B5 and their X/T/V follow-ups. CodeGraph was used before source location/reads; targeted reads filled omitted source sections. Existing plan completion marks were treated as claims to check.

Two isolated inline harnesses exercised the actual source with synthetic globals, without a server, database, browser profile, AI request or external email. No application files, dependencies, worktrees or test/script files were changed. There was no browser layout/contrast/keyboard verification, production access, full build or suite run in this review.

| Assigned surface | Code coverage and result |
|---|---|
| `/`, `/marketing2` | Signup CTA handlers and rendered progression, account-keyring calls, primary links and claim-bearing copy inspected. Pre-auth account mutation is owned by **SHELL F1**, not duplicated here. |
| `/marketing2/how`, `/marketing2/features`, marketing layout | Navigation/CTA destinations, localized content derivation, reveal and reduced-motion/view-transition behavior inspected. No separate confirmed implementation omission from this trace. |
| `/modules/qr-codes` | Pack generation, asset label paths, local persistence/account reset, printing/removal and rendered access claims traced. F5. |
| `/modules/scenario-mode` | All readiness inputs, conditional assertions and PDF destination traced. F6. |
| `/modules/simulator` | Real-store reads, wallet/medical/passing checks, result messages and reset inspected; simulation is intentional and labeled. Source does not establish real legal validity. |
| `/modules/treasure-hunt` | External search button and Financial Accounts return link inspected. Actual handler opens `unclaimed.org`; no dead-control finding. |
| `/modules/builders-console` | Checklist/task links, status toggle persistence, complexity manager and progress derivation inspected. No new primary issue beyond shared save-contract concerns. |
| `/modules/activity-log` | Initialization/filter/export/remove paths, store interaction, counts and own-scope copy inspected. No new primary issue beyond shared-store concerns. |
| `/resources/grief-support` | AI thread/error/retry, resource rendering, local-discovery service and endpoint traced. F1. Existing hotline data was inspected as source only, not independently verified as current advice. |
| `/tools/ai-audit` | Findings derived from shared audit issues and score, loading checks and action destinations inspected. Metric defects are owned by HANDOVER review. |
| `/admin` | Actual ScenarioMode, ReadinessMatrix and session UserActivityLog components inspected; readiness semantics delegated to HANDOVER. |
| `/admin/automation` | Persisted rule toggles, WebhookConfig and saved-only wording inspected. Lack of an automation/webhook execution engine is an intentional recorded limitation; no proposal to build that deferred infrastructure here. |
| `/admin/health` | Shared audit projection and raw output inspected; underlying metric coverage delegated to HANDOVER. |
| `/admin/ui-audit` | Saved profile checkbox path and keyboard toggles inspected; this is a manual checklist, not an automated visual audit. |
| `/modules/[id]` | Registry lookup, vault redirects, generic ModuleContent step state and links traced. F7. |
| Shared AI/writing/voice path | Proxy request/response, sanitizer, writer text return, ConciergeEngine/panel and voice hand-off inspected. F2–F4. |
| Settings sample-data tool, added by coordination | `testDataFactory.purge` → shared delete failure → registry clearing traced. F8; shell owns surrounding Settings/Data review. |

## Confirmed findings

### F1 — P1: local grief discovery fabricates practitioners when its provider is absent

**Evidence class:** source-confirmed and isolated execution. **Plan references:** G18, T0, X250 and the positive/truthful wording requirement; this is a missed live mock path, not a request to add a provider.

`backend/routers/support.py:33–51` returns two invented results when `TAVILY_API_KEY` is absent: a location-personalized “Local Grief Center” and “Compassionate Walkers”, with `example.org` URLs and numerical scores. `supportService.ts:17–22` returns that response unchanged. `resources/grief-support/+page.svelte:166–175` accepts it as discovered local support; lines 372–378 promise local practitioners and lines 418–443 render the supplied names/descriptions/links. The response and rendered result cards have no sample marker.

**Trigger/impact:** someone searches for nearby grief support on an unconfigured installation. The feature presents fictional providers and a fictional weekly meeting as real search results, wasting the reader's effort at a sensitive moment.

**Smallest correction:** return the existing truthful unavailable response (or an explicitly empty result state) when the provider is absent; preserve the typed location and retry path. Do not fabricate resources or add infrastructure to resolve the wording defect.

**Acceptance:** missing provider gives zero invented practitioners/URLs and a clear usable state; an intercepted genuine-provider response still renders its actual results. No messages or paid provider call required for the check.

Isolated AST execution of the actual endpoint body with `os.getenv` and settings returning no key produced:

```text
missing-provider result count: 2
result URLs: ['https://example.org/local-support', 'https://example.org/groups']
example/simulated marker: False
```

### F2 — P1: Concierge conversation and extracted data are shared across accounts

**Evidence class:** source-confirmed and isolated real-module execution. **Plan references:** B5/B5.1, X56/X62 account-isolation invariants. This is functional account correctness, not an expansion into security hardening.

`frontend/src/lib/stores/conciergeEngine.ts:75–106` loads and saves messages and extracted data under the single `continuum_concierge_state` key; lines 113–121 broadcast/merge them on the single `continuum-concierge` channel. `activeAccountId` is imported at line 4 but never subscribed to. No reset is invoked on account change. At lines 332–334 the retained messages become the next request's AI history; lines 394–402 append a resolved response without checking which account originated it.

**Trigger/impact:** A converses or extracts draft details, then B signs in on the same browser. B sees/uses A's conversation; an in-flight A reply can also settle into B's current state. On another tab the same global channel can overwrite its thread. Account-separated record stores do not isolate this singleton.

**Smallest correction:** namespace conversation state and channel messages by authenticated account, reset/load it on account change, and disregard responses/broadcasts from an earlier account generation. Preserve each account's own local conversation.

**Acceptance:** A/B switch and two-account tabs keep distinct histories/extractions; a delayed A response does not alter B; reload restores only the active account's history.

The isolated TypeScript-module harness used a synthetic A conversation, switched the injected `activeAccountId` store to B and observed:

```text
messages after A→B: [ 'Account A synthetic story' ]
account-scoped state keys: [ 'continuum_concierge_state' ]
```

The first harness invocation stopped because its hand-written `writable` shim incorrectly relied on a method's `this`; the corrected closure-based shim produced the output above. That harness exception was not an application defect. No real account state was loaded.

### F3 — P2: normal parsed AI navigation intents never reach the Concierge action handler

**Evidence class:** source-confirmed and isolated real-module execution. **Plan references:** G18 functional AI/tool path, X218 real AI wiring, X118 role/context consolidation.

`aiConciergeService.ts:158–168` parses JSON and returns `{content: parsed.message, extractedData, intent, resources}`. `conciergeEngine.ts:341–377` only handles navigation or `suggest_break` when it parses another JSON object out of `response.content`. It never checks the normal `response.intent` field. With an ordinary JSON response, `content` is already the plain message, so this branch is skipped.

**Trigger/impact:** a normal assistant response says it is opening Contacts (or another mapped module) and carries `intent: 'add_contact'`; the module remains unchanged. The implemented intent map is disconnected from its real producer. Resource and extraction fields are handled separately, so this is narrower than the whole chat being broken.

**Smallest correction:** consume the typed parsed `response.intent` through the existing action map; keep any raw-JSON compatibility fallback in one normalized path.

**Acceptance:** a mocked normal parsed response navigates once to the mapped route; `suggest_break` reaches the pause handler; plain prose with no intent changes no route. The same isolated engine harness returned `{content: 'Opening your contacts.', intent: 'add_contact'}` and observed `plain parsed response intent navigation count: 0`.

### F4 — P2: accepted AI rewrites can permanently replace author details with redaction placeholders

**Evidence class:** source-confirmed data path; real-model output not requested. **Plan references:** C3/C4, G5, X218; writing help must preserve the author's facts and offer review before replacement.

`aiConciergeService.ts:23–29` runs every user message through `sanitizeInput`. `utils/sanitize.ts:8–18` replaces phone/email/account/SSN patterns with fixed `[REDACTED_*]` strings. `writerService.ts:33–37,66–71` explicitly asks the model to retain these placeholders, and `cleanLetter` only removes code fences. No original-value map is retained or restored. `SmartTextarea.svelte:91–96` replaces the field with the suggestion on acceptance; the letter helper uses the same writer return path.

**Trigger/impact:** polishing a letter or caller note containing contact details produces placeholder text which can be accepted and then saved/exported. Review is present, but factual preservation is incomplete and the author must reconstruct the removed details manually.

**Smallest correction:** preserve a per-request local reversible mapping with distinct placeholders, then restore matching original values before showing/applying the suggestion. Keep actual values out of the outbound AI payload.

**Acceptance:** intercepted rewrite of two different phone/email values preserves each original value in the reviewed and accepted result while the outbound request contains neither value; the original field remains unchanged until acceptance.

### F5 — P2: QR packs still claim encryption and access grants that their generated links do not implement

**Evidence class:** source-confirmed. **Plan references:** E2, X222, X250, X262. Public/family QR access remains owner-deferred; this finding requests truthful current descriptions, not that new capability.

`qrStore.ts:31–49` describes Family Essentials as limited access to selected modules and Executor Master as full access. Lines 55–78 encode only the ordinary same-origin `/dashboard` or `/executor` address; `modules` is display metadata and is not used to generate or enforce access. `qr-codes/+page.svelte:126` still says “Generate encrypted access keys” and “give your executor instant access”; lines 527–531 say the Executor pack “grants access to sensitive data”. The shared header sends that description to its rendered GuidanceBlock (`LivingBlueprintHeader.svelte:95–96`).

**Trigger/impact:** an owner prints a QR pack believing it conveys encrypted/scoped family access. It provides an authenticated navigation shortcut instead; a fresh reader does not obtain the stated access from the code. The owner can make a misleading handover assumption.

**Smallest correction:** describe the current authenticated navigation/preview codes and their actual destinations positively. Use the working recipient-link handover path when offering recipient access; leave public QR permissions deferred.

**Acceptance:** decode both pack QRs and compare the rendered claims with those actual links; no encryption/scoped-access promise remains unless implemented and independently proven.

### F6 — P2: Future Scenarios asserts verified instructions and awareness from record counts alone

**Evidence class:** source-confirmed. **Plan references:** D4, G18, X250/X262 truthful readiness; related underlying analytics findings belong to HANDOVER.

`scenario-mode/+page.svelte:45–51` sets `hasExecutor` from a nonempty executor name, `hasDigital` from `digitalCount > 0`, and `hasHeirlooms` from `heirloomCount > 0`. These inputs render “{name} knows their role” at lines 202–203, “Active: Instructions for all accounts” at lines 282–284, and “Verified: Pet & Object care instructions found” at lines 317–319. No instruction fields, pet records, recipient access or acknowledgment are checked. The goal strings at lines 57–73 make the same unsupported assumptions.

**Trigger/impact:** one digital account without instructions or one heirloom without care notes produces a success assertion about all accounts or pet care. Naming an executor is displayed as evidence that the person knows the role. These assertions overstate the usefulness of the handover.

**Smallest correction:** use positive record-presence wording matching the actual predicates, or derive richer predicates from the necessary fields and expose their membership/source records consistently. Do not infer awareness or legal validity.

**Acceptance:** name-only executor and instruction-empty digital/heirloom records show only recorded facts; fully documented records and their source drilldowns agree with the displayed checks and report destination.

### F7 — P2: generic hub checklist state does not follow a reused dynamic module route

**Evidence class:** source-confirmed lifecycle mismatch; browser parameter-navigation reproduction remains to be run. **Plan references:** G18, X282 (hub steps), saved-progress invariants.

`routes/modules/[id]/+page.svelte:14–29` updates the selected module reactively and passes it into the same `ModuleContent` component without a keyed remount. `ModuleContent.svelte:57` updates `steps` when the module changes, but `completedSteps` is initialized from `readAll()[module.id]` only in `onMount` (lines 61–84). `touched` also remains set. `toggleStep` then saves that retained object under the current `module.id` (lines 86–93).

**Trigger/impact:** navigate in-app between the dynamic Preparation Hub and Executor Hub after ticking steps. The reused component can show the first hub's ticks/progress in the second; a subsequent toggle copies that state into the second module's saved checklist. Reload may appear to cure the display, masking the navigation-specific fault.

**Smallest correction:** key the component by module ID or reset/load per-module checklist state on ID changes, with an identity check for late synchronization results.

**Acceptance:** distinct saved checklists remain distinct through repeated client-side hub navigation, delayed initial reads and reload; editing one does not write its ticks into another.

### F8 — P2: sample purge forgets failed removals and loses their test-data tracking

**Evidence class:** source-confirmed; coordinated from SHELL. **Plan references:** X45, X239, B4.1 deletion outcomes.

`testDataFactory.ts:78–89` awaits each `sync.delete`, increments `deletedCount` on resolution and clears the whole test registry afterward. `SyncManager.delete` deliberately catches failed HTTP deletes, restores the record and returns normally at `sync.svelte.ts:636–657`. Therefore the factory's `catch` cannot detect that outcome. `settings/data/+page.svelte:139–146` purges, refreshes the now-empty registry and syncs rows again.

**Trigger/impact:** a sample's DELETE returns 500 or a network failure. The row stays on the server, but purge counts it as deleted and removes its test ID from tracking. It reappears after sync as an untracked normal record and subsequent sample purge no longer targets it. This is functional sample cleanup correctness, not a request for broader admin work.

**Smallest correction:** confirm removal using the manager's successful `onRemoved` callback or an explicit result, and remove only successful IDs from the registry; retain failed IDs for retry.

**Acceptance:** one successful and one forced-failed sample delete produce one removal, one retained tracked sample and accurate counts; retry removes the remaining sample and only then clears its registry entry.

## Intentional limitations and cross-review ownership

Public QR family scans, a webhook/automation execution engine, broader security/admin operations, commercial features and phone/tablet completion remain outside this review's implementation scope. Early-preview flags and explicit simulations are not defects by themselves. The shared audit's metric rules are reviewed in HANDOVER; marketing pre-auth keyring mutation is SHELL F1. No provider availability, real external links, hotline currency or legal/medical sufficiency was established by this source review.

Supporting files actually inspected include the assigned route files above and `qrStore.ts`, `acceptanceStore.svelte.ts`, `automationStore.svelte.ts`, `activityLog.svelte.ts` interface use, `auditStore.svelte.ts`, `keyringStore.ts`, `conciergeEngine.ts`, `aiConciergeService.ts`, `aiGriefService.ts`, `writerService.ts`, `voiceService.ts`, `overwhelmDetection.ts`, `supportService.ts`, `sanitize.ts`, `testDataFactory.ts`, shared `SyncManager.delete`/singleton contracts, `ModuleContent.svelte`, `LivingBlueprintHeader.svelte`, `SmartTextarea.svelte`, `AIPromptBar.svelte`, `ConciergePanel.svelte`, admin ScenarioMode/ReadinessMatrix/UserActivityLog/AutomationCard/WebhookConfig, `registry.json`, `backend/routers/ai_proxy.py`, `support.py`, `email.py` and `backend/services/email_service.py`. Email/Pulse-specific delivery correctness is owned by PULSE.

## Canonical follow-up references

Progress and implementation status live only in [RECOVERY_EXECUTION_PLAN.md](../../RECOVERY_EXECUTION_PLAN.md). These are evidence cross-references, not another task board.

| Canonical card | Evidence reference |
|---|---|
| X307 | TOOLS F2 |
| X351 | TOOLS F1 |
| X352 | TOOLS F3 |
| X353 | TOOLS F4 |
| X354 | TOOLS F5 |
| X355 | TOOLS F6 |
| X356 | TOOLS F7 |
| X357 | TOOLS F8 |
