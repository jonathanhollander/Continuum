# Continuum UI Consistency Implementation Plan

## Overview

This document provides a detailed, file-by-file implementation plan to bring all Continuum modules into compliance with the UI Consistency Standards.

**Related Document:** `UI_CONSISTENCY_STANDARDS.md` - The binding source of truth
**Critical Section:** Section 5 "DATA PAGE BLUEPRINT" - Every data page MUST comply

**Estimated Scope:** 75+ changes across 20+ files
**Priority Levels:** P0 (Critical), P1 (High), P2 (Medium), P3 (Low)

---

## NEW PHASE 0: Data Page Blueprint Compliance (P0 - HIGHEST PRIORITY)

**Before fixing modal styling, EVERY data page must include ALL required elements from Section 5 of the UI Standards.**

### Required Elements Checklist

Every module page MUST have these 12 elements:

| # | Element | Component | What It Does |
|---|---------|-----------|--------------|
| 1 | Page Header | `LivingBlueprintHeader` | Title, subtitle, emotional context |
| 2 | Page Explanation | `detailedDescription` + `whyMatters` props | How to use the page (tone-compliant) |
| 3 | Add Data Button | Primary button with Plus icon | Clear entry point (compassionate text) |
| 4 | AI Helper Section | `AIPromptBar` or `ConciergeFlow` | What AI will do for the user |
| 5 | Data Display | Cards/Grid/List | View existing data |
| 6 | **View Toggle** | `DataViewToggle` + `DataView` | Switch between Card and Table views **(MANDATORY)** |
| 7 | Edit/Delete Actions | Icon buttons on hover | Modify existing data |
| 8 | Empty State | `EmptyState` | Guidance when no data |
| 9 | Success Feedback | `Affirmation` | Positive reinforcement |
| 10 | Loading State | Spinner/Skeleton | Sync progress indicator |
| 11 | **Custom Fields** | `CustomFieldsManager` | User-extensible data fields **(MANDATORY)** |
| 12 | Error Handling | Error banner | Graceful failure states |

### Current Compliance Matrix (18 Modules)

| Module | Header | Explain | Add | AI | View | **ViewToggle** | Edit | Empty | Affirm | Load | **CustomFields** | Error |
|--------|--------|---------|-----|-----|------|----------------|------|-------|--------|------|------------------|-------|
| contacts | ✓ | ✓ | ✓ | ✓ | ✓ | **✗** | ✓ | ✓ | ✓ | ✗ | **✓** | ~ |
| medical | ✓ | ✓ | ✓ | ✗ | ✓ | **✗** | ✓ | ✓ | ✓ | ✗ | **✓** | ~ |
| pets | ✓ | ✓ | ✓ | ✗ | ✓ | **✗** | ✓ | ✓ | ✓ | ✗ | **✓** | ~ |
| heirlooms | ✓ | ✓ | ✓ | ✓ | ✓ | **✗** | ✓ | ✓ | ✓ | ~ | **✓** | ~ |
| financial | ✓ | ✓ | ✓ | ✓ | ✓ | **✗** | ✓ | ✓ | ~ | ~ | **✗** | ~ |
| letters | ✓ | ✓ | ✓ | ✓ | ✓ | **✗** | ✓ | ✓ | ~ | ✓ | **✗** | ✓ |
| property | ✓ | ✓ | ✓ | ✓ | ✓ | **✗** | ✓ | ~ | ~ | ~ | **✓** | ~ |
| insurance | ✓ | ✓ | ✓ | ✗ | ✓ | **✗** | ✓ | ✓ | ~ | ~ | **✓** | ~ |
| digital-guardian | ✓ | ✓ | ✓ | ✓ | ✓ | **✗** | ✓ | ✓ | ~ | ~ | **✗** | ~ |
| anniversary | ✓ | ✓ | ✓ | ✗ | ✓ | **✗** | ✓ | ~ | ~ | ~ | **✗** | ~ |
| time-capsule | ✓ | ✓ | ✓ | ✗ | ✓ | **✗** | ✓ | ✓ | ~ | ~ | **✓** | ~ |
| legacy-journal | ✓ | ✗ | ✗ | ✗ | ✓ | **✗** | ~ | ✗ | ✗ | ✗ | **✗** | ✗ |
| subscriptions | ✓ | ✓ | ✓ | ✗ | ✓ | **✗** | ✓ | ✓ | ~ | ✗ | **✓** | ~ |
| visual-memories | ✓ | ✓ | ✓ | ✗ | ✓ | **✗** | ✓ | ✓ | ~ | ✗ | **✗** | ~ |
| calendar | ✓ | ✓ | ✓ | ✗ | ✓ | **✗** | ✓ | ✓ | ~ | ~ | **✓** | ~ |
| funeral | ✓ | ✓ | ✓ | ✗ | ✓ | **✗** | ✓ | ✓ | ~ | ~ | **✓** | ~ |
| timeline | ✓ | ✓ | ✓ | ✗ | ✓ | **✗** | ✓ | ✓ | ~ | ~ | **✓** | ~ |
| advanced-registry | ✓ | ✓ | ✓ | ✗ | ✓ | **✗** | ✓ | ✓ | ~ | ~ | **✓** | ~ |

