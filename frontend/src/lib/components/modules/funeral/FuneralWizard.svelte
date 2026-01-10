<script lang="ts">
    import { fade, slide } from "svelte/transition";
    import {
        Scroll,
        ArrowRight,
        ArrowLeft,
        Check,
        Heart,
        MapPin,
        Music,
        Flower,
        Users,
        BookOpen,
        User,
        Flag,
        Flame,
        Droplets,
        Leaf,
    } from "lucide-svelte";
    import { funeralStore } from "$lib/stores/funeralStore";
    import {
        FUNERAL_TRADITIONS,
        type TraditionConfig,
    } from "$lib/data/funeralTraditions";
    import SmartTextarea from "$lib/components/ui/SmartTextarea.svelte";
    import RefreshControl from "$lib/components/ui/RefreshControl.svelte"; // NEW IMPORT
    import { REFLECTION_POOLS } from "$lib/data/reflectionPools"; // NEW IMPORT

    // Steps
    const STEPS = [
        { id: 1, title: "Foundation", icon: Heart },
        { id: 2, title: "The Farewell", icon: User },
        { id: 3, title: "Ceremony", icon: Scroll },
        { id: 4, title: "Atmosphere", icon: Music },
        { id: 5, title: "Legacy", icon: BookOpen },
    ];

    let currentStep = 1;
    let direction = 1;

    // Derived State
    $: wishes = $funeralStore.wishes;
    $: activeTradition =
        FUNERAL_TRADITIONS[wishes.religiousTradition || "secular"];

    // Dynamic Questions State
    let questions = {
        foundation: REFLECTION_POOLS.funeral.foundation[0],
        atmosphere: REFLECTION_POOLS.funeral.atmosphere[0],
        legacy: REFLECTION_POOLS.funeral.legacy[0],
    };

    function refreshQuestion(category: "foundation" | "atmosphere" | "legacy") {
        const pool = REFLECTION_POOLS.funeral[category];
        let newQ;
        do {
            newQ = pool[Math.floor(Math.random() * pool.length)];
        } while (newQ === questions[category] && pool.length > 1);
        questions = { ...questions, [category]: newQ };
    }

    // Actions
    function setTradition(key: string) {
        funeralStore.update((data) => ({
            ...data,
            wishes: { ...data.wishes, religiousTradition: key },
        }));
    }

    function setDisposition(type: string) {
        funeralStore.update((data) => ({
            ...data,
            wishes: { ...data.wishes, disposition: type },
        }));
    }

    function toggleRitual(ritual: string) {
        const current = wishes.ceremonyDetails?.rituals || [];
        const newRituals = current.includes(ritual)
            ? current.filter((r) => r !== ritual)
            : [...current, ritual];

        funeralStore.update((data) => ({
            ...data,
            wishes: {
                ...data.wishes,
                ceremonyDetails: {
                    ...data.wishes.ceremonyDetails,
                    rituals: newRituals,
                },
            },
        }));
    }

    function updateField(path: string[], value: any) {
        funeralStore.update((data) => {
            const newData = { ...data };
            let current: any = newData.wishes;
            for (let i = 0; i < path.length - 1; i++) {
                if (!current[path[i]]) current[path[i]] = {};
                current = current[path[i]];
            }
            current[path[path.length - 1]] = value;
            return newData;
        });
    }

    function nextStep() {
        if (currentStep < STEPS.length) {
            direction = 1;
            currentStep++;
        }
    }

    function prevStep() {
        if (currentStep > 1) {
            direction = -1;
            currentStep--;
        }
    }

    function isForbidden(action: string) {
        return activeTradition.forbidden?.includes(action as any);
    }
</script>

<div
    class="bg-white rounded-3xl border border-stone-100 shadow-xl overflow-hidden min-h-[600px] flex flex-col"
