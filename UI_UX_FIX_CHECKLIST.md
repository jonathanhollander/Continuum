# UI/UX Fix Checklist

Quick-reference checklist for implementing UI consistency fixes.
Each section can be tackled independently. Check items as you complete them.

---

## Phase 1: Critical Button Fixes (P0)

### 1.1 Global CSS Updates (`frontend/src/app.css`)

- [ ] Add focus-visible utilities:
  ```css
  /* Focus-visible for keyboard users */
  button:focus-visible,
  a:focus-visible {
    @apply ring-2 ring-primary ring-offset-2 outline-none;
  }
  ```

- [ ] Add button size tokens as utility classes:
  ```css
  .btn-xs { @apply px-2 py-1 text-xs rounded-lg; }
  .btn-sm { @apply px-4 py-2 text-sm rounded-lg; }
  .btn-md { @apply px-6 py-2.5 text-base rounded-xl; }
  .btn-lg { @apply px-8 py-3 text-lg rounded-xl; }
  ```

- [ ] Add standard button variants:
  ```css
  .btn-primary {
    @apply bg-primary text-primary-foreground hover:scale-[1.02] active:scale-[0.98];
  }
  .btn-secondary {
    @apply bg-slate-100 text-slate-600 hover:bg-slate-200;
  }
  .btn-danger {
    @apply bg-red-600 text-white hover:bg-red-700;
  }
  ```

### 1.2 Login Page (`routes/login/+page.svelte`)

- [ ] Replace gradient buttons with `bg-primary`
- [ ] Change `from-teal-500 to-teal-400` → `bg-primary`
- [ ] Add `type="button"` to non-submit buttons
- [ ] Standardize padding to `px-6 py-2.5`

### 1.3 Onboarding Page (`routes/onboarding/+page.svelte`)

- [ ] Replace `bg-indigo-600` → `bg-primary`
- [ ] Replace `hover:bg-indigo-500` → `hover:bg-primary/90`
- [ ] Add `type="button"` to all buttons
- [ ] Add `aria-label` attributes

### 1.4 Dashboard (`routes/dashboard/+page.svelte`)

- [ ] Replace `bg-slate-900` → `bg-primary` for primary actions
- [ ] Standardize all button sizes
- [ ] Add `type="button"` to filter buttons
- [ ] Add `aria-label` to icon-only buttons

### 1.5 Settings Pages (`routes/settings/**`)

- [ ] Replace `bg-slate-900` → `bg-primary`
- [ ] Replace `bg-slate-800` → `bg-primary` or `bg-secondary`
- [ ] Standardize disabled states

---

## Phase 2: Modal Fixes (P0-P1)

### 2.1 Property Module (`routes/modules/property/+page.svelte`)

- [ ] Import Modal component: `import Modal from "$lib/components/ui/Modal.svelte"`
- [ ] Replace custom modal with `<Modal>` component
- [ ] Remove ~50 lines of duplicated modal code

### 2.2 Insurance Module (`routes/modules/insurance/+page.svelte`)

- [ ] Modal is already imported on line 38 - USE IT
- [ ] Replace custom modal implementation with `<Modal>`
- [ ] Fix z-index from `z-[110]` → `z-50`

### 2.3 BreakOffer (`lib/components/BreakOffer.svelte`)

- [ ] Change backdrop from `bg-black/40` → `bg-slate-900/60`
- [ ] Add escape key handler to first modal
- [ ] Add `aria-modal="true"`

### 2.4 WelcomeModal (`lib/components/onboarding/WelcomeModal.svelte`)

- [ ] Add `role="dialog"`
- [ ] Add `aria-modal="true"`
- [ ] Add escape key handler
- [ ] Change z-index from `z-[150]` → `z-[100]`
- [ ] Change backdrop from `bg-slate-900/80` → `bg-slate-900/60`

### 2.5 CommandCenter (`lib/components/ui/CommandCenter.svelte`)

- [ ] Add `role="dialog"`
- [ ] Keep z-index at `z-[200]` (correct for command palette)

### 2.6 GuideViewer (`lib/components/GuideViewer.svelte`)

- [ ] Change backdrop from `bg-slate-900/90` → `bg-slate-900/60`

### 2.7 JargonSlayer (`lib/components/modules/legal-documents/JargonSlayer.svelte`)

- [ ] Add `aria-modal="true"`

---

## Phase 3: Form/Input Standardization (P1)

### 3.1 SmartInput (`lib/components/ui/SmartInput.svelte`)

- [ ] Change border radius from `rounded-2xl` → `rounded-xl`
- [ ] Change focus from `focus:border-indigo-600` → `focus:border-primary`

### 3.2 CustomFieldsManager (`lib/components/ui/CustomFieldsManager.svelte`)

