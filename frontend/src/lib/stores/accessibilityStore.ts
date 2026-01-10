import { writable } from 'svelte/store';
import { browser } from '$app/environment';

interface AccessibilityState {
    highContrast: boolean;
    reducedMotion: boolean;
    fontSize: 'normal' | 'large' | 'xlarge' | 'max';
    // New Theme & Color Props
    theme: 'light' | 'dark' | 'system';
    color: 'teal' | 'indigo' | 'emerald' | 'rose' | 'amber' | 'slate';
}

const STORAGE_KEY = 'continuum_accessibility';

function createAccessibilityStore() {
    const defaults: AccessibilityState = {
        highContrast: false,
        reducedMotion: false,
        fontSize: 'normal',
        theme: 'light',
        color: 'slate'
    };

    const initial: AccessibilityState = browser ? (JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null') || defaults) : defaults;

    // Ensure backwards compatibility by merging defaults if keys are missing
    if (browser && !initial.theme) {
        initial.theme = defaults.theme;
        initial.color = defaults.color;
    }

    const { subscribe, set, update } = writable<AccessibilityState>(initial);

    if (browser) {
        subscribe(value => {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(value));

            // Apply to body classes
            const body = document.body;

            // 1. Accessibility
            value.highContrast ? body.classList.add('accessibility-high-contrast') : body.classList.remove('accessibility-high-contrast');
            value.reducedMotion ? body.classList.add('accessibility-reduced-motion') : body.classList.remove('accessibility-reduced-motion');

            // 2. Font Size
            body.classList.remove('font-size-large', 'font-size-xlarge', 'font-size-max');
            if (value.fontSize !== 'normal') body.classList.add(`font-size-${value.fontSize}`);

            // 3. Theme
            body.classList.remove('theme-light', 'theme-dark', 'theme-system');
            body.classList.add(`theme-${value.theme}`);

            // 4. Color
            // Remove any existing color class
            const classes = Array.from(body.classList);
            classes.forEach(c => {
                if (c.startsWith('theme-color-')) body.classList.remove(c);
            });
            body.classList.add(`theme-color-${value.color}`);
        });
    }

    return {
        subscribe,
        toggleHighContrast: () => update(s => ({ ...s, highContrast: !s.highContrast })),
        toggleReducedMotion: () => update(s => ({ ...s, reducedMotion: !s.reducedMotion })),
        setFontSize: (size: AccessibilityState['fontSize']) => update(s => ({ ...s, fontSize: size })),

        // New Methods
        setTheme: (theme: AccessibilityState['theme']) => update(s => ({ ...s, theme })),
        setColor: (color: AccessibilityState['color']) => update(s => ({ ...s, color })),
        resetDefaults: () => update(s => ({ ...s, color: 'slate' })) // Only resets color as requested
    };
}

export const accessibilityStore = createAccessibilityStore();
