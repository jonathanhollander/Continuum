# Button & CTA Language Audit Report

**Date**: January 22, 2026
**Auditor**: Button Language Audit Agent
**Issue Reference**: #14 (Compassionate Button Language)

## Executive Summary

Issue #14 claimed to have replaced 17 "Cancel" buttons and 14 confirm() dialogs. This audit reveals **significant remaining work**:

- **28 confirm() dialogs** with demanding language
- **2 "Delete" button labels**
- **1 "Add" button** that could be gentler
- **Multiple dropdown options** with imperative language

**Status**: Issue #14 should be REOPENED for completion.

---

## Detailed Findings

### 1. Confirm() Dialogs (28 Found)

All 28 dialogs use demanding or fear-inducing language that conflicts with compassionate UX principles.

#### Critical Issues (High Priority)

| File | Line | Current Language | Issue |
|------|------|------------------|-------|
| `routes/modules/contacts/+page.svelte` | 148 | "Are you sure you'd like to remove this contact from your records?" | Fear-based confirmation |
| `routes/modules/heirlooms/+page.svelte` | 246 | "Are you sure you'd like to remove this heirloom? The story will be preserved..." | Fear-based |
| `lib/components/archetypes/AssetManager.svelte` | 218 | "Are you sure you want to delete this asset?" | Demanding, uses "delete" |
| `lib/components/archetypes/DocumentVault.svelte` | 161 | "Are you sure you'd like to remove this document? This cannot be undone." | Fear-inducing finality |
| `routes/modules/pets/+page.svelte` | 93 | "Are you sure you'd like to remove this pet from your records?" | Fear-based |
| `routes/modules/letters/+page.svelte` | 123 | "Are you sure you want to delete \"{name}\"?" | Demanding, uses "delete" |
| `routes/modules/insurance/+page.svelte` | 246 | "Are you sure you want to remove the policy \"{name}\"?" | Demanding |

#### Full List of Files with confirm() Dialogs

1. `routes/modules/contacts/+page.svelte` (line 148)
2. `routes/settings/data/+page.svelte` (line 98)
3. `routes/modules/home-manual/+page.svelte` (lines 119, 131, 146)
4. `routes/modules/calendar/+page.svelte` (line 186)
5. `routes/modules/insurance/+page.svelte` (line 246)
6. `routes/modules/pets/+page.svelte` (line 93)
7. `routes/modules/letters/+page.svelte` (line 123)
8. `routes/modules/property/+page.svelte` (line 243)
9. `routes/modules/qr-codes/+page.svelte` (line 68)
10. `routes/modules/subscriptions/+page.svelte` (line 187)
11. `routes/modules/medical/+page.svelte` (line 111)
12. `lib/components/onboarding/WelcomeModal.svelte` (line 22)
13. `routes/modules/timeline/+page.svelte` (line 82)
14. `routes/modules/family-hub/+page.svelte` (line 181)
15. `routes/modules/activity-log/+page.svelte` (line 130)
16. `lib/components/archetypes/DocumentVault.svelte` (line 161)
17. `routes/modules/heirlooms/+page.svelte` (line 246)
18. `lib/components/ui/MediaGallery.svelte` (line 86)
19. `lib/components/archetypes/AssetManager.svelte` (line 218)
20. `routes/modules/pulse/vault/+page.svelte` (line 72)
21. `lib/components/modules/pulse/PulseContactsManager.svelte` (line 161)
22. `lib/components/modules/legacy-journal/LifeLessons.svelte` (line 64)
23. `routes/modules/pulse/settings/+page.svelte` (line 195)
24. `routes/modules/visual-memories/+page.svelte` (lines 104, 152)
25. `routes/modules/funeral/+page.svelte` (lines 149, 177)

**Total**: 28 confirm() dialogs

---

### 2. Button Labels with Demanding Language

#### "Delete" Buttons (2 Found)

| File | Line | Current Text | Suggested Replacement |
|------|------|--------------|----------------------|
| `lib/components/modules/visual-memories/BulkActionBar.svelte` | 76 | "Delete" | "Remove selected" |
| `routes/modules/activity-log/+page.svelte` | 219 | `<option value="DELETE">Delete</option>` | `<option value="DELETE">Remove</option>` |

#### "Add" Button (1 Found)

| File | Line | Current Text | Suggested Replacement |
|------|------|--------------|----------------------|
| `lib/components/archetypes/TaskDashboard.svelte` | 327 | "Add" | "Add another" or "Add when ready" |

---

### 3. Context Analysis

#### Activity Log Dropdown (lines 217-219)
```svelte
<option value="CREATE">Create</option>
<option value="UPDATE">Update</option>
<option value="DELETE">Delete</option>
```

**Issue**: These are filter options, not buttons. The value attributes are backend action types. Only the display text needs changing.

