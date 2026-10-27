# G0a-legacy-letters

**Last Updated:** 2026-10-26 08:35 EST

Reviewer report, saved verbatim (read-only review on main).

G0a gap review: legacy and letters. Read-only on main 7516783 (5b40507 is an ancestor). I changed nothing and committed nothing. I did not run the app: every gap below comes from reading the code at the file:line given. Before listing anything I searched the plan for it, and I left out what X/U/C/T0 cards already cover (U9, U10, U13, U14, U16, U18, X70, X85, X91, X98, X99, X103, X129, C3–C5, D2, X202, the U65/U72 confirm() calls, and the VideoRecorder "Camera Error").

## Routes and who they serve

The roles are the owner's own account in planning, executor or family mode (navigation.ts:474-498), plus the recipient on `/for/<token>`.

- **/modules/letters**: owner writes letters; executor uses the institution templates; recipient reads non-held letters on /for. Gaps: X-a, X-b, X-c, X-d, U-d, U-e, U-f, U-n, T0.
- **/modules/legacy-journal** (reflections, ethical will, lessons, accomplishments): owner. Recipient sees these only in the full record. Gaps: X-j, U-f, U-g, T0.
- **/modules/time-capsule**: owner; recipient once released. Gaps: X-d, X-j, X-n, X-o, X-p, U-k, T0.
- **/modules/visual-memories** (gallery and external archives): owner; recipient and executor. Gaps: X-e, X-l, T0.
- **/modules/heirlooms**: owner; family scanning a printed label. Gaps: X-f, X-g, X-h, X-j, U-g, U-h, U-i, T0.
- **/modules/funeral** (wishes wizard and budget): owner; executor. Gaps: X-i, U-b, U-c, V0.
- **/modules/funeral/traditions/[type]**: nobody can reach it (U-a).
- **/modules/anniversary-manager** (Important Dates): owner; family. Gaps: X-e, X-j, X-k, U-j, U-l, U-m.
- **/modules/timeline**: owner. Gap: X-m. The rest is covered by U9.
- **Obituary and video**: there is no separate route. Obituary is FuneralWizard step 5 plus the AI context; video is VideoRecorder inside time-capsule (X-n).

## Proposed X cards (bugs)

- **X-a. Ethical-will answers land in the wrong places** (letters, owner). The step 1 question asks for core values (reflectionPools.ts:42-49), but the answer is stored as `memory`. The draft then prints that answer as "the most important lesson" and prints the lessons answer as "three core values" (letters/+page.svelte:389). The suggestion chips are mismatched the same way (:1315-1327). Fix: map step index to values, lessons, legacy, and reorder the chips to match.
- **X-b. "Empathy Engine" is canned text that overwrites the letter** (owner). In `LetterAssistant.svelte:26-38`, `writerService.ts:22-45`:
  - "Generate Draft" replaces the whole letter with a fixed template, with no confirm.
  - "Polish & Soften" puts a random phrase such as "I feel that " in front of the entire letter.
  - The warmth slider (:24) is never read.
  - E4 missed this. Fix: call the real AI chat, or remove the panel.
- **X-c. Letters have no print or download** (executor and owner). Institution templates (letters:867-997) have no way out of the app since X70 removed the untrue "Print Ready" claim. Fix: add the same Print and jsPDF download that U50 added to subscriptions.
- **X-d. Milestones print as raw ids.** Recipient page shows "For grad" (`RecipientStartPage.svelte:344`) and capsules show "For anniv 10" (:374). The packet shows "Milestone: grad" (`exportService.ts:309`). Fix: one shared label map, built from `COMMON_MILESTONES` plus the letters `MILESTONE_LABELS` (letters:65-70).
- **X-e. Two record types never leave the server** (executor and recipient). `SECTION_MODELS` (`backend/routers/export.py:40-60`) leaves out `CalendarEvent`, which holds the Important Dates rituals "to guide your family". It also leaves out `ExternalArchive`, the photo-archive access instructions whose placeholder asks "How do executors access this?". So neither appears in the binder, the packet or /for. Fix: add both sections and show them in the packet.
- **X-f. Heirloom QR labels lead nowhere** (family). `qrStore.ts:91` lowercases "Heirloom" and compares it to 'heirlooms', so QR Center labels point at `/modules/property?id=`. The heirloom modal encodes `/modules/heirlooms?id=` (heirlooms:262), but no page reads `?id`. The printed label says "Scan to view story", while a family member scanning it reaches sign-in or the owner's whole list. Also: the URL is sent to the third-party api.qrserver.com. Fix: correct the type, and point the code at a page that opens that one story.
- **X-g. The heirloom wizard saves made-up records.** heirlooms:108-111,123 save "Vintage Watch" for "Grandson", "Wedding Ring" for "Spouse / Eldest Child", "Antique Desk" for "Home Office", each with the story "Family heirloom passed down...". Fix: follow the X129 rule — open the add form with only the name filled, recipient and story left blank.
- **X-h. Heirloom photos are stored inside the record as base64.** `VisionUploader.svelte:31-39` keeps the photo as a data URL in the Asset row, which is the same problem X91 fixed for visual memories. Fix: upload through the media API.
- **X-i. Funeral budget "Saving vs. Avg" always reads $0.** `estimated` is set equal to `cost` on create, edit and auto-fill (funeral:105-108, :134-135, :223-225), so `variance` (:195) is always 0. The two cards show the same number and the line "projected to save $0" appears every time. Fix: keep the NFDA estimate separate and never overwrite it on edit, or drop the comparison.
- **X-j. The saved Cards/Table choice is ignored on load (site-wide).** These pages start `viewMode = 'card'` and only update on a click, while the toggle itself shows the stored "table":
  - My area: legacy-journal:44, time-capsule:52, heirlooms:45, anniversary-manager:37.
  - Same bug elsewhere: calendar, qr-codes, property, pets, home-manual, contacts, digital-guardian, subscriptions, insurance, `AssetManager.svelte`.
  - Fix: `$derived(userPreferencesStore.getViewMode(module))`, as letters:87 already does.
