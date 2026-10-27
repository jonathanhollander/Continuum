# Pulse — implementation-plan cross-check

**Last Updated:** 2026-10-26 15:25 EDT

**Source commit:** `8751f224b2a1bf0d915940f61242829d08964d18` (active application only). Review and documentation; application source was unchanged. CodeGraph was used before code location/reading; targeted reads filled omitted source/markup. These are new implementation findings, not a repeat of the prior X154 acceptance run.

## Coverage

| Journey / route | Source traced | Plan cross-reference |
|---|---|---|
| `/modules/pulse`, its layout, `/pulse` redirect | Dashboard check-in, status/tier claims, safety-timer start/cancel/polling, state store, backend status/settings/check-in | X26, X50, X59, X65, U3, G2/G3, X226 |
| `/modules/pulse/settings` | Load/save/rollback, frequency/grace, Rest Mode, Automatic Release; backend field validation and enable check-in | X151/X152, X226, X269/X270, G2/G3 |
| `/modules/pulse/contacts`, `/modules/pulse/escalation` | PulseContactsManager, GuardianPicker, shared display-tier mapping; enrollment/removal, waits, safety flag | U2/U23, X163/X182/X187, X154 |
| `/modules/pulse/vault` | Owner CRUD/draft/error paths, backend content mapping and tier condition | X34/X37, G2/G3 |
| `/modules/pulse/transparency` | Claimed visible/hidden data, timing labels, loading, comparison with actual token portal/vault | G3, G0d gaps 10/18, companion-proof agreement invariant |
| `/modules/pulse/messages`, `/modules/pulse/history` | Read/write/failure paths, system grouping, stored timestamps/method filters | X43/X47, G2/G3 |
| `/portal/[token]`, `/pulse/respond/[token]`, `/pulse/verify/[token]`, legacy `/pulse/portal/[token]` redirect | Token view/notes/vault, confirmation/snooze/acknowledgement, read-only verify GET/button POST, network/failure rendering | X32/X35/X40/X50, G2/G3, X226/X228 |
| Scheduler and delivery | `pulse_scheduler.py`, `pulse_logic.py`, `pulse_tiers.py`, `pulse_models.py`; deadlines, retries, individual waits, local/real-provider results, all-clear | X26/X36/X41/X43/X47, X88, G2, X154 |
| Templates and registration support | All seven `pulse_*.html` templates; `security.py`, `challenge_store.py`, Pulse WebAuthn registration endpoints | G2, X302; no hardware/WebAuthn assertion run |

Inspected dependencies include `frontend/src/lib/stores/pulse.svelte.ts`, `frontend/src/lib/api/client.ts`, `backend/routers/contacts.py` tier/token application, `backend/services/email_service.py`, and the Pulse `LivingMesh.svelte` / `PetalDrift.svelte` components. Shared SyncManager/account-refresh internals belong to the contracts reviewer. This is a source-path review, not a claim to have executed every UI state or every source line.

## Findings

### F1 — P1 — Local outbox saves are recorded as emails that reached guardians

**Classification:** runtime-confirmed defect. **Plan:** X36's truthful send-result acceptance; X41/X43 retries; G2 emails; X154 usable delivery path. External-provider configuration is an acknowledged owner/environment limit; the false saved/delivered distinction is an implementation defect.

`backend/services/email_service.py:299–324` writes an HTML file and returns `status: saved_local`. `backend/pulse_logic.py:391–393` considers every status except `failed` a delivery and writes `This alert reached them by email.` Safety timers (`:302–307`) and all-clear (`:596–600`) use the same predicate. Retries then treat the row as successfully delivered. Even a real SMTP/Postmark `sent` response is provider acceptance, not confirmation the person read or received it.

**Trigger/impact:** with the documented local-outbox configuration, an owner sees delivery/sent claims although no external email left the server. This makes the saved alert history unsuitable as proof that a guardian was reached.

**Pinpoint evidence:** disposable SQLite/local-outbox run printed `LOCAL_PROVIDER local EMAIL_LOG_STATUS saved_local OWNER_MESSAGE [System Alert Tier 1] This alert reached them by email.` No external send occurred.

**Smallest correction:** preserve explicit delivery states through Pulse messages/status (`saved locally`, provider accepted, failed) and use truthful positive wording. Local saves must not count as external delivery for access/all-clear/retry decisions without an explicitly chosen simulation rule. Avoid adding provider setup to this card.

**Acceptance:** identical synthetic alert with local, failed and accepted-provider results yields distinct truthful owner history; timer/all-clear/history/status agree; no duplicate external sends are introduced.

