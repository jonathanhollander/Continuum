import { registerSync } from "$lib/services/sync.svelte";
import { oneSpelling } from "$lib/utils/oneSpelling";
import { captureSession, isCurrentSession } from "$lib/services/sessionOwnership";

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
    // Custom fields support
    custom_attributes?: string; // JSON string of custom field values
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

    // Call-list tier is stored as call_tier; the UI calls it `tier`. An explicit `tier`
    // (null or "" included) wins over the copy the server sent; "" and null both mean none.
    const callTier = (item.tier !== undefined ? item.tier : (item.callTier ?? item.call_tier)) || null;

    // One spelling per field (camel; the wire snake-cases it), newest value kept
    const out = oneSpelling(item, {
        isExecutor: 'is_executor', isBeneficiary: 'is_beneficiary', isEmergencyContact: 'is_emergency_contact',
        tierId: 'tier_id', notificationStatus: 'notification_status', callTier: 'call_tier',
    });
    return {
        ...out,
        role: role || 'Other',
        relation: relation || '',
        isExecutor: out.isExecutor ?? false,
        isBeneficiary: out.isBeneficiary ?? false,
        isEmergencyContact: out.isEmergencyContact ?? false,
        tierId: out.tierId ?? null,
        tier: callTier ?? undefined,
        // Wire copy of `tier`, always derived from it above
        callTier
    };
};

const relationshipMapper = (item: any) => {
    if (!item) return item;
    // One spelling per field (camel; the wire snake-cases it), newest value kept
    const out = oneSpelling(item, { sourceId: 'source_id', targetId: 'target_id' });
    return { ...out, sourceId: String(out.sourceId), targetId: String(out.targetId) };
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
        const owner = captureSession();
        const belongsToContact = (r: Relationship) => r.sourceId === String(id) || r.targetId === String(id);
        const relatedIds = relationshipSync.items.filter(belongsToContact).map(r => r.id);
        return contactSync.delete(id, async () => {
            if (!isCurrentSession(owner)) return;
            // The API removed these links atomically with the contact. Mirror that confirmed
            // result locally, including any links loaded while the delete was in flight.
            relationshipSync.confirmRemoved([
                ...relatedIds,
                ...relationshipSync.items.filter(belongsToContact).map(r => r.id),
            ], owner);
            await relationshipSync.sync();
        });
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
