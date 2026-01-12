<script lang="ts">
    import AssetManager from "$lib/components/archetypes/AssetManager.svelte";
    import { Wallet, Search, ExternalLink } from "lucide-svelte";
    import LegalDisclaimer from "$lib/components/common/LegalDisclaimer.svelte";
</script>

<div class="max-w-6xl mx-auto p-8">
    <div class="mb-8">
        <h1
            class="font-serif font-bold text-4xl text-[#304743] flex items-center gap-3"
        >
            <div class="p-3 bg-[#4A7C74]/10 rounded-xl text-[#4A7C74]">
                <Wallet size={32} />
            </div>
            Assets & Wealth
        </h1>
        <p class="text-muted-foreground mt-2 ml-16 max-w-xl">
            The ledger of your life's work. Track checking accounts, retirement
            funds, and real estate so nothing gets lost.
        </p>
    </div>

    <div class="mb-8">
        <LegalDisclaimer
            title="Beneficiary Designations"
            message="Please note that beneficiary designations on financial accounts generally override instructions in a Will. Ensure your listed beneficiaries here match your actual account settings."
        />
    </div>

    <!-- Concierge: Lost Asset Hunter -->
    <div
        class="mb-8 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-100 rounded-xl p-6 flex flex-col md:flex-row items-center gap-6 shadow-sm"
    >
        <div
            class="p-4 bg-white rounded-full text-amber-500 shadow-sm shrink-0"
        >
            <Search size={32} />
        </div>
        <div class="flex-1">
            <h3 class="font-serif font-bold text-lg text-[#304743] mb-1">
                The Treasure Hunt
            </h3>
            <p class="text-sm text-gray-600 leading-relaxed">
                Did you know <strong>1 in 10 people</strong> have unclaimed property
                waiting for them? Old utility deposits, forgotten bank accounts,
                or uncashed checks.
            </p>
        </div>
        <a
            href="https://unclaimed.org/"
            target="_blank"
            rel="noreferrer"
            class="shrink-0 px-5 py-3 bg-white border border-amber-200 text-amber-700 font-bold rounded-xl hover:bg-amber-50 transition-colors flex items-center gap-2 shadow-sm"
        >
            Check Database <ExternalLink size={16} />
        </a>
    </div>

    <!-- Core Manager -->
    <AssetManager module={{ id: "assets-main" }} />
</div>
