<script lang="ts">
    import { onMount } from "svelte";
    import { Save, Lock } from "lucide-svelte";
    import { registerProfileSlice } from "$lib/services/sync.svelte";

    interface WebhookSettings {
        taskWebhook: string;
        systemWebhook: string;
    }

    // Kept on this account's profile record (/api/estate/profile), like the other settings slices.
    const webhooks = registerProfileSlice<WebhookSettings>("webhook_settings", (data: Record<string, unknown>) => ({
        taskWebhook: (data?.taskWebhook || "") as string,
        systemWebhook: (data?.systemWebhook || "") as string,
    }));

    let taskWebhook = $state(webhooks.data?.taskWebhook || "");
    let systemWebhook = $state(webhooks.data?.systemWebhook || "");
    let edited = false;
    let saving = $state(false);
    let isSaved = $state(false);

    // Take the server's copy once it answers, unless the person has started typing.
    onMount(() => {
        webhooks.sync().then(() => {
            if (edited || !webhooks.data) return;
            taskWebhook = webhooks.data.taskWebhook;
            systemWebhook = webhooks.data.systemWebhook;
        }).catch(() => {});
    });

    async function save() {
        saving = true;
        try {
            await webhooks.update({ taskWebhook: taskWebhook.trim(), systemWebhook: systemWebhook.trim() });
            isSaved = true;
            setTimeout(() => (isSaved = false), 2000);
        } catch {
            // The store has already shown its gentle retry message and kept the typed URLs.
        } finally {
            saving = false;
        }
    }
</script>

<div class="bg-card rounded-xl p-8 border border-border">
    <div
        class="flex items-center gap-2 mb-6 text-muted-foreground text-xs font-bold uppercase tracking-widest"
    >
        <Lock size={12} />
        <span>Developer Settings</span>
    </div>

    <h3 class="text-xl font-bold text-foreground mb-6">Webhook Configuration</h3>

    <div class="space-y-6 max-w-2xl">
        <label class="block">
            <span class="text-sm font-bold text-foreground block mb-2"
                >Tasks Webhook URL</span
            >
            <input
                type="text"
                bind:value={taskWebhook}
                oninput={() => (edited = true)}
                placeholder="https://api.pipedream.com/..."
                class="w-full font-mono text-sm text-foreground bg-background placeholder:text-muted-foreground px-4 py-3 rounded-lg border border-border focus:border-primary focus:ring-2 focus:ring-primary/30 focus:outline-none"
            />
            <p class="mt-2 text-xs text-muted-foreground">
                Triggers when executor tasks are updated
            </p>
        </label>

        <label class="block">
            <span class="text-sm font-bold text-foreground block mb-2"
                >System Events Webhook URL</span
            >
            <input
                type="text"
                bind:value={systemWebhook}
                oninput={() => (edited = true)}
                placeholder="https://hooks.slack.com/..."
                class="w-full font-mono text-sm text-foreground bg-background placeholder:text-muted-foreground px-4 py-3 rounded-lg border border-border focus:border-primary focus:ring-2 focus:ring-primary/30 focus:outline-none"
            />
            <p class="mt-2 text-xs text-muted-foreground">
                Global firehose for all estate changes
            </p>
        </label>

        <button
            onclick={save}
            disabled={saving}
            class="flex items-center gap-2 px-6 py-2 bg-primary text-primary-foreground rounded-lg font-bold hover:bg-primary-hover transition-colors disabled:opacity-60"
        >
            <Save size={18} />
            {isSaved ? "Saved!" : "Save Config"}
        </button>
    </div>
</div>
