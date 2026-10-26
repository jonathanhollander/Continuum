<script lang="ts">
    import {
        Eye,
        Shield,
        Lock,
        Users,
        FileText,
        Activity,
        Clock,
        AlertTriangle,
    } from "lucide-svelte";
    import { fade } from "svelte/transition";
    import { onMount } from "svelte";
    import { apiGet } from "$lib/api/client";
    // Index into `tiers` (0 = Active, then one per escalation tier)
    let activeTier = $state(0);
    let tiers = $state<any[]>([]);

    onMount(async () => {
        try {
            const [rawTiers, vault] = await Promise.all([
                apiGet("/api/pulse/tiers"),
                apiGet("/api/pulse/vault"),
            ]);
            tiers = mapTiersToUI(rawTiers, vault);
        } catch (e) {
            console.error(e);
        }
    });

    // Vault notes store "tier_<N>_escalation" (same reading as routers/pulse.py get_portal_vault)
    function unlockTier(condition: string): number | null {
        const parts = (condition || "").split("_");
        return parts.length >= 2 && parts[0] === "tier" && /^\d+$/.test(parts[1])
            ? Number(parts[1])
            : null;
    }

    // What the guardian portal really shows (routers/pulse.py get_portal_view and
    // get_portal_vault): the owner's name, whether they checked in recently and when, to every
    // guardian; and each vault note once an escalation reaches the tier set for it.
    function mapTiersToUI(backendTiers: any[], vault: any[]) {
        const always = [
            { name: "Your name", icon: Users },
            { name: "Whether you have checked in recently", icon: Activity },
            { name: "Your last check-in time", icon: Clock },
        ];
        const notes = (vault ?? []).map((v: any) => ({ name: v.name, tier: unlockTier(v.unlock_condition) }));
        const uiTiers = [
            {
                name: "Active",
                delay: "Always",
                icon: Shield,
                color: "text-teal-400",
                bg: "bg-teal-500/10",
                border: "border-teal-500/20",
                access: always,
                hidden: notes.map((n) => n.name),
            },
        ];

        const colors = [
            { c: "text-amber-400", bg: "bg-amber-500/10", b: "border-amber-500/20", i: Users },
            { c: "text-orange-400", bg: "bg-orange-500/10", b: "border-orange-500/20", i: Users },
            { c: "text-rose-400", bg: "bg-rose-500/10", b: "border-rose-500/20", i: AlertTriangle },
            { c: "text-purple-400", bg: "bg-purple-500/10", b: "border-purple-500/20", i: AlertTriangle },
        ];

        [...backendTiers]
            .sort((a, b) => a.tier_number - b.tier_number)
            .forEach((tier, index) => {
                const style = colors[Math.min(index, 3)];
                const open = notes.filter((n) => n.tier !== null && n.tier <= tier.tier_number);
                uiTiers.push({
                    name: `Tier ${tier.tier_number}`,
                    delay: `After ${tier.delay_hours} hours`,
                    icon: style.i,
                    color: style.c,
                    bg: style.bg,
                    border: style.b,
                    access: [...always, ...open.map((n) => ({ name: n.name, icon: FileText }))],
                    hidden: notes.filter((n) => !open.includes(n)).map((n) => n.name),
                });
            });

        return uiTiers;
    }
</script>

<div class="max-w-4xl mx-auto p-4 md:p-8 pb-32">
    <div class="flex items-center justify-between mb-8">
        <div>
            <h1
                class="text-2xl font-serif text-slate-100 flex items-center gap-2"
            >
                <Eye class="text-teal-400" />
                What your guardians can see
            </h1>
            <p class="text-slate-400 text-sm mt-1">
                See exactly what is shared, and when.
            </p>
        </div>
        <a
            href="/modules/pulse"
            class="text-sm text-teal-400 hover:text-teal-300 transition-colors"
            >Back to Wellness Check-in</a
        >
    </div>

    <div class="grid md:grid-cols-12 gap-8">
        <!-- Timeline Selector -->
        <div class="md:col-span-4 space-y-4">
            {#each tiers as tier, i}
                <button
                    class="w-full text-left p-4 rounded-xl border transition-all duration-300 relative overflow-hidden group {activeTier ===
                    i
                        ? `${tier.bg} ${tier.border} border-l-4`
                        : 'bg-slate-900/40 border-slate-800 hover:bg-slate-800/60'}"
                    onclick={() => (activeTier = i)}
                >
                    <div class="flex items-center gap-3 relative z-10">
                        <div
                            class="p-2 rounded-lg bg-slate-950/50 {tier.color}"
                        >
                            <tier.icon
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
                {#if tiers.length > 0 && tiers[activeTier]}
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
                                        <Eye class="w-4 h-4 text-teal-400" /> Visible
                                        Data
                                    </h3>
                                    <div class="grid gap-3">
                                        {#each tiers[activeTier].access as item}
                                            <div
                                                class="flex items-center gap-3 p-3 rounded-lg bg-teal-500/5 border border-teal-500/10"
                                            >
                                                <item.icon
                                                    class="w-4 h-4 text-teal-400"
                                                />
                                                <span
                                                    class="text-slate-200 text-sm"
                                                    >{item.name}</span
                                                >
                                            </div>
                                        {/each}
                                    </div>
                                </div>

                                <!-- What is Hidden -->
                                {#if tiers[activeTier].hidden.length > 0}
                                    <div
                                        class="pt-4 border-t border-slate-800/50"
                                    >
                                        <h3
                                            class="text-sm font-medium text-slate-400 mb-3 flex items-center gap-2"
                                        >
                                            <Lock
                                                class="w-4 h-4 text-slate-500"
                                            /> Kept private
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
                {:else}
                    <div
                        class="flex items-center justify-center h-full text-slate-500"
                    >
                        Gathering this for you...
                    </div>
                {/if}
            </div>
        </div>
    </div>
</div>
