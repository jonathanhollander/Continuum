# Legacy journeys — plan cross-check

**Last Updated:** 2026-10-26 15:25 EDT

**Source reviewed:** `8751f224b2a1bf0d915940f61242829d08964d18` (`main`). Review and documentation only; application source was unchanged.

## Scope and method

Reviewed the live legacy-writing, date, funeral and family-memory paths against C3/C4/C5, B4's failure-state invariant, G5/G7/G8/G9/G14, relevant U/X follow-ups and the owner deferrals in `ORCHESTRATOR_HANDOFF.md`. CodeGraph was used before locating/reading source. Trimmed function bodies and relevant render/control sections were read directly where necessary. Findings below identify current executable paths, rather than treating every old comment or unused import as a defect.

Three inline Node invocations extracted the actual source functions into isolated synthetic callbacks to verify deterministic behavior. They did not load Svelte, start the application or scheduler, access a database, use network requests or send messages. These are function-level proofs, not browser or full API verification. No new test/script file was written.

The shared SyncManager's failure toast retains an operation snapshot and offers Retry. Therefore premature editor clearing below is a visible-draft/state-handling defect and uncaught caller rejection; it is **not** described as proof that every failed save is irrecoverable or that Retry is absent.

## Route coverage

| Route | Source paths traced | Result |
|---|---|---|
| `/modules/letters` | Page creation/reopen/recipient/hold/trigger/print/PDF paths; `letterStore`; `Letter`; recipient filter; `LetterAssistant` and writer functions | F3/F4; deliberate U-e/U-f choices remain deferred |
| `/modules/legacy-journal` | Reflection create/edit/search/custom fields; `journalStore` mapper/adoption; EthicalWill, LifeLessons and AccomplishmentsGallery | Main journal writes await results and retain the editor on rejection; accomplishment editing intentionally links to Timeline |
| `/modules/time-capsule` | New/edit/release/reader/video/draft code; `timeCapsuleStore` mapper, release rule and media metadata; model and recipient filter | F5; sealing/editing have awaited writes and a saving guard |
| `/modules/timeline` | Save/edit/remove/contact/track state; `timelineStore` and model | F1; track and assigned-contact fixes remain present |
| `/modules/anniversary-manager` | Create/edit/recurrence/custom fields/date controls and upcoming list; shared calendar mapper/store | F7; save awaits the API |
| `/modules/calendar` | Calendar alias/date/template conversion, create/edit/remove and cross-links; calendar model | F7 shared dependency; current save catches rejection before form reset |
| `/modules/funeral` | Budget create/edit/remove/averages; singleton mapper/store; FuneralWizard save/debounce/unload paths | F6; rollback behavior on failed wizard autosave was explicitly accepted by X55/X61/X72, so it is not relabeled as a new omission |
| `/modules/funeral/traditions/[type]` | `guideFor` and page display against tradition datasets | Each known wizard tradition has a long guide or an explicit short guide; no proven missing guide |
| `/modules/family-hub` | Memory form/wizard/upload/slideshow/journey; family/visual-memory stores; FamilyTreeGraph and EducationalResources | F2/F6/F8 |

This is functional source coverage of the listed pages and dependencies. It does not certify every CSS rule, every language translation or every browser state. Detailed export/attachment and shared synchronization audits are handled by the other review areas.

## Confirmed findings

### F1 — P1: Timeline closes and clears its editor before saving succeeds

**Plan cross-reference:** B4 and the persistent-draft invariant; Timeline journey reviewed in U9/G19/X99/X234/X294. This is an additional save-state gap, not evidence that those individual layout/field fixes are absent.

**Evidence:** `frontend/src/routes/modules/timeline/+page.svelte:83–98` calls `timelineStore.updateEvent` or `addEvent` and then immediately `resetForm()`, without awaiting/catching either promise. `resetForm` at lines 110–124 closes the modal and replaces all fields/custom fields with defaults. `timelineStore.svelte.ts:33–41` returns the real SyncManager promises.