**Legend:** ✓ = Compliant, ~ = Partial, ✗ = Missing

### Critical Gaps Summary

| Gap | % Missing | Modules Affected | Priority |
|-----|-----------|-----------------|----------|
| **View Toggle (Card/Table)** | **100%** | **ALL 18 data modules** | **P0** |
| **CustomFieldsManager** | **38%** | **7 data modules** | **P0** |
| Loading States | 87% | 13 modules | **P0** |
| AI Helper | 53% | 8 modules | **P0** |
| Affirmation | 60% | 9 modules | **P1** |
| Error Handling | 80% | 12 modules | **P1** |

### Phase 0 Implementation Tasks

#### 0.1 Add Loading States to ALL Modules

**Pattern to implement:**
```svelte
<script>
  let isLoading = $state(true);

  onMount(async () => {
    try {
      await store.sync();
    } finally {
      isLoading = false;
    }
  });
</script>

{#if isLoading}
  <div class="flex items-center justify-center py-12">
    <Loader2 class="w-8 h-8 animate-spin text-primary" />
  </div>
{:else}
  <!-- Content -->
{/if}
```

**Files to update:**
- `contacts/+page.svelte`
- `medical/+page.svelte`
- `pets/+page.svelte`
- `heirlooms/+page.svelte`
- `financial-accounts/+page.svelte`
- `property/+page.svelte`
- `insurance/+page.svelte`
- `digital-guardian/+page.svelte`
- `anniversary-manager/+page.svelte`
- `time-capsule/+page.svelte`
- `legacy-journal/+page.svelte`
- `subscriptions/+page.svelte`
- `visual-memories/+page.svelte`

#### 0.2 Add AIPromptBar to Missing Modules

**Pattern to implement:**
```svelte
<div class="max-w-3xl mx-auto mb-12">
  <AIPromptBar context="modulename" />
</div>
```

**Files to update:**
- `medical/+page.svelte` - context: `"medical"`
- `pets/+page.svelte` - context: `"pets"`
- `insurance/+page.svelte` - context: `"insurance"`
- `anniversary-manager/+page.svelte` - context: `"anniversary"`
- `time-capsule/+page.svelte` - context: `"timecapsule"`
- `legacy-journal/+page.svelte` - context: `"legacy"`
- `subscriptions/+page.svelte` - context: `"subscriptions"`
- `visual-memories/+page.svelte` - context: `"memories"`

**Also requires:** Adding new context types to `AIPromptBar.svelte` quickPrompts object.

#### 0.3 Add Affirmation to Missing Modules

**Pattern:**
```svelte
<script>
  let showAffirmation = $state(false);

  async function saveItem() {
    await store.create(data);
    showAffirmation = true;  // Trigger on success
  }
</script>

<Affirmation module="modulename" bind:show={showAffirmation} />
```

**Files to update:**
- `financial-accounts/+page.svelte`
- `letters/+page.svelte`
- `property/+page.svelte`
- `insurance/+page.svelte`
- `digital-guardian/+page.svelte`
- `anniversary-manager/+page.svelte`
- `time-capsule/+page.svelte`
- `subscriptions/+page.svelte`
- `visual-memories/+page.svelte`

**Also requires:** Adding affirmation messages to `lib/data/affirmations.ts`.

#### 0.4 Fix legacy-journal (7 Missing Elements)

**File:** `frontend/src/routes/modules/legacy-journal/+page.svelte`

**Missing elements:**
1. Page explanation (`detailedDescription`, `whyMatters`)
2. Add button
3. AI helper
4. Edit/delete actions
5. Empty state
6. Affirmation
7. Loading state

**This module needs complete rewrite to match Data Page Blueprint template.**

#### 0.5 Add CustomFieldsManager to ALL Data Modules (CRITICAL)

**CRITICAL:** Every add/edit modal MUST include CustomFieldsManager to allow users to capture custom data fields.

**Pattern to implement:**
```svelte
<script>
  import CustomFieldsManager from "$lib/components/CustomFieldsManager.svelte";

  let customFields = $state<Record<string, string>>({});
</script>

<!-- Inside modal, after standard form fields -->
<div class="border-t border-slate-100 pt-4 mt-4">
  <CustomFieldsManager
    entityType="modulename"
    bind:customFields
  />
</div>
```

