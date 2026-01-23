<script lang="ts">
    import { fade, fly } from 'svelte/transition';
    import { User, Users, Briefcase, Heart, ArrowLeft, ArrowRight } from 'lucide-svelte';
    import { onboardingFlowStore, type UserRole } from "$lib/stores/onboardingFlowStore.svelte.ts";

    const roles: { id: UserRole; icon: typeof User; title: string; description: string; color: string }[] = [
        {
            id: 'planning',
            icon: User,
            title: "I'm planning for myself",
            description: "You're taking care of your own future planning. A thoughtful gift to your loved ones.",
            color: 'indigo'
        },
        {
            id: 'executor',
            icon: Briefcase,
            title: "I'm managing someone's estate",
            description: "You've been trusted with an important responsibility. We'll help lighten the load.",
            color: 'amber'
        },
        {
            id: 'family',
            icon: Heart,
            title: "I'm a family member",
            description: "You're helping a loved one or learning what they've prepared. We're here for you.",
            color: 'rose'
        },
        {
            id: 'advisor',
            icon: Users,
            title: "I'm a professional advisor",
            description: "You're helping clients with their planning. We'll make your work easier.",
            color: 'emerald'
        }
    ];

    let selectedRole = $state<UserRole>(onboardingFlowStore.data.role);

    function selectRole(role: UserRole) {
        selectedRole = role;
        onboardingFlowStore.setRole(role);
    }

    function proceed() {
        onboardingFlowStore.nextStep();
    }

    function goBack() {
        onboardingFlowStore.previousStep();
    }

    const colorClasses: Record<string, { bg: string; border: string; text: string }> = {
        indigo: { bg: 'bg-indigo-500/20', border: 'border-indigo-500/50', text: 'text-indigo-400' },
        amber: { bg: 'bg-amber-500/20', border: 'border-amber-500/50', text: 'text-amber-400' },
        rose: { bg: 'bg-rose-500/20', border: 'border-rose-500/50', text: 'text-rose-400' },
        emerald: { bg: 'bg-emerald-500/20', border: 'border-emerald-500/50', text: 'text-emerald-400' }
    };
</script>

<div class="space-y-8" in:fade={{ duration: 400 }}>
    <div class="text-center space-y-3">
        <h2 class="text-2xl md:text-3xl font-serif font-bold text-white">
            What brings you here today?
        </h2>
        <p class="text-slate-400 max-w-md mx-auto">
            This helps us tailor the experience and language to your situation.
        </p>
    </div>

    <div class="grid gap-3 max-w-lg mx-auto" in:fly={{ y: 20, duration: 400, delay: 100 }}>
        {#each roles as role}
            {@const colors = colorClasses[role.color]}
            <button
                onclick={() => selectRole(role.id)}
                class="group relative p-5 rounded-2xl text-left transition-all duration-200 {selectedRole === role.id
                    ? `${colors.bg} border-2 ${colors.border} scale-[1.02]`
                    : 'bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20'}"
            >
                <div class="flex items-start gap-4">
                    <div
                        class="p-2.5 rounded-xl shrink-0 transition-colors {selectedRole === role.id
                            ? `${colors.bg} ${colors.text}`
                            : 'bg-slate-700 text-slate-400 group-hover:bg-slate-600'}"
                    >
                        <role.icon size={22} />
                    </div>
                    <div class="space-y-1">
                        <h3 class="font-medium text-white">{role.title}</h3>
                        <p class="text-sm text-slate-400 leading-relaxed">{role.description}</p>
                    </div>
                </div>

                {#if selectedRole === role.id}
                    <div
                        class="absolute top-4 right-4 w-3 h-3 rounded-full {colors.bg.replace('/20', '')}"
                        in:fade={{ duration: 200 }}
                    ></div>
                {/if}
            </button>
        {/each}
    </div>

    <div class="flex items-center justify-between max-w-lg mx-auto pt-4">
        <button
            onclick={goBack}
            class="flex items-center gap-2 px-4 py-2 text-slate-400 hover:text-white transition-colors"
        >
            <ArrowLeft size={16} />
            <span>Back</span>
        </button>

        <button
            onclick={proceed}
            class="group flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-xl transition-all hover:scale-105 active:scale-95"
        >
            <span>Continue</span>
            <ArrowRight size={16} class="group-hover:translate-x-1 transition-transform" />
        </button>
    </div>
</div>
