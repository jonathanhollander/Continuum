<script lang="ts">
    import { auth } from "$lib/stores/auth";
    import { aiRuntimeAssets, aiAssets, observeAIConfig, type AIHistoryMessage } from "$lib/services/aiCapabilities";
    import { captureSession, isCurrentSession } from "$lib/services/sessionOwnership";
    import { onDestroy } from "svelte";
    import { onMount } from "svelte";
    import { fade, fly } from "svelte/transition";
    import {
        LucideHeart,
        LucidePhone,
        LucideBookOpen,
        LucideMapPin,
        LucideShieldAlert,
        LucideArrowRight,
        LucideUsers,
        LucideMessageCircle,
        LucideHelpCircle,
    } from "lucide-svelte";
    import GriefResourceCard from "$lib/components/GriefResourceCard.svelte";
    import GriefChecklist from "$lib/components/GriefChecklist.svelte";
    import GuideViewer from "$lib/components/GuideViewer.svelte";
    import griefResources from "$lib/data/griefResources.json";
    import { getGuideById, type Guide } from "$lib/data/familyGuides";
    import { language as languageStore } from "$lib/stores/conciergeStore.svelte";
    import { t } from "$lib/stores/localization";
    import {
        getHotlinesByCountry,
        type Hotline,
    } from "$lib/services/hotlineService";
    import { aiGriefService } from "$lib/services/aiGriefService";
    import { handleFetchError } from "$lib/services/errorHandler";
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
    let discoveryAvailable = $state(false);
    let discoveryError = $state("");
    let chatError = $state("");

    // Chat State
    let chatInput = $state("");
    let isTyping = $state(false);
    let chatHistory = $state<(AIHistoryMessage & {historyContent?:string})[]>([]);
    let chatOwner = captureSession();
    let chatVersion = 0;
    $effect(() => observeAIConfig({purpose:'grief.chat'}));
    $effect(() => {
        $auth;
        if (!isCurrentSession(chatOwner)) {
            chatOwner = captureSession(); chatVersion++; chatHistory = []; chatInput = ''; chatError = ''; isTyping = false;
        }
        const greeting = aiAssets({purpose:'grief.chat'}, $aiRuntimeAssets)['routes/resources/grief-support/+page.svelte:greeting'];
        if (isCurrentSession(chatOwner) && !chatHistory.length && typeof greeting === 'string' && greeting) chatHistory = [{role:'assistant',source:'app',content:greeting}];
    });
    onDestroy(() => { chatVersion++; });

    // Guide Viewer State
    let selectedGuide = $state<Guide | null>(null);

    function handleResourceClick(resource: any) {
        if (resource.type === "guide") {
            const guide = getGuideById(resource.id);
            if (guide) {
                selectedGuide = guide;
            }
        }
    }

    function closeGuide() {
        selectedGuide = null;
    }

    const countries = [
        { code: "US", name: "United States" },
        { code: "UK", name: "United Kingdom" },
        { code: "CA", name: "Canada" },
        { code: "AU", name: "Australia" },
        { code: "DE", name: "Germany" },
        { code: "FR", name: "France" },
        { code: "ES", name: "Spain" },
        { code: "IE", name: "Ireland" },
        { code: "NZ", name: "New Zealand" },
        { code: "IN", name: "India" },
        { code: "JP", name: "Japan" },
        { code: "NL", name: "Netherlands" },
        { code: "ZA", name: "South Africa" },
    ];

    const filterCategories = [
        "All",
        "Self-Care",
        "Counseling",
        "Support Groups",
        "Conversations",
        "Talking to Family",
        "Executors",
        "Terminal Care",
        "Family Support",
    ];

    const iconMap: Record<string, any> = {
        LucideShieldAlert,
        LucideHeart,
        LucideBookOpen,
        LucideUsers,
        LucideMessageCircle,
        LucideHelpCircle,
    };

    // Language-to-country mapping for intelligent hotline defaults
    const languageToCountry: Record<string, string> = {
        en: "US",
        es: "ES",
        fr: "FR",
        de: "DE",
        ru: "US", // No Russian hotlines yet, default to US
        he: "US", // No Israeli hotlines yet, default to US
    };

    onMount(() => {
        mounted = true;

        // Set initial country based on UI language (user can override)
        const currentLang = $languageStore;
        selectedCountry = languageToCountry[currentLang] || "US";

        refreshHotlines();
    });

    // Local search needs sign-in and a configured provider; ask again when the session changes.
    $effect(() => {
        if (!$auth.isAuthenticated) { discoveryAvailable = false; return; }
        supportService.isDiscoveryAvailable().then((ok) => (discoveryAvailable = ok));
    });

    async function handleChat() {
        if (!chatInput.trim() || isTyping) return;

        const owner = captureSession(), version = ++chatVersion;
        if (!isCurrentSession(owner)) return;
        const userMsg = chatInput;
        chatInput = "";
        chatHistory = [...chatHistory, { role: "user", source: "user", content: userMsg }];

        isTyping = true;
        chatError = "";
        try {
            const response = await aiGriefService.chat(userMsg, chatHistory);
            if (version !== chatVersion || !isCurrentSession(owner)) return;
            if (response.failed) {
                // Keep the thread and the draft intact so Try again resends it once.
                chatHistory = chatHistory.slice(0, -1);
                chatInput = userMsg;
                chatError = response.content;
                return;
            }
            chatHistory = [
                ...chatHistory,
                { role: "assistant", source: "model", content: response.content, historyContent:response.historyContent },
            ];

            if (response.suggestAction === "hotline") {
                // Focus sidebar or highlight hotlines? Maybe later.
            }
        } catch (e) {
            if (version !== chatVersion || !isCurrentSession(owner)) return;
            // Take the unsent message back out of the thread and into the box so retry resends it once.
            chatHistory = chatHistory.slice(0, -1);
            chatInput = userMsg;
            chatError = handleFetchError(e).message;
        } finally {
            if (version === chatVersion && isCurrentSession(owner)) isTyping = false;
        }
    }

    async function handleDiscovery() {
        if (!searchLocation.trim() || isSearching) return;

        isSearching = true;
        showDiscovery = true;
        discoveryError = "";
        try {
            const response =
                await supportService.discoverLocalSupport(searchLocation);
            searchResults = response.results;
        } catch (e) {
            searchResults = [];
            discoveryError = e instanceof Error && !(e instanceof TypeError)
                ? e.message
                : handleFetchError(e).message;
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

    // JSON imports `type` and `tone` as string; the file only holds these values.
    type GriefResource = (typeof griefResources)[number] & {
        type: "article" | "video" | "external" | "guide";
        tone: "primary" | "gold";
    };
    const resources = griefResources as GriefResource[];

    const filteredResources = $derived(
        selectedCategory === "All"
            ? resources
            : resources.filter((r) => r.category === selectedCategory),
    );
</script>

<svelte:head>
    <title>Grief Support Sanctuary | Continuum</title>
</svelte:head>

<div
    class="min-h-screen bg-background text-foreground p-6 md:p-12"
>
    {#if mounted}
        <div in:fade={{ duration: 800 }} class="grief-sanctuary max-w-6xl mx-auto">
            <!-- Header Section -->
            <header class="mb-16 text-center">
                <div
                    class="inline-flex items-center justify-center p-3 mb-6 bg-card rounded-2xl backdrop-blur-xl border border-border shadow-2xl"
                >
                    <LucideHeart class="w-8 h-8 text-primary animate-pulse" />
                </div>
                <h1
                    class="text-4xl md:text-6xl font-serif font-light mb-6 bg-clip-text text-transparent bg-gradient-to-r from-foreground via-primary to-muted-foreground"
                >
                    Grief Support Sanctuary
                </h1>
                <p
                    class="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed"
                >
                    A quiet space for reflection, guidance, and discovery. You
                    can lean on others as you carry this.
                </p>
            </header>

            <!-- Main Grid -->
            <div class="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16">
                <!-- Checklist -->
                <div class="lg:col-span-2 space-y-8">
                    <!-- Gentle Guidance Checklist -->
                    <div in:fade={{ delay: 200, duration: 800 }}>
                        <GriefChecklist />
                    </div>

                </div>

                <!-- Crisis Center Sidebar -->
                <aside
                    in:fly={{ x: 20, delay: 600, duration: 600 }}
                    class="p-8 rounded-2xl bg-card backdrop-blur-xl border border-border h-fit sticky top-8"
                >
                    <div class="flex items-center justify-between gap-3 mb-8">
                        <div class="flex items-center gap-3">
                            <LucidePhone class="w-6 h-6 text-primary" />
                            <h2 class="text-xl font-medium text-foreground">Crisis Center</h2>
                        </div>

                        <select
                            aria-label="Country"
                            bind:value={selectedCountry}
                            class="bg-card border border-border rounded-lg px-2 py-1 text-xs text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
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
                                class="p-5 rounded-2xl bg-card border border-border hover:bg-muted transition-colors"
                            >
                                <p
                                    class="text-xs text-muted-foreground uppercase tracking-widest mb-1"
                                >
                                    {item.label}
                                </p>
                                <p
                                    class="text-2xl font-mono text-foreground tracking-wider"
                                >
                                    {item.number}
                                </p>
                            </div>
                        {/each}
                    </div>

                    <div
                        class="mt-8 p-6 rounded-2xl bg-primary/10 border border-primary/20"
                    >
                        <p
                            class="text-sm text-primary-hover italic leading-relaxed"
                        >
                            "If you are in danger or facing a medical
                            emergency, please reach out to your local emergency
                            services right away."
                        </p>
                    </div>
                </aside>
            </div>

            <!-- Library Section (full width below the checklist and Crisis Center) -->
            <div class="space-y-8 mb-16">
                    <!-- Filter Bar -->
                    <div
                        class="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide"
                    >
                        {#each filterCategories as category}
                            <button
                                onclick={() => (selectedCategory = category)}
                                class="px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 border {selectedCategory ===
                                category
                                    ? 'bg-primary/10 border-primary/30 text-foreground shadow-lg'
                                    : 'bg-transparent border-border/50 text-muted-foreground hover:border-border hover:text-foreground'}"
                            >
                                {category}
                            </button>
                        {/each}
                    </div>

                    <!-- Resources Grid -->
                    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {#each filteredResources as resource, i (resource.id)}
                            {#if resource.type === "guide"}
                                <button
                                    onclick={() =>
                                        handleResourceClick(resource)}
                                    class="grid text-left w-full"
                                >
                                    <GriefResourceCard
                                        {...resource}
                                        icon={iconMap[resource.iconName]}
                                        delay={100 + i * 50}
                                    />
                                </button>
                            {:else}
                                <GriefResourceCard
                                    {...resource}
                                    icon={iconMap[resource.iconName]}
                                    delay={100 + i * 50}
                                />
                            {/if}
                        {/each}

                        <!-- Local Search Discovery (shown when the server can search) -->
                        {#if discoveryAvailable}
                        <div
                            in:fly={{ y: 20, delay: 500, duration: 600 }}
                            class="p-8 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 backdrop-blur-xl border border-border flex flex-col items-start text-left group transition-all duration-500 md:col-span-2 lg:col-span-3"
                        >
                            <div
                                class="flex items-start justify-between w-full mb-6"
                            >
                                <LucideMapPin
                                    class="w-10 h-10 text-primary"
                                />
                                {#if showDiscovery}
                                    <button
                                        onclick={() => {
                                            showDiscovery = false;
                                            searchResults = [];
                                        }}
                                        class="text-xs text-muted-foreground hover:text-foreground"
                                    >
                                        Done for now
                                    </button>
                                {/if}
                            </div>

                            <h3 class="text-2xl font-medium mb-3 text-foreground">
                                Find Local Help
                            </h3>
                            <p class="text-muted-foreground mb-6 max-w-md">
                                Discover therapists, support groups, and
                                practitioners in your area who specialize in
                                bereavement care.
                            </p>

                            <div
                                class="flex w-full max-w-md flex-col items-start gap-3 group mb-8"
                            >
                                <label for="grief-city-search" class="sr-only">City or zip code</label>
                                <input
                                    id="grief-city-search"
                                    type="text"
                                    bind:value={searchLocation}
                                    placeholder="Enter your city or zip code..."
                                    onkeydown={(e) =>
                                        e.key === "Enter" && handleDiscovery()}
                                    class="w-full bg-card border border-border rounded-2xl px-6 py-4 focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all placeholder:text-muted-foreground"
                                />
                                <button
                                    onclick={handleDiscovery}
                                    disabled={!searchLocation.trim() ||
                                        isSearching}
                                    class="px-4 py-2 rounded-xl bg-primary/20 text-primary-hover hover:bg-primary/30 transition-all disabled:opacity-30 text-sm font-medium"
                                >
                                    {isSearching
                                        ? "Searching..."
                                        : "Find support"}
                                </button>
                            </div>

                            {#if discoveryError}
                                <div role="alert" class="w-full mb-4 p-4 rounded-2xl bg-card border border-border text-sm text-foreground">
                                    <p>{discoveryError}</p>
                                    <button
                                        onclick={handleDiscovery}
                                        class="mt-2 px-3 py-1.5 rounded-xl bg-primary/20 text-primary-hover hover:bg-primary/30 transition-all text-xs font-medium"
                                    >
                                        Try again
                                    </button>
                                </div>
                            {/if}

                            {#if showDiscovery && searchResults.length > 0}
                                <div class="w-full space-y-4" in:fade>
                                    {#each searchResults as result}
                                        <a
                                            href={result.url}
                                            target="_blank"
                                            class="block p-5 rounded-2xl bg-card border border-border hover:border-primary/30 hover:bg-muted transition-all"
                                        >
                                            <div
                                                class="flex justify-between items-start mb-2"
                                            >
                                                <h4
                                                    class="font-medium text-primary-hover"
                                                >
                                                    {result.title}
                                                </h4>
                                                <LucideArrowRight
                                                    class="w-4 h-4 text-primary"
                                                />
                                            </div>
                                            <p
                                                class="text-sm text-muted-foreground line-clamp-2"
                                            >
                                                {result.content}
                                            </p>
                                        </a>
                                    {/each}
                                </div>
                            {:else if showDiscovery && !isSearching && !discoveryError}
                                <div
                                    class="w-full p-8 border border-dashed border-border rounded-2xl text-center text-muted-foreground italic"
                                >
                                    A nearby city may have more support. We're
                                    glad to help you find resources.
                                </div>
                            {/if}
                        </div>
                        {/if}
                    </div>

                    <!-- Companion AI Section -->
                    <div
                        in:fade={{ delay: 800 }}
                        class="p-1 rounded-[2.5rem] bg-border/60 shadow-2xl mt-12"
                    >
                        <div
                            class="bg-card/90 backdrop-blur-2xl rounded-[2.4rem] p-8 space-y-8 border border-border"
                        >
                            <div class="flex items-center gap-4 mb-4">
                                <div
                                    class="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center border border-primary/20"
                                >
                                    <LucideHeart
                                        class="w-6 h-6 text-primary"
                                    />
                                </div>
                                <div>
                                    <h3 class="text-xl font-medium text-foreground">
                                        Bespoke Support
                                    </h3>
                                    <p class="text-sm text-muted-foreground italic">
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
                                            class="max-w-[85%] p-4 rounded-2xl {msg.role ===
                                            'user'
                                                ? 'bg-primary/20 border border-primary/20 text-foreground rounded-tr-none'
                                                : 'bg-card border border-border text-foreground rounded-tl-none'}"
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
                                            class="px-6 py-4 rounded-2xl bg-card border border-border"
                                        >
                                            <div class="flex gap-1">
                                                <div
                                                    class="w-1.5 h-1.5 bg-primary/50 rounded-full animate-bounce"
                                                ></div>
                                                <div
                                                    class="w-1.5 h-1.5 bg-primary/50 rounded-full animate-bounce [animation-delay:0.2s]"
                                                ></div>
                                                <div
                                                    class="w-1.5 h-1.5 bg-primary/50 rounded-full animate-bounce [animation-delay:0.4s]"
                                                ></div>
                                            </div>
                                        </div>
                                    </div>
                                {/if}
                            </div>

                            {#if chatError}
                                <div role="alert" class="p-4 rounded-2xl bg-card border border-border text-sm text-foreground">
                                    <p>{chatError}</p>
                                    <button
                                        onclick={handleChat}
                                        class="mt-2 px-3 py-1.5 rounded-xl bg-muted text-foreground hover:bg-primary/10 transition-all text-xs font-medium"
                                    >
                                        Try again
                                    </button>
                                </div>
                            {/if}

                            <div class="relative group">
                                <label for="grief-chat-input" class="sr-only">Share what's on your heart</label>
                                <input
                                    id="grief-chat-input"
                                    type="text"
                                    bind:value={chatInput}
                                    placeholder="Share what's on your heart..."
                                    onkeydown={(e) =>
                                        e.key === "Enter" && handleChat()}
                                    class="w-full bg-card border border-border rounded-2xl px-6 py-4 focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all placeholder:text-muted-foreground italic font-serif"
                                />
                                <button aria-label="Send"
                                    onclick={handleChat}
                                    disabled={!chatInput.trim() || isTyping}
                                    class="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-xl bg-muted text-foreground hover:bg-primary/10 transition-all disabled:opacity-30"
                                >
                                    <LucideArrowRight class="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
        </div>
    {/if}

    <!-- Guide Viewer Modal -->
    <GuideViewer guide={selectedGuide} onClose={closeGuide} />
</div>

<style>
    /* The resource-card titles take the page's text colour (and its hover accent). */
    .grief-sanctuary :global(h2),
    .grief-sanctuary :global(h3) {
        color: inherit;
    }
</style>
