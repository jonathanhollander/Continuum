<script lang="ts">
    import { onMount, createEventDispatcher } from "svelte";
    import {
        Search,
        X,
        Command,
        ArrowRight,
        FileText,
        Shield,
        User,
        Settings,
        Activity,
        Briefcase,
        Heart,
        Calendar,
        Dog,
        Scroll,
        Siren,
        Library,
        Wallet,
        Users,
        Files,
        History,
        QrCode,
        ShieldCheck,
        Sparkles,
        Box,
        BarChart3,
        Layers,
        BookOpen,
    } from "lucide-svelte";
    import { fade, scale } from "svelte/transition";
    import { quintOut } from "svelte/easing";
    import { page } from "$app/stores";
    import { goto } from "$app/navigation";

    import { insuranceStore } from "$lib/stores/insuranceStore";
    import { advancedAssetStore } from "$lib/stores/advancedAssetStore"; // Assuming basic asset store for now
    import { petStore } from "$lib/stores/petStore";
    import { medicalStore } from "$lib/stores/medicalStore";
    import { writable, derived } from "svelte/store";

    const dispatch = createEventDispatcher();
    let query = "";
    let selectedIndex = 0;
    let inputElement: HTMLInputElement;

    const searchItems = [
        {
            label: "Dashboard",
            href: "/",
            icon: Activity,
            keywords: ["home", "main"],
        },
        {
            label: "Assets & Wealth",
            href: "/modules/financial-accounts",
            icon: Wallet,
            keywords: ["money", "bank", "crypto"],
        },
        {
            label: "Property & Assets",
            href: "/modules/property",
            icon: Box,
            keywords: ["home", "real estate"],
        },
        {
            label: "Insurance Portfolio",
            href: "/modules/insurance",
            icon: Shield,
            keywords: ["policy", "life", "health"],
        },
        {
            label: "The Red Binder",
            href: "/binder",
            icon: Activity,
            keywords: ["physical", "documents"],
        },
        {
            label: "Executor Toolkit",
            href: "/modules/executor-toolkit",
            icon: Briefcase,
            keywords: ["checklist", "guide"],
        },
        {
            label: "Digital Guardian",
            href: "/modules/digital-guardian",
            icon: Shield,
            keywords: ["password", "accounts", "social"],
        },
        {
            label: "Document Vault",
            href: "/modules/legal-documents",
            icon: Files,
            keywords: ["storage", "upload", "legal"],
        },
        {
            label: "Health & Medical",
            href: "/modules/medical",
            icon: Heart,
            keywords: ["doctor", "prescription"],
        },
        {
            label: "Pet Care Plan",
            href: "/modules/pets",
            icon: Dog,
            keywords: ["vet", "food", "animal"],
        },
        {
            label: "Legacy Letters",
            href: "/modules/letters",
            icon: Heart,
            keywords: ["message", "love"],
        },
        {
            label: "Life Timeline",
            href: "/modules/timeline",
            icon: Calendar,
            keywords: ["history", "biography"],
        },
        {
            label: "Family & Contacts",
            href: "/modules/contacts",
            icon: Users,
            keywords: ["people", "phone"],
        },
        {
            label: "funeral Planner",
            href: "/modules/funeral",
            icon: Scroll,
            keywords: ["wishes", "burial"],
        },
    ];

    // Search Source based on stores
    // We create a derived store to auto-update search index when data changes
    const searchIndex = derived(
        [insuranceStore, petStore, medicalStore],
        ([$insurance, $pets, $medical]) => {
            const index = [
                ...searchItems.map((i) => ({
                    ...i,
                    type: "navigation",
                    description: "Jump to module",
                })),
                ...($insurance || []).map((p: any) => ({
                    label: p.provider + " " + p.insuranceType,
                    href: "/modules/insurance", // Could be deep link if supported
                    icon: Shield,
                    keywords: [
                        "policy",
                        "insurance",
                        p.provider,
                        p.policyNumber,
                    ],
                    type: "policy",
                    description: `Policy #${p.policyNumber || "N/A"}`,
                })),
                ...($pets || []).map((p: any) => ({
                    label: p.name,
                    href: "/modules/pets",
                    icon: Dog,
                    keywords: ["pet", "dog", "cat", p.breed],
                    type: "family",
                    description: `${p.species} - ${p.breed || "Unknown"}`,
                })),
                ...($medical?.directives || []).map((c: any) => ({
                    label: c.title,
                    href: "/modules/medical",
                    icon: Heart,
                    keywords: ["doctor", "medical", c.type],
                    type: "contact",
                    description: c.summary || c.type,
                })),
            ];
            return index;
        },
    );

    $: filteredItems = $searchIndex
        .filter((item) => {
            const text = (
                item.label + (item.keywords || []).join(" ")
            ).toLowerCase();
            return text.includes(query.toLowerCase());
        })
        .slice(0, 8); // Limit results

    $: if (filteredItems.length > 0 && selectedIndex >= filteredItems.length) {
        selectedIndex = 0;
    }

    onMount(() => {
        inputElement?.focus();
    });

    function handleKeydown(e: KeyboardEvent) {
        if (e.key === "ArrowDown") {
            e.preventDefault();
            selectedIndex = (selectedIndex + 1) % filteredItems.length;
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            selectedIndex =
                (selectedIndex - 1 + filteredItems.length) %
                filteredItems.length;
        } else if (e.key === "Enter") {
            e.preventDefault();
            if (filteredItems[selectedIndex]) {
                navigate(filteredItems[selectedIndex].href);
            }
        } else if (e.key === "Escape") {
            dispatch("close");
        }
    }

    function navigate(href: string) {
        goto(href);
        dispatch("close");
    }
