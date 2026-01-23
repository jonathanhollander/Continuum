# Continuum Data Sync Gap Analysis

**Generated**: 2026-01-23
**Purpose**: Identify where data is not following the pattern of saving both locally (localStorage) AND online (PostgreSQL as single source of truth)

---

## Executive Summary

The codebase has **43 frontend stores** with mixed sync patterns:
- **~20 stores** correctly use SyncManager (localStorage + API sync)
- **~12 stores** use localStorage-only persistence (NO backend sync) - **DATA LOSS RISK**
- **~8 stores** are UI-state only (volatile, expected)
- **2 deprecated** IndexedDB implementations still exist

Additionally:
- **5 backend data models** have no corresponding frontend store
- **2 frontend modules** use direct localStorage without profile namespacing
- **Media files** have dual IndexedDB implementations (needs consolidation)

---

## Part 1: Critical Gaps (Data Loss Risk)

### 1.1 Stores Using localStorage-Only (No Backend Sync)

These stores save to localStorage but have **NO backend endpoint** - data is lost if browser cache is cleared.

| Store | File | Data Type | Impact | Priority |
|-------|------|-----------|--------|----------|
| `activityLog` | `activityLog.ts` | Audit trail (CREATE/UPDATE/DELETE events) | User loses all activity history | **P0** |
| `acceptanceTasks` | `acceptanceStore.ts` | QA checklist progress (49 tasks) | User loses progress tracking | **P1** |
| `estateComplexity` | `acceptanceStore.ts` | Simple/Moderate/Complex estate indicator | Minor UX issue | P2 |
| `qrStore` | `qrStore.ts` | QR code configurations, access packs | Access sharing broken | **P1** |
| `automationRules` | `automation.ts` | Smart reminder/alert configurations | Automation settings lost | P2 |
| `accessibilityStore` | `accessibilityStore.ts` | High contrast, font size, theme | User preferences lost | P2 |
| `toneStore` | `toneStore.ts` | Planning/Grief/Executor mode | UX context lost | P2 |
| `encouragementMode` | `concierge.ts` | Full/Soft/Hidden prompts | UX preferences lost | P2 |
| `userRole` | `concierge.ts` | Owner/Executor/Family role | Context lost | P2 |
| `language` | `concierge.ts` | i18n language preference | Locale reset | P2 |
| `engagementLog` | `concierge.ts` | Interaction analytics | Analytics lost | P3 |
| `scenarioStore` | `scenario.ts` | Executor simulation scenarios | Simulation state lost | P2 |

### 1.2 Backend Models Without Frontend Stores

These database models exist but have **no dedicated frontend store** - data cannot be managed from UI.

| Model | Backend Location | API Endpoint | Missing Frontend |
|-------|------------------|--------------|------------------|
| `Vendor` | `estate_models.py:69` | `/api/data/vendors` | No vendorStore |
| `HomeAccess` | `estate_models.py:81` | `/api/data/home_access` | No homeAccessStore |
| `Utility` | `estate_models.py:90` | `/api/data/utilities` | No utilityStore |
| `JournalEntry` | `estate_models.py:140` | `/api/data/journal_entries` | No journalStore |
| `Document` | `estate_models.py:102` | `/api/data/documents` | No documentStore |
| `Letter` | `estate_models.py:129` | `/api/data/letters` | No letterStore |
| `Subscription` | `estate_models.py:152` | `/api/data/subscriptions` | No subscriptionStore |
| `AuditLog` | `models/audit_log.py:9` | None (backend-only) | Expected - server audit |
| `EmailLog` | `models/email_log.py:10` | `/api/email/status` | No emailLogStore |

---

## Part 2: High Priority Issues

### 2.1 Dual IndexedDB Implementations

Two separate IndexedDB storage systems exist - confusing and redundant:

| File | DB Name | Store Name | Status |
|------|---------|------------|--------|
| `services/indexedDB.ts` | `continuum_media_db` | `media_blobs` | DEPRECATED (marked) |
| `utils/mediaStorage.ts` | `continuum-media` | `files` | Active (uses `idb` lib) |

