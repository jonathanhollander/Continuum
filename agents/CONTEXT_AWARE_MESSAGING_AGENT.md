# Context-Aware Messaging Agent Specification
**Priority:** P0 - CRITICAL
**Estimated Time:** 2 days
**Impact:** Personalizes emotional support based on user situation

---

## OBJECTIVE

Implement user context detection and context-aware messaging throughout the application to differentiate between:
- Owner (healthy, planning ahead)
- Owner (terminal diagnosis)
- Executor (actively grieving)
- Family member (planning for aging parent)

Each context requires dramatically different emotional tone and messaging.

---

## PROBLEM STATEMENT

The app currently treats all users identically despite radically different emotional states. A healthy 45-year-old planning ahead needs different messaging than a widow managing her husband's estate 48 hours after his death.

---

## FILES TO CREATE

1. `/frontend/src/lib/stores/userContext.ts` - Context detection store
2. `/frontend/src/lib/components/ContextBanner.svelte` - Context-aware banners
3. `/frontend/src/lib/utils/contextDetection.ts` - Context detection logic

---

## FILES TO MODIFY

1. `/frontend/src/routes/dashboard/+page.svelte` - Add context detection
2. `/frontend/src/routes/+layout.svelte` - Global context provider
3. All 11 module pages - Add context-aware introductions
4. `/frontend/src/lib/services/aiConciergeService.ts` - Pass context to AI

---

## IMPLEMENTATION

### 1. Create User Context Store

```typescript
// /frontend/src/lib/stores/userContext.ts

import { writable, derived } from 'svelte/store';

export type UserContextType =
  | 'owner_planning'       // Healthy person planning ahead
  | 'owner_terminal'       // Person with terminal diagnosis
  | 'executor_recent'      // Executor, loss within 30 days
  | 'executor_active'      // Executor, managing estate
  | 'family_member'        // Family member helping parent
  | 'unknown';

interface UserContext {
  type: UserContextType;
  since?: Date;           // When did they become executor?
  relationship?: string;  // To deceased, if executor
}

function createUserContextStore() {
  const { subscribe, set, update } = writable<UserContext>({
    type: 'unknown'
  });

  return {
    subscribe,
    set,
    update,

    // Detect context from estate data
    detectContext: (estateData: any) => {
      // Check if user is executor
      if (estateData.userRole === 'executor') {
        const daysSinceDeath = estateData.daysSinceDeathDate || 0;

        if (daysSinceDeath <= 30) {
          set({
            type: 'executor_recent',
            since: estateData.deathDate,
            relationship: estateData.relationshipToDeceased
          });
        } else {
          set({ type: 'executor_active' });
        }
      }
      // Check for terminal diagnosis flag
      else if (estateData.hasTerminalDiagnosis) {
        set({ type: 'owner_terminal' });
      }
      // Check if family member mode
      else if (estateData.planningFor === 'parent' || estateData.planningFor === 'other') {
        set({ type: 'family_member' });
      }
      // Default: healthy owner planning
      else {
        set({ type: 'owner_planning' });
      }
    }
  };
}

export const userContext = createUserContextStore();

// Derived store for messaging
export const contextMessages = derived(userContext, $context => {
  switch ($context.type) {
    case 'executor_recent':
      return {
        dashboardGreeting: `We know you're grieving the loss of ${$context.relationship || 'your loved one'}. These tasks are necessary, but take breaks when you need to.`,
        showGriefBanner: true,
        tone: 'compassionate_urgent',
        suggestBreaks: true,
        griefResourcesLink: true
      };

    case 'executor_active':
      return {
        dashboardGreeting: "Managing an estate is complex work. We're here to guide you through it.",
        showGriefBanner: false,
        tone: 'practical_supportive',
        suggestBreaks: false,
        griefResourcesLink: true
      };

    case 'owner_terminal':
      return {
        dashboardGreeting: "What you're doing - planning for your family's future - is an act of profound love.",
        showGriefBanner: false,
        tone: 'gentle_compassionate',
        suggestBreaks: true,
        griefResourcesLink: true
      };

    case 'owner_planning':
      return {
        dashboardGreeting: "You're doing something important for the people you love.",
        showGriefBanner: false,
        tone: 'supportive_thoughtful',
        suggestBreaks: false,
        griefResourcesLink: false
      };

    case 'family_member':
      return {
        dashboardGreeting: "Helping a loved one plan their estate shows deep care.",
        showGriefBanner: false,
        tone: 'supportive_guiding',
        suggestBreaks: false,
        griefResourcesLink: false
      };

    default:
      return {
        dashboardGreeting: "Welcome to Continuum.",
        showGriefBanner: false,
        tone: 'neutral',
        suggestBreaks: false,
        griefResourcesLink: false
      };
  }
});
```

### 2. Create Context Banner Component

```svelte
<!-- /frontend/src/lib/components/ContextBanner.svelte -->
<script lang="ts">
  import { userContext, contextMessages } from '$lib/stores/userContext';
  import { Heart, ExternalLink } from 'lucide-svelte';

  $: messages = $contextMessages;
</script>

