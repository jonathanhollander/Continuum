import { registerSync } from '$lib/services/sync.svelte';
import { enrolledPulseContacts } from '$lib/components/modules/pulse/pulseTiers';
import { contactSync, type FamilyMember } from './familyStore.svelte';
import { untrack } from 'svelte';

// One account-scoped registry owner. Lazy analytics loads join the layout's sync;
// account/profile changes and late responses follow the shared manager's guards.
const tierSync = registerSync<{ id: number; tierNumber: number }>('pulse_tiers', 'pulse/tiers', undefined, '/api');

export interface PulseEnrollment {
    loaded: boolean;
    count: number | null;
    members: { contact: FamilyMember; tierNumber: number }[];
}

function snapshot(): PulseEnrollment {
    // Read both managers before checking readiness: each is shown by this page,
    // so syncAll can fetch them together even when the contact list is still pending.
    const contacts = contactSync.items;
    const tiers = tierSync.items;
    const contactsRead = contactSync.lastSync;
    const tiersRead = tierSync.lastSync;
    const contactStatus = contactSync.status;
    const tierStatus = tierSync.status;
    const loaded = contactsRead !== null && tiersRead !== null
        && contactStatus !== 'error' && tierStatus !== 'error';
    const members = loaded ? enrolledPulseContacts(contacts, tiers) : [];
    return { loaded, count: loaded ? members.length : null, members };
}

export const pulseEnrollment = {
    subscribe(run: (value: PulseEnrollment) => void) {
        run(snapshot());
        // The managers notify rows before their final loaded status. Track both runes,
        // including resets and failed loads, so unknown never becomes a recorded zero.
        return $effect.root(() => {
            $effect(() => {
                const value = snapshot();
                untrack(() => run(value));
            });
        });
    }
};
