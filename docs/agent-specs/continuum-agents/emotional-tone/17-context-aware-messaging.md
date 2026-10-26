# Agent 17: Context-Aware Messaging
**Priority:** P0 - CRITICAL
**Estimated Time:** 2 days
**Dependencies:** None
**Category:** Emotional Tone

---

## OBJECTIVE

Implement context-aware messaging that adapts language based on user role (owner, executor, family member) and emotional state.

**Current Issues:**
- Same language for all users regardless of context
- No differentiation between someone planning vs someone grieving
- Generic messages don't acknowledge user situation
- Missing emotional intelligence in UI text

**Expected Outcome:**
- Different message variants for different contexts
- Grief-aware language for executors
- Supportive language for owners planning
- Patient language for family helpers
- System detects and adapts to user context

---

## FILES TO CREATE

1. `/frontend/src/lib/context/UserContext.svelte` - Context detection
2. `/frontend/src/lib/utils/contextualMessages.ts` - Message variants
3. `/frontend/src/lib/components/ContextualMessage.svelte` - Smart messaging component

---

## IMPLEMENTATION

### User Context Store:

**File:** `/frontend/src/lib/stores/contextStore.ts`

```typescript
import { writable } from 'svelte/store';

export type UserRole = 'owner' | 'executor' | 'family_helper';
export type EmotionalState = 'neutral' | 'overwhelmed' | 'grieving' | 'focused';

interface UserContext {
  role: UserRole;
  emotionalState: EmotionalState;
  hasRecentLoss: boolean;
  isFirstVisit: boolean;
}

function createContextStore() {
  const { subscribe, update } = writable<UserContext>({
    role: 'owner',
    emotionalState: 'neutral',
    hasRecentLoss: false,
    isFirstVisit: true
  });

  return {
    subscribe,

    setRole(role: UserRole) {
      update(ctx => ({ ...ctx, role }));
    },

    setEmotionalState(state: EmotionalState) {
      update(ctx => ({ ...ctx, emotionalState: state }));
    },

    markRecentLoss() {
      update(ctx => ({
        ...ctx,
        hasRecentLoss: true,
        emotionalState: 'grieving'
      }));
    },

    markVisited() {
      update(ctx => ({ ...ctx, isFirstVisit: false }));
    }
  };
}

export const contextStore = createContextStore();
```

### Contextual Messages Utility:

**File:** `/frontend/src/lib/utils/contextualMessages.ts`

```typescript
import type { UserRole, EmotionalState } from '$lib/stores/contextStore';

interface MessageVariants {
  owner: string;
  executor: string;
  family_helper: string;
}

export const messages = {
  welcome: {
    owner: "Welcome back. Take all the time you need - this work you're doing matters.",
    executor: "We're here to support you during this difficult time. There's no rush - move at whatever pace feels right.",
    family_helper: "Thank you for helping organize this. Your care and support mean everything."
  },

  emptySectionPrompt: {
    owner: "When you're ready, you can start adding information here. There's no pressure to do it all at once.",
    executor: "This section is empty right now. If you have this information, you can add it when you're ready. If not, that's completely okay.",
    family_helper: "You can help add information here, or skip it for now if you're not sure. Whatever works best."
  },

  saveSuccess: {
    owner: "Saved. You're building something meaningful here.",
    executor: "Saved. Thank you for taking care of this.",
    family_helper: "Saved. Your help with this is invaluable."
  },

  deleteConfirmation: {
    owner: "Are you sure you want to remove this? You can always add it back later.",
    executor: "Are you sure you want to delete this? Take your time deciding.",
    family_helper: "Are you sure you want to remove this item?"
  },

  sectionComplete: {
    owner: "You've completed this section. This is important work you're doing.",
    executor: "This section is complete. You're handling something very difficult with grace.",
    family_helper: "This section is done. Your support is making a real difference."
  },

  overwhelmedPrompt: {
    owner: "Feeling overwhelmed? That's completely normal. You can take a break anytime.",
    executor: "This is a lot to handle while grieving. Please be gentle with yourself and take breaks as needed.",
    family_helper: "This is a big task. Remember to pace yourself and ask for help if you need it."
  },

  progressEncouragement: {
    owner: "Every step forward matters. Your loved ones will be so grateful for this care and preparation.",
    executor: "You're doing something incredibly difficult. It's okay if it takes time.",
    family_helper: "Your patience and support are gifts. Thank you for being here."
  }
};

export function getMessage(
  category: keyof typeof messages,
  role: UserRole,
  emotionalState?: EmotionalState
): string {
  const messageSet = messages[category];

  // Special handling for overwhelming emotional states
  if (emotionalState === 'overwhelmed' || emotionalState === 'grieving') {
    if (category === 'emptySectionPrompt') {
      return "There's no pressure to fill this out right now. You can come back to it whenever you're ready, or leave it blank - whatever feels right.";
    }
  }

  return messageSet[role];
}
```