- **X-k. Editing an Important Date after a reload wipes its custom fields.** anniversary-manager:84-89 reads only `ev.custom_attributes`, but server rows arrive as `customAttributes`. X99 missed this page. Fix: use `readCustom`.
- **X-l. Visual memories: archive custom fields can't save, and memories can't be named or described.**
  - The archive modal shows CustomFieldsManager, but `ExternalArchive` has no column for it (estate_models.py:346-353), `saveArchive` drops the values (visual-memories:104-121), and the form never resets or loads them.
  - Memories have no rename or caption, although a `description` column exists (estate_models.py:344) and the recipient page shows it.
  - Fix: remove the archive field control (as X103 did for family-hub), and add name and description editing.
- **X-m. Timeline "Notify via Email" pretends to send.** timeline:604-617 shows `alert("Mock Notification: Email sent to …")` and sends nothing. Fix: remove the button, or use a mailto link.
- **X-n. Every video is labelled WebM.** VideoRecorder.svelte:65 types every recording `video/webm`, and time-capsule:182 names it `capsule.webm`. Safari and iPhone record MP4, so the stored type is wrong. Fix: use `mediaRecorder.mimeType` and a matching extension.
- **X-o. A sealed time capsule is removed in one click, with no confirm** (time-capsule:303, :539). Fix: `askConfirm`, as letters does.
- **X-p. Time capsule "Save Draft" saves nothing** (time-capsule:789-794). It only closes the modal, and the draft is lost on navigation. Fix: save a real draft, or remove the button.

## Proposed U cards (polish)

- **U-a. The funeral traditions page is unreachable.** `/modules/funeral/traditions/[type]` has no link anywhere, still uses Svelte 4 `$:`, and has no muslim, hindu, buddhist or other entries, although `funeralTraditions.ts` lists them. Fix: link from the FuneralWizard step 1 cards, or retire the page.
- **U-b. "+ Add Song" uses the browser's `prompt()`** (FuneralWizard:541-549). The funeral page also carries dead `prompt()` helpers: editWish, addSong, removeSong, updateMood (:61-96, :178-183). Fix: an inline input, and delete the dead helpers.
- **U-c. The funeral wizard ends in a dead end** (FuneralWizard:643-650). Step 5 has no closing line and no next step. Fix: a saved note, plus links to Budget and Letters.
- **U-d. Emotional drafts keep "[Your Name]"** (letters:387, :389) although the owner name is known. Fix: fill it from the profile.
- **U-e. Letters ignores executor mode.** The page still leads with Ethical Will and Loved Ones; the institution letters the executor needs sit below. This is an owner decision: order the page by role.
- **U-f. Two separate ethical wills.** The letters page's "Draft Ethical Will" (a Letter of type emotional) and Legacy Journal's Ethical Will (a JournalEntry of type ethical_will) are separate records. This is an open G0 item and an owner decision. Recommendation: send the letters card to the journal tab. Also open from G0: letters has no header add button; add a "Write a letter" button.
- **U-g. The recipient page doesn't show heirlooms set aside for that person, or the ethical will and life lessons** (RecipientStartPage:126-167); they appear only in the full record. This is an owner decision under the D2 scope.
- **U-h. Heirloom provenance (`ownershipDetails`) is entered but never shown** on the card or the table.
- **U-i. Heirloom recipient is free text.** Letters and capsules have a contact picker (the X100 pattern). Fix: add the picker so the recipient page can match.
- **U-j. Important Dates and the calendar both edit `calendar_events`** (open G0 item). Fix: cross-link the two pages.
- **U-k. A time-capsule style leaks to every page.** time-capsule:851-855 `:global(body){background:#f8fafc}` applies to every page visited afterwards, the same leak U10 fixed for fonts. Fix: remove it.
- **U-l. Important Dates takes the date as free text "MM-DD"** (:518-523), so "Oct 24" saves and sorts last. Also, `formatDate` (:149) is unused. Fix: month and day selects.
- **U-m. Important Dates uses the wrong AI context**: `AIPromptBar context="heirlooms"` (anniversary-manager:186).
- **U-n. The template preview can't be edited.** It is read-only (letters:926-931) although labelled "Review & Refine Draft", and it has no recipient. Fix: open it in the editor.

## T0 (wording)

- "Your words will be preserved in the activity log" (legacy-journal:164) and "Your story will be preserved…" (heirlooms:240) are untrue: deleting logs nothing. family-hub:233 has the same line (area c).
- The letter labels "Specific Release Date" and "Or Lifecycle Milestone" (letters:1122, :1135) suggest automatic release. Letters actually show unless held (recipient.py:89-90).
- Negative copy:
  - "No description provided." (MemoryGallery.svelte:347)
  - "No reflections match" (legacy-journal:341)
  - "Tradition not found"
  - "Typically Forbidden in …" (FuneralWizard:356)
  - "Cancel" (time-capsule:787, visual-memories:346), instead of "Not right now"

## V0 (colour)

- FuneralWizard:353-356: red alarm badge "Typically Forbidden".
- funeral:439-441: rose alarm card when the plan is over the average.

Clean routes: none fully clean in this area. Timeline beyond X-m is clean apart from what U9 already covers.
