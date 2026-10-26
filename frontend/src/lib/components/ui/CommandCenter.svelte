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
    class="fixed inset-0 z-[200] flex items-start justify-center pt-24 px-4 bg-slate-900/60 backdrop-blur-sm"
    onclick={(e) => { if (e.target === e.currentTarget) onclose(); }}
    transition:fade={{ duration: 200 }}
>
    <!-- Arrow keys and Enter for the results list are handled here; the dialog itself closes with Escape. -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div
        class="w-full max-w-2xl bg-card rounded-2xl shadow-2xl overflow-hidden border border-border"
        transition:scale={{ start: 0.95, easing: quintOut }}
        onkeydown={handleKeydown}
    >
        <!-- Search Header -->
        <div
            class="px-6 py-4 flex items-center gap-4 border-b border-border"
        >
            <Search class="text-muted-foreground" size={20} />
            <input
                bind:this={inputElement}
                bind:value={query}
                placeholder="Find what you're looking for..."
                class="flex-1 bg-transparent border-none outline-none text-lg font-medium text-foreground placeholder:text-muted-foreground"
            />
            <div
                class="flex items-center gap-1 px-2 py-1 bg-muted rounded-md border border-border text-[10px] font-bold text-muted-foreground uppercase"
            >
                Esc
            </div>
        </div>

        <!-- Results List -->
        <div class="max-h-[400px] overflow-y-auto p-2 custom-scrollbar">
            {#if filteredItems.length > 0}
                <div
                    class="px-3 py-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest"
                >
                    Where would you like to go?
                </div>
                {#each filteredItems as item, i}
                    {@const Icon = item.icon}
                    <button
                        class="w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all text-left
                        {i === selectedIndex
                            ? 'bg-primary-soft text-primary-hover'
                            : 'text-foreground hover:bg-background'}"
                        onclick={() => navigate(item.href)}
                        onmouseenter={() => (selectedIndex = i)}
                    >
                        <div
                            class="p-2 rounded-xl {i === selectedIndex
                                ? 'bg-card shadow-sm'
                                : 'bg-muted text-muted-foreground'}"
                        >
                            <Icon size={18} />
                        </div>
                        <span class="flex-1 min-w-0">
                            <span class="block font-bold">{item.label}</span>
                            {#if item.type !== "navigation" && item.description}
                                <span class="block text-xs font-normal text-muted-foreground truncate">{item.description}</span>
                            {/if}
                        </span>
                        {#if item.type !== "navigation"}
                            <span class="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{item.type}</span>
                        {/if}
                        {#if i === selectedIndex}
                            <ArrowRight size={14} class="opacity-50" />
                        {/if}
                    </button>
                {/each}
            {:else}
                <div
                    class="flex flex-col items-center justify-center py-12 text-muted-foreground space-y-4"
                >
                    <div class="p-4 bg-background rounded-full">
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
            class="p-4 bg-background border-t border-border flex items-center justify-between text-[10px] font-bold text-muted-foreground uppercase tracking-wider"
        >
            <div class="flex items-center gap-4">
                <span class="flex items-center gap-1"
                    ><span
                        class="px-1.5 py-0.5 bg-card border border-border rounded text-muted-foreground"
                        >↑↓</span
                    > Navigate</span
                >
                <span class="flex items-center gap-1"
                    ><span
                        class="px-1.5 py-0.5 bg-card border border-border rounded text-muted-foreground"
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
