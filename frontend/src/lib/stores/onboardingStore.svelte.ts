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
    }
};
