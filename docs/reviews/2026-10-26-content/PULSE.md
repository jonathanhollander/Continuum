# X391 — Pulse content and truthful actions

**2026-10-26 23:16 EDT.** `codex/X391`, base `249763c10a0d36acb10344e57d2c2dba3d0f59b3`. Nine approved pages plus the approved two-label `PulseContactsManager.svelte` companion. Backend behavior, scheduler, access policy, private gate, count formulas and cookies are unchanged.

## Changes and source trace

- **Overview:** describes saving notes and attempting alerts. **Record coverage score** explains the existing points-based recorded-information checks, separately from Pulse status; same percentage/source guard and synthetic **13% before/after**, coordinated with X390.
- **Contacts/escalation/settings:** explains explicit Pulse-tier precedence, Kept private fallback, interval → grace → Tier 1 wait, later waits from the previous stage, and personal waits replacing the tier wait. Matches X385's contacts hint.
- **Vault:** replaces unconditional privacy/release promises and assumed family relationships. Neutral Tier 1/2/3 and **Release from stage** accompany Automatic Release, current-outage reach, accepted personal-alert access and owner check-in reset conditions, with settings/Transparency links.
- **Messages:** visible **Save note**, accessible **Save note for [person]**, a blue-folder example and portal-reading conditions. Existing draft/retry/grouping/source-ID behavior remains. The phone form stacks input/button for the longer label.
- **History:** enrollment says **You turned on wellness check-ins**; unknown methods, including unknown `guardian_` methods, say **Recorded Pulse action**. Known methods retain their own labels.
- **Portal/verify:** describes recorded owner check-ins rather than “All is well” or guaranteed guardian notification. Six raw fetch calls now use existing `apiFetch`, preserving Response/status branches and CSRF/refresh/session handling. This repairs allowed-owner previews under the existing gate; it opens no endpoint.
- **Shared manager, two literals only:** **Alert if a timer expires / Safety timer alerts off**, matching the existing flag's behavior.

CodeGraph first, then omitted current template/caller sections. Read all changed sources; traced `apiFetch`, `hooks.client.ts`, private access, Pulse routes, tier helpers, scheduler deadlines/personal waits, `contact_reach`, portal/vault snapshot helpers and owner check-in reset. Explicit valid Pulse tier wins; otherwise call tiers 1/2/3 map to Pulse, while Kept private supplies no fallback. Vault requires Automatic Release, current-outage guardian reach and item threshold; an accepted personal-wait alert can open that guardian's tier earlier. Owner notes are a separate portal list. Guardian confirmation preserves the owner's timestamp.

## One focused composed proof

Copied the approved X350 synthetic SQLite fixture to `/private/tmp/continuum-x391-mpnvmvdp/proof.db`, migrating only that copy. Inline Python/Playwright; no new script/test file. Actual JWT/persisted users, server **8791**, lifespan off, example addresses, isolated uploads/local outbox and external HTTP/SMTP reject sentinels.

- Private allowed owner **200**; anonymous/other user **403**. Isolated flag-off valid anonymous token **200**, then private mode restored. Actual browser portal/vault/verify/nudge/confirm requests carried bearer. Unknown verify token retained its **404/rested** branch.
- Release off: token vault/Transparency **[]**. Release on: exact same **House keys, Pet care**, excluding **Later instructions**; full portal view equalled selected preview. Owner notes appeared in both conditions.
- Named enrollment agreed: **Bo Tier 1** fallback; **Ada Tier 2** overriding call Tier 1; **Dee Tier 3** despite Kept private fallback; **Cy excluded**. Local/prepared and provider-accepted outcome counts/IDs agreed with source rows.
- Keyboard Tab → named Save note → Enter saved one complete note, surviving reload and appearing in the actual portal. Enrollment and two unknown history rows displayed the intended labels.
- Main verify click added one `magic_link`, closed sensitive access and returned vault **[]**, matching Transparency while retaining two owner notes. Two later explicit synthetic clicks replaced transition screenshots; each added one check-in and **zero additional all-clear preparations**. Opening verify alone added zero rows. Successful writes were not replayed to repair recorder assertions.
- Nudge added one `contact_to_user` note. Confirmation recorded `guardian_confirmation`, retained owner time and left vault access closed.
- All nine **1440×900** pages and relevant details captured; overview/vault/messages at **375×812**. Page errors **0**; phone widths **375/375**. Final phone input **195.34×46 px**, button below **195.34×52.80 px**; desktop visible Save note button **134.89×52.80 px**, replacing the icon-only action. Vault conditions sit above Save. Settled screenshots were visually inspected after sidebar/fade/petal transitions.

Final **check: 0 errors / 0 warnings; static build passed; diff check passed**. Server restarted after final build. Main merged at start/final. Recorder-only assumptions about uppercase rendered headings/newest-first API order were corrected with failure checkpoints retained; completed mutations continued without replay. Fixture SQL naming/default mistakes were corrected before browser proof, not application defects.

## Evidence and limits

Private root `/private/tmp/continuum-x391-mpnvmvdp/`: final `artifact-manifest.json` hashes sources/evidence; `api-initial.json`, `after-ui-results.json`, `targeted-capture-results.json`, `settled-images-results.json`, before/after PNGs and failed-recorder checkpoints. Complete build/check/browser/server logs: `/private/tmp/continuum-x391-*.log`. The proof server was stopped; no app lifespan/scheduler, owner data, real provider/message, production access, push or deployment.

External guardian access remains under the owner's private-preview gate; token-page UI proof used the allowed synthetic owner. The flag-off API case verifies the retained public contract. Provider-accepted rows were synthetic records, not real deliveries. Prior scheduler/retry matrices and the manual were outside this content card. The shared safety-label finding was resolved in the approved companion; no remaining functional omission was found in the corrected paths.
