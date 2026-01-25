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
5. [Card & Container Standards](#5-card--container-standards)
6. [Icon Standards](#6-icon-standards)
7. [Typography Standards](#7-typography-standards)
8. [Spacing Standards](#8-spacing-standards)
9. [Animation Standards](#9-animation-standards)
10. [Color Standards](#10-color-standards)
11. [Empty State Standards](#11-empty-state-standards)
12. [Action Placement Standards](#12-action-placement-standards)
13. [Compassionate Language Standards](#13-compassionate-language-standards)
14. [Implementation Checklist](#14-implementation-checklist)

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

## 5. Card & Container Standards

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

## 6. Icon Standards

### 6.1 Icon Library

**ONLY use:** `lucide-svelte`

Do NOT use inline SVGs unless absolutely necessary.

### 6.2 Icon Sizes

| Context | Size | Example |
|---------|------|---------|
| Inline with text | `size={16}` | Status indicators |
| Button icons | `size={18}` | Add, edit actions |
| List item icons | `size={20}` | Phone, email, etc. |
| Card header icons | `size={24}` | Section identifiers |
| Page header icons | `size={32}` or `size={48}` | Module icons |
| Decorative/background | `size={120}` | Faded card backgrounds |

### 6.3 Edit/Delete Icon Placement

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

### 6.4 Common Icon Mappings

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

## 7. Typography Standards

### 7.1 Heading Hierarchy

| Level | Classes | Use |
|-------|---------|-----|
| Page title | `font-serif font-bold text-4xl text-slate-900` | Module main headings |
| Section title | `font-bold text-2xl text-slate-900` | Major sections |
| Card title | `font-bold text-lg text-slate-800` | Card headers |
| Subsection | `font-bold text-base text-slate-800` | Within cards |
| Label | `text-xs font-bold uppercase text-slate-500 tracking-wide` | Form labels |

### 7.2 Body Text

| Type | Classes |
|------|---------|
| Primary | `text-base text-slate-700` |
| Secondary | `text-sm text-slate-600` |
| Muted | `text-sm text-slate-500` |
| Caption | `text-xs text-slate-400` |

### 7.3 Font Families

- **Headings:** `font-serif` (for warmth and trust)
- **Body/UI:** Default sans-serif (system fonts)

---

## 8. Spacing Standards

### 8.1 Spacing Scale

Use Tailwind's default spacing scale. Most common values:

| Token | Pixels | Common Use |
|-------|--------|------------|
| `gap-2` | 8px | Tight icon-text spacing |
| `gap-3` | 12px | Button icon-text |
| `gap-4` | 16px | Form field grid gaps |
| `gap-6` | 24px | Card grids, section gaps |
| `gap-8` | 32px | Major section separation |

### 8.2 Component Internal Spacing

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

### 8.3 Section Margins

| Context | Classes |
|---------|---------|
| After page header | `mb-8` |
| Between major sections | `space-y-8` or `mb-8` |
| Between cards | `gap-6` (in grid) |
| Between form fields | `space-y-4` |

---

## 9. Animation Standards

### 9.1 Page Entry

```svelte
<div class="animate-in fade-in duration-500">
```

### 9.2 Content Reveal

```svelte
transition:fade={{ duration: 300 }}
```

### 9.3 Modal Entry

```svelte
<!-- Backdrop -->
transition:fade={{ duration: 200 }}

<!-- Panel -->
transition:scale={{ duration: 250, start: 0.95, easing: cubicOut }}
```

### 9.4 Slide Expand/Collapse

```svelte
transition:slide={{ duration: 300, easing: quintOut }}
```

### 9.5 Hover Transitions

```svelte
class="transition-all duration-200"
class="transition-colors duration-200"
class="transition-opacity duration-200"
```

### 9.6 Timing Guidelines

| Animation Type | Duration |
|----------------|----------|
| Micro-interactions | 150-200ms |
| Standard transitions | 200-300ms |
| Page transitions | 400-500ms |
| Deliberate/important | 500-700ms |

---

## 10. Color Standards

### 10.1 Semantic Colors

| Purpose | Color | Usage |
|---------|-------|-------|
| Primary | `primary` (CSS var) | Buttons, links, highlights |
| Success | `green-600` | Confirmed, completed |
| Warning | `amber-500` | AI-populated, attention |
| Danger | `rose-600` / `red-600` | Urgent, delete actions |
| Info | `blue-600` | Informational |

### 10.2 Neutral Palette (Slate)

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

### 10.3 Background Colors

| Context | Color |
|---------|-------|
| Page background | `bg-background` (CSS var) |
| Card background | `bg-white` |
| Modal backdrop | `bg-slate-900/60` |
| Modal footer | `bg-slate-50` |
| Input background | `bg-white` |
| Disabled background | `bg-slate-100` |

---

## 11. Empty State Standards

### 11.1 Use EmptyState Component

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

### 11.2 EmptyState Content Guidelines

| Property | Guidelines |
|----------|------------|
| title | 5-8 words, benefit-focused, gentle |
| whyMatters | 2-3 sentences, bold the key insight, explain emotional value |
| encouragement | Single sentence, starts with "When you're ready" or similar |
| ctaLabel | Compassionate action verb + object |

---

## 12. Action Placement Standards

### 12.1 Page-Level Add Button

**Location:** Top-right, below header, above content

```svelte
<div class="flex justify-end mb-8">
  <button>...</button>
</div>
```

### 12.2 Card Actions (Edit/Delete)

**Location:** Top-right corner, visible on hover

### 12.3 Form Submit Button

**Location:** Modal footer, right-aligned (or full-width if single button)

### 12.4 Inline Row Actions

**Location:** Right side of row, always visible or visible on hover

---

## 13. Compassionate Language Standards

### 13.1 Button Text Patterns

| Context | Pattern | Example |
|---------|---------|---------|
| Save action | "Save my [noun]" | "Save my thoughts" |
| Add action | "Share [noun]" or "Include [noun]" | "Share contact details" |
| Cancel | "Not right now" | - |
| Continue | "Continue when ready" | - |
| Remove | "Remove this [item]" | "Remove this contact" |

### 13.2 Modal Titles

- Use questions or inclusive phrases
- Example: "Who should we include?" instead of "Add Contact"
- Example: "Preserve a Treasure" instead of "Add Heirloom"

### 13.3 Confirmation Dialogs

**WRONG:**
```js
confirm("Delete this item?")
```

**CORRECT:**
```js
confirm("Remove this contact? You can always add them back later if needed.")
```

### 13.4 Empty State Messaging

- Lead with emotional value
- Bold the key insight
- Offer gentle encouragement
- Never use imperative language like "Add your first item"

---

## 14. Implementation Checklist

### 14.1 When Creating a New Module

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

### 14.2 When Creating a Modal

- [ ] Use `<Modal />` component (never custom div)
- [ ] Set appropriate `maxWidth` prop
- [ ] Include close button with X icon
- [ ] Use `space-y-4` for form field spacing
- [ ] Use standard input styling
- [ ] Include footer with cancel + primary buttons
- [ ] Use compassionate button text

### 14.3 When Creating a Card

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
