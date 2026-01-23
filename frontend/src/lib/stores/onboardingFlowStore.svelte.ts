/**
 * Onboarding Flow Store - Manages the comprehensive onboarding experience
 *
 * This store tracks:
 * - Current step in the onboarding flow
 * - User's collected data (role, emotional context, etc.)
 * - Progress persistence to backend
 * - Resume capability for returning users
 */

import { auth } from './auth';
import { get } from 'svelte/store';
import { API_BASE_URL } from '$lib/config.ts';

export type UserRole = 'planning' | 'executor' | 'family' | 'advisor';
export type EmotionalContext = 'healthy' | 'preparing' | 'grieving' | null;
export type OnboardingStep =
    | 'welcome'
    | 'role'
    | 'situation'
    | 'loved-one'
    | 'preferences'
    | 'ready'
    | 'complete';

export interface OnboardingData {
    // Step tracking
    currentStep: OnboardingStep;
    completedSteps: OnboardingStep[];

    // Core data
    role: UserRole;
    emotionalContext: EmotionalContext;
    deceasedName: string | null;

    // Preferences
    language: string;
    fontSize: 'normal' | 'large' | 'xlarge';

    // Optional context
    primaryGoal: string | null;
    howHeardAboutUs: string | null;

    // Timestamps
    startedAt: string | null;
    completedAt: string | null;
}

const STORAGE_KEY = 'continuum_onboarding_flow';

// Default state
const defaultData: OnboardingData = {
    currentStep: 'welcome',
    completedSteps: [],
    role: 'planning',
    emotionalContext: null,
    deceasedName: null,
    language: 'en',
    fontSize: 'normal',
    primaryGoal: null,
    howHeardAboutUs: null,
    startedAt: null,
    completedAt: null
};

// Reactive state
let data = $state<OnboardingData>({ ...defaultData });
let isLoading = $state(false);
let error = $state<string | null>(null);

// Step order for navigation
const stepOrder: OnboardingStep[] = [
    'welcome',
    'role',
    'situation',
    'loved-one',
    'preferences',
    'ready',
    'complete'
];

// Load from localStorage on init
function loadFromStorage(): OnboardingData {
    if (typeof window === 'undefined') return { ...defaultData };

    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            const parsed = JSON.parse(stored);
            return { ...defaultData, ...parsed };
        }
    } catch (e) {
        console.warn('Failed to load onboarding state from localStorage:', e);
    }
    return { ...defaultData };
}

// Save to localStorage
function saveToStorage() {
    if (typeof window === 'undefined') return;

    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
        console.warn('Failed to save onboarding state to localStorage:', e);
    }
}

// Initialize on module load
if (typeof window !== 'undefined') {
    data = loadFromStorage();
}

// Helper to get auth token
function getAuthToken(): string | null {
    const authState = get(auth);
    return authState.token;
}

// Persist to backend
async function persistToBackend(): Promise<boolean> {
    const token = getAuthToken();
    if (!token) return false;

    try {
        const response = await fetch(`${API_BASE_URL}/api/auth/onboarding`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                user_role: data.role,
                emotional_context: data.emotionalContext,
                deceased_name: data.deceasedName,
                onboarding_step: data.currentStep,
                onboarding_completed: data.currentStep === 'complete',
                language: data.language,
                font_size: data.fontSize
            })
        });

        if (!response.ok) {
            console.warn('Failed to persist onboarding to backend:', response.status);
            return false;
        }

        return true;
    } catch (e) {
        console.warn('Error persisting onboarding to backend:', e);
        return false;
    }
}

export const onboardingFlowStore = {
    // Getters
    get data() {
        return data;
    },

    get currentStep() {
        return data.currentStep;
    },

    get isLoading() {
        return isLoading;
    },

    get error() {
        return error;
    },

    get progress() {
        const currentIndex = stepOrder.indexOf(data.currentStep);
        // Don't count 'complete' in progress calculation
        return Math.round((currentIndex / (stepOrder.length - 1)) * 100);
    },

    get isComplete() {
        return data.currentStep === 'complete' || data.completedAt !== null;
    },

    get needsLovedOneName() {
        return data.role === 'executor' || data.role === 'family';
    },

    // Step navigation
    goToStep(step: OnboardingStep) {
        data.currentStep = step;
        saveToStorage();
    },

    nextStep() {
        const currentIndex = stepOrder.indexOf(data.currentStep);

        // Skip 'loved-one' step if not executor or family
        let nextIndex = currentIndex + 1;
        if (stepOrder[nextIndex] === 'loved-one' && !this.needsLovedOneName) {
            nextIndex++;
        }

        if (nextIndex < stepOrder.length) {
            if (!data.completedSteps.includes(data.currentStep)) {
                data.completedSteps.push(data.currentStep);
            }
            data.currentStep = stepOrder[nextIndex];
            saveToStorage();

            // Persist to backend on each step completion
            persistToBackend();
        }
    },

    previousStep() {
        const currentIndex = stepOrder.indexOf(data.currentStep);

        // Skip 'loved-one' step if not executor or family
        let prevIndex = currentIndex - 1;
        if (stepOrder[prevIndex] === 'loved-one' && !this.needsLovedOneName) {
            prevIndex--;
        }

        if (prevIndex >= 0) {
            data.currentStep = stepOrder[prevIndex];
            saveToStorage();
        }
    },

    canGoBack() {
        return stepOrder.indexOf(data.currentStep) > 0;
    },

    // Data setters
    setRole(role: UserRole) {
        data.role = role;
        saveToStorage();
    },

    setEmotionalContext(context: EmotionalContext) {
        data.emotionalContext = context;
        saveToStorage();
    },

    setDeceasedName(name: string | null) {
        data.deceasedName = name;
        saveToStorage();
    },

    setLanguage(language: string) {
        data.language = language;
        saveToStorage();
    },

    setFontSize(size: 'normal' | 'large' | 'xlarge') {
        data.fontSize = size;
        saveToStorage();
    },

    setPrimaryGoal(goal: string | null) {
        data.primaryGoal = goal;
        saveToStorage();
    },

    // Lifecycle
    start() {
        if (!data.startedAt) {
            data.startedAt = new Date().toISOString();
            saveToStorage();
        }
    },

    async complete() {
        data.currentStep = 'complete';
        data.completedAt = new Date().toISOString();
        if (!data.completedSteps.includes('ready')) {
            data.completedSteps.push('ready');
        }
        saveToStorage();

        // Final persist to backend
        await persistToBackend();
    },

    reset() {
        data = { ...defaultData };
        saveToStorage();
    },

    // Resume capability
    canResume() {
        return data.startedAt !== null &&
            data.completedAt === null &&
            data.currentStep !== 'welcome';
    }
};
