<script lang="ts">
    import { askConfirm } from "$lib/components/ui/ConfirmModal.svelte";
    /**
     * Role Switcher (header)
     *
     * Switches the account's saved role (contextStore.setRole PATCHes users.user_role),
     * so each change asks first, the same confirm as Settings' choosePerspective (X156).
     */

    import { contextStore } from "$lib/stores/contextStore.svelte";
    import { UserCog, Users, Heart, Briefcase } from 'lucide-svelte';

    // dark: the header above this page is dark (layout's isDarkHeader), so the trigger text goes light.
    let { dark = false }: { dark?: boolean } = $props();

    let isOpen = $state(false);

    const roles = [
        { value: 'planning', label: 'Planning (Owner)', icon: UserCog, color: 'indigo' },
        { value: 'executor', label: 'Executor Mode', icon: Briefcase, color: 'amber' },
        { value: 'family', label: 'Family Member', icon: Heart, color: 'rose' },
        { value: 'advisor', label: 'Advisor', icon: Users, color: 'emerald' }
    ] as const;

    async function selectRole(role: 'planning' | 'executor' | 'family' | 'advisor') {
        isOpen = false;
        if (contextStore.role === role) return;
        const label = roles.find((r) => r.value === role)?.label ?? role;
        if (!(await askConfirm(`Change your perspective to ${label}? You can switch back here anytime.`, "Change my perspective"))) return;
        contextStore.setRole(role);
    }
</script>

<!-- z-50 keeps the trigger above the click-away backdrop (z-40), so it toggles the menu closed -->
<div class="relative z-50">
    <button
        onclick={() => isOpen = !isOpen}
        class="flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-colors {dark
            ? 'text-slate-300 hover:text-white hover:bg-white/10'
            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'}"
    >
        <UserCog size={16} />
        <span class="hidden md:inline">
            {roles.find(r => r.value === contextStore.role)?.label || 'Role'}
        </span>
    </button>

    {#if isOpen}
        <div class="absolute top-full right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-slate-200 py-2 z-50">
            <div class="px-3 py-2 text-xs font-bold uppercase text-slate-400 border-b border-slate-100 mb-2">
                Switch Context
            </div>
            {#each roles as role}
                {@const Icon = role.icon}
                <button
                    onclick={() => selectRole(role.value)}
                    class="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-slate-50 transition-colors {contextStore.role === role.value ? 'bg-slate-100' : ''}"
                >
                    <div class="w-8 h-8 rounded-lg bg-{role.color}-100 flex items-center justify-center text-{role.color}-600">
                        <Icon size={16} />
                    </div>
                    <div class="flex-1">
                        <div class="text-sm font-medium text-slate-900">
                            {role.label}
                        </div>
                    </div>
                    {#if contextStore.role === role.value}
                        <div class="w-2 h-2 rounded-full bg-{role.color}-500"></div>
                    {/if}
                </button>
            {/each}

            <div class="border-t border-slate-100 mt-2 pt-2 px-3 py-2">
                <div class="text-xs text-slate-500">
                    Context-aware messaging adapts language based on role.
                </div>
            </div>
        </div>
    {/if}
</div>

{#if isOpen}
    <button
        class="fixed inset-0 z-40"
        onclick={() => isOpen = false}
        aria-label="Close role switcher"
    ></button>
{/if}
