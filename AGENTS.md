# Continuum — instructions for coding agents

**Last Updated:** 2026-10-26 EDT

## Purpose and current priority

Continuum is Jonathan's personal legacy and financial handover for his son in the event of Jonathan's death. Optimize for these two people before treating this as a general estate-planning SaaS product.

The product must let Jonathan record, revise, and preserve both practical information and his own words. His son must be able to find it, understand it, and take a useful copy away without Jonathan explaining the interface.

**Owner direction for this recovery: features and usability first. Security hardening, administration, commercial features, and deployment infrastructure are deferred.** Do not spend the feature budget on those areas unless Jonathan changes the priority. Preserve existing protections while working. Data actually saving, surviving reloads, remaining complete, and reaching the intended reader are core functionality and remain essential now.

The first assignment was review and documentation, not an application rewrite or deployment. The initial evidence and open issue register are in [the recovery review](docs/reviews/2026-10-25-features-usability/REVIEW.md). The canonical roadmap is [PROJECT_RECOVERY_PLAN.md](docs/PROJECT_RECOVERY_PLAN.md), with task cards in [RECOVERY_EXECUTION_PLAN.md](docs/RECOVERY_EXECUTION_PLAN.md). Reconcile the review's verified CU findings into the relevant cards when implementing; do not create another competing task board. Update issue status and evidence when a fix is verified. Historical `*_COMPLETE.md`, audit reports, and task lists are background, not proof of current behavior. A plan's suggested dispatch or deployment step does not itself authorize those actions.

## Product direction

Build and assess these journeys end to end:

1. **Record my life:** letters to my son, stories, values, lessons, photographs, recordings, and the meaning and intended recipients of heirlooms.
2. **Explain my finances:** accounts, institutions, identifying details, ownership, beneficiaries, debts, insurance, recurring payments, advisors, relevant documents, and what to do next.
3. **Prepare the handover:** identify my son and any executor, explain where originals are, preview what my son will see, and produce a complete readable copy.
4. **Help my son:** a clear starting point, immediate practical steps, people to contact, searchable records and attachments, and a separate place for personal messages and memories.

Legacy and financial information are both primary needs. Do not bury personal messages behind optional-tool catalogs. Treat a letter to a son as a first-class writing task; do not require a spouse template or a generic ethical will.

Prefer improving and connecting existing functionality over adding modules. Use progressive disclosure for optional tools. Keep wellness monitoring, simulations, analytics, QR tools, builder tools, and marketing work secondary to recording and handover. Do not silently remove those capabilities while simplifying navigation.

Use calm, direct language and familiar labels. Explain the next action with a short example. Avoid repeated long emotional introductions, guilt, fabricated urgency, and vague success messages. A useful label such as “Save letter” is better than wording that conceals the action.

## Actual architecture

- Active frontend: `frontend/`, Svelte 5, SvelteKit 2, TypeScript, Vite 6, Tailwind 4.
- Routes: `frontend/src/routes/`; shared components: `frontend/src/lib/components/`.
- Navigation and catalog: `frontend/src/lib/config/navigation.ts`; labels also come from localization dictionaries.
- State and persistence: `frontend/src/lib/stores/`, `frontend/src/lib/services/sync.svelte.ts`, and `frontend/src/lib/stores/persistence.ts`.
- Active backend: FastAPI in `backend/main.py`, domain routers in `backend/routers/`.
- Database: SQLModel/SQLAlchemy; `backend/database.py`, `backend/estate_models.py`, `backend/models/`.
- Generic collection API: `/api/data/{data_type}`, resolved by `MODEL_MAP` in `backend/routers/estate_data.py`. Dedicated APIs also exist for contacts, memories, medical data, documents, media, and Pulse.
- Schema history: `backend/alembic/`. Runtime schema mutation also exists in `backend/database.py`; account for both when changing persistence.
- Exports: `frontend/src/lib/services/exportService.ts`, `/export/preview`, and `/binder`. These currently have different coverage and sources.
- Files and recordings: backend media storage, browser IndexedDB, data URLs, and object URLs coexist. Do not assume they are interchangeable or available on another device.
- `legacy_nextjs_archive/` is historical Next.js code. The old root README was a Next.js template; the current documentation index is `docs/README.md`. Root `npm` commands do not run the active application.
- Former `continuum-agents/` and `agents/` specifications are now under `docs/agent-specs/`; historical plans/reports are in `docs/archive/`. These and `.agent/`/`.claude/` reference material do not authorize launching agents or replacing the current owner priorities.

## Locate code with the existing knowledge indexes

Use the repository's OpenWiki, CodeGraph and graphify indexes before broad searches or repeated file reads. Check which indexes exist once, choose the route that answers the task, and reuse the results. Do not repeat the same discovery through all three tools when it is already answered.

