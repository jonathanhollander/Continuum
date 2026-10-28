---
type: frontend
title: Routes, Modules and Navigation
description: The SvelteKit route tree, the feature modules under /modules, how the sidebar groups and module catalog are defined in navigation.ts, how the root layout guards routes by login and role, and where UI labels and translations come from.
tags: [frontend, sveltekit, routing, navigation, localization]
sources:
  - id: openwiki-source-fcffbe3e28749eaf9a39557c
    resource: repo://backend/main.py
  - id: openwiki-source-67fc218f0ef51113a017c8bf
    resource: repo://frontend/_archive/routes/concierge-window/%2Bpage.svelte
  - id: openwiki-source-cf13a34d11e5e91843676cce
    resource: repo://frontend/_archive/routes/debug-textarea/%2Bpage.svelte
  - id: openwiki-source-2d4bce4d69833dfb0d987f4b
    resource: repo://frontend/_archive/routes/estate/%5Bid%5D/%2Bpage.svelte
  - id: openwiki-source-631b9ed4918280d50c52be99
    resource: repo://frontend/_archive/routes/test-registry/%2Bpage.svelte
  - id: openwiki-source-e2a1eb5fed659ae69f5d6aed
    resource: repo://frontend/src/lib/config/navigation.ts
  - id: openwiki-source-03e86e3a6251257bfb79f5e6
    resource: repo://frontend/src/lib/services/accessStatus.ts
  - id: openwiki-source-67156f86d79c4837cafc3c9f
    resource: repo://frontend/src/lib/stores/localization.ts
  - id: openwiki-source-a8a830617ab03d4b55d49d9a
    resource: repo://frontend/src/routes/%2Blayout.svelte
  - id: openwiki-source-626977162aa089188fd347cc
    resource: repo://frontend/src/routes/%2Bpage.ts
  - id: openwiki-source-e785dc8115d96129a58b8654
    resource: repo://frontend/src/routes/modules/%5Bid%5D/%2Bpage.svelte
  - id: openwiki-source-9f12d421e5b1384ec4277355
    resource: repo://frontend/src/routes/modules/%5Bid%5D/%2Bpage.ts
  - id: openwiki-source-59ab84fdf2da3d773ed27079
    resource: repo://frontend/src/routes/modules/anniversary-manager/%2Bpage.ts
  - id: openwiki-source-6ea17f618ad95605f8e1011a
    resource: repo://frontend/src/routes/modules/executor-guide/%2Bpage.ts
  - id: openwiki-source-060e6e4ffd9b41dc41adcfd0
    resource: repo://frontend/src/routes/pulse/%2Bpage.ts
  - id: openwiki-source-0eed3417ae81cad84b7c92a7
    resource: repo://frontend/src/routes/pulse/portal/%5Btoken%5D/%2Bpage.ts
generated: { by: "claude-code", at: "2026-10-28T04:26:57.052Z" }
verified:
  - by: openwiki/0.4.3
    at: 2026-10-28T04:26:57.052Z
---

# Routes, Modules and Navigation

All routes live under `frontend/src/routes/` and render only in the browser (the root `+layout.ts` sets `ssr = false`). The root `+layout.svelte` owns the app shell — sidebar, mobile navigation, concierge panel, notifications, command palette — and the navigation guard.

## Route tree

| Area | Routes |
|---|---|
| Public / marketing | `/marketing2` (with `/marketing2/features` and `/marketing2/how`); `/` permanently redirects there, keeping the query string |
| Auth | `/login`, `/signup`, `/auth/*` (magic-link verification) |
| Onboarding | `/start`, `/onboarding` |
| Main app | `/dashboard`, `/catalog`, `/settings` (including `/settings/data`), `/help`, `/resources/grief-support`, `/tools/ai-audit` |
| Feature modules | `/modules/<name>` — one folder per module |
| Handover and export | `/binder` (the "Red Binder"), `/export/preview`, `/executor`, `/for/[token]`, `/for/preview/[contactId]` |
| Pulse public pages | `/pulse/respond/[token]`, `/pulse/verify/[token]`, `/portal/[token]`; the older `/pulse/portal/[token]` address redirects to `/portal/[token]` |
| Administration | `/admin`, `/admin/ai-settings`, `/admin/users`, `/admin/automation`, `/admin/health`, `/admin/readiness`, `/admin/ui-audit` |

The old `/estate/[id]`, `/concierge-window`, `/debug-textarea` and `/test-registry` page sources live under `frontend/_archive/routes/`, outside the active route tree. No `/wizard` page exists in the active tree; the layout still recognizes that prefix in its public-route guard, which does not create a route. `/pulse` redirects to `/modules/pulse`, preserving its query string. The former `/welcome` page has been removed, and `/modules/anniversary-manager` now only redirects (301) to `/modules/calendar`, where Important Dates live as the same `calendar_events` records.

