# G0c-family-executor

**Last Updated:** 2026-10-26 08:35 EST

Reviewer report, saved verbatim (read-only review on main).

G0c gap review: family, contacts and recipient (read-only on main; nothing changed, nothing committed)

**Method.** I read every route in area (c) as owner, executor and recipient. I grepped the plan and skipped anything an existing card already covers: U4/U5/U21/U51/U85, U10/U11/U15/U22/X212, U32/X106/X116/X120, C7.2/C8/X83/X94/X162, D2/D3/X97/X107/X108/X156/U59/U67/U69, U8/X104/X123/X144/X202, X207/X208.

**Proof run.** I ran one script against `backend/routers/export.py::_attachments`: a medical directive whose file sits in `custom_attributes._media` (`{"_media":{"id":7,...}}`), with media row 7 present. Output: `attachments, missing = ([], [])`. The file never reaches the snapshot.

**Not done.** I did not run the app. A permission prompt denied `rm`, so the throwaway script `/private/tmp/claude-501/-Users-jonathanhollander-AI-Code-Continuum/798584f5-5f46-497f-a2f2-975a6b8ca86a/scratchpad/g0c_attach.py` is still there, and possibly `.../scratchpad/g0c.db`. Nothing is running.

## Per route

**/for/[token] and /for/preview/[contactId]** — for the recipient (the son); the preview is for the owner.
- X, recipient: the "You are named as executor" step links `#originals`, but that section renders only when there are originals. With none recorded, "See below" goes nowhere. `RecipientStartPage.svelte:177` and `:314`. Fix: add the href only when `originals.length`, else omit the link. Same for `#people` when every executor is "Kept private" (`:179`, `:108`).
- X, recipient: `recipient.is_executor` comes only from the contact flag (`recipient.py:163`). The contacts page cannot set that flag (see /modules/contacts). A son named as executor in the profile's `executor_name`, or with role "Executor", gets no executor step. `exportService.ts:472-475` also ignores role "Executor", while `analyticsStore.findExecutorName` (X145) honours it. Fix: one executor test for the recipient view and the packet: flag, role "Executor", or a name equal to profile `executor_name`.
- X, related to the D2 seed, recipient and owner: the "Caller Notes" placeholder says "Private notes for the caller (e.g. 'Be gentle, they are fragile')" (`contacts/+page.svelte:752`). Those notes print on every recipient's "People to reach" card (`RecipientStartPage.svelte:307`), so recipient A reads the owner's notes about recipient B. Fix: either leave `c.notes` off the start page (keep them in the full record), or drop "Private" from the placeholder. Owner's call; I recommend leaving them off the start page.
- X, owner: the signed-out preview state links `/login` without `?redirect=`, so after signing in the owner lands on /dashboard instead of the preview. `RecipientPageState.svelte:22`. Fix: `href="/login?redirect=/for/preview/{id}"` (login already reads `redirect`, `login/+page.svelte:26`).
- U, recipient at phone width: the start page has fixed `px-8` and `grid-cols-2` (`:256`, `:291`, `:387`), and originals use `grid-cols-[1fr_1.4fr]` (`:319`). At 390 px, contact cards are about 150 px wide and phone and email overflow. Someone opening a texted link is likely on a phone. Fix: `grid-cols-1 sm:grid-cols-2`, stack the originals grid, `px-4 sm:px-8`.
- T0: "Their final wishes are written down" (`:181`) — "their" is ambiguous on a page addressed to the recipient. Use `${OwnerName}'s`, or the existing "final wishes" wording with the owner's name.

