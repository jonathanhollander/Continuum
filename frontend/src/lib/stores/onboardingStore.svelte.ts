import { browser } from '$app/environment';
import { getSmartSamples } from '$lib/data/smartSamples';
import { propertyStore } from '$lib/stores/propertyStore.svelte';
import { familyMembers, addMember, addRelationship } from '$lib/stores/familyStore';
import { insuranceStore } from '$lib/stores/insuranceStore';
import { heirloomStore } from '$lib/stores/heirloomStore.svelte';
import { digitalAssetsStore } from '$lib/stores/digitalAssetsStore.svelte';
import { medicalStore } from '$lib/stores/medicalStore';
import { activityLog } from '$lib/stores/activityLog';

// Persistent Key
const ONBOARDING_KEY = 'continuum_onboarding_state';

interface OnboardingState {
    hasSeenWelcome: boolean;
    isDemoMode: boolean;
}

function createOnboardingStore() {
    // 1. Initial State from Storage
    let state = $state<OnboardingState>({
        hasSeenWelcome: false,
        isDemoMode: false
    });

    if (browser) {
        const stored = localStorage.getItem(ONBOARDING_KEY);
        if (stored) {
            try {
                state = { ...state, ...JSON.parse(stored) };
            } catch (e) {
                console.warn('Failed to parse onboarding state', e);
            }
        }
    }

    // 2. Persistence Helper
    function save() {
        if (browser) {
            localStorage.setItem(ONBOARDING_KEY, JSON.stringify(state));
        }
    }

    return {
        get hasSeenWelcome() { return state.hasSeenWelcome; },
        get isDemoMode() { return state.isDemoMode; },

        markWelcomeSeen() {
            state.hasSeenWelcome = true;
            save();
        },

        enableDemoMode() {
            state.isDemoMode = true;
            save();
        },

        reset() {
            state.hasSeenWelcome = false;
            state.isDemoMode = false;
            save();
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
                addMember(member);
            });
            // Add a mock relationship for demo visual goodness if needed, 
            // but smartSamples currently only returns members interactively.
            // We can add a basic one if we have IDs, but IDs are generated on add.
            // For now, just members is enough to show the graph.

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
            // Set profile data if available in sample (it is)
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

            // Force reload to ensure all derived stores (graphs, etc) update? 
            // Svelte 5 Runes should handle fine-grained reactivity automatically.
            // But a reload ensures clean state for graph libs that might not be fully reactive yet.
            setTimeout(() => {
                window.location.href = '/dashboard';
            }, 500);
        }
    };
}

export const onboardingStore = createOnboardingStore();