- [ ] Change input padding from `p-2.5` → `px-4 py-3`
- [ ] Change focus from `focus:border-indigo-500` → `focus:border-primary focus:ring-2 focus:ring-primary/20`
- [ ] Standardize label styling

### 3.3 Timeline Module (`routes/modules/timeline/+page.svelte`)

- [ ] Change input padding from `p-2` → `px-4 py-3`
- [ ] Change border radius from `rounded-lg` → `rounded-xl`
- [ ] Change focus from `ring-[#4A7C74]` → `focus:border-primary focus:ring-2 focus:ring-primary/20`
- [ ] Change label from `text-gray-400` → `text-slate-500`

### 3.4 All Module Forms (Apply Standard Pattern)

For each module with forms, ensure inputs follow this pattern:
```svelte
<div class="space-y-1.5">
  <label class="text-xs font-bold uppercase text-slate-500 tracking-wide">
    Label
  </label>
  <input
    class="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white
           focus:border-primary focus:ring-2 focus:ring-primary/20
           outline-none transition-all"
  />
</div>
```

**Modules to update:**
- [ ] contacts
- [ ] medical
- [ ] pets
- [ ] property
- [ ] insurance
- [ ] heirlooms
- [ ] letters
- [ ] financial-accounts
- [ ] subscriptions
- [ ] passwords
- [ ] legal-documents
- [ ] funeral

---

## Phase 4: Data Page Blueprint Compliance (P1)

### 4.1 Add DataViewToggle to ALL Data Modules

**Modules requiring DataViewToggle (0% current adoption):**

- [ ] contacts
- [ ] medical
- [ ] pets
- [ ] property
- [ ] insurance
- [ ] heirlooms
- [ ] financial-accounts
- [ ] subscriptions
- [ ] passwords
- [ ] legal-documents
- [ ] funeral
- [ ] letters
- [ ] home-manual
- [ ] emergency-info
- [ ] timeline
- [ ] legacy-journal
- [ ] visual-memories
- [ ] anniversary-manager
- [ ] treasure-hunt
- [ ] qr-codes
- [ ] bucket-list
- [ ] ethical-will

**Implementation for each:**
```svelte
<script>
  import DataViewToggle from "$lib/components/ui/DataViewToggle.svelte";
  let viewMode = $state<'card' | 'table'>('card');
</script>

<!-- In LivingBlueprintHeader actions slot -->
<svelte:fragment slot="actions">
  <DataViewToggle module="MODULE_NAME" onchange={(mode) => viewMode = mode} />
  <!-- existing buttons -->
</svelte:fragment>

<!-- Conditional rendering -->
{#if viewMode === 'card'}
  <!-- Card grid view -->
{:else}
  <!-- Table view -->
{/if}
```

### 4.2 Add GhostRow Sample Data (23% current adoption)

**Modules requiring GhostRow:**
- [ ] contacts (has it)
- [ ] medical
- [ ] pets
- [ ] property
- [ ] insurance
- [ ] heirlooms
- [ ] financial-accounts
- [ ] subscriptions
- [ ] passwords (has it)
- [ ] legal-documents
- [ ] funeral
- [ ] letters
- [ ] home-manual
- [ ] timeline
- [ ] legacy-journal
- [ ] visual-memories
- [ ] anniversary-manager

**Implementation:**
```svelte
<script>
  import GhostRow from "$lib/components/ui/GhostRow.svelte";
  import { smartSamples } from "$lib/data/smartSamples";
</script>

{#if items.length === 0 && !isLoading}
  <div class="grid grid-cols-1 md:grid-cols-2 gap-4 opacity-60">
    {#each smartSamples.MODULE_NAME.slice(0, 2) as sample}
      <GhostRow
        type="MODULE_NAME"
        name={sample.name}
        subtitle={sample.subtitle}
        onclick={() => showAddForm = true}
      />
    {/each}
  </div>
{/if}
```

### 4.3 Add Loading States (23% current adoption)

**Modules requiring loading states:**
- [ ] All 22 data modules

**Implementation:**
```svelte
<script>
  import { Loader2 } from "lucide-svelte";
</script>

{#if isLoading}
  <div class="flex items-center justify-center py-12">
    <Loader2 class="w-8 h-8 animate-spin text-primary" />
    <span class="ml-3 text-slate-500">Loading your data...</span>
  </div>
{/if}
```

### 4.4 Add CustomFieldsManager (55% current adoption)

**Modules requiring CustomFieldsManager:**
- [ ] contacts
- [ ] property
- [ ] insurance
- [ ] funeral
- [ ] letters
- [ ] home-manual
- [ ] emergency-info
- [ ] legacy-journal
- [ ] anniversary-manager
- [ ] treasure-hunt

**Implementation:**
```svelte
<script>
  import CustomFieldsManager from "$lib/components/ui/CustomFieldsManager.svelte";
</script>

<!-- In form, before submit button -->
<CustomFieldsManager
  entityType="MODULE_NAME"
  bind:data={formData}
/>
```

