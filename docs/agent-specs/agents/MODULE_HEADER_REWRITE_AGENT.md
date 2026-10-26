# Module Header Rewrite Agent Specification
**Priority:** P0 - CRITICAL
**Estimated Time:** 2 days
**Impact:** First impression of every page transforms from transactional to compassionate

---

## OBJECTIVE

Rewrite all 11 module page headers and introductory text to replace transactional, administrative language with compassionate, emotionally intelligent framing that connects to love, values, and protection.

---

## PROBLEM STATEMENT

Current module headers use cold, administrative language for deeply emotional topics:
- "Insurance Policies" (protecting loved ones after death)
- "Medical & Health Safety Net" (choosing how you want to die)
- "Funeral Planning" (planning your own funeral)
- "Call List" (people to notify when you die)

Users need to understand WHY each module matters emotionally, not just WHAT it contains.

---

## FILES TO MODIFY

### All 11 Module Pages

1. `/frontend/src/routes/modules/insurance/+page.svelte`
2. `/frontend/src/routes/modules/medical/+page.svelte`
3. `/frontend/src/routes/modules/funeral/+page.svelte`
4. `/frontend/src/routes/modules/contacts/+page.svelte`
5. `/frontend/src/routes/modules/heirlooms/+page.svelte`
6. `/frontend/src/routes/modules/legacy-journal/+page.svelte`
7. `/frontend/src/routes/modules/letters/+page.svelte`
8. `/frontend/src/routes/modules/time-capsule/+page.svelte`
9. `/frontend/src/routes/modules/property/+page.svelte`
10. `/frontend/src/routes/modules/financial-accounts/+page.svelte`
11. `/frontend/src/routes/modules/executor-toolkit/+page.svelte`

---

## TRANSFORMATION FRAMEWORK

### Pattern for ALL Module Headers

```svelte
<!-- BEFORE (Transactional) -->
<h1>Module Name</h1>
<p>Brief description</p>

<!-- AFTER (Compassionate) -->
<h1>[Emotional Reframe]</h1>
<p class="intro-text">
  [Why this matters emotionally - connect to love/values/protection]
</p>

{#if isEmpty}
  <div class="why-matters">
    <h3>Why This Matters</h3>
    <p>[Explain importance with emotional context]</p>
  </div>
{/if}
```

---

## MODULE-BY-MODULE REWRITES

### 1. INSURANCE MODULE
**File:** `/frontend/src/routes/modules/insurance/+page.svelte:372-473`

#### Current (Lines 376-385)
```svelte
<h1 class="text-3xl font-bold text-gray-900 flex items-center gap-3">
  <div class="p-3 bg-blue-100 text-blue-600 rounded-2xl">
    <Shield size={32} />
  </div>
  Insurance Policies
</h1>
<p class="text-gray-500 mt-2">
  Your protection portfolio at a glance.
</p>
```

#### Replace With
```svelte
<h1 class="text-3xl font-bold text-gray-900 flex items-center gap-3">
  <div class="p-3 bg-blue-100 text-blue-600 rounded-2xl">
    <Heart size={32} />
  </div>
  Protecting Your Loved Ones
</h1>
<p class="text-gray-500 mt-2 text-lg leading-relaxed max-w-3xl">
  Life insurance and protection policies are acts of love. They ensure
  your family has financial security when you're no longer here to provide it.
  Documenting them makes sure these benefits reach the people you care about.
</p>

{#if policies.length === 0}
  <div class="mt-8 p-6 bg-blue-50 rounded-xl border border-blue-200">
    <h3 class="font-semibold text-lg text-gray-800 mb-2">Why This Matters</h3>
    <p class="text-gray-600 leading-relaxed">
      Without documented policies, your family may lose hundreds of thousands
      in benefits simply because they didn't know the policies existed. Life
      insurance alone protects your family's financial future - replacing your
      income and covering debts so they can grieve without financial panic.
    </p>
  </div>
{/if}
```

---

### 2. MEDICAL DIRECTIVES MODULE
**File:** `/frontend/src/routes/modules/medical/+page.svelte:130-140`

