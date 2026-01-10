<script lang="ts">
    import { Phone } from "lucide-svelte";

    export let contact: any; // Using any to avoid complex type duplication for now, or import shared type
    export let updateStatus: (id: string, status: string) => void;

    const statuses = [
        "Pending",
        "Called",
        "LeftMsg",
        "Notified",
        "Unreachable",
    ];
</script>

<div
    class="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 items-start md:items-center justify-between group transition-all hover:border-indigo-300"
>
    <div class="flex items-center gap-4">
        <div
            class="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-600 sticky"
        >
            {contact.name.charAt(0)}
        </div>
        <div>
            <h3 class="font-bold text-slate-800">{contact.name}</h3>
            <div class="text-xs text-slate-500 flex flex-wrap gap-2">
                <span class="font-semibold">{contact.relation}</span>
                <span class="text-slate-300">|</span>
                <span class="flex items-center gap-1"
                    ><Phone size={10} /> {contact.phone}</span
                >
            </div>
            {#if contact.notes}
                <div
                    class="mt-2 text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded inline-block border border-amber-100"
                >
                    <strong>Note:</strong>
                    {contact.notes}
                </div>
            {/if}
        </div>
    </div>

    <div class="flex items-center gap-2 w-full md:w-auto overflow-x-auto">
        {#each statuses as status}
            <button
                on:click={() => updateStatus(contact.id, status)}
                class="px-3 py-1.5 rounded-lg text-xs font-bold border transition-all whitespace-nowrap
                {contact.notificationStatus === status
                    ? 'bg-slate-800 text-white border-slate-800'
                    : 'bg-white text-slate-400 border-slate-200 hover:border-slate-400'}"
            >
                {status === "LeftMsg" ? "Left Msg" : status}
            </button>
        {/each}
    </div>
</div>
