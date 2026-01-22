# Context-Aware Messaging System

## Overview

The context-aware messaging system adapts language throughout the Continuum application based on the user's role and emotional context. This ensures that the interface speaks appropriately to different users in different situations.

## User Roles

The system supports four user roles:

### 1. Planning (Default)
- **Who**: The estate owner actively planning their legacy
- **Perspective**: First person ("your estate", "your wishes")
- **Tone**: Empowering, supportive, encouraging
- **Example**: "Start building your trusted circle. Add the people who matter most."

### 2. Executor
- **Who**: Someone managing the estate after death
- **Perspective**: Third person ("their estate", "their wishes")
- **Tone**: Grief-aware, patient, supportive, practical
- **Example**: "No contacts have been recorded yet. You may need to gather this information from other sources."

### 3. Family
- **Who**: Family members viewing estate information
- **Perspective**: Neutral third person ("the estate", "family contacts")
- **Tone**: Gentle, inclusive, informative
- **Example**: "Contact information hasn't been added yet. This will be helpful when it's available."

### 4. Advisor
- **Who**: Professional advisor (lawyer, accountant, etc.)
- **Perspective**: Professional third person
- **Tone**: Formal, efficient, respectful

## Emotional Context

In addition to role, the system tracks emotional context:

- **healthy**: Default state
- **terminal**: User with terminal diagnosis
- **grieving**: User experiencing grief (typically executor/family after death)

Grief-aware language is automatically applied to executor and family roles when appropriate.

## Implementation

### Backend

The backend User model includes:
```python
user_role: Optional[str] = Field(default="planning")  # planning | executor | family | advisor
emotional_context: Optional[str] = Field(default=None)  # healthy | terminal | grieving
```

The `/api/auth/me` endpoint returns these fields so the frontend can adapt.

### Frontend

#### Core Files

1. **`/frontend/src/lib/stores/contextStore.svelte.ts`**
   - Reactive store managing current user role and emotional context
   - Syncs with auth store on login
   - Provides helper properties: `isExecutor`, `isFamily`, `isPlanning`, `isGrieving`

2. **`/frontend/src/lib/utils/contextualMessages.ts`**
   - Message variant utilities
   - Helper functions for possessives, subjects, objects
   - Pre-built message sets for common UI patterns

3. **`/frontend/src/lib/components/ContextualMessage.svelte`**
   - Component for inline contextual messaging
   - Automatically selects appropriate variant

4. **`/frontend/src/lib/components/RoleSwitcher.svelte`**
   - Development/demo component for switching roles
   - Shows in header for testing
   - In production, this would be in Settings

### Usage Examples

#### Using the ContextualMessage component

```svelte
<ContextualMessage
    variants={{
        planning: 'Your trusted contacts',
        executor: 'Their emergency contacts',
        family: 'Family contact list'
    }}
/>
```

#### Using helper functions

```svelte
<script>
    import { possessive, contacts, wishes } from '$lib/utils/contextualMessages';
</script>

<h2>Manage {possessive()} {contacts()}</h2>
<p>Record {wishes()} for final arrangements.</p>
```

#### Getting contextual messages

```svelte
<script>
    import { getEmptyStateMessage, getActionLabel } from '$lib/utils/contextualMessages';
</script>

<EmptyState
    message={getEmptyStateMessage('contacts')}
    ctaLabel={getActionLabel('add')}
/>
```

#### Checking role directly

```svelte
<script>
    import { contextStore } from '$lib/stores/contextStore.svelte';
</script>

{#if contextStore.isExecutor}
    <p class="text-amber-600">You are viewing this estate as an executor.</p>
{/if}
```

## Language Patterns

### Possessive Pronouns

| Role | Output |
|------|--------|
| Planning | "your" |
| Executor | "their" or "[name]'s" |
| Family | "the" |

### Subject Pronouns

| Role | Output |
|------|--------|
| Planning | "you" |
| Executor | "they" or "[name]" |
| Family | "the family" |

### Common Phrases

#### Estate Reference
- Planning: "your estate"
- Executor: "their estate" or "[name]'s estate"
- Family: "the estate"

#### Wishes Reference
- Planning: "your wishes"
- Executor: "their wishes" or "[name]'s wishes"
- Family: "the recorded wishes"

#### Contacts Reference
- Planning: "your contacts"
- Executor: "their contacts" or "[name]'s contacts"
- Family: "family contacts"

