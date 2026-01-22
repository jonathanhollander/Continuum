# Testing Guide: Context-Aware Messaging

## Manual Testing Checklist

This guide provides step-by-step instructions to verify the context-aware messaging system works correctly.

## Prerequisites

1. Start the backend: `cd backend && python main.py`
2. Start the frontend: `cd frontend && npm run dev`
3. Open browser to http://localhost:5173
4. Login with dev account: `dev@continuum.im` / `dev123`

## Test 1: Role Switcher Visibility

**Expected**: Role switcher appears in header (desktop view only)

### Steps
1. Navigate to http://localhost:5173/dashboard
2. Look at the top-right header
3. Find the role switcher button (should show current role with icon)

**Pass Criteria**:
- ✅ Role switcher visible on desktop (≥1024px width)
- ✅ Shows current role (default: "Planning (Owner)")
- ✅ Icon present (UserCog icon)

## Test 2: Role Switching

**Expected**: Clicking role switcher changes language throughout app

### Steps
1. On Dashboard, note the greeting text (should be "Welcome back" or similar)
2. Click the Role Switcher in header
3. Select "Executor Mode"
4. Observe Dashboard greeting changes
5. Switch to "Family Member"
6. Observe greeting changes again
7. Switch back to "Planning (Owner)"

**Pass Criteria**:
- ✅ Dropdown opens when clicked
- ✅ All 4 roles visible (Planning, Executor, Family, Advisor)
- ✅ Current role highlighted
- ✅ Dashboard greeting changes immediately when role changes
- ✅ Dropdown closes after selection

**Expected Results by Role**:
- Planning: "Welcome back"
- Executor: "Executor Dashboard"
- Family: "Family Portal"
- Advisor: "Advisor Portal"

## Test 3: Dashboard Focus Card Adaptation

**Expected**: Focus card messages adapt to role

### Steps
1. Set role to "Planning (Owner)"
2. Observe Focus Card title and description
3. Switch to "Executor Mode"
4. Observe Focus Card changes
5. Switch to "Family Member"
6. Observe Focus Card changes

**Pass Criteria (if estate score = 0)**:
- ✅ Planning: "System Initialization Required"
- ✅ Executor: "Estate Information Needed"
- ✅ Family: "Estate Information Needed"

**Pass Criteria (if estate score = 100)**:
- ✅ Planning: "Legacy Secured"
- ✅ Executor: "Estate Documentation Complete"
- ✅ Family: "Information Available"

## Test 4: Contacts Module Header

**Expected**: Contacts page header subtitle changes based on role

### Steps
1. Navigate to http://localhost:5173/modules/contacts
2. Set role to "Planning (Owner)"
3. Note the subtitle under "Contacts" header
4. Switch to "Executor Mode"
5. Note the subtitle changes
6. Switch to "Family Member"
7. Note the subtitle changes

**Pass Criteria**:
- ✅ Planning: (Original module description from registry)
- ✅ Executor: "Important contacts and relationships to notify or consult"
- ✅ Family: "Family and friends connected to the estate"

## Test 5: Contacts Empty State

**Expected**: Empty state message adapts to role

### Steps
1. Navigate to http://localhost:5173/modules/contacts
2. If you have contacts, delete them all (or use fresh dev account)
3. Set role to "Planning (Owner)"
4. Read the empty state message
5. Switch to "Executor Mode"
6. Read the empty state message
7. Switch to "Family Member"
8. Read the empty state message

**Pass Criteria**:
- ✅ Planning: "Start building your trusted circle. Add the people who matter most."
- ✅ Executor: "No contacts have been recorded yet. You may need to gather this information from other sources."
- ✅ Family: "Contact information hasn't been added yet. This will be helpful when it's available."

## Test 6: Persistence After Refresh

**Expected**: Role persists in contextStore across page refreshes

### Steps
1. Set role to "Executor Mode"
2. Refresh the page (F5 or Cmd+R)
3. Check if role is still "Executor Mode"

**Pass Criteria**:
- ✅ Role persists in contextStore after refresh
- ⚠️ **Note**: Role is NOT yet persisted to database, so it will reset on logout/login

## Test 7: Mobile Responsiveness

**Expected**: Role switcher behavior on mobile

### Steps
1. Resize browser to mobile width (<768px)
2. Look for role switcher in header

**Pass Criteria**:
- ✅ Role switcher still functional on mobile
- ✅ Shows abbreviated label or icon only
- ✅ Dropdown still accessible

## Test 8: TypeScript Type Safety

**Expected**: No TypeScript errors related to context messaging

### Steps
1. Run `npm run check` in frontend directory
2. Look for errors mentioning:
   - contextStore
   - contextualMessages
   - ContextualMessage
   - RoleSwitcher

