<script lang="ts">
    import {
        Printer,
        Shield,
        FileText,
        Heart,
        Wallet,
        Receipt,
    } from "lucide-svelte";
    import { onMount } from "svelte";
    import { getStored } from "$lib/stores/persistence";

    let isPrinting = false;

    function printBinder() {
        isPrinting = true;
        setTimeout(() => {
            window.print();
            isPrinting = false;
        }, 500);
    }

    // Dynamic Binder Loading
    let modules: { title: string; icon: any; items: string[] }[] = [];

    onMount(() => {
        const loadedModules = [];

        // 1. Legal
        const docs = getStored<any[]>("docs_legal-vault", []);
        if (docs.length > 0) {
            loadedModules.push({
                title: "Legal Vault",
                icon: Shield,
                items: docs.map(
                    (d: any) => `${d.name} (${d.type}) - ${d.location}`,
                ),
            });
        }

        // 2. Financial
        const assets = getStored<any[]>("assets_assets-main", []);
        if (assets.length > 0) {
            loadedModules.push({
                title: "Financial Assets",
                icon: Wallet,
                items: assets.map(
                    (a: any) =>
                        `${a.name} - ${new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(a.value)}`,
                ),
            });
        }

        // 3. Subscriptions
        const subs = getStored<any[]>("subscriptions", []);
        if (subs.length > 0) {
            loadedModules.push({
                title: "Recurring Services",
                icon: Receipt,
                items: subs.map(
                    (s: any) => `${s.name} (${s.cycle}) - $${s.cost}`,
                ),
            });
        }

        modules = loadedModules;
    });
</script>

<div class="min-h-screen bg-stone-100 p-8 print:bg-white print:p-0">
    <!-- Non-Print Controls -->
    <div
        class="max-w-4xl mx-auto mb-12 flex justify-between items-center print:hidden"
    >
        <div>
            <h1 class="font-serif font-bold text-3xl text-[#304743]">
                Global Binder View
            </h1>
            <p class="text-stone-500">
                A consolidated format for printing your physical Red Binder.
            </p>
        </div>
        <button
            on:click={printBinder}
            class="bg-[#304743] hover:bg-[#2A3F3B] text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg transition-all"
        >
            <Printer size={18} /> Print Entire Binder
        </button>
    </div>

    <!-- Binder Content -->
    <div
        class="max-w-4xl mx-auto bg-white shadow-xl min-h-[1100px] border border-stone-200 print:shadow-none print:border-none"
    >
        {#if modules.length === 0}
            <div class="p-20 flex items-center justify-center h-[1100px]">
                <EmptyStateGuide
                    type="binder"
                    onAdd={() =>
                        alert("Populate other sections to build your binder.")}
                />
            </div>
        {:else}
            <!-- Cover Page -->
            <div
                class="h-[1100px] relative p-20 flex flex-col justify-between border-b-4 border-[#304743] print:break-after-page"
            >
                <div
                    class="absolute top-0 right-0 w-64 h-64 bg-[#D4AF37]/10 rounded-bl-full"
                ></div>

                <div class="relative z-10">
                    <div class="flex items-center gap-4 mb-8 text-[#304743]">
                        <Shield size={48} />
                        <span
                            class="text-xl font-bold tracking-widest uppercase"
                            >The Estate of</span
                        >
                    </div>
                    <h1
                        class="font-serif text-7xl text-[#304743] mb-6 font-bold leading-tight"
                    >
                        Jonathan<br />Hollander
                    </h1>
                    <div class="w-24 h-2 bg-[#D4AF37]"></div>
                </div>

                <div class="grid grid-cols-2 gap-12 font-serif text-stone-600">
                    <div>
                        <h3
                            class="font-bold text-[#304743] mb-2 uppercase tracking-wide text-sm"
                        >
                            Prepared Date
                        </h3>
                        <p class="text-xl">
                            {new Date().toLocaleDateString()}
                        </p>
                    </div>
                    <div>
                        <h3
                            class="font-bold text-[#304743] mb-2 uppercase tracking-wide text-sm"
                        >
                            Executor
                        </h3>
                        <p class="text-xl">Jane Doe (Primary)</p>
                    </div>
                </div>
            </div>

            <!-- Table of Contents -->
            <div class="p-20 print:break-after-page min-h-[1100px]">
                <h2
                    class="font-serif text-4xl text-[#304743] mb-12 border-b-2 border-stone-100 pb-6"
                >
                    Table of Contents
                </h2>
                <div class="space-y-6">
                    {#each modules as mod, i}
                        <div class="flex items-baseline justify-between group">
                            <div class="flex items-center gap-4">
                                <span class="font-bold text-[#D4AF37] text-xl"
                                    >0{i + 1}</span
                                >
                                <h3 class="font-serif text-2xl text-stone-800">
                                    {mod.title}
                                </h3>
                            </div>
                            <div
                                class="flex-1 border-b border-dotted border-stone-300 mx-6"
                            ></div>
                            <span class="font-mono text-stone-400"
                                >Sec {String.fromCharCode(65 + i)}</span
                            >
                        </div>
                    {/each}
                </div>
            </div>

            <!-- Section Pages -->
            {#each modules as mod, i}
                <div class="p-20 print:break-after-page min-h-[1100px]">
                    <div class="flex items-center gap-4 mb-12 text-[#304743]">
                        <svelte:component this={mod.icon} size={32} />
                        <h2 class="font-serif text-3xl font-bold">
                            Section {String.fromCharCode(65 + i)}: {mod.title}
                        </h2>
                    </div>

                    <div class="space-y-8">
                        {#each mod.items as item}
                            <div
                                class="flex items-start gap-4 p-6 bg-stone-50 rounded-xl border border-stone-100 print:bg-transparent print:border-b print:border-stone-200 print:rounded-none"
                            >
                                <FileText
                                    class="text-stone-400 shrink-0 mt-1"
                                />
                                <p class="text-xl font-serif text-stone-800">
                                    {item}
                                </p>
                            </div>
                        {/each}
                    </div>
                </div>
            {/each}
        {/if}
    </div>
</div>

<style>
    @media print {
        @page {
            margin: 0;
            size: auto;
        }
        :global(body) {
            -webkit-print-color-adjust: exact;
        }
    }
</style>
