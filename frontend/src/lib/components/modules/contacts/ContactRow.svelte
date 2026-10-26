<script lang="ts">
    import { Phone, Pencil } from "lucide-svelte";

    let { contact, updateStatus, onEdit } = $props<{
        contact: any;
        updateStatus: (id: number | string, status: string) => void;
        onEdit?: (contact: any) => void;
    }>();

    const statuses = [
        "Pending",
        "Called",
        "LeftMsg",
        "Notified",
        "Unreachable",
    ];
    // The saved values stay as they are; these are the words shown on each chip.
    const statusLabel: Record<string, string> = {
        Pending: "Waiting",
        LeftMsg: "Left a message",
        Unreachable: "Will try again",
    };
    // A contact with no saved status is still pending, so that chip shows as chosen.
    let current = $derived(contact.notificationStatus || "Pending");
</script>

<div
    class="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 items-start md:items-center justify-between group transition-all hover:border-indigo-300"
>
    <div class="flex items-center gap-4">
        <div
            class="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-600"
        >
            {contact.name.charAt(0)}
        </div>
        <div>
            <h3 class="font-bold text-slate-800">{contact.name}</h3>
            <div class="text-xs text-slate-500 flex flex-wrap gap-2">
                <span class="font-semibold">{contact.relation}</span>
                <span aria-hidden="true" class="w-px self-stretch bg-slate-300"></span>
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
        {#if onEdit}
            <button
                onclick={() => onEdit(contact)}
                class="px-3 py-1.5 rounded-lg text-xs font-bold border border-slate-200 text-slate-600 hover:border-primary hover:text-primary transition-all whitespace-nowrap flex items-center gap-1"
            >
                <Pencil size={12} /> Update details
            </button>
        {/if}
        {#each statuses as status}
            <button
                onclick={() => updateStatus(contact.id, status)}
                aria-pressed={current === status}
                class="px-3 py-1.5 rounded-lg text-xs font-bold border transition-all whitespace-nowrap
                {current === status
                    ? 'bg-slate-800 text-white border-slate-800'
                    : 'bg-white text-slate-500 border-slate-200 hover:border-slate-400'}"
            >
                {statusLabel[status] ?? status}
            </button>
        {/each}
    </div>
</div>
