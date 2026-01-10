<script lang="ts">
    import {
        currentProfileId,
        profiles,
        type Profile,
    } from "$lib/stores/profileContext";
    import { t } from "$lib/stores/concierge";
    import { User, Plus, Check, ChevronDown, Users } from "lucide-svelte";
    import { fade, slide } from "svelte/transition";
    import { tick } from "svelte";

    let isOpen = $state(false);
    let newProfileName = $state("");
    let isCreating = $state(false);

    // Derived: Current Profile Object
    let activeProfile = $derived(
        $profiles.find((p) => p.id === $currentProfileId) ||
            $profiles[0] || { name: "User" },
    );

    function toggleDropdown() {
        isOpen = !isOpen;
        isCreating = false;
    }

    function selectProfile(id: string) {
        $currentProfileId = id;
        isOpen = false;
        // Reload page strictly not needed due to reactivity, but ensures clean slate feel
        // However, we want smooth transition, so we rely on store reactivity.
    }

    async function createProfile() {
        if (!newProfileName.trim()) return;

        const newId = crypto.randomUUID();
        const newProfile: Profile = {
            id: newId,
            name: newProfileName,
            role: "Family",
            created: Date.now(),
        };

        // Update profiles store
        $profiles = [...$profiles, newProfile];

        // Switch to new profile
        $currentProfileId = newId;

        // Reset UI
        newProfileName = "";
        isCreating = false;
        isOpen = false;
    }

    // Helper to generate a consistent color from name
    function getAvatarColor(name: string) {
        const colors = [
            "bg-blue-500",
            "bg-green-500",
            "bg-purple-500",
            "bg-yellow-500",
            "bg-pink-500",
            "bg-indigo-500",
        ];
        let hash = 0;
        for (let i = 0; i < name.length; i++) {
            hash = name.charCodeAt(i) + ((hash << 5) - hash);
        }
        return colors[Math.abs(hash) % colors.length];
    }
</script>

<div class="relative w-full">
    <!-- Trigger Button -->
    <button
        class="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 transition-all group text-left relative overflow-hidden"
        onclick={toggleDropdown}
    >
        <!-- Avatar -->
        <div
            class="w-10 h-10 rounded-full {getAvatarColor(
                activeProfile.name,
            )} flex items-center justify-center shadow-lg text-white font-bold shrink-0"
        >
            {activeProfile.name.charAt(0).toUpperCase()}
        </div>

        <!-- Info -->
        <div class="flex-1 min-w-0">
            <p
                class="text-xs text-slate-400 font-medium uppercase tracking-wider"
            >
                {$t.planningFor}
            </p>
            <p class="text-sm font-bold text-white truncate">
                {activeProfile.name}
            </p>
        </div>

        <ChevronDown
            size={16}
            class="text-slate-500 transition-transform duration-300 {isOpen
                ? 'rotate-180'
                : ''}"
        />

        <!-- Active Indicator Glow -->
        <div
            class="absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-transparent via-indigo-500 to-transparent opacity-50"
        ></div>
    </button>

    <!-- Dropdown Menu -->
    {#if isOpen}
        <div
            class="absolute bottom-full left-0 w-full mb-2 bg-slate-800 rounded-xl border border-slate-700 shadow-2xl overflow-hidden z-50 origin-bottom"
            transition:slide={{ duration: 200 }}
        >
            <div class="p-2 space-y-1">
                <div
                    class="px-3 py-2 text-xs font-bold text-slate-500 uppercase tracking-widest"
                >
                    {$t.familyCircle || "Family Circles"}
                </div>

                <!-- Profile List -->
                {#each $profiles as profile}
                    <button
                        class="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-700/50 transition-colors group relative"
                        onclick={() => selectProfile(profile.id)}
                    >
                        <div
                            class="w-8 h-8 rounded-full {getAvatarColor(
                                profile.name,
                            )} flex items-center justify-center text-xs text-white font-bold"
                        >
                            {profile.name.charAt(0)}
                        </div>
                        <div class="text-left flex-1">
                            <div
                                class="text-sm font-medium text-slate-200 group-hover:text-white transition-colors"
                            >
                                {profile.name}
                            </div>
                        </div>
                        {#if $currentProfileId === profile.id}
                            <Check size={16} class="text-indigo-400" />
                        {/if}
                    </button>
                {/each}

                <!-- Create New Profile -->
                {#if isCreating}
                    <div
                        class="mt-2 p-2 bg-slate-900/50 rounded-lg border border-slate-700/50 animate-in fade-in"
                    >
                        <input
                            bind:value={newProfileName}
                            placeholder="Name (e.g. Spouse)"
                            class="w-full bg-transparent text-sm text-white placeholder:text-slate-600 outline-none mb-2"
                            autofocus
                            onkeydown={(e) =>
                                e.key === "Enter" && createProfile()}
                        />
                        <div class="flex gap-2">
                            <button
                                onclick={createProfile}
                                class="flex-1 py-1 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded"
                            >
                                Create
                            </button>
                            <button
                                onclick={() => (isCreating = false)}
                                class="px-2 py-1 text-xs text-slate-400 hover:text-white"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                {:else}
                    <button
                        class="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-slate-400 hover:text-indigo-300 hover:bg-indigo-500/10 transition-colors mt-2 border-t border-slate-700/50"
                        onclick={() => {
                            isCreating = true;
                            tick().then(() =>
                                document.querySelector("input")?.focus(),
                            );
                        }}
                    >
                        <div
                            class="w-8 h-8 rounded-full border-2 border-dashed border-slate-600 flex items-center justify-center"
                        >
                            <Plus size={14} />
                        </div>
                        <span class="text-sm font-medium"
                            >Add Family Member</span
                        >
                    </button>
                {/if}
            </div>
        </div>
    {/if}

    <!-- Background Click Overlay -->
    {#if isOpen}
        <button
            class="fixed inset-0 z-40 bg-black/20 cursor-default"
            onclick={toggleDropdown}
            transition:fade
            aria-label="Close dropdown"
        ></button>
    {/if}
</div>