>
    <!-- Progress Header -->
    <div class="bg-stone-50 border-b border-stone-100 p-6">
        <div class="flex justify-between max-w-3xl mx-auto relative">
            <!-- Progress Line -->
            <div
                class="absolute top-5 left-0 right-0 h-0.5 bg-stone-200 -z-0"
            ></div>
            <div
                class="absolute top-5 left-0 h-0.5 bg-[#4A7C74] -z-0 transition-all duration-500"
                style="width: {((currentStep - 1) / (STEPS.length - 1)) * 100}%"
            ></div>

            {#each STEPS as step}
                <div
                    class="relative z-10 flex flex-col items-center gap-2 cursor-pointer group"
                    on:click={() => (currentStep = step.id)}
                >
                    <div
                        class="w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300
                        {step.id === currentStep
                            ? 'bg-[#4A7C74] border-[#4A7C74] text-white shadow-lg scale-110'
                            : step.id < currentStep
                              ? 'bg-[#4A7C74] border-[#4A7C74] text-white'
                              : 'bg-white border-stone-300 text-stone-300 group-hover:border-[#4A7C74]/50'}"
                    >
                        <svelte:component this={step.icon} size={18} />
                    </div>
                    <div
                        class="text-[10px] font-bold uppercase tracking-widest transition-colors duration-300
                        {step.id === currentStep
                            ? 'text-[#4A7C74]'
                            : 'text-stone-400'}"
                    >
                        {step.title}
                    </div>
                </div>
            {/each}
        </div>
    </div>

    <!-- Step Content -->
    <div class="flex-1 p-8 md:p-12 overflow-y-auto">
        <div class="max-w-3xl mx-auto space-y-8">
            {#if currentStep === 1}
                <div in:fade class="space-y-8">
                    <div class="text-center space-y-2">
                        <h2
                            class="text-3xl font-serif font-bold text-[#304743]"
                        >
                            Faith & Foundation
                        </h2>
                        <p class="text-stone-500">
                            Select the tradition that best honors your life and
                            values.
                        </p>
                    </div>

                    <div
                        class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
                    >
                        {#each Object.values(FUNERAL_TRADITIONS) as tradition}
                            <button
                                on:click={() => setTradition(tradition.key)}
                                class="p-4 rounded-xl border-2 text-left transition-all hover:scale-[1.02]
                                {wishes.religiousTradition === tradition.key
                                    ? 'border-[#4A7C74] bg-[#4A7C74]/5 shadow-mdring-1 ring-[#4A7C74]'
                                    : 'border-stone-100 hover:border-[#4A7C74]/30 bg-white'}"
                            >
                                <div class="font-bold text-stone-800 mb-1">
                                    {tradition.name}
                                </div>
                                <div
                                    class="text-xs text-stone-500 line-clamp-2"
                                >
                                    {tradition.commonRituals
                                        .slice(0, 3)
                                        .join(", ")}...
                                </div>
                            </button>
                        {/each}
                    </div>

                    <div class="flex justify-end mb-1">
                        <RefreshControl
                            onRefresh={() => refreshQuestion("foundation")}
                            label="New Question"
                        />
                    </div>
                    <SmartTextarea
                        label="Core Values & Wishes"
                        context="funeral"
                        placeholder={questions.foundation}
                        suggestions={activeTradition.smartTextareaPrompts
                            .foundation || []}
                        value={wishes.ceremonyDetails?.type || ""}
                        on:change={(e) =>
                            updateField(["ceremonyDetails", "type"], e.detail)}
                        minHeight="120px"
                    />
                </div>
            {:else if currentStep === 2}
                <div in:fade class="space-y-8">
                    <div class="text-center space-y-2">
                        <h2
                            class="text-3xl font-serif font-bold text-[#304743]"
                        >
                            The Farewell
                        </h2>
                        <p class="text-stone-500">
                            Decisions regarding the preparation and resting
                            place of the body.
                        </p>
                    </div>

                    <!-- Disposition -->
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <!-- Burial Option -->
                        <button
                            on:click={() => setDisposition("Burial")}
                            class="p-6 rounded-2xl border-2 text-left transition-all relative overflow-hidden group
                             {wishes.disposition === 'Burial'
                                ? 'border-[#4A7C74] bg-[#FBF9EB]'
                                : 'border-stone-100 hover:border-[#4A7C74]/30'}"
                        >
                            <div class="flex items-center gap-4 mb-4">
                                <div
                                    class="p-3 bg-white rounded-full shadow-sm text-[#4A7C74]"
                                >
                                    <Leaf size={24} />
                                </div>
                                <span class="font-bold text-xl text-stone-800"
                                    >Burial</span
                                >
                            </div>
                            <p class="text-sm text-stone-600">
                                Traditional interment in the ground or a
                                mausoleum.
                            </p>
                        </button>

                        <!-- Cremation Option -->
                        <button
                            on:click={() =>
                                !isForbidden("cremation") &&
                                setDisposition("Cremation")}
                            class="p-6 rounded-2xl border-2 text-left transition-all relative overflow-hidden group
                             {wishes.disposition === 'Cremation'
                                ? 'border-[#4A7C74] bg-[#FBF9EB]'
                                : 'border-stone-100'}
                             {isForbidden('cremation')
                                ? 'opacity-50 cursor-not-allowed grayscale'
                                : 'hover:border-[#4A7C74]/30'}"
                        >
                            <div class="flex items-center gap-4 mb-4">
                                <div
                                    class="p-3 bg-white rounded-full shadow-sm text-orange-500"
                                >
                                    <Flame size={24} />
                                </div>
                                <span class="font-bold text-xl text-stone-800"
                                    >Cremation</span
                                >
                            </div>
                            {#if isForbidden("cremation")}
                                <div
                                    class="text-xs font-bold text-red-500 bg-red-50 px-2 py-1 rounded inline-block mb-2"
                                >
                                    Typically Forbidden in {activeTradition.name}
                                </div>
                            {/if}
                            <p class="text-sm text-stone-600">
                                Process of reducing the body to ashes/fragments.
                            </p>
                        </button>
                    </div>

                    <!-- Prep Options -->
                    <div class="bg-stone-50 rounded-xl p-6">
                        <h3
                            class="font-bold text-stone-700 mb-4 flex items-center gap-2"
                        >
                            <Droplets size={18} /> Body Preparation
                        </h3>
                        <div class="flex flex-wrap gap-3">
                            {#each [activeTradition.terminology.bodyPreparation, "Embalming", "Dressing", "Cosmetology"] as option}
                                {#if !["Embalming"].some((x) => x === option && isForbidden("embalming"))}
                                    <button
                                        class="px-4 py-2 rounded-lg border text-sm font-bold transition-all
                                        {wishes.ceremonyDetails?.rituals?.includes(
                                            option,
                                        )
                                            ? 'bg-[#4A7C74] text-white border-[#4A7C74]'
                                            : 'bg-white border-stone-200 text-stone-500 hover:border-[#4A7C74]'}"
                                        on:click={() => toggleRitual(option)}
                                    >
                                        {option}
                                    </button>
                                {/if}
                            {/each}
                        </div>
                    </div>
                </div>
            {:else if currentStep === 3}
                <div in:fade class="space-y-8">
                    <div class="text-center space-y-2">
                        <h2
                            class="text-3xl font-serif font-bold text-[#304743]"
                        >
                            The Ceremony
                        </h2>
                        <p class="text-stone-500">
                            Where and how we gather to honor your life.
                        </p>
                    </div>

                    <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div class="space-y-4">
                            <label
                                class="text-xs font-bold uppercase tracking-widest text-stone-400"
                                >Venue</label
                            >
                            <input
                                type="text"
                                value={wishes.venue || ""}
                                on:input={(e) =>
                                    updateField(
                                        ["venue"],
                                        e.currentTarget.value,
                                    )}
                                placeholder="e.g. St. Mary's Church, The Beach, Funeral Home..."
                                class="w-full p-4 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-[#4A7C74] outline-none font-medium"
                            />
                        </div>

                        <div class="space-y-4">
                            <label
                                class="text-xs font-bold uppercase tracking-widest text-stone-400"
                                >Officiant ({activeTradition.terminology
                                    .officiant})</label
                            >
                            <input
                                type="text"
                                value={wishes.ceremonyDetails?.officiant || ""}
                                on:input={(e) =>
                                    updateField(
                                        ["ceremonyDetails", "officiant"],
                                        e.currentTarget.value,
                                    )}
                                placeholder={`Name of ${activeTradition.terminology.officiant}...`}
                                class="w-full p-4 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-[#4A7C74] outline-none font-medium"
                            />
                        </div>
                    </div>

                    <div
                        class="bg-[#FBF9EB] rounded-2xl p-8 border border-[#4A7C74]/10"
                    >
                        <h3
                            class="font-serif font-bold text-xl text-[#304743] mb-6 flex items-center gap-3"
                        >
                            <Scroll size={20} />
                            {activeTradition.name} Rituals
                        </h3>
                        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {#each activeTradition.commonRituals as ritual}
                                <button
                                    class="flex items-center gap-3 p-3 bg-white/50 hover:bg-white rounded-xl border border-transparent hover:border-[#4A7C74]/20 transition-all text-left group"
                                    on:click={() => toggleRitual(ritual)}
                                >
                                    <div
                                        class="w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors
                                        {wishes.ceremonyDetails?.rituals?.includes(
                                            ritual,
                                        )
                                            ? 'bg-[#4A7C74] border-[#4A7C74] text-white'
                                            : 'border-stone-300 text-transparent group-hover:border-[#4A7C74]'}"
                                    >
                                        <Check size={14} />
                                    </div>
                                    <span
                                        class="text-stone-700 font-medium group-hover:text-[#304743]"
                                        >{ritual}</span
                                    >
                                </button>
                            {/each}
                        </div>
                    </div>
                </div>
            {:else if currentStep === 4}
                <div in:fade class="space-y-8">
                    <div class="text-center space-y-2">
                        <h2
                            class="text-3xl font-serif font-bold text-[#304743]"
                        >
                            Atmosphere
                        </h2>
                        <p class="text-stone-500">
                            Setting the tone, music, and feeling of the service.
                        </p>
                    </div>

                    <div class="flex justify-end mb-1">
                        <RefreshControl
                            onRefresh={() => refreshQuestion("atmosphere")}
                            label="New Question"
                        />
                    </div>
                    <SmartTextarea
                        label="Vibe & Atmosphere"
                        context="funeral"
                        placeholder={questions.atmosphere}
                        suggestions={activeTradition.smartTextareaPrompts
                            .atmosphere || []}
                        value={wishes.mood || ""}
                        on:change={(e) => updateField(["mood"], e.detail)}
                        minHeight="150px"
                    />

                    <!-- Music & Flowers (Simplified for prototype) -->
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div
                            class="bg-white p-6 rounded-xl border border-stone-200 shadow-sm"
                        >
                            <h3
                                class="font-bold text-stone-700 mb-2 flex items-center gap-2"
                            >
                                <Music size={18} /> Music Requests
                            </h3>
                            <div class="space-y-2">
                                {#each wishes.music || [] as song, i}
                                    <div
                                        class="flex justify-between items-center text-sm p-2 bg-stone-50 rounded"
                                    >
                                        <span>{song}</span>
                                        <button
                                            class="text-red-400 hover:text-red-600"
                                            on:click={() => {
                                                const newMusic =
                                                    wishes.music.filter(
                                                        (_, idx) => idx !== i,
                                                    );
                                                updateField(
                                                    ["music"],
                                                    newMusic,
                                                );
                                            }}>×</button
                                        >
                                    </div>
                                {/each}
                                <button
                                    class="text-xs font-bold text-[#4A7C74] uppercase tracking-wide mt-2"
                                    on:click={() => {
                                        const s = prompt(
                                            "Add Song (Artist - Title):",
                                        );
                                        if (s)
                                            updateField(
                                                ["music"],
                                                [...wishes.music, s],
                                            );
                                    }}>+ Add Song</button
                                >
                            </div>
                        </div>

                        <div
                            class="bg-white p-6 rounded-xl border border-stone-200 shadow-sm"
                        >
                            <h3
                                class="font-bold text-stone-700 mb-2 flex items-center gap-2"
                            >
                                <Flower size={18} /> Floral Preferences
                            </h3>
                            <textarea
                                class="w-full text-sm bg-stone-50 border border-stone-100 rounded-lg p-3 outline-none focus:ring-1 focus:ring-[#4A7C74]"
                                placeholder="e.g. White Lilies only, or 'In Lieu of Flowers'..."
                                value={wishes.flowers || ""}
                                on:change={(e) =>
                                    updateField(
                                        ["flowers"],
                                        e.currentTarget.value,
                                    )}
                            ></textarea>
                        </div>
                    </div>
                </div>
            {:else if currentStep === 5}
                <div in:fade class="space-y-8">
                    <div class="text-center space-y-2">
                        <h2
                            class="text-3xl font-serif font-bold text-[#304743]"
                        >
                            Legacy & Logistics
                        </h2>
                        <p class="text-stone-500">
                            Final details to ensure your message is heard.
                        </p>
                    </div>

                    <div class="flex justify-end mb-1">
                        <RefreshControl
                            onRefresh={() => refreshQuestion("legacy")}
                            label="New Question"
                        />
                    </div>
                    <SmartTextarea
                        label="Obituary Notes & Life Story"
                        context="funeral"
                        placeholder={questions.legacy}
                        suggestions={activeTradition.smartTextareaPrompts
                            .legacy || []}
                        value={wishes.legacy?.obituaryNotes || ""}
                        on:change={(e) =>
                            updateField(["legacy", "obituaryNotes"], e.detail)}
                        minHeight="180px"
                    />

                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div class="space-y-4">
                            <label
                                class="text-xs font-bold uppercase tracking-widest text-stone-400"
                                >Charity Donations</label
                            >
                            <input
                                type="text"
                                value={wishes.legacy?.charity || ""}
                                on:input={(e) =>
                                    updateField(
                                        ["legacy", "charity"],
                                        e.currentTarget.value,
                                    )}
                                placeholder="Organization name..."
                                class="w-full p-4 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-[#4A7C74] outline-none font-medium"
                            />
                        </div>
                    </div>
                </div>
            {/if}
        </div>
    </div>

    <!-- Footer Controls -->
    <div
        class="p-6 bg-white border-t border-stone-100 flex justify-between items-center"
    >
        <button
            on:click={prevStep}
            disabled={currentStep === 1}
            class="px-6 py-3 rounded-xl font-bold text-stone-500 hover:bg-stone-50 disabled:opacity-30 disabled:hover:bg-transparent transition-colors flex items-center gap-2"
        >
            <ArrowLeft size={18} /> Back
        </button>

        {#if currentStep < STEPS.length}
            <button
                on:click={nextStep}
                class="px-8 py-3 bg-[#304743] hover:bg-[#2A3F3B] text-white rounded-xl font-bold shadow-lg shadow-[#304743]/20 flex items-center gap-2 transition-all hover:-translate-y-0.5"
            >
                Next Step <ArrowRight size={18} />
            </button>
        {:else}
            <button
                class="px-8 py-3 bg-[#4A7C74] hover:bg-[#3b635d] text-white rounded-xl font-bold shadow-lg shadow-[#4A7C74]/20 flex items-center gap-2 transition-all hover:-translate-y-0.5"
            >
                <Check size={18} /> Save Plan
            </button>
        {/if}
    </div>
</div>