**Include in save operation:**
```svelte
async function saveItem() {
  const payload = {
    ...formData,
    custom_attributes: customFields  // Include custom fields!
  };
  await store.create(payload);
}
```

**Modules ALREADY compliant (12 modules):**
- ✓ advanced-registry
- ✓ calendar
- ✓ contacts
- ✓ funeral
- ✓ heirlooms
- ✓ insurance
- ✓ medical
- ✓ pets
- ✓ property
- ✓ subscriptions
- ✓ time-capsule
- ✓ timeline

**Modules REQUIRING CustomFieldsManager (20 modules):**

| Module | File | Backend Table | Migration Needed |
|--------|------|---------------|------------------|
| activity-log | `activity-log/+page.svelte` | activity_log | Yes |
| analytics | `analytics/+page.svelte` | (view only) | N/A |
| anniversary-manager | `anniversary-manager/+page.svelte` | anniversaries | Yes |
| builders-console | `builders-console/+page.svelte` | (admin) | N/A |
| digital-guardian | `digital-guardian/+page.svelte` | digital_guardians | Yes |
| executor-guide | `executor-guide/+page.svelte` | (read only) | N/A |
| executor-toolkit | `executor-toolkit/+page.svelte` | executor_tasks | Yes |
| family-hub | `family-hub/+page.svelte` | family_members | Yes |
| financial-accounts | `financial-accounts/+page.svelte` | financial_accounts | Yes |
| home-manual | `home-manual/+page.svelte` | home_items | Yes |
| legacy-journal | `legacy-journal/+page.svelte` | journal_entries | Yes |
| legal-documents | `legal-documents/+page.svelte` | legal_documents | Yes |
| letters | `letters/+page.svelte` | letters | Yes |
| pulse | `pulse/+page.svelte` | pulse_settings | N/A (settings) |
| qr-codes | `qr-codes/+page.svelte` | qr_codes | Yes |
| scenario-mode | `scenario-mode/+page.svelte` | (interactive) | N/A |
| simulator | `simulator/+page.svelte` | (interactive) | N/A |
| treasure-hunt | `treasure-hunt/+page.svelte` | treasures | Yes |
| visual-memories | `visual-memories/+page.svelte` | memories | Yes |

**Database Migrations Required (13 tables):**

For each table needing `custom_attributes`:

```bash
# Generate migration for each table
alembic revision --autogenerate -m "add custom_attributes to tablename"
```

**Migration template:**
```python
"""Add custom_attributes to tablename

Revision ID: xxx
Revises: previous
Create Date: YYYY-MM-DD
"""
from alembic import op
import sqlalchemy as sa

def upgrade():
    op.add_column('tablename', sa.Column('custom_attributes', sa.JSON(), nullable=True))

def downgrade():
    op.drop_column('tablename', 'custom_attributes')
```

**Apply migrations:**
```bash
# Local (SQLite)
alembic upgrade head

# Railway (PostgreSQL)
railway run alembic upgrade head
```

**Tables requiring migration:**
1. `anniversaries`
2. `digital_guardians`
3. `executor_tasks`
4. `family_members`
5. `financial_accounts`
6. `home_items`
7. `journal_entries`
8. `legal_documents`
9. `letters`
10. `qr_codes`
11. `treasures`
12. `memories`
13. `activity_log` (if applicable)

#### 0.6 Add Card/Table View Toggle to ALL Data Modules (CRITICAL)

**CRITICAL:** Every data page MUST allow users to switch between Card View and Table View. Preference is stored on the backend (NOT localStorage) and syncs across devices.

##### Implementation Task Checklist

| Task | File to Create/Modify | Status |
|------|----------------------|--------|
| 1. Create user preferences store | `frontend/src/lib/stores/userPreferencesStore.svelte.ts` | ⬜ |
| 2. Add view_preferences to User model | `backend/models.py` | ⬜ |
| 3. Create Alembic migration | `backend/alembic/versions/xxx_add_view_preferences.py` | ⬜ |
| 4. Run migration (local SQLite) | `alembic upgrade head` | ⬜ |
| 5. Run migration (Railway PostgreSQL) | `railway run alembic upgrade head` | ⬜ |
| 6. Add preferences API endpoints | `backend/routers/users.py` | ⬜ |
| 7. Create DataViewToggle component | `frontend/src/lib/components/ui/DataViewToggle.svelte` | ⬜ |
| 8. Create DataTable component | `frontend/src/lib/components/ui/DataTable.svelte` | ⬜ |
| 9. Create DataView wrapper | `frontend/src/lib/components/ui/DataView.svelte` | ⬜ |
| 10. Pilot: Update contacts module | `frontend/src/routes/modules/contacts/+page.svelte` | ⬜ |
| 11. Roll out to all 17 remaining data modules | See module list below | ⬜ |

