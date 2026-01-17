<script lang="ts">
    import { onMount } from "svelte";
    import { MessageSquare, Send, User, Reply, Inbox } from "lucide-svelte";
    import { slide, fade } from "svelte/transition";

    const USER_ID = 1;

    let messages = $state<any[]>([]);
    let contacts = $state<any[]>([]);
    let loading = $state(true);
    let composerOpen = $state(false);

    let newMessage = $state({
        contact_id: null as number | null,
        text: "",
    });

    onMount(async () => {
        await refreshData();
    });

    async function refreshData() {
        try {
            const baseUrl =
                import.meta.env.VITE_API_BASE || "http://localhost:8000";
            const [msgRes, contactsRes] = await Promise.all([
                fetch(`${baseUrl}/api/pulse/messages?user_id=${USER_ID}`),
                fetch(`${baseUrl}/api/pulse/contacts?user_id=${USER_ID}`),
            ]);

            if (msgRes.ok) messages = await msgRes.json();
            if (contactsRes.ok) contacts = await contactsRes.json();
        } catch (e) {
            console.error(e);
        } finally {
            loading = false;
        }
    }

    async function sendMessage() {
        if (!newMessage.contact_id || !newMessage.text) return;

        try {
            const res = await fetch(
                `${import.meta.env.VITE_API_BASE || "http://localhost:8000"}/api/pulse/messages?user_id=${USER_ID}&contact_id=${newMessage.contact_id}&message=${encodeURIComponent(newMessage.text)}`,
                {
                    method: "POST",
                },
            );
            if (res.ok) {
                newMessage.text = "";
                composerOpen = false;
                await refreshData();
            }
        } catch (e) {
            console.error(e);
        }
    }
</script>

<div class="max-w-4xl mx-auto p-4 md:p-8 pb-32">
    <div class="flex items-center justify-between mb-8">
        <div>
            <h1
                class="text-2xl font-serif text-slate-100 flex items-center gap-2"
            >
                <Inbox class="text-teal-400" />
                Message Hub
            </h1>
            <p class="text-slate-400 text-sm mt-1">
                Bi-directional contact notes.
            </p>
        </div>
        <div class="flex gap-4">
            <button
                onclick={() => (composerOpen = !composerOpen)}
                class="bg-teal-500/10 hover:bg-teal-500/20 text-teal-300 px-4 py-2 rounded-full border border-teal-500/20 text-sm font-medium transition-colors"
            >
                {composerOpen ? "Cancel" : "New Message"}
            </button>
            <a
                href="/modules/pulse"
                class="text-sm text-teal-400 hover:text-teal-300 transition-colors flex items-center h-full"
                >Back to Dashboard</a
            >
        </div>
    </div>

    <!-- Composer -->
    {#if composerOpen}
        <div
            class="bg-slate-900/60 backdrop-blur-md rounded-2xl border border-teal-500/30 p-6 mb-8"
            transition:slide
        >
            <h3 class="text-sm font-medium text-slate-300 mb-4">
                Compose Note
            </h3>

            <div class="space-y-4">
                <div>
                    <label class="block text-xs text-slate-500 mb-1"
                        >Recipient</label
                    >
                    <select
                        bind:value={newMessage.contact_id}
                        class="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-200 text-sm"
                    >
                        <option value={null}>Select a Contact...</option>
                        {#each contacts as contact}
                            <option value={contact.id}
                                >{contact.name} (Tier {contact.tier_id})</option
                            >
                        {/each}
                    </select>
                </div>

                <div>
                    <label class="block text-xs text-slate-500 mb-1"
                        >Message</label
                    >
                    <textarea
                        bind:value={newMessage.text}
                        rows={3}
                        class="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-slate-200 text-sm focus:ring-1 focus:ring-teal-500/50 outline-none"
                        placeholder="Thinking of you..."
                    ></textarea>
                </div>

                <div class="flex justify-end">
                    <button
                        onclick={sendMessage}
                        disabled={!newMessage.contact_id || !newMessage.text}
                        class="bg-teal-600 hover:bg-teal-500 text-white px-6 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                    >
                        Send Message
                    </button>
                </div>
            </div>
        </div>
    {/if}

    <!-- Message List -->
    <div class="space-y-4">
        {#each messages as msg}
            <div
                class="bg-slate-900/40 border border-slate-800 rounded-xl p-4 flex gap-4 hover:border-slate-700 transition-colors"
                in:fade
            >
                <div class="shrink-0 mt-1">
                    {#if msg.direction === "user_to_contact"}
                        <div
                            class="w-8 h-8 rounded-full bg-teal-500/20 flex items-center justify-center"
                        >
                            <Reply class="w-4 h-4 text-teal-400" />
                        </div>
                    {:else}
                        <div
                            class="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center"
                        >
                            <User class="w-4 h-4 text-indigo-400" />
                        </div>
                    {/if}
                </div>

                <div class="flex-1">
                    <div class="flex justify-between items-start">
                        <h4 class="text-sm font-medium text-slate-300">
                            {msg.direction === "user_to_contact"
                                ? "You sent to"
                                : "From"}
                            <span class="text-slate-200">
                                {contacts.find((c) => c.id === msg.contact_id)
                                    ?.name || "Unknown"}
                            </span>
                        </h4>
                        <span class="text-xs text-slate-600 font-mono"
                            >{new Date(msg.sent_at).toLocaleDateString()}</span
                        >
                    </div>
                    <p class="text-slate-400 text-sm mt-1">{msg.message}</p>
                </div>
            </div>
        {:else}
            {#if !loading}
                <div class="text-center py-12 text-slate-500">
                    <MessageSquare class="w-10 h-10 mx-auto mb-3 opacity-30" />
                    <p>No messages yet.</p>
                </div>
            {/if}
        {/each}
    </div>
</div>