**Recommendation**:
- "CREATE" → "Create" (OK - neutral)
- "UPDATE" → "Update" (OK - neutral)
- "DELETE" → "Remove" (gentler)

---

## Recommended Replacements

### Confirm() Dialog Language Guide

**Pattern to Replace**:
```javascript
if (!confirm("Are you sure you want to delete X?")) return;
```

**Compassionate Alternatives**:

1. **For Removals**:
```javascript
if (!confirm("Would you like to remove this? You can always add it back later if needed.")) return;
```

2. **For Permanent Deletions**:
```javascript
if (!confirm("This will remove X from your records. Is that okay?")) return;
```

3. **For Data Cleanup**:
```javascript
if (!confirm("This will clear your activity log. Would you like to continue?")) return;
```

4. **For Heirlooms/Memories**:
```javascript
if (!confirm("Would you like to remove this heirloom? Your story will be preserved in the activity log.")) return;
```

### Key Principles

1. **Replace "Are you sure"** → "Would you like to..."
2. **Replace "delete"** → "remove"
3. **Add reassurance** → "You can always add it back" or "This will be preserved in..."
4. **Ask permission** → "Is that okay?" instead of demanding confirmation

---

## Files Requiring Updates

### High Priority (Permanent Actions)

1. `lib/components/archetypes/DocumentVault.svelte` (line 161)
2. `routes/modules/letters/+page.svelte` (line 123)
3. `routes/modules/pulse/vault/+page.svelte` (line 72)
4. `routes/modules/visual-memories/+page.svelte` (line 152)
5. `routes/modules/activity-log/+page.svelte` (line 130)
6. `routes/settings/data/+page.svelte` (line 98)

### Medium Priority (Removals)

7. `routes/modules/contacts/+page.svelte` (line 148)
8. `routes/modules/heirlooms/+page.svelte` (line 246)
9. `routes/modules/pets/+page.svelte` (line 93)
10. `routes/modules/insurance/+page.svelte` (line 246)
11. `routes/modules/subscriptions/+page.svelte` (line 187)
12. `routes/modules/calendar/+page.svelte` (line 186)
13. `routes/modules/timeline/+page.svelte` (line 82)
14. `routes/modules/family-hub/+page.svelte` (line 181)
15. `routes/modules/qr-codes/+page.svelte` (line 68)
16. `lib/components/modules/pulse/PulseContactsManager.svelte` (line 161)
17. `routes/modules/pulse/settings/+page.svelte` (line 195)
18. `lib/components/archetypes/AssetManager.svelte` (line 218)
19. `lib/components/ui/MediaGallery.svelte` (line 86)
20. `lib/components/modules/legacy-journal/LifeLessons.svelte` (line 64)

### Medium Priority (Multiple Instances)

21. `routes/modules/home-manual/+page.svelte` (lines 119, 131, 146)
22. `routes/modules/funeral/+page.svelte` (lines 149, 177)
23. `routes/modules/property/+page.svelte` (line 243)
24. `routes/modules/medical/+page.svelte` (line 111)
25. `routes/modules/visual-memories/+page.svelte` (line 104)
26. `lib/components/onboarding/WelcomeModal.svelte` (line 22)

### Button Labels

27. `lib/components/modules/visual-memories/BulkActionBar.svelte` (line 76)
28. `routes/modules/activity-log/+page.svelte` (line 219)
29. `lib/components/archetypes/TaskDashboard.svelte` (line 327)

---

## Implementation Plan

### Phase 1: Critical Dialogs (Permanent Actions)
Replace 6 high-priority confirm() dialogs that involve permanent deletion or data loss.

### Phase 2: Standard Removals
Replace 20 medium-priority confirm() dialogs for item removals.

### Phase 3: Button Labels
Replace 3 button labels ("Delete" → "Remove", "Add" → "Add another").

### Phase 4: Verification
- Re-run audit searches
- Manual testing of all flows
- Verify compassionate tone throughout

---

## Testing Checklist

After fixes are applied, verify:

- [ ] No confirm() dialogs use "Are you sure"
- [ ] No confirm() dialogs use "delete" (use "remove" instead)
- [ ] All confirmations include reassurance or context
- [ ] No button labels use "Delete" (use "Remove")
- [ ] All CTAs feel supportive, not demanding
- [ ] User feels agency, not pressure

---

## Conclusion

**Issue #14 is NOT complete**. Significant work remains:

- **28 confirm() dialogs** need compassionate rewording
- **2 "Delete" buttons** need replacement
- **1 "Add" button** could be gentler

**Recommendation**: Reopen Issue #14 and implement the above fixes according to the implementation plan.

---

**Next Steps**:
1. Reopen GitHub Issue #14
2. Implement Phase 1 (critical dialogs)
3. Implement Phase 2 (standard removals)
4. Implement Phase 3 (button labels)
5. Run verification audit
6. Close issue when all items pass audit

