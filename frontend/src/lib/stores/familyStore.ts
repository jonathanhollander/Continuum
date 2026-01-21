import { registerSync } from '../services/sync.svelte';

export type FamilyRole = 'owner' | 'spouse' | 'child' | 'grandchild' | 'parent' | 'sibling' | 'pet' | 'professional' | 'executor';

export interface FamilyMember {
    id?: number;
    user_id?: number;
    name: string;
    role: FamilyRole;
    relation?: string; // Unified with backend 'relation'
    avatar?: string;
    email?: string;
    phone?: string;
    is_executor: boolean;
    is_beneficiary: boolean;
    is_emergency_contact: boolean;
    notes?: string;
}

export interface Relationship {
    id?: number;
    user_id?: number;
    source_id: string; // Contact ID or 'owner'
    target_id: string;
    type: 'parent_of' | 'spouse_of' | 'sibling_of' | 'professional_to';
}

// --- Mappers ---
const contactMapper = (local: any): FamilyMember => ({
    ...local,
    id: typeof local.id === 'string' && !isNaN(Number(local.id)) ? Number(local.id) : (typeof local.id === 'number' ? local.id : undefined),
    is_executor: local.is_executor ?? local.isExecutor ?? false,
    is_beneficiary: local.is_beneficiary ?? local.isBeneficiary ?? false,
    is_emergency_contact: local.is_emergency_contact ?? local.isEmergencyContact ?? false,
    relation: local.relation ?? local.relationToOwner ?? ''
});

const relationshipMapper = (local: any): Relationship => ({
    ...local,
    id: typeof local.id === 'string' && !isNaN(Number(local.id)) ? Number(local.id) : (typeof local.id === 'number' ? local.id : undefined),
    source_id: String(local.source_id ?? local.sourceId),
    target_id: String(local.target_id ?? local.targetId)
});

const contactManager = registerSync<FamilyMember>('family_members', 'contacts', contactMapper, '/api');
const relationshipManager = registerSync<Relationship>('family_relationships', 'relationships', relationshipMapper, '/api/contacts');

export const familyStore = {
    get members() { return contactManager.items; },
    get relationships() { return relationshipManager.items; },
    get status() { return contactManager.status === 'error' || relationshipManager.status === 'error' ? 'error' : 'synced'; },

    sync: async () => {
        await Promise.all([contactManager.sync(), relationshipManager.sync()]);
    },

    addMember: (member: Omit<FamilyMember, 'id'>) => {
        const cleanMember = {
            ...member,
            // Ensure IDs are not passed as UUID strings if the UI generates them
            id: undefined
        };
        return contactManager.create(cleanMember as FamilyMember);
    },
    updateMember: (id: number | string, updates: Partial<FamilyMember>) => {
        const numericId = typeof id === 'string' ? Number(id) : id;
        const member = contactManager.items.find(m => m.id === numericId);
        if (member) {
            return contactManager.update({ ...member, ...updates });
        }
    },
    removeMember: (id: number | string) => {
        const numericId = typeof id === 'string' ? Number(id) : id;
        contactManager.delete(numericId);
        // Relationships are deleted by ID, but we might want to audit/cleanup locally if many orphans
        relationshipManager.items
            .filter(r => r.source_id === String(numericId) || r.target_id === String(numericId))
            .forEach(r => relationshipManager.delete(r.id!));
    },

    addRelationship: (source_id: string | number, target_id: string | number, type: Relationship['type']) => {
        return relationshipManager.create({
            source_id: String(source_id),
            target_id: String(target_id),
            type
        } as Relationship);
    },

    removeRelationship: (id: number) => {
        return relationshipManager.delete(id);
    }
};

// Legacy compatibility exports for standard subscription usage
export const familyMembers = { subscribe: contactManager.subscribe.bind(contactManager) };
export const familyRelationships = { subscribe: relationshipManager.subscribe.bind(relationshipManager) };

// Named exports for ease of use
export const {
    addMember,
    updateMember,
    removeMember,
    addRelationship,
    removeRelationship
} = familyStore;