**Issue**:
- `mediaMigration.ts` references `services/indexedDB.ts`
- Unknown which stores still use `utils/mediaStorage.ts`
- Neither has backend sync by default

### 2.2 Stores Using Legacy Patterns

These stores use older patterns that don't match the SyncManager standard:

| Store | File | Issue |
|-------|------|-------|
| `auth` | `auth.ts` | Manual localStorage, no profile namespace |
| `preferenceStore` | `preferenceStore.ts` | Manual localStorage, inconsistent with SyncManager |
| `profileContext` | `profileContext.ts` | Multiple localStorage keys, complex manual sync |
| `keyringStore` | `keyringStore.ts` | Stores emails in localStorage, no backend sync |

### 2.3 Estate Mapper Double-Mapping Issue

In `estateStore.svelte.ts`, the mapper creates both camelCase AND snake_case properties:

```typescript
const estateMapper = (raw: any): any => ({
    ownerName: raw.owner_name ?? raw.ownerName ?? '',
    // ...
    ['owner_name']: raw.ownerName ?? raw.owner_name,  // <-- REDUNDANT
    // ...
});
```

This creates objects with duplicate data in different formats - wastes memory and causes confusion.

---

## Part 3: Medium Priority Issues

### 3.1 Inconsistent Store Patterns

| Pattern | Count | Files |
|---------|-------|-------|
| `SyncManager` (correct) | ~12 | `familyStore`, `medicalStore`, `insuranceStore`, etc. |
| `SingletonSyncManager` (correct) | ~6 | `estateStore`, `funeralStore`, `pulseStore` |
| `registerSync()` helper | ~4 | `visualMemoryStore`, `heirloomStore` |
| `createProfileStore()` | ~8 | `activityLog`, `acceptanceStore`, `toneStore` |
| Manual `writable` + localStorage | ~6 | `auth`, `qrStore`, `automation` |
| Pure `writable` (volatile) | ~8 | `notificationStore`, `analyticsStore` |

### 3.2 Missing Profile Namespacing

These stores don't use account/profile namespacing:

| Store | Storage Key | Issue |
|-------|-------------|-------|
| `qrStore` | `continuum_qr_store` | Shared across all users on device |
| `automationRules` | `automationRules` | No namespace prefix |
| `accessibilityStore` | `continuum_accessibility` | No profile separation |

### 3.3 Hardcoded Default Data in Stores

Some stores have large hardcoded default datasets that should be seeded from backend:

- `acceptanceStore.ts`: 49 hardcoded `DEFAULT_TASKS`
- `automation.ts`: 4 hardcoded `defaultRules`
- `qrStore.ts`: 2 hardcoded `initialState.accessPacks`

---

## Part 4: Task List by Priority

### P0 - Critical (Data Loss Risk)

| # | Task | Effort | Files |
|---|------|--------|-------|
| 1 | Create backend endpoint for Activity Log | M | `routers/activity.py`, `models/activity_log.py` |
| 2 | Create `activityLogSync` with SyncManager | M | `stores/activityLog.ts` |
| 3 | Migrate existing localStorage activity data | S | Migration script |

### P1 - High (Missing Functionality)

| # | Task | Effort | Files |
|---|------|--------|-------|
| 4 | Create backend endpoint for QR Store data | M | `routers/qr.py`, `estate_models.py` |
| 5 | Create `qrStoreSync` with SyncManager | M | `stores/qrStore.ts` |
| 6 | Create backend endpoint for Acceptance Tasks | M | `routers/acceptance.py` |
| 7 | Create `acceptanceSync` with SyncManager | M | `stores/acceptanceStore.ts` |
| 8 | Create `documentStore` with SyncManager | S | `stores/documentStore.svelte.ts` |
| 9 | Create `letterStore` with SyncManager | S | `stores/letterStore.svelte.ts` |
| 10 | Create `subscriptionStore` with SyncManager | S | `stores/subscriptionStore.svelte.ts` |
| 11 | Create `vendorStore` with SyncManager | S | `stores/vendorStore.svelte.ts` |
| 12 | Create `journalStore` with SyncManager | S | `stores/journalStore.svelte.ts` |
| 13 | Create `homeAccessStore` with SyncManager | S | `stores/homeAccessStore.svelte.ts` |
| 14 | Create `utilityStore` with SyncManager | S | `stores/utilityStore.svelte.ts` |