#### Current
```svelte
<h1 class="text-3xl font-bold text-gray-900 flex items-center gap-3">
  <div class="p-3 bg-red-100 text-red-600 rounded-2xl">
    <Heart size={32} />
  </div>
  Medical & Health Safety Net
</h1>
<p class="text-gray-500 mt-2">
  Critical directives and emergency instructions.
</p>
```

#### Replace With
```svelte
<h1 class="text-3xl font-bold text-gray-900 flex items-center gap-3">
  <div class="p-3 bg-red-100 text-red-600 rounded-2xl">
    <Heart size={32} />
  </div>
  Your Voice at the End of Life
</h1>
<p class="text-gray-500 mt-2 text-lg leading-relaxed max-w-3xl">
  These are some of the most important decisions you'll make. They ensure
  your values and wishes are honored when you can't speak for yourself.
  Taking time to consider these is normal - many people revisit these
  choices as circumstances change.
</p>

{#if directives.length === 0}
  <div class="mt-8 p-6 bg-red-50 rounded-xl border border-red-200">
    <h3 class="font-semibold text-lg text-gray-800 mb-2">Why This Matters</h3>
    <p class="text-gray-600 leading-relaxed mb-4">
      Without these directives, doctors and family must guess what you'd want
      during a crisis. That creates agonizing uncertainty. Documenting your
      wishes gives them clarity and peace when they need it most.
    </p>
    <p class="text-sm text-gray-500">
      💭 Facing a diagnosis? <a href="/resources/grief-support" class="underline">Grief and support resources →</a>
    </p>
  </div>
{/if}
```

---

### 3. FUNERAL PLANNING MODULE
**File:** `/frontend/src/routes/modules/funeral/+page.svelte`

#### Current (Find and replace header)
```svelte
<h1>Funeral Planning</h1>
```

#### Replace With
```svelte
<h1 class="text-3xl font-bold text-gray-900 flex items-center gap-3">
  <div class="p-3 bg-purple-100 text-purple-600 rounded-2xl">
    <Heart size={32} />
  </div>
  Honoring Your Life
</h1>
<p class="text-gray-500 mt-2 text-lg leading-relaxed max-w-3xl">
  Planning your funeral is about being remembered the way you want. These
  choices reflect who you are and give your family clarity during one of
  the hardest days of their lives. Take your time with this - these decisions
  are deeply personal.
</p>

<div class="mt-8 p-6 bg-purple-50 rounded-xl border border-purple-200">
  <h3 class="font-semibold text-lg text-gray-800 mb-2">This Takes Courage</h3>
  <p class="text-gray-600 leading-relaxed">
    Planning your own funeral brings up complicated feelings. That's completely
    normal. You can work on this in pieces and return as often as you need.
    Many people find it brings peace to know their wishes are documented.
  </p>
</div>
```

---

### 4. CONTACTS / CIRCLE OF TRUST MODULE
**File:** `/frontend/src/routes/modules/contacts/+page.svelte`

#### Current (Find header section)
```svelte
<h1>Contacts</h1>
<!-- or -->
<h1>Call List</h1>
```

#### Replace With
```svelte
<h1 class="text-3xl font-bold text-gray-900 flex items-center gap-3">
  <div class="p-3 bg-green-100 text-green-600 rounded-2xl">
    <Heart size={32} />
  </div>
  Circle of Trust
</h1>
<p class="text-gray-500 mt-2 text-lg leading-relaxed max-w-3xl">
  These are the people who matter most - family, friends, and professionals
  who need to know if something happens to you. This network ensures the
  right people are notified at the right time, with the right information.
</p>

{#if contacts.length === 0}
  <div class="mt-8 p-6 bg-green-50 rounded-xl border border-green-200">
    <h3 class="font-semibold text-lg text-gray-800 mb-2">The Three-Tier Strategy</h3>
    <p class="text-gray-600 leading-relaxed mb-3">
      <strong>Tier 1 - Immediate (within 1 hour):</strong> Your closest people who
      can help if you're in danger or missing. Usually 3-5 people.
    </p>
    <p class="text-gray-600 leading-relaxed mb-3">
      <strong>Tier 2 - Same Day (within 6-12 hours):</strong> Extended family and
      close friends who should know quickly. Usually 5-10 people.
    </p>
    <p class="text-gray-600 leading-relaxed">
      <strong>Tier 3 - Service Notice (24+ hours):</strong> People to invite to
      memorial services. Can be a larger group.
    </p>
  </div>
{/if}
```

