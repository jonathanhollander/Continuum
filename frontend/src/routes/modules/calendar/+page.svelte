<script lang="ts">
    import { fade, slide } from "svelte/transition";
    import { onMount } from "svelte";
    import {
        Calendar as CalendarIcon,
        Heart,
        Mail,
        Plus,
        Trash2,
        Pencil,
        Sparkles,
        Gift,
        Clock,
        X,
        ChevronRight,
    } from "lucide-svelte";
    import AIPromptBar from "$lib/components/concierge/AIPromptBar.svelte";

    // --- Types ---
    type CalendarEvent = {
        id: string;
        title: string;
        date: string; // MMDD for recurring (e.g. "1225"), YYYYMMDD for one-time
        type: "birthday" | "holiday" | "anniversary" | "other";
        isRecurring: boolean;
        wish: string;
        emailTemplate?: {
            recipient: string;
            subject: string;
            body: string;
        };
    };

    // --- State ---
    let showAddForm = false;
    let editingId: string | null = null;

    // Default new event
    let newEvent: CalendarEvent = {
        id: "",
        title: "",
        date: "",
        type: "birthday",
        isRecurring: true,
        wish: "",
        emailTemplate: {
            recipient: "",
            subject: "",
            body: "",
        },
    };

    // Form inputs (separate for easier binding)
    let formDate = ""; // YYYY-MM-DD from input
    let formRecipient = "";
    let formSubject = "";
    let formBody = "";

    // --- Logic ---

    // --- Logic ---

    import { registerSync } from "$lib/services/sync.svelte";

    // Register Sync
    const calendarSync = registerSync<CalendarEvent>(
        "calendar_events",
        "calendar_events",
    );
    let events = $derived(calendarSync.items);

    // Seeding Logic (only if empty)
    $effect(() => {
        if (
            calendarSync.status === "synced" &&
            calendarSync.items.length === 0
        ) {
            // Check legacy
            const legacy = localStorage.getItem("calendar");
            if (legacy) {
                try {
                    // Logic to migrate or just load legacy
                    // For now, we seed defaults if absolutely nothing exists
                    const defaults = [
                        {
                            title: "My Birthday",
                            date: "0615",
                            type: "birthday",
                            isRecurring: true,
                            wish: "Have a slice of cheesecake for me. It was my favorite.",
                            emailTemplate: {
                                recipient: "family@example.com",
                                subject: "Thinking of you on my birthday",
                                body: "Hi everyone,\n\nIf you're reading this, it's my birthday. I hope you're not too sad. Go have some fun today!\n\nLove,\nMe",
                            },
                        },
                    ];
                    // Only seed if no legacy either?
                    // We'll trust user to add.
                } catch {}
            }
        }
    });

    // onMount removed
    // saveEvents removed

    async function handleSave() {
        if (!newEvent.title || !formDate) return;

        // Parse date for storage
        // If recurring, we only care about Month/Day. Input gives YYYY-MM-DD
        const dateObj = new Date(formDate);
        let storageDate = "";

        if (newEvent.isRecurring) {
            // Format: MMDD
            // Parsing manually to avoid timezone issues
            const parts = formDate.split("-");
            // parts[0] is year, [1] is month, [2] is day
            storageDate = `${parts[1]}${parts[2]}`;
        } else {
            // YYYYMMDD
            const parts = formDate.split("-");
            storageDate = `${parts[0]}${parts[1]}${parts[2]}`;
        }

        const eventData = {
            title: newEvent.title,
            date: storageDate,
            type: newEvent.type,
            isRecurring: newEvent.isRecurring,
            wish: newEvent.wish,
            emailTemplate:
                formRecipient || formSubject || formBody
                    ? {
                          recipient: formRecipient,
                          subject: formSubject,
                          body: formBody,
                      }
                    : undefined,
        };

        if (editingId) {
            await calendarSync.update(editingId, eventData);
        } else {
            await calendarSync.create(eventData);
        }

        resetForm();
    }

    function editEvent(evt: CalendarEvent) {
        editingId = evt.id;
        newEvent = { ...evt };

        // Convert storage date back to form input format YYYY-MM-DD
        // For recurring (MMDD), we'll just fake the current year for the input
        if (evt.isRecurring) {
            const currentYear = new Date().getFullYear();
            const m = evt.date.substring(0, 2);
            const d = evt.date.substring(2, 4);
            formDate = `${currentYear}-${m}-${d}`;
        } else {
            // YYYYMMDD
            const y = evt.date.substring(0, 4);
            const m = evt.date.substring(4, 6);
            const d = evt.date.substring(6, 8);
            formDate = `${y}-${m}-${d}`;
        }

        if (evt.emailTemplate) {
            formRecipient = evt.emailTemplate.recipient;
            formSubject = evt.emailTemplate.subject;
            formBody = evt.emailTemplate.body;
        } else {
            formRecipient = "";
            formSubject = "";
            formBody = "";
        }

        showAddForm = true;
    }

    function removeEvent(id: string) {
        if (!confirm("Remove this event?")) return;
        calendarSync.delete(id);
    }

    function resetForm() {
        showAddForm = false;
        editingId = null;
        newEvent = {
            id: "",
            title: "",
            date: "",
            type: "birthday",
            isRecurring: true,
            wish: "",
        };
        formDate = "";
        formRecipient = "";
        formSubject = "";
        formBody = "";
    }

    // --- HelpersFor Display ---
    function formatDisplayDate(dateStr: string, isRecurring: boolean) {
        if (!dateStr) return "";
        const months = [
            "Jan",
            "Feb",
            "Mar",
            "Apr",
            "May",
            "Jun",
            "Jul",
            "Aug",
            "Sep",
            "Oct",
            "Nov",
            "Dec",
        ];

        if (isRecurring) {
            const m = parseInt(dateStr.substring(0, 2)) - 1;
            const d = parseInt(dateStr.substring(2, 4));
            return `${months[m]} ${d}`;
        } else {
            const y = dateStr.substring(0, 4);
            const m = parseInt(dateStr.substring(4, 6)) - 1;
            const d = parseInt(dateStr.substring(6, 8));
            return `${months[m]} ${d}, ${y}`;
        }
    }

    function getMailtoLink(evt: CalendarEvent) {
        if (!evt.emailTemplate) return "";
        const { recipient, subject, body } = evt.emailTemplate;
        return `mailto:${recipient}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    }

    const eventTypeIcons = {
        birthday: Gift,
        holiday: Sparkles,
        anniversary: Heart,
        other: CalendarIcon,
    };

    const eventTypeColors = {
        birthday: "text-rose-500 bg-rose-50",
        holiday: "text-amber-500 bg-amber-50",
        anniversary: "text-purple-500 bg-purple-50",
        other: "text-blue-500 bg-blue-50",
    };
</script>

<div class="max-w-4xl mx-auto p-8 animate-in fade-in duration-500">
    <!-- Header -->
    <div class="mb-12 flex justify-between items-end">
        <div>
            <div
                class="inline-flex items-center justify-center p-3 bg-[#304743]/10 text-[#304743] rounded-full mb-4"
            >
                <Clock size={32} />
            </div>
            <h1 class="font-serif font-bold text-4xl text-[#304743] mb-2">
                Afterlife Calendar
            </h1>
            <p class="text-lg text-muted-foreground max-w-2xl">
                Transform difficult dates into moments of connection. Ensure
                your birthday, holidays, and anniversaries are celebrated
                exactly how you want them to be.
            </p>
        </div>
        <button
            class="bg-[#304743] text-white px-6 py-2 rounded-xl font-bold hover:bg-[#2a3f3b] transition-colors flex items-center gap-2"
            on:click={() => (showAddForm = true)}
        >
            <Plus size={20} /> Add Significant Date
        </button>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        {#each events as evt}
            <div
                class="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 hover:shadow-md transition-all group relative overflow-hidden"
            >
                <!-- Type Badge -->
                <div class="absolute top-0 right-0 p-4 opacity-10">
                    <svelte:component
                        this={eventTypeIcons[evt.type]}
                        size={120}
                    />
                </div>

                <div class="relative z-10">
                    <div class="flex justify-between items-start mb-4">
                        <div
                            class={`p-3 rounded-2xl ${eventTypeColors[evt.type]} inline-flex`}
                        >
                            <svelte:component
                                this={eventTypeIcons[evt.type]}
                                size={24}
                            />
                        </div>
                        <div
                            class="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                            <button
                                on:click={() => editEvent(evt)}
                                class="p-2 hover:bg-gray-100 rounded-full text-gray-400 hover:text-blue-500"
                            >
                                <Pencil size={16} />
                            </button>
                            <button
                                on:click={() => removeEvent(evt.id)}
                                class="p-2 hover:bg-gray-100 rounded-full text-gray-400 hover:text-red-500"
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>
                    </div>

                    <div class="mb-6">
                        <span
                            class="text-xs font-bold uppercase tracking-wider text-gray-400 mb-1 block"
                        >
                            {evt.isRecurring ? "Every Year" : "One Time Event"}
                        </span>
                        <h3
                            class="font-serif font-bold text-2xl text-gray-900 leading-tight mb-1"
                        >
                            {evt.title}
                        </h3>
                        <div
                            class="text-[#304743] font-medium flex items-center gap-2"
                        >
                            <CalendarIcon size={14} />
                            {formatDisplayDate(evt.date, evt.isRecurring)}
                        </div>
                    </div>

                    {#if evt.wish}
                        <div
                            class="bg-gray-50 p-4 rounded-xl mb-4 border border-gray-100"
                        >
                            <div class="flex items-start gap-2">
                                <Sparkles
                                    class="text-amber-400 shrink-0 mt-0.5"
                                    size={16}
                                />
                                <p class="text-gray-600 text-sm italic">
                                    "{evt.wish}"
                                </p>
                            </div>
                        </div>
                    {/if}

                    {#if evt.emailTemplate}
                        <a
                            href={getMailtoLink(evt)}
                            target="_blank"
                            class="w-full flex items-center justify-center gap-2 py-3 border border-gray-200 rounded-xl text-gray-600 font-bold text-sm hover:border-[#304743] hover:text-[#304743] transition-colors bg-white"
                        >
                            <Mail size={16} />
                            Prepare "Future Email"
                        </a>
                    {/if}
                </div>
            </div>
        {/each}

        <!-- AI Suggestion Card (Mock) -->
        <button
            class="w-full border-2 border-dashed border-gray-200 rounded-3xl p-6 flex flex-col items-center justify-center text-center text-gray-400 gap-4 min-h-[300px] hover:border-[#304743]/50 hover:bg-gray-50/50 transition-all cursor-pointer"
            on:click={() => (showAddForm = true)}
        >
            <div class="p-4 bg-gray-100 rounded-full">
                <Plus size={32} />
            </div>
            <div>
                <h3 class="font-bold text-gray-600 mb-1">Add Another Date</h3>
                <p class="text-sm">
                    Birthdays, anniversaries, or just a Tuesday.
                </p>
            </div>
        </button>
    </div>

    <!-- AI Bar -->
    <div class="mt-12">
        <AIPromptBar
            prompts={[
                "Suggest 3 meaningful things my family could do on my birthday",
                "Draft a funny anniversary email to my spouse",
                "What are some unique ways to be remembered on Christmas?",
            ]}
        />
    </div>

    <!-- Modal -->
    {#if showAddForm}
        <div
            class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            transition:fade
        >
            <div
                class="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]"
                transition:slide
            >
                <div
                    class="p-6 border-b border-gray-100 flex justify-between items-center bg-[#304743] text-white"
                >
                    <h3 class="font-serif font-bold text-2xl">
                        {editingId ? "Edit Event" : "Add Significant Date"}
                    </h3>
                    <button
                        on:click={resetForm}
                        class="text-white/70 hover:text-white"
                    >
                        <X size={24} />
                    </button>
                </div>

                <div class="p-6 space-y-6 overflow-y-auto">
                    <!-- Basic Info -->
                    <div class="space-y-4">
                        <div>
                            <label
                                for="event-title"
                                class="block text-xs font-bold uppercase text-gray-500 mb-1"
                                >Event Title</label
                            >
                            <input
                                id="event-title"
                                type="text"
                                bind:value={newEvent.title}
                                placeholder="e.g. My Birthday, Wedding Anniversary"
                                class="w-full px-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#304743]/20"
                            />
                        </div>

                        <div class="grid grid-cols-2 gap-4">
                            <div>
                                <label
                                    for="event-date"
                                    class="block text-xs font-bold uppercase text-gray-500 mb-1"
                                    >Date</label
                                >
                                <input
                                    id="event-date"
                                    type="date"
                                    bind:value={formDate}
                                    class="w-full px-4 py-2 rounded-xl border border-gray-200"
                                />
                            </div>
                            <div>
                                <label
                                    for="event-type"
                                    class="block text-xs font-bold uppercase text-gray-500 mb-1"
                                    >Type</label
                                >
                                <select
                                    id="event-type"
                                    bind:value={newEvent.type}
                                    class="w-full px-4 py-2 rounded-xl border border-gray-200 bg-white"
                                >
                                    <option value="birthday">Birthday</option>
                                    <option value="anniversary"
                                        >Anniversary</option
                                    >
                                    <option value="holiday">Holiday</option>
                                    <option value="other">Other</option>
                                </select>
                            </div>
                        </div>

                        <div class="flex items-center gap-2">
                            <input
                                type="checkbox"
                                id="recurring"
                                bind:checked={newEvent.isRecurring}
                                class="rounded border-gray-300 text-[#304743] focus:ring-[#304743]"
                            />
                            <label
                                for="recurring"
                                class="text-sm font-medium text-gray-700"
                                >Recur every year (e.g. Birthday)</label
                            >
                        </div>
                    </div>

                    <!-- The Wish -->
                    <div
                        class="bg-amber-50 p-4 rounded-xl border border-amber-100"
                    >
                        <label
                            class="block text-xs font-bold uppercase text-amber-600 mb-2 flex items-center gap-2"
                        >
                            <Sparkles size={14} /> My Wish for this Day
                        </label>
                        <textarea
                            bind:value={newEvent.wish}
                            rows="2"
                            placeholder="e.g. Go to our favorite diner and order the pancakes."
                            class="w-full px-4 py-2 rounded-xl border border-amber-200 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                        ></textarea>
                        <p class="text-xs text-amber-600/70 mt-2">
                            A simple instruction creates connection.
                        </p>
                    </div>

                    <!-- Future Email -->
                    <div class="border-t border-gray-100 pt-4">
                        <div class="flex items-center gap-2 mb-4">
                            <Mail class="text-[#304743]" size={18} />
                            <h4 class="font-bold text-gray-900">
                                Future Message
                            </h4>
                        </div>
                        <p class="text-sm text-gray-500 mb-4">
                            Draft a message for this day. Your executor can
                            click a button to open this in their email client to
                            send it on your behalf.
                        </p>

                        <div class="space-y-3">
                            <input
                                type="text"
                                bind:value={formRecipient}
                                placeholder="Recipient (Email)"
                                class="w-full px-4 py-2 rounded-xl border border-gray-200 text-sm"
                            />
                            <input
                                type="text"
                                bind:value={formSubject}
                                placeholder="Subject Line"
                                class="w-full px-4 py-2 rounded-xl border border-gray-200 text-sm"
                            />
                            <textarea
                                bind:value={formBody}
                                rows="4"
                                placeholder="Dear..."
                                class="w-full px-4 py-2 rounded-xl border border-gray-200 text-sm"
                            ></textarea>
                        </div>
                    </div>
                </div>

                <div
                    class="p-6 bg-gray-50 flex justify-end gap-3 sticky bottom-0 border-t border-gray-100"
                >
                    <button
                        on:click={resetForm}
                        class="px-6 py-2 rounded-xl font-bold text-gray-500 hover:bg-gray-200 transition-colors"
                        >Cancel</button
                    >
                    <button
                        on:click={handleSave}
                        disabled={!newEvent.title || !formDate}
                        class="px-6 py-2 rounded-xl font-bold bg-[#304743] text-white hover:bg-[#20302d] transition-colors disabled:opacity-50"
                        >Save Event</button
                    >
                </div>
            </div>
        </div>
    {/if}
</div>
