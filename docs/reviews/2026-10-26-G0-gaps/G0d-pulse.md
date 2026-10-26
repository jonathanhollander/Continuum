# G0d-pulse

**Last Updated:** 2026-10-26 08:35 EST

Reviewer report, saved verbatim (read-only review on main).

G0d gap review (d): Pulse and guardian pages. Read-only. Main is untouched (`git status` clean) and nothing is running.

**What I ran:** one in-process probe (no server) at `/private/tmp/claude-501/-Users-jonathanhollander-AI-Code-Continuum/798584f5-5f46-497f-a2f2-975a6b8ca86a/scratchpad/g0d/probe.py`, with a throwaway SQLite `g0d2.db` and the outbox in `scratchpad/g0d/outbox`. No real email was sent.
- I added a guardian the way the UI does: create through `/api/contacts`, then set the tier with a PUT. The guardian's `portal_token` came out as **None**.
- The Tier 1 alert in the outbox links to **`http://localhost:5173/portal/None`**.
- The alert names the owner "G0D-Owner" (from the email address), even though `display_name` was "Margaret".

**Skipped because a card already covers them:** X154 (call-tier vs `tier_id`), U83 and U84, T0's Ghost "Status: Resting" line (X152 finding), T0's Pulse messages empty states, and everything ticked from X25 to X187.

## Per route

**/modules/pulse (owner): gaps 1, 2, 7, 8, 13, 16, 17**
- The dashboard status page only links on to Messages and Transparency.
- U3 redirected `/pulse` here, which dropped X65's "not set up" and "turned off" states and its Configure and Manage Contacts links.

**/modules/pulse/settings (owner): gaps 3, 9, 14**

**/modules/pulse/contacts (owner): gap 6.** The Trusted Contacts page has nothing else beyond U83.

**/modules/pulse/escalation (owner): gaps 4, 5, 6**

**/modules/pulse/vault (owner, and the final-tier recipient as reader): gap 15.** The page itself loads and saves correctly.

**/modules/pulse/transparency (owner): gaps 10, 18**

**/modules/pulse/messages (owner, guardian as the intended other party): gaps 11, 12, 19**

**/modules/pulse/history (owner): gaps 12, 20**

**/portal/[token]** (every guardian and the final-tier vault recipient; this is the link in every email): gaps 1, 15, 21, 23

**/pulse/portal/[token]** (older guardian page; it holds the vault, but no email links to it): gap 15

**/pulse/respond/[token]** (guardian, reached from /pulse/portal): gaps 22, 24, 25