- **System or workflow orientation:** start with [OpenWiki quickstart](openwiki/quickstart.md), then the relevant topic page. Follow its source references into the implementation instead of searching the whole repository. Read only the relevant pages; unrelated wiki pages are not required startup reading.
- **Symbols, implementation and call paths:** when `.codegraph/` exists, use CodeGraph **before** grep/find or source reads. Call MCP `codegraph_explore` with this repository's absolute `projectPath` and the feature, file or symbol; shell fallback: `codegraph explore "<symbols or question>"`. Its line-numbered source is already read: do not immediately reread those files or reconstruct its call paths with grep.
- **Architecture, concepts and relationships:** when `graphify-out/graph.json` exists, use `graphify query "<relationship or concept>"`, `graphify path` or `graphify explain`. The overview is [Graphify report](graphify-out/GRAPH_REPORT.md). The installed package is `graphifyy`; its CLI is `graphify`.

Use narrow `rg` or targeted source reads only for a specific gap, unindexed content, an omitted body or a stale-source warning. If output is clipped, retrieve the missing symbol or range rather than starting another broad search. Source code and tests remain authoritative when a wiki or graph is stale. If an index/tool is unavailable, continue with targeted fallback tools; do not install, initialize or refresh it unless requested. Routine discovery must not call external LLM providers.

## Persistence and feature invariants

- Trace every change through **form → store → request payload → API/model → reload → reader/export**. A successful HTTP response alone does not prove fields survived.
- There are known contract defects in `SyncManager` and its callers. Prefer repairing the shared path, but do not treat its current implementation as correct merely because older documentation calls it mandatory.
- Make request and response mappings explicit. The shared mapper currently runs in both directions and recursively converts keys; several SQLModel fields are camelCase. Preserve user-defined custom-field keys.
- Strip server-managed identifiers and timestamps consistently from writes. Do not strip a required client-generated ID without resolving that endpoint's contract.
- Registering a store does not fetch it. Verify initialization after authentication and when visiting a lazily loaded module directly.
- Preserve drafts on save failure, show the actual save state, and provide retry. Success requires persistence of the intended fields. Background activity logging must not make a successful record save appear to fail.
- Collections must have the correct category membership. `properties`, `digital_assets`, and generic `heirlooms` currently alias the same Asset table without filtering.
- Singleton APIs must return and update a singleton. Do not use a list endpoint as an object endpoint or create a new row for every preference/wishes edit.
- Account/profile changes must reload the correct state. The server currently scopes most records by user, whereas browser keys also include profiles; do not imply independent estates until this works through the API.
- Recorded financial values need clear meaning, ownership treatment, debt treatment, and currency. Never invent growth charts, balances, valuations, personal facts, or history.
- Writing assistance must preserve the author's intent and require review before replacing their words. Label examples and simulations. Do not present canned analysis as analysis of a real photograph or document.
- A saved trigger date is not delivered correspondence. Do not promise scheduled release or delivery without a working, verified execution and recipient path.
- Browser-only recordings and temporary blob URLs are not a durable family archive. Verify attachments from a fresh browser context and include them, or an explicit usable attachment manifest, in a handover.

## Counts, readiness, proof, and export agreement

When changing a displayed count, total, readiness claim, or included item list, update and verify all related displays, exports, and companion verification/proof views in the same task. Include item membership and source-record drilldowns, not just equal totals. Update independent recounts and saved-count/change tracking where present. Report any remaining limitation; do not call the feature complete or deploy with companion proof work unfinished.

Never label an empty vault “100% protected,” a browser-only draft “kept safe,” or a partial export “full.” Readiness must be based on meaningful recorded information, with “unknown,” “not applicable,” and “not yet recorded” distinguished. A count measures records, not legal validity or plan completeness.

For export work, check that the on-screen record, printed binder, PDF, structured data, and attachment list agree. Preserve full letter/story text and the actual owner/recipient names. Verify from a fresh load, including empty and partially completed plans.

## Verification and local development

Use Node 20+ as required by `frontend/package.json`. Frontend commands run inside `frontend/`:

```sh
npm ci
npm run check
npm run build
npm run dev
```

Do not run `npm ci` over someone else's active dependency changes merely to perform a review. Inspect the worktree first. There are no frontend `test`, `test:watch`, or `test:e2e` scripts in the reviewed package; `docs/TESTING.md` describes tools that are not configured.

Backend dependencies are listed in `backend/requirements.txt`; isolate them in a virtual environment. Run backend commands from the repository root. `python -m backend.main` (or `uvicorn backend.main:app`) starts without a frontend build since card A4; the SPA routes return 404 until `frontend/dist` exists. Keep model imports aligned with `backend/alembic/env.py` for migrations.

