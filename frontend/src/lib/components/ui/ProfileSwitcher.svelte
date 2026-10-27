<script lang="ts">
    import {
        currentProfileId,
        profiles,
    } from "$lib/stores/profileContext";
    import { dict } from "$lib/stores/conciergeStore.svelte";
    import {
        User,
        Check,
        ChevronDown,
        Users,
        Settings,
    } from "lucide-svelte";
    import { fade, slide } from "svelte/transition";
    import { goto } from "$app/navigation";

    let isOpen = $state(false);

    // Derived: Current Profile Object
    let activeProfile = $derived(
        $profiles.find((p) => p.id === $currentProfileId) ||
            $profiles[0] || { name: "User" },
    );

    // The owner's own profile is stored as "Me"; it shows in the active language (X232).
    const shownName = (name: string) => (name === "Me" ? $dict.profileMe : name);

    function toggleDropdown() {
        isOpen = !isOpen;
    }

    function selectProfile(id: string) {
        $currentProfileId = id;
        isOpen = false;
        // Reload page strictly not needed due to reactivity, but ensures clean slate feel
        // However, we want smooth transition, so we rely on store reactivity.
    }
</script>

<div class="relative w-full">
    <!-- Trigger Container -->
    <div
        class="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 transition-all group text-left relative overflow-hidden"
    >
        <!-- Clickable area for dropdown toggle -->
        <button
            class="flex items-center gap-3 flex-1 min-w-0"
            onclick={toggleDropdown}
            aria-expanded={isOpen}
        >
            <!-- Avatar -->
            <div
                class="w-10 h-10 rounded-full bg-white/15 ring-1 ring-white/25 flex items-center justify-center shadow-lg text-white font-bold shrink-0"
            >
                {shownName(activeProfile.name).charAt(0).toUpperCase()}
            </div>

            <!-- Info -->
            <div class="flex-1 min-w-0 text-left">
                <p
                    class="text-xs text-white/70 font-medium uppercase tracking-wider"
                >
                    {activeProfile.name === "Me" ||
                    activeProfile.name === "New User"
                        ? $dict.secureLegacy
                        : $dict.planningFor}
                </p>
                <p class="text-sm font-bold text-white truncate">
                    {shownName(activeProfile.name)}
                </p>
            </div>
        </button>

        <!-- Settings shortcut -->
        <button
            onclick={() => goto("/settings")}
            class="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
            title={$dict.settings}
        >
            <Settings size={16} class="text-white/70 hover:text-white" />
        </button>

        <!-- Dropdown toggle icon -->
        <button
            onclick={toggleDropdown}
            class="p-1 rounded-lg hover:bg-white/10 transition-colors"
            aria-label={$dict.familyCircle || "Family Circles"}
            aria-expanded={isOpen}
        >
            <ChevronDown
                size={16}
                class="text-white/70 transition-transform duration-300 {isOpen
                    ? 'rotate-180'
                    : ''}"
            />
        </button>

        <!-- Active Indicator Glow -->
        <div
            class="absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent opacity-50"
        ></div>
    </div>

    <!-- Dropdown Menu -->
    {#if isOpen}
        <div
            class="absolute bottom-full left-0 w-full mb-2 bg-slate-800 rounded-xl border border-slate-700 shadow-2xl overflow-hidden z-50 origin-bottom"
            transition:slide={{ duration: 200 }}
        >
            <div class="p-2 space-y-1">
                <div
                    class="px-3 py-2 text-xs font-bold text-slate-400 uppercase tracking-widest"
                >
                    {$dict.familyCircle || "Family Circles"}
                </div>

                <!-- Profile List -->
                {#each $profiles as profile}
                    <button
                        class="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-700/50 transition-colors group relative"
                        onclick={() => selectProfile(profile.id)}
                    >
                        <div
                            class="w-8 h-8 rounded-full bg-white/15 ring-1 ring-white/25 flex items-center justify-center text-xs text-white font-bold"
                        >
                            {shownName(profile.name).charAt(0)}
                        </div>
                        <div class="text-left flex-1">
                            <div
                                class="text-sm font-medium text-slate-200 group-hover:text-white transition-colors"
                            >
                                {shownName(profile.name)}
                            </div>
                        </div>
                        {#if $currentProfileId === profile.id}
                            <Check
                                size={16}
                                class="text-white"
                            />
                        {/if}
                    </button>
                {/each}

                <!-- Settings link -->
                <a
                    href="/settings"
                    class="w-full flex items-center gap-3 px-3 py-2.5 text-slate-300 hover:text-white hover:bg-white/5 transition-colors border-t border-slate-700/50 mt-2"
                    onclick={() => (isOpen = false)}
                >
                    <div
                        class="w-8 h-8 rounded-full bg-slate-700/50 flex items-center justify-center"
                    >
                        <Settings size={14} class="text-slate-400" />
                    </div>
                    <span class="text-sm font-medium">{$dict.settings}</span>
                </a>
            </div>
        </div>
    {/if}

    <!-- Background Click Overlay -->
    {#if isOpen}
        <button
            class="fixed inset-0 z-40 bg-black/20 cursor-default"
            onclick={toggleDropdown}
            transition:fade
            aria-label={$dict.closeDropdown}
        ></button>
    {/if}
</div>
