# Files

- [Routes, Modules and Navigation](routes-and-navigation.md) - The SvelteKit route tree, the feature modules under /modules, how the sidebar groups and module catalog are defined in navigation.ts, how the root layout guards routes by login and role, and where UI labels and translations come from.
- [Frontend State and SyncManager](state-and-sync.md) - How module stores persist data through SyncManager and SingletonSyncManager — localStorage-first loading, optimistic writes with rollback, snake/camel key conversion, the sync registry and global syncAll, the local-to-cloud migration path, and the namespaced persistence helpers.
