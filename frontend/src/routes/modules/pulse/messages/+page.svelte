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
            const baseUrl = import.meta.env.VITE_API_BASE || "";
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
                await refreshData();
                // Scroll to bottom logic could go here
            }
        } catch (e) {
            console.error(e);
        }
    }

    function getMessagesForContact(contactId: number | null) {
        if (!contactId) return [];
        return messages
            .filter((m) => m.contact_id === contactId)
            .sort(
                (a, b) =>
                    new Date(a.sent_at).getTime() -
                    new Date(b.sent_at).getTime(),
            );
    }

    function getLatestMessageTime(contactId: number) {
        const msgs = getMessagesForContact(contactId);
        return msgs.length > 0 ? msgs[msgs.length - 1].sent_at : null;
    }

    function getLastMessagePreview(contactId: number) {
        const msgs = getMessagesForContact(contactId);
        if (msgs.length === 0) return "";
        const last = msgs[msgs.length - 1];
        return (
            (last.direction === "contact_to_user" ? "Them: " : "You: ") +
            last.message
        );
    }
</script>

<div
    class="max-w-6xl mx-auto p-4 md:p-8 pb-32 h-[calc(100vh-100px)] flex flex-col"
>
    <div class="flex items-center justify-between mb-6 shrink-0">
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
        <a
            href="/modules/pulse"
            class="text-sm text-teal-400 hover:text-teal-300"
            >Back to Dashboard</a
        >
    </div>

    <div
        class="flex-1 bg-slate-900/40 border border-slate-800 rounded-2xl overflow-hidden flex shadow-2xl backdrop-blur-sm"
    >
        <!-- LEFT: Contact List -->
        <div
            class="w-1/3 border-r border-slate-800 flex flex-col bg-slate-950/30"
        >
            <div class="p-4 border-b border-slate-800">
                <h3
                    class="text-xs font-bold text-slate-500 uppercase tracking-widest"
                >
                    Conversations
                </h3>
            </div>
            <div class="flex-1 overflow-y-auto">
                {#each contacts as contact}
                    <button
                        class="w-full text-left p-4 hover:bg-slate-800/50 transition-colors flex items-center gap-3 border-b border-slate-800/50 {newMessage.contact_id ===
                        contact.id
                            ? 'bg-indigo-500/10 border-l-2 border-l-indigo-500'
                            : ''}"
                        onclick={() => {
                            newMessage.contact_id = contact.id;
                            composerOpen = true; // Always show composer in thread view
                        }}
                    >
                        <div
                            class="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-300 font-bold border border-slate-700"
                        >
                            {contact.name.charAt(0)}
                        </div>
                        <div class="flex-1 min-w-0">
                            <div class="flex justify-between items-baseline">
                                <span
                                    class="font-medium text-slate-200 truncate"
                                    >{contact.name}</span
                                >
                                {#if getLatestMessageTime(contact.id)}
                                    <span class="text-[10px] text-slate-500"
                                        >{new Date(
                                            getLatestMessageTime(contact.id),
                                        ).toLocaleDateString(undefined, {
                                            month: "short",
                                            day: "numeric",
                                        })}</span
                                    >
                                {/if}
                            </div>
                            <p class="text-xs text-slate-500 truncate">
                                {getLastMessagePreview(contact.id) ||
                                    "No messages yet"}
                            </p>
                        </div>
                    </button>
                {/each}
                {#if contacts.length === 0}
                    <div class="p-8 text-center text-slate-500 text-sm">
                        No contacts available.
                    </div>
                {/if}
            </div>
        </div>

        <!-- RIGHT: Thread View -->
        <div class="flex-1 flex flex-col bg-slate-900/20">
            {#if newMessage.contact_id}
                {@const activeContact = contacts.find(
                    (c) => c.id === newMessage.contact_id,
                )}
                <!-- Thread Header -->
                <div
                    class="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-950/50"
                >
                    <div class="font-medium text-slate-200">
                        {activeContact?.name}
                    </div>
                    <span class="text-xs text-slate-500"
                        >Tier {activeContact?.tier_id}</span
                    >
                </div>

                <!-- Messages Area -->
                <div
                    class="flex-1 overflow-y-auto p-4 space-y-4 flex flex-col-reverse"
                >
                    <!-- Flex-col-reverse keeps scroll at bottom usually, but map order matters. Let's stick to standard order. -->
                    {#each getMessagesForContact(newMessage.contact_id) as msg}
                        <div
                            class="flex gap-3 max-w-[80%] {msg.direction ===
                            'user_to_contact'
                                ? 'ml-auto flex-row-reverse'
                                : ''}"
                        >
                            <div
                                class="w-8 h-8 rounded-full flex items-center justify-center shrink-0 {msg.direction ===
                                'user_to_contact'
                                    ? 'bg-indigo-500/20 text-indigo-400'
                                    : 'bg-teal-500/20 text-teal-400'}"
                            >
                                {#if msg.direction === "user_to_contact"}
                                    <User class="w-4 h-4" />
                                {:else}
                                    <Reply class="w-4 h-4" />
                                {/if}
                            </div>
                            <div
                                class="p-3 rounded-2xl text-sm leading-relaxed max-w-full {msg.message.startsWith(
                                    '[System Alert',
                                )
                                    ? 'bg-amber-900/20 border border-amber-500/30 text-amber-100 rounded-tr-2xl rounded-tl-2xl w-full text-center italic'
                                    : msg.direction === 'user_to_contact'
                                      ? 'bg-indigo-600/20 text-indigo-100 rounded-tr-none'
                                      : 'bg-slate-800 text-slate-300 rounded-tl-none'}"
                            >
                                {#if msg.message.startsWith("[System Alert")}
                                    <span
                                        class="text-[10px] font-bold uppercase tracking-widest text-amber-500 block mb-1"
                                        >Automated System Log</span
                                    >
                                {/if}
                                {msg.message
                                    .replace("[System Alert Tier 1] ", "")
                                    .replace("[System Alert Tier 2] ", "")
                                    .replace("[System Alert Tier 3] ", "")
                                    .replace("[System Alert Tier 4] ", "")}
                                <div
                                    class="mt-1 text-[10px] opacity-50 {msg.message.startsWith(
                                        '[System Alert',
                                    )
                                        ? 'text-center'
                                        : 'text-right'}"
                                >
                                    {new Date(msg.sent_at).toLocaleTimeString(
                                        [],
                                        { hour: "2-digit", minute: "2-digit" },
                                    )}
                                </div>
                            </div>
                        </div>
                    {:else}
                        <div
                            class="flex-1 flex items-center justify-center text-slate-500 text-sm italic"
                        >
                            No conversation history. Start chatting below.
                        </div>
                    {/each}
                </div>

                <!-- Composer Input -->
                <div class="p-4 border-t border-slate-800 bg-slate-950/50">
                    <form
                        class="flex gap-2"
                        onsubmit={(e) => {
                            e.preventDefault();
                            sendMessage();
                        }}
                    >
                        <input
                            type="text"
                            bind:value={newMessage.text}
                            placeholder="Type a secure note..."
                            class="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-200 focus:outline-none focus:border-indigo-500/50 transition-colors"
                        />
                        <button
                            type="submit"
                            disabled={!newMessage.text}
                            class="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white p-3 rounded-xl transition-all"
                        >
                            <Send class="w-5 h-5" />
                        </button>
                    </form>
                </div>
            {:else}
                <div
                    class="flex-1 flex flex-col items-center justify-center text-slate-500"
                >
                    <MessageSquare class="w-16 h-16 opacity-20 mb-4" />
                    <p>Select a conversation to view secured notes.</p>
                </div>
            {/if}
        </div>
    </div>
</div>