**Reference:** See `UI_CONSISTENCY_STANDARDS.md` Section 5.6 for complete component specifications.

**Step 1: Create Global Components**

Create these files in `frontend/src/lib/components/ui/`:

| File | Purpose |
|------|---------|
| `DataViewToggle.svelte` | Toggle button (Card \| Table) |
| `DataTable.svelte` | Reusable table view with edit/delete actions |
| `DataView.svelte` | Wrapper that renders Card or Table based on mode |

**Step 2: Create User Preferences Store**

**File:** `frontend/src/lib/stores/userPreferencesStore.svelte.ts`

```typescript
import { apiFetch } from "$lib/utils/errorHandler";

interface ViewPreferences {
  [module: string]: 'card' | 'table';
}

class UserPreferencesStore {
  preferences = $state<ViewPreferences>({});

  async init() {
    const response = await apiFetch('/api/users/me/preferences');
    this.preferences = response.view_preferences || {};
  }

  getViewMode(module: string): 'card' | 'table' {
    return this.preferences[module] || 'card';
  }

  async setViewMode(module: string, mode: 'card' | 'table') {
    this.preferences[module] = mode;
    await apiFetch('/api/users/me/preferences', {
      method: 'PATCH',
      body: JSON.stringify({ view_preferences: this.preferences })
    });
  }
}

export const userPreferencesStore = new UserPreferencesStore();
```

**Step 3: Add Backend Endpoint**

**Model update:** `backend/models.py` - Add to User model:
```python
view_preferences: Optional[Dict[str, str]] = Field(default=None, sa_column=Column(JSON))
```

**Router update:** `backend/routers/users.py`:
```python
@router.patch("/me/preferences")
async def update_preferences(preferences: dict, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    current_user.view_preferences = preferences.get("view_preferences", {})
    db.add(current_user)
    db.commit()
    return {"status": "ok"}

@router.get("/me/preferences")
async def get_preferences(current_user: User = Depends(get_current_user)):
    return {"view_preferences": current_user.view_preferences or {}}
```

**Migration required:** Add `view_preferences` column to `users` table.

**Step 4: Update Each Module Page**

For EVERY data module, update to use the view components:

```svelte
<script>
  import DataViewToggle from "$lib/components/ui/DataViewToggle.svelte";
  import DataView from "$lib/components/ui/DataView.svelte";
  import ContactCard from "./ContactCard.svelte";

  const columns = [
    { key: 'name', label: 'Name' },
    { key: 'relationship', label: 'Relationship' },
    { key: 'phone', label: 'Phone' },
  ];
</script>

<div class="flex justify-between items-center mb-6">
  <h2 class="text-lg font-bold">Your Contacts</h2>
  <DataViewToggle module="contacts" />
</div>

<DataView
  module="contacts"
  items={contacts}
  {columns}
  onEdit={editContact}
  onDelete={deleteContact}
  cardComponent={ContactCard}
/>
```

**Modules requiring View Toggle (ALL data modules):**

| Module | Card Component Exists | Table Columns Needed |
|--------|----------------------|---------------------|
| contacts | Yes | name, relationship, phone, email |
| medical | Partial | directive_type, date, notes |
| pets | Yes | name, species, breed, caregiver |
| heirlooms | Yes | name, category, recipient |
| financial-accounts | Yes | name, institution, type, balance |
| property | Yes | name, address, type, value |
| insurance | Yes | name, provider, type, coverage |
| subscriptions | Yes | name, cost, frequency, status |
| letters | Partial | recipient, type, date |
| time-capsule | Yes | title, unlock_date, recipients |
| calendar | Yes | title, date, type |
| timeline | Yes | title, date, type |
| funeral | Yes | item, provider, cost |
| legal-documents | Partial | name, type, date |
| home-manual | Partial | item, location, notes |
| anniversary-manager | Partial | name, date, type |
| visual-memories | Partial | title, date, tags |
| legacy-journal | Partial | title, date, content_preview |

**Implementation Order:**
1. Create `userPreferencesStore.svelte.ts`
2. Add backend migration for `view_preferences`
3. Create backend endpoints
4. Create `DataViewToggle.svelte`
5. Create `DataTable.svelte`
6. Create `DataView.svelte`
7. Update contacts module (pilot)
8. Roll out to remaining modules

#### 0.7 Extend Sample Data Coverage in smartSamples.ts (CRITICAL)

**File:** `frontend/src/lib/data/smartSamples.ts`

**Reference:** See `UI_CONSISTENCY_STANDARDS.md` Section 5.7.3 for sample data requirements.

##### Current Coverage

