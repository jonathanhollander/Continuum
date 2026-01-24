import { browser } from '$app/environment';
import { getSmartSamples } from '$lib/data/smartSamples';
import { propertyStore } from "$lib/stores/propertyStore.svelte";
import { familyStore } from "$lib/stores/familyStore.svelte";
import { insuranceStore } from "$lib/stores/insuranceStore.svelte";
import { heirloomStore } from "$lib/stores/heirloomStore.svelte";
import { digitalAssetsStore } from "$lib/stores/digitalAssetsStore.svelte";
import { medicalStore } from "$lib/stores/medicalStore.svelte";
import { activityLog } from '$lib/stores/activityLog.svelte';
import { registerSingletonSync } from "$lib/services/sync.svelte";

interface OnboardingState {
    hasSeenWelcome: boolean;
    isDemoMode: boolean;
}

const manager = registerSingletonSync<OnboardingState>('onboarding_settings', 'estate/profile', (data: any) => ({
    hasSeenWelcome: data.hasSeenWelcome === true,
    isDemoMode: data.isDemoMode === true
}), '/api');

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

    populateDemoData() {
        console.log("Populating Demo Data...");
        const samples = getSmartSamples('en');

        // 1. Property
        samples.property.forEach(item => {
            propertyStore.addItem(item);
        });

        // 2. Family
        samples.family.forEach(member => {
            familyStore.addMember(member);
        });

        // 3. Insurance
        samples.insurance.forEach(policy => {
            insuranceStore.addPolicy(policy);
        });

        // 4. Heirlooms
        samples.heirlooms.forEach(heirloom => {
            heirloomStore.addItem(heirloom);
        });

        // 5. Digital Assets
        samples.digital.forEach(account => {
            digitalAssetsStore.addAccount(account);
        });

        // 6. Medical
        samples.medical.forEach(directive => {
            medicalStore.addDirective(directive);
        });

        // Set profile data if available in sample
        if (samples.medical.length > 0) {
            medicalStore.updateProfile({
                organDonor: samples.medical[0].organDonor,
                bloodType: samples.medical[0].bloodType,
                allergies: samples.medical[0].allergies
            });
        }

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
