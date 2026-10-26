<script lang="ts">
    import { focusTrap } from "$lib/actions/focusTrap";
    import { onMount } from "svelte";
    import { Search, Command, ArrowRight, Shield, Heart, Dog } from "lucide-svelte";
    import { fade, scale } from "svelte/transition";
    import { quintOut } from "svelte/easing";
    import { goto } from "$app/navigation";
    import {
        navGroups,
        catalogCategories,
        helpEntry,
        type NavItem,
    } from "$lib/config/navigation";
    import { dict, language, userRole } from "$lib/stores/conciergeStore.svelte";

    import { insuranceStore } from "$lib/stores/insuranceStore.svelte";
    import { petStore } from "$lib/stores/petStore.svelte";
    import { medicalStore } from "$lib/stores/medicalStore.svelte";

    let { onclose }: { onclose: () => void } = $props();
    let query = $state("");
    let selectedIndex = $state(0);
    let inputElement: HTMLInputElement | undefined = $state();

    // Every page in the sidebar and the catalog, each once (by href), with the names the
    // sidebar shows; only the pages the current role can open (G0e X-d).
    const extraKeywords: Record<string, string[]> = {
        dashboard: ["home", "main"],
        financial: ["money", "bank", "crypto", "assets", "wealth"],
        property: ["home", "real estate"],
        insurance: ["policy", "life", "health"],
        binder: ["physical", "documents", "print"],
        executor: ["checklist", "guide"],
        guardian: ["password", "accounts", "social"],
        documents: ["storage", "upload", "legal", "will"],
        medical: ["doctor", "prescription"],
        pets: ["vet", "food", "animal"],
        letters: ["message", "love"],
        timeline: ["history", "biography"],
        contacts: ["people", "phone", "family"],
        funeral: ["wishes", "burial", "funeral"],
        pulse: ["pulse", "check-in"],
        help: ["support", "faq", "questions"],
    };
    const allPages: NavItem[] = (() => {
        const seen = new Set<string>();
        return [
            ...navGroups.flatMap((g) => g.items),
            ...catalogCategories.flatMap((c) => c.items),
            helpEntry,
        ].filter((i) => !seen.has(i.href) && !!seen.add(i.href));
    })();
    const canOpen = (href: string) =>
        allPages.find((i) => i.href === href)?.allowedRoles.includes($userRole) ?? true;
    const pageName = (i: NavItem) =>
        $language === "en" ? i.label : ($dict as Record<string, string>)[i.key] || i.label;

    // Search Source based on stores
    // We create a derived store to auto-update search index when data changes
    const searchIndex = $derived.by(() => {
            const index = [
                ...allPages
                    .filter((i) => i.allowedRoles.includes($userRole))
                    .map((i) => ({
                        label: pageName(i),
                        href: i.href,
                        icon: i.icon,
                        keywords: [...(extraKeywords[i.key] ?? []), i.tooltip ?? ""],
                        type: "navigation",
                        description: "",
                    })),
                ...(insuranceStore.policies || []).map((p: any) => ({
                    label: p.insurer + " " + p.insuranceType,
                    href: "/modules/insurance",
                    icon: Shield,
                    keywords: ["policy", "insurance", p.insurer, p.policyNumber],
                    type: "policy",
                    description: p.policyNumber ? `Policy #${p.policyNumber}` : "",
                })),
                ...(petStore.items || []).map((p: any) => ({
                    label: p.name,
                    href: "/modules/pets",
                    icon: Dog,
                    keywords: ["pet", "dog", "cat", p.breed],
                    type: "pet",
                    description: [p.type, p.breed].filter(Boolean).join(" - "),
                })),
                ...(medicalStore.directives || []).map((c: any) => ({
                    label: c.title,
                    href: "/modules/medical",
                    icon: Heart,
                    keywords: ["doctor", "medical", c.type],
                    type: "directive",
                    description: c.summary || c.type,
                })),
            ].filter((i) => canOpen(i.href));
            return index;
    });

    const filteredItems = $derived(
        searchIndex
        .filter((item) => {
            const text = (
                item.label + " " + (item.keywords || []).join(" ")
            ).toLowerCase();
            return text.includes(query.toLowerCase());
        })
        .slice(0, 8), // Limit results
    );

    $effect(() => {
        if (filteredItems.length > 0 && selectedIndex >= filteredItems.length) {
            selectedIndex = 0;
        }
    });

    onMount(() => {
        inputElement?.focus();
    });

    function handleKeydown(e: KeyboardEvent) {
        if ((e.key === "ArrowDown" || e.key === "ArrowUp") && filteredItems.length === 0) {
            e.preventDefault();
            return;
        }
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
        }
    }

    function navigate(href: string) {
        goto(href);
        onclose();
    }
</script>

<!-- Clicking the dimmed area closes the dialog; Escape does the same through focusTrap. -->
<!-- svelte-ignore a11y_interactive_supports_focus, a11y_click_events_have_key_events -->
<div role="dialog" aria-modal="true" use:focusTrap={{ onEscape: () => onclose() }}
    class="fixed inset-0 z-[200] flex items-start justify-center pt-24 px-4 bg-slate-900/40 backdrop-blur-sm"
    onclick={(e) => { if (e.target === e.currentTarget) onclose(); }}
    transition:fade={{ duration: 200 }}
>
    <!-- Arrow keys and Enter for the results list are handled here; the dialog itself closes with Escape. -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div
        class="w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-200"
        transition:scale={{ start: 0.95, easing: quintOut }}
        onkeydown={handleKeydown}
    >
        <!-- Search Header -->
        <div
            class="px-6 py-4 flex items-center gap-4 border-b border-slate-100"
        >
            <Search class="text-slate-400" size={20} />
            <input
                bind:this={inputElement}
                bind:value={query}
                placeholder="Find what you're looking for..."
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
                    Where would you like to go?
                </div>
                {#each filteredItems as item, i}
                    {@const Icon = item.icon}
                    <button
                        class="w-full flex items-center gap-4 px-4 py-3 rounded-2xl transition-all text-left
                        {i === selectedIndex
                            ? 'bg-indigo-50 text-indigo-700'
                            : 'text-slate-600 hover:bg-slate-50'}"
                        onclick={() => navigate(item.href)}
                        onmouseenter={() => (selectedIndex = i)}
                    >
                        <div
                            class="p-2 rounded-xl {i === selectedIndex
                                ? 'bg-white shadow-sm'
                                : 'bg-slate-100 text-slate-500'}"
                        >
                            <Icon size={18} />
                        </div>
                        <span class="flex-1 min-w-0">
                            <span class="block font-bold">{item.label}</span>
                            {#if item.type !== "navigation" && item.description}
                                <span class="block text-xs font-normal text-slate-500 truncate">{item.description}</span>
                            {/if}
                        </span>
                        {#if item.type !== "navigation"}
                            <span class="text-[10px] font-bold uppercase tracking-wider text-slate-400">{item.type}</span>
                        {/if}
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
                        <p class="text-sm">
                            Try 'Digital', 'Executor' or 'Will' to find your way.
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
            <div class="flex items-center gap-1">Continuum Command Center</div>
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
