# Context-Aware Messaging Flow Diagram

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER LOGIN                              │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                  BACKEND: /api/auth/me                          │
│                                                                 │
│  Returns:                                                       │
│  {                                                              │
│    id: 1,                                                       │
│    email: "user@example.com",                                  │
│    user_role: "planning" | "executor" | "family" | "advisor", │
│    emotional_context: "healthy" | "terminal" | "grieving"      │
│  }                                                              │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│              FRONTEND: Auth Store (auth.ts)                     │
│                                                                 │
│  Stores user object with role and emotional context            │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│           FRONTEND: Context Store (contextStore.svelte.ts)      │
│                                                                 │
│  Syncs on init:                                                 │
│  - contextStore.role = user.user_role                          │
│  - contextStore.emotionalContext = user.emotional_context       │
│                                                                 │
│  Provides:                                                      │
│  - isExecutor, isFamily, isPlanning, isGrieving                │
│  - setRole(), setEmotionalContext(), setDeceasedName()         │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                    UI COMPONENTS                                │
│                                                                 │
│  Three ways to use contextual messaging:                        │
│                                                                 │
│  1. Helper Functions                                            │
│     import { possessive, contacts } from 'contextualMessages'   │
│     <h1>{possessive()} {contacts()}</h1>                       │
│     Result: "your contacts" / "their contacts" / "family..."   │
│                                                                 │
│  2. ContextualMessage Component                                 │
│     <ContextualMessage variants={{                             │
│       planning: "Your estate",                                 │
│       executor: "Their estate",                                │
│       family: "The estate"                                     │
│     }} />                                                       │
│                                                                 │
│  3. Pre-built Message Functions                                │
│     {getEmptyStateMessage('contacts')}                         │
│     {getActionLabel('add')}                                    │
│     {getProgressMessage(65)}                                   │
└─────────────────────────────────────────────────────────────────┘
```

## Message Selection Flow

```
User interacts with UI
        │
        ▼
Component renders with contextual message
        │
        ▼
Check contextStore.role
        │
        ├─ "planning" → Use planning variant
        ├─ "executor" → Use executor variant (grief-aware)
        ├─ "family" → Use family variant (gentle)
        └─ "advisor" → Use advisor variant (or fallback to executor)
        │
        ▼
Check contextStore.isGrieving
        │
        ├─ true → Apply extra gentle language
        └─ false → Use standard role language
        │
        ▼
Render final message to user
```

## Role Switching Flow

```
User clicks RoleSwitcher in header
        │
        ▼
Dropdown shows role options
        │
        ▼
User selects new role
        │
        ▼
contextStore.setRole(newRole)
        │
        ▼
All reactive components update automatically
(using Svelte 5 $derived reactivity)
        │
        ▼
UI language changes instantly
```

## Example: Dashboard Greeting

```
Page loads
        │
        ▼
Dashboard calls getGreeting()
        │
        ▼
contextStore.role?
        │
        ├─ "planning" + isGrieving=false
        │   → "Welcome back"
        │
        ├─ "planning" + isGrieving=true
        │   → "Welcome back"
        │
        ├─ "executor" + isGrieving=true
        │   → "We're here to help"
        │
        ├─ "executor" + isGrieving=false
        │   → "Executor Dashboard"
        │
        └─ "family" + isGrieving=true
            → "Take your time"
```

## Example: Contacts Empty State

```
Contacts page loads with 0 contacts
        │
        ▼
EmptyState component calls getEmptyStateMessage('contacts')
        │
        ▼
contextStore.role?
        │
        ├─ "planning"
        │   → "Start building your trusted circle.
        │      Add the people who matter most."
        │
        ├─ "executor"
        │   → "No contacts have been recorded yet.
        │      You may need to gather this information
        │      from other sources."
        │
        └─ "family"
            → "Contact information hasn't been added yet.
               This will be helpful when it's available."
```

## Data Flow Diagram

```
┌──────────────┐
│   Database   │
│              │
│  User Table  │
│  - user_role │
│  - emotional │
│    _context  │
└──────┬───────┘
       │
       │ SQL Query
       ▼
┌──────────────┐
│   Backend    │
│              │
│  FastAPI     │
│  /auth/me    │
└──────┬───────┘
       │
       │ HTTP Response (JSON)
       ▼
┌──────────────┐
│   Frontend   │
│              │
│  auth.ts     │
│  (user obj)  │
└──────┬───────┘
       │
       │ Sync on init
       ▼
┌──────────────┐
│  Frontend    │
│              │
│ contextStore │
│  (reactive)  │
└──────┬───────┘
       │
       │ Reactive updates
       ▼
┌──────────────┐
│ Components   │
│              │
│ Dashboard    │
│ Contacts     │
│ Documents    │
│ Medical      │
│ etc...       │
└──────────────┘
```

## Language Mapping Table

| Role | Context | Possessive | Subject | Object | Estate | Wishes | Contacts |
|------|---------|------------|---------|--------|--------|--------|----------|
| **planning** | healthy | your | you | you | your estate | your wishes | your contacts |
| **planning** | terminal | your | you | you | your estate | your wishes | your contacts |
| **executor** | healthy | their | they | them | their estate | their wishes | their contacts |
| **executor** | grieving | their | they | them | their estate | their wishes | their contacts |
| **family** | healthy | the | the family | them | the estate | the recorded wishes | family contacts |
| **family** | grieving | the | the family | them | the estate | the recorded wishes | family contacts |
| **advisor** | * | their | they | them | their estate | their wishes | their contacts |

*Note: If deceased name is set (e.g., "Sarah"), executor and advisor use "[name]'s" instead of "their"*

## Component Integration Points

```
┌─────────────────────────────────────────────────────────────┐
│                    Application Layout                       │
│  - RoleSwitcher in header                                   │
│  - Context initialization on mount                          │
└────────────────────────┬────────────────────────────────────┘
                         │
        ┌────────────────┼────────────────┐
        │                │                │
        ▼                ▼                ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│  Dashboard   │  │  Contacts    │  │ Future Modules│
│              │  │              │  │              │
│ - Greeting   │  │ - Header     │  │ - Medical    │
│ - Focus Card │  │ - Empty State│  │ - Documents  │
│ - Progress   │  │ - Actions    │  │ - Financial  │
└──────────────┘  └──────────────┘  └──────────────┘
```

## Future Enhancement: Deceased Name Flow

```
Settings Page
        │
        ▼
User enters deceased name: "Sarah Thompson"
        │
        ▼
contextStore.setDeceasedName("Sarah Thompson")
        │
        ▼
All references update:
- "their estate" → "Sarah Thompson's estate"
- "their wishes" → "Sarah's wishes"
- "they" → "Sarah"
```

---

**Visual Key**:
- `│` = Flow direction
- `▼` = Next step
- `├─` = Conditional branch
- `└─` = Final branch option
- `┌─┐` = Component/System boundary