**Pass Criteria**:
- ✅ No TypeScript errors in context-aware messaging files
- ✅ Only pre-existing errors (unrelated to this feature)

## Test 9: Accessibility

**Expected**: Role switcher is keyboard accessible

### Steps
1. Click in browser address bar
2. Press Tab repeatedly until role switcher is focused
3. Press Enter to open dropdown
4. Use arrow keys to navigate roles
5. Press Enter to select a role
6. Press Escape to close dropdown without selecting

**Pass Criteria**:
- ✅ Role switcher receives keyboard focus
- ✅ Enter opens dropdown
- ✅ Arrow keys navigate options
- ✅ Enter selects option
- ✅ Escape closes dropdown
- ✅ Proper ARIA labels present

## Test 10: Integration with Auth System

**Expected**: Role syncs from backend on login

### Steps
1. Logout of application
2. Login again with `dev@continuum.im` / `dev123`
3. Check role in contextStore (should be "planning" - default)
4. Verify dashboard greeting matches planning role

**Pass Criteria**:
- ✅ contextStore.role = "planning" after login
- ✅ Dashboard shows planning-appropriate language
- ✅ No console errors related to context sync

## Advanced Test 11: Emotional Context (Future)

**Expected**: Grief-aware language when emotional_context is set

### Steps
1. In browser console, run:
   ```javascript
   import { contextStore } from '/src/lib/stores/contextStore.svelte.ts';
   contextStore.setEmotionalContext('grieving');
   ```
2. Set role to "Executor Mode"
3. Check Dashboard greeting

**Expected Result**:
- Greeting should be "We're here to help" (grief-aware)

**Note**: This is manual testing. In production, emotional_context would be set in backend and synced automatically.

## Known Limitations

1. **Role not persisted to backend yet**
   - Role changes only stored in frontend contextStore
   - Resets on logout/login
   - Future: Add Settings page to persist role changes

2. **Deceased name not implemented**
   - "their estate" instead of "[name]'s estate"
   - Future: Add deceased name input to Settings

3. **Limited modules updated**
   - Only Dashboard and Contacts use context-aware messaging
   - Future: Expand to Medical, Documents, Financial, etc.

4. **Old role switcher still in code**
   - Original role switcher from concierge store still exists
   - Replaced in UI but code still present
   - Future: Remove old implementation

## Regression Testing

Verify existing features still work:

- ✅ Login/Logout still functional
- ✅ Dashboard loads without errors
- ✅ Contacts module still works
- ✅ Adding/deleting contacts still works
- ✅ Navigation between modules still works
- ✅ AI Concierge still opens
- ✅ Settings page still accessible

## Performance Testing

Check for performance issues:

- ✅ Page load time not significantly increased
- ✅ Role switching happens instantly (<100ms)
- ✅ No memory leaks from reactive stores
- ✅ No console warnings or errors

## Browser Compatibility

Test in multiple browsers:

- ✅ Chrome/Edge (Chromium)
- ✅ Firefox
- ✅ Safari
- ✅ Mobile Safari (iOS)
- ✅ Chrome Mobile (Android)

## Console Errors to Watch For

Common issues that might appear:

1. **"Cannot find module 'contextStore'"**
   - Solution: Check import paths are correct

2. **"contextStore is not defined"**
   - Solution: Ensure contextStore is imported before use

3. **"Cannot read property 'role' of undefined"**
   - Solution: Check contextStore is initialized

4. **"Maximum call stack size exceeded"**
   - Solution: Check for infinite reactivity loops in $effect

5. **Type errors in IDE**
   - Solution: Run `npm run check` to verify types

## Success Criteria Summary

The context-aware messaging system is working correctly if:

- ✅ All 10 manual tests pass
- ✅ No new TypeScript errors
- ✅ No console errors or warnings
- ✅ Language changes are immediate and accurate
- ✅ Role switcher is accessible and functional
- ✅ Existing features still work correctly
- ✅ Performance is not degraded

## Reporting Issues

If tests fail, document:
1. Which test failed
2. Expected vs actual behavior
3. Browser and version
4. Console errors (if any)
5. Screenshots (if visual issue)
6. Steps to reproduce

## Next Steps After Testing

Once all tests pass:

1. Expand to more modules (Medical, Documents, etc.)
2. Add Settings page for role selection
3. Implement deceased name personalization
4. Add backend persistence for role changes
5. Create automated E2E tests (if project adopts testing)

---

**Last Updated**: January 22, 2026
**Test Coverage**: Manual verification only (per project policy)
**Estimated Test Time**: 15-20 minutes