### Contextual Message Component:

**File:** `/frontend/src/lib/components/ContextualMessage.svelte`

```svelte
<script lang="ts">
  import { contextStore } from '$lib/stores/contextStore';
  import { getMessage } from '$lib/utils/contextualMessages';

  export let message: keyof typeof import('$lib/utils/contextualMessages').messages;
  export let variant: 'info' | 'success' | 'warning' = 'info';

  $: text = getMessage(message, $contextStore.role, $contextStore.emotionalState);
</script>

<div class="contextual-message {variant}">
  <p>{text}</p>
</div>

<style>
  .contextual-message {
    padding: 12px 16px;
    border-radius: 6px;
    margin: 12px 0;
    line-height: 1.5;
  }

  .info {
    background-color: #EFF6FF;
    color: #1E40AF;
    border-left: 4px solid #3B82F6;
  }

  .success {
    background-color: #F0FDF4;
    color: #166534;
    border-left: 4px solid #22C55E;
  }

  .warning {
    background-color: #FEF3C7;
    color: #92400E;
    border-left: 4px solid #F59E0B;
  }
</style>
```

### Usage in Components:

```svelte
<script>
  import ContextualMessage from '$lib/components/ContextualMessage.svelte';
</script>

<!-- Welcome message adapts to user role -->
<ContextualMessage message="welcome" variant="info" />

<!-- Empty state prompts adapt to context -->
{#if documents.length === 0}
  <ContextualMessage message="emptySectionPrompt" variant="info" />
{/if}

<!-- Save confirmations adapt to role -->
<ContextualMessage message="saveSuccess" variant="success" />
```

### Context Detection:

```svelte
<!-- In dashboard or onboarding -->
<script>
  import { contextStore } from '$lib/stores/contextStore';

  function handleRoleSelection(role) {
    contextStore.setRole(role);

    if (role === 'executor') {
      contextStore.markRecentLoss();
    }
  }
</script>

<div class="role-selection">
  <h2>How can we help you today?</h2>

  <button on:click={() => handleRoleSelection('owner')}>
    I'm organizing my own estate
  </button>

  <button on:click={() => handleRoleSelection('executor')}>
    I'm handling a loved one's estate
  </button>

  <button on:click={() => handleRoleSelection('family_helper')}>
    I'm helping a family member plan
  </button>
</div>
```

---

## SUCCESS CRITERIA

- [ ] Context store created with role tracking
- [ ] Message variants for all key UI moments
- [ ] ContextualMessage component created
- [ ] Different messages for owner/executor/family
- [ ] Grief-aware messaging for executors
- [ ] Overwhelmed state detection and response
- [ ] Role selection prompt on first visit

---

## COMMIT MESSAGE

```
feat(empathy): implement context-aware messaging system

Adapt UI language based on user role and emotional state.

Implementation:
- Context store tracking role and emotional state
- Message variants for owner/executor/family_helper
- Grief-aware language for bereaved users
- Overwhelmed state detection
- ContextualMessage component
- Role selection on onboarding

Message Categories:
- Welcome messages
- Empty state prompts
- Save confirmations
- Delete confirmations
- Section completion
- Overwhelm support
- Progress encouragement

Examples:
- Owner: "Take all the time you need"
- Executor: "We're here to support you during this difficult time"
- Family Helper: "Thank you for helping organize this"

Impact:
- Appropriate emotional tone for each user
- Grief-aware language for executors
- Supportive messaging throughout
- Users feel understood and supported

Closes: Context-aware messaging
Ref: EMOTIONAL_TONE_AUDIT.md
```

---

**READY TO EXECUTE**
