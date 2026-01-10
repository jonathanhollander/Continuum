<script lang="ts">
    import { fade } from "svelte/transition";
    import EthicalWill from "$lib/components/modules/legacy-journal/EthicalWill.svelte";
    import LifeLessons from "$lib/components/modules/legacy-journal/LifeLessons.svelte";
    import AccomplishmentsGallery from "$lib/components/modules/legacy-journal/AccomplishmentsGallery.svelte";
    import SmartTextarea from "$lib/components/ui/SmartTextarea.svelte";
    import RefreshControl from "$lib/components/ui/RefreshControl.svelte"; // NEW IMPORT
    import { REFLECTION_POOLS } from "$lib/data/reflectionPools"; // NEW IMPORT
    import { onMount } from "svelte";

    let activeTab = "reflections"; // 'reflections' | 'will' | 'lessons'

    // Reflections Logic
    let reflectionText = "";
    import { getStored, setStored } from "$lib/stores/persistence";

    // ...

    // Reflections Logic
    const REFLECTION_KEY = "daily_reflection";

    onMount(() => {
        reflectionText = getStored<string>(REFLECTION_KEY, "");
    });

    function saveReflection() {
        setStored(REFLECTION_KEY, reflectionText);
        alert("Reflection saved.");
    }

    // Dynamic Prompt Logic
    let activeJournalPrompt = REFLECTION_POOLS.journal.daily[0];

    function shuffleJournalPrompt() {
        const pool = REFLECTION_POOLS.journal.daily;
        let newPrompt;
        do {
            newPrompt = pool[Math.floor(Math.random() * pool.length)];
        } while (newPrompt === activeJournalPrompt && pool.length > 1);
        activeJournalPrompt = newPrompt;
    }

    // Shuffle on mount for variety
    onMount(() => {
        shuffleJournalPrompt();
    });
</script>

<div class="max-w-6xl mx-auto p-6 animate-in fade-in duration-500">
    <!-- Header -->
    <div class="mb-12 text-center">
        <h1 class="font-serif font-bold text-5xl text-[#304743] mb-4">
            Legacy Journal
        </h1>
        <p class="text-lg text-muted-foreground max-w-2xl mx-auto">
            Your values, wisdom, and stories are the most valuable assets you
            leave behind.
        </p>
    </div>

    <!-- Navigation -->
    <div class="flex justify-center gap-2 mb-12">
        <button
            on:click={() => (activeTab = "reflections")}
            class="px-6 py-3 rounded-full font-bold text-sm transition-all {activeTab ===
            'reflections'
                ? 'bg-[#304743] text-white shadow-lg transform -translate-y-0.5'
                : 'bg-white text-stone-500 hover:bg-stone-50'}"
        >
            Daily Reflections
        </button>
        <button
            on:click={() => (activeTab = "will")}
            class="px-6 py-3 rounded-full font-bold text-sm transition-all {activeTab ===
            'will'
                ? 'bg-[#304743] text-white shadow-lg transform -translate-y-0.5'
                : 'bg-white text-stone-500 hover:bg-stone-50'}"
        >
            Ethical Will
        </button>
        <button
            on:click={() => (activeTab = "lessons")}
            class="px-6 py-3 rounded-full font-bold text-sm transition-all {activeTab ===
            'lessons'
                ? 'bg-[#304743] text-white shadow-lg transform -translate-y-0.5'
                : 'bg-white text-stone-500 hover:bg-stone-50'}"
        >
            Life Lessons
        </button>
        <button
            on:click={() => (activeTab = "accomplishments")}
            class="px-6 py-3 rounded-full font-bold text-sm transition-all {activeTab ===
            'accomplishments'
                ? 'bg-amber-600 text-white shadow-lg transform -translate-y-0.5'
                : 'bg-white text-stone-500 hover:bg-stone-50'}"
        >
            Accomplishments
        </button>
    </div>

    <!-- Content Area -->
    <div class="min-h-[500px]">
        {#if activeTab === "reflections"}
            <div in:fade class="max-w-3xl mx-auto">
                <div
                    class="bg-white rounded-3xl p-8 shadow-sm border border-stone-200 relative overflow-hidden"
                >
                    <div
                        class="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-rose-300 via-purple-300 to-blue-300"
                    ></div>
                    <div class="flex justify-between items-start mb-2">
                        <h2
                            class="font-serif text-2xl font-bold text-[#304743]"
                        >
                            Daily Reflection
                        </h2>
                        <RefreshControl
                            label="Shuffle"
                            onRefresh={shuffleJournalPrompt}
                        />
                    </div>

                    <p class="text-stone-500 text-sm mb-6 min-h-[40px]">
                        {activeJournalPrompt}
                    </p>

                    <SmartTextarea
                        context="storytelling"
                        placeholder="Start writing here..."
                        bind:value={reflectionText}
                        minHeight="300px"
                    />

                    <div
                        class="flex justify-between items-center pt-6 border-t border-stone-100 mt-6"
                    >
                        <span class="text-xs font-bold text-stone-300 uppercase"
                            >{new Date().toLocaleDateString()}</span
                        >
                        <button
                            on:click={saveReflection}
                            class="px-5 py-2 rounded-full bg-[#304743] text-white font-bold text-sm hover:bg-[#233330] transition-colors"
                        >
                            Save Entry
                        </button>
                    </div>
                </div>
            </div>
        {:else if activeTab === "will"}
            <div in:fade>
                <EthicalWill />
            </div>
        {:else if activeTab === "lessons"}
            <div in:fade>
                <LifeLessons />
            </div>
        {:else if activeTab === "accomplishments"}
            <div in:fade>
                <AccomplishmentsGallery />
            </div>
        {/if}
    </div>
</div>
