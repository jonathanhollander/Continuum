import { browser } from '$app/environment';
import { getSmartSamples } from '$lib/data/smartSamples';
import { propertyStore } from "$lib/stores/propertyStore.svelte";
import { familyStore } from "$lib/stores/familyStore.svelte";
import { insuranceStore } from "$lib/stores/insuranceStore.svelte";
import { heirloomStore } from "$lib/stores/heirloomStore.svelte";
import { digitalAssetsStore } from "$lib/stores/digitalAssetsStore.svelte";
import { medicalStore, type MedicalDirective, type MedicalProfile } from "$lib/stores/medicalStore.svelte";
import { activityLog } from '$lib/stores/activityLog.svelte';
import { registerProfileSlice } from "$lib/services/sync.svelte";

interface OnboardingState {
    hasSeenWelcome: boolean;
    isDemoMode: boolean;
}

const manager = registerProfileSlice<OnboardingState>('onboarding_settings', (data: Record<string, unknown>) => ({
    hasSeenWelcome: data.hasSeenWelcome === true,
    isDemoMode: data.isDemoMode === true
}));

export const onboardingStore = {
    subscribe: manager.subscribe.bind(manager),
    get hasSeenWelcome() { return manager.data?.hasSeenWelcome || false; },
    get isDemoMode() { return manager.data?.isDemoMode || false; },

    markWelcomeSeen() {
        return manager.update({ hasSeenWelcome: true });
    },

    enableDemoMode() {
        return manager.update({ isDemoMode: true });
    },

    reset() {
        return manager.update({ hasSeenWelcome: false, isDemoMode: false });
    },

    async populateDemoData() {
        console.log("Populating Demo Data...");
        const samples = getSmartSamples('en');
        // Every sample save is awaited and caught (card X233); a failed one already
        // shows the store's gentle message, so the rest carry on.
        const saves: Promise<unknown>[] = [];

        // 1. Property
        samples.property.forEach(item => {
            saves.push(propertyStore.addItem(item));
        });

        // 2. Family
        samples.family.forEach(member => {
            saves.push(familyStore.addMember(member));
        });

        // 3. Insurance
        samples.insurance.forEach(policy => {
            saves.push(insuranceStore.addPolicy(policy));
        });

        // 4. Heirlooms
        samples.heirlooms.forEach(heirloom => {
            saves.push(heirloomStore.addItem(heirloom));
        });

        // 5. Digital Assets
        samples.digital.forEach(account => {
            saves.push(digitalAssetsStore.addAccount(account));
        });

        // 6. Medical: each sample carries the medical profile beside the directive fields;
        // the directive is saved without them and the profile is saved on its own.
        let medicalProfile: Partial<MedicalProfile> | null = null;
        (samples.medical as (MedicalDirective & Partial<MedicalProfile>)[]).forEach(sample => {
            const { organDonor, bloodType, allergies, ...directive } = sample;
            medicalProfile ??= { organDonor, bloodType, allergies };
            saves.push(medicalStore.addDirective(directive));
        });

        if (medicalProfile) {
            saves.push(medicalStore.updateProfile(medicalProfile));
        }

        await Promise.allSettled(saves);

        // 7. Log Event
        activityLog.logEvent({
            module: 'System',
            action: 'CREATE',
            entityType: 'Demo Data',
            entityId: 'batch',
            entityName: 'Smart Samples Injected',
            userContext: 'Onboarding'
        });

        this.enableDemoMode();
        this.markWelcomeSeen();

        if (browser) {
            setTimeout(() => {
                window.location.href = '/dashboard';
            }, 500);
        }
    }
};