Modules under `frontend/src/routes/modules/` include `financial-accounts`, `insurance`, `contacts`, `legal-documents`, `medical`, `home-manual`, `pulse` (with sub-pages `vault`, `transparency`, `messages`, `history`, `contacts`, `escalation`, `settings`), `subscriptions`, `pets`, `property`, `digital-guardian`, `letters`, `heirlooms`, `legacy-journal`, `visual-memories`, `time-capsule`, `timeline`, `funeral`, `family-hub`, `calendar`, `scenario-mode`, `simulator`, `qr-codes`, `analytics`, `activity-log`, `advanced-registry`, `builders-console`, `treasure-hunt`, `executor-guide` and `executor-toolkit`. `/modules/executor-guide` is a redirect to `/modules/executor-toolkit`. Each module page usually pairs with a store in `frontend/src/lib/stores/` (see [Frontend State and SyncManager](/openwiki/frontend/state-and-sync.md)).

`/modules/[id]` is the generic registry fallback. It renders `ModuleContent` keyed by the current module ID; vault-like IDs redirect to `/modules/legal-documents`, and its load function returns the registry title (or "Page Moved") for the layout breadcrumb. Named module folders take precedence, keeping asset/contact editors on their own routes. Unknown registry IDs show a return-to-catalog state.

## Navigation configuration

`frontend/src/lib/config/navigation.ts` is the single definition of the sidebar and the module catalog.

- `navGroups` holds six sidebar groups: **Estate Overview**, **My Legacy**, **My Finances**, **My Instructions**, **People & Check-ins** and **Extras**. Legacy writing/memories and finances are directly available; optional groups collapse by default. Preview capabilities carry an Early preview flag.

- Each `NavItem` carries `label`, `key`, `href`, `icon` (from `lucide-svelte`), `allowedRoles` (`Owner`, `Executor`, `Family`) and optional flags such as `isCoreAction`, `isQuickStart` and `isExecutorEssential`.
- A separate list defines the Pulse sub-navigation.
- `catalogCategories` drives the `/catalog` page: **Life & Legacy** (letters, heirlooms, journal, visual memories, time capsule, timeline, final wishes, family tree) and **Helpful Tools** (binder, executor guide, practice run, QR codes, plan check-in, insights, activity history, future scenarios, event calendar, Additional Records, treasure hunt, builder tools). `advanced-registry` is labelled **Additional Records** (purchase history, maintenance, claims and account wishes) in both the sidebar and the catalog.
- `coreActions` is the subset across all groups flagged `isCoreAction`, used for onboarding progress.

The separate owner **For My Son (preview)** entry appears after My Instructions and opens recipient setup/preview. **Help & Resources** appears after Extras. Both stay out of module grids and the navGroups role guard.

To add a module to the sidebar or catalog, add its route folder and an entry here; the role check below reads the same entries.

## Route guard

Before either rule runs, the layout reads the server's private-preview decision from `frontend/src/lib/services/accessStatus.ts`. That store calls the public `GET /api/auth/access-status` (with the current bearer token, if any) whenever the auth session or stored token changes, ignoring responses from a superseded session. Until it reports `access_allowed: true`, the layout shows a loading screen or a "Continuum is private while it is being prepared" page with a sign-in link, and it skips global sync, user preferences, context/audit refresh, notifications and the navigation guard. `/login` and `/auth/verify` stay reachable so the allowed owner can sign in. See [Authentication](/openwiki/systems/authentication.md) for the server side.

The root layout calls `auth.init()` on mount, then, once access is allowed, a reactive effect enforces two rules after auth has finished loading:

1. **Login** — any route that is not a wizard/start route, a marketing route (`/marketing*` or `/`), or an auth/public Pulse route (`/login`, `/signup`, `/auth/*`, `/pulse/respond*`, `/pulse/verify*`) redirects to `/login` when there is neither a user nor a token and offline-local mode is not active. Public exceptions also include `/pulse/portal/`, `/portal/` guardian pages and `/for/` recipient pages.
2. **Role** — for a logged-in user, if the current path exactly matches a `navGroups` item whose `allowedRoles` does not include the current role, the user is sent to `/dashboard`. Paths not listed in `navGroups` (including catalog-only modules) are not role-checked.

The layout picks up `email`/`lang` handoff parameters only on `/start` and removes them while preserving other URL parameters. Sign-in establishes the active account; a URL does not register an active account. Recipient `/for/` routes use a filtered server payload and avoid initializing the owner's complete record collection.

## Labels and languages

There are two translation paths:

- `frontend/src/lib/stores/dictionary.ts` holds nested dictionaries for `en`, `es`, `fr`, `de`, `ru` and `he`. `localization.ts` reexports the shared concierge `language` store and provides a derived `t(key)` that tries flat/dotted keys, then English, then the key itself.
- `conciergeStore.svelte.ts` exports the same language source and its `t`, which the root layout imports.

Navigation labels in `navigation.ts` are plain English strings, while module headings often come from these dictionaries, so the same feature can appear under different names (for example the binder is "The Red Binder" in both, but `simulator` is "Practice Run" in the catalog and "Fire Drill" in the dictionary).

## Related pages

- [Frontend State and SyncManager](/openwiki/frontend/state-and-sync.md)
- [Media, Documents and Export](/openwiki/systems/media-documents-and-export.md)
- [Authentication](/openwiki/systems/authentication.md)