---

### 5. HEIRLOOMS MODULE
**File:** `/frontend/src/routes/modules/heirlooms/+page.svelte`

#### Current (Find header)
```svelte
<h1>Heirlooms</h1>
```

#### Replace With
```svelte
<h1 class="text-3xl font-bold text-gray-900 flex items-center gap-3">
  <div class="p-3 bg-amber-100 text-amber-600 rounded-2xl">
    <Heart size={32} />
  </div>
  Objects That Carry Your Story
</h1>
<p class="text-gray-500 mt-2 text-lg leading-relaxed max-w-3xl">
  Heirlooms are more than just valuable objects - they carry stories, memories,
  and meaning. Documenting them ensures these treasures go to the right people
  who understand their significance.
</p>

{#if heirlooms.length === 0}
  <div class="mt-8 p-6 bg-amber-50 rounded-xl border border-amber-200">
    <h3 class="font-semibold text-lg text-gray-800 mb-2">Why Document Heirlooms?</h3>
    <p class="text-gray-600 leading-relaxed">
      Without context, your treasured possessions become "just stuff" to your
      executor. By recording their stories - who gave them to you, what they
      mean, who should have them - you preserve the emotional legacy these
      objects carry.
    </p>
  </div>
{/if}
```

---

### 6. LEGACY LETTERS MODULE
**File:** `/frontend/src/routes/modules/letters/+page.svelte`

#### Current (Find header)
```svelte
<h1>Letters</h1>
```

#### Replace With
```svelte
<h1 class="text-3xl font-bold text-gray-900 flex items-center gap-3">
  <div class="p-3 bg-pink-100 text-pink-600 rounded-2xl">
    <Heart size={32} />
  </div>
  Letters to Your Loved Ones
</h1>
<p class="text-gray-500 mt-2 text-lg leading-relaxed max-w-3xl">
  These letters preserve your voice for the people you love. What you write
  here will comfort them when you're no longer here to say it yourself.
  Be as vulnerable, loving, or practical as feels right to you.
</p>

{#if letters.length === 0}
  <div class="mt-8 p-6 bg-pink-50 rounded-xl border border-pink-200">
    <h3 class="font-semibold text-lg text-gray-800 mb-2">The Gift of Words</h3>
    <p class="text-gray-600 leading-relaxed">
      A letter from you will be one of the most precious things your loved ones
      have after you're gone. You can share memories, express love, offer guidance,
      or simply let them know what they meant to you. There's no wrong way to
      write these - whatever feels true to you is perfect.
    </p>
  </div>
{/if}
```

---

### 7. TIME CAPSULE MODULE
**File:** `/frontend/src/routes/modules/time-capsule/+page.svelte:119-134`

#### Current (Already Good!)
```svelte
<h1 class="font-serif text-3xl md:text-4xl font-black text-slate-900">
  Time Capsule Vault
</h1>
<p class="text-slate-500 text-lg max-w-lg font-medium">
  Preserving wisdom, voice, and presence. Messages safely locked
  until the perfect milestone.
</p>
```

#### Keep This - Already Perfect!
This is the ONLY module that currently has appropriate emotional tone.
Use this as the template for all others.

**No changes needed.**

---

### 8. PROPERTY MODULE
**File:** `/frontend/src/routes/modules/property/+page.svelte`

#### Current (Find header)
```svelte
<h1>Property</h1>
<!-- or -->
<h1>Real Estate</h1>
```

#### Replace With
```svelte
<h1 class="text-3xl font-bold text-gray-900 flex items-center gap-3">
  <div class="p-3 bg-teal-100 text-teal-600 rounded-2xl">
    <Home size={32} />
  </div>
  Your Home & Properties
</h1>
<p class="text-gray-500 mt-2 text-lg leading-relaxed max-w-3xl">
  Your home is often your largest asset and carries deep emotional meaning.
  Documenting property details ensures your family knows what you own, where
  important documents are, and who should inherit these spaces that hold
  your memories.
</p>
```

---