### 4.5 Add AIPromptBar (32% current adoption)

**Modules requiring AIPromptBar:**
- [ ] letters
- [ ] legacy-journal
- [ ] funeral
- [ ] ethical-will
- [ ] visual-memories
- [ ] timeline
- [ ] home-manual
- [ ] bucket-list
- [ ] heirlooms
- [ ] contacts
- [ ] medical
- [ ] pets
- [ ] property
- [ ] insurance

**Implementation:**
```svelte
<script>
  import AIPromptBar from "$lib/components/concierge/AIPromptBar.svelte";
</script>

<!-- After LivingBlueprintHeader -->
<AIPromptBar context="MODULE_NAME" />
```

---

## Phase 5: Worst Performing Modules (P1)

### 5.1 Legacy Journal (10% compliance)

- [ ] Add LivingBlueprintHeader (if missing)
- [ ] Add DataViewToggle
- [ ] Add GhostRow sample data
- [ ] Add loading state
- [ ] Add CustomFieldsManager
- [ ] Add AIPromptBar
- [ ] Add Affirmation component
- [ ] Standardize button colors
- [ ] Standardize form inputs

### 5.2 Home Manual (25% compliance)

- [ ] Add DataViewToggle
- [ ] Add GhostRow sample data
- [ ] Add loading state
- [ ] Add CustomFieldsManager
- [ ] Add AIPromptBar
- [ ] Add error handling

### 5.3 Anniversary Manager (25% compliance)

- [ ] Add DataViewToggle
- [ ] Add GhostRow sample data
- [ ] Add loading state
- [ ] Add CustomFieldsManager
- [ ] Add empty state

### 5.4 Treasure Hunt (25% compliance)

- [ ] Add DataViewToggle
- [ ] Add GhostRow sample data
- [ ] Add loading state
- [ ] Add CustomFieldsManager
- [ ] Add empty state

### 5.5 QR Codes (25% compliance)

- [ ] Add DataViewToggle
- [ ] Add loading state
- [ ] Add empty state
- [ ] Standardize buttons

---

## Phase 6: Accessibility Audit (P2)

### 6.1 Add aria-labels to icon-only buttons

Run this search and fix all matches:
```bash
# Find icon-only buttons missing aria-label
grep -r "<button" --include="*.svelte" | grep -v "aria-label"
```

### 6.2 Ensure 44px touch targets

Check all small buttons and ensure `min-h-[44px] min-w-[44px]` or equivalent.

### 6.3 Add type="button" to non-submit buttons

Run this search and fix:
```bash
# Find buttons without type attribute
grep -rn "<button" --include="*.svelte" | grep -v "type="
```

---

## Quick Reference: Standard Patterns

### Button (Primary)
```svelte
<button
  type="button"
  class="px-6 py-2.5 bg-primary text-primary-foreground rounded-xl font-semibold
         hover:scale-[1.02] active:scale-[0.98] transition-all
         disabled:opacity-50 disabled:cursor-not-allowed
         focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
  aria-label="Save changes"
>
  Save my thoughts
</button>
```

### Button (Secondary)
```svelte
<button
  type="button"
  class="px-6 py-2.5 bg-slate-100 text-slate-600 rounded-xl font-semibold
         hover:bg-slate-200 transition-all"
>
  Not right now
</button>
```

### Input
```svelte
<div class="space-y-1.5">
  <label class="text-xs font-bold uppercase text-slate-500 tracking-wide">
    Label
  </label>
  <input
    type="text"
    class="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white
           focus:border-primary focus:ring-2 focus:ring-primary/20
           outline-none transition-all"
    placeholder="..."
  />
</div>
```

### Modal
```svelte
<Modal bind:open={showForm} title="Title" description="..." maxWidth="max-w-lg">
  <div class="space-y-4">
    <!-- form fields -->
  </div>
  <div class="flex justify-end gap-3 pt-4 border-t border-slate-100 mt-6">
    <button type="button" onclick={() => showForm = false} class="btn-secondary">
      Not right now
    </button>
    <button type="button" onclick={handleSave} class="btn-primary">
      Save my thoughts
    </button>
  </div>
</Modal>
```

---

## Progress Tracking

| Phase | Items | Completed | % |
|-------|-------|-----------|---|
| 1. Buttons | 20 | 0 | 0% |
| 2. Modals | 8 | 0 | 0% |
| 3. Forms | 15 | 0 | 0% |
| 4. Blueprint | 66 | 0 | 0% |
| 5. Worst Modules | 25 | 0 | 0% |
| 6. Accessibility | 10 | 0 | 0% |
| **TOTAL** | **144** | **0** | **0%** |

---

_Checklist created: January 27, 2026_
