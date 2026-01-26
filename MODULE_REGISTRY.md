# Continuum Module Registry

> **SINGLE SOURCE OF TRUTH** for all modules in Continuum.
> Referenced by: `UI_CONSISTENCY_STANDARDS.md`, `UI_IMPLEMENTATION_PLAN.md`, all agent configurations.

---

## Scope Declaration

**ALL modules listed in this document MUST comply with:**
- `UI_CONSISTENCY_STANDARDS.md` - Technical UI patterns
- `TONE_GUIDE.md` - Compassionate language framework

**No exceptions.** Every modal, every form, every button, every user-facing string across ALL modules must follow these standards.

---

## Module Categories

| Category | Description | Standards Scope |
|----------|-------------|-----------------|
| **Data Module** | User creates/edits/deletes data | FULL compliance (all 19 sections) |
| **Hub/Dashboard** | Aggregates data from other modules | Layout, cards, navigation standards |
| **Tool/Interactive** | Special-purpose utilities | Context-specific, core standards |
| **Guide/Read-Only** | Informational content | Typography, layout, tone standards |

---

## Complete Module List

### Data Modules (22 modules) — FULL STANDARDS COMPLIANCE REQUIRED

These modules allow users to create, read, update, and delete data. They require:
- All Data Page Blueprint elements (Section 5)
- Standard modals with CustomFieldsManager
- View Toggle (Card/Table)
- Sample Data via GhostRow
- Full tone compliance

| # | Module ID | Route | Description | Has Modal | Has CRUD |
|---|-----------|-------|-------------|-----------|----------|
| 1 | `contacts` | `/modules/contacts` | Circle of trust - emergency contacts | Yes | Yes |
| 2 | `medical` | `/modules/medical` | Medical directives and healthcare wishes | Yes | Yes |
| 3 | `pets` | `/modules/pets` | Pet care instructions and guardians | Yes | Yes |
| 4 | `heirlooms` | `/modules/heirlooms` | Treasured items and their stories | Yes | Yes |
| 5 | `financial-accounts` | `/modules/financial-accounts` | Bank accounts, investments, assets | Yes | Yes |
| 6 | `property` | `/modules/property` | Real estate, vehicles, valuables | Yes | Yes |
| 7 | `insurance` | `/modules/insurance` | Insurance policies and claims info | Yes | Yes |
| 8 | `subscriptions` | `/modules/subscriptions` | Recurring subscriptions to cancel/transfer | Yes | Yes |
| 9 | `letters` | `/modules/letters` | Personal letters to loved ones | Yes | Yes |
| 10 | `time-capsule` | `/modules/time-capsule` | Future-dated messages | Yes | Yes |
| 11 | `calendar` | `/modules/calendar` | Important dates and anniversaries | Yes | Yes |
| 12 | `timeline` | `/modules/timeline` | Life events and milestones | Yes | Yes |
| 13 | `funeral` | `/modules/funeral` | Funeral and memorial preferences | Yes | Yes |
| 14 | `legal-documents` | `/modules/legal-documents` | Wills, POA, trusts | Yes | Yes |
| 15 | `home-manual` | `/modules/home-manual` | Home maintenance and access info | Yes | Yes |
| 16 | `anniversary-manager` | `/modules/anniversary-manager` | Date tracking and reminders | Yes | Yes |
| 17 | `visual-memories` | `/modules/visual-memories` | Photos and visual memories | Yes | Yes |
| 18 | `legacy-journal` | `/modules/legacy-journal` | Personal reflections and stories | Yes | Yes |
| 19 | `digital-guardian` | `/modules/digital-guardian` | Digital accounts and access | Yes | Yes |
| 20 | `advanced-registry` | `/modules/advanced-registry` | Extended asset tracking | Yes | Yes |
| 21 | `treasure-hunt` | `/modules/treasure-hunt` | Hidden treasures and locations | Yes | Yes |
| 22 | `qr-codes` | `/modules/qr-codes` | QR code labels for items | Yes | Yes |

### Hub/Dashboard Pages (4 modules)

These are landing pages that aggregate and display data from other modules.

