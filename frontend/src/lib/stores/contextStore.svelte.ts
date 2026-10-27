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
import { getStored, setStored } from './persistence';
import { assertCurrentSession, captureSession, isCurrentSession, SessionChangedError, type SessionOwnership } from '$lib/services/sessionOwnership';

export type UserRole = 'planning' | 'executor' | 'family' | 'advisor';
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

const ROLES: readonly UserRole[] = ['planning', 'executor', 'family', 'advisor'];

// users.user_role as a known role; older rows hold 'owner' (or nothing), which is planning
function toRole(value: unknown): UserRole {
    return ROLES.includes(value as UserRole) ? (value as UserRole) : 'planning';
}

// The role the server holds for the signed-in account (users.user_role)
let serverRole: UserRole = 'planning';
// Bumped on every setRole; a save's reply only applies while it is still the latest choice
let roleSeq = 0;
let roleSaving = false;
let roleSaveOwner: SessionOwnership | null = null;
let appliedUser: unknown = null;

// Initialize from auth store
function initializeContext() {
    const authState = get(auth);
    if (authState.user) {
        serverRole = toRole(authState.user.user_role);
        if (!roleSaving || !roleSaveOwner || !isCurrentSession(roleSaveOwner)) {
            roleSaving = false;
            contextState.role = serverRole;
        }
        contextState.emotionalContext = authState.user.emotional_context as EmotionalContext;
        // users.deceased_name, so contextual messages name the person after a reload too
        contextState.deceasedName = authState.user.deceased_name || null;
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
            contextState.emotionalContext = null;
            contextState.deceasedName = null;
        }
    });
}

// Save the role with the account (one PATCH per change); a failed save returns to the server's role
async function saveRole(role: UserRole, seq: number) {
    const owner = captureSession();
    roleSaveOwner = owner;
    await auth.init();
    if (seq !== roleSeq || !isCurrentSession(owner)) return;
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
        if (seq !== roleSeq || !isCurrentSession(owner)) return;
        if (!res.ok) throw new Error(`status ${res.status}`);
        const user = await res.json();
        if (seq !== roleSeq || !isCurrentSession(owner)) return;
        serverRole = toRole(user.user_role);
    } catch (e) {
        logger.error('[contextStore] Role save failed', e);
    }
    if (seq !== roleSeq || !isCurrentSession(owner)) return;
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

    get hasSeenExecutorWelcome() {
        const account = get(auth).user;
        return !!account && getStored<boolean>('executor_welcome_seen', false, 'owner', account.email) === true;
    },

    async saveExecutorWelcome(name: string) {
        const owner = captureSession();
        assertCurrentSession(owner);
        const account = get(auth).user;
        if (!account) throw new SessionChangedError();
        const submittedName = name.trim();
        const res = await apiFetch('/api/auth/onboarding', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ emotional_context: 'grieving', deceased_name: submittedName })
        });
        assertCurrentSession(owner);
        if (!res.ok) throw new Error(`status ${res.status}`);
        const saved = await res.json();
        assertCurrentSession(owner);
        if (saved.id !== account.id || saved.email !== account.email) throw new SessionChangedError();
        if (saved.emotional_context !== 'grieving' || saved.deceased_name !== submittedName) {
            throw new Error('Welcome details need another save');
        }
        contextState.deceasedName = saved.deceased_name || null;
        contextState.emotionalContext = saved.emotional_context;
        // The confirmed account owns this device flag, including when storage uses memory fallback.
        setStored('executor_welcome_seen', true, 'owner', account.email);
    },

    setRole(role: UserRole) {
        role = toRole(role);
        if (role === contextState.role) return;
        contextState.role = role;
        roleSaving = true;
        void saveRole(role, ++roleSeq);
    },

    // A role the server has already saved elsewhere (onboarding); shown without another save
    applyServerRole(role: unknown) {
        serverRole = toRole(role);
        roleSeq++;
        roleSaving = false;
        contextState.role = serverRole;
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
