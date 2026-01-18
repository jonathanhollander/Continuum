<script lang="ts">
    import { page } from "$app/stores";
    import { t, userRole } from "$lib/stores/concierge";
    import { estateProfile } from "$lib/stores/estateStore";
    import { navGroups } from "$lib/config/navigation";
    import {
        ChevronDown,
        ChevronRight,
        Settings,
        Download,
        Users,
        LogOut,
    } from "lucide-svelte";
    import { createEventDispatcher } from "svelte";
    import { slide } from "svelte/transition";
    import logo from "$lib/assets/logo.png";
    import { logout } from "$lib/stores/keyringStore";
    import ProfileSwitcher from "$lib/components/ui/ProfileSwitcher.svelte";

    // Props
    interface Props {
        isOpen?: boolean;
        onClose?: () => void;
    }

    let { isOpen = $bindable(false), onClose } = $props();
    const dispatch = createEventDispatcher();

    // Accordion State: Key of the currently open group
    let openGroupKey = $state<string | null>(null);

    // Filter Nav Items
    let filteredNavGroups = $derived(
        navGroups
            .map((group) => ({
                ...group,
                items: group.items.filter((item) =>
                    item.allowedRoles.includes($userRole),
                ),
            }))
            .filter((group) => group.items.length > 0),
    );

    // Effect: Auto-open the group containing the current page
    $effect(() => {
        const path = $page.url.pathname;

        // Find the group that should be open
        const activeGroup = filteredNavGroups.find((group) =>
            group.items.some((item) => item.href === path),
        );

        if (activeGroup) {
            openGroupKey = activeGroup.groupKey;
        } else if (!openGroupKey) {
            // Default to first non-collapsed group if none open
            const defaultGroup = filteredNavGroups.find(
                (g) => !g.isCollapsedByDefault,
            );
            if (defaultGroup) openGroupKey = defaultGroup.groupKey;
        }
    });

    function toggleGroup(key: string) {
        if (openGroupKey === key) {
            openGroupKey = null;
        } else {
            // "Accordion Mode": Close others, open this one
            openGroupKey = key;
        }
    }

    function handleClose() {
        if (onClose) onClose();
        isOpen = false;
    }
</script>

<aside
    class="fixed lg:sticky top-0 left-0 z-50 h-screen w-72 bg-primary text-primary-foreground transform transition-transform duration-300 ease-out lg:translate-x-0 flex flex-col shadow-2xl {isOpen
        ? 'translate-x-0'
        : '-translate-x-full'}"