**/pulse/verify/[token]** (owner's one-click check-in): gaps 2, 26, 27

**Guardian emails (`backend/templates/emails/pulse_*`)**, read as each tier: gaps 1, 23, 28

**/pulse:** redirects to /modules/pulse. Nothing of its own.

## Proposed X cards (bugs)

1. **Guardians made in the UI get no portal link** (guardian, every tier; vault recipient). Only `POST /api/pulse/contacts` sets `portal_token` (`routers/pulse.py:208-209`), and no frontend calls it. The UI creates contacts through `routers/contacts.py:76` and sets tiers through PUT `:97-108`, which leave the token empty. Every alert then links to `/portal/None` (`pulse_logic.py:293,325`), and the guardian lands on a dead-end error page. **Fix:** in `contacts._apply`, give the contact a token when a `tier_id` is set or `notify_on_safety_timer` turns on and it has none. Backfill existing tiered or flagged contacts in a small data migration (production write, `pg_dump` first).

2. **The owner is never reminded to check in** (owner; also flagged by X152 → G0). The scheduler only escalates (`pulse_scheduler.py:14-20`, `pulse_logic.py:81-163`). There is no reminder template, and nothing ever sends the `checkin_token` link to `/pulse/verify/{token}`. Nothing in the frontend shows that link either, so the verify page can't be reached. The first sign a busy owner gets is their guardians being alerted. **Fix:** send a reminder email at the soft deadline (`last check-in + frequency_days`) and one more when the grace period starts, both carrying the verify link. Log one row per window so it sends once, and send nothing during Ghost Mode.

3. **No way to choose how often check-ins happen** (owner). Nothing in the frontend edits `frequency_days` or `grace_period_hours`; the only references are the store type and the settings page defaults (`settings/+page.svelte:26-27`). Every owner is stuck at 2 days plus 24 h. The backend already validates both fields (`pulse.py:134-135`). **Fix:** add two inputs to Pulse Configuration and include them in the `saveSettings` body (`:61-66`).

4. **"Custom Delay (h) — Overrides Tier" does nothing** (owner). The Escalation Plan saves `individual_delay_hours` (`PulseContactsManager.svelte:383-395`), but `pulse_logic` never reads it: the tier timing at `:159-163` uses `tier_def.delay_hours` only. **Fix:** either honour it per contact in `trigger_escalation`, or take the field off the page. This is an owner decision.

5. **The Tier 1 delay edit is ignored** (owner). Tier 1 always fires at the end of the grace period (`pulse_logic.py:147-150`), but the page lets the owner edit Tier 1's "+0h" (`PulseContactsManager.svelte:320-328`). **Fix:** either add `tier_def.delay_hours` to `hard_deadline` for tier 1, or show Tier 1 as "when the grace period ends" with no edit.

6. **A guardian with no email can be picked and then silently can't be reached** (owner; that guardian). The picker shows role, not email (`GuardianPicker.svelte:138-143`). Guardian rows show an empty email line (`PulseContactsManager.svelte:259-263,357-361`). Alerts to that person fail and only surface afterwards as a failed message row. **Fix:** show the email in the picker. Where it's missing, show a positive line such as "Add an email so we can reach {name}", linking to Family & Contacts.

7. **The Pulse background turns red for "grace" and "not set up"** (owner, every /modules/pulse page). `+layout.svelte:7-11` maps `"grace_period"`, but the API sends `"grace"` (`pulse.py:84`). So "grace" and "not_configured" both fall through to `"alert"`, which is a red-950 and rose mesh (`LivingMesh.svelte:26-29`). A brand-new owner opens Pulse on an alarm-red screen. **Fix:** map `grace` → `grace` and `not_configured` → `disabled`.

8. **The safety timer can run with nobody to tell** (owner). Contacts made on Family & Contacts start with `notify_on_safety_timer=False` (`contacts.py:76`). The only switch is the small "Active Responder" chip on Escalation Plan. Starting a timer never says who will be alerted. Start, cancel and check-in failures only reach `console.error` (`+page.svelte:49,81,90`; `pulse.svelte.ts:46`). **Fix:** before Start, show the names that will be told, or link to choose them. Show the existing gentle retry line on failure.

9. **The "Automatic Release" toggle controls nothing** (owner). It saves `location_vault_enabled` (`settings/+page.svelte:266-292`), but nothing in the backend reads that field (grep: only the router's validation list). Vault release happens by tier regardless. **Fix:** either make `get_portal_vault` return `[]` while the toggle is off, or remove the card. Owner decision; the first option is recommended because the switch already exists.

10. **Transparency tiers after "Active" show "Loading…" forever** (owner). `activeTier = tier.id` stores the database id (`transparency/+page.svelte:166`), but `tiers[activeTier]` then indexes the array by it (`:196`). For any account whose tier ids aren't 1–4, every tier click shows "Loading Transparency Data...". **Fix:** store the array index.

11. **The owner's notes to guardians go nowhere** (owner; guardian). `POST /api/pulse/messages` only inserts a row (`pulse.py:370-379`). Nothing emails it, and neither portal page shows messages. The hub still says "Bi-directional contact notes" (`messages/+page.svelte:127`). **Fix:** either show the owner's notes on `/portal/[token]` (a token-authorised GET of that contact's `user_to_contact` non-system rows), or drop the composer. Owner decision.

12. **History and Messages times are off by the viewer's UTC offset** (owner). `/api/pulse/history` (`pulse.py:194-197`) and `/messages` (`:365-368`) return naive UTC times with no "Z". The pages read them as local time (`history/+page.svelte:134`; `messages/+page.svelte:177,285`). **Fix:** return `_utc_iso` times, the same way `/status` does.

13. **The owner never sees an escalation that is under way** (owner; guardians). `/status` returns `escalation_tier` and `alerts_paused_until`, and the store types them (`pulse.svelte.ts:12-13`), but no page reads them. When the owner checks in after tiers have fired, nothing tells the alerted guardians it's all clear; their last email may be the Tier 3 or 4 "URGENT" one. **Fix:** show a gentle line on /modules/pulse ("Tier N was contacted on …; your check-in lets them know"). When an owner check-in closes an outage, send a short all-clear email to the contacts who were alerted (local outbox).

14. **The settings page calls `alert()` and the biometric toggle is dead code** (owner). `toggleBiometric` (`settings/+page.svelte:90-121`) is defined but never rendered, and contains a browser `alert(... See console.)` (`:117`, missed by U65/U72). `startAuthentication` is imported but unused. **Fix:** remove them.

15. **The email link leads to a portal with no vault** (final-tier vault recipient; Tier 3 and 4 guardians). Emails link to `/portal/{token}`, which never loads the vault. Its "Emergency Contacts (Locked)" and "Medical Directives (Locked)" are hard-coded locked (`portal/[token]/+page.svelte:164,167`) and `show_sensitive` is ignored. The vault shows only on `/pulse/portal/[token]` (`:58-64`), which no email or page links to. The owner's vault therefore reaches nobody. **Fix:** make one portal. Bring the vault section into `/portal/[token]` (or have `/portal/[token]` forward to `/pulse/portal/[token]`, which already links to Acknowledge), and replace the hard-coded locks with the real unlocked items.

## Proposed U cards (polish)

16. **The Pulse home has no off or not-set-up state and no links onward** (owner). `+page.svelte:174-201` shows "Seeking Connection" and "Your inner circle is standing by" even when Pulse is off or there are no guardians. **Fix:** port X65's lines ("Ready when you are", "Choose how often we check in…", "Resting for now") and the Configure and Manage Contacts links from the old /pulse page, git `a29c3b4`.
17. **Guardian check-ins look like the owner's own** (owner). History shows "Note: Marked OK by Gil" and "Verified" with the default icon (`history/+page.svelte:127-131`). **Fix:** label them "{name} checked on you" and give them their own icon.
18. **The Transparency list is invented** (owner). It lists "Daily Memory (Photo)", "Medical Directives (DNR)", "Vault Access Codes", "Exact Location" and "Still Encrypted" (`transparency/+page.svelte:83-118`), none of which the portal shows. **Fix:** build the list from what the portal really shows (name, status, last check-in) plus the owner's vault items grouped by `unlock_condition`.
19. **Safety-timer rows in Messages show raw markers** (owner). They read "[Safety timer 3] alert sent" as an owner chat bubble (`messages/+page.svelte:71,264` match only "[System Alert"). **Fix:** treat the `[Safety timer` prefix as a system log line and strip it.
20. **The History "Web" and "Email" filters never match** (owner). Stored methods are `manual`, `magic_link`, `guardian_snooze` and `guardian_confirmation` (`history/+page.svelte:84,93`; `pulse.py:527`). **Fix:** filter on the real methods (Manual, Email link, Guardian).
21. **The guardian portal has no owner contact detail or next step** (guardian). The Tier 2 email says "contact them directly", but `/portal/[token]` shows no phone number and no what-to-do. **Fix:** a "What you can do" block reusing the email's steps, plus the owner's phone if the profile has one.
22. **The respond page goes blank on a network error** (guardian). `respond/[token]/+page.svelte:31-41` has `try/finally` with no `catch`. **Fix:** add a `catch` that sets the existing gentle line.

## Proposed T0 cards (wording)

23. **Guardian emails and portal promise things that don't exist** (guardians, every tier).
    - Tier 3 lists medical directives, emergency contacts, property codes and legal documents as "NOW ACCESSIBLE".
    - Tier 4 grants "FULL ACCESS" to credentials, financial documents and the will, and points to a "Guardian Guide" and a "support team".
    - Tier 1 offers "escalate through the portal".
    - Tiers 1–3 say a confirmation "resets the timer"; since X50 it only pauses alerts.
    - The portal says "We've notified them" after a nudge (`portal/[token]:43`), but only a row is written.
    - **Fix:** say exactly what the portal shows (the notes the owner left, once their tier is reached) and what a confirmation does.
24. **The respond page says a snooze "starts their check-in schedule fresh from now"** (`respond/[token]:126,182`), which has been untrue since X50. **Fix:** "We'll pause further alerts for a while; thank you for checking on them".
25. **Error-state headings break the positive-copy rule.** The "Acknowledged" button records nothing (`respond:189-198`; `pulse.py:361`), so its label overstates what happens. The error headings read "Access Denied" in red (`portal/[token]:96`, still present despite X35), "Invalid responder token." (`respond:37`) and the raw "Invalid token" detail (`verify:29`). **Fix:** use the `/pulse/portal` wording ("This link may have expired or been replaced…").
26. **The verify page tells the owner things that aren't so** (owner). It says "Your Guardians have been notified that all systems are nominal" (`verify:95`), but nothing notifies them. "Next Pulse in 48h" (`:110`) is hard-coded, whatever `frequency_days` is.
27. **Proposed X with gap 2 (bug):** `/api/pulse/verify` is a GET that records a check-in (`pulse.py:521-530`). Once reminder emails exist, link scanners that pre-open links will check the owner in automatically. **Fix:** make the page load read-only and record the check-in on a button POST.
28. **Emails and portal name the owner by their email prefix** (guardians; confirmed "G0D-Owner" vs "Margaret") at `pulse_logic.py:284,324` and `pulse.py:305`. `User.display_name` exists. **Fix:** use `display_name`, then estate `owner_name`, then "someone close to you"; never the email (same rule as X110).
29. **Settings copy is untrue.** "Vault Integration: Automatically decrypt … when an escalation Tier exceeds 24 hours" (`settings:261`): nothing is encrypted and nothing uses 24 h. "Notifies responders immediately" / "Immediate Escalation on Zero" (`+page.svelte:239,284`): the scheduler runs every 15 minutes. "Shared only with the guardians you choose" (`vault:156`): every guardian whose tier has been reached sees every unlocked item.

## Proposed V0 card (colour)

30. **One colour fix**, same root as gap 7: an owner who is merely in their grace period, or new, gets the alarm palette (red-950 and rose) across every /modules/pulse page. Use amber for grace and zinc for "not set up", as `LivingMesh` already defines.

## Clean
The vault page's loading, saving and errors, the GuardianPicker dialog, the Trusted Contacts list (beyond U83), and the /pulse redirect.

## Decisions needed from the owner
Gap 4 (honour the custom delay or remove it), gap 9 (wire Automatic Release, recommended, or remove the card), gap 11 (show owner notes on the portal or drop the composer), and gap 15 (which portal stays).
