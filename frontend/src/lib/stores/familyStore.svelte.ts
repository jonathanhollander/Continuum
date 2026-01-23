import { registerSync } from "$lib/services/sync.svelte.ts";

export type FamilyRole =
    | 'Family'
    | 'Friend'
    | 'Medical'
    | 'Legal'
    | 'Financial'
    | 'Other'
    | 'Pet'
    // Legacy support (mapped during sync)
    | 'owner' | 'spouse' | 'child' | 'grandchild' | 'parent' | 'sibling' | 'professional' | 'executor';

export interface FamilyMember {
    id: string | number;
    name: string;
    role: FamilyRole;
    relation: string;
    avatar?: string;
    email?: string;
    phone?: string;
    isExecutor: boolean;
    isBeneficiary: boolean;
    isEmergencyContact: boolean;
    notes?: string;
    tierId?: number | null;
    // UI Helpers
    tier?: string; // For simulation/display
    notificationStatus?: string;
}

export interface Relationship {
    id: string | number;
    sourceId: string;
    targetId: string;
    type: 'parent_of' | 'spouse_of' | 'sibling_of' | 'professional_to';
}

const contactMapper = (item: any) => {
    if (!item) return item;

    // legacy role mapping
    let role = item.role;
    let relation = item.relation;

    // Map legacy backend/store roles to "Concept" (Role) + "Detail" (Relation)
    const legacyMap: Record<string, string> = {
        'spouse': 'Family',
        'child': 'Family',
        'grandchild': 'Family',
        'parent': 'Family',
        'sibling': 'Family',
        'professional': 'Other', // Could be Medical/Legal, default to Other
        'pet': 'Pet'
    };

    // If role is one of the legacy specific ones, map it
    if (legacyMap[role]) {
        if (!relation) relation = role.charAt(0).toUpperCase() + role.slice(1); // "spouse" -> "Spouse"
        role = legacyMap[role];
    }

    return {
        ...item,
        role: role || 'Other',
        relation: relation || '',

        // Remote -> Local
        isExecutor: item.is_executor ?? item.isExecutor ?? false,
        isBeneficiary: item.is_beneficiary ?? item.isBeneficiary ?? false,
        isEmergencyContact: item.is_emergency_contact ?? item.isEmergencyContact ?? false,
        tierId: item.tier_id ?? item.tierId ?? null,

        // Local -> Remote
        ['is_executor']: item.isExecutor ?? item.is_executor,
        ['is_beneficiary']: item.isBeneficiary ?? item.is_beneficiary,
        ['is_emergency_contact']: item.isEmergencyContact ?? item.is_emergency_contact,
        ['tier_id']: item.tierId ?? item.tier_id
    };
};

const relationshipMapper = (item: any) => {
    if (!item) return item;
    return {
        ...item,
        // Remote -> Local
        sourceId: String(item.source_id ?? item.sourceId),
        targetId: String(item.target_id ?? item.targetId),
        // Local -> Remote
        ['source_id']: item.sourceId ?? item.source_id,
        ['target_id']: item.targetId ?? item.target_id
    };
};

export const contactSync = registerSync<FamilyMember>('family_members', 'contacts', contactMapper, '/api').setAffirmationContext('contacts');
export const relationshipSync = registerSync<Relationship>('family_relationships', 'relationships', relationshipMapper, '/api/contacts').setAffirmationContext('contacts');

export const familyStore = {
    get members() { return contactSync.items; },
    get relationships() { return relationshipSync.items; },
    get status() {
        return contactSync.status === 'error' || relationshipSync.status === 'error' ? 'error' : 'synced';
    },

    sync: async () => {
        await Promise.all([contactSync.sync(), relationshipSync.sync()]);
    },

    addMember: (member: Omit<FamilyMember, 'id'>) => contactSync.create({ ...member, id: crypto.randomUUID() }),
    updateMember: (id: string | number, updates: Partial<FamilyMember>) => contactSync.update(id, updates),
    removeMember: (id: string | number) => {
        contactSync.delete(id);
        // Also cleanup relationships locally
        const rels = relationshipSync.items.filter(r => r.sourceId === String(id) || r.targetId === String(id));
        rels.forEach(r => relationshipSync.delete(r.id));
    },

    addRelationship: (sourceId: string | number, targetId: string | number, type: Relationship['type']) => {
        return relationshipSync.create({
            sourceId: String(sourceId),
            targetId: String(targetId),
            type
        } as Relationship);
    },
    removeRelationship: (id: string | number) => relationshipSync.delete(id),

    // Store Compatibility
    subscribe: (run: any) => {
        const unsub1 = contactSync.subscribe(() => run(familyStore));
        const unsub2 = relationshipSync.subscribe(() => run(familyStore));
        return () => { unsub1(); unsub2(); };
    }
};
