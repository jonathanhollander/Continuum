<script lang="ts">
    import { onMount } from "svelte";
    import {
        Sun,
        Moon,
        Coffee,
        ArrowRight,
        ShieldCheck,
        TriangleAlert,
    } from "lucide-svelte";
    import Encouragement from "$lib/components/concierge/Encouragement.svelte";
    import EstateNetWorth from "$lib/components/dashboard/EstateNetWorth.svelte";
    import { estateAudit } from "$lib/stores/auditStore";
    import { Search, Bell, Clock } from "lucide-svelte";

    let timeOfDay = "Morning";
    let greeting = "Good Morning";

    onMount(() => {
        estateAudit.runAudit();
        const hour = new Date().getHours();
        if (hour < 12) {
            timeOfDay = "Morning";
            greeting = "Good Morning";
        } else if (hour < 18) {
            timeOfDay = "Afternoon";
            greeting = "Good Afternoon";
        } else {
            timeOfDay = "Evening";
            greeting = "Good Evening";
        }
    });

    $: health = $estateAudit.percentage;
    // Concierge Logic
    let conciergeQuery = "";

    function handleConciergeSearch() {
        if (!conciergeQuery) return;
        const q = conciergeQuery.toLowerCase();

        let target = "";

        // Simple routing map
        if (q.includes("bank") || q.includes("account") || q.includes("money"))
            target = "/financial-accounts";
        else if (q.includes("insurance") || q.includes("policy"))
            target = "/modules/insurance";
        else if (
            q.includes("will") ||
            q.includes("legal") ||
            q.includes("attorney") ||
            q.includes("trust")
        )
            target = "/modules/legal-documents";
        else if (q.includes("password") || q.includes("digital"))
            target = "/modules/digital-guardian";
        else if (q.includes("heir") || q.includes("item") || q.includes("gift"))
            target = "/modules/heirlooms";
        else if (q.includes("letter") || q.includes("write"))
            target = "/modules/letters";
        else target = "/modules/timeline"; // Default fallback

        window.location.href = target;
    }

    function handleKeydown(e: KeyboardEvent) {
        if (e.key === "Enter") handleConciergeSearch();
    }
</script>

