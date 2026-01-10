<script lang="ts">
    import { Save, Lock } from "lucide-svelte";

    let taskWebhook = "";
    let systemWebhook = "";
    let isSaved = false;

    function save() {
        // Mock save
        isSaved = true;
        setTimeout(() => (isSaved = false), 2000);
    }
</script>

<div class="bg-gray-50 rounded-xl p-8 border border-gray-200">
    <div
        class="flex items-center gap-2 mb-6 text-gray-400 text-xs font-bold uppercase tracking-widest"
    >
        <Lock size={12} />
        <span>Developer Settings</span>
    </div>

    <h3 class="text-xl font-bold text-[#304743] mb-6">Webhook Configuration</h3>

    <div class="space-y-6 max-w-2xl">
        <label class="block">
            <span class="text-sm font-bold text-gray-700 block mb-2"
                >Tasks Webhook URL</span
            >
            <input
                type="text"
                bind:value={taskWebhook}
                placeholder="https://api.pipedream.com/..."
                class="w-full font-mono text-sm px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#4A7C74]/20 focus:outline-none"
            />
            <p class="mt-2 text-xs text-gray-500">
                Triggers when executor tasks are updated
            </p>
        </label>

        <label class="block">
            <span class="text-sm font-bold text-gray-700 block mb-2"
                >System Events Webhook URL</span
            >
            <input
                type="text"
                bind:value={systemWebhook}
                placeholder="https://hooks.slack.com/..."
                class="w-full font-mono text-sm px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#4A7C74]/20 focus:outline-none"
            />
            <p class="mt-2 text-xs text-gray-500">
                Global firehose for all estate changes
            </p>
        </label>

        <button
            on:click={save}
            class="flex items-center gap-2 px-6 py-2 bg-[#304743] text-white rounded-lg font-bold hover:bg-[#2A3F3B] transition-colors"
        >
            <Save size={18} />
            {isSaved ? "Saved!" : "Save Config"}
        </button>
    </div>
</div>
