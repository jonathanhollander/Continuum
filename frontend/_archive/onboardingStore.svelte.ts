import { registerProfileSlice } from "$lib/services/sync.svelte";

interface OnboardingState {
    hasSeenWelcome: boolean;
}

const manager = registerProfileSlice<OnboardingState>('onboarding_settings', (data: Record<string, unknown>) => ({
    hasSeenWelcome: data.hasSeenWelcome === true
}));

export const onboardingStore = {
    subscribe: manager.subscribe.bind(manager),
    get hasSeenWelcome() { return manager.data?.hasSeenWelcome || false; },

    markWelcomeSeen() {
        return manager.update({ hasSeenWelcome: true });
    },

    reset() {
        return manager.update({ hasSeenWelcome: false });
    }
};
