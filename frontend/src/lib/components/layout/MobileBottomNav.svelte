<script lang="ts">
    import { page } from "$app/stores";
    import { MoreHorizontal } from "lucide-svelte";
    import { navGroups } from "$lib/config/navigation";
    import { dict, language, userRole } from "$lib/stores/conciergeStore.svelte";

    // Core navigation items for mobile - limited to 4 main actions + more. Names, icons
    // and roles come from the sidebar's entries, so each role sees only the pages it can open.
    const mobileKeys = ["dashboard", "contacts", "documents", "pulse"];
    const navItems = navGroups.flatMap((g) => g.items);
    let mobileNavItems = $derived(
        mobileKeys
            .map((key) => navItems.find((i) => i.key === key))
            .filter((i) => i !== undefined && i.allowedRoles.includes($userRole))
            .map((i) => ({
                label: $language === "en" ? i!.label : $dict[i!.key] || i!.label,
                href: i!.href,
                icon: i!.icon,
            })),
    );

    let showMore = $state(false);

    function isActive(href: string): boolean {
        const path = $page.url.pathname;
        if (href === "/dashboard") {
            return path === "/dashboard";
        }
        return path.startsWith(href);
    }
</script>

<!-- Mobile Bottom Navigation - Only visible on small screens -->
<nav
    class="fixed bottom-0 left-0 right-0 z-40 lg:hidden bg-white border-t border-gray-200 shadow-lg shadow-black/10 safe-area-bottom"
    aria-label="Mobile navigation"
>
    <div class="flex items-stretch justify-around h-16">
        {#each mobileNavItems as item}
            {@const active = isActive(item.href)}
            <a
                href={item.href}
                class="flex flex-col items-center justify-center flex-1 py-2 px-1 transition-colors relative
                    {active
                        ? 'text-primary'
                        : 'text-gray-500 hover:text-gray-700'}"
                aria-current={active ? 'page' : undefined}
            >
                <!-- Active indicator -->
                {#if active}
                    <div class="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-1 bg-primary rounded-b-full"></div>
                {/if}

                <item.icon
                    class="w-6 h-6 mb-0.5 transition-transform {active ? 'scale-110' : ''}"
                />
                <span class="text-[10px] leading-tight text-center font-medium {active ? 'font-semibold' : ''}">
                    {item.label}
                </span>
            </a>
        {/each}

        <!-- More button - opens sidebar -->
        <button
            onclick={() => {
                // Dispatch event to open sidebar
                window.dispatchEvent(new CustomEvent('toggle-mobile-sidebar'));
            }}
            class="flex flex-col items-center justify-center flex-1 py-2 px-1 text-gray-500 hover:text-gray-700 transition-colors"
            aria-label="More options"
        >
            <MoreHorizontal class="w-6 h-6 mb-0.5" />
            <span class="text-[10px] font-medium">More</span>
        </button>
    </div>
</nav>

<style>
    /* Account for safe area on iOS devices */
    .safe-area-bottom {
        padding-bottom: env(safe-area-inset-bottom, 0);
    }
</style>
