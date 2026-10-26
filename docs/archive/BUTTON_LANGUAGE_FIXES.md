# Button Language - Specific Fixes Required

This document provides exact line-by-line replacements for all remaining demanding language.

---

## 1. High Priority: Permanent Deletions (6 Files)

### File: `lib/components/archetypes/DocumentVault.svelte` (line 161)

**Current**:
```javascript
if (!confirm("Are you sure you'd like to remove this document? This cannot be undone.")) return;
```

**Replace with**:
```javascript
if (!confirm("Would you like to remove this document? This action is permanent.")) return;
```

---

### File: `routes/modules/letters/+page.svelte` (line 123)

**Current**:
```javascript
if (!confirm(`Are you sure you want to delete "${name}"?`)) return;
```

**Replace with**:
```javascript
if (!confirm(`Remove the letter to "${name}"? You can always create it again if needed.`)) return;
```

---

### File: `routes/modules/pulse/vault/+page.svelte` (line 72)

**Current**:
```javascript
if (!confirm("Permanently delete these instructions from the vault?"))
```

**Replace with**:
```javascript
if (!confirm("Remove these instructions from the vault? This action is permanent."))
```

---

### File: `routes/modules/visual-memories/+page.svelte` (line 152)

**Current**:
```javascript
if (confirm(`Permanently delete ${selectedCount} memories?`)) {
```

**Replace with**:
```javascript
if (confirm(`Remove ${selectedCount} memories? This action cannot be undone.`)) {
```

---

### File: `routes/modules/activity-log/+page.svelte` (line 130-131)

**Current**:
```javascript
if (
    !confirm(
        "Are you sure you want to clear the entire activity log? This action cannot be undone.",
    )
)
```

**Replace with**:
```javascript
if (
    !confirm(
        "Clear the entire activity log? This action is permanent and cannot be undone.",
    )
)
```

---

### File: `routes/settings/data/+page.svelte` (line 98)

**Current**:
```javascript
if (!confirm("Clean up all generated test data?")) return;
```

**Replace with**:
```javascript
if (!confirm("Remove all test data? This will clean up sample content from your account.")) return;
```

---

## 2. Medium Priority: Standard Removals (20 Files)

### File: `routes/modules/contacts/+page.svelte` (line 148)

**Current**:
```javascript
if (!confirm("Are you sure you'd like to remove this contact from your records?")) return;
```

**Replace with**:
```javascript
if (!confirm("Remove this contact? You can always add them back later if needed.")) return;
```

---

### File: `routes/modules/heirlooms/+page.svelte` (line 246)

**Current**:
```javascript
if (!confirm("Are you sure you'd like to remove this heirloom? The story will be preserved in your activity log.")) return;
```

**Replace with**:
```javascript
if (!confirm("Remove this heirloom? Your story will be preserved in the activity log.")) return;
```

---

### File: `routes/modules/pets/+page.svelte` (line 93)

**Current**:
```javascript
if (!confirm("Are you sure you'd like to remove this pet from your records?")) return;
```

**Replace with**:
```javascript
if (!confirm("Remove this pet? You can add them back anytime if needed.")) return;
```

---

### File: `routes/modules/insurance/+page.svelte` (line 246)

**Current**:
```javascript
if (confirm(`Are you sure you want to remove the policy "${name}"?`)) {
```

**Replace with**:
```javascript
if (confirm(`Remove the policy "${name}"? You can add it back later if needed.`)) {
```

---

### File: `routes/modules/subscriptions/+page.svelte` (line 187)

**Current**:
```javascript
if (!confirm("Are you sure you'd like to remove this subscription from your records?")) return;
```

**Replace with**:
```javascript
if (!confirm("Remove this subscription? You can add it back anytime.")) return;
```

---

### File: `routes/modules/calendar/+page.svelte` (line 186)

**Current**:
```javascript
if (!confirm("Are you sure you'd like to remove this event from your calendar?")) return;
```

**Replace with**:
```javascript
if (!confirm("Remove this event? You can create it again if needed.")) return;
```

---

### File: `routes/modules/timeline/+page.svelte` (line 82)

**Current**:
```javascript
if (!confirm("Are you sure you'd like to remove this event from your timeline?")) return;
```

**Replace with**:
```javascript
if (!confirm("Remove this event from your timeline?")) return;
```