| # | Module ID | Route | Description | Standards Scope |
|---|-----------|-------|-------------|-----------------|
| 1 | `family-hub` | `/modules/family-hub` | Family member management hub | Layout, cards, tone |
| 2 | `executor-toolkit` | `/modules/executor-toolkit` | Executor task dashboard | Layout, cards, tone |
| 3 | `analytics` | `/modules/analytics` | Estate analytics and insights | Charts, layout, tone |
| 4 | `activity-log` | `/modules/activity-log` | Activity history viewer | Table, layout, tone |

### Tool/Interactive Pages (3 modules)

Special-purpose utilities with unique interaction patterns.

| # | Module ID | Route | Description | Standards Scope |
|---|-----------|-------|-------------|-----------------|
| 1 | `simulator` | `/modules/simulator` | Estate scenario simulator | Core standards, tone |
| 2 | `scenario-mode` | `/modules/scenario-mode` | What-if planning tool | Core standards, tone |
| 3 | `pulse` | `/modules/pulse` | Welfare check-in system | Settings UI, tone |

### Guide/Read-Only Pages (2 modules)

Informational content without data entry.

| # | Module ID | Route | Description | Standards Scope |
|---|-----------|-------|-------------|-----------------|
| 1 | `executor-guide` | `/modules/executor-guide` | Guidance for executors | Typography, layout, tone |
| 2 | `builders-console` | `/modules/builders-console` | Admin/developer tools | Internal only |

---

## Standards Applicability Matrix

| Standard | Data Modules | Hubs | Tools | Guides |
|----------|--------------|------|-------|--------|
| **Section 1: Modal Standards** | REQUIRED | If applicable | If applicable | N/A |
| **Section 2: Form Input Standards** | REQUIRED | If applicable | If applicable | N/A |
| **Section 3: Button Standards** | REQUIRED | REQUIRED | REQUIRED | REQUIRED |
| **Section 4: Page Layout Standards** | REQUIRED | REQUIRED | REQUIRED | REQUIRED |
| **Section 5: Data Page Blueprint** | REQUIRED | Partial | Partial | N/A |
| **Section 6: Card Standards** | REQUIRED | REQUIRED | If applicable | If applicable |
| **Section 7: Icon Standards** | REQUIRED | REQUIRED | REQUIRED | REQUIRED |
| **Section 8: Typography Standards** | REQUIRED | REQUIRED | REQUIRED | REQUIRED |
| **Section 9: Spacing Standards** | REQUIRED | REQUIRED | REQUIRED | REQUIRED |
| **Section 10: Animation Standards** | REQUIRED | REQUIRED | REQUIRED | REQUIRED |
| **Section 11: Color Standards** | REQUIRED | REQUIRED | REQUIRED | REQUIRED |
| **Section 12: Empty State Standards** | REQUIRED | If applicable | If applicable | N/A |
| **Section 13: Action Placement** | REQUIRED | REQUIRED | REQUIRED | REQUIRED |
| **Section 14: Compassionate Language** | REQUIRED | REQUIRED | REQUIRED | REQUIRED |
| **Section 15: Context-Aware UI** | REQUIRED | REQUIRED | If applicable | REQUIRED |
| **Section 16: Implementation Checklist** | REQUIRED | Partial | Partial | Partial |
| **Section 17: Accessibility** | REQUIRED | REQUIRED | REQUIRED | REQUIRED |
| **Section 18: Form Validation** | REQUIRED | If applicable | If applicable | N/A |
| **Section 19: Responsive/Mobile** | REQUIRED | REQUIRED | REQUIRED | REQUIRED |
| **TONE_GUIDE.md** | REQUIRED | REQUIRED | REQUIRED | REQUIRED |

---

## Compliance Tracking

### Data Module Compliance Status

