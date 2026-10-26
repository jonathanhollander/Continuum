# Button Language Fix - Implementation Checklist

Quick reference for implementing all 31 fixes. Check off as you complete each file.

---

## Phase 1: High Priority (Permanent Deletions)

### Critical Data Loss Prevention

- [ ] `lib/components/archetypes/DocumentVault.svelte` (line 161)
  - Replace: "Are you sure you'd like to remove this document? This cannot be undone."
  - With: "Would you like to remove this document? This action is permanent."

- [ ] `routes/modules/letters/+page.svelte` (line 123)
  - Replace: `Are you sure you want to delete "${name}"?`
  - With: `Remove the letter to "${name}"? You can always create it again if needed.`

- [ ] `routes/modules/pulse/vault/+page.svelte` (line 72)
  - Replace: "Permanently delete these instructions from the vault?"
  - With: "Remove these instructions from the vault? This action is permanent."

- [ ] `routes/modules/visual-memories/+page.svelte` (line 152)
  - Replace: `Permanently delete ${selectedCount} memories?`
  - With: `Remove ${selectedCount} memories? This action cannot be undone.`

- [ ] `routes/modules/activity-log/+page.svelte` (line 130-131)
  - Replace: "Are you sure you want to clear the entire activity log? This action cannot be undone."
  - With: "Clear the entire activity log? This action is permanent and cannot be undone."

- [ ] `routes/settings/data/+page.svelte` (line 98)
  - Replace: "Clean up all generated test data?"
  - With: "Remove all test data? This will clean up sample content from your account."

**Phase 1 Complete**: [ ]

---

## Phase 2: Medium Priority (Standard Removals)

### Simple Removals (Can be restored)

- [ ] `routes/modules/contacts/+page.svelte` (line 148)
  - Replace: "Are you sure you'd like to remove this contact from your records?"
  - With: "Remove this contact? You can always add them back later if needed."

- [ ] `routes/modules/heirlooms/+page.svelte` (line 246)
  - Replace: "Are you sure you'd like to remove this heirloom? The story will be preserved in your activity log."
  - With: "Remove this heirloom? Your story will be preserved in the activity log."

- [ ] `routes/modules/pets/+page.svelte` (line 93)
  - Replace: "Are you sure you'd like to remove this pet from your records?"
  - With: "Remove this pet? You can add them back anytime if needed."

- [ ] `routes/modules/insurance/+page.svelte` (line 246)
  - Replace: `Are you sure you want to remove the policy "${name}"?`
  - With: `Remove the policy "${name}"? You can add it back later if needed.`

- [ ] `routes/modules/subscriptions/+page.svelte` (line 187)
  - Replace: "Are you sure you'd like to remove this subscription from your records?"
  - With: "Remove this subscription? You can add it back anytime."

- [ ] `routes/modules/calendar/+page.svelte` (line 186)
  - Replace: "Are you sure you'd like to remove this event from your calendar?"
  - With: "Remove this event? You can create it again if needed."

- [ ] `routes/modules/timeline/+page.svelte` (line 82)
  - Replace: "Are you sure you'd like to remove this event from your timeline?"
  - With: "Remove this event from your timeline?"

- [ ] `routes/modules/family-hub/+page.svelte` (line 181)
  - Replace: "Are you sure you'd like to remove this memory?"
  - With: "Remove this memory? It will be preserved in your activity log."

- [ ] `routes/modules/qr-codes/+page.svelte` (line 68)
  - Replace: `Remove QR label for "${name}"?`
  - With: `Remove the QR label for "${name}"? You can create a new one anytime.`

- [ ] `lib/components/modules/pulse/PulseContactsManager.svelte` (line 161)
  - Replace: "Are you sure you'd like to remove this contact from your Pulse network?"
  - With: "Remove this contact from your Pulse network? You can add them back later."

- [ ] `routes/modules/pulse/settings/+page.svelte` (line 195)
  - Replace: "Are you sure you'd like to remove this contact from your Pulse network?"
  - With: "Remove this contact from your Pulse network? You can add them back later."

- [ ] `lib/components/archetypes/AssetManager.svelte` (line 218)
  - Replace: "Are you sure you want to delete this asset?"
  - With: "Remove this asset? You can add it back later if needed."

- [ ] `lib/components/ui/MediaGallery.svelte` (line 86)
  - Replace: "Are you sure you'd like to remove this item?"
  - With: "Remove this item? You can upload it again if needed."

