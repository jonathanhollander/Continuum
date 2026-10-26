---
type: frontend
title: Frontend State and SyncManager
description: How module stores persist data through SyncManager and SingletonSyncManager — localStorage-first loading, optimistic writes with rollback, snake/camel key conversion, the sync registry and global syncAll, the local-to-cloud migration path, and the namespaced persistence helpers.
tags: [frontend, state, sync, localstorage, svelte5]
verified:
  - by: openwiki/0.4.3
    at: 2026-10-26T04:52:34.633Z
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
generated: { by: "claude-code", at: "2026-10-26T04:52:34.633Z" }
---

# Frontend State and SyncManager

Module data on the frontend flows through `frontend/src/lib/services/sync.svelte.ts`. Stores in `frontend/src/lib/stores/` register a manager there instead of calling the API themselves, so they all share the same caching, optimistic-update and error behaviour.

## Two manager types

| Class | Shape | Default API base | Used for |
|---|---|---|---|
| `SyncManager<T>` | A list of items with `id` | `/api/data` | Collections: letters, journal, vendors, utilities, timeline, calendar, contacts, medical directives, memories… |
| `SingletonSyncManager<T>` | One object | `/api` | One-per-user records: estate profile, funeral data, medical profile, advanced assets, concierge/scenario settings |

Both are Svelte 5 rune classes (`$state` fields for `items`/`data`, `status`, `lastSync`, `error`) and also expose a store-style `subscribe`, so components can use either `$store` syntax or the rune fields.

Stores create managers with `registerSync(key, endpoint, mapper?, apiBase?)` or `registerSingletonSync(...)`. Registration is idempotent per `key`: the first call creates the manager in a shared registry and later calls return the same instance. For example `letterStore` registers `('letters', 'letters', mapper, '/api/data')` and `estateStore` registers `('estate_profile', 'estate/profile', mapper, '/api')`.

## Lifecycle

1. **Instant load** — the constructor reads the cached value from localStorage via `getStored(key)`, so a page renders immediately with no spinner.
2. **Sync** — `sync()` (or `init()`, which calls it) fetches `GET {apiBase}/{endpoint}` with the Bearer token. If no token exists it returns quietly.
3. **Server is truth** — remote items replace the local cache.
4. **One-time migration** — if the server returns an empty list but the local cache had items, each local item is POSTed (`migrateUp`) and the list is re-fetched to obtain server ids. The singleton version POSTs the local object when the remote object is empty.

The root layout calls `syncAll()` once each time a new auth token becomes available; it runs `sync()` on every registered manager with `Promise.allSettled`, so one failing endpoint does not stop the others. Only managers whose store module has already been imported are in the registry at that moment.

## Writes

- **`create(data)`** is *not* optimistic: it POSTs first and appends the server's response to `items` on success. Long string ids (client-generated) are stripped so the server assigns one.
- **`update(id, partial)`** is optimistic: it patches the local item and cache, then `PUT {apiBase}/{endpoint}/{id}` with `id`, `user_id`, `created_at` and `updated_at` removed. On failure it restores the previous list and rethrows.
- **`delete(id)`** is optimistic: it removes the item locally, then sends `DELETE`. On failure it restores the list and sets `status = "error"`, but does not rethrow.
- **`SingletonSyncManager.update(partial)`** merges optimistically and POSTs the whole object to `{apiBase}/{endpoint}`; on failure it rolls back and rethrows.

Failures show a gentle message through `notifications.showError` with technical details attached. When a store calls `setAffirmationContext(...)`, successful creates and updates also show an affirmation (for example `'letters'`, `'medical'`, `'heirlooms'`).

`audit()` re-fetches the remote list and compares ids with the local list (`onlyLocal`, `onlyRemote`, `matches`), for diagnostics such as the data settings page.

## Key conversion and mappers

Payloads are converted recursively: outgoing keys go camelCase → snake_case (`toSnake`), incoming keys snake_case → camelCase (`toCamel`). An optional per-store `mapper` runs on both directions to fill defaults or rename fields. Columns that are camelCase in the database (for example `ownershipDetails` on assets) are still converted to snake_case on the way out, so they reach the backend as `ownership_details`.

The manager's `fetch` calls set only `Authorization` (and `Content-Type`) themselves; the `X-CSRF-Token` header the backend requires in production is added by the global fetch wrapper in `frontend/src/hooks.client.ts` (see [System Architecture Overview](/openwiki/architecture/overview.md)).

## Persistence helpers

`frontend/src/lib/stores/persistence.ts` namespaces every cached value as:

```
continuum_acc_{activeAccountId or 'anonymous'}_prof_{currentProfileId or 'owner'}_{key}
```

`activeAccountId` comes from `keyringStore.ts` (a local list of signed-in emails) and `currentProfileId` from `profileContext.ts`, so one browser can hold separate caches per account and per profile. `setStored` writes only to localStorage — the older remote write through `syncWithBackend` is commented out. `createProfileStore(key, initial)` builds a plain writable store that re-reads on account or profile change and writes back on every change; stores built this way stay local-only unless they also use a SyncManager.

`frontend/src/lib/services/syncService.ts` is the legacy whole-blob sync: a two-second-debounced POST of `transparent_data` to `/api/estate`. New stores should use a manager instead.

## Adding a synced store

1. Make sure the backend has an endpoint (a `MODEL_MAP` entry for `/api/data/{name}` or a dedicated router) — see [Backend API and Routers](/openwiki/architecture/backend-api.md).
2. In `src/lib/stores/{name}Store.svelte.ts`, call `registerSync<T>('cache_key', 'endpoint', mapper, apiBase)`.
3. Expose the manager's `items`, `status`, `create`, `update` and `delete` from the store and call `init()` (or rely on `syncAll`) from the page.

## Related pages

- [Backend API and Routers](/openwiki/architecture/backend-api.md)
- [Routes, Modules and Navigation](/openwiki/frontend/routes-and-navigation.md)
- [System Architecture Overview](/openwiki/architecture/overview.md)
