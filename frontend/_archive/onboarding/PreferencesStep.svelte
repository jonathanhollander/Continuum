<script lang="ts">
    import { fade, fly } from 'svelte/transition';
    import { Languages, Type, ArrowLeft, ArrowRight } from 'lucide-svelte';
    import { onboardingFlowStore } from "$lib/stores/onboardingFlowStore.svelte";

    const languages = [
        { code: 'en', name: 'English' },
        { code: 'es', name: 'Espanol' },
        { code: 'fr', name: 'Francais' },
        { code: 'de', name: 'Deutsch' },
        { code: 'he', name: 'Hebrew' },
        { code: 'ru', name: 'Russian' }
    ];

    const fontSizes: { value: 'normal' | 'large' | 'xlarge'; label: string; sample: string }[] = [
        { value: 'normal', label: 'Standard', sample: 'Aa' },
        { value: 'large', label: 'Large', sample: 'Aa' },
        { value: 'xlarge', label: 'Extra Large', sample: 'Aa' }
    ];

    let selectedLanguage = $state(onboardingFlowStore.data.language);
    let selectedFontSize = $state(onboardingFlowStore.data.fontSize);

    function selectLanguage(code: string) {
        selectedLanguage = code;
        onboardingFlowStore.setLanguage(code);
    }

    function selectFontSize(size: 'normal' | 'large' | 'xlarge') {
        selectedFontSize = size;
        onboardingFlowStore.setFontSize(size);
    }

    function proceed() {
        onboardingFlowStore.nextStep();
    }

    function goBack() {
        onboardingFlowStore.previousStep();
    }
</script>

<div class="space-y-8" in:fade={{ duration: 400 }}>
    <div class="text-center space-y-3">
        <h2 class="text-2xl md:text-3xl font-serif font-bold text-white">
            A few quick preferences
        </h2>
        <p class="text-slate-400 max-w-md mx-auto">
            Let's make sure everything looks and feels right for you.
        </p>
    </div>

    <div class="max-w-lg mx-auto space-y-8" in:fly={{ y: 20, duration: 400, delay: 100 }}>
        <!-- Language Selection -->
        <div class="space-y-3">
            <div class="flex items-center gap-2 text-slate-300">
                <Languages size={18} />
                <span class="font-medium">Language</span>
            </div>
            <div class="grid grid-cols-3 gap-2">
                {#each languages as lang}
                    <button
                        onclick={() => selectLanguage(lang.code)}
                        class="px-4 py-3 rounded-xl text-sm font-medium transition-all {selectedLanguage === lang.code
                            ? 'bg-indigo-600 text-white'
                            : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white border border-white/10'}"
                    >
                        {lang.name}
                    </button>
                {/each}
            </div>
        </div>

        <!-- Font Size Selection -->
        <div class="space-y-3">
            <div class="flex items-center gap-2 text-slate-300">
                <Type size={18} />
                <span class="font-medium">Text Size</span>
            </div>
            <div class="grid grid-cols-3 gap-3">
                {#each fontSizes as size}
                    <button
                        onclick={() => selectFontSize(size.value)}
                        class="p-4 rounded-xl text-center transition-all {selectedFontSize === size.value
                            ? 'bg-indigo-600/20 border-2 border-indigo-500/50'
                            : 'bg-white/5 border border-white/10 hover:bg-white/10'}"
                    >
                        <div
                            class="font-serif font-bold mb-1 {size.value === 'normal'
                                ? 'text-lg'
                                : size.value === 'large'
                                  ? 'text-xl'
                                  : 'text-2xl'} {selectedFontSize === size.value ? 'text-indigo-400' : 'text-white'}"
                        >
                            {size.sample}
                        </div>
                        <div class="text-xs text-slate-400">{size.label}</div>
                    </button>
                {/each}
            </div>
        </div>

        <p class="text-center text-sm text-slate-500">
            You can adjust these anytime in Settings.
        </p>
    </div>

    <div class="flex items-center justify-between max-w-lg mx-auto pt-4">
        <button
            onclick={goBack}
            class="flex items-center gap-2 px-4 py-2 text-slate-400 hover:text-white transition-colors"
        >
            <ArrowLeft size={16} />
            <span>Back</span>
        </button>

        <button
            onclick={proceed}
            class="group flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-xl transition-all hover:scale-105 active:scale-95"
        >
            <span>Almost there</span>
            <ArrowRight size={16} class="group-hover:translate-x-1 transition-transform" />
        </button>
    </div>
</div>
