# Continuum Tone Guide

> A compassionate language framework for end-of-life planning software

---

## Core Philosophy

Continuum helps people navigate one of life's most emotionally charged tasks: preparing for death. Every word we use must honor the courage it takes to engage with mortality, whether someone is planning their own legacy or managing a loved one's estate.

**Our voice is:**
- Patient, never urgent
- Inviting, never demanding
- Supportive, never clinical
- Present, never dismissive

---

## The Three Principles

### 1. Invitation Over Instruction

Users are doing profound emotional work. We invite participation rather than command action.

| Avoid | Use Instead |
|-------|-------------|
| Submit | Save my thoughts |
| Delete | Remove this item |
| Complete your profile | Continue when you're ready |
| You must... | When you're ready... |
| Required field | This helps us... |

### 2. Acknowledgment Over Efficiency

We acknowledge the emotional weight of each task. Speed and efficiency language feels cold in this context.

| Avoid | Use Instead |
|-------|-------------|
| Quick setup | Take your time |
| In just 5 minutes | At your own pace |
| Easy steps | Gentle guidance |
| Get started | Begin when ready |
| Done! | Saved with care |

### 3. Presence Over Positivity

We sit with users in difficult moments rather than rushing them toward false positivity.

| Avoid | Use Instead |
|-------|-------------|
| Don't worry! | We're here with you |
| It's easy! | We'll guide you through |
| No problem! | That's completely understandable |
| Great job! | You're making progress |
| Exciting! | This matters |

---

## Language Patterns

### Buttons & Actions

**Primary Actions:**
```
Save my thoughts
Continue when ready
Done for now
Keep this safe
```

**Secondary Actions:**
```
Maybe later
Take a break
Come back anytime
Not right now
```

**Destructive Actions:**
```
Remove this item
Let this go
Clear my entry
Start fresh
```

### Empty States

Empty states should feel like an invitation, not a void.

**Pattern:**
```
[Gentle acknowledgment]
[Value proposition]
[Soft call to action]
```

**Example:**
```
Nothing here yet—and that's okay.
When you're ready, this is where [feature description].
[Soft action button]
```

**Real examples from codebase:**
```
"We haven't found support in that area yet.
You might try a nearby city, or reach out to us for help finding resources."

"No entries yet. When you're ready, this journal is a private space
for the thoughts that matter most."
```

### Error Messages

Errors should feel supportive, not alarming.

**Pattern:**
```
[Acknowledgment of the issue]
[Reassurance]
[Path forward]
```

**Examples:**
```
"We couldn't save that just now. Your words are still here—
let's try again in a moment."

"I'm still here with you. My words aren't flowing as smoothly right now,
but you're not alone. Take a gentle breath, and know that the resources
in the sidebar are always available."

"We couldn't find that contact. It may have been moved or deleted.
Would you like to add a new one?"
```

### Loading States

Loading should feel like presence, not waiting.

```
Taking a moment...
Gathering your thoughts...
Preparing your space...
Almost there...
```

### Success Messages

Success should feel affirming without being over-the-top.

```
Saved with care
Kept safe
Your thoughts are preserved
This is now part of your legacy
```

### Form Labels & Placeholders

Labels should explain why, not just what.

**Pattern:**
```
Label: [What it is]
Helper: [Why it matters]
Placeholder: [Gentle example or invitation]
```

**Examples:**
```
Label: "Their name"
Helper: "How you knew them best"
Placeholder: "The name that feels right..."

Label: "A message for them"
Helper: "Words you want them to carry"
Placeholder: "Share what's on your heart..."
```

### Navigation & Wayfinding

```
Find your way → Explore
Go back → Return
Next step → Continue
Skip → Maybe later
Home → Your sanctuary
```

---

## Context-Specific Guidelines

### For Executors (Managing Someone's Estate)

Executors are often grieving while handling administrative burdens. Language must acknowledge this dual weight.

**Acknowledge the burden:**
```
"Managing an estate while grieving is profound work."
"You're carrying a lot right now."
"This can wait if you need it to."
```

**Offer permission to delegate:**
```
"You don't have to do this alone."
"Consider asking someone to help with these calls."
"It's okay to take this one task at a time."
```

**Avoid:**
- Urgent deadlines without context
- "Complete by" language
- Task-completion celebrations

### For Planners (Preparing Their Own Legacy)

Planners are confronting their own mortality. Language must honor this courage.

**Acknowledge the courage:**
```
"It takes courage to prepare for those you love."
"This is a gift to your family."
"You're doing something meaningful."
```