**/executor (Estate Administration Hub)** — for the owner in the executor perspective, and an executor.
- X: the area cards and the tracker build Tailwind classes from strings (`bg-{area.color}-500/10`, `text-{area.color}-400`, `from-{statusColor()}-500`). Tailwind 4 only generates classes it sees literally. Grepping `src/`, these appear nowhere: `bg-cyan-500/10`, `text-cyan-400`, `bg-cyan-500`, `from-slate-500`, `bg-slate-500`, `hover:border-{rose,emerald,cyan,purple}-500/30`, `bg-blue-500/20`. Result: the Medical Wishes and Professional Help icons, the cyan progress fill, and the tracker bar below 30% (slate) render with no colour. `executor/+page.svelte:205,213-214,230,259,288,291,293`; `ExecutorProgressTracker.svelte:49,57,64`. Fix: a literal class map per colour.
- X: the expanded "Key tasks" rows show empty checkbox squares that do nothing (`:250-254`). The footer then says "Save your progress at any time" (`:309`), but nothing on the page saves. Fix: tick them through `executorStepsStore` (as the toolkit does), or render plain bullets and drop the footer line.
- X: "Estate Settlement Progress" is the owner's documentation audit (`areaPct`/`estateAudit`, `:111-147`), not settlement. Its four milestones (Initial Documentation, Contact Network, Asset Inventory, Complete Profile) tick at 25/50/75/100 of a value that can only be 0, 33, 67 or 100, so they match no named area (`ExecutorProgressTracker.svelte:71-106`). Fix: drive it from `executorSteps` done/total, or rename it to records-gathered progress and drop the milestones.
- U: "Executor Responsibilities Guide" and "Timeline & Deadlines" both open `/modules/executor-toolkit` (`:120`, `:127`), which has no deadlines view. Fix: keep one card, or point "Timeline" at the "Gov & Bureaus" tab.

**/modules/executor-toolkit (Executor Guide)** — for the owner and an executor.
- X: the Sudden/Planned task filters and banners (`:68-140`) depend on `currentScenario`, which only `/admin` sets (`admin/+page.svelte:4` via `ScenarioMode`). An owner or executor always sees "General". Fix: put the three-way scenario choice (existing `SCENARIO_DESCRIPTIONS` wording) on this page.
- U: there is no done/total count for the 50 steps. Fix: one "n of m steps done" line from `executorSteps`.
- V0: the "Sudden Passing Mode Active" box is alarm red (`bg-red-50`, `text-red-600`, `:107-121`).

**/modules/executor-guide** — redirects to the toolkit (X108 done). U: its 193-line `+page.svelte` can never render behind the unconditional redirect in `+page.ts:8-10`. Fix: delete the dead `+page.svelte`.

**/modules/executor-hub** (via `[id]`, registry `"executor-hub"`) — for an executor. This answers the X207 seed. Its steps are generic filler built from the module title ("Review Executor Hub requirements", "Gather necessary documents for executor", `ModuleContent.svelte:38-45`). It duplicates the toolkit's 50 real, persisted steps. I recommend retiring it: redirect to `/modules/executor-toolkit`, as executor-guide does, and drop the catalog card. The reason: three executor surfaces (/executor, the dashboard ExecutorHub, executor-hub) duplicate the one with real data. Owner's call on retiring a module.

