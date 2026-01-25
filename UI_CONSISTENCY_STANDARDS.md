# Continuum UI Consistency Standards

## Executive Summary

This document establishes binding UI standards for Continuum to ensure a cohesive, professional user experience across all 60+ modules. Every new component and modification must adhere to these standards.

**Last Audit Date:** January 25, 2026
**Inconsistencies Found:** 47 across 20+ modules
**Critical Issues:** Modal styling, form inputs, button patterns, page containers

---

## Table of Contents

1. [Modal Standards](#1-modal-standards)
2. [Form Input Standards](#2-form-input-standards)
3. [Button Standards](#3-button-standards)
4. [Page Layout Standards](#4-page-layout-standards)
5. [**DATA PAGE BLUEPRINT** (CRITICAL)](#5-data-page-blueprint-critical)
6. [Card & Container Standards](#6-card--container-standards)
7. [Icon Standards](#7-icon-standards)
8. [Typography Standards](#8-typography-standards)
9. [Spacing Standards](#9-spacing-standards)
10. [Animation Standards](#10-animation-standards)
11. [Color Standards](#11-color-standards)
12. [Empty State Standards](#12-empty-state-standards)
13. [Action Placement Standards](#13-action-placement-standards)
14. [Compassionate Language Standards](#14-compassionate-language-standards)
15. [Implementation Checklist](#15-implementation-checklist)

---

## 1. Modal Standards

### 1.1 REQUIRED: Use the Standard Modal Component

**File:** `frontend/src/lib/components/ui/Modal.svelte`

All modals MUST use this component. Do NOT create custom modal markup.

```svelte
<Modal bind:open={showModal} title="Modal Title" maxWidth="max-w-lg">
  <!-- Content here -->
</Modal>
```

### 1.2 Modal Backdrop (STANDARDIZED)

| Property | Standard Value | Current Violations |
|----------|---------------|-------------------|
| Background | `bg-slate-900/60` | contacts, medical, pets, heirlooms use `bg-black/50` |
| Blur | `backdrop-blur-sm` | Consistent |
| Z-index | `z-50` | Consistent |

**WRONG:**
```svelte
<div class="fixed inset-0 bg-black/50 backdrop-blur-sm">
```

**CORRECT:**
```svelte
<div class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm">
```

### 1.3 Modal Panel Styling

| Property | Standard Value |
|----------|---------------|
| Border radius | `rounded-2xl` |
| Shadow | `shadow-2xl` |
| Ring | `ring-1 ring-slate-900/5` |
| Max height | `max-h-[90vh]` |
| Default width | `max-w-lg` (512px) |

**Available maxWidth options:**
- `max-w-sm` (384px) - Simple confirmations
- `max-w-md` (448px) - Short forms (2-3 fields)
- `max-w-lg` (512px) - **DEFAULT** - Standard forms
- `max-w-xl` (576px) - Complex forms
- `max-w-2xl` (672px) - Multi-column layouts

### 1.4 Modal Header

```svelte
<div class="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-white">
  <h2 class="text-lg font-semibold text-slate-800">{title}</h2>
  <button class="p-2 -mr-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
    <X class="w-5 h-5" />
  </button>
</div>
```

**Violations found:**
| Module | Issue |
|--------|-------|
| contacts | Uses text "Close" link instead of X icon |
| medical | Uses Plus icon rotated 45° as close button |
| pets | Uses custom inline SVG |
| heirlooms | Uses text "Go back" link |

**STANDARD:** Always use Lucide `X` icon with `w-5 h-5` size.

### 1.5 Modal Header Title with Description

For modals requiring a description below the title:

```svelte
<div class="px-6 py-4 border-b border-slate-100 bg-white">
  <div class="flex items-start justify-between">
    <div class="flex-1 pr-4">
      <h2 class="font-serif font-bold text-xl text-slate-800">Title Here</h2>
      <p class="text-slate-500 text-sm mt-2 leading-relaxed">
        Description text here...
      </p>
    </div>
    <button class="p-2 -mr-2 -mt-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
      <X class="w-5 h-5" />
    </button>
  </div>
</div>
```

**Note:** Header titles with descriptions use `font-serif` for warmth.

### 1.6 Modal Content Area

```svelte
<div class="p-6 overflow-y-auto space-y-4">
  <!-- Form fields here -->
</div>
```

| Property | Value |
|----------|-------|
| Padding | `p-6` |
| Field spacing | `space-y-4` |
| Scrolling | `overflow-y-auto` |

### 1.7 Modal Footer

**Pattern A: Two buttons (Cancel + Primary)**
```svelte
<div class="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
  <button class="px-6 py-2.5 rounded-xl font-semibold text-slate-600 hover:bg-slate-200 transition-colors">
    Not right now
  </button>
  <button class="px-6 py-2.5 rounded-xl font-semibold bg-primary text-primary-foreground shadow-lg shadow-primary/20 hover:opacity-90 transition-all disabled:opacity-50">
    Save my thoughts
  </button>
</div>
```

**Pattern B: Single primary button (full width)**
```svelte
<div class="px-6 py-4 border-t border-slate-100">
  <button class="w-full py-3 rounded-xl font-semibold bg-primary text-primary-foreground shadow-lg shadow-primary/20 hover:opacity-90 transition-all">
    Include this person
  </button>
</div>
```

### 1.8 Modal Animation

**Entry animation:** Scale + Fade
```svelte
transition:scale={{ duration: 250, start: 0.95, easing: cubicOut }}
```

**Backdrop animation:** Fade
```svelte
transition:fade={{ duration: 200 }}
```

---

## 2. Form Input Standards

### 2.1 Standard Input Field

```svelte
<div class="space-y-1.5">
  <label class="block text-xs font-bold uppercase text-slate-500 tracking-wide px-1">
    Field Label
  </label>
  <input
    type="text"
    class="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white
           focus:border-primary focus:ring-2 focus:ring-primary/20
           outline-none transition-all text-slate-800"
    placeholder="Placeholder text..."
  />
</div>
```

### 2.2 Input Specifications

| Property | Standard Value | Violations Found |
|----------|---------------|------------------|
| Padding | `px-4 py-3` | medical uses `py-2`, some use `py-4` |
| Border radius | `rounded-xl` | Some use `rounded-2xl` |
| Border | `border border-slate-200` | medical uses `border-gray-200` |
| Focus border | `focus:border-primary` | medical uses `focus:ring-red-500` |
| Focus ring | `focus:ring-2 focus:ring-primary/20` | Inconsistent |

### 2.3 Select Dropdown

```svelte
<select class="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white
               focus:border-primary focus:ring-2 focus:ring-primary/20
               outline-none transition-all text-slate-800 appearance-none
               bg-[url('data:image/svg+xml,...')] bg-no-repeat bg-right-4">
  <option value="">Select...</option>
</select>
```

### 2.4 Textarea

```svelte
<textarea
  class="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white
         focus:border-primary focus:ring-2 focus:ring-primary/20
         outline-none transition-all text-slate-800 resize-none"
  rows="4"
  placeholder="..."
></textarea>
```

### 2.5 Use SmartInput for AI-Populated Fields

When a field can be populated by the AI Concierge:

```svelte
<SmartInput
  bind:value={fieldValue}
  label="Field Label"
  placeholder="..."
  isAIPopulated={wasPopulatedByAI}
/>
```

### 2.6 Label Styling (STANDARDIZED)

```css
/* Standard label */
.label-standard {
  @apply text-xs font-bold uppercase text-slate-500 tracking-wide;
}

/* Inside primary-colored sections */
.label-primary {
  @apply text-xs font-bold uppercase text-primary tracking-wide;
}
```

### 2.7 Grid Layouts for Form Fields

**Two columns:**
```svelte
<div class="grid grid-cols-2 gap-4">
  <!-- Two fields -->
</div>
```

**Responsive two columns:**
```svelte
<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
  <!-- Fields stack on mobile -->
</div>
```

---

## 3. Button Standards

### 3.1 Primary Button

```svelte
<button class="px-6 py-2.5 rounded-xl font-semibold bg-primary text-primary-foreground
               shadow-lg shadow-primary/20 hover:opacity-90 transition-all
               disabled:opacity-50 disabled:cursor-not-allowed">
  Button Text
</button>
```

### 3.2 Secondary Button (Ghost/Cancel)

```svelte
<button class="px-6 py-2.5 rounded-xl font-semibold text-slate-600
               hover:bg-slate-100 transition-colors">
  Not right now
</button>
```

### 3.3 Destructive Button

```svelte
<button class="px-6 py-2.5 rounded-xl font-semibold bg-red-600 text-white
               shadow-lg shadow-red-600/20 hover:bg-red-700 transition-all">
  Remove
</button>
```

### 3.4 Button Sizes

| Size | Classes | Use Case |
|------|---------|----------|
| Small | `px-4 py-2 text-sm rounded-lg` | Inline actions, table rows |
| Medium | `px-6 py-2.5 rounded-xl` | **DEFAULT** - Most buttons |
| Large | `px-8 py-3 rounded-xl text-lg` | Hero CTAs, empty states |

### 3.5 Add Button (Page Header)

**Standard placement:** Top-right of page, aligned with header

```svelte
<div class="flex justify-end mb-8">
  <button class="px-5 py-2.5 bg-primary text-primary-foreground font-bold rounded-xl
                 shadow-lg shadow-primary/20 hover:scale-105 transition-all
                 flex items-center gap-2">
    <Plus size={18} />
    Share contact details
  </button>
</div>
```

### 3.6 Button Text (Compassionate Language)

| Action | WRONG | CORRECT |
|--------|-------|---------|
| Save | "Submit", "Save" | "Save my thoughts", "Save my updates" |
| Add | "Add", "Create" | "Share...", "Include...", "Record..." |
| Cancel | "Cancel", "Close" | "Not right now", "Go back" |
| Delete | "Delete" | "Remove this item" |
| Continue | "Next", "Continue" | "Continue when ready" |

### 3.7 Use SaveButton Component for Save Operations

```svelte
<SaveButton
  onclick={handleSave}
  idleText="Save my thoughts"
  savedText="Saved with care"
/>
```

---

## 4. Page Layout Standards

### 4.1 Page Container

**Standard container:**
```svelte
<div class="max-w-6xl mx-auto p-6 md:p-8">
  <!-- Page content -->
</div>
```

| Property | Standard Value | Violations |
|----------|---------------|------------|
| Max width | `max-w-6xl` | medical: `max-w-5xl`, pets: `max-w-4xl`, heirlooms: `max-w-7xl` |
| Padding | `p-6 md:p-8` | Some use `p-8` only |

**Exception widths:**
- `max-w-4xl` - Wizard/onboarding flows (focused content)
- `max-w-5xl` - Dashboard with sidebar metrics
- `max-w-7xl` - Gallery/grid-heavy layouts (heirlooms, visual-memories)

### 4.2 Page Entry Animation

```svelte
<div class="max-w-6xl mx-auto p-6 md:p-8 animate-in fade-in duration-500">
```

### 4.3 Page Structure Order

1. `<LivingBlueprintHeader />` - Module header with title, description
2. Stats/summary cards (optional)
3. Affirmation component (for success messages)
4. Tab navigation (if applicable)
5. Main content grid
6. Empty state (when no data)
7. Modals (conditional, at end of component)

### 4.4 LivingBlueprintHeader Usage

```svelte
<LivingBlueprintHeader
  title="Module Title"
  subtitle="Brief description for the user's context"
  tier="preparation"
  detailedDescription="Longer explanation of what this module does."
  whyMatters="Emotional context for why completing this matters."
>
  <!-- Optional: Add button slot -->
  <button class="...">Add New</button>
</LivingBlueprintHeader>
```

---

## 5. DATA PAGE BLUEPRINT (CRITICAL)

**Every data page in Continuum MUST include all elements defined in this section.** This is the most important section of the standards document. Non-compliance creates an inconsistent user experience that erodes trust.

### 5.1 Required Page Elements Overview

| # | Element | Required | Component | Purpose |
|---|---------|----------|-----------|---------|
| 1 | Page Header | **MANDATORY** | `LivingBlueprintHeader` | Title, subtitle, emotional context |
| 2 | Page Explanation | **MANDATORY** | `detailedDescription` + `whyMatters` props | Help users understand the page |
| 3 | Add Data Button | **MANDATORY** | Primary button | Clear entry point for adding data |
| 4 | AI Helper Section | **MANDATORY** | `AIPromptBar` or `ConciergeFlow` | AI assistance for data entry |
| 5 | Data Display Area | **MANDATORY** | Cards/Grid/List | View existing data |
| 6 | Edit/Delete Actions | **MANDATORY** | Icon buttons | Modify existing data |
| 7 | Empty State | **MANDATORY** | `EmptyState` | Guidance when no data exists |
| 8 | Success Feedback | **MANDATORY** | `Affirmation` | Positive reinforcement |
| 9 | Loading State | **MANDATORY** | Skeleton/Spinner | Sync progress indicator |
| 10 | Search/Filter | **RECOMMENDED** | Search bar + filters | Find data quickly |
| 11 | Stats Dashboard | **RECOMMENDED** | Stat cards | Progress visibility |
| 12 | Export Options | **RECOMMENDED** | Download/Print buttons | Data portability |
| 13 | Contextual Help | **RECOMMENDED** | Info banners/tooltips | In-context guidance |
| 14 | Error Handling | **MANDATORY** | Error dialog/banner | Graceful failure states |

### 5.2 Page Header (MANDATORY)

Every data page MUST use the `LivingBlueprintHeader` component with ALL props populated.

```svelte
<LivingBlueprintHeader
  title="Your Voice at the End of Life"
  subtitle="Ensure your values are honored when you can't speak for yourself"
  tier="preparation"
  detailedDescription="Your voice in healthcare decisions matters, even when you can't speak
    for yourself. Document your directives and medical history to guide your advocates."
  whyMatters="Medical uncertainty places a heavy burden on families. Clear directives relieve
    them of agonizing guessing games and ensure your care aligns with your values."
>
  <!-- Add button goes in the slot -->
  <button class="...">Save my medical wishes</button>
</LivingBlueprintHeader>
```

#### 5.2.1 Header Content Requirements

| Prop | Requirements | Tone Guidelines |
|------|--------------|-----------------|
| `title` | 3-8 words, benefit-focused | Warm, personal (use "Your", "My") |
| `subtitle` | Single sentence, describes what user will do | Supportive, not demanding |
| `detailedDescription` | 2-3 sentences explaining the module's purpose | Educational, empowering |
| `whyMatters` | 2-3 sentences on emotional/practical value | Compassionate, acknowledges difficulty |

#### 5.2.2 Tone-Compliant Header Examples

**WRONG (Cold/Corporate):**
```
title: "Medical Directives"
subtitle: "Manage your healthcare documents"
```

**CORRECT (Compassionate):**
```
title: "Your Voice at the End of Life"
subtitle: "Ensure your values are honored when you can't speak for yourself"
```

**WRONG:**
```
title: "Pet Information"
subtitle: "Add details about your pets"
```

**CORRECT:**
```
title: "Care for Your Companions"
subtitle: "Your pets depend on you completely. This plan ensures they'll be loved and cared for."
```

### 5.3 Add Data Button (MANDATORY)

Every data page MUST have a prominently visible "Add" button that:
- Is visible without scrolling (above the fold)
- Uses compassionate language (never "Add" or "Create")
- Includes a Plus icon
- Opens the data entry modal

#### 5.3.1 Button Placement Options

**Option A: Inside Header Slot (Preferred)**
```svelte
<LivingBlueprintHeader ...>
  <button class="flex items-center justify-center gap-2 px-6 py-3 bg-primary
                 text-primary-foreground rounded-2xl font-bold hover:scale-105
                 transition-all shadow-lg shadow-primary/20">
    <Plus size={20} />
    Save my medical wishes
  </button>
</LivingBlueprintHeader>
```

**Option B: Below Header, Right-Aligned**
```svelte
<div class="flex justify-end mb-8">
  <button class="px-5 py-2.5 bg-primary text-primary-foreground font-bold rounded-xl
                 shadow-lg shadow-primary/20 hover:scale-105 transition-all
                 flex items-center gap-2">
    <Plus size={18} />
    Share contact details
  </button>
</div>
```

#### 5.3.2 Button Text Patterns by Module Type

| Module Type | Text Pattern | Examples |
|-------------|--------------|----------|
| People/Contacts | "Share [noun] details" | "Share contact details" |
| Documents/Records | "Save my [noun]" | "Save my medical wishes" |
| Assets/Items | "Record this [noun]" | "Record this treasure" |
| Letters/Messages | "Write a [noun]" | "Write a letter" |
| Plans/Preferences | "Capture my [noun]" | "Capture my preferences" |

### 5.4 AI Helper Section (MANDATORY)

Every data page MUST include AI assistance to help users complete data entry. This is a core differentiator for Continuum.

#### 5.4.1 AIPromptBar Component (Standard)

**File:** `frontend/src/lib/components/concierge/AIPromptBar.svelte`

```svelte
<div class="max-w-3xl mx-auto mb-12">
  <AIPromptBar
    context="heirlooms"
    promptPool={REFLECTION_POOLS.heirlooms.story}
  />
</div>
```

**Required Props:**
| Prop | Type | Description |
|------|------|-------------|
| `context` | string | Module context for AI (`obituary`, `letters`, `heirlooms`, etc.) |
| `promptPool` | string[] | Array of suggested prompts for this module |

#### 5.4.2 AI Helper Placement

- Place **below the header** but **above the data grid**
- Constrain width: `max-w-3xl mx-auto`
- Add bottom margin: `mb-12`

#### 5.4.3 What the AI Does (User Communication)

Include a brief explanation of AI capabilities within or near the AIPromptBar:

```svelte
<div class="bg-gradient-to-r from-primary/5 to-primary/10 rounded-xl border border-primary/20 p-6">
  <div class="flex items-center gap-2 mb-2 text-primary font-bold">
    <Sparkles size={18} />
    <span>Concierge Drafting Assistant</span>
  </div>
  <p class="text-sm text-slate-600 mb-4">
    Tell me what you'd like to record, and I'll help you capture it beautifully.
    I can draft descriptions, explain your wishes, or help you find the right words.
  </p>
  <!-- Input area -->
</div>
```

#### 5.4.4 AI Context Types

| Context | Use For | Quick Prompts |
|---------|---------|---------------|
| `obituary` | Obituary drafting | Draft obituary, Write eulogy |
| `letters` | Personal letters | Write to daughter, Note of forgiveness |
| `heirlooms` | Item descriptions | Describe meaning, Draft gift letter |
| `executor` | Executor guidance | Next steps, Draft bank email |
| `legal_explainer` | Document explanations | Explain Living Will, What is POA |

#### 5.4.5 ConciergeFlow for Guided Data Entry

For complex modules, use `ConciergeFlow` wizard:

```svelte
<ConciergeFlow
  steps={[
    { id: "intro", question: "Let's record your treasures...", type: "boolean" },
    { id: "watch", question: "Do you have a meaningful watch?", type: "boolean" },
    { id: "jewelry", question: "Any jewelry with special history?", type: "boolean" },
  ]}
  on:complete={handleWizardComplete}
/>
```

### 5.5 Data Display & View/Edit UI (MANDATORY)

Every page MUST provide a clear way to view, edit, and delete existing data.

#### 5.5.1 Data Display Layout Options

**Grid Layout (for visual items):**
```svelte
<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  {#each items as item}
    <DataCard {item} />
  {/each}
</div>
```

**List Layout (for sequential/tiered items):**
```svelte
<div class="space-y-4">
  {#each items as item}
    <DataRow {item} />
  {/each}
</div>
```

**Tabbed Layout (for categorized items):**
```svelte
<div class="flex gap-2 mb-8 border-b border-slate-200">
  <button class="px-5 py-2.5 font-bold text-sm ...">Category 1</button>
  <button class="px-5 py-2.5 font-bold text-sm ...">Category 2</button>
</div>
```

#### 5.5.2 Edit/Delete Action Buttons (MANDATORY)

Every data item MUST have edit and delete actions:

```svelte
<div class="relative group">
  <!-- Card content -->

  <!-- Action buttons - visible on hover -->
  <div class="absolute top-4 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
    <button
      onclick={() => editItem(item)}
      class="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
      title="Edit"
    >
      <Pencil size={16} />
    </button>
    <button
      onclick={() => deleteItem(item.id)}
      class="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
      title="Remove"
    >
      <Trash2 size={16} />
    </button>
  </div>
</div>
```

#### 5.5.3 Delete Confirmation (Tone-Compliant)

**NEVER use:**
```js
confirm("Delete this item?")
```

**ALWAYS use compassionate confirmation:**
```js
confirm("Remove this contact? You can always add them back later if needed.")
confirm("Remove this heirloom? Your story will be preserved in the activity log.")
confirm("Remove this directive? This should only be done if the document has been revoked.")
```

### 5.6 Empty State (MANDATORY)

When no data exists, MUST show the `EmptyState` component with full content.

```svelte
{#if items.length === 0}
  <EmptyState
    title="Your companions deserve a plan too"
    whyMatters="Your pets depend on you completely for their care, comfort, and survival.
      <strong>Without a documented plan, they could end up in a shelter</strong> or with
      someone who doesn't know their needs, fears, or routines. <br/><br/>
      Creating this plan ensures they'll be loved and cared for by someone you trust."
    encouragement="When you're ready, take a moment to think about who would give them
      the life they deserve."
    icon={Dog}
    iconClass="text-primary"
    ctaLabel="Protect your companion"
    onAction={() => (showAddForm = true)}
  />
{/if}
```

#### 5.6.1 Empty State Content Requirements

| Prop | Length | Requirements |
|------|--------|--------------|
| `title` | 5-10 words | Benefit-focused, emotional hook |
| `whyMatters` | 3-5 sentences | **Bold the key insight**, explain consequences of NOT doing this, then explain the benefit |
| `encouragement` | 1 sentence | Start with "When you're ready..." or "Start with just one..." |
| `ctaLabel` | 2-4 words | Compassionate verb + object |

#### 5.6.2 Empty State Pattern

1. **Hook** (title): Draw them in with emotional benefit
2. **Stakes** (whyMatters first half): What happens without this data? **Bold this.**
3. **Benefit** (whyMatters second half): How does completing this help loved ones?
4. **Gentle nudge** (encouragement): Low-pressure invitation to start small
5. **Action** (ctaLabel): Clear, compassionate call-to-action

### 5.7 Success Feedback - Affirmation (MANDATORY)

After every create/update operation, show the `Affirmation` component.

```svelte
<script>
  let showAffirmation = $state(false);

  async function saveItem() {
    await store.create(data);
    showAffirmation = true;  // Trigger affirmation
  }
</script>

<!-- Place after header, before main content -->
<Affirmation module="contacts" bind:show={showAffirmation} />
```

#### 5.7.1 Affirmation Behavior

- Auto-dismisses after 4 seconds
- Shows random message from module's affirmation pool
- Includes primary (bold) and secondary (supporting) text
- Green gradient background for positive reinforcement

#### 5.7.2 Available Module Contexts

Ensure your module has affirmations defined in `lib/data/affirmations.ts`:

| Module | Examples |
|--------|----------|
| `contacts` | "Another person included in your circle of care." |
| `medical` | "Your wishes are now documented with clarity." |
| `pets` | "Your companion's care is now in trusted hands." |
| `heirlooms` | "Another treasure's story preserved for generations." |
| `general` | "Progress made. Every step matters." |

### 5.8 Loading State (MANDATORY)

Every page MUST show loading feedback during data sync.

#### 5.8.1 Initial Load Pattern

```svelte
<script>
  let isLoading = $state(true);

  onMount(async () => {
    await store.sync();
    isLoading = false;
  });
</script>

{#if isLoading}
  <div class="flex items-center justify-center py-12">
    <Loader2 class="w-8 h-8 animate-spin text-primary" />
    <span class="ml-3 text-slate-500">Loading your data...</span>
  </div>
{:else}
  <!-- Actual content -->
{/if}
```

#### 5.8.2 Skeleton Loading (Preferred for Lists/Grids)

```svelte
{#if isLoading}
  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    {#each Array(6) as _}
      <div class="bg-slate-100 rounded-2xl h-48 animate-pulse"></div>
    {/each}
  </div>
{/if}
```

### 5.9 Error Handling (MANDATORY)

Every page MUST handle and display errors gracefully.

#### 5.9.1 Error State Pattern

```svelte
<script>
  let error = $state<string | null>(null);

  async function loadData() {
    try {
      await store.sync();
    } catch (e) {
      error = "We had trouble loading your data. Please try again.";
    }
  }
</script>

{#if error}
  <div class="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 flex items-start gap-3">
    <CircleAlert class="text-red-500 shrink-0 mt-0.5" size={20} />
    <div>
      <p class="text-red-800 font-medium">{error}</p>
      <button onclick={loadData} class="text-red-600 text-sm underline mt-1">
        Try again
      </button>
    </div>
  </div>
{/if}
```

#### 5.9.2 Error Message Tone

**WRONG:**
```
"Error 500: Server error"
"Failed to fetch data"
```

**CORRECT:**
```
"We had trouble loading your data. Please try again in a moment."
"Something went wrong saving your changes. Your data is safe—please try again."
"We couldn't connect to the server. Check your connection and try again."
```

### 5.10 Search & Filter (RECOMMENDED)

For modules with 5+ items, provide search and/or filter capabilities.

#### 5.10.1 Search Bar

```svelte
<div class="relative w-full md:w-96 mb-8">
  <Search size={18} class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
  <input
    type="text"
    bind:value={searchQuery}
    placeholder="Search by name, description..."
    class="w-full pl-10 pr-4 py-3 rounded-2xl border border-slate-200
           focus:border-primary focus:ring-2 focus:ring-primary/20"
  />
</div>
```

#### 5.10.2 Filter Tabs

```svelte
<div class="flex gap-2 mb-8 border-b border-slate-200 pb-1">
  {#each filters as filter}
    <button
      onclick={() => activeFilter = filter.id}
      class="px-5 py-2.5 font-bold text-sm rounded-t-xl transition-all border-b-2
             {activeFilter === filter.id
               ? 'border-primary text-primary bg-primary/10'
               : 'border-transparent text-slate-500 hover:text-slate-700'}"
    >
      {filter.label}
    </button>
  {/each}
</div>
```

### 5.11 Stats Dashboard (RECOMMENDED)

For modules tracking progress or quantities, show summary statistics.

```svelte
<div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
  <div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
    <div>
      <div class="text-xs font-bold uppercase text-slate-400">Total Network</div>
      <div class="text-2xl font-bold text-slate-800">{contacts.length}</div>
    </div>
    <Users class="text-slate-200" size={32} />
  </div>

  <div class="bg-rose-50 p-5 rounded-2xl border border-rose-100 shadow-sm flex items-center justify-between">
    <div>
      <div class="text-xs font-bold uppercase text-rose-400">Pending Action</div>
      <div class="text-2xl font-bold text-rose-700">{pendingCount}</div>
    </div>
    <CircleAlert class="text-rose-300" size={32} />
  </div>

  <div class="bg-green-50 p-5 rounded-2xl border border-green-100 shadow-sm flex items-center justify-between">
    <div>
      <div class="text-xs font-bold uppercase text-green-600">Completed</div>
      <div class="text-2xl font-bold text-green-700">{completedCount}</div>
    </div>
    <CircleCheck class="text-green-300" size={32} />
  </div>
</div>
```

### 5.12 Export & Print Options (RECOMMENDED)

For data that users may need offline or in physical form.

```svelte
<div class="flex gap-2">
  <button
    onclick={downloadPDF}
    class="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg flex items-center gap-2"
  >
    <Download size={16} />
    Download PDF
  </button>
  <button
    onclick={() => window.print()}
    class="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg flex items-center gap-2"
  >
    <Printer size={16} />
    Print
  </button>
</div>
```

### 5.13 Contextual Help & Guidance (RECOMMENDED)

Provide in-context help throughout the page.

#### 5.13.1 Info Banner

```svelte
<div class="bg-primary/5 p-4 rounded-xl text-primary text-sm flex gap-3 border border-primary/10 mb-6">
  <Shield class="shrink-0 mt-0.5" size={20} />
  <p>
    <strong>Caller Strategy:</strong> This specific order is designed to prevent bad news
    from spreading via social media before key people are informed directly.
  </p>
</div>
```

#### 5.13.2 Field-Level Help Text

```svelte
<div>
  <input ... />
  <p class="text-xs text-slate-400 mt-1.5 leading-relaxed">
    Choose someone who already knows and loves them, if possible. This person
    will receive all the care details you provide here.
  </p>
</div>
```

### 5.14 Complete Data Page Template

Here is a complete template showing all required elements:

```svelte
<script lang="ts">
  import { onMount } from "svelte";
  import { fade } from "svelte/transition";
  import { Plus, Pencil, Trash2, Loader2, Search, CircleAlert } from "lucide-svelte";

  // Required components
  import LivingBlueprintHeader from "$lib/components/LivingBlueprintHeader.svelte";
  import AIPromptBar from "$lib/components/concierge/AIPromptBar.svelte";
  import EmptyState from "$lib/components/EmptyState.svelte";
  import Affirmation from "$lib/components/Affirmation.svelte";
  import Modal from "$lib/components/ui/Modal.svelte";

  // Store
  import { myStore } from "$lib/stores/myStore.svelte";

  // State
  let showAddModal = $state(false);
  let showAffirmation = $state(false);
  let isLoading = $state(true);
  let error = $state<string | null>(null);
  let searchQuery = $state("");

  // Derived
  let items = $derived(myStore.items);
  let filteredItems = $derived(
    items.filter(item => item.name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  onMount(async () => {
    try {
      await myStore.sync();
    } catch (e) {
      error = "We had trouble loading your data. Please try again.";
    } finally {
      isLoading = false;
    }
  });

  async function saveItem(data) {
    await myStore.create(data);
    showAddModal = false;
    showAffirmation = true;
  }

  function editItem(item) {
    // Open modal with item data
  }

  function deleteItem(id) {
    if (!confirm("Remove this item? You can always add it back later.")) return;
    myStore.delete(id);
  }
</script>

<!-- 1. PAGE HEADER (MANDATORY) -->
<LivingBlueprintHeader
  title="Your Module Title"
  subtitle="Supportive subtitle explaining what this page does"
  tier="preparation"
  detailedDescription="Detailed explanation of the module's purpose."
  whyMatters="Why completing this matters emotionally and practically."
>
  <!-- 2. ADD DATA BUTTON (MANDATORY) -->
  <button
    onclick={() => (showAddModal = true)}
    class="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground
           rounded-2xl font-bold hover:scale-105 transition-all shadow-lg shadow-primary/20"
  >
    <Plus size={20} />
    Save my details
  </button>
</LivingBlueprintHeader>

<div class="max-w-6xl mx-auto p-6 md:p-8 animate-in fade-in duration-500">

  <!-- 3. AI HELPER SECTION (MANDATORY) -->
  <div class="max-w-3xl mx-auto mb-12">
    <AIPromptBar context="mymodule" />
  </div>

  <!-- 7. SUCCESS FEEDBACK (MANDATORY) -->
  <Affirmation module="mymodule" bind:show={showAffirmation} />

  <!-- 13. ERROR HANDLING (MANDATORY) -->
  {#if error}
    <div class="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 flex items-start gap-3">
      <CircleAlert class="text-red-500 shrink-0" size={20} />
      <p class="text-red-800">{error}</p>
    </div>
  {/if}

  <!-- 10. SEARCH (RECOMMENDED) -->
  <div class="relative w-full md:w-96 mb-8">
    <Search size={18} class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
    <input
      type="text"
      bind:value={searchQuery}
      placeholder="Search..."
      class="w-full pl-10 pr-4 py-3 rounded-2xl border border-slate-200 focus:border-primary"
    />
  </div>

  <!-- 8. LOADING STATE (MANDATORY) -->
  {#if isLoading}
    <div class="flex items-center justify-center py-12">
      <Loader2 class="w-8 h-8 animate-spin text-primary" />
    </div>
  {:else if filteredItems.length === 0 && !searchQuery}
    <!-- 6. EMPTY STATE (MANDATORY) -->
    <EmptyState
      title="Your items deserve attention"
      whyMatters="<strong>Explain what happens without this data.</strong> Then explain the benefit."
      encouragement="When you're ready, start with just one item."
      icon={Plus}
      iconClass="text-primary"
      ctaLabel="Add your first item"
      onAction={() => (showAddModal = true)}
    />
  {:else}
    <!-- 4 & 5. DATA DISPLAY WITH EDIT/DELETE (MANDATORY) -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {#each filteredItems as item (item.id)}
        <div
          class="bg-white rounded-2xl border border-slate-200 shadow-sm p-6
                 hover:shadow-md hover:border-primary/30 transition-all relative group"
          in:fade
        >
          <h3 class="font-bold text-lg text-slate-800">{item.name}</h3>
          <p class="text-slate-600 mt-2">{item.description}</p>

          <!-- Edit/Delete Actions -->
          <div class="absolute top-4 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button onclick={() => editItem(item)} class="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg">
              <Pencil size={16} />
            </button>
            <button onclick={() => deleteItem(item.id)} class="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg">
              <Trash2 size={16} />
            </button>
          </div>
        </div>
      {/each}
    </div>
  {/if}
</div>

<!-- ADD/EDIT MODAL (MANDATORY) -->
<Modal bind:open={showAddModal} title="Add New Item" maxWidth="max-w-lg">
  <!-- Form content -->
</Modal>
```

### 5.15 Data Page Compliance Matrix

Current compliance status across modules:

| Module | Header | Add Btn | AI | Display | Edit/Del | Empty | Affirm | Load | Error | Search | Stats |
|--------|--------|---------|-----|---------|----------|-------|--------|------|-------|--------|-------|
| contacts | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✗ | ~ | ✗ | ✓ |
| medical | ✓ | ✓ | ✗ | ✓ | ✓ | ✓ | ✓ | ✗ | ~ | ✗ | ✗ |
| pets | ✓ | ✓ | ✗ | ✓ | ✓ | ✓ | ✓ | ✗ | ~ | ✗ | ✗ |
| heirlooms | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ~ | ~ | ✓ | ✗ |
| financial | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ~ | ~ | ~ | ✗ | ✓ |
| letters | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ~ | ✓ | ✓ | ✓ | ✗ |
| property | ✓ | ✓ | ✓ | ✓ | ✓ | ~ | ~ | ~ | ~ | ✓ | ✓ |
| insurance | ✓ | ✓ | ✗ | ✓ | ✓ | ✓ | ~ | ~ | ~ | ✓ | ✓ |
| digital-guardian | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ~ | ~ | ~ | ✗ | ✗ |
| anniversary | ✓ | ✓ | ✗ | ✓ | ✓ | ~ | ~ | ~ | ~ | ✗ | ✗ |
| time-capsule | ✓ | ✓ | ✗ | ✓ | ✓ | ✓ | ~ | ~ | ~ | ✗ | ✗ |
| legacy-journal | ✓ | ✗ | ✗ | ✓ | ~ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| subscriptions | ✓ | ✓ | ✗ | ✓ | ✓ | ✓ | ~ | ✗ | ~ | ✗ | ✓ |
| visual-memories | ✓ | ✓ | ✗ | ✓ | ✓ | ✓ | ~ | ✗ | ~ | ~ | ✗ |

**Legend:** ✓ = Compliant, ~ = Partial, ✗ = Missing

**Priority fixes needed:**
1. Add AI Helper to: medical, pets, anniversary, time-capsule, legacy-journal, subscriptions, visual-memories
2. Add Loading States to: ALL modules
3. Add Affirmation to: financial, letters, property, insurance, digital-guardian, anniversary, time-capsule, subscriptions, visual-memories
4. Add Search to: medical, pets, contacts, financial, digital-guardian, anniversary, time-capsule, legacy-journal

---

## 6. Card & Container Standards

### 5.1 Standard Card

```svelte
<div class="bg-white rounded-2xl border border-slate-200 shadow-sm p-6
            hover:shadow-md hover:border-primary/30 transition-all">
  <!-- Card content -->
</div>
```

### 5.2 Card Specifications

| Property | Standard Value | Violations |
|----------|---------------|------------|
| Border radius | `rounded-2xl` | contacts: `rounded-xl`, medical/pets: `rounded-3xl` |
| Border | `border border-slate-200` | Consistent |
| Shadow | `shadow-sm` | Consistent |
| Hover shadow | `hover:shadow-md` | Some use `hover:shadow-lg` |
| Padding | `p-6` | Some use `p-4` or `p-8` |

### 5.3 Stat Card

```svelte
<div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
  <div>
    <div class="text-xs font-bold uppercase text-slate-400">Label</div>
    <div class="text-2xl font-bold text-slate-800">Value</div>
  </div>
  <IconComponent class="text-slate-200" size={32} />
</div>
```

### 5.4 Colored Stat Card

```svelte
<!-- Success/Green -->
<div class="bg-green-50 p-5 rounded-2xl border border-green-100 shadow-sm">

<!-- Warning/Rose -->
<div class="bg-rose-50 p-5 rounded-2xl border border-rose-100 shadow-sm">

<!-- Info/Blue -->
<div class="bg-blue-50 p-5 rounded-2xl border border-blue-100 shadow-sm">
```

### 5.5 Info Banner

```svelte
<div class="bg-primary/5 p-4 rounded-xl text-primary text-sm flex gap-3 border border-primary/10">
  <Shield class="shrink-0 mt-0.5" size={20} />
  <p><strong>Title:</strong> Description text here.</p>
</div>
```

### 5.6 Highlighted Section Card

```svelte
<div class="bg-primary/5 p-6 rounded-2xl border border-primary/10">
  <label class="block text-xs font-bold uppercase text-primary mb-2">
    Section Label
  </label>
  <!-- Content -->
</div>
```

---

## 7. Icon Standards

### 7.1 Icon Library

**ONLY use:** `lucide-svelte`

Do NOT use inline SVGs unless absolutely necessary.

### 7.2 Icon Sizes

| Context | Size | Example |
|---------|------|---------|
| Inline with text | `size={16}` | Status indicators |
| Button icons | `size={18}` | Add, edit actions |
| List item icons | `size={20}` | Phone, email, etc. |
| Card header icons | `size={24}` | Section identifiers |
| Page header icons | `size={32}` or `size={48}` | Module icons |
| Decorative/background | `size={120}` | Faded card backgrounds |

### 7.3 Edit/Delete Icon Placement

**Pattern: Top-right of card, visible on hover**

```svelte
<div class="... relative group">
  <!-- Card content -->

  <div class="absolute top-4 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
    <button class="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all">
      <Pencil size={16} />
    </button>
    <button class="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all">
      <Trash2 size={16} />
    </button>
  </div>
</div>
```

### 7.4 Common Icon Mappings

| Action/Concept | Icon | Color |
|----------------|------|-------|
| Add | `Plus` | Inherits button color |
| Edit | `Pencil` | `text-blue-600` on hover |
| Delete | `Trash2` | `text-red-600` on hover |
| Close | `X` | `text-slate-400` |
| Save | `Save` | Inherits button color |
| Success | `CircleCheck` | `text-green-600` |
| Warning | `CircleAlert` | `text-orange-500` or `text-rose-500` |
| Info | `Info` | `text-blue-500` |
| Phone | `Phone` | `text-slate-400` |
| Email | `Mail` | `text-slate-400` |
| User | `User` | `text-slate-400` |
| Shield/Security | `Shield` | `text-primary` |
| Heart/Love | `Heart` | `text-rose-500` |
| AI/Magic | `Sparkles` | `text-amber-500` |

---

## 8. Typography Standards

### 8.1 Heading Hierarchy

| Level | Classes | Use |
|-------|---------|-----|
| Page title | `font-serif font-bold text-4xl text-slate-900` | Module main headings |
| Section title | `font-bold text-2xl text-slate-900` | Major sections |
| Card title | `font-bold text-lg text-slate-800` | Card headers |
| Subsection | `font-bold text-base text-slate-800` | Within cards |
| Label | `text-xs font-bold uppercase text-slate-500 tracking-wide` | Form labels |

### 8.2 Body Text

| Type | Classes |
|------|---------|
| Primary | `text-base text-slate-700` |
| Secondary | `text-sm text-slate-600` |
| Muted | `text-sm text-slate-500` |
| Caption | `text-xs text-slate-400` |

### 8.3 Font Families

- **Headings:** `font-serif` (for warmth and trust)
- **Body/UI:** Default sans-serif (system fonts)

---

## 9. Spacing Standards

### 9.1 Spacing Scale

Use Tailwind's default spacing scale. Most common values:

| Token | Pixels | Common Use |
|-------|--------|------------|
| `gap-2` | 8px | Tight icon-text spacing |
| `gap-3` | 12px | Button icon-text |
| `gap-4` | 16px | Form field grid gaps |
| `gap-6` | 24px | Card grids, section gaps |
| `gap-8` | 32px | Major section separation |

### 9.2 Component Internal Spacing

| Component | Padding |
|-----------|---------|
| Card | `p-6` |
| Modal content | `p-6` |
| Modal header | `px-6 py-4` |
| Modal footer | `px-6 py-4` |
| Button (medium) | `px-6 py-2.5` |
| Input | `px-4 py-3` |
| Stat card | `p-5` |
| Info banner | `p-4` |

### 9.3 Section Margins

| Context | Classes |
|---------|---------|
| After page header | `mb-8` |
| Between major sections | `space-y-8` or `mb-8` |
| Between cards | `gap-6` (in grid) |
| Between form fields | `space-y-4` |

---

## 10. Animation Standards

### 10.1 Page Entry

```svelte
<div class="animate-in fade-in duration-500">
```

### 10.2 Content Reveal

```svelte
transition:fade={{ duration: 300 }}
```

### 10.3 Modal Entry

```svelte
<!-- Backdrop -->
transition:fade={{ duration: 200 }}

<!-- Panel -->
transition:scale={{ duration: 250, start: 0.95, easing: cubicOut }}
```

### 10.4 Slide Expand/Collapse

```svelte
transition:slide={{ duration: 300, easing: quintOut }}
```

### 10.5 Hover Transitions

```svelte
class="transition-all duration-200"
class="transition-colors duration-200"
class="transition-opacity duration-200"
```

### 10.6 Timing Guidelines

| Animation Type | Duration |
|----------------|----------|
| Micro-interactions | 150-200ms |
| Standard transitions | 200-300ms |
| Page transitions | 400-500ms |
| Deliberate/important | 500-700ms |

---

## 11. Color Standards

### 11.1 Semantic Colors

| Purpose | Color | Usage |
|---------|-------|-------|
| Primary | `primary` (CSS var) | Buttons, links, highlights |
| Success | `green-600` | Confirmed, completed |
| Warning | `amber-500` | AI-populated, attention |
| Danger | `rose-600` / `red-600` | Urgent, delete actions |
| Info | `blue-600` | Informational |

### 11.2 Neutral Palette (Slate)

| Token | Use |
|-------|-----|
| `slate-900` | Primary text, dark buttons |
| `slate-800` | Secondary headings |
| `slate-700` | Body text |
| `slate-600` | Secondary text |
| `slate-500` | Muted text, labels |
| `slate-400` | Placeholder text, icons |
| `slate-200` | Borders, dividers |
| `slate-100` | Light backgrounds, hover |
| `slate-50` | Very light backgrounds |

### 11.3 Background Colors

| Context | Color |
|---------|-------|
| Page background | `bg-background` (CSS var) |
| Card background | `bg-white` |
| Modal backdrop | `bg-slate-900/60` |
| Modal footer | `bg-slate-50` |
| Input background | `bg-white` |
| Disabled background | `bg-slate-100` |

---

## 12. Empty State Standards

### 12.1 Use EmptyState Component

```svelte
<EmptyState
  title="Your [items] deserve [benefit]"
  whyMatters="<strong>Explain why this matters emotionally.</strong> Additional context..."
  encouragement="When you're ready, [gentle action suggestion]."
  icon={IconComponent}
  iconClass="text-primary"
  ctaLabel="Begin your [action]"
  onAction={() => (showModal = true)}
/>
```

### 12.2 EmptyState Content Guidelines

| Property | Guidelines |
|----------|------------|
| title | 5-8 words, benefit-focused, gentle |
| whyMatters | 2-3 sentences, bold the key insight, explain emotional value |
| encouragement | Single sentence, starts with "When you're ready" or similar |
| ctaLabel | Compassionate action verb + object |

---

## 13. Action Placement Standards

### 13.1 Page-Level Add Button

**Location:** Top-right, below header, above content

```svelte
<div class="flex justify-end mb-8">
  <button>...</button>
</div>
```

### 13.2 Card Actions (Edit/Delete)

**Location:** Top-right corner, visible on hover

### 13.3 Form Submit Button

**Location:** Modal footer, right-aligned (or full-width if single button)

### 13.4 Inline Row Actions

**Location:** Right side of row, always visible or visible on hover

---

## 14. Compassionate Language Standards

### 14.1 Button Text Patterns

| Context | Pattern | Example |
|---------|---------|---------|
| Save action | "Save my [noun]" | "Save my thoughts" |
| Add action | "Share [noun]" or "Include [noun]" | "Share contact details" |
| Cancel | "Not right now" | - |
| Continue | "Continue when ready" | - |
| Remove | "Remove this [item]" | "Remove this contact" |

### 14.2 Modal Titles

- Use questions or inclusive phrases
- Example: "Who should we include?" instead of "Add Contact"
- Example: "Preserve a Treasure" instead of "Add Heirloom"

### 14.3 Confirmation Dialogs

**WRONG:**
```js
confirm("Delete this item?")
```

**CORRECT:**
```js
confirm("Remove this contact? You can always add them back later if needed.")
```

### 14.4 Empty State Messaging

- Lead with emotional value
- Bold the key insight
- Offer gentle encouragement
- Never use imperative language like "Add your first item"

---

## 15. Implementation Checklist

### 15.1 When Creating a New Module

- [ ] Use `max-w-6xl mx-auto p-6 md:p-8` container
- [ ] Add `animate-in fade-in duration-500` to container
- [ ] Use `<LivingBlueprintHeader />` for page header
- [ ] Use `<Modal />` component for all overlays
- [ ] Use `<EmptyState />` for empty data state
- [ ] Use `<Affirmation />` for success feedback
- [ ] Use `<SaveButton />` for save operations
- [ ] Use Lucide icons only
- [ ] Follow card styling: `rounded-2xl border border-slate-200 shadow-sm`
- [ ] Use compassionate language for all user-facing text

### 15.2 When Creating a Modal

- [ ] Use `<Modal />` component (never custom div)
- [ ] Set appropriate `maxWidth` prop
- [ ] Include close button with X icon
- [ ] Use `space-y-4` for form field spacing
- [ ] Use standard input styling
- [ ] Include footer with cancel + primary buttons
- [ ] Use compassionate button text

### 15.3 When Creating a Card

- [ ] Use `rounded-2xl` border radius
- [ ] Use `border border-slate-200` border
- [ ] Use `shadow-sm` default shadow
- [ ] Use `p-6` padding
- [ ] Add `hover:shadow-md hover:border-primary/30` for interactive cards
- [ ] Place edit/delete icons top-right with group-hover visibility

---

## Appendix A: Current Violations by Module

### High Priority (Custom Modals - Must Fix)

| Module | File | Line | Issue |
|--------|------|------|-------|
| contacts | `+page.svelte` | 456-622 | Custom modal with `bg-black/50`, text close button |
| medical | `+page.svelte` | 473-630 | Custom modal with `rounded-[32px]`, rotated Plus as X |
| pets | `+page.svelte` | 302-509 | Custom modal with inline SVG close button |
| heirlooms | `+page.svelte` | 519-644 | Custom modal with "Go back" text close |
| financial-accounts | `+page.svelte` | 103+ | ConciergeFlow modal with `bg-black/40` |
| letters | `+page.svelte` | Multiple | Custom modals throughout |

### Medium Priority (Styling Inconsistencies)

| Module | Issue |
|--------|-------|
| contacts | Card uses `rounded-xl` instead of `rounded-2xl` |
| medical | Card uses `rounded-3xl`, inputs use `focus:ring-red-500` |
| pets | Card uses `rounded-3xl`, container is `max-w-4xl` |
| heirlooms | Container is `max-w-7xl` (acceptable for gallery) |

### Low Priority (Minor Variations)

| Issue | Modules Affected |
|-------|------------------|
| Inconsistent input padding | Most modules |
| Various add button sizes | contacts, medical, pets, heirlooms |
| Animation timing differences | All modules |

---

## Appendix B: Component Reference

### Required Imports for Consistent UI

```svelte
<script>
  // Core UI components
  import Modal from "$lib/components/ui/Modal.svelte";
  import SaveButton from "$lib/components/ui/SaveButton.svelte";
  import SmartInput from "$lib/components/ui/SmartInput.svelte";
  import SmartTextarea from "$lib/components/ui/SmartTextarea.svelte";
  import EmptyState from "$lib/components/EmptyState.svelte";
  import Affirmation from "$lib/components/Affirmation.svelte";
  import LivingBlueprintHeader from "$lib/components/LivingBlueprintHeader.svelte";
  import CustomFieldsManager from "$lib/components/ui/CustomFieldsManager.svelte";

  // Icons (Lucide only)
  import { Plus, Pencil, Trash2, X, ... } from "lucide-svelte";
</script>
```

---

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-01-25 | Claude | Initial standards document |

---

**This document is the source of truth for Continuum UI standards. All new code and refactoring must comply with these standards.**
