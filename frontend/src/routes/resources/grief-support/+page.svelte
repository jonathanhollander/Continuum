<script lang="ts">
    import { onMount } from "svelte";
    import { fade, fly } from "svelte/transition";
    import {
        LucideHeart,
        LucidePhone,
        LucideBookOpen,
        LucideMapPin,
        LucideShieldAlert,
        LucideArrowRight,
    } from "lucide-svelte";
    import GriefResourceCard from "$lib/components/GriefResourceCard.svelte";
    import GriefChecklist from "$lib/components/GriefChecklist.svelte";
    import griefResources from "$lib/data/griefResources.json";
    import { userRole, language as languageStore } from "$lib/stores/concierge";
    import { t } from "$lib/stores/localization";
    import {
        getHotlinesByCountry,
        type Hotline,
    } from "$lib/services/hotlineService";
    import { aiGriefService } from "$lib/services/aiGriefService";
    import {
        supportService,
        type SearchResult,
    } from "$lib/services/supportService";

    let mounted = $state(false);
    let selectedCountry = $state("US");
    let selectedCategory = $state("All");
    let emergencyNumbers = $state<Hotline[]>([]);

    // Discovery State
    let searchLocation = $state("");
    let isSearching = $state(false);
    let searchResults = $state<SearchResult[]>([]);
    let showDiscovery = $state(false);

    // Chat State
    let chatInput = $state("");
    let isTyping = $state(false);
    let chatHistory = $state<{ role: string; content: string }[]>([
        {
            role: "assistant",
            content:
                "I'm here. If you'd like to talk, or just need a quiet place to reflect, I'm sitting with you.",
        },
    ]);

    const countries = [
        { code: "US", name: "United States" },
        { code: "UK", name: "United Kingdom" },
        { code: "CA", name: "Canada" },
        { code: "AU", name: "Australia" },
    ];

    const filterCategories = [
        "All",
        "Executors",
        "Terminal Care",
        "Family Support",
    ];

    const iconMap: Record<string, any> = {
        LucideShieldAlert,
        LucideHeart,
        LucideBookOpen,
    };

    onMount(() => {
        mounted = true;

        // Initial country detection based on language store
        const currentLang = $languageStore;
        if (currentLang === "en") selectedCountry = "US";
        else if (currentLang === "es") selectedCountry = "US"; // Default to US for Spanish for now

        refreshHotlines();
    });

    async function handleChat() {
        if (!chatInput.trim() || isTyping) return;

        const userMsg = chatInput;
        chatInput = "";
        chatHistory = [...chatHistory, { role: "user", content: userMsg }];

        isTyping = true;
        try {
            const response = await aiGriefService.chat(userMsg, chatHistory);
            chatHistory = [
                ...chatHistory,
                { role: "assistant", content: response.content },
            ];

            if (response.suggestAction === "hotline") {
                // Focus sidebar or highlight hotlines? Maybe later.
            }
        } catch (e) {
            console.error(e);
        } finally {
            isTyping = false;
        }
    }

    async function handleDiscovery() {
        if (!searchLocation.trim() || isSearching) return;

        isSearching = true;
        showDiscovery = true;
        try {
            const response =
                await supportService.discoverLocalSupport(searchLocation);
            searchResults = response.results;
        } catch (e) {
            console.error(e);
        } finally {
            isSearching = false;
        }
    }

    function refreshHotlines() {
        emergencyNumbers = getHotlinesByCountry(selectedCountry);
    }

    $effect(() => {
        if (selectedCountry) refreshHotlines();
    });

    const filteredResources = $derived(
        selectedCategory === "All"
            ? griefResources
            : griefResources.filter((r) => r.category === selectedCategory),
    );
</script>

<svelte:head>
    <title>Grief Support Sanctuary | Continuum</title>
</svelte:head>

<div
    class="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-slate-100 p-6 md:p-12 mb-20"