</script>

<div
    class="fixed inset-0 z-[200] flex items-start justify-center pt-24 px-4 bg-slate-900/40 backdrop-blur-sm"
    on:click|self={() => dispatch("close")}
    transition:fade={{ duration: 200 }}
>
    <div
        class="w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-200"
        transition:scale={{ start: 0.95, easing: quintOut }}
        on:keydown={handleKeydown}
    >
        <!-- Search Header -->
        <div
            class="px-6 py-4 flex items-center gap-4 border-b border-slate-100"
        >
            <Search class="text-slate-400" size={20} />
            <input
                bind:this={inputElement}
                bind:value={query}
                placeholder="Search modules, features, or tools... (e.g. 'Will')"
                class="flex-1 bg-transparent border-none outline-none text-lg font-medium text-slate-800 placeholder:text-slate-300"
            />
            <div
                class="flex items-center gap-1 px-2 py-1 bg-slate-100 rounded-md border border-slate-200 text-[10px] font-bold text-slate-400 uppercase"
            >
                Esc
            </div>
        </div>

        <!-- Results List -->
        <div class="max-h-[400px] overflow-y-auto p-2 custom-scrollbar">
            {#if filteredItems.length > 0}
                <div
                    class="px-3 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest"
                >
                    Quick Navigation
                </div>
                {#each filteredItems as item, i}
                    <button
                        class="w-full flex items-center gap-4 px-4 py-3 rounded-2xl transition-all text-left
                        {i === selectedIndex
                            ? 'bg-indigo-50 text-indigo-700'
                            : 'text-slate-600 hover:bg-slate-50'}"
                        on:click={() => navigate(item.href)}
                        on:mouseenter={() => (selectedIndex = i)}
                    >
                        <div
                            class="p-2 rounded-xl {i === selectedIndex
                                ? 'bg-white shadow-sm'
                                : 'bg-slate-100 text-slate-500'}"
                        >
                            <svelte:component this={item.icon} size={18} />
                        </div>
                        <span class="flex-1 font-bold">{item.label}</span>
                        {#if i === selectedIndex}
                            <ArrowRight size={14} class="opacity-50" />
                        {/if}
                    </button>
                {/each}
            {:else}
                <div
                    class="flex flex-col items-center justify-center py-12 text-slate-400 space-y-4"
                >
                    <div class="p-4 bg-slate-50 rounded-full">
                        <Command size={32} />
                    </div>
                    <div class="text-center">
                        <p class="font-bold">No results found for "{query}"</p>
                        <p class="text-sm">
                            Try searching for 'Digital', 'Executor', or 'Will'
                        </p>
                    </div>
                </div>
            {/if}
        </div>

        <!-- Footer -->
        <div
            class="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wider"
        >
            <div class="flex items-center gap-4">
                <span class="flex items-center gap-1"
                    ><span
                        class="px-1.5 py-0.5 bg-white border border-slate-200 rounded text-slate-500"
                        >↑↓</span
                    > Navigate</span
                >
                <span class="flex items-center gap-1"
                    ><span
                        class="px-1.5 py-0.5 bg-white border border-slate-200 rounded text-slate-500"
                        >Enter</span
                    > Select</span
                >
            </div>
            <div class="flex items-center gap-1">
                Continuum Command Center
            </div>
        </div>
    </div>
</div>

<style>
    .custom-scrollbar::-webkit-scrollbar {
        width: 4px;
    }
    .custom-scrollbar::-webkit-scrollbar-track {
        background: transparent;
    }
    .custom-scrollbar::-webkit-scrollbar-thumb {
        background-color: rgba(0, 0, 0, 0.05);
        border-radius: 20px;
    }
</style>