---

### File: `routes/modules/family-hub/+page.svelte` (line 181)

**Current**:
```javascript
if (!confirm("Are you sure you'd like to remove this memory?")) return;
```

**Replace with**:
```javascript
if (!confirm("Remove this memory? It will be preserved in your activity log.")) return;
```

---

### File: `routes/modules/qr-codes/+page.svelte` (line 68)

**Current**:
```javascript
if (!confirm(`Remove QR label for "${name}"?`)) return;
```

**Replace with**:
```javascript
if (!confirm(`Remove the QR label for "${name}"? You can create a new one anytime.`)) return;
```

---

### File: `lib/components/modules/pulse/PulseContactsManager.svelte` (line 161)

**Current**:
```javascript
if (!confirm("Are you sure you'd like to remove this contact from your Pulse network?")) return;
```

**Replace with**:
```javascript
if (!confirm("Remove this contact from your Pulse network? You can add them back later.")) return;
```

---

### File: `routes/modules/pulse/settings/+page.svelte` (line 195)

**Current**:
```javascript
if (!confirm("Are you sure you'd like to remove this contact from your Pulse network?")) return;
```

**Replace with**:
```javascript
if (!confirm("Remove this contact from your Pulse network? You can add them back later.")) return;
```

---

### File: `lib/components/archetypes/AssetManager.svelte` (line 218)

**Current**:
```javascript
if (!confirm("Are you sure you want to delete this asset?")) return;
```

**Replace with**:
```javascript
if (!confirm("Remove this asset? You can add it back later if needed.")) return;
```

---

### File: `lib/components/ui/MediaGallery.svelte` (line 86)

**Current**:
```javascript
if (confirm("Are you sure you'd like to remove this item?")) {
```

**Replace with**:
```javascript
if (confirm("Remove this item? You can upload it again if needed.")) {
```

---

### File: `lib/components/modules/legacy-journal/LifeLessons.svelte` (line 64)

**Current**:
```javascript
if (!confirm("Are you sure you'd like to remove this lesson?")) return;
```

**Replace with**:
```javascript
if (!confirm("Remove this lesson? You can add it back later.")) return;
```

---

### File: `routes/modules/home-manual/+page.svelte` (3 instances)

**Line 119 - Current**:
```javascript
if (!confirm("Are you sure you'd like to remove this item?")) return;
```

**Replace with**:
```javascript
if (!confirm("Remove this item? You can add it back anytime.")) return;
```

**Line 131 - Current**:
```javascript
if (!confirm("Are you sure you'd like to remove this item?")) return;
```

**Replace with**:
```javascript
if (!confirm("Remove this item? You can add it back anytime.")) return;
```

**Line 146 - Current**:
```javascript
if (!confirm("Are you sure you'd like to remove this item?")) return;
```

**Replace with**:
```javascript
if (!confirm("Remove this item? You can add it back anytime.")) return;
```

---

### File: `routes/modules/funeral/+page.svelte` (2 instances)

**Line 149 - Current**:
```javascript
if (!confirm("Are you sure you'd like to remove this expense?")) return;
```

**Replace with**:
```javascript
if (!confirm("Remove this expense? You can add it back later.")) return;
```

**Line 177 - Current**:
```javascript
if (
    !confirm(
        "This will add standard industry average costs (2021 NFDA) to your budget. Continue?",
    )
)
```

**Replace with**:
```javascript
if (
    !confirm(
        "Add standard industry average costs (2021 NFDA) to your budget? You can adjust these later.",
    )
)
```

---

### File: `routes/modules/property/+page.svelte` (line 243)

**Current**:
```javascript
if (
    confirm(
        `Are you sure you want to remove "${name}" from your property list?`,
    )
) {
```

**Replace with**:
```javascript
if (
    confirm(
        `Remove "${name}" from your property list? You can add it back later if needed.`,
    )
) {
```

---

### File: `routes/modules/medical/+page.svelte` (line 111)

**Current**:
```javascript
if (
    !confirm(
        "Are you sure you'd like to remove this directive? This should only be done if the document has been revoked.",
    )
)
```

**Replace with**:
```javascript
if (
    !confirm(
        "Remove this directive? This should only be done if the document has been revoked.",
    )
)
```

---