| Module | Sample Data Key | Status |
|--------|-----------------|--------|
| contacts | `contacts` | ✅ Complete |
| medical | `medical` | ✅ Complete |
| pets | `pets` | ✅ Complete |
| heirlooms | `heirlooms` | ✅ Complete |
| financial-accounts | `financial` | ✅ Complete |
| property | `property` | ✅ Complete |
| insurance | `insurance` | ✅ Complete |
| subscriptions | `subscriptions` | ✅ Complete |
| visual-memories | `memories` | ✅ Complete |
| digital-guardian | `digital` | ✅ Complete |
| family-hub | `family` | ✅ Complete |

##### Missing Sample Data (9 modules)

| Module | Proposed Key | Sample Items Needed |
|--------|--------------|---------------------|
| letters | `letters` | "Letter to my daughter", "Farewell to a friend" |
| time-capsule | `timeCapsule` | "2030 Family Goals", "Message for graduation" |
| calendar | `calendar` | "Anniversary", "Annual checkup reminder" |
| timeline | `timeline` | "Met my spouse", "Started business" |
| funeral | `funeral` | "Service preference", "Music selection" |
| legal-documents | `legalDocuments` | "Will", "Power of Attorney" |
| home-manual | `homeManual` | "HVAC maintenance", "Garage door code" |
| anniversary-manager | `anniversaries` | "Wedding anniversary", "Mom's birthday" |
| legacy-journal | `journal` | "Life lessons for kids", "My childhood memories" |

##### Implementation Steps

1. Add new keys to `SmartSampleCollection` interface
2. Add dictionary entries for `en` (required) and `es` (optional)
3. Add sample objects in `getSmartSamples()` return value
4. Update each module to use `GhostRow` with the new sample data

##### Sample Template for New Module

```typescript
// Add to SmartSampleCollection interface
export interface SmartSampleCollection {
  // ... existing
  letters: LetterSample[];  // Add new type
}

// Add to dictionaries.en
letters: {
  daughter: "Letter to My Daughter",
  friend: "A Note of Gratitude",
  notes_daughter: "Words of wisdom for her wedding day.",
  notes_friend: "Thanking someone who changed my life."
}

// Add to getSmartSamples() return
letters: [
  {
    id: commonId('letter-1'),
    title: dict.letters.daughter,
    recipient: "My Daughter",
    type: "Personal",
    notes: dict.letters.notes_daughter,
    isSmartSample: true
  },
  // ... more samples
]
```

---

## Phase 1: Modal Standardization (P0 - Critical)

### Why This Is P0

Custom modals are the most visible inconsistency. Users notice different backdrops, close buttons, and animations when navigating between modules. This erodes trust and professionalism.

---

### 1.1 Contacts Module

**File:** `frontend/src/routes/modules/contacts/+page.svelte`

**Current Issues:**
- Lines 456-622: Custom modal markup instead of Modal component
- Line 458: Uses `bg-black/50` backdrop
- Line 462: Uses `max-w-lg overflow-hidden max-h-[90vh] overflow-y-auto` (should be in Modal)
- Line 465: Header uses `bg-gray-50` instead of `bg-white`
- Lines 480-484: Close button is text "Close" link instead of X icon

**Changes Required:**

1. **Import Modal component** (top of file):
```svelte
import Modal from "$lib/components/ui/Modal.svelte";
```

2. **Replace custom modal markup** (lines 456-622):

**BEFORE:**
```svelte
{#if showAddModal}
    <div
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
        transition:fade
    >
        <div
            class="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden max-h-[90vh] overflow-y-auto"
        >
            <div
                class="p-6 border-b border-gray-100 bg-gray-50 flex justify-between items-start"
            >
                ...
                <button onclick={() => (showAddModal = false)} class="text-gray-400 hover:text-gray-600 mt-1">Close</button>
            </div>
            ...
        </div>
    </div>
{/if}
```

**AFTER:**
```svelte
<Modal bind:open={showAddModal} title="" maxWidth="max-w-lg">
  <div class="space-y-4">
    <!-- Modal header description (if needed, add inside content) -->
    <div class="-mx-6 -mt-6 px-6 py-4 border-b border-slate-100 mb-4">
      <h3 class="font-serif font-bold text-xl text-slate-800">Who should we include?</h3>
      <p class="text-slate-500 text-sm mt-2 leading-relaxed">
        This person matters to you. By adding them here, you're ensuring...
      </p>
    </div>

    <!-- Form fields -->
    ...

    <!-- Footer buttons -->
    <div class="-mx-6 -mb-6 px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3 mt-6">
      <button onclick={() => (showAddModal = false)} class="px-6 py-2.5 rounded-xl font-semibold text-slate-600 hover:bg-slate-200 transition-colors">
        Not right now
      </button>
      <button onclick={addContact} class="px-6 py-2.5 rounded-xl font-semibold bg-primary text-primary-foreground shadow-lg shadow-primary/20 hover:opacity-90 transition-all">
        Include this person
      </button>
    </div>
  </div>
</Modal>
```

