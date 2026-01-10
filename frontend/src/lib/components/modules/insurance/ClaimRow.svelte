<script lang="ts">
    import { CircleCheck, Clock, FileText } from "lucide-svelte";

    export let claim;
    export let onUpdateStatus;

    const statusColors: Record<string, string> = {
        Open: "bg-blue-100 text-blue-700 border-blue-200",
        Submitted: "bg-purple-100 text-purple-700 border-purple-200",
        "In Review": "bg-amber-100 text-amber-700 border-amber-200",
        Approved: "bg-emerald-100 text-emerald-700 border-emerald-200",
        Denied: "bg-red-100 text-red-700 border-red-200",
        Closed: "bg-slate-100 text-slate-700 border-slate-200",
    };
</script>

<div
    class="flex items-center justify-between p-3 bg-white rounded-lg border border-slate-200 hover:border-slate-300 transition-colors group"
>
    <div class="flex items-center gap-3">
        <div class="p-2 bg-slate-50 rounded-md text-slate-400">
            <FileText class="w-4 h-4" />
        </div>
        <div>
            <div class="font-medium text-slate-800 text-sm">{claim.title}</div>
            <div class="text-xs text-slate-500">
                {new Date(claim.date).toLocaleDateString()} • {claim.policyName}
            </div>
        </div>
    </div>

    <div class="flex items-center gap-4">
        <button
            class="px-2.5 py-1 rounded-full text-xs font-bold border {statusColors[
                claim.status
            ] || 'bg-slate-100 text-slate-600'}"
            on:click={onUpdateStatus}
        >
            {claim.status}
        </button>
    </div>
</div>
