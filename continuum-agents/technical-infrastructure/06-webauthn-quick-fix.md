# Agent 06: WebAuthn Quick Fix
**Priority:** P0 - CRITICAL (Quick Win)
**Estimated Time:** 5 minutes
**Dependencies:** None
**Category:** Technical Infrastructure

---

## OBJECTIVE

Fix broken biometric authentication by adding missing import statement to Pulse settings page.

**Current Issue:**
- Line 188 calls `startRegistration(options)` but function is never imported
- Will crash with `ReferenceError: startRegistration is not defined`
- @simplewebauthn/browser package is installed but not imported

**Expected Outcome:**
- Import added to file
- Biometric authentication functional
- No runtime errors

---

## FILES TO MODIFY

### 1. `/frontend/src/routes/modules/pulse/settings/+page.svelte`
**Change:** Add missing import at top of file

---

## IMPLEMENTATION

### Step 1: Read Current File
```bash
Read /frontend/src/routes/modules/pulse/settings/+page.svelte
```

### Step 2: Add Import Statement
**Location:** Top of `<script>` tag (after existing imports)

**Add this line:**
```typescript
import { startRegistration, startAuthentication } from '@simplewebauthn/browser';
```

**Insert after** line that imports other components/utilities.

### Step 3: Verify Import Used
**Check that these functions are called:**
- `startRegistration` (around line 188)
- `startAuthentication` (if present)

---

## EXACT CHANGES

### File: `/frontend/src/routes/modules/pulse/settings/+page.svelte`

**Find the import section** (top of `<script>` tag):
```typescript
<script lang="ts">
  import { /* existing imports */ }
  // Other imports...
```

**Add after existing imports:**
```typescript
  import { startRegistration, startAuthentication } from '@simplewebauthn/browser';
```

---

## VALIDATION

### Pre-Commit Checks:
```bash
# TypeScript validation
cd frontend && npm run check

# Build test
cd frontend && npm run build

# Verify no errors
echo "Check output for errors related to startRegistration"
```

### Expected Results:
- ✅ No TypeScript errors
- ✅ Build succeeds
- ✅ No "startRegistration is not defined" errors

---

## SUCCESS CRITERIA

- [ ] Import statement added to file
- [ ] TypeScript compilation successful
- [ ] Build completes without errors
- [ ] Function `startRegistration` is now defined
- [ ] Function `startAuthentication` is now defined
- [ ] No runtime errors when clicking "Connect Biometric"

---

## TESTING

### Manual Test:
1. Navigate to `/modules/pulse/settings`
2. Click "Connect Biometric" button
3. Verify browser WebAuthn prompt appears (or graceful error if browser doesn't support)
4. No console errors appear

### Automated Test:
```bash
cd frontend
npm run check
npm run build
```

---

## ROLLBACK

### If Issues Occur:
```bash
git checkout HEAD -- frontend/src/routes/modules/pulse/settings/+page.svelte
```

**Or manually remove the import line.**

---

## COMMIT MESSAGE

```
fix(webauthn): add missing import for biometric authentication

Add missing import for @simplewebauthn/browser functions that are
called but never imported in Pulse settings page.

Issue:
- startRegistration() called on line 188 without import
- Causes ReferenceError at runtime when user clicks "Connect Biometric"
- @simplewebauthn/browser package installed but not imported

Fix:
- Add import { startRegistration, startAuthentication } from '@simplewebauthn/browser'
- Import added to top of script section

Impact:
- Biometric authentication now functional
- No runtime errors when using WebAuthn
- Users can register biometric check-in methods

Testing:
- TypeScript compilation passes
- Build succeeds
- Manual test: Connect Biometric button works

Closes: WebAuthn broken feature
Ref: CODEBASE_REVIEW_REPORT.md issue #2
```

---

## NOTES

- This is a trivial fix but critical for premium feature
- Package already installed in package.json
- No other changes needed
- Should take < 5 minutes

---

**READY TO EXECUTE**

Claude: Read this specification and execute immediately.
