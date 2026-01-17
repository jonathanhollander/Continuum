<script lang="ts">
    import {
        Eye,
        Shield,
        Lock,
        Users,
        ChevronRight,
        FileText,
        Activity,
    } from "lucide-svelte";
    import { fade, slide } from "svelte/transition";

    let activeTier = $state(0);

    const tiers = [
        {
            id: 0,
            name: "Active (Normal)",
            delay: "Always",
            icon: Shield,
            color: "text-emerald-400",
            bg: "bg-emerald-500/10",
            border: "border-emerald-500/20",
            access: [
                { name: "First Name", type: "public", icon: Users },
                { name: "Status: Active", type: "public", icon: Activity },
            ],
            hidden: [
                "Location Data",
                "Financial Vault",
                "Medical Records",
                "Personal Messages",
            ],
        },
        {
            id: 1,
            name: "Tier 1: Guardian",
            delay: "T + 24 Hours",
            icon: Users,
            color: "text-amber-400",
            bg: "bg-amber-500/10",
            border: "border-amber-500/20",
            access: [
                {
                    name: "Last Check-in Time",
                    type: "restricted",
                    icon: Activity,
                },
                {
                    name: "Daily Memory (Photo)",
                    type: "restricted",
                    icon: FileText,
                },
            ],
            hidden: [
                "Exact Location",
                "Vault Access Codes",
                "Medical Directives",
            ],
        },
        {
            id: 2,
            name: "Tier 2: Family",
            delay: "T + 36 Hours",
            icon: Users,
            color: "text-orange-400",
            bg: "bg-orange-500/10",
            border: "border-orange-500/20",
            access: [
                { name: "Home Address", type: "private", icon: Lock },
                {
                    name: "Pet Care Instructions",
                    type: "private",
                    icon: FileText,
                },
            ],
            hidden: ["Financial Vault", "Medical Directives (Full)"],
        },
        {
            id: 3,
            name: "Tier 4: Emergency",
            delay: "T + 48 Hours",
            icon: AlertTriangle,
            color: "text-rose-400",
            bg: "bg-rose-500/10",
            border: "border-rose-500/20",
            access: [
                {
                    name: "Medical Directives (DNR)",
                    type: "critical",
                    icon: FileText,
                },
                { name: "Vault Access Codes", type: "critical", icon: Lock },
                { name: "Physician Contact", type: "critical", icon: Users },
            ],
            hidden: [],
        },
    ];

    import { AlertTriangle } from "lucide-svelte";
</script>

<div class="max-w-4xl mx-auto p-4 md:p-8 pb-32">
    <div class="flex items-center justify-between mb-8">
        <div>
            <h1
                class="text-2xl font-serif text-slate-100 flex items-center gap-2"
            >
                <Eye class="text-teal-400" />
                Data Transparency
            </h1>
            <p class="text-slate-400 text-sm mt-1">
                See exactly what is shared, and when.
            </p>
        </div>
        <a
            href="/modules/pulse"
            class="text-sm text-teal-400 hover:text-teal-300 transition-colors"
            >Back to Dashboard</a
        >
    </div>

    <div class="grid md:grid-cols-12 gap-8">
        <!-- Timeline Selector -->
        <div class="md:col-span-4 space-y-4">
            {#each tiers as tier}
                <button
                    class="w-full text-left p-4 rounded-xl border transition-all duration-300 relative overflow-hidden group {activeTier ===
                    tier.id
                        ? `${tier.bg} ${tier.border} border-l-4`
                        : 'bg-slate-900/40 border-slate-800 hover:bg-slate-800/60'}"
                    onclick={() => (activeTier = tier.id)}
                >
                    <div class="flex items-center gap-3 relative z-10">
                        <div
                            class="p-2 rounded-lg bg-slate-950/50 {tier.color}"
                        >
                            <svelte:component
                                this={tier.icon}
                                class="w-5 h-5"
                            />
                        </div>
                        <div>
                            <div class="font-medium text-slate-200 text-sm">
                                {tier.name}
                            </div>
                            <div
                                class="text-xs text-slate-500 font-mono mt-0.5"
                            >
                                {tier.delay}
                            </div>
                        </div>
                    </div>
                </button>
            {/each}
        </div>

        <!-- Detail View -->
        <div class="md:col-span-8">
            <div
                class="bg-slate-900/60 backdrop-blur-md rounded-2xl border border-slate-800 p-8 min-h-[400px]"
            >
                {#key activeTier}
                    <div in:fade={{ duration: 300 }}>
                        <div class="flex items-center gap-3 mb-6">
                            <span
                                class="text-xs font-mono text-slate-500 uppercase tracking-widest"
                                >Access Level</span
                            >
                            <div class="h-px bg-slate-800 flex-1"></div>
                            <span
                                class="{tiers[activeTier]
                                    .color} font-bold text-sm tracking-wide"
                                >{tiers[activeTier].name}</span
                            >
                        </div>

                        <div class="space-y-6">
                            <!-- What is Visible -->
                            <div>
                                <h3
                                    class="text-sm font-medium text-slate-300 mb-3 flex items-center gap-2"
                                >
                                    <Eye class="w-4 h-4 text-teal-500" /> Visible
                                    Data
                                </h3>
                                <div class="grid gap-3">
                                    {#each tiers[activeTier].access as item}
                                        <div
                                            class="flex items-center gap-3 p-3 rounded-lg bg-teal-500/5 border border-teal-500/10"
                                        >
                                            <svelte:component
                                                this={item.icon}
                                                class="w-4 h-4 text-teal-400"
                                            />
                                            <span class="text-slate-200 text-sm"
                                                >{item.name}</span
                                            >
                                            {#if item.type === "critical"}
                                                <span
                                                    class="ml-auto text-[10px] uppercase font-bold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20"
                                                    >Critical</span
                                                >
                                            {/if}
                                        </div>
                                    {/each}
                                </div>
                            </div>

                            <!-- What is Hidden -->
                            {#if tiers[activeTier].hidden.length > 0}
                                <div class="pt-4 border-t border-slate-800/50">
                                    <h3
                                        class="text-sm font-medium text-slate-400 mb-3 flex items-center gap-2"
                                    >
                                        <Lock class="w-4 h-4 text-slate-500" /> Still
                                        Encrypted
                                    </h3>
                                    <div class="grid sm:grid-cols-2 gap-2">
                                        {#each tiers[activeTier].hidden as hiddenItem}
                                            <div
                                                class="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-950/30 border border-slate-800 text-slate-500 text-xs"
                                            >
                                                <Lock
                                                    class="w-3 h-3 opacity-50"
                                                />
                                                {hiddenItem}
                                            </div>
                                        {/each}
                                    </div>
                                </div>
                            {/if}
                        </div>
                    </div>
                {/key}
            </div>
        </div>
    </div>
</div>
