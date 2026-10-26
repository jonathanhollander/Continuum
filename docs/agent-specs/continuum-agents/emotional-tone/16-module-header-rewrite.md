# Agent 16: Module Header Rewrite
**Priority:** P0 - CRITICAL
**Estimated Time:** 4 hours
**Dependencies:** None
**Category:** Emotional Tone

---

## OBJECTIVE

Rewrite all module header descriptions to be emotionally appropriate for death planning context.

**Current Issues:**
- Generic, procedural descriptions
- No emotional context or support
- Task-oriented language
- Missing "why this matters" context
- No acknowledgment of difficulty

**Expected Outcome:**
- Warm, supportive module introductions
- Explain WHY each section matters
- Acknowledge emotional difficulty
- Provide encouragement
- Context for each user type

---

## FILES TO MODIFY

1. `/frontend/src/routes/modules/documents/+page.svelte`
2. `/frontend/src/routes/modules/contacts/+page.svelte`
3. `/frontend/src/routes/modules/wishes/+page.svelte`
4. `/frontend/src/routes/modules/inventory/+page.svelte`
5. `/frontend/src/routes/modules/medical/+page.svelte`
6. `/frontend/src/routes/modules/digital/+page.svelte`
7. `/frontend/src/routes/modules/financial/+page.svelte`
8. `/frontend/src/routes/modules/messages/+page.svelte`
9. `/frontend/src/routes/modules/pulse/+page.svelte`
10. `/frontend/src/routes/modules/pets/+page.svelte`
11. `/frontend/src/routes/modules/funeral/+page.svelte`

---

## IMPLEMENTATION

### Example: Documents Module

**Before (procedural):**
```svelte
<h1>Important Documents</h1>
<p>Store and organize your important documents.</p>
```

**After (compassionate):**
```svelte
<h1>Important Documents</h1>
<p class="module-intro">
  The documents you gather here will help your loved ones navigate what comes next.
  From legal papers to sentimental letters, this is where you can ensure nothing
  important is lost or forgotten. Take your time - there's no rush to complete everything
  at once.
</p>

<div class="why-this-matters">
  <h3>Why this matters</h3>
  <p>
    When someone is grieving, searching for important documents adds unnecessary stress.
    By organizing them now, you're giving your loved ones the gift of clarity during a
    difficult time.
  </p>
</div>
```

### Example: Wishes Module

**Before:**
```svelte
<h1>Final Wishes</h1>
<p>Record your preferences for end-of-life care and memorial services.</p>
```

**After:**
```svelte
<h1>Your Wishes</h1>
<p class="module-intro">
  These are deeply personal choices that only you can make. Whether it's how you want
  to be remembered, who you'd like by your side, or how you envision your memorial -
  your wishes matter. Sharing them now means your loved ones won't have to guess, and
  they can honor what truly matters to you.
</p>

<div class="why-this-matters">
  <h3>Why this matters</h3>
  <p>
    Family members often struggle with difficult decisions, wondering "what would they
    have wanted?" Your guidance here removes that burden and ensures your values and
    preferences are honored.
  </p>
</div>
```

### Example: Contacts Module

**Before:**
```svelte
<h1>Important Contacts</h1>
<p>List people who should be notified.</p>
```

**After:**
```svelte
<h1>Important Contacts</h1>
<p class="module-intro">
  The people in your life matter - from close family to long-distance friends, from your
  doctor to your lawyer. This list ensures no one is forgotten when news needs to be shared.
  You know your circle best; we're just here to help you organize those connections.
</p>

<div class="why-this-matters">
  <h3>Why this matters</h3>
  <p>
    In the confusion after a loss, it's easy to overlook notifying someone important. This
    list becomes a safety net, ensuring everyone who cared about you knows what's happened
    and can pay their respects.
  </p>
</div>
```

### Example: Messages Module

**Before:**
```svelte
<h1>Messages</h1>
<p>Leave messages for loved ones.</p>
```

**After:**
```svelte
<h1>Messages to Loved Ones</h1>
<p class="module-intro">
  Some things are easier to write than to say out loud. Whether it's words of love,
  memories you want to share, advice for the future, or simply "I'm proud of you" -
  these messages become precious gifts. Write them when you're ready, in your own words,
  at your own pace.
</p>

<div class="why-this-matters">
  <h3>Why this matters</h3>
  <p>
    These messages can provide comfort for years to come. On difficult days, during
    milestones, or just when they miss you - your words will be there. It's a way to
    continue caring for the people you love, even when you can't be there in person.
  </p>
</div>
```

### Example: Pulse (Safety Check) Module

**Before:**
```svelte
<h1>Pulse Safety Check</h1>
<p>Configure automated check-ins to ensure you're okay.</p>
```

**After:**
```svelte
<h1>Pulse - Your Safety Net</h1>
<p class="module-intro">
  For people who live alone or want extra peace of mind, Pulse provides a gentle safety
  check. Simply check in on your schedule, and if you miss a check-in, your trusted
  contacts are notified. It's a simple way to look out for yourself while giving loved
  ones reassurance.
</p>

<div class="why-this-matters">
  <h3>Why this matters</h3>
  <p>
    If something unexpected happens, time matters. Pulse ensures someone will know to
    check on you, providing both you and your loved ones with peace of mind. You stay
    independent, and they stay connected.
  </p>
</div>
```

### Example: Medical Module

**Before:**
```svelte
<h1>Medical Information</h1>
<p>Record your medical history and preferences.</p>
```

**After:**
```svelte
<h1>Medical Information & Care Preferences</h1>
<p class="module-intro">
  Your medical history, current medications, and care preferences are crucial information
  that can guide important decisions. Whether it's routine care or an emergency, having
  this information organized helps healthcare providers and your loved ones advocate for
  what you want.
</p>

<div class="why-this-matters">
  <h3>Why this matters</h3>
  <p>
    In a medical crisis, your loved ones may need to make urgent decisions. Having your
  preferences clearly documented - from allergies to end-of-life care choices - ensures
    your voice is heard even when you can't speak for yourself.
  </p>
</div>
```

---

## VALIDATION

```bash
cd frontend
# Search for remaining procedural/task-oriented language
grep -r "Store and organize" src/routes/modules/
grep -r "Record your" src/routes/modules/
grep -r "List people" src/routes/modules/

# Should return no results
```

---

## SUCCESS CRITERIA

- [ ] All 11 module headers rewritten
- [ ] Each has compassionate introduction
- [ ] Each includes "Why this matters" section
- [ ] No task-oriented language ("Store", "Record", "List")
- [ ] Acknowledges emotional context
- [ ] Provides encouragement
- [ ] Explains value to loved ones

---

## COMMIT MESSAGE

```
feat(ui): rewrite module headers with compassionate, context-aware language

Replace procedural task descriptions with emotionally appropriate introductions.

Changes:
- Rewrote all 11 module header descriptions
- Added "Why this matters" sections explaining value
- Removed task-oriented language
- Added emotional context and support
- Emphasized user agency ("when you're ready")

Before: "Store and organize your important documents"
After: "The documents you gather here will help your loved ones navigate
what comes next... Take your time - there's no rush."

Impact:
- Users understand WHY each section matters
- Emotional difficulty acknowledged
- Supportive, not procedural tone
- Context for value to loved ones

Closes: Module header compassion upgrade
Ref: UI_UX_GUIDANCE_AUDIT.md
```

---

**READY TO EXECUTE**