### F2 — P1 — A guardian alerted before global Tier 1 never receives all-clear

**Classification:** runtime-confirmed branch omission plus source-confirmed reachable schedule. **Plan:** G2 gap 13 promises all-clear to the contacts actually alerted; X154 includes custom-delay companions.

`process_user_pulse` calls `send_individual_alerts` before deciding global progression (`backend/pulse_logic.py:134–165`). A Tier 1 guardian's individual wait can be zero while global Tier 1 waits six hours (`:520–528`). They receive a legitimate alert while no `PulseEscalationLog` exists. `send_all_clear` immediately returns when `current_escalation` is absent (`:574–575`), before examining the successful contact messages (`:576–581`). `_record_owner_checkin` calls this function (`backend/routers/pulse.py:60–70`).

**Trigger/impact:** owner checks in after the personal alert but before delayed global Tier 1. The guardian's last email remains the concern message, despite the owner's check-in and the verify-page statement that alerted guardians are told.

**Pinpoint evidence:** an eligible custom-delay contact with a successful alert message, no global tier row, then `send_all_clear` printed `EARLY_CUSTOM_ALL_CLEAR_COUNT 0 NEW_OUTBOX_MESSAGES 0 GLOBAL_TIER_ROWS 0`. The run exercised the guard with the same message state produced by personal delivery; reachability follows the actual scheduler ordering above.

**Smallest correction:** determine who was actually alerted from successful per-contact outage messages rather than requiring a global tier log. Keep the owner's check-in successful if a follow-up send fails, and expose that follow-up's real status.

**Acceptance:** global Tier 1 delay 6h, personal Tier 1 wait 0h; alert the guardian, check owner in before global Tier 1; one all-clear is prepared for that guardian, no unalerted person receives it, and sensitive access closes.

### F3 — P1 — “What your guardians can see” disagrees with real access

**Classification:** source-confirmed companion-proof defect. **Plan:** G3 / original G0d gaps 10 and 18; G2 Automatic Release; repository proof/display agreement invariant.

The transparency page promises “See exactly what is shared, and when” (`frontend/src/routes/modules/pulse/transparency/+page.svelte:96–99`). It loads only tiers and vault (`:18–24`), then lists notes as visible whenever their unlock tier is at or below the selected tier (`:68–81`). It never reads `location_vault_enabled`. Real guardian vault access returns `[]` while Automatic Release is off (`backend/routers/pulse.py:340–345`) and also depends on the particular guardian's reached tier (`:346–359`). The real portal always includes the owner's phone and personal messages (`:319`, `:327–328`), while transparency's always-visible list includes only name/status/time (`transparency:42–46`). Its “After N hours” labels (`:75`) omit prior tier waits, the frequency/grace window and personal overrides.

**Trigger/impact:** save a vault note while Automatic Release is off and select its tier in transparency: the owner is shown that note under Visible Data although the guardian endpoint returns none. The owner also cannot use this view to understand all already-shared contact details/messages or actual timing.

**Smallest correction:** derive the verification display from the same release/access rules and actual shared field list as the portal. Distinguish a hypothetical tier preview from a specific guardian's current access and label relative tier waits accurately.

**Acceptance:** compare transparency and token responses with release off/on, personal waits, before/after owner check-in, owner phone/message present/absent; visible item membership agrees, not just totals.

### F4 — P1 — Guardian vault retrieval failure silently looks like absent instructions

**Classification:** source-confirmed lost-reader-state defect. **Plan:** G2 one usable guardian portal/vault; X37 failure handling; intended-reader completeness invariant.

After portal metadata succeeds, `frontend/src/routes/portal/[token]/+page.svelte:35–37` fetches the unlocked vault but assigns items only when `vRes.ok`; a 500/429 response is discarded. `vaultItems` stays `[]` and the page renders without a vault error/retry. A network exception instead replaces the whole page with the generic error (`:43–44`).

**Trigger/impact:** the guardian's status/notes load, but the vault endpoint fails once. The guardian is given no indication that instructions exist but could not be loaded, nor a way to retry that portion.

**Smallest correction:** maintain independent vault loading/error state, retain any already loaded notes, and offer a token-scoped retry without re-running actions or hiding the successful portal content.

**Acceptance:** portal 200 plus vault 500/429/network failure produces a visible recoverable vault notice; retry retrieves the recorded instructions, with ordinary empty-vault behavior distinguished.

### F5 — P2 — Global tier progression abandons earlier-tier retry attempts

**Classification:** runtime-confirmed scheduling gap. **Plan:** X41/X43 retry-to-three proof; G2 editable tier waits.

