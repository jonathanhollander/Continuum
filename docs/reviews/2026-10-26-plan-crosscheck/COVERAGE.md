# Review coverage inventory

**Last Updated:** 2026-10-26 15:32 EDT

**Source snapshot:** `8751f224b2a1bf0d915940f61242829d08964d18`. Inventory is tracked active entrypoints, not a browser pass or line-by-line certification. Supporting source actually inspected is enumerated in the linked area reports. Historical archives, generated output and worktrees were excluded.

## Frontend route files

All 98 tracked route files (including 71 page components) were assigned to functional review domains. Source/script/handler/data paths were reviewed; layout, translation, accessibility and CSS states were not exhaustively exercised.

| Route file | Review domain |
|---|---|
| `frontend/src/routes/+error.svelte` | ROOT |
| `frontend/src/routes/+layout.svelte` | [SHELL](SHELL.md) |
| `frontend/src/routes/+layout.ts` | [SHELL](SHELL.md) |
| `frontend/src/routes/+page.svelte` | [TOOLS](TOOLS.md) / [SHELL](SHELL.md) |
| `frontend/src/routes/admin/+layout.svelte` | [TOOLS](TOOLS.md) |
| `frontend/src/routes/admin/+page.svelte` | [TOOLS](TOOLS.md) |
| `frontend/src/routes/admin/+page.ts` | [TOOLS](TOOLS.md) |
| `frontend/src/routes/admin/automation/+page.svelte` | [TOOLS](TOOLS.md) |
| `frontend/src/routes/admin/automation/+page.ts` | [TOOLS](TOOLS.md) |
| `frontend/src/routes/admin/health/+page.svelte` | [TOOLS](TOOLS.md) |
| `frontend/src/routes/admin/health/+page.ts` | [TOOLS](TOOLS.md) |
| `frontend/src/routes/admin/readiness/+page.svelte` | [HANDOVER](HANDOVER.md) |
| `frontend/src/routes/admin/readiness/+page.ts` | [HANDOVER](HANDOVER.md) |
| `frontend/src/routes/admin/ui-audit/+page.svelte` | [TOOLS](TOOLS.md) |
| `frontend/src/routes/admin/ui-audit/+page.ts` | [TOOLS](TOOLS.md) |
| `frontend/src/routes/auth/verify/+page.svelte` | [SHELL](SHELL.md) |
| `frontend/src/routes/binder/+page.svelte` | [HANDOVER](HANDOVER.md) |
| `frontend/src/routes/binder/+page.ts` | [HANDOVER](HANDOVER.md) |
| `frontend/src/routes/catalog/+page.svelte` | [SHELL](SHELL.md) |
| `frontend/src/routes/dashboard/+page.svelte` | [SHELL](SHELL.md) / [HANDOVER](HANDOVER.md) |
| `frontend/src/routes/dashboard/+page.ts` | [SHELL](SHELL.md) / [HANDOVER](HANDOVER.md) |
| `frontend/src/routes/executor/+page.svelte` | [HANDOVER](HANDOVER.md) |
| `frontend/src/routes/executor/+page.ts` | [HANDOVER](HANDOVER.md) |
| `frontend/src/routes/export/preview/+page.svelte` | [HANDOVER](HANDOVER.md) |
| `frontend/src/routes/export/preview/+page.ts` | [HANDOVER](HANDOVER.md) |
| `frontend/src/routes/for/[token]/+page.svelte` | [HANDOVER](HANDOVER.md) |
| `frontend/src/routes/for/preview/[contactId]/+page.svelte` | [HANDOVER](HANDOVER.md) |
| `frontend/src/routes/help/+page.svelte` | [SHELL](SHELL.md) |
| `frontend/src/routes/help/+page.ts` | [SHELL](SHELL.md) |
| `frontend/src/routes/login/+page.svelte` | [SHELL](SHELL.md) |
| `frontend/src/routes/marketing2/+layout.svelte` | [TOOLS](TOOLS.md) / [SHELL](SHELL.md) |
| `frontend/src/routes/marketing2/+page.svelte` | [TOOLS](TOOLS.md) / [SHELL](SHELL.md) |
| `frontend/src/routes/marketing2/features/+page.svelte` | [TOOLS](TOOLS.md) / [SHELL](SHELL.md) |
| `frontend/src/routes/marketing2/how/+page.svelte` | [TOOLS](TOOLS.md) / [SHELL](SHELL.md) |
| `frontend/src/routes/modules/+layout.ts` | [SHELL](SHELL.md) |
| `frontend/src/routes/modules/[id]/+page.svelte` | [TOOLS](TOOLS.md) |
| `frontend/src/routes/modules/[id]/+page.ts` | [TOOLS](TOOLS.md) |
| `frontend/src/routes/modules/activity-log/+page.svelte` | [TOOLS](TOOLS.md) |
| `frontend/src/routes/modules/advanced-registry/+page.svelte` | [FINANCES](FINANCES.md) |
| `frontend/src/routes/modules/analytics/+page.svelte` | [HANDOVER](HANDOVER.md) |
| `frontend/src/routes/modules/anniversary-manager/+page.svelte` | [LEGACY](LEGACY.md) |
| `frontend/src/routes/modules/builders-console/+page.svelte` | [TOOLS](TOOLS.md) |
| `frontend/src/routes/modules/calendar/+page.svelte` | [LEGACY](LEGACY.md) |
| `frontend/src/routes/modules/contacts/+page.svelte` | [SHELL](SHELL.md) |
| `frontend/src/routes/modules/digital-guardian/+page.svelte` | [FINANCES](FINANCES.md) |
| `frontend/src/routes/modules/executor-guide/+page.ts` | [HANDOVER](HANDOVER.md) |
| `frontend/src/routes/modules/executor-toolkit/+page.svelte` | [HANDOVER](HANDOVER.md) |
| `frontend/src/routes/modules/family-hub/+page.svelte` | [LEGACY](LEGACY.md) |
| `frontend/src/routes/modules/financial-accounts/+page.svelte` | [FINANCES](FINANCES.md) |
| `frontend/src/routes/modules/funeral/+page.svelte` | [LEGACY](LEGACY.md) |
| `frontend/src/routes/modules/funeral/traditions/[type]/+page.svelte` | [LEGACY](LEGACY.md) |
| `frontend/src/routes/modules/heirlooms/+page.svelte` | [FINANCES](FINANCES.md) |
| `frontend/src/routes/modules/home-manual/+page.svelte` | [FINANCES](FINANCES.md) |
| `frontend/src/routes/modules/insurance/+page.svelte` | [FINANCES](FINANCES.md) |
| `frontend/src/routes/modules/legacy-journal/+page.svelte` | [LEGACY](LEGACY.md) |
| `frontend/src/routes/modules/legal-documents/+page.svelte` | [MEDIA](MEDIA.md) |
| `frontend/src/routes/modules/letters/+page.svelte` | [LEGACY](LEGACY.md) |
| `frontend/src/routes/modules/medical/+page.svelte` | [FINANCES](FINANCES.md) |
| `frontend/src/routes/modules/pets/+page.svelte` | [FINANCES](FINANCES.md) |
| `frontend/src/routes/modules/property/+page.svelte` | [FINANCES](FINANCES.md) |
| `frontend/src/routes/modules/pulse/+layout.svelte` | [PULSE](PULSE.md) |
| `frontend/src/routes/modules/pulse/+page.svelte` | [PULSE](PULSE.md) |
| `frontend/src/routes/modules/pulse/contacts/+page.svelte` | [PULSE](PULSE.md) |
| `frontend/src/routes/modules/pulse/escalation/+page.svelte` | [PULSE](PULSE.md) |
| `frontend/src/routes/modules/pulse/history/+page.svelte` | [PULSE](PULSE.md) |
| `frontend/src/routes/modules/pulse/messages/+page.svelte` | [PULSE](PULSE.md) |
| `frontend/src/routes/modules/pulse/settings/+page.svelte` | [PULSE](PULSE.md) |
| `frontend/src/routes/modules/pulse/transparency/+page.svelte` | [PULSE](PULSE.md) |
| `frontend/src/routes/modules/pulse/vault/+page.svelte` | [PULSE](PULSE.md) |
| `frontend/src/routes/modules/qr-codes/+page.svelte` | [TOOLS](TOOLS.md) |
| `frontend/src/routes/modules/scenario-mode/+page.svelte` | [TOOLS](TOOLS.md) |
| `frontend/src/routes/modules/simulator/+page.svelte` | [TOOLS](TOOLS.md) |
| `frontend/src/routes/modules/subscriptions/+page.svelte` | [FINANCES](FINANCES.md) |
| `frontend/src/routes/modules/time-capsule/+page.svelte` | [LEGACY](LEGACY.md) |
| `frontend/src/routes/modules/timeline/+page.svelte` | [LEGACY](LEGACY.md) |
| `frontend/src/routes/modules/treasure-hunt/+page.svelte` | [TOOLS](TOOLS.md) |
| `frontend/src/routes/modules/visual-memories/+page.svelte` | [MEDIA](MEDIA.md) |
| `frontend/src/routes/onboarding/+page.svelte` | [SHELL](SHELL.md) |
| `frontend/src/routes/onboarding/+page.ts` | [SHELL](SHELL.md) |
| `frontend/src/routes/portal/[token]/+page.svelte` | [PULSE](PULSE.md) |
| `frontend/src/routes/pulse/+page.svelte` | [PULSE](PULSE.md) |
| `frontend/src/routes/pulse/+page.ts` | [PULSE](PULSE.md) |
| `frontend/src/routes/pulse/portal/[token]/+page.svelte` | [PULSE](PULSE.md) |
| `frontend/src/routes/pulse/portal/[token]/+page.ts` | [PULSE](PULSE.md) |
| `frontend/src/routes/pulse/respond/[token]/+page.svelte` | [PULSE](PULSE.md) |
| `frontend/src/routes/pulse/verify/[token]/+page.svelte` | [PULSE](PULSE.md) |
| `frontend/src/routes/resources/grief-support/+page.svelte` | [TOOLS](TOOLS.md) |
| `frontend/src/routes/resources/grief-support/+page.ts` | [TOOLS](TOOLS.md) |
| `frontend/src/routes/settings/+page.svelte` | [SHELL](SHELL.md) |
| `frontend/src/routes/settings/+page.ts` | [SHELL](SHELL.md) |
| `frontend/src/routes/settings/data/+page.svelte` | [SHELL](SHELL.md) |
| `frontend/src/routes/settings/data/+page.ts` | [SHELL](SHELL.md) |
| `frontend/src/routes/signup/+page.svelte` | [SHELL](SHELL.md) |
| `frontend/src/routes/start/+page.svelte` | [SHELL](SHELL.md) |
| `frontend/src/routes/tools/ai-audit/+page.svelte` | [TOOLS](TOOLS.md) |
| `frontend/src/routes/tools/ai-audit/+page.ts` | [TOOLS](TOOLS.md) |
| `frontend/src/routes/welcome/+page.svelte` | [SHELL](SHELL.md) |
| `frontend/src/routes/welcome/+page.ts` | [SHELL](SHELL.md) |

