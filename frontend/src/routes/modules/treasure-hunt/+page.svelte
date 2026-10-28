<script lang="ts">
    import { MapPin, ExternalLink, Search, DollarSign, Building2, AlertCircle, ArrowRight } from "lucide-svelte";

    function openTreasureHunt() {
        window.open("https://unclaimed.org/", "_blank", "noopener,noreferrer");
    }
</script>

<svelte:head>
    <title>Treasure Hunt - Continuum</title>
</svelte:head>

<div class="min-h-screen bg-background p-6 md:p-10">
    <div class="max-w-3xl mx-auto">
        <!-- Header -->
        <div class="text-center mb-12">
            <div class="inline-flex p-5 rounded-2xl bg-warning-soft text-warning mb-6 border border-warning/20">
                <MapPin size={48} />
            </div>
            <h1 class="text-4xl md:text-5xl font-serif font-bold text-foreground mb-4">
                Treasure Hunt
            </h1>
            <p class="text-xl text-muted-foreground max-w-2xl mx-auto">
                Discover unclaimed money and property that may belong to you or your loved ones.
            </p>
        </div>

        <!-- Main Card -->
        <div class="bg-card border border-border rounded-2xl p-8 mb-8">
            <h2 class="text-2xl font-bold text-foreground mb-4 flex items-center gap-3">
                <Search size={24} class="text-warning" />
                What is Unclaimed Property?
            </h2>
            <p class="text-foreground/90 leading-relaxed mb-6">
                Unclaimed property searches may show records such as:
            </p>

            <div class="grid md:grid-cols-2 gap-4 mb-6">
                <div class="bg-muted rounded-xl p-4 flex items-start gap-3">
                    <DollarSign size={20} class="text-success mt-1 shrink-0" />
                    <div>
                        <h3 class="font-semibold text-foreground">Financial Assets</h3>
                        <p class="text-sm text-muted-foreground">Bank accounts, stocks, dividends, uncashed checks, insurance payouts</p>
                    </div>
                </div>
                <div class="bg-muted rounded-xl p-4 flex items-start gap-3">
                    <Building2 size={20} class="text-info mt-1 shrink-0" />
                    <div>
                        <h3 class="font-semibold text-foreground">Property & Deposits</h3>
                        <p class="text-sm text-muted-foreground">Safe deposit boxes, security deposits, utility refunds, tax refunds</p>
                    </div>
                </div>
            </div>

            <p class="text-foreground/90 leading-relaxed">
                The National Association of Unclaimed Property Administrators (NAUPA) maintains
                <strong class="text-foreground">unclaimed.org</strong>, a free resource to search for
                unclaimed property across all U.S. states and Canadian provinces.
            </p>
        </div>

        <!-- Why This Matters Card -->
        <div class="bg-warning-soft border border-warning/20 rounded-2xl p-8 mb-8">
            <h2 class="text-xl font-bold text-foreground mb-3 flex items-center gap-3">
                <AlertCircle size={20} class="text-warning" />
                Why This Matters for Estate Planning
            </h2>
            <p class="text-foreground/90 leading-relaxed">
                Search for possible matches under your name or a deceased relative's name.
                Check the administrator's record and claim requirements before treating a match
                as an asset. Keep the source and any reference number with your financial notes.
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
            <p class="text-muted-foreground text-sm mt-4">
                Opens unclaimed.org in a new tab to find the relevant property administrator.
            </p>
            <a
                href="/modules/financial-accounts"
                class="inline-flex items-center gap-2 mt-6 text-warning hover:text-warning/80 font-semibold"
            >
                Verified a record? Add it to your Financial Accounts
                <ArrowRight size={18} />
            </a>
        </div>

        <!-- Tips Section -->
        <div class="mt-12 bg-card border border-border rounded-xl p-6">
            <h3 class="font-semibold text-foreground mb-3">Search Tips</h3>
            <ul class="space-y-2 text-sm text-muted-foreground">
                <li class="flex items-start gap-2">
                    <span class="text-warning mt-1">1.</span>
                    <span>Search using your current name and any previous names (maiden name, etc.)</span>
                </li>
                <li class="flex items-start gap-2">
                    <span class="text-warning mt-1">2.</span>
                    <span>Check all states where you've lived, worked, or done business</span>
                </li>
                <li class="flex items-start gap-2">
                    <span class="text-warning mt-1">3.</span>
                    <span>Search for deceased relatives, then check who is authorized to make a claim</span>
                </li>
                <li class="flex items-start gap-2">
                    <span class="text-warning mt-1">4.</span>
                    <span>Use the administrator’s official instructions to check evidence and any claim requirements</span>
                </li>
            </ul>
        </div>
    </div>
</div>