### File: `routes/modules/visual-memories/+page.svelte` (line 104)

**Current**:
```javascript
if (confirm("Are you sure you'd like to remove this archive location?")) {
```

**Replace with**:
```javascript
if (confirm("Remove this archive location? You can add it back anytime.")) {
```

---

### File: `lib/components/onboarding/WelcomeModal.svelte` (line 22)

**Current**:
```javascript
if (
    confirm(
        "This will populate your account with example data (Property, Family, Insurance, etc). Continue?",
    )
) {
```

**Replace with**:
```javascript
if (
    confirm(
        "Populate your account with example data? This will add sample property, family, and insurance information.",
    )
) {
```

---

## 3. Button Label Fixes (3 Files)

### File: `lib/components/modules/visual-memories/BulkActionBar.svelte` (line 76)

**Current**:
```svelte
<span>Delete</span>
```

**Replace with**:
```svelte
<span>Remove selected</span>
```

---

### File: `routes/modules/activity-log/+page.svelte` (line 219)

**Current**:
```svelte
<option value="DELETE">Delete</option>
```

**Replace with**:
```svelte
<option value="DELETE">Remove</option>
```

---

### File: `lib/components/archetypes/TaskDashboard.svelte` (line 327)

**Current**:
```svelte
>Add</button>
```

**Replace with**:
```svelte
>Add another</button>
```

---

## Summary of Changes

- **Total files to update**: 29
- **Total confirm() dialogs**: 28
- **Total button labels**: 3

### Key Patterns Applied

1. **"Are you sure"** → Removed (starts with action)
2. **"delete"** → "Remove"
3. **"?"** → Added reassurance before question mark
4. **Permanent actions** → Added "This action is permanent" or "cannot be undone"
5. **Reversible actions** → Added "You can add it back" or "anytime"

---

## Implementation Checklist

- [ ] High Priority: 6 permanent deletion dialogs
- [ ] Medium Priority: 20 removal dialogs
- [ ] Button Labels: 3 labels
- [x] All files confirmed with exact replacement text
- [ ] Apply all replacements
- [ ] Test each flow manually
- [ ] Re-run audit to verify completion

## Quick Reference: Files to Update

1. `lib/components/archetypes/DocumentVault.svelte` (1 dialog)
2. `routes/modules/letters/+page.svelte` (1 dialog)
3. `routes/modules/pulse/vault/+page.svelte` (1 dialog)
4. `routes/modules/visual-memories/+page.svelte` (2 dialogs)
5. `routes/modules/activity-log/+page.svelte` (1 dialog + 1 button)
6. `routes/settings/data/+page.svelte` (1 dialog)
7. `routes/modules/contacts/+page.svelte` (1 dialog)
8. `routes/modules/heirlooms/+page.svelte` (1 dialog)
9. `routes/modules/pets/+page.svelte` (1 dialog)
10. `routes/modules/insurance/+page.svelte` (1 dialog)
11. `routes/modules/subscriptions/+page.svelte` (1 dialog)
12. `routes/modules/calendar/+page.svelte` (1 dialog)
13. `routes/modules/timeline/+page.svelte` (1 dialog)
14. `routes/modules/family-hub/+page.svelte` (1 dialog)
15. `routes/modules/qr-codes/+page.svelte` (1 dialog)
16. `lib/components/modules/pulse/PulseContactsManager.svelte` (1 dialog)
17. `routes/modules/pulse/settings/+page.svelte` (1 dialog)
18. `lib/components/archetypes/AssetManager.svelte` (1 dialog)
19. `lib/components/ui/MediaGallery.svelte` (1 dialog)
20. `lib/components/modules/legacy-journal/LifeLessons.svelte` (1 dialog)
21. `routes/modules/home-manual/+page.svelte` (3 dialogs)
22. `routes/modules/funeral/+page.svelte` (2 dialogs)
23. `routes/modules/property/+page.svelte` (1 dialog)
24. `routes/modules/medical/+page.svelte` (1 dialog)
25. `lib/components/onboarding/WelcomeModal.svelte` (1 dialog)
26. `lib/components/modules/visual-memories/BulkActionBar.svelte` (1 button)
27. `lib/components/archetypes/TaskDashboard.svelte` (1 button)

**Total**: 27 files, 31 replacements (28 dialogs + 3 buttons)

