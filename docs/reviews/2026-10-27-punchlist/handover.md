**Last Updated:** 2026-10-27 14:43 EST

# Handover review: recipient page, binder, PDF, zip, letters/capsules, executor, Pulse

Reviewed `.worktrees/review` at `c374721`. Local run on port 35802 used a throwaway SQLite DB and a local outbox only. No email was sent. Evidence lives in `scratchpad/punch/ho/`: `out/` holds the screenshots, zips, PDFs and text dumps, and `scripts/` holds the seed, sim and comparison scripts.

## The completion story (synthetic data) and its result

1. The owner set up the following through the same APIs the stores use:
   - an estate profile (owner Eleanor Vance, executor Maya);
   - Maya (executor, tier 1), Theo (son, tier 2) and Sam (friend, tier 3);
   - a checking account;
   - a Will document with will.pdf;
   - 3 letters: one to Theo, one to Theo held back, one to Maya;
   - a photo (visual memory);
   - 2 capsules for Theo: one with a past date, one with a future date;
   - recipient links for Maya and Theo, plus a note for Theo.
2. Recipient view: Theo's view (`/api/recipient/view`, `/for/<token>`) and the owner preview show his own letter only. The held letter and Maya's letter stay out. Only the released capsule shows, and other recipients' notes are removed. Maya's view shows only her letter and the executor checklist.
3. Shared media: `/api/media/shared/<token>/<id>` returns 200 for the will and the photo. It returns 404 for a file uploaded but not referenced.
4. Closing a link: after it closes, the view and media both return 404 at once.
5. Outputs agree. These were compared:
   - the binder screen;
   - the binder zip, the export-preview zip and both recipient zips (packet.html, packet.pdf, snapshot.json, manifest.json, files/);
   - the export-preview PDF.

   Every dt/dd label and value in each packet.html appears in its packet.pdf, and all record titles match. The manifest sections equal the snapshot sections. Files in every zip are byte-identical to the uploads (sha1 4479c2… will.pdf, a6d264… photo.png). File coverage reads 2 of 2 everywhere.
6. Pulse:
   - Enabled with 1 day / 2 h grace. The clock was driven by patching `utc_now` in pulse_logic and pulse_scheduler, then calling `pulse_job()` hourly.
   - Owner reminder 1 went out at +24h and reminder 2 at +25h.
   - Tiers 1, 2, 3 and 4 were reached at +26h, +32h, +44h and +68h. Each tier's guardians got one email in the local outbox.
   - Vault notes opened per tier (tier_1, tier_3_escalation, tier_4). At tier 4 every guardian sees all 3 notes.
   - After the owner checked in with the one-click verify link (GET reads only, POST records the check-in), the portal shows "active" and the vault returns `[]`.
   - The transparency preview matched the portal.

## Findings