### P2 - Medium (User Experience)

| # | Task | Effort | Files |
|---|------|--------|-------|
| 15 | Add backend sync for user preferences (accessibility, tone) | M | New endpoint + store updates |
| 16 | Add profile namespacing to `qrStore`, `automationRules` | S | Multiple stores |
| 17 | Add backend sync for automation rules | M | New endpoint + store |
| 18 | Fix estateMapper double-mapping | S | `estateStore.svelte.ts` |
| 19 | Consolidate IndexedDB implementations | M | `indexedDB.ts`, `mediaStorage.ts` |
| 20 | Remove deprecated IndexedDB file | S | `services/indexedDB.ts` |
| 21 | Add profile namespacing to `accessibilityStore` | S | `accessibilityStore.ts` |

### P3 - Low (Code Quality)

| # | Task | Effort | Files |
|---|------|--------|-------|
| 22 | Standardize all stores to use SyncManager or createProfileStore | L | All stores |
| 23 | Move hardcoded defaults to backend seed data | M | Multiple files |
| 24 | Create store pattern documentation | S | `STORE_PATTERNS.md` |
| 25 | Add TypeScript strict mode to stores | M | Multiple files |

---

## Part 5: Implementation Plan

### Phase 1: Critical Data Persistence (Week 1)

**Goal**: Ensure no user data is lost on browser clear

1. **Activity Log Backend** (Tasks 1-3)
   - Create `ActivityLog` model in backend
   - Create `/api/activity` router with CRUD
   - Update `activityLog.ts` to use SyncManager
   - Add migration for existing localStorage data

2. **QR Store Backend** (Tasks 4-5)
   - Create `QRAccessPack` and `QRAssetLabel` models
   - Create `/api/qr` router
   - Update `qrStore.ts` to use SyncManager

### Phase 2: Missing Stores (Week 2)

**Goal**: All backend models have frontend stores

1. **Estate Data Stores** (Tasks 8-14)
   - Create stores for: Documents, Letters, Subscriptions, Vendors, Journal, HomeAccess, Utilities
   - All use SyncManager pattern with `/api/data/{type}` endpoint

2. **Acceptance Tracking** (Tasks 6-7)
   - Backend endpoint for acceptance task progress
   - Migrate from createProfileStore to SyncManager

### Phase 3: Cleanup & Standardization (Week 3)

**Goal**: Consistent patterns across all stores

1. **Preference Sync** (Tasks 15-17, 21)
   - Create `/api/preferences` endpoint for user settings
   - Sync accessibility, tone, automation, encouragement

2. **Code Cleanup** (Tasks 18-20)
   - Fix double-mapping
   - Consolidate IndexedDB
   - Remove deprecated code

### Phase 4: Documentation & Polish (Week 4)

1. **Store Pattern Guide** (Tasks 22-24)
2. **TypeScript Improvements** (Task 25)

---

## Appendix A: Store Inventory

### Stores Using SyncManager (Correct Pattern)

```
familyStore.svelte.ts       -> /api/contacts
medicalStore.svelte.ts      -> /api/medical/*
insuranceStore.svelte.ts    -> /api/insurance_policies
petStore.svelte.ts          -> /api/pets
heirloomStore.svelte.ts     -> /api/heirlooms
digitalAssetsStore.svelte.ts -> /api/digital_assets
propertyStore.svelte.ts     -> /api/properties
timeCapsuleStore.svelte.ts  -> /api/time_capsule
timelineStore.svelte.ts     -> /api/timeline_events
visualMemoryStore.ts        -> /api/memories/*
estateStore.svelte.ts       -> /api/estate/profile
funeralStore.svelte.ts      -> /api/data/funeral_data
calendarStore.svelte.ts     -> /api/calendar_events
pulse.svelte.ts             -> /api/pulse/*
advancedAssetStore.svelte.ts -> /api/data/advanced_assets
```

