# Agent 20: Grief-Aware Executor Mode
**Priority:** P0 - CRITICAL
**Estimated Time:** 1 day
**Dependencies:** 17-context-aware-messaging
**Category:** Emotional Tone

---

## OBJECTIVE

Create specialized "Executor Mode" with grief-aware language, simplified workflows, and bereavement support for users handling a loved one's estate.

**Current Issues:**
- No differentiation for grieving users
- Same language for planning vs executing
- No bereavement support
- Overwhelming task lists for grievers
- No acknowledgment of grief

**Expected Outcome:**
- Dedicated executor mode
- Grief-aware language throughout
- Simplified task prioritization
- Bereavement resources
- Patient, gentle guidance

---

## IMPLEMENTATION

### Executor Mode Welcome:

```svelte
<div class="executor-welcome">
  <h1>We're here to support you</h1>

  <p>
    Handling a loved one's estate while grieving is incredibly difficult.
    We want you to know: there's no rush, there's no wrong way to do this,
    and it's okay if things take time.
  </p>

  <div class="grief-acknowledgment">
    <p>
      You're likely dealing with grief, administrative tasks, family dynamics,
      and countless decisions - all at once. Please be gentle with yourself.
    </p>
  </div>

  <div class="executor-priorities">
    <h3>What needs attention first</h3>
    <ul>
      <li>✓ Time-sensitive notifications (already handled)</li>
      <li>→ Legal and financial matters (when you're ready)</li>
      <li>Later: Personal items and final wishes</li>
    </ul>
  </div>

  <p class="reassurance">
    Most things can wait. Focus on what's truly urgent, and give yourself
    permission to handle the rest in your own time.
  </p>
</div>
```

### Grief-Aware Task Language:

```typescript
const executorTasks = {
  urgent: {
    title: "Time-sensitive (first few days)",
    tone: "These need attention soon, but even 'urgent' tasks can usually wait a day or two. Take care of yourself first.",
    tasks: [
      "Notify immediate family and close friends",
      "Contact funeral home or memorial service",
      "Locate will and important documents"
    ]
  },

  important: {
    title: "Important (first few weeks)",
    tone: "These matter, but there's time. Don't rush yourself.",
    tasks: [
      "Notify banks and financial institutions",
      "Contact life insurance companies",
      "Begin probate process if needed"
    ]
  },

  eventual: {
    title: "Eventually (when you're ready)",
    tone: "These can wait. Grief doesn't run on a schedule.",
    tasks: [
      "Sort through personal belongings",
      "Handle digital accounts",
      "Distribute sentimental items"
    ]
  }
};
```

---

## SUCCESS CRITERIA

- [ ] Executor mode UI created
- [ ] Grief-aware welcome message
- [ ] Prioritized task lists
- [ ] Bereavement acknowledgment
- [ ] Patient, gentle language
- [ ] No rushing or pressure

---

## COMMIT MESSAGE

```
feat(empathy): create grief-aware executor mode for bereaved users

Add specialized mode for users handling a loved one's estate while grieving.

Implementation:
- Dedicated executor mode welcome
- Grief acknowledgment throughout
- Prioritized task lists (urgent/important/eventual)
- Patient, gentle guidance
- No rushing language
- Bereavement support

Language:
- "There's no rush, no wrong way"
- "Please be gentle with yourself"
- "Grief doesn't run on a schedule"
- "Take care of yourself first"

Impact:
- Bereaved users feel supported, not overwhelmed
- Appropriate emotional tone for grief
- Clear priorities without pressure
- Acknowledges difficulty of dual burden

Closes: Executor mode with grief awareness
Ref: EMOTIONAL_TONE_AUDIT.md critical need
```

---

**READY TO EXECUTE**
