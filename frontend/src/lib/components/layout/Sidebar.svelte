<script lang="ts">
    import { page } from "$app/stores";
    import { dict, userRole, language } from "$lib/stores/conciergeStore.svelte";
    import { estateProfile } from "$lib/stores/estateStore.svelte";
    import {
        navGroups,
        pulseSubNav,
        recipientPreviewEntry,
        recipientPreviewAfterGroup,
    } from "$lib/config/navigation";
    import { auth } from "$lib/stores/auth";
    import { API_BASE_URL } from "$lib/config";
    import {
        ChevronDown,
        ChevronRight,
        Download,
        Users,
        LogOut,
        Star,
        Zap,
        ExternalLink,
    } from "lucide-svelte";
    import { createEventDispatcher, tick } from "svelte";
    import { slide } from "svelte/transition";
    import logo from "$lib/assets/logo.png";
    import { logout } from "$lib/stores/keyringStore";
    import ProfileSwitcher from "$lib/components/ui/ProfileSwitcher.svelte";
    import { contextStore } from "$lib/stores/contextStore.svelte";
    import GettingStartedTracker from "$lib/components/GettingStartedTracker.svelte";
    import { notifications } from "$lib/stores/notificationStore";
    import Tooltip from "$lib/components/ui/Tooltip.svelte";

    // Props
    interface Props {
        isOpen?: boolean;
        onClose?: () => void;
    }

    let { isOpen = $bindable(false), onClose } = $props();
    const dispatch = createEventDispatcher();

    // Accordion State: Key of the currently open group
    let openGroupKey = $state<string | null>(null);

    // Check if we're in Pulse section
    let isInPulseSection = $derived(
        $page.url.pathname.startsWith("/modules/pulse"),
    );

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

    // English names come from navigation.ts (they match the page headings);
    // other languages read the dictionary by key.
    const navText = (key: string, label: string) =>
        $language === "en" ? label : $dict[key] || label;

    // "For My Son (preview)": the owner's preview of their recipient's start page
    // (card D2). Looked up on each page change, so a recipient chosen in
    // Family & Contacts appears on the next navigation.
    type Recipient = { contact_id: number; name: string; relation?: string | null };
    let recipient = $state<Recipient | null>(null);
    $effect(() => {
        const path = $page.url.pathname;
        const token = $auth.token;
        if (!token || $userRole !== "Owner" || path.startsWith("/for/")) return;
        fetch(`${API_BASE_URL}/api/recipient/links`, {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then((r) => (r.ok ? r.json() : null))
            .then((rows: (Recipient & { is_recipient: boolean })[] | null) => {
                if (!Array.isArray(rows)) return;
                const chosen = rows.filter((r) => r.is_recipient);
                recipient =
                    chosen.find((r) => /^son$/i.test((r.relation || "").trim())) ??
                    chosen[0] ??
                    null;
            })
            .catch(() => {});
    });
    let previewItem = $derived.by(() => {
        if (!recipientPreviewEntry.allowedRoles.includes($userRole)) return null;
        if (!recipient) return null;
        const relation = (recipient.relation || "").trim();
        const first = recipient.name.trim().split(/\s+/)[0] || recipient.name;
        return {
            ...recipientPreviewEntry,
            label: relation
                ? `For My ${relation.charAt(0).toUpperCase()}${relation.slice(1)} (preview)`
                : `For ${first} (preview)`,
            href: `/for/preview/${recipient.contact_id}`,
            tooltip: `See the start page ${first} opens with their link`,
        };
    });

    // Keep the current page's link in view: after each navigation (and once its
    // group has opened) scroll the sidebar just enough to show it.
    let navEl = $state<HTMLElement | null>(null);
    $effect(() => {
        $page.url.pathname;
        filteredNavGroups;
        openGroupKey;
        if (!navEl) return;
        const el = navEl;
        tick().then(() => {
            const link = el.querySelector('a[aria-current="page"]');
            if (link) link.scrollIntoView({ block: "nearest" });
        });
        const t = setTimeout(() => {
            const link = el.querySelector('a[aria-current="page"]');
            if (link) link.scrollIntoView({ block: "nearest" });
        }, 350);
        return () => clearTimeout(t);
    });

    // Filter Pulse sub-nav
    let filteredPulseNav = $derived(
        pulseSubNav.filter((item) => item.allowedRoles.includes($userRole)),
    );

    // Effect: Auto-open the group containing the current page
    $effect(() => {
        const path = $page.url.pathname;

        // Find the group that should be open (skip primary groups which are always open)
        const activeGroup = filteredNavGroups.find(
            (group) =>
                !group.isPrimary &&
                group.items.some(
                    (item) => item.href === path || path.startsWith(item.href),
                ),
        );

        if (activeGroup) {
            openGroupKey = activeGroup.groupKey;
        } else if (!openGroupKey) {
            // Default to first non-collapsed, non-primary group if none open
            const defaultGroup = filteredNavGroups.find(
                (g) => !g.isCollapsedByDefault && !g.isPrimary,
            );
            if (defaultGroup) openGroupKey = defaultGroup.groupKey;
        }
    });

    function toggleGroup(key: string) {
        // Primary groups can't be collapsed
        const group = filteredNavGroups.find((g) => g.groupKey === key);
        if (group?.isPrimary) return;

        if (openGroupKey === key) {
            openGroupKey = null;
        } else {
            // "Accordion Mode": Close others, open this one
            openGroupKey = key;
        }
    }

    function isGroupOpen(group: (typeof filteredNavGroups)[0]): boolean {
        // Primary groups are always open
        if (group.isPrimary) return true;
        return openGroupKey === group.groupKey;
    }

    function handleClose() {
        if (onClose) onClose();
        isOpen = false;
    }

    function handleNavigation(event: MouseEvent, item: any) {
        if (item.behaviour === "background-tab") {
            event.preventDefault();
            const newWindow = window.open(item.href, "_blank");
            if (newWindow) {
                newWindow.blur();
                window.focus();
            }
            notifications.showInfo(
                "Treasure Hunt opened in a new tab. Return here when you're ready to continue.",
                "External Site Opened",
            );
            handleClose();
        } else {
            handleClose();
        }
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
                class="p-2 rounded-lg text-primary-foreground/70 hover:text-white hover:bg-white/10 transition-all group"
                title="Sign out"
            >
                <LogOut size={18} />
            </button>
        </div>
        <p class="text-xs text-primary-foreground/70 pl-14">
            Estate Planning Concierge
        </p>
    </div>

    <!-- Navigation -->
    <nav
        bind:this={navEl}
        class="flex-1 overflow-y-auto pt-4 pb-6 px-3 space-y-2 custom-scrollbar"
    >
        {#each filteredNavGroups as group, groupIndex}
            <div class="mb-2">
                <!-- Group Header -->
                {#if group.isPrimary}
                    <!-- Primary group: Always expanded, different styling -->
                    <div class="px-4 py-2 mb-1">
                        <div class="flex items-center gap-2">
                            <Zap size={12} class="text-amber-400" />
                            <span
                                class="text-[10px] font-bold text-amber-400/90 uppercase tracking-widest"
                            >
                                {navText(group.groupKey, group.groupLabel)}
                            </span>
                        </div>
                        {#if group.groupDescription}
                            <p
                                class="text-[10px] text-primary-foreground/50 mt-0.5 pl-5"
                            >
                                {group.groupDescription}
                            </p>
                        {/if}
                    </div>
                {:else}
                    <!-- Regular group: Collapsible accordion -->
                    <button
                        class="w-full flex flex-col items-start px-4 py-3 rounded-xl transition-all hover:bg-white/5 group border border-transparent
                        {isGroupOpen(group) ? 'bg-white/5 border-white/5' : ''}"
                        onclick={() => toggleGroup(group.groupKey)}
                        aria-expanded={isGroupOpen(group)}
                    >
                        <div class="w-full flex items-center justify-between">
                            <span
                                class="text-[10px] font-bold text-primary-foreground/60 uppercase tracking-widest"
                            >
                                {navText(group.groupKey, group.groupLabel)}
                            </span>
                            {#if isGroupOpen(group)}
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
                        {#if group.groupDescription && !isGroupOpen(group)}
                            <p
                                class="text-[10px] text-primary-foreground/40 mt-1 line-clamp-1 italic"
                            >
                                {group.groupDescription}
                            </p>
                        {/if}
                    </button>
                {/if}

                <!-- Group Items -->
                {#if isGroupOpen(group)}
                    <div
                        class="mt-1 space-y-1"
                        transition:slide={{ duration: 300 }}
                    >
                        {#each group.items as item}
                            {@const isEssential =
                                contextStore.isExecutor &&
                                item.isExecutorEssential}
                            {@const isActive =
                                $page.url.pathname ===
                                    item.href.split("#")[0] ||
                                (item.href === "/modules/pulse" &&
                                    isInPulseSection &&
                                    item.key === "pulse")}
                            <Tooltip content={item.tooltip ?? ""} position="right">
                                <a
                                    href={item.href}
                                    class="flex items-center gap-3 px-3 py-2.5 mx-1 rounded-xl transition-all duration-200 group relative overflow-hidden
                                    {isActive
                                        ? 'bg-white/20 text-white shadow-lg shadow-black/5 font-semibold'
                                        : 'text-primary-foreground/80 hover:text-white hover:bg-white/10'}
                                    {isEssential
                                        ? 'ring-1 ring-amber-400/30'
                                        : ''}
                                    {group.isPrimary ? 'py-3' : ''}"
                                    aria-current={isActive ? "page" : undefined}
                                    onclick={(e) => handleNavigation(e, item)}
                                >
                                    {#if isActive}
                                        <div
                                            class="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 rounded-r-full bg-white"
                                        ></div>
                                    {/if}

                                    <svelte:component
                                        this={item.icon}
                                        class="w-4 h-4 transition-transform duration-300 group-hover:scale-110 {isActive
                                            ? 'text-white'
                                            : 'text-primary-foreground/50'}"
                                    />
                                    <span class="text-sm flex-1 min-w-0 truncate"
                                        >{navText(item.key, item.label)}</span
                                    >
                                    {#if item.isPreview}
                                        <span
                                            class="shrink-0 whitespace-nowrap text-[10px] font-medium leading-none px-1 py-1 rounded bg-white/10 text-primary-foreground/70"
                                            data-testid="preview-tag"
                                            >Early preview</span
                                        >
                                    {/if}
                                    {#if item.isExternal}
                                        <ExternalLink
                                            size={12}
                                            class="text-primary-foreground/40"
                                        />
                                    {/if}
                                    {#if isEssential}
                                        <Star
                                            size={12}
                                            class="text-amber-400/60"
                                        />
                                    {/if}
                                </a>
                            </Tooltip>
                        {/each}
                    </div>
                {/if}
            </div>
            <!-- Pulse sub-navigation sits right under the Dashboard so it is in view without scrolling -->
            {#if groupIndex === 0}
        {#if isInPulseSection && filteredPulseNav.length > 1}
            <div class="mb-2 pb-2 border-b border-white/10">
                <div class="px-4 py-2 mb-1">
                    <span
                        class="text-[10px] font-bold text-primary-foreground/60 uppercase tracking-widest"
                    >
                        Pulse Navigation
                    </span>
                </div>
                <div class="space-y-1">
                    {#each filteredPulseNav as item}
                        {@const isActive = $page.url.pathname === item.href}
                        <Tooltip content={item.tooltip ?? ""} position="right">
                            <a
                                href={item.href}
                                class="flex items-center gap-3 px-3 py-2 mx-1 rounded-xl transition-all duration-200 group relative overflow-hidden
                                {isActive
                                    ? 'bg-white/20 text-white shadow-lg shadow-black/5 font-semibold'
                                    : 'text-primary-foreground/80 hover:text-white hover:bg-white/10'}"
                                aria-current={isActive ? "page" : undefined}
                                onclick={(e) => handleNavigation(e, item)}
                            >
                                {#if isActive}
                                    <div
                                        class="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 rounded-r-full bg-white"
                                    ></div>
                                {/if}
                                <svelte:component
                                    this={item.icon}
                                    class="w-4 h-4 transition-transform duration-300 group-hover:scale-110 {isActive
                                        ? 'text-white'
                                        : 'text-primary-foreground/50'}"
                                />
                                <span class="text-sm flex-1">{item.label}</span>
                            </a>
                        </Tooltip>
                    {/each}
                </div>
            </div>
        {/if}
            {/if}
            {#if group.groupKey === recipientPreviewAfterGroup && previewItem}
                {@const isActive = $page.url.pathname.startsWith("/for/preview/")}
                <div class="mb-2 space-y-1">
                    <Tooltip content={previewItem.tooltip ?? ""} position="right">
                        <a
                            href={previewItem.href}
                            class="flex items-center gap-3 px-3 py-2.5 mx-1 rounded-xl transition-all duration-200 group relative overflow-hidden
                            {isActive
                                ? 'bg-white/20 text-white font-semibold'
                                : 'text-primary-foreground/80 hover:text-white hover:bg-white/10'}"
                            onclick={handleClose}
                            data-testid="nav-recipient-preview"
                        >
                            <svelte:component
                                this={previewItem.icon}
                                class="w-4 h-4 text-primary-foreground/50 transition-transform duration-300 group-hover:scale-110"
                            />
                            <span class="text-sm flex-1">{previewItem.label}</span>
                        </a>
                    </Tooltip>
                </div>
            {/if}
        {/each}

        <!-- Getting Started Progress (shows until core actions complete) -->
        <GettingStartedTracker variant="sidebar" />
    </nav>

    <!-- Sidebar Footer: Profile Switcher -->
    <div
        class="p-4 border-t border-primary-foreground/10 shrink-0 bg-black/10 backdrop-blur-sm"
    >
        <ProfileSwitcher />
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