### 9. FINANCIAL ACCOUNTS MODULE
**File:** `/frontend/src/routes/modules/financial-accounts/+page.svelte`

#### Current (Find header)
```svelte
<h1>Financial Accounts</h1>
```

#### Replace With
```svelte
<h1 class="text-3xl font-bold text-gray-900 flex items-center gap-3">
  <div class="p-3 bg-emerald-100 text-emerald-600 rounded-2xl">
    <DollarSign size={32} />
  </div>
  Financial Accounts & Assets
</h1>
<p class="text-gray-500 mt-2 text-lg leading-relaxed max-w-3xl">
  Documenting your accounts ensures your family can access funds when they
  need them most. Without this information, thousands of dollars in assets
  could go unclaimed simply because no one knew they existed.
</p>

{#if accounts.length === 0}
  <div class="mt-8 p-6 bg-emerald-50 rounded-xl border border-emerald-200">
    <h3 class="font-semibold text-lg text-gray-800 mb-2">Why This Matters</h3>
    <p class="text-gray-600 leading-relaxed">
      Your executor will need to locate every account to settle your estate.
      Bank accounts, retirement funds, investment accounts, crypto wallets -
      documenting them all saves your family months of detective work during
      an already difficult time.
    </p>
  </div>
{/if}
```

---

### 10. LEGACY JOURNAL MODULE
**File:** `/frontend/src/routes/modules/legacy-journal/+page.svelte`

#### Current (Find header)
```svelte
<h1>Legacy Journal</h1>
```

#### Replace With
```svelte
<h1 class="text-3xl font-bold text-gray-900 flex items-center gap-3">
  <div class="p-3 bg-indigo-100 text-indigo-600 rounded-2xl">
    <BookOpen size={32} />
  </div>
  Your Life's Reflections
</h1>
<p class="text-gray-500 mt-2 text-lg leading-relaxed max-w-3xl">
  This is your space to reflect on life's meaningful moments, share wisdom,
  and record what you want remembered. These entries become part of your
  legacy - stories and insights preserved for the people you love.
</p>
```

---

### 11. EXECUTOR TOOLKIT MODULE
**File:** `/frontend/src/routes/modules/executor-toolkit/+page.svelte`

#### Add Grief Banner at Top (After header)
```svelte
<h1 class="text-3xl font-bold text-gray-900 flex items-center gap-3">
  <div class="p-3 bg-slate-100 text-slate-600 rounded-2xl">
    <Briefcase size={32} />
  </div>
  Executor Toolkit
</h1>

<!-- ADD THIS GRIEF BANNER -->
<div class="mt-6 p-6 bg-amber-50 rounded-xl border-l-4 border-amber-400">
  <div class="flex items-start gap-3">
    <Heart size={20} class="text-amber-600 mt-1 flex-shrink-0" />
    <div>
      <h3 class="font-semibold text-gray-800 mb-2">You're Managing Loss</h3>
      <p class="text-gray-600 leading-relaxed mb-3">
        Managing an estate while grieving is incredibly difficult. These tasks
        are necessary, but you're also allowed to take breaks, ask for help,
        and honor your grief process.
      </p>
      <a href="/resources/grief-support" class="text-amber-700 underline text-sm font-medium">
        Grief support resources →
      </a>
    </div>
  </div>
</div>

<p class="text-gray-500 mt-6 text-lg leading-relaxed max-w-3xl">
  This toolkit guides you through the essential tasks of managing an estate.
  We've organized them by urgency so you know what needs immediate attention.
</p>
```

---

## IMPLEMENTATION STEPS

### Step 1: Create Branch
```bash
git checkout -b feature/compassionate-module-headers
```

### Step 2: Module-by-Module Changes

For each of 11 modules:

1. **Locate current header** (usually `<h1>` tag)
2. **Replace with emotional reframe** (from specifications above)
3. **Add "Why This Matters" section** for empty states
4. **Update icon if needed** (many should change to Heart icon)
5. **Test page load** - ensure no React errors
6. **Review visual layout** - ensure new text fits well

### Step 3: Testing Checklist

