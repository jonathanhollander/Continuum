# Agent 22: Overwhelming Moment Detection
**Priority:** P2 - MEDIUM
**Estimated Time:** 2 days
**Dependencies:** 17-context-aware-messaging
**Category:** Emotional Tone

---

## OBJECTIVE

Detect when users may be overwhelmed and proactively offer support, breaks, or simplified pathways.

**Current Issues:**
- No detection of user struggle
- Can't identify overwhelming moments
- No proactive support offers
- Users abandon when overwhelmed
- No intervention when stuck

**Expected Outcome:**
- Detects signs of overwhelm
- Offers gentle support
- Suggests breaks
- Provides simplified alternatives
- Helps users when stuck

---

## IMPLEMENTATION

### Overwhelm Detection Signals:

```typescript
interface OverwhelmSignals {
  rapidBackNavigation: boolean;  // Going back multiple times
  longPauseOnPage: boolean;      // 5+ minutes no activity
  multipleEmptySubmits: boolean;  // Clicking save without data
  rapidModuleSwitching: boolean;  // Jumping between sections
  deletingRecentWork: boolean;    // Deleting just-added items
}

function detectOverwhelm(signals: OverwhelmSignals): boolean {
  const overwhelmScore =
    (signals.rapidBackNavigation ? 2 : 0) +
    (signals.longPauseOnPage ? 1 : 0) +
    (signals.multipleEmptySubmits ? 2 : 0) +
    (signals.rapidModuleSwitching ? 1 : 0) +
    (signals.deletingRecentWork ? 3 : 0);

  return overwhelmScore >= 3;
}
```

### Support Intervention Component:

```svelte
<script lang="ts">
  export let onTakeBreak: () => void;
  export let onSimplifyPath: () => void;
  export let onGetHelp: () => void;
</script>

<div class="overwhelm-support">
  <div class="support-header">
    <svg class="heart-icon" viewBox="0 0 24 24">
      <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
    </svg>
    <h3>We're here with you</h3>
  </div>

  <p>
    It seems like this might be feeling overwhelming right now.
    That's completely normal - this is big, emotional work.
  </p>

  <p>What would help most right now?</p>

  <div class="support-options">
    <button on:click={onTakeBreak}>
      <span>Take a break</span>
      <small>Come back when you're ready</small>
    </button>

    <button on:click={onSimplifyPath}>
      <span>Show me just the essentials</span>
      <small>Focus on what's most important</small>
    </button>

    <button on:click={onGetHelp}>
      <span>Talk to someone</span>
      <small>Connect with a specialist</small>
    </button>
  </div>

  <p class="reassurance">
    There's no rush, no judgment, and no wrong choice.
    This work will be here whenever you're ready.
  </p>
</div>
```

---

## SUCCESS CRITERIA

- [ ] Overwhelm detection implemented
- [ ] Support intervention component
- [ ] Break suggestions
- [ ] Simplified pathway options
- [ ] Help resources

---

## COMMIT MESSAGE

```
feat(empathy): detect overwhelming moments and offer proactive support

Identify when users struggle and provide gentle intervention.

Implementation:
- Overwhelm detection signals
- Support intervention component
- Break suggestions
- Simplified pathway options
- Help resources

Detection:
- Rapid back navigation
- Long pauses
- Empty submits
- Module switching
- Deleting recent work

Support Options:
- Take a break
- Simplify to essentials
- Talk to someone

Impact:
- Users feel supported when struggling
- Reduces abandonment
- Proactive care
- Appropriate for emotional context

Closes: Overwhelm detection and support
```

---

**READY TO EXECUTE**
