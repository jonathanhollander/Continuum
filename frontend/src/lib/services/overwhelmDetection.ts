/**
 * Overwhelm Detector Service
 * Implements Issue #17 - Proactive support for users during difficult planning moments
 *
 * Monitors user behavior for signs of overwhelm and offers gentle support:
 * - Rapid navigation between pages (user seems lost)
 * - Extended time on emotionally heavy pages without interaction
 * - Abandoned form submissions
 * - Repeated back-button usage
 */
import { writable, type Writable } from 'svelte/store';
import { logger } from '../utils/logger';

export interface OverwhelmState {
    isOverwhelmed: boolean;
    signals: string[];
    triggerReason?: string;
}

// Pages that are emotionally heavy and warrant extra monitoring
const EMOTIONALLY_HEAVY_PAGES = [
    '/modules/funeral',
    '/modules/medical',
    '/modules/letters',
    '/modules/time-capsule',
    '/modules/pulse'
];

class OverwhelmDetector {
    private lastNavTime: number = Date.now();
    private navCount: number = 0;
    private errorCount: number = 0;
    private startTime: number = Date.now();
    private currentPath: string = '';
    private pageEntryTime: number = Date.now();
    private lastInteractionTime: number = Date.now();
    private backButtonCount: number = 0;
    private formAbandonments: Map<string, number> = new Map();
    private inactivityCheckInterval?: number;

    // Configurable thresholds
    private RAPID_NAV_COUNT = 6; // navigations (increased from 3 to 6)
    private RAPID_NAV_WINDOW = 60000; // 60 seconds (increased from 30 to 60)
    private ERROR_THRESHOLD = 5; // errors in a session
    private SESSION_LENGTH_THRESHOLD = 30 * 60 * 1000; // 30 minutes
    private HEAVY_PAGE_DWELL_TIME = 5 * 60 * 1000; // 5 minutes on heavy page without interaction
    private INACTIVITY_CHECK_INTERVAL = 60000; // Check every minute
    private BACK_BUTTON_THRESHOLD = 3; // 3+ back navigations in quick succession
    private FORM_ABANDON_THRESHOLD = 2; // abandoning same form twice

    public state: Writable<OverwhelmState> = writable({
        isOverwhelmed: false,
        signals: []
    });

    constructor() {
        logger.debug('OverwhelmDetector initialized');
        this.startInactivityMonitoring();
    }

    /**
     * Start monitoring for inactivity on heavy pages
     */
    private startInactivityMonitoring() {
        if (typeof window === 'undefined') return;

        // Check for prolonged inactivity every minute
        this.inactivityCheckInterval = window.setInterval(() => {
            this.checkInactivity();
        }, this.INACTIVITY_CHECK_INTERVAL);

        // Track user interactions to reset inactivity timer
        const activityEvents = ['mousedown', 'keydown', 'scroll', 'touchstart'];
        activityEvents.forEach(event => {
            window.addEventListener(event, () => {
                this.lastInteractionTime = Date.now();
            }, { passive: true });
        });
    }

    /**
     * Check if user has been inactive on a heavy page for too long
     */
    private checkInactivity() {
        const isOnHeavyPage = EMOTIONALLY_HEAVY_PAGES.some(path =>
            this.currentPath.includes(path)
        );

        if (!isOnHeavyPage) return;

        const timeSinceInteraction = Date.now() - this.lastInteractionTime;
        const timeOnPage = Date.now() - this.pageEntryTime;

        // User has been on heavy page for 5+ minutes without interaction
        if (timeOnPage > this.HEAVY_PAGE_DWELL_TIME &&
            timeSinceInteraction > this.HEAVY_PAGE_DWELL_TIME) {

            logger.info('Detected prolonged inactivity on emotionally heavy page', {
                path: this.currentPath,
                timeOnPage: Math.round(timeOnPage / 1000) + 's',
                timeSinceInteraction: Math.round(timeSinceInteraction / 1000) + 's'
            });

            this.triggerOverwhelm(['prolonged_heavy_page'],
                'You\'ve been on this page for a while. This content can be emotionally challenging.');
        }
    }

    /**
     * Track a navigation event
     */
    recordNavigation(path?: string) {
        const now = Date.now();
        const timeDiff = now - this.lastNavTime;

        // Update current path and reset page timers
        if (path) {
            this.currentPath = path;
            this.pageEntryTime = now;
            this.lastInteractionTime = now;
        }

        // Detect rapid navigation (3+ page changes within 30 seconds)
        if (timeDiff < this.RAPID_NAV_WINDOW) {
            this.navCount++;
        } else {
            this.navCount = 1;
        }

        this.lastNavTime = now;
        this.evaluate();
    }

    /**
     * Track back button usage
     */
    recordBackButton() {
        this.backButtonCount++;

        if (this.backButtonCount >= this.BACK_BUTTON_THRESHOLD) {
            logger.info('Detected repeated back button usage', {
                count: this.backButtonCount
            });

            this.triggerOverwhelm(['repeated_back_navigation'],
                'It looks like you\'re searching for something. We\'re here to help.');
        }

        // Reset back button count after 10 seconds
        setTimeout(() => {
            this.backButtonCount = 0;
        }, 10000);
    }

    /**
     * Track form abandonment (user started form but navigated away)
     */
    recordFormAbandonment(formId: string) {
        const abandonCount = (this.formAbandonments.get(formId) || 0) + 1;
        this.formAbandonments.set(formId, abandonCount);

        logger.debug('Form abandonment recorded', { formId, count: abandonCount });

        if (abandonCount >= this.FORM_ABANDON_THRESHOLD) {
            this.triggerOverwhelm(['repeated_form_abandonment'],
                'We noticed this section might be difficult. Would you like some help or a simplified view?');
        }
    }

    /**
     * Track an error occurrence
     */
    recordError() {
        this.errorCount++;
        this.evaluate();
    }

    /**
     * Manual trigger for "I need a break" button
     */
    requestBreak() {
        logger.info('User explicitly requested a break');
        this.triggerOverwhelm(['user_requested_break'],
            'Taking a moment for yourself is important. Your work is safe.');
    }

    /**
     * Evaluate signals and update state
     */
    private evaluate() {
        const signals: string[] = [];

        if (this.navCount >= this.RAPID_NAV_COUNT) {
            signals.push('rapid_navigation');
        }

        if (this.errorCount >= this.ERROR_THRESHOLD) {
            signals.push('high_error_rate');
        }

        const sessionDuration = Date.now() - this.startTime;
        if (sessionDuration > this.SESSION_LENGTH_THRESHOLD) {
            signals.push('long_session');
        }

        if (signals.length > 0) {
            logger.info('Overwhelm signals detected', { signals });
            this.triggerOverwhelm(signals);
        }
    }

    /**
     * Trigger overwhelm state with specific signals and message
     */
    public triggerOverwhelm(signals: string[], reason?: string) {
        this.state.set({
            isOverwhelmed: true,
            signals,
            triggerReason: reason
        });
    }

    /**
     * Reset the overwhelm state
     */
    reset() {
        this.navCount = 0;
        this.errorCount = 0;
        this.backButtonCount = 0;
        this.startTime = Date.now();
        this.state.set({
            isOverwhelmed: false,
            signals: []
        });
        logger.info('Overwhelm state reset');
    }

    /**
     * Cleanup when service is destroyed
     */
    destroy() {
        if (this.inactivityCheckInterval) {
            clearInterval(this.inactivityCheckInterval);
        }
    }
}

export const overwhelmDetector = new OverwhelmDetector();
export const overwhelmState = overwhelmDetector.state;
