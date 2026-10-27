---
type: frontend
title: Frontend State and SyncManager
description: How module stores persist data through SyncManager and SingletonSyncManager — localStorage-first loading, optimistic writes with rollback, snake/camel key conversion, the sync registry and global syncAll, the local-to-cloud migration path, and the namespaced persistence helpers.
tags: [frontend, state, sync, localstorage, svelte5]
verified:
  - by: openwiki/0.4.3
    at: 2026-10-27T00:41:19.118Z
sources:
  - id: openwiki-source-b8f9cc4b612027ee1143245a
    resource: repo://frontend/src/lib/services/sync.svelte.ts
  - id: openwiki-source-5ea2480e87f58467c23047b0
    resource: repo://frontend/src/lib/services/syncService.ts
  - id: openwiki-source-db154f029b9b856c12f66692
    resource: repo://frontend/src/lib/stores/estateStore.svelte.ts
  - id: openwiki-source-c46629f42a68b4eff315a78a
    resource: repo://frontend/src/lib/stores/letterStore.svelte.ts
  - id: openwiki-source-e165901f9e0f35e5396f369c
    resource: repo://frontend/src/lib/stores/persistence.ts
  - id: openwiki-source-a8a830617ab03d4b55d49d9a
    resource: repo://frontend/src/routes/%2Blayout.svelte
generated: { by: "codex", at: "2026-10-27T00:41:19.118Z" }
---

# Frontend State and SyncManager

Module data on the frontend flows through `frontend/src/lib/services/sync.svelte.ts`. Stores in `frontend/src/lib/stores/` register a manager there instead of calling the API themselves, so they all share the same caching, optimistic-update and error behaviour.

## Two manager types

| Class | Shape | Default API base | Used for |
|---|---|---|---|
| `SyncManager<T>` | A list of items with `id` | `/api/data` | Collections: letters, journal, vendors, utilities, timeline, calendar, contacts, medical directives, memories… |
| `SingletonSyncManager<T>` | One object | `/api` | One-per-user records: estate profile, funeral data, medical profile, advanced assets, concierge/scenario settings |

Both are Svelte 5 rune classes (`$state` fields for `items`/`data`, `status`, `lastSync`, `error`) and also expose a store-style `subscribe`, so components can use either `$store` syntax or the rune fields.

Stores create managers with `registerSync(key, endpoint, mapper?, apiBase?)` or `registerSingletonSync(...)`. Registration is idempotent per `key`: the first call creates the manager in a shared registry and later calls return the same instance. For example `letterStore` registers `('letters', 'letters', mapper, '/api/data')` and `estateStore` calls `registerProfileSlice('estate_profile', estateMapper)` against the single shared `/api/estate/profile` record.

## Lifecycle

1. **Immediate cache** — constructors read account/profile-scoped values through `getStored`, so records can render before the server answers. A cache is not proof of a completed save.
2. **Owned sync** — `init()` calls `sync()`; duplicate reads share an in-flight promise. Each operation captures session/account/profile ownership and ignores a delayed result after a switch.
3. **Server reconciliation** — returned rows become the saved base while fields with open updates remain overlaid. A failed initial read keeps the device copy and offers retry.
4. **Resumable migration** — local records never confirmed by this server or a saved pending upload are POSTed one by one. Remaining work stays in the original account/profile namespace; returning to that account resumes it. Records known to have existed on the server and since removed are not recreated.

`syncAll` starts stores shown by the active page first. Other ordinary stores follow after those answer and a short idle delay; on-demand stores (including letters) wait until shown, unless `everything` is requested. The dashboard requests everything. Registration after an active session starts also syncs the new manager, covering direct visits to lazy modules. The layout skips full-owner syncing on `/for/` recipient routes and clears managers on sign-out.

## Writes

