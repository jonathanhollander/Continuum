# X389 — Entry, settings and supporting tools

Last Updated: 2026-10-26 23:24 EDT
Source base: `249763c10a0d36acb10344e57d2c2dba3d0f59b3`; branch `codex/X389`.

The 17 source files below now describe their actual actions and give a concrete next step. Private access, auth flows, store/API contracts, checklist keys, filters and counts remain intact. Welcome uses the saved `display_name` returned by `/api/auth/me`, preserving the chosen name and using a neutral greeting when blank.

| Source / surface | Change |
| --- | --- |
| `routes/login`, `signup`, `start`, `onboarding`, `welcome` (`+page.svelte`) | Explain device passkeys and email sign-in consistently; replace “Expert Control” with “Open my records” alongside “Help me decide what to record”; explain display-name purpose; describe recording a trusted contact, creating their link and previewing its contents as separate steps. |
| `lib/components/concierge/ConciergeSettings.svelte` | Perspective describes viewing the current account’s records; recipient links/previews explain sharing. Shared dictionary changes remain X388-owned. |
| `routes/settings/+page.svelte`, `routes/settings/data/+page.ts`, `routes/settings/data/+page.svelte` | Card, breadcrumb and page agree on “Your record copies.” Device/account counts, comparison and sync actions use direct labels. Record-ID presence is “In account copy,” rather than claiming field equality. Origins are “Sample entry” / “Your record.” |
| `lib/components/ModuleContent.svelte`, `lib/stores/acceptanceStore.svelte.ts`, `routes/modules/builders-console/+page.svelte` | Destination-specific review instructions replace generic attachment requests. Preserve all 38 tasks, five hub steps per role, links, status values and depth filters. Percentages explicitly count manual ticks. QR checks test signed-in shortcuts; letter checks review letter drafts. Depth descriptions match the tasks actually shown. The existing dark depth panel now has a readable white heading. |
| `routes/modules/calendar/+page.svelte`, `routes/modules/anniversary-manager/+page.svelte` | Explain saved dates, wishes and draft messages; “Save date” and “Open email draft” describe actual controls. Remove arriving-reminder and guaranteed emotional-outcome claims. Ritual suggestions are ideas, rather than an implied library service. |
| `routes/modules/treasure-hunt/+page.svelte`, `activity-log/+page.svelte`, `qr-codes/+page.svelte` | Search results are possible matches requiring administrator verification; activity empty state describes supported recorded events; generated asset QR labels say “QR code created.” |

Paths in the table are relative to `frontend/src/`. Source tracing used CodeGraph first, followed by current source and relevant auth/onboarding, profile/context, sync, calendar, QR and factory paths. Module descriptions remain in the dynamic route header; the duplicate overview now explains how to use its checklist.

## Focused verification

Approved T-X389 reuses `/private/tmp/continuum-x375-proof.mjs`, with isolated actual SvelteKit UI at 1440×900 and synthetic intercepted APIs. Completed evidence: `/private/tmp/continuum-x389/proof.json` (26 assertions), screenshots in that directory, and `continuum-x389-*.log` under `/private/tmp/`.

- Start’s direct-entry action still opens Dashboard. Saved display name appears exactly; blank name has a neutral greeting. Onboarding and perspective guidance render in their real routes.
- Canonical task IDs, destinations, roles, sections, status values and depth memberships compare equal before/after: **38 total; 14 simple, 36 moderate, 38 complex**. Existing task 9 remains ticked; ticking task 1 survives reload. Original synthetic backend note on row 38931 remains unchanged. Hub screenshot shows its existing 1/5 manual ticks as 20% checked.
- Data comparison shows contact IDs **38921/38922**, two device/account records, and correct sample/other-record origins. Detail capture preserves the exact IDs beside “In account copy.” No count formulas or counted membership changed.
- Calendar’s existing recipient/subject/body produces the exact `mailto:` draft; Save date and manual-send guidance render. Important Dates, search, log and generated QR labels match their actual controls. Escape dismisses both existing date dialogs.
- Anonymous private signup stays closed. In a separately mocked public configuration, signup explains email sign-in; login help explains both alternatives. No passkey, inference, email or real database operation runs. Completed resumed segments report zero browser page errors; owned runtime is stopped.
- `npm run check`: **0 errors, 0 warnings**. `npm run build`: **pass**. Final full output retained in `/private/tmp/continuum-x389-final-check.log` and `continuum-x389-final-build.log`; final rerun follows the explicitly approved two title companions and heading contrast change.

Visual inspection covered the entry/name, perspective, data/detail, checklist/depth, hub, date dialogs, signup/login states and supporting-tool captures. Initial animation-time captures were replaced by settled views; the depth-heading contrast issue was corrected and recaptured.

Harness/setup failures are retained in `first-failure.json` through `ninth-failure.json` and the corresponding logs: early readiness/selector assumptions, an already-completed onboarding fixture, CSS case, an empty-document import during resume, sample registry owner/key setup, a generated-client module fetch failure in the first anonymous context, and the public access-status fixture. Only affected/unfinished segments resumed; these did not require application logic repairs. The initial check before linking existing dependencies could not locate `svelte-kit`; both subsequent checks passed.

Limits: APIs and persistence responses are synthetic; no real authentication/device credential, delivery, third-party claim, production mutation or new legal/financial capability is asserted. This is content and counted-membership verification, not a new full feature regression. No phone/CSS redesign or manual-document change was made.
