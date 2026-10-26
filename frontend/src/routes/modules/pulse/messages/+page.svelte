<script lang="ts">
    import { onMount, tick } from "svelte";
    import { apiGet, apiPost } from "$lib/api/client";
    import { MessageSquare, Send, User, Reply, Inbox } from "lucide-svelte";
    import { slide, fade } from "svelte/transition";

    let messages = $state<any[]>([]);
    let contacts = $state<any[]>([]);
    let tiers = $state<any[]>([]);
    let loading = $state(true);
    let composerOpen = $state(false);
    let sourceMessageId = $state<number | null>(null);

    let newMessage = $state({
        contact_id: null as number | null,
        text: "",
    });

    onMount(async () => {
        await refreshData();
        const query = new URLSearchParams(window.location.search);
        const contactId = Number(query.get("contact_id"));
        const messageId = Number(query.get("message_id"));
        if (messages.some((message) => message.id === messageId && message.contact_id === contactId)) {
            newMessage.contact_id = contactId;
            sourceMessageId = messageId;
            await tick();
            const source = document.getElementById(`pulse-message-${messageId}`);
            source?.scrollIntoView({ block: "center" });
            source?.focus({ preventScroll: true });
        }
    });

    async function refreshData() {
        try {
            [messages, contacts] = await Promise.all([
                apiGet("/api/pulse/messages"),
                apiGet("/api/pulse/contacts"),
            ]);
            // Only fetch tiers when a contact has one (GET /tiers seeds defaults when empty).
            if (contacts.some((c) => c.tier_id)) {
                tiers = await apiGet("/api/pulse/tiers");
            }
        } catch (e) {
            console.error(e);
        } finally {
            loading = false;
        }
    }

    async function sendMessage() {
        if (!newMessage.contact_id || !newMessage.text) return;

        try {
            await apiPost(
                `/api/pulse/messages?contact_id=${newMessage.contact_id}&message=${encodeURIComponent(newMessage.text)}`,
            );
            newMessage.text = "";
            await refreshData();
            // Scroll to bottom logic could go here
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

    // Rows the app writes itself (pulse_logic): "[System Alert Tier N] ..." for tier alerts and
    // "[Safety timer N] alert sent" / "[Safety timer N] send failed (attempt k)" for safety timers.
    function isSystem(text: string) {
        return text.startsWith("[System Alert") || text.startsWith("[Safety timer");
    }
    // Rows that say the same thing group together (a retried send differs only in "(attempt k)")
    function groupKey(text: string) {
        return text.replace(/ \(attempt \d+\)$/, "");
    }

    // Repeated identical system rows (a send retried up to 3 times) show as one line with a
    // count; the latest row of each group keeps its place and time.
    function getThreadForContact(contactId: number | null) {
        const msgs = getMessagesForContact(contactId);
        if (sourceMessageId !== null) {
            return msgs.map((message) => ({ ...message, system: isSystem(message.message), attempts: 1 }));
        }
        const counts = new Map<string, number>();
        for (const m of msgs) {
            if (isSystem(m.message)) {
                const k = groupKey(m.message);
                counts.set(k, (counts.get(k) ?? 0) + 1);
            }
        }
        const seen = new Map<string, number>();
        return msgs
            .filter((m) => {
                if (!isSystem(m.message)) return true;
                const k = groupKey(m.message);
                const n = (seen.get(k) ?? 0) + 1;
                seen.set(k, n);
                return n === counts.get(k);
            })
            .map((m) => ({
                ...m,
                system: isSystem(m.message),
                attempts: isSystem(m.message)
                    ? (counts.get(groupKey(m.message)) ?? 1)
                    : 1,
            }));
    }

    function getLatestMessageTime(contactId: number) {
        const msgs = getMessagesForContact(contactId);
        return msgs.length > 0 ? msgs[msgs.length - 1].sent_at : null;
    }

    function stripAlertPrefix(text: string) {
        const timer = text.match(/^\[Safety timer \d+\] (.*?)( \(attempt \d+\))?$/);
        if (timer) {
            if (timer[1] === "prepared in local outbox") {
                return "Safety timer alert prepared in the local outbox.";
            }
            if (timer[1] === "alert accepted by email provider") {
                return "An email provider accepted the safety timer alert for sending.";
            }
            return timer[1] === "alert sent"
                ? "Safety timer alert sent"
                : "Safety timer alert paused on its way; a call or message may reach them sooner.";
        }
        return text.replace(/^\[System Alert Tier \d+\] /, "");
    }

    function tierNumberFor(contact: any) {
        return tiers.find((t) => t.id === contact?.tier_id)?.tier_number;
    }

    function getLastMessagePreview(contactId: number) {
        const msgs = getMessagesForContact(contactId);
        if (msgs.length === 0) return "";
        const last = msgs[msgs.length - 1];
        return (
            (last.direction === "contact_to_user" ? "Them: " : "You: ") +
            stripAlertPrefix(last.message)
        );
    }
</script>

<div
    class="max-w-4xl mx-auto p-4 md:p-8 pb-32 h-[calc(100vh-100px)] flex flex-col"
>
    <div class="flex items-center justify-between mb-6 shrink-0">
        <div>
            <h1
                class="text-2xl font-serif text-foreground flex items-center gap-2"
            >
                <Inbox class="text-primary" />
                Message Hub
            </h1>
            <p class="text-muted-foreground text-sm mt-1">
                Notes between you and the people you trust.
            </p>
        </div>
        <a
            href="/modules/pulse"
            class="text-sm text-primary hover:text-primary-hover"
            >Back to Wellness Check-in</a
        >
    </div>

    <div
        class="flex-1 bg-background/40 border border-slate-800 rounded-2xl overflow-hidden flex shadow-2xl backdrop-blur-sm"
    >
        <!-- LEFT: Contact List -->
        <div
            class="w-1/3 border-r border-slate-800 flex flex-col bg-slate-950/30"
        >
            <div class="p-4 border-b border-slate-800">
                <h3
                    class="text-xs font-bold text-muted-foreground uppercase tracking-widest"
                >
                    Conversations
                </h3>
            </div>
            <div class="flex-1 overflow-y-auto">
                {#each contacts as contact}
                    <button
                        class="w-full text-left p-4 hover:bg-card/50 transition-colors flex items-center gap-3 border-b border-slate-800/50 {newMessage.contact_id ===
                        contact.id
                            ? 'bg-primary/10 border-l-2 border-l-primary'
                            : ''}"
                        onclick={() => {
                            sourceMessageId = null;
                            newMessage.contact_id = contact.id;
                            composerOpen = true; // Always show composer in thread view
                        }}
                    >
                        <div
                            class="w-10 h-10 rounded-full bg-card flex items-center justify-center text-slate-300 font-bold border border-border"
                        >
                            {contact.name.charAt(0)}
                        </div>
                        <div class="flex-1 min-w-0">
                            <div class="flex justify-between items-baseline">
                                <span
                                    class="font-medium text-foreground truncate"
                                    >{contact.name}</span
                                >
                                {#if getLatestMessageTime(contact.id)}
                                    <span class="text-[10px] text-muted-foreground"
                                        >{new Date(
                                            getLatestMessageTime(contact.id),
                                        ).toLocaleDateString(undefined, {
                                            month: "short",
                                            day: "numeric",
                                        })}</span
                                    >
                                {/if}
                            </div>
                            <p class="text-xs text-muted-foreground truncate">
                                {getLastMessagePreview(contact.id)}
                            </p>
                        </div>
                    </button>
                {/each}
                {#if contacts.length === 0}
                    <div class="p-8 text-center">
                        <Inbox class="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                        <p class="text-muted-foreground text-sm font-medium mb-2">
                            Your circle will appear here
                        </p>
                        <p
                            class="text-muted-foreground text-xs leading-relaxed max-w-xs mx-auto"
                        >
                            When you add trusted contacts in Pulse Settings,
                            they will appear here.
                        </p>
                    </div>
                {/if}
            </div>
        </div>

        <!-- RIGHT: Thread View -->
        <div class="flex-1 flex flex-col bg-background/20">
            {#if newMessage.contact_id}
                {@const activeContact = contacts.find(
                    (c) => c.id === newMessage.contact_id,
                )}
                {@const activeTier = tierNumberFor(activeContact)}
                <!-- Thread Header -->
                <div
                    class="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-950/50"
                >
                    <div class="font-medium text-foreground">
                        {activeContact?.name ?? "Saved contact"}
                    </div>
                    {#if activeTier}
                        <span
                            class="text-xs text-muted-foreground"
                            data-testid="thread-tier">Tier {activeTier}</span
                        >
                    {/if}
                </div>

                <!-- Messages Area -->
                <div
                    class="flex-1 overflow-y-auto p-4 space-y-4 flex flex-col-reverse"
                >
                    <!-- Flex-col-reverse keeps scroll at bottom usually, but map order matters. Let's stick to standard order. -->
                    {#each getThreadForContact(newMessage.contact_id) as msg}
                        <div
                            id={`pulse-message-${msg.id}`}
                            tabindex="-1"
                            class="flex gap-3 max-w-[80%] {msg.direction ===
                            'user_to_contact'
                                ? 'ml-auto flex-row-reverse'
                                : ''}"
                        >
                            <div
                                class="w-8 h-8 rounded-full flex items-center justify-center shrink-0 {msg.direction ===
                                'user_to_contact'
                                    ? 'bg-primary/20 text-primary'
                                    : 'bg-card text-muted-foreground'}"
                            >
                                {#if msg.direction === "user_to_contact"}
                                    <User class="w-4 h-4" />
                                {:else}
                                    <Reply class="w-4 h-4" />
                                {/if}
                            </div>
                            <div
                                class="p-3 rounded-2xl text-sm leading-relaxed max-w-full {msg.system
                                    ? 'bg-warning-soft border border-warning/30 text-foreground rounded-tr-2xl rounded-tl-2xl w-full text-center italic'
                                    : msg.direction === 'user_to_contact'
                                      ? 'bg-primary/20 text-foreground border border-primary/20 rounded-tr-none'
                                      : 'bg-card text-slate-300 rounded-tl-none'}"
                            >
                                {#if msg.system}
                                    <span
                                        class="text-[10px] font-bold uppercase tracking-widest text-warning block mb-1"
                                        >A gentle note from Continuum</span
                                    >
                                {/if}
                                {stripAlertPrefix(msg.message)}
                                {#if msg.attempts > 1}
                                    <span
                                        class="block mt-1 text-[11px] not-italic text-warning/90"
                                        data-testid="alert-attempts"
                                        >{msg.attempts} recorded attempts</span
                                    >
                                {/if}
                                {#if sourceMessageId === msg.id}<span class="block mt-2 text-xs not-italic text-primary">Saved message #{msg.id}</span>{/if}
                                <div
                                    class="mt-1 text-[10px] opacity-50 {msg.system
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
                            class="flex-1 flex items-center justify-center text-muted-foreground text-sm italic"
                        >
                            Write the first note below whenever you're ready.
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
                            placeholder="Write a note for them..."
                            class="flex-1 bg-background border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:border-primary/50 transition-colors"
                        />
                        <button aria-label="Send"
                            type="submit"
                            disabled={!newMessage.text}
                            class="bg-primary hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed text-primary-foreground p-3 rounded-xl transition-all"
                        >
                            <Send class="w-5 h-5" />
                        </button>
                    </form>
                </div>
            {:else}
                <div
                    class="flex-1 flex flex-col items-center justify-center text-muted-foreground"
                >
                    <MessageSquare class="w-16 h-16 opacity-20 mb-4" />
                    <p>Choose a person to read your notes together.</p>
                </div>
            {/if}
        </div>
    </div>
</div>