**Trigger and impact:** create or edit a long event while POST/PUT is slow or rejected. The editor closes before the request settles; rejection leaves the editable draft cleared and its promise unhandled at this caller. The shared toast can retry the retained operation, but the user cannot revise the visible rejected draft or see it remain open.

**Function-level proof:** the extracted `saveEvent()` was invoked with a deferred save promise. Output: `Timeline resets before save settles: 1`; rejecting the promise afterward did not change the already-cleared form state.

**Smallest fix:** await the save; keep fields/custom fields and the dialog on rejection, catch the caller rejection, and close/reset only on success. Use an in-flight guard and the existing retry contract.

**Acceptance:** a held create/update leaves the editor open; a 500 keeps all words/custom fields editable with one notice; retry produces one record/update and closes only after success.

### F2 — P1: Family graph and memory wizard also dismiss drafts before their writes settle

**Plan cross-reference:** B4/C8, X60 (wizard completion), U5 (family graph), G14 (family journey).

**Evidence:** `frontend/src/lib/components/family/FamilyTreeGraph.svelte:120–124` calls `familyStore.addMember/updateMember` then sets `draft = null`. The store returns promises at `familyStore.svelte.ts:110–111`. `frontend/src/routes/modules/family-hub/+page.svelte:123–140` calls `addFamilyMemory` without awaiting/catching and immediately changes `viewMode` to `dashboard`; `visualMemoryStore.svelte.ts` returns `familyManager.create` from `addFamilyMemory`.

**Trigger and impact:** reject the contact save from the graph or the favorite-memory save at the end of the wizard. Both callers dismiss the editable input before knowing the result and leave rejected promises uncaught. Shared Retry can retain/replay the operation snapshot; this finding concerns the lost visible editing state and misleading completion transition, not absence of Retry.

**Function-level proof:** extracted functions with pending writes returned `Family graph draft before save settles: null` and `Family wizard view before save settles: dashboard`.

**Smallest fix:** make these completion handlers async, await and catch the save, retain the local draft/answers on failure, and dismiss only on success. Prevent repeated submission while pending.

**Acceptance:** forced 500 on graph add/edit and wizard memory save leaves the corresponding input available; retry saves one complete row and only then exits.

### F3 — P1: Standalone letter PDF deliberately destroys non-Latin text

**Plan cross-reference:** C3 full letter preservation; G5 added standalone Print/PDF; the handover invariant requires full text and names to survive useful copies.

**Evidence:** `frontend/src/routes/modules/letters/+page.svelte:212–218` converts all characters outside `\x00–\xFF` to `?` before passing the letter to jsPDF's built-in Times font. The page preserves the same characters in its editor, save payload and browser-print HTML.

**Trigger and impact:** download a letter containing Hebrew, Russian or other non-Latin-1 names/text. The PDF replaces the author's words with question marks, creating a material mismatch with the saved letter.

**Function-level proof:** the source-extracted transform changed `שלום, сын. Love, אבא.` to `????, ???. Love, ???.`.

**Smallest fix:** use a Unicode-capable embedded font/layout or a browser-rendered PDF path preserving the same text; address RTL rendering for Hebrew rather than merely replacing glyphs.

**Acceptance:** a mixed Hebrew/Russian/English letter and recipient/owner names remain readable in the downloaded PDF and agree with the saved editor and print version. Verify both rendered glyphs and extracted text where supported.

### F4 — P1: A letter with no reachable recipient is counted and labeled ready for their view

**Plan cross-reference:** C3 named recipient, D2 recipient matching, G5 and counts/readiness truth.

**Evidence:** `letters/+page.svelte:109–129` validates content only; leaving the select at its default writes `recipientName: ""` and `recipientContactId: null`. The default is an available option at lines 540–545. `readyCount` is every nonheld letter at lines 73–76, and the nonheld explanation at lines 1214–1216 says it is ready in their view. `backend/routers/recipient.py:81–92` includes letters only when a stored contact ID matches or their stored name matches the particular recipient; an empty name/ID matches none.