{#if messages.showGriefBanner}
  <div class="mt-6 mb-8 p-6 bg-amber-50 rounded-xl border-l-4 border-amber-400">
    <div class="flex items-start gap-3">
      <Heart size={20} class="text-amber-600 mt-1 flex-shrink-0" />
      <div>
        <h3 class="font-semibold text-gray-800 mb-2">You're Managing Loss</h3>
        <p class="text-gray-600 leading-relaxed mb-3">
          Managing an estate while grieving is incredibly difficult. These tasks
          are necessary, but you're also allowed to take breaks, ask for help,
          and honor your grief process.
        </p>
        {#if messages.griefResourcesLink}
          <a
            href="/resources/grief-support"
            class="inline-flex items-center gap-2 text-amber-700 underline text-sm font-medium hover:text-amber-800"
          >
            Grief support resources
            <ExternalLink size={14} />
          </a>
        {/if}
      </div>
    </div>
  </div>
{/if}
```

### 3. Modify Dashboard to Use Context

```svelte
<!-- /frontend/src/routes/dashboard/+page.svelte -->
<script lang="ts">
  import { onMount } from 'svelte';
  import { estateStore } from '$lib/stores/estateStore';
  import { userContext, contextMessages } from '$lib/stores/userContext';
  import ContextBanner from '$lib/components/ContextBanner.svelte';

  onMount(() => {
    // Detect user context from estate data
    userContext.detectContext($estateStore);
  });

  $: greeting = $contextMessages.dashboardGreeting;
</script>

<div class="dashboard">
  <h1>Good {timeOfDay}, {userName}</h1>

  <p class="context-greeting text-lg text-gray-600 mt-2">
    {greeting}
  </p>

  <ContextBanner />

  <!-- Rest of dashboard -->
</div>
```

### 4. Pass Context to AI Concierge

```typescript
// In /frontend/src/lib/services/aiConciergeService.ts

import { get } from 'svelte/store';
import { userContext } from '$lib/stores/userContext';

export async function chat(content: string, history: any[], context: any) {
  const currentContext = get(userContext);

  // Add context instruction to system prompt
  const contextInstruction = getContextInstruction(currentContext.type);

  const messages = [
    {
      role: 'system',
      content: systemPrompt + '\n\n' + contextInstruction
    },
    ...history,
    { role: 'user', content }
  ];

  // ... rest of function
}

function getContextInstruction(contextType: string): string {
  switch (contextType) {
    case 'executor_recent':
      return `CRITICAL CONTEXT: The user is actively grieving a recent loss (within 30 days).
      They are managing an estate while in acute grief. Be extremely compassionate,
      acknowledge their loss, offer breaks frequently, and provide grief support resources.`;

    case 'owner_terminal':
      return `CRITICAL CONTEXT: The user has a terminal diagnosis and is planning their
      estate. Show profound compassion, frame everything as an act of love for family,
      and honor the courage this takes.`;

    case 'owner_planning':
      return `CONTEXT: The user is proactively planning their estate while healthy.
      Be supportive and thoughtful, but no need for acute grief language.`;

    case 'executor_active':
      return `CONTEXT: The user is managing an estate (not recent loss). Be practical
      but supportive, offer resources when appropriate.`;

    case 'family_member':
      return `CONTEXT: The user is helping a family member (likely aging parent) with
      estate planning. Acknowledge difficulty of these conversations, provide guidance
      on approaching sensitive topics.`;

    default:
      return '';
  }
}
```

---

## TESTING

### Test Scenarios

1. **Recent Executor (< 30 days since death)**
   - Set `userRole: 'executor'`, `daysSinceDeathDate: 15`
   - Should show grief banner
   - Dashboard greeting should acknowledge loss
   - AI should be extra compassionate

2. **Terminal Diagnosis**
   - Set `hasTerminalDiagnosis: true`
   - Should NOT show grief banner (different context)
   - Greeting should be gentle and frame as act of love
   - AI should honor courage

3. **Healthy Owner**
   - Default estate data
   - No grief banner
   - Standard supportive messaging
   - AI should be thoughtful but not overly emotional

---

## SUCCESS CRITERIA

- [ ] Context detection works for all 5 user types
- [ ] Grief banner appears ONLY for recent executors
- [ ] Dashboard greeting changes based on context
- [ ] AI system prompt receives context instruction
- [ ] Module introductions can access context (optional enhancement)
- [ ] No context leakage (executor messaging doesn't show for owners)

---

## COMMIT MESSAGE

```
feat(context): add user context detection for personalized emotional support

Implement context-aware messaging to differentiate between healthy owners,
terminal diagnosis, active grieving executors, and family members.

New files:
- userContext.ts: Context detection and management store
- ContextBanner.svelte: Grief support banner for executors
- contextDetection.ts: Detection logic utilities

Changes:
- Dashboard now detects and displays context-appropriate greetings
- Grief banner shows for executors within 30 days of loss
- AI concierge receives context instructions for tone adjustment
- Different messaging for 5 user context types

Impact:
- Executor managing recent loss sees grief acknowledgment and resources
- Terminal diagnosis owner gets gentle, loving framing
- Healthy owner gets standard supportive messaging
- Each context receives emotionally appropriate support

Ref: EMOTIONAL_TONE_AUDIT.md, CONTEXT_AWARE_MESSAGING_AGENT.md
```

---

**End of Context-Aware Messaging Agent Specification**