Only the highest outage tier is passed to `retry_failed_tier_sends` (`backend/pulse_logic.py:124–132`), then the scheduler can advance to the next tier in the same tick (`:141–165`). Once it advances, failed sends in earlier tiers never appear in the retry query again. The delay editor permits a zero-hour next tier (`PulseContactsManager.svelte:296–303`; backend tier model has an unconstrained integer).

**Trigger/impact:** Tier 1 and Tier 2 waits set to zero, with a temporarily failing Tier 1 guardian: tick 1 fails; tick 2 retries then advances; later ticks retry Tier 2 only. The earlier guardian stops after two attempts despite a three-attempt policy.

**Pinpoint evidence:** a second disposable SQLite inline run mocked delivery as failed and owner reminders as a no-op. Five actual `process_user_pulse` calls printed `TICKS 5; TIER1_FAILURE_ATTEMPTS 2 EXPECTED_RETRY_CAP 3 CURRENT_TIER 2`. No email/provider/scheduler was started.

**Smallest correction:** retry unfinished contact/tier attempts for the current outage independently of the highest global stage, while retaining the cap and never resending successful attempts. Avoid delaying unrelated tier progression.

**Acceptance:** zero/short next-tier delay with transient earlier-tier failure reaches the intended attempt cap or success; global progression continues, successful contacts remain one-send, and an owner check-in stops the old outage's retries.

### F6 — P2 — “Tier N was contacted” means only a tier log was inserted

**Classification:** runtime-confirmed source-to-display mismatch. **Plan:** X226's owner escalation display; X36 truthful sends; displayed-claim/proof agreement.

`trigger_escalation` commits its tier log before selecting or delivering recipients (`backend/pulse_logic.py:178–207`). `get_status` returns that log as `escalation_tier`/`escalation_at` (`backend/routers/pulse.py:88`, `:102–103`); the owner page renders it as “Tier N was contacted” (`frontend/src/routes/modules/pulse/+page.svelte:120–124`, `:259–262`). Neither an empty recipient list nor all-failed attempts prevents that claim.

**Pinpoint evidence:** the first disposable proof forced a failed alert and printed `FAILED_SEND_GLOBAL_TIER 1` alongside its failure message. A zero-recipient tier follows the same committed-log path.

**Smallest correction:** show the tier as reached/attempted unless delivery evidence exists; include named successful/waiting recipients from the underlying message states. Keep the tier clock/log semantics intact.

**Acceptance:** empty tier, all-failed tier, partially accepted and accepted sends render truthful distinct claims with drilldown membership agreeing with the records. Apply F1's provider-state distinction.

### F7 — P2 — Rest Mode promises a notification it never sends and stays visually active after expiry

**Classification:** source-confirmed missing behavior/false copy and state disagreement. **Plan:** X151/X152, G2/G3 and T positive-truthful wording.

The settings page says “Your circle is told you are resting, and alerts wait until you return” (`frontend/src/routes/modules/pulse/settings/+page.svelte:269–270`). `toggleGhostMode` only changes/posts the date (`:91–100`); `backend/routers/pulse.py:181–209` saves it and sends no rest notice. The scheduler simply returns while the timestamp is future (`backend/pulse_logic.py:79–90`) and resumes automatically when it expires. The UI tests only the truthiness of that saved string (`settings:257–281`, `:287–296`), so a past timestamp still shows active styling/“Return from rest.” The setting is never auto-cleared by the scheduler.

**Smallest correction:** use a time-aware active-rest predicate consistent with the scheduler, and describe only the existing pause behavior in positive terms. Do not invent a new notification feature without an owner decision.

**Acceptance:** future/past/cleared date renders the true pause state; auto-expired rest can be renewed in one intended action; copy agrees with the absence or presence of actual guardian notifications.

### F8 — P2 — Concurrent settings saves can persist an older combination of choices

**Classification:** source-confirmed request-order race; not runtime-reproduced. **Plan:** X269 protects saved Pulse choices; X151/U2 failed-save rollback and persistence invariants.

Every settings action calls `saveSettings`, which posts all six editable fields (`frontend/src/routes/modules/pulse/settings/+page.svelte:64–89`). `saving` is set but controls are disabled only by `!loaded` (`:154`, `:186`, `:205`, `:286`, `:326`). A second change can therefore submit a newer whole-row payload while the first remains pending. The server applies every supplied field (`backend/routers/pulse.py:188–199`); if the older request commits last, it overwrites the newer choice. The enabled/release failure callbacks invert the current state rather than restoring a captured value (`settings:157–158`, `:330–333`), so an earlier failed request can also flip a later user choice.

