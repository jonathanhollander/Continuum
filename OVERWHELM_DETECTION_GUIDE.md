# Overwhelm Detection System - Implementation Guide

## Overview

The Overwhelm Detection System proactively monitors user behavior and offers gentle support when users show signs of struggle or distress. This is especially important in Continuum SaaS given the emotionally sensitive nature of end-of-life planning.

**Status**: ✅ Implemented (Issue #17)

---

## Architecture

### Core Components

1. **Detection Service** (`frontend/src/lib/services/overwhelmDetection.ts`)
   - Monitors user behavior for overwhelm signals
   - Triggers interventions when thresholds are met
   - Provides state management via Svelte store

2. **Intervention UI** (`frontend/src/lib/components/BreakOffer.svelte`)
   - Non-intrusive modal offering support options
   - Full break experience with breathing guidance
   - Multiple support pathways

3. **Form Tracking** (`frontend/src/lib/utils/formTracking.ts`)
   - Tracks form lifecycle (start, interaction, completion, abandonment)
   - Provides Svelte action for automatic tracking

4. **Manual Trigger** (`frontend/src/lib/components/TakeBreakButton.svelte`)
   - Always-available button for users to request a break
   - Integrated in main header

---

## Detection Signals

### 1. Rapid Navigation
**Trigger**: 3+ page navigations within 30 seconds

**Interpretation**: User appears lost or searching for something

**Implementation**:
```typescript
overwhelmDetector.recordNavigation(path);
```

**Auto-tracked**: Yes (in `+layout.svelte`)

---

### 2. Prolonged Inactivity on Heavy Pages
**Trigger**: 5+ minutes on emotionally heavy page without interaction

**Heavy Pages**:
- `/modules/funeral` - Funeral planning
- `/modules/medical` - Medical directives
- `/modules/letters` - Legacy letters
- `/modules/time-capsule` - Time capsule messages
- `/modules/pulse` - Welfare check-in system

**Interpretation**: User may be processing difficult content

**Implementation**: Automatic via interval checker in service

---

### 3. Repeated Back Button Usage
**Trigger**: 3+ back navigations in quick succession

**Interpretation**: User searching for something or lost

**Implementation**:
```typescript
overwhelmDetector.recordBackButton();
```

**Auto-tracked**: Yes (in `+layout.svelte` via path depth heuristic)

---

### 4. Form Abandonment
**Trigger**: User abandons same form 2+ times in a session

**Interpretation**: Form may be too complex or emotionally difficult

**Implementation**:
```svelte
<script>
import { trackForm } from '$lib/utils/formTracking';
</script>

<form use:trackForm={{ id: 'funeral-wishes', onSubmit: handleSubmit }}>
  <!-- form fields -->
</form>
```

**Manual tracking also available**:
```typescript
import { trackFormStart, trackFormInteraction, trackFormComplete, trackFormAbandon } from '$lib/utils/formTracking';

// When form mounts
trackFormStart('my-form-id');

// On first input
trackFormInteraction('my-form-id');

// On successful submit
trackFormComplete('my-form-id');

// On navigation away
trackFormAbandon('my-form-id');
```

---

### 5. High Error Rate
**Trigger**: 5+ errors in a session

**Interpretation**: User experiencing technical difficulties

**Implementation**: Already integrated via `errorHandler.ts` → `logError()` → `overwhelmDetector.recordError()`

---

### 6. Long Session
**Trigger**: 30+ minutes of continuous work

**Interpretation**: User may be fatigued

**Implementation**: Automatic via elapsed time since session start

---

### 7. Manual Request
**Trigger**: User clicks "Take a Break" button

**Implementation**:
```typescript
overwhelmDetector.requestBreak();
```

**Auto-available**: Yes (TakeBreakButton in header)

---

## User Experience Flow

### Initial Intervention

When overwhelm is detected, user sees a gentle modal with options:

1. **Take a mindful break**
   - Launches full-screen calming experience
   - Breathing guidance
   - Timer showing break duration
   - Gentle return prompt after 3 minutes

2. **Show me less at once**
   - Triggers `continuum:simplify-view` event
   - Currently shows notification
   - TODO: Implement actual simplified view mode

3. **I need some guidance**
   - Triggers `continuum:request-help` event
   - Opens AI Concierge
   - Context-aware help

4. **I'm okay to continue**
   - Dismisses modal
   - Resets detection state

### Break Experience

Full-screen calming overlay with:
- Animated breathing circle (4-second pulse)
- Timer showing break duration (MM:SS)
- Breathing instruction: "Breathe in for 4, hold for 4, out for 4"
- Gentle suggestion to return after 3 minutes
- "Ready to continue" button (always visible)

**Design Philosophy**:
- Non-demanding (user can return anytime)
- Calming visuals (teal gradient, soft animations)
- Reassurance that work is saved
- Respects user autonomy

---

## Integration Points

### 1. Layout Integration

The overwhelm detection system is integrated at the root layout level:

```svelte
<!-- frontend/src/routes/+layout.svelte -->

import { overwhelmDetector, overwhelmState } from "$lib/services/overwhelmDetection";
import BreakOffer from "$lib/components/BreakOffer.svelte";

<!-- Track navigation -->
$effect(() => {
    if ($page.url.pathname) {
        overwhelmDetector.recordNavigation($page.url.pathname);
    }
});

<!-- Show intervention when triggered -->
{#if $overwhelmState.isOverwhelmed}
    <BreakOffer signals={$overwhelmState.signals} />
{/if}
```

### 2. Error Handler Integration

Errors automatically contribute to overwhelm detection:

```typescript
// frontend/src/lib/services/errorHandler.ts

export function logError(error: ErrorDetails, context?: string) {
    logger.error(`[Error] ${context || 'Unknown context'}`, error);
    overwhelmDetector.recordError(); // Automatic integration
}
```

### 3. Custom Events

The system emits custom events that components can listen for:

```typescript
// Simplified view requested
window.addEventListener('continuum:simplify-view', () => {
    // Implement simplified view logic
});

// Help requested
window.addEventListener('continuum:request-help', () => {
    // Open help resources or AI Concierge
});
```

---

## Configuration

### Thresholds (Configurable in `overwhelmDetection.ts`)

```typescript
private RAPID_NAV_COUNT = 3; // navigations
private RAPID_NAV_WINDOW = 30000; // 30 seconds
private ERROR_THRESHOLD = 5; // errors in session
private SESSION_LENGTH_THRESHOLD = 30 * 60 * 1000; // 30 minutes
private HEAVY_PAGE_DWELL_TIME = 5 * 60 * 1000; // 5 minutes without interaction
private BACK_BUTTON_THRESHOLD = 3; // back navigations
private FORM_ABANDON_THRESHOLD = 2; // abandoning same form
```

### Emotionally Heavy Pages

Add/remove pages in `overwhelmDetection.ts`:

```typescript
const EMOTIONALLY_HEAVY_PAGES = [
    '/modules/funeral',
    '/modules/medical',
    '/modules/letters',
    '/modules/time-capsule',
    '/modules/pulse'
];
```

---

## Adding Form Tracking to Existing Forms

### Method 1: Svelte Action (Recommended)

```svelte
<script>
import { trackForm } from '$lib/utils/formTracking';

function handleSubmit() {
    // Your submit logic
}
</script>

<form use:trackForm={{ id: 'funeral-preferences', onSubmit: handleSubmit }}>
    <input type="text" name="preference" />
    <button type="submit">Save</button>
</form>
```

### Method 2: Manual Tracking

```svelte
<script>
import { onMount, onDestroy } from 'svelte';
import { trackFormStart, trackFormInteraction, trackFormComplete, trackFormAbandon } from '$lib/utils/formTracking';

const formId = 'funeral-preferences';
let hasInteracted = $state(false);

onMount(() => {
    trackFormStart(formId);
});

function handleInput() {
    if (!hasInteracted) {
        trackFormInteraction(formId);
        hasInteracted = true;
    }
}

function handleSubmit() {
    trackFormComplete(formId);
    // Your submit logic
}

onDestroy(() => {
    // Check if form was submitted
    if (hasInteracted && !submitted) {
        trackFormAbandon(formId);
    }
});
</script>

<form on:input={handleInput} on:submit={handleSubmit}>
    <!-- form fields -->
</form>
```

---

## Testing the System

### 1. Test Rapid Navigation
1. Navigate to dashboard
2. Quickly click through 3+ different pages within 30 seconds
3. Should see overwhelm intervention modal

### 2. Test Heavy Page Inactivity
1. Navigate to `/modules/funeral`
2. Leave page open without interaction for 5+ minutes
3. Should see overwhelm intervention

### 3. Test Back Button Detection
1. Navigate deep into a module
2. Click back button 3+ times quickly
3. Should see intervention

### 4. Test Form Abandonment
1. Start filling out a form
2. Navigate away without submitting
3. Return and start same form again
4. Navigate away again without submitting
5. Should see intervention

### 5. Test Manual Trigger
1. Click "Take a Break" button in header (pause icon)
2. Should immediately see intervention modal

### 6. Test Break Experience
1. Trigger intervention (any method)
2. Click "Take a mindful break"
3. Should see full-screen calming overlay with timer
4. Wait 3 minutes → should see "ready to return" suggestion
5. Click "Ready to continue" → returns to app

---

## Logging and Monitoring

All overwhelm events are logged via the centralized logger:

```typescript
logger.info('Overwhelm signals detected', { signals });
logger.info('User dismissed break offer', { signals });
logger.info('User accepted break offer', { signals });
logger.info('Form abandoned', { formId, duration });
```

**Log Location**: Console (development) + rotating file logs (production)

**Metrics to Monitor**:
- Overwhelm trigger frequency
- Most common signals
- User response to interventions (dismiss vs. accept)
- Average break duration
- Form abandonment rates by form ID

---

## Future Enhancements

### 1. Simplified View Mode
Implement actual simplified view when user selects "Show me less at once":
- Hide optional fields
- Collapse advanced sections
- Show step-by-step wizard instead of full form
- Provide "Show full view" toggle

### 2. Contextual Help
Improve help pathway:
- Context-aware help articles based on current page
- Video tutorials for complex sections
- Live chat option for urgent support

### 3. User Preferences
Allow users to configure:
- Overwhelm detection sensitivity
- Disable specific signals
- Preferred support pathways
- Break duration preferences

### 4. Analytics Dashboard
Admin view showing:
- Overwhelm frequency by page
- Common user struggle points
- Intervention acceptance rates
- Form abandonment hotspots

### 5. Proactive Suggestions
Before user starts difficult section:
- "This section covers sensitive topics. Take your time."
- "Would you like to enable simplified mode for this section?"
- Offer to save progress and return later

---

## Accessibility Considerations

1. **Keyboard Navigation**: All buttons and modals are keyboard accessible
2. **ARIA Labels**: Intervention modal has proper `role="dialog"` and `aria-labelledby`
3. **Screen Readers**: All actions have descriptive labels
4. **Focus Management**: Modal traps focus while open
5. **Color Contrast**: Meets WCAG AA standards

---

## Privacy & Data

**What is tracked**:
- Navigation patterns (paths, timing)
- Error occurrences (count only)
- Form interaction (start, complete, abandon)
- User selections (break, help, dismiss)

**What is NOT tracked**:
- Form field contents
- Personal information
- User keystrokes
- Mouse movements

**Storage**: All detection state is session-only (not persisted)

---

## Related Files

- `/frontend/src/lib/services/overwhelmDetection.ts` - Detection service
- `/frontend/src/lib/components/BreakOffer.svelte` - Intervention UI
- `/frontend/src/lib/components/TakeBreakButton.svelte` - Manual trigger button
- `/frontend/src/lib/utils/formTracking.ts` - Form tracking utilities
- `/frontend/src/routes/+layout.svelte` - Integration point
- `/frontend/src/lib/services/errorHandler.ts` - Error integration

---

## Support

For questions or issues:
1. Check console logs for debugging info
2. Verify detection thresholds are appropriate
3. Test in isolation (trigger specific signals)
4. Review event listeners in layout

**Common Issues**:
- **Modal not appearing**: Check `$overwhelmState.isOverwhelmed` in Svelte DevTools
- **Form tracking not working**: Verify `trackForm` action is applied correctly
- **Break screen stuck**: Check for JavaScript errors in console
- **Events not firing**: Verify event listeners are registered in `onMount()`

---

## Compassionate Design Principles Applied

1. **Non-Intrusive**: Modal only appears after clear signals, not randomly
2. **User Autonomy**: Always option to dismiss or continue
3. **Gentle Language**: "Would you like..." not "You must..."
4. **Reassurance**: "Your progress is safe" messaging
5. **Multiple Pathways**: Break, simplify, help, or continue
6. **No Shame**: Never implies user is "doing it wrong"
7. **Respect Time**: Break is optional, not forced
8. **Calming Aesthetics**: Teal colors, soft animations, breathing guidance

---

*Last Updated: January 2026 - Implementation of Issue #17*
