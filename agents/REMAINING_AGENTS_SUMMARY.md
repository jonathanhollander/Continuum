# Remaining Agent Specifications Summary
**Priority:** P1-P2
**Total Time:** 6-8 days

---

## 4. EMPTY STATE COMPASSION AGENT
**Priority:** P1 - HIGH
**Time:** 1 day
**Files:** All 11 module pages

### Objective
Rewrite empty states to include emotional context explaining WHY users should add data.

### Current Problem
```svelte
{#if items.length === 0}
  <div>No items yet</div>
  <button>Add Item</button>
{/if}
```

### Should Be
```svelte
{#if items.length === 0}
  <div class="empty-state-compassionate">
    <h3>Why This Matters</h3>
    <p>[Emotional explanation connecting to love/values/protection]</p>

    <h4>What to Add First</h4>
    <p>[Specific guidance on first item]</p>

    <button>Add First [Item Type]</button>
  </div>
{/if}
```

### Key Changes
- Insurance empty: "Without documented policies, family may lose $500K+ in benefits"
- Medical empty: "Directives ensure your voice is heard at end of life"
- Contacts empty: "These people need to know if something happens to you"

---

## 5. FORM MODAL EMPATHY AGENT
**Priority:** P1 - HIGH
**Time:** 2 days
**Files:** 8+ modal forms across modules

### Objective
Add compassionate introductions and field-level guidance to all modal forms.

### Current Problem
```svelte
<Modal>
  <h2>Add Policy</h2>
  <input placeholder="Policy Name" />
  <input placeholder="Carrier" />
  <button>Save</button>
</Modal>
```

### Should Be
```svelte
<Modal>
  <h2>Add Policy</h2>
  <p class="modal-intro">
    Your executor needs this information to file claims after you pass.
    Without it, your family may lose thousands in unclaimed benefits.
  </p>

  <label>
    Policy Name
    <Tooltip>The name on your policy documents (e.g., 'Term Life')</Tooltip>
  </label>
  <input placeholder="e.g., Term Life Insurance" />

  <label>
    Claims Procedure
    <Tooltip>Where to call & what documents are needed</Tooltip>
  </label>
  <textarea placeholder="Call 1-800-555-1234, provide death certificate & policy #ABC123" />

  <button>Save Policy</button>
</Modal>
```

### Forms to Update
- Insurance policy modal
- Heirloom modal
- Contact modal
- Medical directive modal
- Property modal
- Financial account modal
- Letter modal
- Pet care modal

---

## 6. BREAK & PACING AGENT
**Priority:** P1 - HIGH
**Time:** 1 day
**Files:** New components + dashboard

### Objective
Detect long sessions (30+ min) and suggest breaks. Add "no rush" messaging.

### Components to Create

**BreakReminder.svelte:**
```svelte
<script>
  import { onMount } from 'svelte';
  let sessionTime = 0;
  let showBreakSuggestion = false;

  onMount(() => {
    const interval = setInterval(() => {
      sessionTime += 1;
      if (sessionTime === 30) {
        showBreakSuggestion = true;
      }
    }, 60000); // Every minute

    return () => clearInterval(interval);
  });
</script>

{#if showBreakSuggestion}
  <div class="break-suggestion">
    <p>You've been working on this for 30 minutes. This emotional work is draining.</p>
    <button>Take a Break</button>
    <button on:click={() => showBreakSuggestion = false}>Keep Going</button>
  </div>
{/if}
```

**NoRushBanner.svelte:**
```svelte
<div class="no-rush-banner">
  <p>💭 You don't have to complete everything today. This will still be here.</p>
</div>
```

### Integration Points
- Add to dashboard
- Add to heavy modules (medical, funeral, letters)
- Show after 30 minutes of activity
- Dismiss able but reappears after another 30 min

---

## 7. GRIEF SUPPORT INFRASTRUCTURE AGENT
**Priority:** P2 - MEDIUM
**Time:** 2 days
**Files:** New pages + resources

### Objective
Create grief support resources pages and link throughout app.

### Pages to Create

**1. `/frontend/src/routes/resources/grief-support/+page.svelte`**

```svelte
<h1>Grief Support Resources</h1>

<section>
  <h2>Immediate Crisis Support</h2>
  <ul>
    <li>National Suicide Prevention Lifeline: 988</li>
    <li>Crisis Text Line: Text HOME to 741741</li>
  </ul>
</section>

<section>
  <h2>Grief Counseling Services</h2>
  <ul>
    <li><a href="https://betterhelp.com">BetterHelp</a> - Online therapy</li>
    <li><a href="https://talkspace.com">Talkspace</a> - Text-based counseling</li>
    <li>Local grief support groups: [Search tool]</li>
  </ul>
</section>

<section>
  <h2>Understanding Grief</h2>
  <p>Articles about the grief process, what to expect, etc.</p>
</section>
```