| # | Severity | Finding | Evidence | Smallest fix |
|---|---|---|---|---|
| 1 | P1 | A recipient who is executor by role ("Executor") or by the profile's executor_name, without the is_executor flag, is told "You are named as executor", but the executor checklist notes are withheld from them. Two different executor rules are in play. | `backend/routers/recipient.py:78-82` (`executor_notes_shared` checks only `contact.is_executor`) vs `:171-177` (`is_executor` also accepts role/name). The same split is in `view()` at `:225`. Run: Ravi (role Executor, flag false) got `is_executor: True` with `executor_steps rows: 0`; Maya (flag) got 1 row. Script: `scratchpad/punch/ho/scripts/exe.py`. | Make `executor_notes_shared` (and line 225) call `is_executor(contact, profile)`. |
| 2 | P2 | Time-capsule records print the internal "Recipient contact id: 2" as a field in the binder, packet.html, packet.pdf and the recipient's full record. | `frontend/src/lib/services/exportService.ts:505`: the `consumed` list for `time_capsule` lacks `recipient_contact_id` (letters list it at `:482`). Seen in `out/binder.txt` ("Recipient contact id / 2"). | Add `'recipient_contact_id'` to time_capsule `consumed`. |
| 3 | P2 | The recipient page and the binder disagree on capsule state. Theo's page says "Opened January 1, 2020" (date arrived means released, per `recipient.py:70-75`). The binder/PDF Status for the same capsule is blank, because it shows "Released" only when `is_released` is set. | `exportService.ts:501`; `out/for-theo.txt` vs `out/binder.txt`. | Use the same `capsule_released` rule (date arrived or is_released) for the packet's Status field. |
| 4 | P2 | Opening the medical page silently writes an empty medical profile (`organ_donor=false`). That row then rides into every handover snapshot.json as a recorded "organ_donor: false" the owner never entered. | `backend/routers/medical.py:29-37` (GET inserts a row). Recipient zips made after a page visit carry `medical_profiles: [{organ_donor: false, …}]`; the earlier binder zip did not (`out/z_for-theo/snapshot.json`). | Have GET return unsaved defaults (as `/api/pulse/settings` already does) and leave unrecorded profiles out of the snapshot. |
| 5 | P2 · security-track | Every guardian with a portal token sees the owner's Pulse messages at all times, with no outage. The link is issued when the contact is created. The `contact_reach` docstring says reach "opens the owner's notes". | `backend/pulse_logic.py:569-571` docstring vs `:636-637` (`notes` returned unconditionally). Live: after the owner checked in, Theo's portal had `show_sensitive:false` but `notes:["The blue folder is in the desk drawer."]`. | Either gate `notes` on `sensitive`, or fix the docstring. The owner-facing copy (`messages/+page.svelte:413`) supports always-visible. |
| 6 | P2 | The tier-2 and tier-3 guardian emails and the portal call the "Pulse turned on" marker the owner's "Last check-in". The owner never checked in. | `routers/pulse.py:264-267` records `pulse_enabled` as an owner check-in; the outbox email for Theo shows "Last check-in: October 27…" (`ho/outbox/*theo*`). | Label it "Check-ins began" when `method == 'pulse_enabled'`. |
| 7 | P2 | Contact cards on the recipient page show role and relation side by side even when they are the same ("Friend · Friend"). | `out/for-theo.png` (Sam Ortiz card). | Show relation only when it differs from role. |

## Checked and fine

- **Recipient filtering.**
  - Held letters, other people's letters, unreleased or future capsules and other recipients' notes are removed. Link secrets (portal and recipient tokens) are absent from all snapshots.
  - Closing a link takes effect immediately for both the view and media.
  - The shared-media allowlist rejects files the snapshot does not show.
- **Owner preview.** `/for/preview/<id>` renders the same payload as the link: same text, plus the preview banner.
- **Binder, PDF and zip agreement.**
  - Field values and titles agree across the binder screen, packet.html, packet.pdf, export-preview PDF, snapshot.json and manifest.json.
  - Attachments are byte-exact.
  - The manifest includes sha256 hashes, records and `files_complete`.
  - Recipient zips are named "Eleanor Vance - for Theo Vance.zip".
- **Pulse.**
  - Owner reminders fire once per window.
  - Tier waits follow the plan (0 / 6 / 12 / 24 h).
  - At most one tier advances per tick.
  - Local-outbox sends are recorded as "prepared in the local outbox", with no retry loop.
  - Vault release follows Automatic Release plus the tier rule.
  - Verify GET reads only; POST records the check-in.
  - Check-in resets status, and the vault closes.
- **Default tiers.** `/api/pulse/tiers` creates the default tiers, and the settings page calls it, so escalation has tier rows.
- **Email copy.** The text in the 5 outbox emails follows the positive-wording rule, and portal and verify links point at the configured FRONTEND_URL.
- **Private mode.** It blocks `/api/recipient/view`, `/api/pulse/portal` and `/api/media/shared`. This is intentional (X380, `docs/ORCHESTRATOR_HANDOFF.md:11`), so it is not a finding.

## Could not verify

- **Tier 4 alerts nobody by default.** Call tiers map only to 1–3 (`pulse_tiers.py:9`). The final tier fires and opens the vault, but its email goes only to contacts the owner explicitly placed in tier 4. I did not check how the Escalation page presents an empty tier 4.
- **All-clear notes.** All-clear runs only after provider-accepted alerts (`pulse_logic.py:672-677`). With the local outbox, no all-clear is prepared, so the all-clear path was not exercised.
- **UI flows for Pulse and the executor screens.** The Pulse settings, escalation, vault, guardian portal and respond pages were not driven through the UI; API and HTTP only. The executor toolkit/guide UI was not driven either: steps were created via `/api/data/executor_steps` and checked in the snapshot only.
- **Data-entry forms.** These were not exercised. Records were created through the same endpoints the stores call, so form-to-payload mapping is unverified here; the module-form reviewers cover it.
- **Production.** Nothing was checked against production.
