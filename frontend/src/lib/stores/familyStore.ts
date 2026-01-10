import { createProfileStore, getLegacy } from './persistence';
import { get } from 'svelte/store';
import { estateProfile } from './estateStore';

// --- Types ---
export type FamilyRole = 'owner' | 'spouse' | 'child' | 'grandchild' | 'parent' | 'sibling' | 'pet' | 'professional' | 'executor';

export interface FamilyMember {
    id: string;
    name: string;
    role: FamilyRole;
    relationToOwner: string; // e.g. "Daughter", "Lawyer"
    avatar?: string;
    email?: string;
    phone?: string;
    isExecutor: boolean;
    isBeneficiary: boolean;
    isEmergencyContact: boolean;
    notes?: string;
    // Positioning for the graph (can be persisted or calculated)
    x?: number;
    y?: number;
}

export interface Relationship {
    id: string;
    sourceId: string;
    targetId: string;
    type: 'parent_of' | 'spouse_of' | 'sibling_of' | 'professional_to';
}

// --- Initial Data ---
const DEFAULT_MEMBERS: FamilyMember[] = [
    {
        id: 'owner',
        name: 'Owner',
        role: 'owner',
        relationToOwner: 'Self',
        isExecutor: false,
        isBeneficiary: false,
        isEmergencyContact: false,
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&q=80',
    }
];

const DEFAULT_RELATIONSHIPS: Relationship[] = [];

// --- Migration / Initialization ---
const getInitialMembers = (): FamilyMember[] => {
    const unified = getLegacy('continuum_owner_family_members');
    if (unified) return DEFAULT_MEMBERS;

    const legacy = getLegacy('continuum_family_members');
    if (legacy) {
        try {
            return JSON.parse(legacy);
        } catch { /* ignore */ }
    }
    return DEFAULT_MEMBERS;
};

const getInitialRelationships = (): Relationship[] => {
    const unified = getLegacy('continuum_owner_family_relationships');
    if (unified) return DEFAULT_RELATIONSHIPS;

    const legacy = getLegacy('continuum_family_relationships');
    if (legacy) {
        try {
            return JSON.parse(legacy);
        } catch { /* ignore */ }
    }
    return DEFAULT_RELATIONSHIPS;
};

// --- Stores ---
export const familyMembers = createProfileStore<FamilyMember[]>('family_members', getInitialMembers());
export const relationships = createProfileStore<Relationship[]>('family_relationships', getInitialRelationships());

// --- Actions ---
export const addMember = (member: Omit<FamilyMember, 'id'>) => {
    familyMembers.update(current => {
        const newMember = { ...member, id: crypto.randomUUID() };
        return [...current, newMember];
    });
};

export const updateMember = (id: string, updates: Partial<FamilyMember>) => {
    familyMembers.update(current =>
        current.map(m => m.id === id ? { ...m, ...updates } : m)
    );
};

export const removeMember = (id: string) => {
    familyMembers.update(current => current.filter(m => m.id !== id));
    relationships.update(current => current.filter(r => r.sourceId !== id && r.targetId !== id));
};

export const addRelationship = (sourceId: string, targetId: string, type: Relationship['type']) => {
    relationships.update(current => [
        ...current,
        { id: crypto.randomUUID(), sourceId, targetId, type }
    ]);
};

// --- Sync with Estate Profile ---
// Ensure the "Owner" node always matches the Estate Profile name
// Note: This relies on estateProfile also being profile-aware eventually
estateProfile.subscribe(profile => {
    familyMembers.update(members => {
        return members.map(m => {
            if (m.id === 'owner' && profile.ownerName && m.name !== profile.ownerName) {
                return { ...m, name: profile.ownerName };
            }
            return m;
        });
    });
});
