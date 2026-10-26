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
import { apiFetch } from '$lib/api/client';
import { logger } from '$lib/utils/logger';

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

// The role the server holds for the signed-in account (users.user_role)
let serverRole: UserRole = 'planning';
// Bumped on every setRole; a save's reply only applies while it is still the latest choice
let roleSeq = 0;
let roleSaving = false;
let appliedUser: unknown = null;

// Initialize from auth store
function initializeContext() {
    const authState = get(auth);
    if (authState.user) {
        serverRole = (authState.user.user_role as UserRole) || 'planning';
        if (!roleSaving) contextState.role = serverRole;
        contextState.emotionalContext = authState.user.emotional_context as EmotionalContext;
    }
}

// Follow the signed-in user: /api/auth/me usually arrives after this module loads
if (typeof window !== 'undefined') {
    auth.subscribe((s) => {
        if (s.user && s.user !== appliedUser) {
            appliedUser = s.user;
            initializeContext();
        } else if (!s.user && appliedUser) {
            appliedUser = null;
            serverRole = 'planning';
            contextState.role = 'planning';
        }
    });
}

// Save the role with the account (one PATCH per change); a failed save returns to the server's role
async function saveRole(role: UserRole, seq: number) {
    await auth.init();
    if (seq !== roleSeq) return;
    if (!get(auth).user || role === serverRole) {
        roleSaving = false;
        return;
    }
    try {
        const res = await apiFetch('/api/auth/preferences', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_role: role })
        });
        if (!res.ok) throw new Error(`status ${res.status}`);
        const user = await res.json();
        serverRole = (user.user_role as UserRole) || 'planning';
    } catch (e) {
        logger.error('[contextStore] Role save failed', e);
    }
    if (seq !== roleSeq) return;
    roleSaving = false;
    contextState.role = serverRole;
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
        if (role === contextState.role) return;
        contextState.role = role;
        roleSaving = true;
        void saveRole(role, ++roleSeq);
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