After each module:
- [ ] Page loads without errors
- [ ] Header displays correctly
- [ ] Intro text is readable (max-width, line-height)
- [ ] Empty state "Why This Matters" appears when no data
- [ ] Icon is emotionally appropriate
- [ ] Tone feels compassionate, not clinical

### Step 4: Bulk Icon Changes

Many modules currently use functional icons (Shield, FileText, etc.).
Consider changing to Heart icon with colored backgrounds:

```svelte
<!-- BEFORE -->
<Shield size={32} />

<!-- AFTER -->
<Heart size={32} />
```

Keep icon colors (bg-blue-100, bg-red-100, etc.) but swap icons to Heart
where appropriate.

---

## SUCCESS CRITERIA

### ✅ Each Module Should:
- [ ] Have emotionally resonant header (not administrative title)
- [ ] Explain WHY module matters (connect to love/values/protection)
- [ ] Include "Why This Matters" section for empty states
- [ ] Use compassionate language throughout
- [ ] Acknowledge emotional weight when appropriate
- [ ] Feel supportive, not transactional

### ✅ Overall Application Should:
- [ ] Feel like a caring guide, not software
- [ ] Never use clinical/administrative headers for emotional topics
- [ ] Connect every module to human meaning
- [ ] Provide context before asking for data

---

## BEFORE & AFTER EXAMPLES

### Insurance Module

**BEFORE:**
```
Insurance Policies
Your protection portfolio at a glance.
```
User thinks: "This is administrative work."

**AFTER:**
```
Protecting Your Loved Ones

Life insurance and protection policies are acts of love. They ensure
your family has financial security when you're no longer here to
provide it.
```
User thinks: "This is about caring for my family."

---

### Medical Directives

**BEFORE:**
```
Medical & Health Safety Net
Critical directives and emergency instructions.
```
User thinks: "This sounds like paperwork."

**AFTER:**
```
Your Voice at the End of Life

These are some of the most important decisions you'll make. They
ensure your values and wishes are honored when you can't speak
for yourself.
```
User thinks: "This is about my values and dignity."

---

## COMMIT MESSAGE

```
feat(modules): transform headers to compassionate, emotionally intelligent framing

Replace transactional, administrative language with emotional intelligence
appropriate for death planning.

Changes by module:

Insurance:
- "Insurance Policies" → "Protecting Your Loved Ones"
- Added context about financial security as act of love

Medical Directives:
- "Medical & Health Safety Net" → "Your Voice at the End of Life"
- Added validation of emotional difficulty
- Added grief support resources link

Funeral:
- Enhanced header with "Honoring Your Life"
- Added acknowledgment that planning own funeral is hard

Contacts:
- "Call List" → "Circle of Trust"
- Explained three-tier notification strategy

Heirlooms:
- Added "Objects That Carry Your Story"
- Explained importance of context for treasured items

Letters:
- Emphasized preserving voice for loved ones
- Validated vulnerability in writing

Property:
- Acknowledged emotional meaning of home
- Connected to memories and legacy

Financial Accounts:
- Framed as preventing unclaimed assets
- Emphasized saving family from detective work

Legacy Journal:
- "Your Life's Reflections"
- Positioned as wisdom preservation

Executor Toolkit:
- Added grief banner acknowledging loss
- Provided grief support resources link
- Validated difficulty of managing estate while grieving

Impact:
- Every module now connects to love, values, or protection
- Users understand WHY each matters emotionally
- Empty states include compassionate "Why This Matters" sections
- Tone shift from administrative to supportive throughout

Time Capsule module kept as-is (already perfect emotional tone).

Closes: Module Headers Emotional Tone Issue
Ref: EMOTIONAL_TONE_AUDIT.md, MODULE_HEADER_REWRITE_AGENT.md
```

---

## ROLLBACK PLAN

```bash
# If issues, rollback branch
git checkout claude/review-codebase-suggestions-NjAZY
git branch -D feature/compassionate-module-headers
```

---

## NOTES

- Time Capsule module is the GOLD STANDARD - already perfect
- Some modules may need layout adjustments for longer intro text
- Consider max-width constraints (max-w-3xl) for readability
- Test on mobile - longer text should wrap gracefully
- Icons: Consider Heart icon for most modules (represents care/love)

---

**End of Module Header Rewrite Agent Specification**