>
    {#if mounted}
        <div in:fade={{ duration: 800 }} class="max-w-6xl mx-auto">
            <!-- Header Section -->
            <header class="mb-16 text-center">
                <div
                    class="inline-flex items-center justify-center p-3 mb-6 bg-white/5 rounded-2xl backdrop-blur-xl border border-white/10 shadow-2xl"
                >
                    <LucideHeart class="w-8 h-8 text-rose-400 animate-pulse" />
                </div>
                <h1
                    class="text-4xl md:text-6xl font-serif font-light mb-6 bg-clip-text text-transparent bg-gradient-to-r from-white via-rose-100 to-slate-300"
                >
                    Grief Support Sanctuary
                </h1>
                <p
                    class="text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed"
                >
                    A quiet space for reflection, guidance, and discovery. You
                    don't have to carry the weight alone.
                </p>
            </header>

            <!-- Main Grid -->
            <div class="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16">
                <!-- Library Section -->
                <div class="lg:col-span-2 space-y-8">
                    <!-- Gentle Guidance Checklist -->
                    <div in:fade={{ delay: 200, duration: 800 }}>
                        <GriefChecklist />
                    </div>

                    <!-- Filter Bar -->
                    <div
                        class="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide"
                    >
                        {#each filterCategories as category}
                            <button
                                onclick={() => (selectedCategory = category)}
                                class="px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 border {selectedCategory ===
                                category
                                    ? 'bg-white/10 border-white/20 text-white shadow-lg'
                                    : 'bg-transparent border-white/5 text-slate-500 hover:border-white/10 hover:text-slate-300'}"
                            >
                                {category}
                            </button>
                        {/each}
                    </div>

                    <!-- Resources Grid -->
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {#each filteredResources as resource, i (resource.id)}
                            <GriefResourceCard
                                {...resource}
                                icon={iconMap[resource.iconName]}
                                delay={100 + i * 50}
                            />
                        {/each}

                        <!-- Local Search Discovery -->
                        <div
                            in:fly={{ y: 20, delay: 500, duration: 600 }}
                            class="p-8 rounded-3xl bg-gradient-to-br from-indigo-500/10 to-rose-500/10 backdrop-blur-xl border border-white/10 flex flex-col items-start text-left group transition-all duration-500 {showDiscovery
                                ? 'md:col-span-2'
                                : ''}"
                        >
                            <div
                                class="flex items-start justify-between w-full mb-6"
                            >
                                <LucideMapPin
                                    class="w-10 h-10 text-indigo-400"
                                />
                                {#if showDiscovery}
                                    <button
                                        onclick={() => {
                                            showDiscovery = false;
                                            searchResults = [];
                                        }}
                                        class="text-xs text-slate-500 hover:text-slate-300"
                                    >
                                        Close Results
                                    </button>
                                {/if}
                            </div>

                            <h3 class="text-2xl font-medium mb-3">
                                Find Local Help
                            </h3>
                            <p class="text-slate-400 mb-6 max-w-md">
                                Discover therapists, support groups, and
                                practitioners in your area who specialize in
                                bereavement care.
                            </p>

                            <div class="relative w-full max-w-md group mb-8">
                                <input
                                    type="text"
                                    bind:value={searchLocation}
                                    placeholder="Enter your city or zip code..."
                                    onkeydown={(e) =>
                                        e.key === "Enter" && handleDiscovery()}
                                    class="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 transition-all placeholder:text-slate-600"
                                />
                                <button
                                    onclick={handleDiscovery}
                                    disabled={!searchLocation.trim() ||
                                        isSearching}
                                    class="absolute right-3 top-1/2 -translate-y-1/2 px-4 py-2 rounded-xl bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/30 transition-all disabled:opacity-30 text-sm font-medium"
                                >
                                    {isSearching ? "Searching..." : "Search"}
                                </button>
                            </div>

                            {#if showDiscovery && searchResults.length > 0}
                                <div class="w-full space-y-4" in:fade>
                                    {#each searchResults as result}
                                        <a
                                            href={result.url}
                                            target="_blank"
                                            class="block p-5 rounded-2xl bg-white/5 border border-white/5 hover:border-indigo-500/30 hover:bg-white/10 transition-all"
                                        >
                                            <div
                                                class="flex justify-between items-start mb-2"
                                            >
                                                <h4
                                                    class="font-medium text-indigo-100"
                                                >
                                                    {result.title}
                                                </h4>
                                                <LucideArrowRight
                                                    class="w-4 h-4 text-indigo-400"
                                                />
                                            </div>
                                            <p
                                                class="text-sm text-slate-400 line-clamp-2"
                                            >
                                                {result.content}
                                            </p>
                                        </a>
                                    {/each}
                                </div>
                            {:else if showDiscovery && !isSearching}
                                <div
                                    class="w-full p-8 border border-dashed border-white/10 rounded-2xl text-center text-slate-500 italic"
                                >
                                    No practitioners found in this area. Try a
                                    broader search.
                                </div>
                            {/if}
                        </div>
                    </div>

                    <!-- Companion AI Section -->
                    <div
                        in:fade={{ delay: 800 }}
                        class="p-1 rounded-[2.5rem] bg-gradient-to-br from-white/10 to-white/5 shadow-2xl mt-12"
                    >
                        <div
                            class="bg-slate-900/90 backdrop-blur-2xl rounded-[2.4rem] p-8 space-y-8 border border-white/5"
                        >
                            <div class="flex items-center gap-4 mb-4">
                                <div
                                    class="w-12 h-12 rounded-2xl bg-rose-500/20 flex items-center justify-center border border-rose-500/20"
                                >
                                    <LucideHeart
                                        class="w-6 h-6 text-rose-400"
                                    />
                                </div>
                                <div>
                                    <h3 class="text-xl font-medium">
                                        Bespoke Support
                                    </h3>
                                    <p class="text-sm text-slate-500 italic">
                                        "I'm sitting with you."
                                    </p>
                                </div>
                            </div>

                            <div
                                class="space-y-6 max-h-[400px] overflow-y-auto pr-4 scrollbar-thin scrollbar-thumb-white/10"
                            >
                                {#each chatHistory as msg}
                                    <div
                                        class="flex {msg.role === 'user'
                                            ? 'justify-end'
                                            : 'justify-start'}"
                                    >
                                        <div
                                            class="max-w-[85%] p-4 rounded-3xl {msg.role ===
                                            'user'
                                                ? 'bg-indigo-500/20 border border-indigo-500/20 text-indigo-100 rounded-tr-none'
                                                : 'bg-white/5 border border-white/10 text-slate-300 rounded-tl-none'}"
                                        >
                                            <p class="text-sm leading-relaxed">
                                                {msg.content}
                                            </p>
                                        </div>
                                    </div>
                                {/each}
                                {#if isTyping}
                                    <div class="flex justify-start">
                                        <div
                                            class="px-6 py-4 rounded-3xl bg-white/5 border border-white/10"
                                        >
                                            <div class="flex gap-1">
                                                <div
                                                    class="w-1.5 h-1.5 bg-rose-400/50 rounded-full animate-bounce"
                                                ></div>
                                                <div
                                                    class="w-1.5 h-1.5 bg-rose-400/50 rounded-full animate-bounce [animation-delay:0.2s]"
                                                ></div>
                                                <div
                                                    class="w-1.5 h-1.5 bg-rose-400/50 rounded-full animate-bounce [animation-delay:0.4s]"
                                                ></div>
                                            </div>
                                        </div>
                                    </div>
                                {/if}
                            </div>

                            <div class="relative group">
                                <input
                                    type="text"
                                    bind:value={chatInput}
                                    placeholder="Share what's on your heart..."
                                    onkeydown={(e) =>
                                        e.key === "Enter" && handleChat()}
                                    class="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 focus:outline-none focus:ring-2 focus:ring-rose-500/30 transition-all placeholder:text-slate-600 italic font-serif"
                                />
                                <button
                                    onclick={handleChat}
                                    disabled={!chatInput.trim() || isTyping}
                                    class="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-xl bg-white/10 text-white hover:bg-white/20 transition-all disabled:opacity-30"
                                >
                                    <LucideArrowRight class="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Crisis Center Sidebar -->
                <aside
                    in:fly={{ x: 20, delay: 600, duration: 600 }}
                    class="p-8 rounded-3xl bg-white/5 backdrop-blur-xl border border-white/10 h-fit sticky top-8"
                >
                    <div class="flex items-center justify-between gap-3 mb-8">
                        <div class="flex items-center gap-3">
                            <LucidePhone class="w-6 h-6 text-rose-400" />
                            <h2 class="text-xl font-medium">Crisis Center</h2>
                        </div>

                        <select
                            bind:value={selectedCountry}
                            class="bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-xs text-slate-400 focus:outline-none focus:ring-1 focus:ring-rose-500/50"
                        >
                            {#each countries as country}
                                <option value={country.code}
                                    >{country.code}</option
                                >
                            {/each}
                        </select>
                    </div>

                    <div class="space-y-6">
                        {#each emergencyNumbers as item}
                            <div
                                class="p-5 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors"
                            >
                                <p
                                    class="text-xs text-slate-500 uppercase tracking-widest mb-1"
                                >
                                    {item.label}
                                </p>
                                <p
                                    class="text-2xl font-mono text-white tracking-wider"
                                >
                                    {item.number}
                                </p>
                            </div>
                        {/each}
                    </div>

                    <div
                        class="mt-8 p-6 rounded-2xl bg-rose-500/10 border border-rose-500/20"
                    >
                        <p
                            class="text-sm text-rose-200/80 italic leading-relaxed"
                        >
                            "If you are in immediate danger or experiencing a
                            medical emergency, please call your local emergency
                            services immediately."
                        </p>
                    </div>
                </aside>
            </div>
        </div>
    {/if}
</div>

<style>
    :global(body) {
        background-color: #0f172a;
    }
</style>