**2. `/frontend/src/routes/resources/talking-to-family/+page.svelte`**

Conversation starters for:
- Talking to aging parents about estate planning
- Discussing end-of-life wishes
- Approaching executor role with family
- Talking to children about death

**3. `/frontend/src/routes/resources/terminal-diagnosis/+page.svelte`**

Resources for:
- Coping with diagnosis
- Palliative care information
- Legacy planning support
- Family communication

### Link Locations
- Executor toolkit grief banner
- Medical directives page
- AI concierge suggestions
- Dashboard for executor context

---

## 8. TONE DOCUMENTATION AGENT
**Priority:** P2 - MEDIUM
**Time:** 1 day
**Files:** New documentation

### Objective
Create comprehensive tone guide for future development.

### Document to Create

**`/docs/TONE_GUIDE.md`:**

```markdown
# Continuum Tone & Voice Guide

## Core Principle
Empathy first. Data second. Every word acknowledges the emotional weight
of death planning.

## Voice Attributes
- Compassionate, not clinical
- Supportive, not pushy
- Patient, not rushed
- Meaningful, not transactional

## Writing Guidelines

### DO
- Acknowledge emotional difficulty
- Connect to love, values, protection
- Validate uncertainty ("It's okay to be unsure")
- Offer breaks and resources
- Celebrate meaning, not just completion

### DON'T
- Rush users ("Let's finish this!")
- Use efficiency language ("Complete your profile")
- Skip context for data requests
- Treat grief as inconvenience
- Use jargon without definitions

## Module-Specific Tone

### Funeral Planning
**Tone:** Reverent, gentle, patient
**Language:** "Honoring your life", "These choices reflect who you are"
**Avoid:** Clinical terms like "body disposition", "remains processing"

### Medical Directives
**Tone:** Compassionate, validating, unhurried
**Language:** "Your voice at end of life", "Deeply personal decisions"
**Avoid:** "Safety net", "emergency instructions", rushing

### Legacy Letters
**Tone:** Warm, meaningful, encouraging vulnerability
**Language:** "Preserving your voice", "Words that will comfort"
**Avoid:** Formal business letter tone

## User Context Variations

### Owner (Healthy)
"You're doing something important for the people you love."

### Owner (Terminal Diagnosis)
"This is an act of profound love. You're taking care of your people."

### Executor (Grieving)
"You're managing this while grieving. That's incredibly difficult.
Take breaks when you need to."

## Copy Templates

### Empty States
```
WHY THIS MATTERS:
[Emotional explanation - connect to love/values/protection]

WHAT TO ADD FIRST:
[Specific guidance]

[Action Button]
```

### Success Messages
```
✓ [What was completed]

WHAT THIS MEANS:
[Connect to values, explain impact]

NEXT STEP:
[Gentle suggestion] OR [Offer break]
```

### Error Messages
```
We couldn't save that right now.

[Explanation of what happened]

[What user should do] OR [Contact support]
```

## Testing Copy

Ask these questions:
1. Does this acknowledge emotional weight?
2. Does this connect to love/values?
3. Does this rush the user?
4. Does this validate difficulty?
5. Does this offer support?

If NO to questions 1, 2, 4, 5 or YES to question 3 → Rewrite.
```

---

## EXECUTION ORDER RECOMMENDATION

### Week 1: Foundation (P0 Critical)
1. AI Empathy Agent (1 day)
2. Module Header Rewrite Agent (2 days)
3. Context-Aware Messaging Agent (2 days)

### Week 2: Enhancement (P1 High)
4. Empty State Compassion Agent (1 day)
5. Form Modal Empathy Agent (2 days)
6. Break & Pacing Agent (1 day)

### Week 3: Support (P2 Medium)
7. Grief Support Infrastructure Agent (2 days)
8. Tone Documentation Agent (1 day)

---

## TOTAL IMPACT

After all agents complete:

**Before:**
- Cold, efficiency-focused AI
- Administrative module headers
- No context awareness
- Empty "no items" states
- Forms without context
- No break suggestions
- No grief resources
- No tone documentation

**After:**
- Compassionate, empathetic AI
- Emotionally intelligent headers
- Context-aware messaging (owner/executor)
- Empty states explain WHY
- Forms with compassionate introductions
- Break reminders for long sessions
- Comprehensive grief support pages
- Complete tone guide for future work

**User Experience Transformation:**
From "This app treats death like filing taxes"
To "This app supports me through life's hardest work"

---

**End of Remaining Agents Summary**
