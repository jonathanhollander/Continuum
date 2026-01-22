/**
 * Overwhelm Detector Service
 * Implements Issue #17
 */
import { writable, type Writable } from 'svelte/store';
import { logger } from '../utils/logger';

export interface OverwhelmState {
    isOverwhelmed: boolean;
    signals: string[];
}

class OverwhelmDetector {
    private lastNavTime: number = Date.now();
    private navCount: number = 0;
    private errorCount: number = 0;
    private startTime: number = Date.now();

    // Configurable thresholds
    private NAV_SPEED_THRESHOLD = 3; // navigations in 10 seconds
    private ERROR_THRESHOLD = 5; // errors in a session
    private SESSION_LENGTH_THRESHOLD = 30 * 60 * 1000; // 30 minutes

    public state: Writable<OverwhelmState> = writable({
        isOverwhelmed: false,
        signals: []
    });

    constructor() {
        logger.debug('OverwhelmDetector initialized');
    }

    /**
     * Track a navigation event
     */
    recordNavigation() {
        const now = Date.now();
        const timeDiff = now - this.lastNavTime;

        if (timeDiff < 10000) {
            this.navCount++;
        } else {
            this.navCount = 1;
        }

        this.lastNavTime = now;
        this.evaluate();
    }

    /**
     * Track an error occurrence
     */
    recordError() {
        this.errorCount++;
        this.evaluate();
    }

    /**
     * Evaluate signals and update state
     */
    private evaluate() {
        const signals: string[] = [];

        if (this.navCount >= this.NAV_SPEED_THRESHOLD) {
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
            this.state.set({
                isOverwhelmed: true,
                signals
            });
        }
    }

    /**
     * Reset the overwhelm state
     */
    reset() {
        this.navCount = 0;
        this.errorCount = 0;
        this.startTime = Date.now();
        this.state.set({
            isOverwhelmed: false,
            signals: []
        });
        logger.info('Overwhelm state reset');
    }
}

export const overwhelmDetector = new OverwhelmDetector();
export const overwhelmState = overwhelmDetector.state;
