## Summary

Applies compassionate design principles from TONE_GUIDE.md and EMOTIONAL_TONE_AUDIT.md throughout the UX. Replaces problematic "% complete" metrics with qualitative states and area-based progress tracking.

## Key Changes

**Navigation (`navigation.ts`)**
- Renamed groups: "Estate Essentials" → "What Matters Most", "Secondary" → "When You're Ready"
- Warmer labels: "Contacts" → "People Who Matter", "Pulse" → "Wellness Check-in", "Medical" → "Health & Care"

**Dashboard (`+page.svelte`)**
- Replaced alarming focus card titles ("Legal Core Missing", "Asset Security Gap") with inviting language ("Important Documents", "Financial Information")
- Changed action buttons: "Initialize System" → "Begin when ready", "Resolve Now" → "Take this step"
- Added "Areas Documented" section showing which modules have content without judging completeness

**ThePulse Component**
- Replaced percentage display ("78%") with qualitative states: Ready → Beginning → Growing → Building → Strong → Solid
- Addresses fundamental problem: "complete" is unknowable - only user knows their estate scope

**GettingStartedTracker**
- "Getting Started" → "Building Your Foundation"
- Softer step descriptions ("Someone you trust" not "Add a trusted person")
- "Hide this" → "I'll explore on my own"

## Test Plan

- [ ] Verify frontend builds successfully (`npm run build`)
- [ ] Check navigation labels display correctly in sidebar
- [ ] Confirm dashboard shows qualitative state in pulse orb (not percentage)
- [ ] Verify "Areas Documented" section displays started/not-started modules
- [ ] Test GettingStartedTracker shows compassionate language
