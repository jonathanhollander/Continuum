# Contextual Messaging Quick Reference

## Import and Use

```typescript
import { contextStore } from '$lib/stores/contextStore.svelte';
import {
    getContextualMessage,
    possessive,
    subject,
    object,
    estate,
    wishes,
    contacts,
    getGreeting,
    getEmptyStateMessage,
    getActionLabel,
    getModuleDescription,
    getProgressMessage
} from '$lib/utils/contextualMessages';
import ContextualMessage from '$lib/components/ContextualMessage.svelte';
```

## Quick Examples

### Component Variant

```svelte
<ContextualMessage
    variants={{
        planning: 'Your estate',
        executor: 'Their estate',
        family: 'The estate'
    }}
/>
```

### Helper Functions

```svelte
<h1>{possessive()} contacts</h1>
<!-- Planning: "your contacts" -->
<!-- Executor: "their contacts" -->
<!-- Family: "family contacts" -->

<p>Manage {estate()}</p>
<!-- Planning: "your estate" -->
<!-- Executor: "their estate" / "[name]'s estate" -->
<!-- Family: "the estate" -->
```

### Pre-built Messages

```svelte
<EmptyState
    message={getEmptyStateMessage('contacts')}
    ctaLabel={getActionLabel('add')}
/>

<h2>{getGreeting()}</h2>

<p>{getModuleDescription('medical')}</p>

<div class="progress">{getProgressMessage(65)}</div>
```

### Check Role Directly

```svelte
{#if contextStore.isExecutor}
    <div class="executor-notice">Viewing as executor</div>
{/if}

{#if contextStore.isGrieving}
    <div class="gentle-message">Take all the time you need.</div>
{/if}
```

### Custom Logic

```typescript
const message = contextStore.role === 'executor'
    ? 'Gather estate information'
    : contextStore.role === 'family'
    ? 'View estate details'
    : 'Plan your legacy';
```

## Available Helper Functions

| Function | Returns | Example Output |
|----------|---------|----------------|
| `possessive()` | Possessive pronoun | "your" / "their" / "the" |
| `subject()` | Subject pronoun | "you" / "they" / "the family" |
| `object()` | Object pronoun | "you" / "them" |
| `estate()` | Estate reference | "your estate" / "their estate" |
| `wishes()` | Wishes reference | "your wishes" / "their wishes" |
| `contacts()` | Contacts reference | "your contacts" / "family contacts" |
| `getGreeting()` | Greeting message | "Welcome back" / "We're here to help" |

## Available Pre-built Messages

| Function | Purpose |
|----------|---------|
| `getEmptyStateMessage(moduleType)` | Empty state for modules |
| `getActionLabel(action)` | Button/action labels |
| `getModuleDescription(moduleId)` | Module header descriptions |
| `getProgressMessage(percentage)` | Progress feedback |

## Role Values

- `'planning'` - Estate owner planning (default)
- `'executor'` - Managing estate after death
- `'family'` - Family member viewing estate
- `'advisor'` - Professional advisor

## Emotional Context Values

- `null` - Default (healthy state)
- `'healthy'` - Explicitly healthy
- `'terminal'` - Terminal diagnosis
- `'grieving'` - Experiencing grief

## Setting Context (Dev/Testing)

```typescript
import { contextStore } from '$lib/stores/contextStore.svelte';

// Set role
contextStore.setRole('executor');

// Set emotional context
contextStore.setEmotionalContext('grieving');

// Set deceased name (for personalization)
contextStore.setDeceasedName('Sarah');

// Refresh from auth store
contextStore.refresh();
```

## Language Guidelines

### Planning Mode
- First person ("your", "you")
- Empowering and encouraging
- "Start building your legacy"

### Executor Mode
- Third person ("their", "they", or "[name]'s")
- Patient and supportive
- Grief-aware by default
- "Gather information at your own pace"

### Family Mode
- Neutral third person ("the", "family")
- Gentle and inclusive
- "Information will be available when ready"

### Advisor Mode
- Professional third person
- Efficient and respectful
- Falls back to executor patterns

## Common Patterns

### Headers
```svelte
<h1>
    <ContextualMessage variants={{
        planning: 'Your Estate Planning',
        executor: 'Estate Administration',
        family: 'Family Estate Portal'
    }} />
</h1>
```

### Empty States
```svelte
{#if items.length === 0}
    <p>{getEmptyStateMessage('documents')}</p>
{/if}
```

### Action Buttons
```svelte
<button>{getActionLabel('add')}</button>
<button>{getActionLabel('save')}</button>
<button>{getActionLabel('delete')}</button>
```

### Conditional Content
```svelte
{#if contextStore.isExecutor}
    <InfoBox>You are managing this estate as an executor.</InfoBox>
{:else if contextStore.isFamily}
    <InfoBox>You have view access to this estate.</InfoBox>
{/if}
```

---

See full documentation: `/CONTEXT_AWARE_MESSAGING.md`