<div class="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
    <!-- Header Greet -->
    <div class="flex items-center justify-between">
        <div class="flex items-center gap-4">
            <div class="bg-[#F0F4F4] p-3 rounded-full text-[#4A7C74]">
                {#if timeOfDay === "Morning"}
                    <Coffee size={32} />
                {:else if timeOfDay === "Afternoon"}
                    <Sun size={32} />
                {:else}
                    <Moon size={32} />
                {/if}
            </div>
            <div>
                <h1 class="font-serif font-bold text-3xl text-[#304743]">
                    {greeting}, Jonathan.
                </h1>
                <p
                    class="text-muted-foreground text-lg flex items-center gap-2"
                >
                    Protection Score:
                    <span
                        class="font-bold text-[#4A7C74] bg-[#4A7C74]/10 px-2 py-0.5 rounded text-sm"
                    >
                        {health}%
                    </span>
                </p>
            </div>
        </div>

        <!-- Concierge Bell -->
        <div class="flex-1 max-w-md w-full">
            <div class="relative group">
                <Search
                    class="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-hover:text-[#4A7C74] transition-colors"
                    size={18}
                />
                <input
                    type="text"
                    bind:value={conciergeQuery}
                    on:keydown={handleKeydown}
                    placeholder="Ask the Concierge (e.g. 'Draft a letter to my bank')..."
                    class="w-full pl-10 pr-4 py-3 rounded-xl border border-border bg-white/50 backdrop-blur focus:bg-white focus:ring-2 focus:ring-[#4A7C74]/20 transition-all outline-none shadow-sm"
                />
                <button
                    on:click={handleConciergeSearch}
                    class="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-[#4A7C74] text-white rounded-lg hover:bg-[#3b635d] transition-colors shadow-md"
                >
                    <Bell size={16} />
                </button>
            </div>
        </div>
    </div>

    <!-- Gentle Encouragement -->
    <Encouragement
        text="Remember, a perfect estate plan is a moving target. Just one improvement today is enough."
        type="insight"
    />

    <!-- The Daily Focus (Concierge Pick) -->
    <div
        class="bg-white rounded-2xl p-8 border border-border shadow-sm relative overflow-hidden group hover:border-[#4A7C74]/50 transition-all"
    >
        <div
            class="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity"
        >
            <ShieldCheck size={120} />
        </div>

        <div class="relative z-10">
            <div class="flex items-center gap-2 mb-4">
                <span
                    class="px-3 py-1 bg-[#304743] text-white text-xs font-bold uppercase rounded-full tracking-wider"
                    >Concierge Focus</span
                >
                <span
                    class="text-xs text-muted-foreground uppercase tracking-widest font-bold"
                    >Priority #1</span
                >
            </div>

            {#if $estateAudit.issues.length > 0}
                {@const issue = $estateAudit.issues[0]}
                <h3 class="font-serif font-bold text-2xl text-[#304743] mb-2">
                    {issue.replace(/\[.*?\]\s/, "")}
                </h3>
                <p class="text-muted-foreground max-w-xl mb-6 leading-relaxed">
                    Based on our scan, this is the most critical missing piece
                    of your estate plan. Let's take care of it today.
                </p>

                <a
                    href={issue.includes("Insurance")
                        ? "/modules/insurance"
                        : issue.includes("Will")
                          ? "/modules/legal-documents"
                          : issue.includes("Beneficiary")
                            ? "/modules/financial-accounts"
                            : issue.includes("Guardian")
                              ? "/modules/digital-guardian"
                              : "/modules/timeline"}
                    class="inline-flex items-center gap-2 px-6 py-3 bg-[#4A7C74] text-white rounded-xl font-bold hover:bg-[#3b635d] transition-colors shadow-lg shadow-[#4A7C74]/20"
                >
                    resolve Now <ArrowRight size={18} />
                </a>
            {:else}
                <h3 class="font-serif font-bold text-2xl text-[#304743] mb-2">
                    Your Estate is Secure
                </h3>
                <p class="text-muted-foreground max-w-xl mb-6 leading-relaxed">
                    You've addressed all critical risks. Why not leave a
                    personal note for the future?
                </p>

                <a
                    href="/modules/letters"
                    class="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200"
                >
                    Write a Letter <ArrowRight size={18} />
                </a>
            {/if}
        </div>
    </div>

    <!-- Quick Stats / Status -->
    <!-- Quick Stats / Status -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <!-- Net Worth Widget -->
        <EstateNetWorth />

        <!-- Recent Activity Module -->
        <div
            class="p-6 rounded-xl bg-gray-50 border border-gray-100 flex flex-col justify-between"
        >
            <div
                class="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-2"
            >
                <Clock size={12} /> Recent Activity
            </div>

            <div class="space-y-3">
                <div class="flex items-start gap-3 text-sm">
                    <div
                        class="w-1.5 h-1.5 rounded-full bg-[#4A7C74] mt-2 shrink-0"
                    ></div>
                    <span class="text-slate-600"
                        >Updated <strong class="text-[#304743]"
                            >Life Insurance</strong
                        > policy.</span
                    >
                </div>
                <div class="flex items-start gap-3 text-sm">
                    <div
                        class="w-1.5 h-1.5 rounded-full bg-slate-300 mt-2 shrink-0"
                    ></div>
                    <span class="text-slate-500">System audit complete.</span>
                </div>
            </div>

            <div class="mt-4 pt-4 border-t border-gray-200">
                <a
                    href="/modules/timeline"
                    class="text-xs text-[#4A7C74] font-bold hover:underline"
                    >View Timeline -></a
                >
            </div>
        </div>

        <!-- Next Priority (Audit Driven) -->
        <div
            class="p-6 rounded-xl bg-gray-50 border border-gray-100 flex flex-col justify-between"
        >
            <div
                class="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2"
            >
                Next Critical Step
            </div>

            {#if $estateAudit.issues.length > 0}
                <div
                    class="text-lg font-serif font-bold text-[#304743] leading-tight mb-2"
                >
                    {$estateAudit.issues[0].replace(/\[.*?\]\s/, "")}
                </div>
                <!-- svelte-ignore a11y-invalid-attribute -->
                <a
                    href="#"
                    class="text-xs text-orange-500 font-bold flex items-center gap-1"
                >
                    <TriangleAlert size={12} /> Resolve Now
                </a>
            {:else}
                <div
                    class="text-lg font-serif font-bold text-[#304743] leading-tight mb-2"
                >
                    All Systems Nominal
                </div>
                <div
                    class="text-xs text-emerald-500 font-bold flex items-center gap-1"
                >
                    Protection Active
                </div>
            {/if}
        </div>
    </div>
</div>