- **`create(data)`** POSTs first and appends the server response only on success. Writes remove server-managed ID/user/timestamps consistently. A failed create retains its draft/recovery identity for retry.
- **`update(id, partial)`** applies the local patch optimistically, serializes requests to that row, and uses the returned server row as the confirmed base. Failure rolls back touched fields without replacing unrelated concurrent changes; the editor's draft remains available and the error is rethrown.
- **`delete(id)`** removes optimistically and treats 404 as already removed. On failure only the removed row is restored, preserving other concurrent changes, and a retry is offered without rethrowing. A failed post-delete follow-up never restores a record already removed on the server.
- **Standalone singleton saves** serialize from the confirmed base plus the explicit patch. Pending newer patches stay visible across an earlier failure. **Profile slices** share one record and post only changed keys so one slice cannot overwrite another slice's newer values.

Operations retain ownership throughout fetch, response and retry. Account changes stop work, keep recoverable drafts under their original namespace and prevent old responses or retry notices from mutating the new account's active records. Quiet background bookkeeping avoids changing the primary save status or displaying unrelated failures.

Failures show a gentle message through `notifications.showError` with technical details attached. When a store calls `setAffirmationContext(...)`, successful creates and updates also show an affirmation (for example `'letters'`, `'medical'`, `'heirlooms'`).

`audit()` re-fetches the remote list and compares ids with the local list (`onlyLocal`, `onlyRemote`, `matches`), for diagnostics such as the data settings page.

## Key conversion and mappers

Ordinary outgoing keys use snake_case and incoming keys camelCase. Known camelCase SQLModel fields (`ownershipDetails`, letter trigger fields and others in `CAMEL_WIRE_KEYS`) retain their exact wire spelling. Nested custom attributes and structured singleton values stay verbatim, preserving user-chosen keys. Selected object/array values for JSON text columns are serialized explicitly.

Per-store mappers still run both on outgoing data and incoming rows. They must normalize one authoritative spelling without letting stale aliases overwrite an edit; the letter mapper is an example. Trace the actual form/store/payload/model/reload contract rather than assuming case conversion alone proves completeness.

The manager's `fetch` calls set only `Authorization` (and `Content-Type`) themselves; the `X-CSRF-Token` header the backend requires in production is added by the global fetch wrapper in `frontend/src/hooks.client.ts` (see [System Architecture Overview](/openwiki/architecture/overview.md)).

## Persistence helpers

`frontend/src/lib/stores/persistence.ts` namespaces every cached value as:

```
continuum_acc_{activeAccountId or 'anonymous'}_prof_{currentProfileId or 'owner'}_{key}
```

`activeAccountId` comes from `keyringStore.ts` (a local list of signed-in emails) and `currentProfileId` from `profileContext.ts`, so one browser can hold separate caches per account and per profile. `setStored` updates an in-memory mirror and attempts localStorage. If the browser refuses, the newest value remains in memory and `cacheStorageState` reports that limit; `retryStored` retries device persistence only and never repeats an already-confirmed server POST. `createProfileStore(key, initial)` builds a plain writable store that re-reads on account or profile change and writes back on every change; stores built this way stay local-only unless they also use a SyncManager.

`frontend/src/lib/services/syncService.ts` is the legacy whole-blob sync: a two-second-debounced POST of `transparent_data` to `/api/estate`. New stores should use a manager instead.

## Adding a synced store

1. Make sure the backend has an endpoint (a `MODEL_MAP` entry for `/api/data/{name}` or a dedicated router) — see [Backend API and Routers](/openwiki/architecture/backend-api.md).
2. In `src/lib/stores/{name}Store.svelte.ts`, call `registerSync<T>('cache_key', 'endpoint', mapper, apiBase)`.
3. Expose the manager's `items`, `status`, `create`, `update` and `delete` from the store and call `init()` on the page and verify direct navigation after authentication; registration alone is not a substitute for proving the initial load. Use `registerProfileSlice` for a new estate-profile slice.

## Related pages

- [Backend API and Routers](/openwiki/architecture/backend-api.md)
- [Routes, Modules and Navigation](/openwiki/frontend/routes-and-navigation.md)
- [System Architecture Overview](/openwiki/architecture/overview.md)