### Stores Using localStorage Only (Need Backend)

```
activityLog.ts              -> NO BACKEND
acceptanceStore.ts          -> NO BACKEND
qrStore.ts                  -> NO BACKEND
automation.ts               -> NO BACKEND
accessibilityStore.ts       -> NO BACKEND (user prefs)
toneStore.ts                -> NO BACKEND (user prefs)
concierge.ts                -> NO BACKEND (user prefs)
scenario.ts                 -> NO BACKEND
```

### Stores That Are Volatile (Expected)

```
notificationStore.ts        -> Runtime only (notifications)
analyticsStore.ts           -> Derived from other stores
auditStore.svelte.ts        -> Derived from other stores
onboardingStore.svelte.ts   -> Demo/welcome flags
```

---

## Appendix B: Backend MODEL_MAP Reference

From `backend/routers/estate_data.py`:

```python
MODEL_MAP = {
    "calendar_events": CalendarEvent,
    "insurance_policies": InsurancePolicy,
    "pets": Pet,
    "contact_relationships": ContactRelationship,
    "assets": Asset,
    "properties": Asset,
    "digital_assets": Asset,
    "heirlooms": Asset,
    "financial_accounts": FinancialAccount,
    "vendors": Vendor,              # NO FRONTEND STORE
    "home_access": HomeAccess,      # NO FRONTEND STORE
    "utilities": Utility,           # NO FRONTEND STORE
    "documents": Document,          # NO FRONTEND STORE
    "letters": Letter,              # NO FRONTEND STORE
    "journal_entries": JournalEntry,# NO FRONTEND STORE
    "subscriptions": Subscription,  # NO FRONTEND STORE
    "medical_profiles": MedicalProfile,
    "medical_directives": MedicalDirective,
    "timeline_events": LifeEvent,
    "time_capsule": TimeCapsuleMessage,
    "funeral_data": FuneralData,
    "advanced_assets": AdvancedAssetData
}
```

---

## Appendix C: Quick Reference for Creating New Synced Store

### Template: Collection Store

```typescript
// stores/newStore.svelte.ts
import { registerSync } from '$lib/services/sync.svelte';

export interface NewItem {
    id?: number;
    user_id?: number;
    name: string;
    // ... other fields
}

const mapper = (raw: any): NewItem => ({
    ...raw,
    id: typeof raw.id === 'string' && raw.id.length > 10 ? undefined : raw.id,
});

const manager = registerSync<NewItem>('new_items', 'new_items', mapper, '/api/data')
    .setAffirmationContext('general');

export const newStore = {
    subscribe: manager.subscribe.bind(manager),
    get items() { return manager.items; },
    create: (item: Omit<NewItem, 'id'>) => manager.create(item as NewItem),
    update: (item: NewItem) => manager.update(item),
    delete: (id: number) => manager.delete(id),
    sync: () => manager.sync()
};
```

### Template: Singleton Store

```typescript
// stores/singletonStore.svelte.ts
import { registerSingletonSync } from '$lib/services/sync.svelte';

export interface SingletonData {
    field1: string;
    field2: number;
}

const DEFAULT: SingletonData = { field1: '', field2: 0 };

const mapper = (raw: any): SingletonData => ({
    field1: raw.field_1 ?? raw.field1 ?? '',
    field2: raw.field_2 ?? raw.field2 ?? 0,
});

const manager = registerSingletonSync<SingletonData>('singleton_key', 'endpoint', mapper, '/api');

export const singletonStore = {
    get current() { return manager.data || DEFAULT; },
    subscribe: (run: (v: SingletonData) => void) => manager.subscribe((d) => run(d || DEFAULT)),
    update: (updates: Partial<SingletonData>) => manager.update(updates as SingletonData),
    sync: () => manager.sync()
};
```

---

_End of Gap Analysis_