## Backend routers

All 13 tracked router files were assigned. Domain source paths and request/model contracts were reviewed; real provider calls, production operations and hardening were outside scope.

| Router file | Review domain |
|---|---|
| `backend/routers/__init__.py` | ROOT (package initialization) |
| `backend/routers/ai_proxy.py` | TOOLS |
| `backend/routers/auth.py` | SHELL / SCHEMA |
| `backend/routers/contacts.py` | SHELL / PULSE |
| `backend/routers/email.py` | PULSE / ROOT |
| `backend/routers/estate_data.py` | CONTRACTS / SCHEMA |
| `backend/routers/export.py` | HANDOVER |
| `backend/routers/media.py` | MEDIA |
| `backend/routers/medical.py` | FINANCES / SCHEMA |
| `backend/routers/memories.py` | MEDIA / LEGACY |
| `backend/routers/pulse.py` | PULSE |
| `backend/routers/recipient.py` | HANDOVER |
| `backend/routers/support.py` | TOOLS / SHELL |

## Shared code and validation boundary

CONTRACTS traces synchronization, persistence, auth/client transport, registration and account lifetimes. SCHEMA traces models, runtime migration and the fresh Alembic chain. Domain agents follow their components/stores/services through endpoints/models and reader/output interfaces. Cross-area source references are in the nine reports; VALIDATION independently challenged three high-impact findings. ROOT additionally read the root error/load hooks, shared auth/export/timeline paths, missing-provider support path and email status/resend/webhook functional code.

The active-source inventory count of 340 is not a claim that every file or line was independently inspected. CodeGraph call paths can include archived definitions; only reachable active paths were promoted as defects. Each report distinguishes source confirmation, isolated execution, optional scope and intentional owner deferral. No browser/screenshot/full-suite run or new application test files were used.
