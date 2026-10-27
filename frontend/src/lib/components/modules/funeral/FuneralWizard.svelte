<script lang="ts">
    import { aiRuntimeAssets, aiAssets, assetStrings, observeAIConfig, aiSourceFacts } from "$lib/services/aiCapabilities";
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
        Info,
    } from "lucide-svelte";
    import { onDestroy, onMount } from "svelte";
    import {
        funeralStore,
        type FuneralWishes,
    } from "$lib/stores/funeralStore.svelte";
    import {
        FUNERAL_TRADITIONS,
        RENAMED_RITUALS,
        type TraditionConfig,
    } from "$lib/data/funeralTraditions";
    import SmartTextarea from "$lib/components/ui/SmartTextarea.svelte";
    import RefreshControl from "$lib/components/ui/RefreshControl.svelte";
    import GhostRow from "$lib/components/ui/GhostRow.svelte"; // NEW IMPORT

    // The page opens its budget tab from the last step.
    export let onOpenBudget: (() => void) | undefined = undefined;

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

    // Unsaved changes live in `draft` (shown at once) and are saved together
    // ~500 ms after the last one, one save at a time, the latest state winning.
    // The manager keeps the saved value, so a failed save drops the draft and
    // the screen returns to what was really saved (the manager shows the line).
    let draft: FuneralWishes | null = null;
    let saveTimer: ReturnType<typeof setTimeout> | null = null;
    let saving = false;
    let sending: FuneralWishes | null = null; // the draft the save in flight carries

    // Derived State
    $: wishes = draft ?? ($funeralStore?.wishes || funeralStore.wishes);
    $: activeTradition =
        FUNERAL_TRADITIONS[wishes.religiousTradition || "secular"];

    onMount(() => observeAIConfig({purpose:'writer.rewrite_text',variant:'funeral'}));
    $: configuredStarters = (aiAssets({purpose:'writer.rewrite_text',variant:'funeral'}, $aiRuntimeAssets)['lib/data/funeralTraditions.ts:smartTextareaPrompts'] as Record<string,Record<string,string[]>> | undefined)?.[wishes.religiousTradition || 'secular'];
    // Display and send the same selected question from the registered runtime pool.
    $: configuredQuestions = aiAssets({purpose:'writer.rewrite_text',variant:'funeral'}, $aiRuntimeAssets)['lib/data/reflectionPools.ts:funeral'] as Record<string,string[]> | undefined;
    let questions = { foundation: '', atmosphere: '', legacy: '' };
    $: if (configuredQuestions) {
        for (const category of ['foundation','atmosphere','legacy'] as const) {
            if (!questions[category] && configuredQuestions[category]?.length) questions = {...questions,[category]:configuredQuestions[category][0]};
        }
    }
    function refreshQuestion(category: 'foundation' | 'atmosphere' | 'legacy') {
        const pool = assetStrings(configuredQuestions?.[category]);
        if (!pool.length) return;
        const choices = pool.filter(question => question !== questions[category]);
        const next = choices.length ? choices : pool;
        questions = {...questions,[category]:next[Math.floor(Math.random()*next.length)]};
    }

    // Apply a change to the draft (never to the saved data) and queue a save.
    function edit(fn: (w: FuneralWishes) => FuneralWishes) {
        draft = fn(draft ?? funeralStore.wishes);
        if (saveTimer) clearTimeout(saveTimer);
        saveTimer = setTimeout(flush, 500);
    }

    async function flush() {
        if (saveTimer) clearTimeout(saveTimer);
        saveTimer = null;
        if (saving || !draft) return; // the save in flight picks up the newer draft
        const sent = draft;
        saving = true;
        sending = sent;
        try {
            await funeralStore.update((data) => ({ ...data, wishes: sent }));
            if (draft === sent) draft = null; // saved: show the server's copy
        } catch {
            // the manager rolled back and shows the gentle retry line
            draft = null;
            if (saveTimer) clearTimeout(saveTimer);
            saveTimer = null;
        } finally {
            saving = false;
            sending = null;
        }
        if (draft && !saveTimer) flush(); // changes made while that save ran
    }

    onDestroy(() => {
        if (saveTimer) flush();
    });

    // Leaving or reloading the page: the change not yet sent goes now (the manager's
    // write is keepalive, so it reaches the server as the page unloads).
    function sendBeforeLeaving() {
        if (saveTimer) clearTimeout(saveTimer);
        saveTimer = null;
        const pending = draft;
        if (!pending || pending === sending) return;
        sending = pending;
        funeralStore.update((data) => ({ ...data, wishes: pending })).catch(() => {});
    }
    onMount(() => {
        window.addEventListener("pagehide", sendBeforeLeaving);
        return () => window.removeEventListener("pagehide", sendBeforeLeaving);
    });

    // Actions
    function setTradition(key: string) {
        edit((w) => ({ ...w, religiousTradition: key }));
    }

    function setDisposition(type: string) {
        edit((w) => ({ ...w, disposition: type }));
    }

    // A ritual saved under its old name counts as the renamed one.
    function sameRitual(saved: string, ritual: string) {
        return saved === ritual || RENAMED_RITUALS[saved] === ritual;
    }

    function hasRitual(w: FuneralWishes, ritual: string) {
        return (w.ceremonyDetails?.rituals || []).some((r) => sameRitual(r, ritual));
    }

    function toggleRitual(ritual: string) {
        edit((w) => {
            const current = w.ceremonyDetails?.rituals || [];
            const rituals = hasRitual(w, ritual)
                ? current.filter((r) => !sameRitual(r, ritual))
                : [...current, ritual];
            return { ...w, ceremonyDetails: { ...w.ceremonyDetails, rituals } };
        });
    }

    function updateField(path: string[], value: any) {
        // Copy each object along the path, so the saved data stays untouched
        // and a failed save rolls back to the value that was really saved.
        edit((w) => {
            const wishes: any = { ...w };
            let current: any = wishes;
            for (let i = 0; i < path.length - 1; i++) {
                current[path[i]] = { ...(current[path[i]] || {}) };
                current = current[path[i]];
            }
            current[path[path.length - 1]] = value;
            return wishes;
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

    // "+ Add Song": an in-page field in place of the browser prompt.
    let newSong = "";
    function addSong() {
        const song = newSong.trim();
        if (!song) return;
        updateField(["music"], [...(wishes.music || []), song]);
        newSong = "";
    }

    function isForbidden(action: string) {
        return activeTradition.forbidden?.includes(action as any);
    }
</script>

<div
    class="bg-card rounded-2xl border border-border shadow-xl min-h-[600px] flex flex-col"
>
    <!-- Progress Header -->
    <div class="bg-muted border-b border-border p-6 rounded-t-2xl">
        <div class="flex justify-between max-w-3xl mx-auto relative">
            <!-- Progress Line -->
            <div
                class="absolute top-5 left-0 right-0 h-0.5 bg-border -z-0"
            ></div>
            <div
                class="absolute top-5 left-0 h-0.5 bg-primary -z-0 transition-all duration-500"
                style="width: {((currentStep - 1) / (STEPS.length - 1)) * 100}%"
            ></div>

            {#each STEPS as step}
                <div
                    class="relative z-10 flex flex-col items-center gap-2 cursor-pointer group"
                    role="button"
                    tabindex="0"
                    aria-current={step.id === currentStep ? "step" : undefined}
                    on:click={() => (currentStep = step.id)}
                    on:keydown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            currentStep = step.id;
                        }
                    }}
                >
                    <div
                        class="w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300
                        {step.id === currentStep
                            ? 'bg-primary border-primary text-primary-foreground shadow-lg scale-110'
                            : step.id < currentStep
                              ? 'bg-primary border-primary text-primary-foreground'
                              : 'bg-card border-slate-300 text-muted-foreground group-hover:border-primary/50'}"
                    >
                        <svelte:component this={step.icon} size={18} />
                    </div>
                    <div
                        class="text-[10px] font-bold uppercase tracking-widest transition-colors duration-300
                        {step.id === currentStep
                            ? 'text-primary-hover'
                            : 'text-muted-foreground'}"
                    >
                        {step.title}
                    </div>
                </div>
            {/each}
        </div>
    </div>

    <!-- Step Content -->
    <div class="flex-1 p-8 md:p-12">
        <div class="max-w-3xl mx-auto space-y-8">
            {#if currentStep === 1}
                <div in:fade class="space-y-8">
                    <div class="text-center space-y-2">
                        <h2
                            class="text-3xl font-serif font-bold text-primary-deep dark:text-primary-hover"
                        >
                            Faith & Foundation
                        </h2>
                        <p class="text-muted-foreground">
                            Choose the tradition that feels closest to your life
                            and values.
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
                                    ? 'border-primary bg-primary/5 shadow-md ring-1 ring-primary'
                                    : 'border-border hover:border-primary/30 bg-card'}"
                            >
                                <div class="font-bold text-foreground mb-1">
                                    {tradition.name}
                                </div>
                                <div
                                    class="text-xs text-muted-foreground line-clamp-2"
                                >
                                    {tradition.commonRituals
                                        .slice(0, 3)
                                        .join(", ")}...
                                </div>
                            </button>
                        {/each}
                    </div>

                    <a
                        href="/modules/funeral/traditions/{activeTradition.key}"
                        class="inline-flex items-center gap-2 text-sm font-bold text-primary hover:text-primary-deep dark:hover:text-primary-hover transition-colors"
                    >
                        <BookOpen size={16} /> Learn about {activeTradition.name} traditions
                        <ArrowRight size={14} />
                    </a>

                    <div class="flex justify-end mb-1">
                        <RefreshControl
                            onRefresh={() => refreshQuestion("foundation")}
                            label="New Question"
                        />
                    </div>
                    <SmartTextarea
                        job={{job_id:"funeral:wishes:foundation",document_type:"funeral",source_facts:aiSourceFacts({tradition:wishes.religiousTradition,mood:wishes.mood,ceremony:wishes.ceremonyDetails?.type})}}
                        label="Core Values & Wishes"
                        context="funeral"
                        placeholder={questions.foundation}
                        question={questions.foundation}
                        suggestions={assetStrings(configuredStarters?.foundation)}
                        value={wishes.ceremonyDetails?.type || ""}
                        onchange={(v) =>
                            updateField(["ceremonyDetails", "type"], v)}
                        minHeight="120px"
                    />
                </div>
            {:else if currentStep === 2}
                <div in:fade class="space-y-8">
                    <div class="text-center space-y-2">
                        <h2
                            class="text-3xl font-serif font-bold text-primary-deep dark:text-primary-hover"
                        >
                            The Farewell
                        </h2>
                        <p class="text-muted-foreground">
                            Your wishes for your final resting place.
                        </p>
                    </div>

                    <!-- Disposition -->
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <!-- Burial Option -->
                        <button
                            on:click={() => setDisposition("Burial")}
                            class="p-6 rounded-2xl border-2 text-left transition-all relative overflow-hidden group
                             {wishes.disposition === 'Burial'
                                ? 'border-primary bg-primary-soft'
                                : 'border-border hover:border-primary/30'}"
                        >
                            <div class="flex items-center gap-4 mb-4">
                                <div
                                    class="p-3 bg-card rounded-full shadow-sm text-primary"
                                >
                                    <Leaf size={24} />
                                </div>
                                <span class="font-bold text-xl text-foreground"
                                    >Burial</span
                                >
                            </div>
                            <p class="text-sm text-muted-foreground">
                                Traditional interment in the ground or a
                                mausoleum.
                            </p>
                        </button>

                        <!-- Cremation Option -->
                        <button
                            on:click={() =>
                                !isForbidden("cremation") &&
                                setDisposition("Cremation")}
                            aria-disabled={isForbidden("cremation")}
                            class="p-6 rounded-2xl border-2 text-left transition-all relative overflow-hidden group
                             {wishes.disposition === 'Cremation'
                                ? 'border-primary bg-primary-soft'
                                : 'border-border'}
                             {isForbidden('cremation')
                                ? 'cursor-not-allowed bg-muted'
                                : 'hover:border-primary/30'}"
                        >
                            <div class="flex items-center gap-4 mb-4">
                                <div
                                    class="p-3 bg-card rounded-full shadow-sm text-primary"
                                >
                                    <Flame size={24} />
                                </div>
                                <span class="font-bold text-xl text-foreground"
                                    >Cremation</span
                                >
                            </div>
                            {#if isForbidden("cremation")}
                                <div
                                    class="text-xs font-bold text-foreground bg-muted px-2 py-1 rounded inline-flex items-center gap-1 mb-2"
                                >
                                    <Info size={12} /> Many {activeTradition.name} families choose burial.
                                </div>
                            {/if}
                            <p class="text-sm text-muted-foreground">
                                A gentle return to ashes, held in an urn or scattered.
                            </p>
                        </button>
                    </div>

                    <!-- Prep Options -->
                    <div class="bg-muted rounded-xl p-6">
                        <h3
                            class="font-bold text-foreground mb-4 flex items-center gap-2"
                        >
                            <Droplets size={18} /> Body Preparation
                        </h3>
                        <div class="flex flex-wrap gap-3">
                            {#each [activeTradition.terminology.bodyPreparation, "Embalming", "Dressing", "Cosmetology"] as option}
                                {#if !["Embalming"].some((x) => x === option && isForbidden("embalming"))}
                                    <button
                                        class="px-4 py-2 rounded-lg border text-sm font-bold transition-all
                                        {hasRitual(wishes, option)
                                            ? 'bg-primary text-primary-foreground border-primary'
                                            : 'bg-card border-border text-muted-foreground hover:border-primary'}"
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
                            class="text-3xl font-serif font-bold text-primary-deep dark:text-primary-hover"
                        >
                            The Ceremony
                        </h2>
                        <p class="text-muted-foreground">
                            Where and how we gather to honor your life.
                        </p>
                    </div>

                    <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div class="space-y-4">
                            <label for="funeral-wizard-venue"
                                class="text-xs font-bold uppercase tracking-widest text-muted-foreground"
                                >Venue</label
                            >
                            <input id="funeral-wizard-venue"
                                type="text"
                                value={wishes.venue || ""}
                                on:change={(e) =>
                                    updateField(
                                        ["venue"],
                                        e.currentTarget.value,
                                    )}
                                placeholder="e.g. St. Mary's Church, The Beach, Funeral Home..."
                                class="w-full p-4 bg-muted border border-border rounded-xl focus:ring-2 focus:ring-primary outline-none font-medium"
                            />
                        </div>

                        <div class="space-y-4">
                            <label for="funeral-wizard-officiant"
                                class="text-xs font-bold uppercase tracking-widest text-muted-foreground"
                                >Officiant ({activeTradition.terminology
                                    .officiant})</label
                            >
                            <input id="funeral-wizard-officiant"
                                type="text"
                                value={wishes.ceremonyDetails?.officiant || ""}
                                on:change={(e) =>
                                    updateField(
                                        ["ceremonyDetails", "officiant"],
                                        e.currentTarget.value,
                                    )}
                                placeholder={`Name of ${activeTradition.terminology.officiant}...`}
                                class="w-full p-4 bg-muted border border-border rounded-xl focus:ring-2 focus:ring-primary outline-none font-medium"
                            />
                        </div>
                    </div>

                    <div
                        class="bg-primary-soft rounded-2xl p-8 border border-primary/10"
                    >
                        <h3
                            class="font-serif font-bold text-xl text-primary-deep dark:text-primary-hover mb-6 flex items-center gap-3"
                        >
                            <Scroll size={20} />
                            {activeTradition.name} Rituals
                        </h3>
                        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {#each activeTradition.commonRituals as ritual}
                                <button
                                    class="flex items-center gap-3 p-3 bg-card/50 hover:bg-card rounded-xl border border-transparent hover:border-primary/20 transition-all text-left group"
                                    on:click={() => toggleRitual(ritual)}
                                >
                                    <div
                                        class="w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors
                                        {hasRitual(wishes, ritual)
                                            ? 'bg-primary border-primary text-primary-foreground'
                                            : 'border-slate-300 text-transparent group-hover:border-primary'}"
                                    >
                                        <Check size={14} />
                                    </div>
                                    <span
                                        class="text-foreground font-medium group-hover:text-primary-deep dark:group-hover:text-primary-hover"
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
                            class="text-3xl font-serif font-bold text-primary-deep dark:text-primary-hover"
                        >
                            Atmosphere
                        </h2>
                        <p class="text-muted-foreground">
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
                        job={{job_id:"funeral:wishes:atmosphere",document_type:"funeral",source_facts:aiSourceFacts({tradition:wishes.religiousTradition,mood:wishes.mood,ceremony:wishes.ceremonyDetails?.type})}}
                        label="Vibe & Atmosphere"
                        context="funeral"
                        placeholder={questions.atmosphere}
                        question={questions.atmosphere}
                        suggestions={assetStrings(configuredStarters?.atmosphere)}
                        value={wishes.mood || ""}
                        onchange={(v) => updateField(["mood"], v)}
                        minHeight="150px"
                    />

                    <!-- Music & Flowers (Simplified for prototype) -->
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div
                            class="bg-card p-6 rounded-xl border border-border shadow-sm"
                        >
                            <h3
                                class="font-bold text-foreground mb-2 flex items-center gap-2"
                            >
                                <Music size={18} /> Music Requests
                            </h3>
                            <div class="space-y-2">
                                {#each wishes.music || [] as song, i}
                                    <div
                                        class="flex justify-between items-center text-sm p-2 bg-muted rounded"
                                    >
                                        <span>{song}</span>
                                        <button
                                            class="text-muted-foreground hover:text-foreground"
                                            aria-label="Remove this item"
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
                                <label
                                    for="funeral-wizard-song"
                                    class="sr-only">Share a song (Artist - Title)</label
                                >
                                <div class="flex gap-2 mt-2">
                                    <input
                                        id="funeral-wizard-song"
                                        type="text"
                                        bind:value={newSong}
                                        on:keydown={(e) => {
                                            if (e.key === "Enter") {
                                                e.preventDefault();
                                                addSong();
                                            }
                                        }}
                                        placeholder="Share a song (Artist - Title)"
                                        class="flex-1 min-w-0 text-sm p-2 bg-muted border border-border rounded-lg outline-none focus:ring-1 focus:ring-primary"
                                    />
                                    <button
                                        class="text-xs font-bold text-primary uppercase tracking-wide px-2 disabled:opacity-40"
                                        disabled={!newSong.trim()}
                                        on:click={addSong}>+ Add Song</button
                                    >
                                </div>
                            </div>
                        </div>

                        <div
                            class="bg-card p-6 rounded-xl border border-border shadow-sm"
                        >
                            <h3
                                class="font-bold text-foreground mb-2 flex items-center gap-2"
                            >
                                <Flower size={18} /> Floral Preferences
                            </h3>
                            <textarea
                                class="w-full text-sm bg-muted border border-border rounded-lg p-3 outline-none focus:ring-1 focus:ring-primary"
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
                            class="text-3xl font-serif font-bold text-primary-deep dark:text-primary-hover"
                        >
                            Legacy & Logistics
                        </h2>
                        <p class="text-muted-foreground">
                            Final details that carry your message.
                        </p>
                    </div>

                    <div class="flex justify-end mb-1">
                        <RefreshControl
                            onRefresh={() => refreshQuestion("legacy")}
                            label="New Question"
                        />
                    </div>
                    <SmartTextarea
                        job={{job_id:"funeral:wishes:legacy",document_type:"funeral",source_facts:aiSourceFacts({tradition:wishes.religiousTradition,mood:wishes.mood,ceremony:wishes.ceremonyDetails?.type})}}
                        label="Obituary Notes & Life Story"
                        context="funeral"
                        placeholder={questions.legacy}
                        question={questions.legacy}
                        suggestions={assetStrings(configuredStarters?.legacy)}
                        value={wishes.legacy?.obituaryNotes || ""}
                        onchange={(v) =>
                            updateField(["legacy", "obituaryNotes"], v)}
                        minHeight="180px"
                    />

                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div class="space-y-4">
                            <label for="funeral-wizard-charity-donations"
                                class="text-xs font-bold uppercase tracking-widest text-muted-foreground"
                                >Charity Donations</label
                            >
                            <input id="funeral-wizard-charity-donations"
                                type="text"
                                value={wishes.legacy?.charity || ""}
                                on:change={(e) =>
                                    updateField(
                                        ["legacy", "charity"],
                                        e.currentTarget.value,
                                    )}
                                placeholder="Organization name..."
                                class="w-full p-4 bg-muted border border-border rounded-xl focus:ring-2 focus:ring-primary outline-none font-medium"
                            />
                        </div>
                    </div>

                    <div
                        data-testid="funeral-onward"
                        class="bg-primary-soft rounded-2xl p-6 border border-primary/10 space-y-4"
                    >
                        <p class="font-serif text-lg text-primary-deep dark:text-primary-hover flex items-center gap-2">
                            <Check size={18} /> Your wishes are saved as you go.
                        </p>
                        <div class="flex flex-wrap gap-3">
                            {#if onOpenBudget}
                                <button
                                    on:click={onOpenBudget}
                                    class="px-5 py-2.5 bg-primary-deep hover:opacity-90 text-white rounded-xl font-bold text-sm flex items-center gap-2 transition-colors"
                                >
                                    Continue to Financial Care <ArrowRight size={16} />
                                </button>
                            {/if}
                            <a
                                href="/modules/letters"
                                class="px-5 py-2.5 bg-card border border-border hover:border-primary text-primary-deep dark:text-primary-hover rounded-xl font-bold text-sm flex items-center gap-2 transition-colors"
                            >
                                Continue to Letters to Loved Ones <ArrowRight size={16} />
                            </a>
                        </div>
                    </div>
                </div>
            {/if}
        </div>
    </div>

    <!-- Footer Controls -->
    <div
        class="p-6 bg-card border-t border-border rounded-b-2xl flex justify-between items-center"
    >
        <button
            on:click={prevStep}
            disabled={currentStep === 1}
            class="px-6 py-3 rounded-xl font-bold text-muted-foreground hover:bg-muted disabled:invisible transition-colors flex items-center gap-2"
        >
            <ArrowLeft size={18} /> Back
        </button>

        {#if currentStep < STEPS.length}
            <button
                on:click={nextStep}
                class="px-8 py-3 bg-primary-deep hover:opacity-90 text-white rounded-xl font-bold shadow-lg shadow-primary-deep/20 flex items-center gap-2 transition-all hover:-translate-y-0.5"
            >
                Continue <ArrowRight size={18} />
            </button>
        {/if}
    </div>
</div>
