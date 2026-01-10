<script lang="ts">
    import {
        Shield,
        Plus,
        Building2,
        Phone,
        Calendar,
        FileText,
        Trash2,
        Edit2,
        CircleAlert,
    } from "lucide-svelte";
    import { slide } from "svelte/transition";

    export let policy;
    export let expanded = false;
    export let onEdit;
    export let onDelete;

    let showDetails = false;
</script>

<div
    class="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden group"
>
    <!-- Header Card -->
    <div
        class="p-5 flex items-start justify-between cursor-pointer"
        on:click={() => (showDetails = !showDetails)}
    >
        <div class="flex items-start gap-4">
            <div
                class="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0"
            >
                <Shield class="w-5 h-5" />
            </div>
            <div>
                <h3 class="font-bold text-slate-800 text-lg">
                    {policy.provider || "Unnamed Provider"}
                </h3>
                <p class="text-sm text-slate-500 font-medium">
                    {policy.type} • {policy.policyNumber}
                </p>

                {#if policy.coverageAmount}
                    <div
                        class="mt-2 text-xs font-semibold uppercase tracking-wider text-slate-400"
                    >
                        Coverage
                    </div>
                    <div class="text-emerald-700 font-bold font-mono">
                        {new Intl.NumberFormat("en-US", {
                            style: "currency",
                            currency: "USD",
                        }).format(policy.coverageAmount)}
                    </div>
                {/if}
            </div>
        </div>

        <div
            class="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity"
        >
            <button
                class="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                on:click|stopPropagation={onEdit}
            >
                <Edit2 class="w-4 h-4" />
            </button>
            <button
                class="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                on:click|stopPropagation={onDelete}
            >
                <Trash2 class="w-4 h-4" />
            </button>
        </div>
    </div>

    <!-- Expanded Details -->
    {#if showDetails}
        <div
            class="px-5 pb-5 pt-0 border-t border-slate-50 bg-slate-50/50"
            transition:slide
        >
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                <!-- Contact Info -->
                <div class="space-y-3">
                    <h4
                        class="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2"
                    >
                        Contact
                    </h4>
                    {#if policy.contactName}
                        <div
                            class="flex items-center gap-2 text-sm text-slate-600"
                        >
                            <Building2 class="w-4 h-4 text-slate-400" />
                            {policy.contactName}
                        </div>
                    {/if}
                    {#if policy.contactPhone}
                        <div
                            class="flex items-center gap-2 text-sm text-slate-600"
                        >
                            <Phone class="w-4 h-4 text-slate-400" />
                            {policy.contactPhone}
                        </div>
                    {/if}
                </div>

                <!-- Beneficiaries & Notes -->
                <div class="space-y-3">
                    <h4
                        class="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2"
                    >
                        Details
                    </h4>
                    {#if policy.beneficiaries}
                        <div class="text-sm text-slate-600">
                            <span class="font-medium text-slate-700"
                                >Beneficiaries:</span
                            >
                            {policy.beneficiaries}
                        </div>
                    {/if}
                    {#if policy.renewalDate}
                        <div
                            class="flex items-center gap-2 text-sm text-slate-600"
                        >
                            <Calendar class="w-4 h-4 text-slate-400" />
                            Renewal: {new Date(
                                policy.renewalDate,
                            ).toLocaleDateString()}
                        </div>
                    {/if}
                </div>
            </div>

            <!-- Filing Instructions -->
            {#if policy.filingInstructions}
                <div
                    class="mt-4 p-3 bg-amber-50 rounded-lg border border-amber-100 flex gap-3"
                >
                    <CircleAlert
                        class="w-4 h-4 text-amber-600 shrink-0 mt-0.5"
                    />
                    <div class="text-sm text-amber-800">
                        <span
                            class="font-bold block text-xs uppercase tracking-wider mb-1 text-amber-600/80"
                            >How to Claim</span
                        >
                        {policy.filingInstructions}
                    </div>
                </div>
            {/if}
        </div>
    {/if}
</div>
