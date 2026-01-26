<script lang="ts">
    import { MapPin, ExternalLink, Search, DollarSign, Building2, AlertCircle } from "lucide-svelte";

    function openTreasureHunt() {
        window.open("https://unclaimed.org/", "_blank");
    }
</script>

<svelte:head>
    <title>Treasure Hunt - Continuum</title>
</svelte:head>

<div class="min-h-screen bg-gradient-to-b from-slate-900 to-slate-950 p-6 md:p-10">
    <div class="max-w-3xl mx-auto">
        <!-- Header -->
        <div class="text-center mb-12">
            <div class="inline-flex p-5 rounded-2xl bg-amber-500/10 text-amber-400 mb-6 border border-amber-500/20">
                <MapPin size={48} />
            </div>
            <h1 class="text-4xl md:text-5xl font-serif font-bold text-white mb-4">
                Treasure Hunt
            </h1>
            <p class="text-xl text-slate-400 max-w-2xl mx-auto">
                Discover unclaimed money and property that may belong to you or your loved ones.
            </p>
        </div>

        <!-- Main Card -->
        <div class="bg-slate-800/50 border border-slate-700 rounded-2xl p-8 mb-8">
            <h2 class="text-2xl font-bold text-white mb-4 flex items-center gap-3">
                <Search size={24} class="text-amber-400" />
                What is Unclaimed Property?
            </h2>
            <p class="text-slate-300 leading-relaxed mb-6">
                Every year, billions of dollars in forgotten assets go unclaimed. These can include:
            </p>

            <div class="grid md:grid-cols-2 gap-4 mb-6">
                <div class="bg-slate-900/50 rounded-xl p-4 flex items-start gap-3">
                    <DollarSign size={20} class="text-emerald-400 mt-1 shrink-0" />
                    <div>
                        <h3 class="font-semibold text-white">Financial Assets</h3>
                        <p class="text-sm text-slate-400">Bank accounts, stocks, dividends, uncashed checks, insurance payouts</p>
                    </div>
                </div>
                <div class="bg-slate-900/50 rounded-xl p-4 flex items-start gap-3">
                    <Building2 size={20} class="text-blue-400 mt-1 shrink-0" />
                    <div>
                        <h3 class="font-semibold text-white">Property & Deposits</h3>
                        <p class="text-sm text-slate-400">Safe deposit boxes, security deposits, utility refunds, tax refunds</p>
                    </div>
                </div>
            </div>

            <p class="text-slate-300 leading-relaxed">
                The National Association of Unclaimed Property Administrators (NAUPA) maintains
                <strong class="text-white">unclaimed.org</strong>, a free resource to search for
                unclaimed property across all U.S. states and Canadian provinces.
            </p>
        </div>

        <!-- Why This Matters Card -->
        <div class="bg-amber-500/5 border border-amber-500/20 rounded-2xl p-8 mb-8">
            <h2 class="text-xl font-bold text-white mb-3 flex items-center gap-3">
                <AlertCircle size={20} class="text-amber-400" />
                Why This Matters for Estate Planning
            </h2>
            <p class="text-slate-300 leading-relaxed">
                When organizing your estate, it's worth checking if you or deceased family members
                have unclaimed assets. These forgotten funds can be significant and are rightfully
                yours to claim. It's also a thoughtful step to include in your legacy planning,
                ensuring nothing is left behind for your loved ones to discover later.
            </p>
        </div>

        <!-- CTA Button -->
        <div class="text-center">
            <button
                onclick={openTreasureHunt}
                class="inline-flex items-center gap-3 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-900 font-bold py-4 px-8 rounded-xl transition-all text-lg shadow-lg shadow-amber-500/20 group"
            >
                <span>Search for Unclaimed Property</span>
                <ExternalLink size={20} class="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </button>
            <p class="text-slate-500 text-sm mt-4">
                Opens unclaimed.org in a new tab. This is a free government-affiliated service.
            </p>
        </div>

        <!-- Tips Section -->
        <div class="mt-12 bg-slate-800/30 border border-slate-700/50 rounded-xl p-6">
            <h3 class="font-semibold text-white mb-3">Search Tips</h3>
            <ul class="space-y-2 text-sm text-slate-400">
                <li class="flex items-start gap-2">
                    <span class="text-amber-400 mt-1">1.</span>
                    <span>Search using your current name and any previous names (maiden name, etc.)</span>
                </li>
                <li class="flex items-start gap-2">
                    <span class="text-amber-400 mt-1">2.</span>
                    <span>Check all states where you've lived, worked, or done business</span>
                </li>
                <li class="flex items-start gap-2">
                    <span class="text-amber-400 mt-1">3.</span>
                    <span>Search for deceased relatives - you may be entitled to claim their assets</span>
                </li>
                <li class="flex items-start gap-2">
                    <span class="text-amber-400 mt-1">4.</span>
                    <span>Never pay a fee to search or claim - legitimate services are always free</span>
                </li>
            </ul>
        </div>
    </div>
</div>