**Alternative (Simpler):** Enhance Modal.svelte to support description slot, then use:
```svelte
<Modal bind:open={showAddModal} title="Who should we include?" maxWidth="max-w-lg">
  ...
</Modal>
```

---

### 1.2 Medical Module

**File:** `frontend/src/routes/modules/medical/+page.svelte`

**Current Issues:**
- Lines 473-630: Custom modal markup
- Line 476: Uses `bg-black/50` backdrop
- Line 480: Uses `rounded-[32px]` instead of `rounded-2xl`
- Line 500-503: Close button uses rotated Plus icon

**Changes Required:**

1. **Import Modal component**

2. **Replace modal** (lines 473-630):

**BEFORE:**
```svelte
{#if showAddForm}
    <div class="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" transition:fade>
        <div class="bg-white rounded-[32px] w-full max-w-lg overflow-hidden shadow-2xl" transition:fly={{ y: 20 }}>
            ...
            <button onclick={resetForm} class="p-2 hover:bg-gray-100 rounded-full text-gray-400">
                <Plus size={24} class="rotate-45" />
            </button>
```

**AFTER:**
```svelte
<Modal bind:open={showAddForm} title="" maxWidth="max-w-lg">
  <!-- Custom header with description -->
  <div class="-mx-6 -mt-6 px-6 py-4 border-b border-slate-100 mb-4">
    <h3 class="font-serif font-bold text-xl text-slate-800">
      {newDirective.id ? "Share Your Voice" : "Who should hear your voice?"}
    </h3>
    <p class="text-slate-500 text-sm mt-2 leading-relaxed">
      These choices reflect your values...
    </p>
  </div>

  <!-- Form content -->
  <form onsubmit={...} class="space-y-4">
    ...
  </form>
</Modal>
```

3. **Standardize input focus states:**

**BEFORE:**
```svelte
class="... focus:ring-2 focus:ring-red-500"
```

**AFTER:**
```svelte
class="... focus:border-primary focus:ring-2 focus:ring-primary/20"
```

---

### 1.3 Pets Module

**File:** `frontend/src/routes/modules/pets/+page.svelte`

**Current Issues:**
- Lines 302-509: Custom modal
- Line 305: Uses `bg-black/50` backdrop
- Lines 334-347: Custom SVG for close button
- Line 135: Container uses `max-w-4xl` (acceptable but note it)

**Changes Required:**

1. **Import Modal and X icon:**
```svelte
import Modal from "$lib/components/ui/Modal.svelte";
import { X } from "lucide-svelte";
```

2. **Replace modal** (lines 302-509):

**AFTER:**
```svelte
<Modal bind:open={showAddForm} title="" maxWidth="max-w-lg">
  <div class="-mx-6 -mt-6 px-6 py-4 border-b border-slate-100 mb-4">
    <h3 class="font-serif font-bold text-xl text-slate-800">
      {newPet.id ? "Update Their Care Plan" : "Protect Your Companion"}
    </h3>
    <p class="text-slate-500 text-sm mt-2 leading-relaxed">...</p>
  </div>

  <div class="space-y-4">
    <!-- Form fields -->
  </div>

  <div class="-mx-6 -mb-6 px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3 mt-6">
    <button onclick={() => (showAddForm = false)} class="...">Not right now</button>
    <button onclick={savePet} class="...">{newPet.id ? "Save changes" : "Record detail"}</button>
  </div>
</Modal>
```

3. **Standardize input styling:**

**BEFORE:**
```svelte
class="w-full px-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#304743]/20"
```

**AFTER:**
```svelte
class="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
```

---

### 1.4 Heirlooms Module

**File:** `frontend/src/routes/modules/heirlooms/+page.svelte`

**Current Issues:**
- Lines 519-644: Custom modal
- Line 521: Uses `bg-black/50` backdrop
- Line 543-546: Close button is text "Go back"
- Line 527: Header uses `bg-gray-50`

**Changes Required:**

1. **Import Modal component**

2. **Replace modal** (lines 519-644):

**AFTER:**
```svelte
<Modal bind:open={showAddForm} title="" maxWidth="max-w-lg">
  <div class="-mx-6 -mt-6 px-6 py-4 border-b border-slate-100 mb-4">
    <h3 class="font-serif font-bold text-xl text-slate-800">Preserve a Treasure</h3>
    <p class="text-slate-500 text-sm mt-2 leading-relaxed">
      This object holds a story that only you can tell...
    </p>
  </div>

  <div class="space-y-4">
    <!-- Form fields -->
  </div>

  <div class="-mx-6 -mb-6 px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3 mt-6">
    <button onclick={() => (showAddForm = false)} class="...">Not right now</button>
    <button onclick={addHeirloom} class="...">{isEditing ? "Save these details" : "Record this treasure"}</button>
  </div>
</Modal>
```