**Validate difficulty:**
```
"These questions aren't easy to answer."
"Take all the time you need."
"It's okay to come back to this."
```

**Avoid:**
- Death euphemisms that feel evasive
- Overly clinical terminology
- Rushing or urgency

### For Family Members

Family members may be processing complex emotions about a loved one's planning.

**Create space for complexity:**
```
"Family dynamics can be complicated."
"It's normal to have mixed feelings."
"Everyone grieves differently."
```

---

## Copy Templates

### New Feature Introduction

```markdown
## [Feature Name]

[One sentence: What it is]

[One sentence: Why it matters emotionally]

When you're ready, [gentle description of what they can do here].

[Soft CTA button: "Explore" or "Begin when ready"]
```

### Checklist/Task List Header

```markdown
When you're ready, these small steps may help.
There's no rush—move at your own pace.
```

### Module Empty State

```markdown
[Warm acknowledgment that nothing is here yet]

[Explanation of what this space is for and why it matters]

[Invitation to begin when ready]
```

### Confirmation Dialog (Destructive)

```markdown
## Are you sure?

[Acknowledge what they're about to do]
[Note any consequences gently]
[Offer reassurance if applicable]

[Cancel: "Keep it" / "Not yet"]
[Confirm: "Yes, remove this" / "Let it go"]
```

### Onboarding Welcome

```markdown
## Welcome to Continuum

This is your private space for the things that matter most.

There's no right way to do this, and no timeline to follow.
We're simply here when you're ready.

[CTA: "Take a look around"]
```

---

## Words to Avoid

| Word/Phrase | Why | Alternative |
|-------------|-----|-------------|
| Submit | Demanding | Save, Keep |
| Execute | Violent connotation | Complete, Finish |
| Kill, Terminate | Obviously | End, Stop, Remove |
| Deadline | Stress-inducing | Timeline, By (date) |
| ASAP, Urgent | Creates anxiety | When you can, Soon |
| Simple, Easy | Dismissive of difficulty | Guided, Supported |
| Just | Minimizing | (remove entirely) |
| Obviously | Condescending | (remove entirely) |
| Must, Required | Demanding | Helps us, Needed for |
| Failed | Harsh | Couldn't, Wasn't able to |
| Error | Clinical | Issue, Hiccup |
| Invalid | Cold | Doesn't look right |
| Immediately | Urgent | Right now, First |

---

## Voice Examples from Codebase

### Grief Support Sanctuary

**AI Companion System Prompt:**
```
"Provide a 'Sanctuary of Words': Every response should feel like a deep breath.
Use poetic, gentle, and non-judgmental language."

"Validate the 'Vastness of Loss': Never try to 'fix' grief. Instead, sit with it.
Use phrases like 'It makes sense that it feels this heavy' or 'Grief has no schedule.'"
```

**Resource Card Labels:**
```
"A gentle read" (instead of "Reading")
"A quiet moment" (instead of "Watch")
"When you're ready" (instead of "Read More")
"Watch when ready" (instead of "Play Now")
```

### Checklist Component

**Tab Labels:**
```
"Right now" (instead of "Immediate Actions")
"In the Coming Days" (good as-is)
```

**Intro Text:**
```
"When you're ready, these small steps may help.
There's no rush—move at your own pace."
```

**Guidance Note:**
```
"The first 24 hours can feel like a blur.
Try to focus only on these few things. Everything else can wait."
```

---

## Implementation Checklist

When adding new features or copy, verify:

- [ ] No imperative verbs in primary buttons
- [ ] Empty states offer invitation, not just information
- [ ] Error messages include reassurance and path forward
- [ ] Loading states feel present, not impatient
- [ ] Success messages affirm without celebrating
- [ ] Form labels explain the "why"
- [ ] Placeholders invite rather than instruct
- [ ] No urgency language unless truly time-sensitive
- [ ] Context-appropriate for user role (Executor vs Planner vs Family)

---

## Resources

- [Grief Support Sanctuary](/resources/grief-support) - Reference implementation
- [GriefChecklist.svelte](/frontend/src/lib/components/GriefChecklist.svelte) - Checklist patterns
- [GriefResourceCard.svelte](/frontend/src/lib/components/GriefResourceCard.svelte) - Card patterns
- [aiGriefService.ts](/frontend/src/lib/services/aiGriefService.ts) - AI prompt patterns
- [errors.py](/backend/errors.py) - Backend error message patterns

---

*Last updated: January 2026*
*Maintainer: Continuum Design Team*
