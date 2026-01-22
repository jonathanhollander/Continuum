/**
 * Context Store - Manages user role and emotional context for adaptive messaging
 *
 * This store provides context-aware language that adapts based on:
 * - User role (planning, executor, family, advisor)
 * - Emotional context (healthy, terminal, grieving)
 * - Deceased person's name (for executor/family modes)
 */

import { auth } from './auth';
import { get } from 'svelte/store';

type UserRole = 'planning' | 'executor' | 'family' | 'advisor';
type EmotionalContext = 'healthy' | 'terminal' | 'grieving' | null;

interface ContextState {
    role: UserRole;
    emotionalContext: EmotionalContext;
    deceasedName: string | null;
}

// Default state
let contextState = $state<ContextState>({
    role: 'planning',
    emotionalContext: null,
    deceasedName: null
});

// Initialize from auth store
function initializeContext() {
    const authState = get(auth);
    if (authState.user) {
        contextState.role = (authState.user.user_role as UserRole) || 'planning';
        contextState.emotionalContext = authState.user.emotional_context as EmotionalContext;
    }
}

// Call on load
if (typeof window !== 'undefined') {
    initializeContext();
}

export const contextStore = {
    get role() {
        return contextState.role;
    },

    get emotionalContext() {
        return contextState.emotionalContext;
    },

    get deceasedName() {
        return contextState.deceasedName;
    },

    get isExecutor() {
        return contextState.role === 'executor';
    },

    get isFamily() {
        return contextState.role === 'family';
    },

    get isPlanning() {
        return contextState.role === 'planning';
    },

    get isGrieving() {
        return contextState.emotionalContext === 'grieving';
    },

    setRole(role: UserRole) {
        contextState.role = role;
    },

    setEmotionalContext(context: EmotionalContext) {
        contextState.emotionalContext = context;
    },

    setDeceasedName(name: string | null) {
        contextState.deceasedName = name;
    },

    refresh() {
        initializeContext();
    }
};