3. **Also fix wizard modal** (lines 298-314):

**BEFORE:**
```svelte
<div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" transition:fade>
```

**AFTER:**
```svelte
<div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm" transition:fade>
```

---

## Phase 2: Enhance Modal Component (P0 - Critical)

### 2.1 Add Modal Description Support

**File:** `frontend/src/lib/components/ui/Modal.svelte`

**Rationale:** Most modules need a description below the title. Adding this as a prop simplifies usage.

**Changes:**

1. **Add description prop:**
```svelte
let {
    title = "",
    description = "",  // ADD THIS
    open = $bindable(false),
    maxWidth = "max-w-md",
    children,
} = $props<{
    title?: string;
    description?: string;  // ADD THIS
    open: boolean;
    maxWidth?: string;
    children?: import("svelte").Snippet;
}>();
```

2. **Update header rendering:**
```svelte
<div class="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-white sticky top-0 z-10">
  <div class="flex-1 pr-4">
    {#if title}
      <h2 class="{description ? 'font-serif font-bold text-xl' : 'text-lg font-semibold'} text-slate-800">{title}</h2>
    {/if}
    {#if description}
      <p class="text-slate-500 text-sm mt-2 leading-relaxed">{description}</p>
    {/if}
  </div>
  <button class="p-2 -mr-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors" onclick={close}>
    <X class="w-5 h-5" />
  </button>
</div>
```

---

## Phase 3: Card Styling Standardization (P1 - High)

### 3.1 Contacts Module Cards

**File:** `frontend/src/routes/modules/contacts/+page.svelte`
**Line:** 394

**BEFORE:**
```svelte
class="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:border-primary/30 transition-all group relative"
```

**AFTER:**
```svelte
class="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-primary/30 transition-all group relative"
```

---

### 3.2 Medical Module Cards

**File:** `frontend/src/routes/modules/medical/+page.svelte`
**Lines:** 186, 354

**BEFORE:**
```svelte
class="bg-white rounded-3xl border border-primary/10 shadow-sm overflow-hidden"
class="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 hover:shadow-md transition-shadow relative group"
```

**AFTER:**
```svelte
class="bg-white rounded-2xl border border-primary/10 shadow-sm overflow-hidden"
class="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 hover:shadow-md hover:border-primary/30 transition-all relative group"
```

---

### 3.3 Pets Module Cards

**File:** `frontend/src/routes/modules/pets/+page.svelte`
**Line:** 169

**BEFORE:**
```svelte
class="bg-white rounded-3xl border border-border shadow-sm overflow-hidden group hover:shadow-md transition-all"
```

**AFTER:**
```svelte
class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden group hover:shadow-md hover:border-primary/30 transition-all"
```

---

## Phase 4: Form Input Standardization (P1 - High)

### 4.1 Create FormInput Component (Optional Enhancement)

**File:** `frontend/src/lib/components/ui/FormInput.svelte` (NEW)

```svelte
<script lang="ts">
  let {
    value = $bindable(""),
    label = "",
    placeholder = "",
    type = "text",
    required = false,
  } = $props();
</script>

<div class="space-y-1.5">
  {#if label}
    <label class="block text-xs font-bold uppercase text-slate-500 tracking-wide px-1">
      {label}{#if required}<span class="text-rose-500 ml-1">*</span>{/if}
    </label>
  {/if}
  <input
    {type}
    bind:value
    {placeholder}
    class="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white
           focus:border-primary focus:ring-2 focus:ring-primary/20
           outline-none transition-all text-slate-800"
  />
</div>
```

### 4.2 Standardize Existing Inputs

For each module, update input classes:

**Standard Pattern:**
```svelte
class="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
```

**Files to update:**
- `contacts/+page.svelte` - Lines 489, 510, 541-558
- `medical/+page.svelte` - Lines 278-290, 520-544, 567-598
- `pets/+page.svelte` - Lines 357-460
- `heirlooms/+page.svelte` - Lines 555-610

---

## Phase 5: Page Container Standardization (P2 - Medium)

### 5.1 Medical Module

**File:** `frontend/src/routes/modules/medical/+page.svelte`
**Line:** 157

**BEFORE:**
```svelte
<div class="max-w-5xl mx-auto space-y-8 p-4 md:p-8">
```

**AFTER:**
```svelte
<div class="max-w-6xl mx-auto space-y-8 p-6 md:p-8 animate-in fade-in duration-500">
```