Backend requirements are pinned to production's freeze since card A1. Before that, the unbounded requirements were not reproducible: the initial review's fresh SQLModel 0.0.48 / SQLAlchemy 2.1.6 environment failed to seed a user because of naive datetime defaults. API probes used an explicitly documented temporary SQLModel 0.0.31 / SQLAlchemy 2.0.55 compatibility environment. That is review evidence, not an approved production dependency change.

Use a disposable database, uploads directory, local outbox, synthetic names, and reserved example addresses for tests and screenshots. Do not read, seed, migrate, or alter the owner's existing databases to test features. Do not send email or messages. The Pulse scheduler currently ignores `PULSE_SCHEDULER_ENABLED`; avoid application lifespan startup in API probes or explicitly replace the scheduler in an isolated test harness.

The initial review's [reproduction script](docs/reviews/2026-10-25-features-usability/evidence/reproduce_api_probes.py) creates its own temporary database and skips startup. It is an observational probe script, not a passing regression suite. Its dependency override does not verify real recipient access or authentication.

For a functional fix, add focused regression checks for the failure that matters: full field round-trip, reload, category separation, failed-save draft retention, attachment retrieval, or export completeness. Run the applicable existing checks and report their real result. A build can succeed while type checking and user journeys fail.

For UX changes, inspect the working interface on desktop and phone, including keyboard operation, form errors, loading, empty states, long records, and successful saves. Modals need meaningful labels, focus management, keyboard dismissal, and an accessible close control. Honor font-size and reduced-motion preferences.

When adding or materially changing a manual section, capture actual working-interface screenshots with the existing screenshot tool, using fake data. Include desktop/phone and relevant detail states; update screenshot definitions, figure references, and index; regenerate the manual PDF and source fingerprint; visually verify the images and affected PDF pages before claiming completion. Definitions alone are not captures.

## Scope and collaboration

Preserve intended outcomes and functional invariants, not an accidental presentation. Icons, tooltips, grouping, and progressive disclosure may replace existing controls when the capability remains clear and usable. If materially different interpretations would change UX, scope, risk, cost, visibility, or outcome and the preference is unclear, ask once, then execute the answer.

Use the existing checkout or a suitable worktree when possible. Do not deploy, publish, send correspondence, perform a broad rewrite, or delete working features as part of a review. Do not spawn subagents merely because this file is named `AGENTS.md`; use them only when the user or applicable instructions explicitly request delegation.

## Git, worktrees, and preservation

- Inspect `git status` before edits. Preserve unrelated and concurrent changes, including lockfiles and tool configuration. Do not commit secrets, real family records, databases, or test captures containing actual personal data.
- Every new worktree must be **inside this repository**, at `.worktrees/<name>`. Add `.worktrees/` to this project's `.gitignore` before creating the first one. Never create sibling `<project>-<branch>` folders under `~/AI Code`.
- Use `git worktree move` to relocate ordinary worktrees, never `mv`. Follow the app's managed-worktree lifecycle only if its placement satisfies the owner's nested-worktree rule.
- At the end of completed work, safely clean up worktrees no longer needed. Verify merged or backed-up work; preserve unique uncommitted/ignored databases, datasets, config, and secrets; retain shared canonical data. Never remove the primary checkout or another active task's worktree. Use `git worktree remove` for ordinary worktrees and the archive tool for managed worktrees. Keep branches and central stashes unless separately authorized to delete them. Report cleanup and reclaimed space.
- Before deleting **any directory containing a repository**, check all five: unpushed commits; uncommitted files; stashes; ignored unique files; and no-upstream branches with commits unreachable from remote refs. Archive-like folder names do not prove backup.
- For apparent worktrees, inspect whether `.git` is a file or directory and whether its gitdir target exists. A dead pointer may mean the contents are the only copy; compare against the remote first.
- Preserve before deletion: commit/push appropriate work, back up each stash as a remote branch, copy needed ignored files outside the deletion target, and verify remote refs with `git ls-remote`. Scan dormant/untracked content for credentials before committing, especially to public remotes. Never push credentials as part of a backup.

## Completion standard

A recovery feature is complete when Jonathan can enter representative information, see exactly what is saved, reload it without losing fields, find it easily, and verify the same information in his son's view and the relevant handover output. Document what was tested, what remains open, and any limitation. Security and admin deferral must not become an excuse for a handover that loses information or cannot be used.

<!-- OPENWIKI:START -->

## OpenWiki

This repository has a generated `openwiki/` evidence index. It is optional just-in-time context, not required startup reading.

- Treat source code and tests as authoritative. A brief's unknowns and review items are verification gaps, not automatic requirements.
- Prefer the narrowest quiet validation that proves the changed behavior. Preserve complete failure output.

There is no scheduled workflow; the wiki is refreshed on demand through the OpenWiki MCP tools (the `/jhupdate3` run). Do not hand-edit generated OpenWiki pages unless explicitly asked; prefer updating source code/docs and letting OpenWiki regenerate.

<!-- OPENWIKI:END -->
