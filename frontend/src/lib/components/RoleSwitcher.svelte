<script lang="ts">
    /**
     * Role Switcher Component (Development/Testing)
     *
     * Allows switching between user roles to test context-aware messaging.
     * This would typically be in Settings in production, but is useful for demos.
     */

    import { contextStore } from "$lib/stores/contextStore.svelte";
    import { UserCog, Users, Heart, Briefcase } from 'lucide-svelte';

    let isOpen = $state(false);

    const roles = [
        { value: 'planning', label: 'Planning (Owner)', icon: UserCog, color: 'indigo' },
        { value: 'executor', label: 'Executor Mode', icon: Briefcase, color: 'amber' },
        { value: 'family', label: 'Family Member', icon: Heart, color: 'rose' },
        { value: 'advisor', label: 'Advisor', icon: Users, color: 'emerald' }
    ] as const;

    function selectRole(role: 'planning' | 'executor' | 'family' | 'advisor') {
        contextStore.setRole(role);
        isOpen = false;
    }
</script>

<div class="relative">
    <button
        onclick={() => isOpen = !isOpen}
        class="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors"
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