---

### 5.2 Pets Module

**File:** `frontend/src/routes/modules/pets/+page.svelte`
**Line:** 135

**Note:** `max-w-4xl` is acceptable for focused content. Add animation class.

**BEFORE:**
```svelte
<div class="max-w-4xl mx-auto p-8 animate-in fade-in duration-500">
```

**AFTER:** (No change needed, already good)

---

## Phase 6: Button Standardization (P2 - Medium)

### 6.1 Add Button Sizes

Standardize all add buttons across modules:

**Standard:**
```svelte
class="px-5 py-2.5 bg-primary text-primary-foreground font-bold rounded-xl shadow-lg shadow-primary/20 hover:scale-105 transition-all flex items-center gap-2"
```

**Files to update:**
- `medical/+page.svelte` line 168 - uses `px-6 py-3 rounded-2xl` (change to `px-5 py-2.5 rounded-xl`)
- `heirlooms/+page.svelte` line 372 - uses `px-6 py-2 rounded-xl` (change to `px-5 py-2.5`)

---

## Phase 7: Icon Standardization (P3 - Low)

### 7.1 Replace Custom SVGs

**File:** `frontend/src/routes/modules/pets/+page.svelte`
**Lines:** 334-347

Replace inline SVG with Lucide X icon:

**BEFORE:**
```svelte
<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
</svg>
```

**AFTER:**
```svelte
<X class="w-5 h-5" />
```

---

## Phase 8: Additional Modules to Audit

The following modules should be audited and updated following the same patterns:

### High Priority
- [ ] `financial-accounts/+page.svelte`
- [ ] `letters/+page.svelte`
- [ ] `property/+page.svelte`
- [ ] `legal-documents/+page.svelte`
- [ ] `insurance/+page.svelte`

### Medium Priority
- [ ] `digital-guardian/+page.svelte`
- [ ] `anniversary-manager/+page.svelte`
- [ ] `time-capsule/+page.svelte`
- [ ] `legacy-journal/+page.svelte`
- [ ] `calendar/+page.svelte`

### Lower Priority
- [ ] `advanced-registry/+page.svelte`
- [ ] `home-manual/+page.svelte`
- [ ] `executor-toolkit/+page.svelte`
- [ ] `analytics/+page.svelte`
- [ ] `subscriptions/+page.svelte`

---

## Implementation Order

### Sprint 1: Foundation (Days 1-2)
1. Enhance `Modal.svelte` with description prop
2. Create `FormInput.svelte` component (optional)
3. Update `contacts/+page.svelte` modal
4. Update `medical/+page.svelte` modal

### Sprint 2: Core Modules (Days 3-4)
5. Update `pets/+page.svelte` modal
6. Update `heirlooms/+page.svelte` modal
7. Standardize card styling in all four modules
8. Standardize input styling in all four modules

### Sprint 3: Extended Modules (Days 5-7)
9. Audit and update `financial-accounts`
10. Audit and update `letters`
11. Audit and update `property`
12. Audit and update `legal-documents`
13. Audit and update `insurance`

### Sprint 4: Remaining Modules (Days 8-10)
14. Audit and update all remaining modules
15. Visual regression testing
16. Final QA pass

---

## Testing Checklist

After each module update:

- [ ] Modal opens with smooth animation
- [ ] Modal backdrop is `bg-slate-900/60`
- [ ] Close button is X icon in top-right
- [ ] Escape key closes modal
- [ ] Click outside closes modal
- [ ] Body scroll is locked when modal is open
- [ ] Form inputs have consistent focus states
- [ ] Cards have `rounded-2xl` corners
- [ ] Cards have hover shadow effect
- [ ] Edit/delete icons appear on hover
- [ ] Page loads with fade-in animation
- [ ] All buttons use compassionate language

---

## Success Metrics

| Metric | Before | After |
|--------|--------|-------|
| Modal variations | 6+ different styles | 1 standard style |
| Card border-radius values | 3 (`xl`, `2xl`, `3xl`) | 1 (`2xl`) |
| Backdrop colors | 3 (`black/40`, `black/50`, `slate-900/60`) | 1 (`slate-900/60`) |
| Close button styles | 4+ (text, icon, SVG) | 1 (X icon) |
| Input focus styles | 5+ variations | 1 standard |

---

## Notes for Developers

1. **Always use the Modal component** - Never create custom modal markup
2. **Test on mobile** - Modals must work on small screens
3. **Check dark mode** - Ensure all colors work in both modes (future)
4. **Preserve functionality** - Don't break existing features while styling
5. **Run Prettier** - Format after changes: `npm run format`
6. **Check TypeScript** - Ensure no type errors: `npm run check`

---

## Document History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-01-25 | Initial implementation plan |