**Trigger and impact:** save a personal letter without choosing a contact. The owner sees it counted as ready, while every recipient page filters it out. Reopening an older name-only letter with a name that no current contact matches also leaves the picker blank (`viewLetter`, lines 275–277); saving rewrites that recorded recipient name to an empty string.

**Smallest fix:** preserve drafts with incomplete recipient selection, retain an existing unmatched recipient name until deliberately changed, and derive readiness from an actual resolvable recipient plus hold state. Use truthful wording for unassigned/institution-template drafts instead of implying a reachable recipient view.

**Acceptance:** unassigned letters save as drafts without a ready claim; selecting the intended recipient makes that person's preview include the full letter; removing or renaming a contact does not silently erase the recorded recipient name on a subsequent edit. Verify header/card states and recipient membership together.

### F5 — P2: “Save Draft” silently closes the capsule editor when browser storage rejects the write

**Plan cross-reference:** G7's claimed per-account Save Draft persistence and the save-state/draft invariant.

**Evidence:** `frontend/src/routes/modules/time-capsule/+page.svelte:75–84` catches `localStorage.setItem` errors but still sets `showAddModal = false`, with no notice or retry. The saved browser key is the only draft persistence path (`restoreDraft`, lines 93–101); the Save Draft control is shown at lines 842–849.

**Trigger and impact:** browser quota exhaustion or blocked storage. The editor closes after the apparent Save Draft action, although no persistent draft was written. In-memory words remain until navigation/reload; then the draft is lost.

**Function-level proof:** source-extracted `saveDraft` with a throwing `setItem` returned `Capsule editor remains open after storage rejection: false`.

**Smallest fix:** close only after successful storage; on rejection keep the draft/editor open with an honest notice and usable retry/copy option. Avoid promising device persistence when unavailable.

**Acceptance:** storage rejection leaves all draft text, recipient, trigger and media reference visible/editable; a later successful retry survives reload under the same account.

### F6 — P2: Family memory and funeral budget forms lack the in-flight save guard applied elsewhere

**Plan cross-reference:** X149's duplicate-submit mitigation covered 16 named forms but omitted these two active forms; G14/G8 share the general one-save-per-action expectation.

**Evidence:** `family-hub/+page.svelte:143–205` awaits the memory create but has no saving flag; its button at lines 441–445 is always enabled. Two clicks before the first resolves each reach `addFamilyMemory`. `funeral/+page.svelte:60–64` likewise has no in-flight guard; its button at lines 592–595 disables only for an empty name. Each new expense allocates a new UUID before updating the budget at lines 98–120.

**Trigger and impact:** repeated clicks while saving can produce duplicate family memories and overlapping expense updates/duplicate expenses. The shared manager does not deduplicate distinct creates by content.

**Function-level proof:** two calls to the source-extracted Family Hub save handler with its first create still pending yielded `create calls: 2`. The funeral path was source-traced, not runtime-probed.

**Smallest fix:** wrap both handlers with the established saving guard, disable and announce the pending state, and ensure retries use the same guard.

**Acceptance:** hold the first create/update response and click Save repeatedly; only one mutation is sent and one item is recorded. A failed save retains the form, and one retry saves exactly one item.

### F7 — P2: Today's recurring dates roll to next year immediately after midnight

**Plan cross-reference:** G9 shared date behavior and X227's upcoming-date work.

**Evidence:** `frontend/src/lib/stores/calendarStore.svelte.ts:169–188` creates `eventDate` at local midnight and compares it to `now` including the current time. For any recurring event today, `eventDate < now` is true throughout the day, so the computed next date becomes the next year. Important Dates renders the resulting `upcomingEvents` list.

