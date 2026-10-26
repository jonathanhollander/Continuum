---
type: frontend
title: Routes, Modules and Navigation
description: The SvelteKit route tree, the feature modules under /modules, how the sidebar groups and module catalog are defined in navigation.ts, how the root layout guards routes by login and role, and where UI labels and translations come from.
tags: [frontend, sveltekit, routing, navigation, localization]
verified:
  - by: openwiki/0.4.3
    at: 2026-10-26T04:52:34.633Z
sources:
  - id: openwiki-source-e2a1eb5fed659ae69f5d6aed
    resource: repo://frontend/src/lib/config/navigation.ts
  - id: openwiki-source-31fcf8401ce8aff9dc0a5aff
    resource: repo://frontend/src/lib/stores/dictionary.ts
  - id: openwiki-source-67156f86d79c4837cafc3c9f
    resource: repo://frontend/src/lib/stores/localization.ts
  - id: openwiki-source-a8a830617ab03d4b55d49d9a
    resource: repo://frontend/src/routes/%2Blayout.svelte
  - id: openwiki-source-e785dc8115d96129a58b8654
    resource: repo://frontend/src/routes/modules/%5Bid%5D/%2Bpage.svelte
generated: { by: "claude-code", at: "2026-10-26T04:52:34.633Z" }
---

# Routes, Modules and Navigation

All routes live under `frontend/src/routes/` and render only in the browser (the root `+layout.ts` sets `ssr = false`). The root `+layout.svelte` owns the app shell — sidebar, mobile navigation, concierge panel, notifications, command palette — and the navigation guard.

## Route tree

| Area | Routes |
|---|---|
| Public / marketing | `/` and `/marketing2` |
| Auth | `/login`, `/signup`, `/auth/*` (magic-link verification) |
| Onboarding | `/start`, `/welcome`, `/onboarding`, `/wizard` paths |
| Main app | `/dashboard`, `/catalog`, `/settings`, `/help`, `/resources`, `/tools` |
| Feature modules | `/modules/<name>` — one folder per module |
| Handover and export | `/binder` (the "Red Binder"), `/export` (preview), `/executor`, `/portal` |
| Pulse public pages | `/pulse/respond`, `/pulse/verify` (token links from email) |
| Other | `/admin`, `/estate`, `/concierge-window`, `/debug-textarea`, `/test-registry` |

Modules under `frontend/src/routes/modules/` include `financial-accounts`, `insurance`, `contacts`, `legal-documents`, `medical`, `home-manual`, `pulse` (with sub-pages `vault`, `transparency`, `messages`, `history`, `contacts`, `escalation`, `settings`), `subscriptions`, `pets`, `property`, `digital-guardian`, `letters`, `heirlooms`, `legacy-journal`, `visual-memories`, `time-capsule`, `timeline`, `funeral`, `family-hub`, `calendar`, `scenario-mode`, `simulator`, `qr-codes`, `analytics`, `activity-log`, `anniversary-manager`, `advanced-registry`, `builders-console`, `treasure-hunt`, `executor-guide` and `executor-toolkit`. Each module page usually pairs with a store in `frontend/src/lib/stores/` (see [Frontend State and SyncManager](/openwiki/frontend/state-and-sync.md)).

`/modules/[id]` is a generic fallback. It looks the id up in `src/lib/data/registry.json` and picks an archetype component by substring of the id: `AssetManager` for financial, property, insurance, subscription, asset, vehicle or estate ids, `ContactDirectory` for contacts and beneficiaries, and the task or document archetypes otherwise. Named module folders take precedence over `[id]`.

## Navigation configuration

`frontend/src/lib/config/navigation.ts` is the single definition of the sidebar and the module catalog.

- `navGroups` holds the sidebar groups, in order: **What Matters Most** (`groupEssentials`, marked primary: dashboard, financial accounts, insurance, contacts, legal documents, medical, home manual, Pulse), **When You're Ready** (subscriptions, pets, property, digital guardian), **Life & Legacy** (catalog, letters, heirlooms, binder, settings) and **Extras** (family hub, scenario mode, calendar, complete record, builder tools, treasure hunt).
- Each `NavItem` carries `label`, `key`, `href`, `icon` (from `lucide-svelte`), `allowedRoles` (`Owner`, `Executor`, `Family`) and optional flags such as `isCoreAction`, `isQuickStart` and `isExecutorEssential`.
- A separate list defines the Pulse sub-navigation.
- `catalogCategories` drives the `/catalog` page: **Life & Legacy** (letters, heirlooms, journal, visual memories, time capsule, timeline, final wishes, family tree) and **Helpful Tools** (binder, executor guide, practice run, QR codes, insights, activity history, important dates, scenarios, calendar, complete record, treasure hunt, builder tools).
- `coreActions` is the subset of the first group flagged `isCoreAction`, used for onboarding progress.

To add a module to the sidebar or catalog, add its route folder and an entry here; the role check below reads the same entries.

## Route guard

The root layout calls `auth.init()` on mount, then a reactive effect enforces two rules once auth has finished loading:

1. **Login** — any route that is not a wizard/start route, a marketing route (`/marketing*` or `/`), or an auth/public Pulse route (`/login`, `/signup`, `/auth/*`, `/pulse/respond*`, `/pulse/verify*`) redirects to `/login` when there is neither a user nor a token.
2. **Role** — for a logged-in user, if the current path exactly matches a `navGroups` item whose `allowedRoles` does not include the current role, the user is sent to `/dashboard`. Paths not listed in `navGroups` (including catalog-only modules) are not role-checked.

The same layout also handles hand-off links: an `email` (and optional `lang`) query parameter registers the account locally and is then removed from the URL.

## Labels and languages

There are two translation paths:

- `frontend/src/lib/stores/dictionary.ts` holds nested dictionaries for `en`, `es`, `fr`, `de`, `ru` and `he`. `localization.ts` exposes an `activeLanguage` store and a derived `t(key)` that tries the flat key, then a dotted path, and falls back to the key itself.
- `conciergeStore.svelte.ts` exports its own `t`, which the root layout imports.

Navigation labels in `navigation.ts` are plain English strings, while module headings often come from these dictionaries, so the same feature can appear under different names (for example the binder is "The Red Binder" in both, but `simulator` is "Practice Run" in the catalog and "Fire Drill" in the dictionary).

## Related pages

- [Frontend State and SyncManager](/openwiki/frontend/state-and-sync.md)
- [Media, Documents and Export](/openwiki/systems/media-documents-and-export.md)
- [Authentication](/openwiki/systems/authentication.md)
