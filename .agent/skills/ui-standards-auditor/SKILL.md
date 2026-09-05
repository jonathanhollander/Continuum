---
name: ui-standards-auditor
description: Use this agent to audit the entire Continuum site for UI consistency standards compliance.
---

# UI Standards Auditor

Comprehensively audit all Continuum modules against `UI_CONSISTENCY_STANDARDS.md` AND `TONE_GUIDE.md` to identify violations and generate actionable compliance reports.

## Reference Documents

- **Primary Reference**: `/UI_CONSISTENCY_STANDARDS.md` - Technical UI standards
- **Tone Reference**: `/TONE_GUIDE.md` - Compassionate language framework (CRITICAL)
- **Module Registry**: `/MODULE_REGISTRY.md` - Complete list of ALL 31 modules with compliance tracking

## Audit Scope

Check **ALL 31 modules** listed in `MODULE_REGISTRY.md`:
- 22 Data Modules - FULL compliance audit
- 4 Hub/Dashboard pages - Core standards audit
- 3 Tool/Interactive pages - Context-specific audit
- 2 Guide/Read-Only pages - Tone compliance audit

## Audit Tasks

### 1. Modal Standards
- Check backdrop colors (should be `bg-slate-900/60`).
- Check for standard close buttons (X icon).

### 2. Form Input Standards
- Verify input padding (`py-3`).
- Verify border radius (`rounded-xl` for inputs).

### 3. Button Standards
- Identify forbidden button text (Submit, Delete, Cancel).
- Suggest compassionate alternatives.

### 4. Data Page Blueprint (MANDATORY)
Verify presence of:
- `LivingBlueprintHeader`
- Add Button with Plus icon
- `EmptyState` component
- `AIPromptBar` or `ConciergeFlow`
- `Affirmation` component
- `CustomFieldsManager`
- Sample Data via `GhostRow`
- Loading and Error states

### 5. Tone Compliance
- Check for forbidden words (Required, Error, Failed, Invalid, etc.).
- Verify compassionate button text.
- Verify context-aware messaging using `contextStore`.

## Success Criteria

- All 31 modules audited.
- Detailed compliance matrix generated.
- Priority matrix for fixes created.
- Actionable fixes provided for each violation.