## Empty States

Empty state messages are context-aware and adapt based on role:

```typescript
getEmptyStateMessage('contacts')

// Planning:
"Start building your trusted circle. Add the people who matter most."

// Executor:
"No contacts have been recorded yet. You may need to gather this information from other sources."

// Family:
"Contact information hasn't been added yet. This will be helpful when it's available."
```

## Action Labels

Button labels adapt to be more appropriate:

```typescript
getActionLabel('add')

// Planning: "Add when ready"
// Executor: "Add information"
// Family: "Contribute"
// Grieving: "When you're ready"
```

## Grief-Aware Language

When `emotional_context === 'grieving'` and role is executor or family:

- Softer, more patient language
- "We're here to help" instead of "Welcome back"
- "Take your time" instead of task-oriented language
- No demanding or urgent tones
- Acknowledgment of difficulty

## Progress Messages

Progress feedback adapts based on role:

```typescript
getProgressMessage(45)

// Planning:
"You're well on your way. Your effort is creating real peace of mind."

// Executor:
"Significant progress has been made. Continue as needed."

// Family:
"Most essential information has been recorded."
```

## Components Updated

The following components have been updated to use context-aware messaging:

1. **Dashboard** (`/routes/dashboard/+page.svelte`)
   - Greeting message adapts to role
   - Focus card messages acknowledge executor/family context
   - System initialization messages

2. **Contacts Module** (`/routes/modules/contacts/+page.svelte`)
   - Header subtitle adapts
   - Empty state messages for each role
   - Action button labels

3. **Main Layout** (`/routes/+layout.svelte`)
   - Role switcher in header
   - Context initialization on auth

## Best Practices

### When to Use Context-Aware Messaging

✅ **DO use for:**
- User-facing content in main UI
- Empty states
- Action buttons
- Help text
- Progress messages
- Greetings and headers

❌ **DON'T use for:**
- Technical error messages (use compassionate but consistent language)
- System status messages
- Developer tools
- Internal labels

### Writing Good Variants

1. **Be specific to the role's perspective**
   - Planning: "You're making progress"
   - Executor: "Information is being gathered"
   - Family: "The profile is taking shape"

2. **Acknowledge the emotional context**
   - Executor mode assumes grief in many cases
   - Use patient, supportive language
   - Avoid demanding tones

3. **Maintain consistency within a role**
   - Use the same pronoun style throughout
   - Keep the tone consistent

4. **Provide all variants**
   - Always include planning, executor, family
   - Advisor is optional (defaults to executor)

## Testing

To test different roles:

1. Use the **Role Switcher** in the header (desktop view)
2. Or set role programmatically:
   ```typescript
   import { contextStore } from '$lib/stores/contextStore.svelte';
   contextStore.setRole('executor');
   ```

3. For grief-aware testing:
   ```typescript
   contextStore.setEmotionalContext('grieving');
   ```

## Future Enhancements

### Planned Features

1. **Deceased Name Personalization**
   - Store deceased person's name for executor/family modes
   - Use "[name]'s estate" instead of generic "their estate"

2. **Role-Based UI Hiding**
   - Hide planning-only features for executors
   - Show executor-specific tools

3. **Contextual Tutorials**
   - Different onboarding for executors vs planners
   - Grief-aware guidance for bereaved users

4. **Time-Based Adaptations**
   - Recent loss = extra gentle language
   - Months later = slightly more direct

5. **Settings Integration**
   - Move role switcher to Settings
   - Allow users to set deceased name
   - Configure emotional context preferences

## Database Schema

The User table includes these fields:

```sql
user_role TEXT DEFAULT 'planning'
emotional_context TEXT DEFAULT NULL
```

Default values ensure backward compatibility with existing users.

## API Contract

The `/api/auth/me` endpoint returns:

```json
{
  "id": 1,
  "email": "user@example.com",
  "external_id": "user-xyz",
  "user_role": "planning",
  "emotional_context": null
}
```

## Migration Path

For existing users:
1. All existing users default to `user_role='planning'`
2. Executor mode can be set in Settings (future feature)
3. Emotional context remains null unless explicitly set

---

**Last Updated**: January 22, 2026
**Status**: Initial implementation complete
**Components Using**: Dashboard, Contacts module
**Next Steps**: Expand to more modules, add deceased name personalization