| Module | Modal | Forms | Blueprint | ViewToggle | SampleData | CustomFields | Tone | Overall |
|--------|-------|-------|-----------|------------|------------|--------------|------|---------|
| contacts | ⚠️ | ⚠️ | ✅ | ❌ | ❌ | ✅ | ⚠️ | 45% |
| medical | ⚠️ | ⚠️ | ✅ | ❌ | ✅ | ✅ | ⚠️ | 55% |
| pets | ⚠️ | ⚠️ | ✅ | ❌ | ❌ | ✅ | ⚠️ | 45% |
| heirlooms | ⚠️ | ⚠️ | ✅ | ❌ | ✅ | ✅ | ⚠️ | 55% |
| financial-accounts | ⚠️ | ⚠️ | ✅ | ❌ | ❌ | ❌ | ⚠️ | 35% |
| property | ⚠️ | ⚠️ | ✅ | ❌ | ✅ | ✅ | ⚠️ | 55% |
| insurance | ⚠️ | ⚠️ | ✅ | ❌ | ❌ | ✅ | ⚠️ | 45% |
| subscriptions | ⚠️ | ⚠️ | ✅ | ❌ | ❌ | ✅ | ⚠️ | 45% |
| letters | ⚠️ | ⚠️ | ✅ | ❌ | ❌ | ❌ | ⚠️ | 35% |
| time-capsule | ⚠️ | ⚠️ | ✅ | ❌ | ❌ | ✅ | ⚠️ | 45% |
| calendar | ⚠️ | ⚠️ | ✅ | ❌ | ❌ | ✅ | ⚠️ | 45% |
| timeline | ⚠️ | ⚠️ | ✅ | ❌ | ❌ | ✅ | ⚠️ | 45% |
| funeral | ⚠️ | ⚠️ | ✅ | ❌ | ❌ | ✅ | ⚠️ | 45% |
| legal-documents | ⚠️ | ⚠️ | ✅ | ❌ | ❌ | ❌ | ⚠️ | 35% |
| home-manual | ⚠️ | ⚠️ | ⚠️ | ❌ | ❌ | ❌ | ⚠️ | 25% |
| anniversary-manager | ⚠️ | ⚠️ | ⚠️ | ❌ | ❌ | ❌ | ⚠️ | 25% |
| visual-memories | ⚠️ | ⚠️ | ✅ | ❌ | ✅ | ❌ | ⚠️ | 45% |
| legacy-journal | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ⚠️ | 10% |
| digital-guardian | ⚠️ | ⚠️ | ✅ | ❌ | ✅ | ❌ | ⚠️ | 45% |
| advanced-registry | ⚠️ | ⚠️ | ✅ | ❌ | ❌ | ✅ | ⚠️ | 45% |
| treasure-hunt | ⚠️ | ⚠️ | ⚠️ | ❌ | ❌ | ❌ | ⚠️ | 25% |
| qr-codes | ⚠️ | ⚠️ | ⚠️ | ❌ | ❌ | ❌ | ⚠️ | 25% |

**Legend:** ✅ Compliant | ⚠️ Partial | ❌ Missing/Non-compliant

**Note:** SampleData compliance requires actual GhostRow rendering (5 modules verified compliant: medical, heirlooms, property, visual-memories, digital-guardian)

---

## Key Statistics

| Metric | Count |
|--------|-------|
| Total modules | 31 |
| Data modules (full compliance required) | 22 |
| Hub/dashboard pages | 4 |
| Tool/interactive pages | 3 |
| Guide/read-only pages | 2 |
| Modules with View Toggle | 0 / 22 (0%) |
| Modules with CustomFieldsManager | 12 / 22 (55%) |
| Modules with Sample Data (GhostRow) | 5 / 22 (23%) |
| Modules with standard Modal | 0 / 22 (0%) |

---

## File Locations

Each module follows this structure:

```
frontend/src/routes/modules/{module-id}/
├── +page.svelte          # Main page component
├── +page.ts              # Load function (if needed)
└── {ModuleName}Card.svelte   # Card component (if exists)
```

**Store files:** `frontend/src/lib/stores/{moduleName}Store.svelte.ts`
**Backend routers:** `backend/routers/{domain}.py`

---

## Adding a New Module

When creating a new module:

1. Add entry to this registry
2. Follow ALL standards in `UI_CONSISTENCY_STANDARDS.md`
3. Follow ALL language patterns in `TONE_GUIDE.md`
4. Use `ui-standards-enforcer` agent to validate
5. Run `ui-standards-auditor` agent before PR

---

## Document History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-01-26 | Initial registry created |

---

**This document is the authoritative list of all Continuum modules. Keep it updated when adding or removing modules.**