>
    <!-- Logo Area -->
    <div class="p-6 border-b border-primary-foreground/10 shrink-0">
        <div class="flex items-center justify-between mb-1">
            <div class="flex items-center gap-3">
                <div
                    class="w-10 h-10 rounded-lg overflow-hidden shadow-lg shadow-black/20"
                >
                    <img
                        src={logo}
                        alt="Continuum Logo"
                        class="w-full h-full object-cover"
                    />
                </div>
                <h1
                    class="font-bold text-xl tracking-tight text-primary-foreground"
                >
                    Continuum
                </h1>
            </div>

            <button
                onclick={logout}
                class="p-2 rounded-lg text-primary-foreground/70 hover:text-red-200 hover:bg-red-400/20 transition-all group"
                title="Logout"
            >
                <LogOut size={18} />
            </button>
        </div>
        <p class="text-xs text-primary-foreground/70 pl-14">
            Estate Planning Concierge
        </p>
    </div>

    <!-- Navigation -->
    <nav class="flex-1 overflow-y-auto py-4 px-3 space-y-2 custom-scrollbar">
        {#each filteredNavGroups as group}
            <div class="mb-2">
                <!-- Group Header (Accordion Toggle) -->
                <button
                    class="w-full flex flex-col items-start px-4 py-3 rounded-xl transition-all hover:bg-white/5 group border border-transparent
                    {openGroupKey === group.groupKey
                        ? 'bg-white/5 border-white/5'
                        : ''}"
                    onclick={() => toggleGroup(group.groupKey)}
                    aria-expanded={openGroupKey === group.groupKey}
                >
                    <div class="w-full flex items-center justify-between">
                        <span
                            class="text-[10px] font-bold text-primary-foreground/60 uppercase tracking-widest"
                        >
                            {$t[group.groupKey] || group.groupLabel}
                        </span>
                        {#if openGroupKey === group.groupKey}
                            <ChevronDown
                                size={14}
                                class="text-primary-foreground/40"
                            />
                        {:else}
                            <ChevronRight
                                size={14}
                                class="text-primary-foreground/40"
                            />
                        {/if}
                    </div>
                    {#if group.groupDescription && openGroupKey !== group.groupKey}
                        <p
                            class="text-[10px] text-primary-foreground/40 mt-1 line-clamp-1 italic"
                        >
                            {group.groupDescription}
                        </p>
                    {/if}
                </button>

                <!-- Group Items -->
                {#if openGroupKey === group.groupKey}
                    <div
                        class="mt-1 space-y-1"
                        transition:slide={{ duration: 300 }}
                    >
                        {#each group.items as item}
                            <a
                                href={item.href}
                                class="flex items-center gap-3 px-3 py-2 mx-1 rounded-xl transition-all duration-200 group relative overflow-hidden
                            {$page.url.pathname === item.href.split('#')[0]
                                    ? 'bg-white/20 text-white shadow-lg shadow-black/5 font-semibold'
                                    : 'text-primary-foreground/80 hover:text-white hover:bg-white/10'}"
                                onclick={handleClose}
                            >
                                {#if $page.url.pathname === item.href.split("#")[0]}
                                    <div
                                        class="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 rounded-r-full bg-white"
                                    ></div>
                                {/if}

                                <svelte:component
                                    this={item.icon}
                                    class="w-4 h-4 transition-transform duration-300 group-hover:scale-110 {$page
                                        .url.pathname ===
                                    item.href.split('#')[0]
                                        ? 'text-white'
                                        : 'text-primary-foreground/50'}"
                                />
                                <span class="text-sm"
                                    >{$t[item.key] || item.label}</span
                                >
                            </a>
                        {/each}
                    </div>
                {/if}
            </div>
        {/each}
    </nav>

    <!-- Sidebar Footer: Profile & Settings -->
    <div
        class="p-4 border-t border-primary-foreground/10 shrink-0 bg-black/10 backdrop-blur-sm space-y-3"
    >
        <ProfileSwitcher />

        <a
            href="/settings"
            class="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 transition-all group text-left"
        >
            <div
                class="p-2 rounded-lg bg-black/20 group-hover:bg-black/30 transition-colors border border-white/10"
            >
                <Settings
                    class="w-4 h-4 text-primary-foreground/80 group-hover:text-white transition-colors"
                />
            </div>
            <div class="flex-1 min-w-0">
                <p
                    class="text-sm font-medium text-primary-foreground group-hover:text-white"
                >
                    {$t.settingsTitle}
                </p>
                <p
                    class="text-xs text-primary-foreground/60 group-hover:text-primary-foreground/80"
                >
                    {$t.settingsDesc}
                </p>
            </div>
        </a>
    </div>
</aside>

<style>
    /* Custom scrollbar for sidebar navigation */
    .custom-scrollbar::-webkit-scrollbar {
        width: 4px;
    }
    .custom-scrollbar::-webkit-scrollbar-track {
        background: transparent;
    }
    .custom-scrollbar::-webkit-scrollbar-thumb {
        background-color: rgba(255, 255, 255, 0.1);
        border-radius: 20px;
    }
    .custom-scrollbar::-webkit-scrollbar-thumb:hover {
        background-color: rgba(255, 255, 255, 0.2);
    }
</style>
