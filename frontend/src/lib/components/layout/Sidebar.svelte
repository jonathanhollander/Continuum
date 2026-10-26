<script lang="ts">
    import { page } from "$app/stores";
    import { dict, userRole, language } from "$lib/stores/conciergeStore.svelte";
    import { estateProfile } from "$lib/stores/estateStore.svelte";
    import {
        navGroups,
        pulseSubNav,
        recipientPreviewEntry,
        recipientPreviewAfterGroup,
        helpEntry,
        helpAfterGroup,
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
    import { createEventDispatcher, tick, untrack } from "svelte";
    import { slide } from "svelte/transition";
    import logo from "$lib/assets/logo.png";
    import { logout } from "$lib/stores/keyringStore";
    import ProfileSwitcher from "$lib/components/ui/ProfileSwitcher.svelte";
    import { contextStore } from "$lib/stores/contextStore.svelte";
    import GettingStartedTracker from "$lib/components/GettingStartedTracker.svelte";
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

    // Filter Nav Items (Help & Resources closes the Extras group)
    let filteredNavGroups = $derived(
        navGroups
            .map((group) => ({
                ...group,
                items: (group.groupKey === helpAfterGroup
                    ? [...group.items, helpEntry]
                    : group.items
                ).filter((item) => item.allowedRoles.includes($userRole)),
            }))
            .filter((group) => group.items.length > 0),
    );

    // English names come from navigation.ts (they match the page headings);
    // other languages read the dictionary by key.
    const navText = (key: string, label: string) =>
        $language === "en" ? label : $dict[key] || label;
    // Group subtitles and link tooltips: English from navigation.ts, others from
    // the dictionary's navDesc / navTip by key (X232).
    const navDesc = (key: string, text?: string) =>
        !text || $language === "en" ? (text ?? "") : ($dict.navDesc as Record<string, string>)[key] || text;
    const navTip = (key: string, text?: string) =>
        !text || $language === "en" ? (text ?? "") : ($dict.navTip as Record<string, string>)[key] || text;

    // "For My Son (preview)": the owner's preview of their recipient's start page
    // (card D2). Looked up once per sign-in, and again on leaving Family & Contacts
    // (where a recipient is chosen), so a new choice appears on the next navigation.
    type Recipient = { contact_id: number; name: string; relation?: string | null };
    let recipient = $state<Recipient | null>(null);
    let recipientLookedUpFor: string | null = null;
    let lastPath = "";
    $effect(() => {
        const path = $page.url.pathname;
        const token = $auth.token;
        // Keyed by account, so a refreshed access token is no new sign-in.
        const account = $auth.user ? String($auth.user.id) : null;
        const leftContacts =
            lastPath.startsWith("/modules/contacts") && !path.startsWith("/modules/contacts");
        lastPath = path;
        if (!token || !account) {
            if (!token) {
                recipientLookedUpFor = null;
                recipient = null;
            }
            return;
        }
        if ($userRole !== "Owner" || path.startsWith("/for/")) return;
        if (recipientLookedUpFor === account && !leftContacts) return;
        recipientLookedUpFor = account;
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
                ? $dict.previewForRelation.replace(
                      "{relation}",
                      () => `${relation.charAt(0).toUpperCase()}${relation.slice(1)}`,
                  )
                : $dict.previewForName.replace("{name}", () => first),
            href: `/for/preview/${recipient.contact_id}`,
            tooltip: $dict.previewTip.replace("{name}", () => first),
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

    // "Building your foundation" teaser: shown whole or kept just below the
    // fold, never cut in half by the profile footer. When it fits under the
    // list it sits there; otherwise a spacer pushes its top to the nav's
    // bottom edge so it appears only once the list is scrolled.
    let teaserWrap = $state<HTMLElement | null>(null);
    let teaserSpacer = $state(0);
    $effect(() => {
        // Re-run when rows come and go (Pulse sub-nav, recipient preview).
        $page.url.pathname;
        previewItem;
        if (!navEl || !teaserWrap) return;
        const nav = navEl;
        const wrap = teaserWrap;
        const place = () => {
            const top =
                wrap.getBoundingClientRect().top -
                nav.getBoundingClientRect().top +
                nav.scrollTop;
            const height = wrap.offsetHeight - teaserSpacer;
            const room = nav.clientHeight;
            const next =
                height <= 0 || top + height <= room
                    ? 0
                    : Math.max(0, Math.ceil(room - top));
            if (next !== teaserSpacer) teaserSpacer = next;
        };
        const ro = new ResizeObserver(place);
        ro.observe(nav);
        for (const child of nav.children) ro.observe(child);
        untrack(place);
        return () => ro.disconnect();
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

</script>

<aside
    class="fixed lg:sticky top-0 left-0 z-50 lg:z-30 h-screen w-72 bg-primary-deep text-white transform transition-transform duration-300 ease-out lg:translate-x-0 flex flex-col shadow-2xl {isOpen
        ? 'translate-x-0'
        : '-translate-x-full'}"
>
    <!-- Logo Area -->
    <div class="p-6 border-b border-white/10 shrink-0">
        <div class="flex items-center justify-between mb-1">
            <div class="flex items-center gap-3">
                <div
                    class="w-10 h-10 rounded-lg overflow-hidden shadow-lg shadow-black/20"
                >
                    <img
                        src={logo}
                        alt={$dict.logoAlt}
                        class="w-full h-full object-cover"
                    />
                </div>
                <h1
                    class="font-bold text-xl tracking-tight text-white"
                >
                    Continuum
                </h1>
            </div>

            <button
                onclick={logout}
                class="p-2 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-all group"
                title={$dict.signOut}
            >
                <LogOut size={18} />
            </button>
        </div>
        <p class="text-xs text-white/70 pl-14">
            {$dict.tagline}
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
                            <Zap size={12} class="text-gold" />
                            <span
                                class="text-[10px] font-bold text-gold uppercase tracking-widest"
                            >
                                {navText(group.groupKey, group.groupLabel)}
                            </span>
                        </div>
                        {#if group.groupDescription}
                            <p
                                class="text-[10px] text-white/70 mt-0.5 pl-5"
                            >
                                {navDesc(group.groupKey, group.groupDescription)}
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
                                class="text-[10px] font-bold text-white/70 uppercase tracking-widest"
                            >
                                {navText(group.groupKey, group.groupLabel)}
                            </span>
                            {#if isGroupOpen(group)}
                                <ChevronDown
                                    size={14}
                                    class="text-white/70"
                                />
                            {:else}
                                <ChevronRight
                                    size={14}
                                    class="text-white/70"
                                />
                            {/if}
                        </div>
                        {#if group.groupDescription && !isGroupOpen(group)}
                            <p
                                class="text-[10px] text-white/70 mt-1 line-clamp-1 italic"
                            >
                                {navDesc(group.groupKey, group.groupDescription)}
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
                            <Tooltip content={navTip(item.key, item.tooltip)} position="right">
                                <a
                                    href={item.href}
                                    class="flex items-center gap-3 px-3 py-2.5 mx-1 rounded-xl transition-all duration-200 group relative overflow-hidden
                                    {isActive
                                        ? 'bg-white/20 text-white shadow-lg shadow-black/5 font-semibold'
                                        : 'text-white/80 hover:text-white hover:bg-white/10'}
                                    {isEssential
                                        ? 'ring-1 ring-gold/40'
                                        : ''}
                                    {group.isPrimary ? 'py-3' : ''}"
                                    aria-current={isActive ? "page" : undefined}
                                    onclick={handleClose}
                                >
                                    {#if isActive}
                                        <div
                                            class="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 rounded-r-full bg-white"
                                        ></div>
                                    {/if}

                                    <item.icon
                                        class="w-4 h-4 transition-transform duration-300 group-hover:scale-110 {isActive
                                            ? 'text-white'
                                            : 'text-white/70'}"
                                    />
                                    <span class="text-sm flex-1 min-w-0 truncate"
                                        >{navText(item.key, item.label)}</span
                                    >
                                    {#if item.isPreview}
                                        <span
                                            class="shrink-0 -ml-2 whitespace-nowrap text-[10px] font-medium leading-none px-1 py-1 rounded bg-black/20 text-white/90"
                                            data-testid="preview-tag"
                                            >{$dict.earlyPreview}</span
                                        >
                                    {/if}
                                    {#if item.isExternal}
                                        <ExternalLink
                                            size={12}
                                            class="text-white/70"
                                        />
                                    {/if}
                                    {#if isEssential}
                                        <Star
                                            size={12}
                                            class="text-gold"
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
                        class="text-[10px] font-bold text-white/70 uppercase tracking-widest"
                    >
                        {navText("pulseNavigation", "Pulse Navigation")}
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
                                    : 'text-white/80 hover:text-white hover:bg-white/10'}"
                                aria-current={isActive ? "page" : undefined}
                                onclick={handleClose}
                            >
                                {#if isActive}
                                    <div
                                        class="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 rounded-r-full bg-white"
                                    ></div>
                                {/if}
                                <item.icon
                                    class="w-4 h-4 transition-transform duration-300 group-hover:scale-110 {isActive
                                        ? 'text-white'
                                        : 'text-white/70'}"
                                />
                                <span class="text-sm flex-1">{navText(item.key, item.label)}</span>
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
                                : 'text-white/80 hover:text-white hover:bg-white/10'}"
                            onclick={handleClose}
                            data-testid="nav-recipient-preview"
                        >
                            <previewItem.icon
                                class="w-4 h-4 text-white/70 transition-transform duration-300 group-hover:scale-110"
                            />
                            <span class="text-sm flex-1">{previewItem.label}</span>
                        </a>
                    </Tooltip>
                </div>
            {/if}
        {/each}

        <!-- Getting Started Progress (shows until core actions complete) -->
        <div bind:this={teaserWrap} style="padding-top: {teaserSpacer}px">
            <GettingStartedTracker variant="sidebar" />
        </div>
    </nav>

    <!-- Sidebar Footer: Profile Switcher -->
    <div
        class="p-4 border-t border-white/10 shrink-0 bg-black/10 backdrop-blur-sm"
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