- [ ] `lib/components/modules/legacy-journal/LifeLessons.svelte` (line 64)
  - Replace: "Are you sure you'd like to remove this lesson?"
  - With: "Remove this lesson? You can add it back later."

### Files with Multiple Instances

- [ ] `routes/modules/home-manual/+page.svelte` (3 instances: lines 119, 131, 146)
  - Replace ALL: "Are you sure you'd like to remove this item?"
  - With: "Remove this item? You can add it back anytime."

- [ ] `routes/modules/funeral/+page.svelte` (2 instances)
  - Line 149: Replace "Are you sure you'd like to remove this expense?"
  - With: "Remove this expense? You can add it back later."
  - Line 177: Replace "This will add standard industry average costs (2021 NFDA) to your budget. Continue?"
  - With: "Add standard industry average costs (2021 NFDA) to your budget? You can adjust these later."

### Edge Cases

- [ ] `routes/modules/property/+page.svelte` (line 243)
  - Replace: `Are you sure you want to remove "${name}" from your property list?`
  - With: `Remove "${name}" from your property list? You can add it back later if needed.`

- [ ] `routes/modules/medical/+page.svelte` (line 111)
  - Replace: "Are you sure you'd like to remove this directive? This should only be done if the document has been revoked."
  - With: "Remove this directive? This should only be done if the document has been revoked."

- [ ] `routes/modules/visual-memories/+page.svelte` (line 104)
  - Replace: "Are you sure you'd like to remove this archive location?"
  - With: "Remove this archive location? You can add it back anytime."

- [ ] `lib/components/onboarding/WelcomeModal.svelte` (line 22)
  - Replace: "This will populate your account with example data (Property, Family, Insurance, etc). Continue?"
  - With: "Populate your account with example data? This will add sample property, family, and insurance information."

**Phase 2 Complete**: [ ]

---

## Phase 3: Button Labels

### Visual Button Text

- [ ] `lib/components/modules/visual-memories/BulkActionBar.svelte` (line 76)
  - Replace: `<span>Delete</span>`
  - With: `<span>Remove selected</span>`

- [ ] `routes/modules/activity-log/+page.svelte` (line 219)
  - Replace: `<option value="DELETE">Delete</option>`
  - With: `<option value="DELETE">Remove</option>`

- [ ] `lib/components/archetypes/TaskDashboard.svelte` (line 327)
  - Replace: `>Add</button>`
  - With: `>Add another</button>`

**Phase 3 Complete**: [ ]

---

## Phase 4: Verification

### Automated Checks

Run these commands to verify no demanding language remains:

```bash
cd /path/to/Continuum_SaaS

# Should return 0 results
grep -r "Are you sure" --include="*.svelte" frontend/src
grep -r ">Delete<" --include="*.svelte" frontend/src
grep -r 'confirm.*delete' --include="*.svelte" frontend/src
```

**Verification Commands Run**: [ ]

### Manual Testing

Test each flow to verify compassionate tone:

- [ ] Contact removal (contacts page)
- [ ] Heirloom removal (heirlooms page)
- [ ] Pet removal (pets page)
- [ ] Document removal (document vault)
- [ ] Asset removal (asset manager)
- [ ] Insurance policy removal (insurance page)
- [ ] Subscription removal (subscriptions page)
- [ ] Calendar event removal (calendar page)
- [ ] Timeline event removal (timeline page)
- [ ] Pulse contact removal (pulse settings)
- [ ] Activity log clearing (activity log page)
- [ ] Test data cleanup (settings page)
- [ ] Bulk memory deletion (visual memories)
- [ ] Demo data population (welcome modal)

**Manual Testing Complete**: [ ]

---

## Final Verification

- [ ] All 31 replacements completed
- [ ] Automated grep searches return 0 results
- [ ] Manual testing shows compassionate tone throughout
- [ ] No "Are you sure" language remains
- [ ] No "delete" button labels remain
- [ ] All confirmations provide reassurance or context
- [ ] User feels supported, not pressured

**All Phases Complete**: [ ]

---

## Completion

When all checkboxes are marked:

1. Run final verification commands
2. Test all flows manually
3. Document completion in Issue #14
4. Close Issue #14 as complete

**Issue #14 Ready to Close**: [ ]

---

## Quick Stats

- **Total Files**: 27
- **Total Replacements**: 31
  - Confirm dialogs: 28
  - Button labels: 3
- **Estimated Time**: 2.5-3 hours
- **Phases**: 4