**Trigger/impact:** change frequency then toggle a second setting while the first write is delayed. A late first request may restore the old second setting without a visible save failure; reload reveals the change.

**Smallest correction:** serialize/coalesce writes for this settings row, or prevent concurrent edits while a save is pending, with captured rollback state. Posting only the edited field reduces collisions but still needs same-field ordering.

**Acceptance:** deliberately reverse response/commit order for two rapid changes and force the earlier save to fail; final form, saved row, shared Pulse store and reload all show the latest intended choices.

## Additional verification gaps and non-findings

- History (`history/+page.svelte:42–49`), Message Hub (`messages/+page.svelte:22–51`) and transparency (`transparency/+page.svelte:18–27`) still catch GET/POST failures with only console output. The API client throws without automatically notifying the person (`frontend/src/lib/api/client.ts:50–55`, `:79–84`). This should accompany F4 or receive a separate owner-page recoverability card: history becomes a false empty state, transparency remains “Gathering this for you…”, and a failed note send has no visible retry state (its typed text is retained). This is source-confirmed, but no browser interception was run in this pass.
- Tier 3/4 email subjects/opening lines still state that notes are open (`email_service.py:377–378`, `pulse_escalation_tier4.html:6–13`) without considering Automatic Release or actual note membership. Fixing F3 should include these companion claims; the later template bullet says “if they chose to release them” but the heading remains unconditional.
- Pulse-specific WebAuthn registration endpoints and challenge byte serialization were read. The active settings UI no longer exposes the removed dead biometric toggle (original G0d gap 14), so the backend-only registration surface is not labeled a newly broken user journey. Hardware authenticator behavior and real PostgreSQL challenge concurrency were not exercised; security hardening remains deferred.
- `userId={1}` on the contacts/escalation wrappers does not select another account: PulseContactsManager uses the shared authenticated contacts store, not that unused prop. It is not an account-isolation finding.
- X154's shared mapping agrees with the frontend rule, including an explicit own Pulse tier overriding a private call tier. This review has not reopened its accepted tier-mapping behavior.
- No claim is made that external mail delivery works; environment/provider setup remains the documented limit. No mobile/layout/accessibility browser sweep, production access, real-owner data read, or broad test suite was performed.

## Proof commands and limits

Two inline Python heredocs used the existing scratchpad `a1venv/bin/python`, changed cwd to a `TemporaryDirectory`, explicitly set a disposable SQLite URL/local outbox/development mode/scheduler-disabled before importing backend code, and called only the functions described above. No app lifespan was entered. No test/script/fixture was written, no real provider was called, and the temporary databases/outboxes were deleted by their context managers.

Proof 1 output:

```text
LOCAL_PROVIDER local EMAIL_LOG_STATUS saved_local OWNER_MESSAGE [System Alert Tier 1] This alert reached them by email.
EARLY_CUSTOM_ALL_CLEAR_COUNT 0 NEW_OUTBOX_MESSAGES 0 GLOBAL_TIER_ROWS 0
FAILED_SEND_GLOBAL_TIER 1 LATEST_OWNER_MESSAGE [System Alert Tier 1] This alert is waiting to be sent again to Synthetic Guardian.
NO_EXTERNAL_SENDS; no app lifespan or scheduler started; disposable SQLite/outbox removed at exit
```

Proof 2 output:

```text
Pulse escalation triggered: Tier 1
Tier 1 alert to contact 1 failed: synthetic
Retrying Tier 1 alert to contact 1 (attempt 2/3)
Tier 1 alert to contact 1 failed: synthetic
Pulse escalation triggered: Tier 2
TICKS 5; TIER1_FAILURE_ATTEMPTS 2 EXPECTED_RETRY_CAP 3 CURRENT_TIER 2
NO_EXTERNAL_SENDS; sender and reminders mocked; no app lifespan/scheduler startup; disposable DB removed
```

No fixes were applied. Root assigns canonical IDs, deduplicates cross-area findings and updates the existing execution plan.

## Canonical follow-up references

Progress and implementation status live only in [RECOVERY_EXECUTION_PLAN.md](../../RECOVERY_EXECUTION_PLAN.md). These are evidence cross-references, not another task board.

| Canonical card | Evidence reference |
|---|---|
| X342 | PULSE F1 |
| X343 | PULSE F2 |
| X344 | PULSE F3; supplemental template claims |
| X345 | PULSE F4 |
| X346 | PULSE F5 |
| X347 | PULSE F6 |
| X348 | PULSE F7 |
| X349 | PULSE F8 |
| X350 | PULSE additional owner-page error paths |