**/modules/contacts** — for the owner; an executor uses the Call List statuses.
- X: there is no way to mark a contact as executor. `ROLE_OPTIONS` (`:74`) has no "Executor", create hard-codes `isExecutor: false` (`:180`), and the only control is the Family Hub map's edit panel (`FamilyTreeGraph.svelte:286`). The owner sets up the son's start page from this same modal, so the recipient view and packet miss the executor. Fix: add the "Designated Executor" checkbox (the Family Hub's wording) to the modal next to `RecipientLinkPanel`.
- U: the start-page panel appears only when editing a saved contact (`RecipientLinkPanel.svelte:17,76`). On add, nothing tells the owner a start page comes after saving, and directory cards show no recipient marker. Fix: reopen the saved contact in edit, or add a small "Start page" badge on cards.
- T0/V0: in planning mode the Call List says "Call Now" (`:440`), with a rose "Pending Immediate" stat (`:333-347`).

**/modules/family-hub** — for the owner.
- T0, untrue copy: the remove confirm says "It will be preserved in your activity log" (`:233`), but remove logs nothing (`removeFamilyMemory` = `familyManager.delete`, `visualMemoryStore.svelte.ts:182`), and the CREATE entry keeps only the title. Same wording in `heirlooms :240` and `legacy-journal :164` (other areas). Fix: use the existing contacts wording ("You can always add them back later if needed.").

**/modules/anniversary-manager (Important Dates)** — for the owner and family. This answers U0's open item: calendar and Important Dates both edit `calendar_events`.
- X: the date is free text labelled "Date (MM-DD)" with no check (`:515-523`). "Oct 24" or "10/24" gives `NaN` month and the card shows "Invalid Date" (`calendarStore.svelte.ts:164-170`). Fix: month and day selects, or the calendar's date input.
- X: the two pages use different type sets for the same rows: Important Dates has birthday/anniversary/passing/ritual (`:58-69`, `:528-545`), Calendar has birthday/anniversary/holiday/other (`calendar :594-599`). A "holiday" or "other" row gets class `undefined` and a blank type in the Important Dates edit; "ritual" shows a blank select in Calendar. Fix: one shared type list in `calendarStore`. I recommend also merging the two pages into one, since two editors for one table keep producing these mismatches.
- X: the AI bar uses `context="heirlooms"` (`:186`); X90 fixed this for other pages. Fix: `context="calendar"`, or its own context.

**/modules/calendar (Event Calendar)** — for the owner; the executor is promised use.
- X: the copy says "Your executor can click a button to open this in their email client" (`calendar :~650-653`). But `calendar_events` is not in `SECTION_MODELS` (`export.py:39-59`), so these dates, wishes, rituals and future messages never reach the recipient start page, the full record, the download copy or the binder. The Important Dates copy ("Guide your family…") has the same gap. Fix: add `calendar_events` to the snapshot with a packet section (title, date, wish or ritual, message), so the executor gets it.

**/modules/medical** — for the owner; an executor reads it.
- X, confirmed by the proof run: a directive's attached file lives only in `custom_attributes._media` (X116, `medicalStore.svelte.ts:18-28`). `export.py::_attachments` matches only `/api/media/N` strings, `media_id` and data URLs, so the scanned directive is missing from the recipient's "Where the originals are kept", the download copy and the binder. Pets' care document uses the same `_media` key (`petStore.svelte.ts:25`). Fix: in `_attachments`, parse `custom_attributes` JSON and link `_media.id`.
- U: "Primary contact" is free text (`:60`) and not picked from contacts, so the proxy is not linked to the person in the Call List or start page. Fix: offer contacts in a datalist and keep free text.

**Clean, nothing beyond existing cards:** `/modules/pulse/contacts` (area d).

## Proposed cards
- **X (bugs):**
  - Recipient executor anchors.
  - One executor test across the recipient view and packet.
  - Recipient preview sign-in redirect.
  - Caller notes on the recipient page (owner's call).
  - /executor dynamic Tailwind classes.
  - /executor dead task boxes and untrue "save" footer.
  - /executor progress measures records, not settlement.
  - Toolkit scenario selectable only in /admin.
  - Contacts has no executor control.
  - Important Dates free-text date gives "Invalid Date".
  - One `calendar_events` type list (merge pages recommended).
  - Important Dates AI context "heirlooms".
  - `calendar_events` missing from the snapshot.
  - `_media` files missing from the snapshot (medical, pets).
- **U (polish):** recipient page at phone width; executor-guide dead page; retire executor-hub (X207 seed); toolkit step count; start-page discoverability on contacts; /executor duplicate resource cards; medical proxy picked from contacts.
- **T0 (wording):** "Their final wishes"; family-hub "preserved in your activity log" (also heirlooms and journal); Call List "Call Now" / "Pending Immediate" in planning mode.
- **V0 (colour):** toolkit "Sudden Passing" red banner; contacts rose "Pending Immediate" in planning mode.