**Trigger and impact:** visit Important Dates on the birthday/anniversary itself. That day's event is assigned next year's date and sorted away from the immediate upcoming position.

**Function-level proof:** the extracted actual callback with local time `Mon Oct 26 2026 12:00:00 GMT-0400` and a recurring `10-26` event returned `Tue Oct 26 2027 00:00:00 GMT-0400`.

**Smallest fix:** compare calendar days by normalizing today to local midnight (or compare date keys), preserving the current day until it has ended.

**Acceptance:** yesterday/today/tomorrow recurring events yield next-year/current-year/current-year dates respectively, with today's date first among current upcoming events; one-time dates retain their recorded year.

### F8 — P2: The Family learning center still presents written outlines as playable videos

**Plan cross-reference:** U21 identified video claims over script-only material and corrected the outer badge; positive truthful wording and stub review.

**Evidence:** `frontend/src/lib/components/family/EducationalResources.svelte:25–38` defines “Introduction Video Series” with durations and a `script[]`, not a video source. Cards display play icons and durations at lines 118–132. Their handler only sets `activeVideo`; the modal at lines 182–195 displays “Video Transcript / Outline” and the script strings. The Family Hub imports and renders this component; it is active UI.

**Trigger and impact:** a family member follows what appears to be a video lesson but receives a production outline, including timestamped section notes referring to the old hub architecture. Removing the outer video count did not make these remaining affordances accurate.

**Smallest fix:** present the existing usable written material as guides/outlines with matching labels/icons and remove invented playback durations. Actual video production would be a separate owner scope decision.

**Acceptance:** the learning center accurately describes the material it opens; every advertised media type exists and the guides refer to the current interface. No new video feature is required to fix the misrepresentation.

## Boundaries and exclusions

- Ethical-will duplication/role-based ordering (U-e/U-f) and merging Important Dates with calendar are explicit owner deferrals, not new defect findings here.
- A stored letter trigger is informational; this review does not demand an unapproved automatic-mail delivery system. Held letters and unreleased capsules are filtered server-side by the existing recipient rules.
- `FuneralWizard`'s deliberate rollback to saved values after rejected autosave is recorded acceptance in X55/X61/X72; a different draft UX requires deliberate reconciliation with that decision.
- The AccomplishmentsGallery imports Timeline state without its own `sync()` call, but shared layout/registration may initialize it. Missing a local call alone is not proof of a cold-load defect; no finding is made without that trace.
- Family photo upload without a module uses the older server-saved compressed data-URL path. This is a cross-area archival/export concern for the media/handover reviewers, not proof by itself of browser-only storage.
- Writing-helper placeholder rehydration is being reviewed in the tools area. This report does not duplicate it.
- No browser rendering, full Svelte interaction, live sign-in, production database execution, external AI request, real media upload or real delivery was tested in this source pass. There is no new whole-site success assertion.

## Commands/evidence

- CodeGraph queries for named pages/stores/models/helpers and their callers.
- Targeted `sed`, `nl` and `rg` reads after CodeGraph returned trimmed bodies, plus plan-row searches.
- Three `node --input-type=module` heredocs extracting live source functions; all outputs shown above. TypeScript-only annotations were removed from extracted callbacks; behavior statements were not rewritten. Deferred/throwing callbacks and a fixed Date supplied the synthetic conditions.
- No application source, test file, fixture or runtime dependency was changed.

## Canonical follow-up references

Progress and implementation status live only in [RECOVERY_EXECUTION_PLAN.md](../../RECOVERY_EXECUTION_PLAN.md). These are evidence cross-references, not another task board.

| Canonical card | Evidence reference |
|---|---|
| X315 | LEGACY F1,F2; MEDIA F3 |
| X316 | LEGACY F4 |
| X317 | HANDOVER F1; LEGACY F3 |
| X332 | FINANCES F5; LEGACY F6 |
| X336 | LEGACY F5 |
| X337 | LEGACY F7 |
| X338 | LEGACY F8 |
