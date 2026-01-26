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
        Loader2,
    } from "lucide-svelte";
    import AIPromptBar from "$lib/components/concierge/AIPromptBar.svelte";
    import CustomFieldsManager from "$lib/components/ui/CustomFieldsManager.svelte";
    import DataViewToggle from "$lib/components/ui/DataViewToggle.svelte";
    import { userPreferencesStore, type ViewMode } from "$lib/stores/userPreferencesStore.svelte";
    import GhostRow from "$lib/components/ui/GhostRow.svelte";
    import EmptyState from "$lib/components/EmptyState.svelte";
    import { t, language } from "$lib/stores/localization";
    import { getSmartSamples } from "$lib/data/smartSamples";
    import Affirmation from "$lib/components/Affirmation.svelte";
    import LivingBlueprintHeader from "$lib/components/LivingBlueprintHeader.svelte";

    let viewMode = $state<ViewMode>('card');
    let showAffirmation = $state(false);

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
        custom_attributes?: string;
    };

    let parsedCustomAttributes = $state<Record<string, any>>({});

    // --- State ---
    let showAddForm = $state(false);
    let editingId = $state<string | null>(null);

    // Default new event
    let newEvent = $state<CalendarEvent>({
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
    });

    // Form inputs (separate for easier binding)
    let formDate = $state(""); // YYYY-MM-DD from input
    let formRecipient = $state("");
    let formSubject = $state("");
    let formBody = $state("");

    // --- Logic ---

    // --- Logic ---

    import { registerSync } from "$lib/services/sync.svelte";

    // Register Sync
    const calendarSync = registerSync<CalendarEvent>(
        "calendar_events",
        "calendar_events",
    );
    let events = $derived(calendarSync.items);
    let isLoading = $state(true);

    onMount(async () => {
        await calendarSync.init();
        isLoading = false;
    });

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
            custom_attributes: JSON.stringify(parsedCustomAttributes),
        };

        if (editingId) {
            await calendarSync.update(editingId, eventData);
        } else {
            await calendarSync.create(eventData);
        }

        showAffirmation = true;
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

        try {
            parsedCustomAttributes = JSON.parse(evt.custom_attributes || "{}");
        } catch {
            parsedCustomAttributes = {};
        }

        showAddForm = true;
    }

    function removeEvent(id: string) {
        if (!confirm("Remove this event? You can create it again if needed.")) return;
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
        parsedCustomAttributes = {};
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

{#if isLoading}
    <div class="flex items-center justify-center py-12">
        <Loader2 class="w-8 h-8 animate-spin text-primary" />
    </div>
{:else}
<div class="max-w-4xl mx-auto p-8 animate-in fade-in duration-500">
    <!-- Header -->
    <LivingBlueprintHeader
        title="Afterlife Calendar"
        subtitle="Transform difficult dates into moments of connection"
        tier="legacy"
        detailedDescription="Ensure your birthday, holidays, and anniversaries are celebrated exactly how you want them to be. Create meaningful rituals and messages for the dates that matter most."
        whyMatters="Without your guidance, special dates become painful reminders instead of opportunities for connection. By documenting your wishes, you transform grief into intentional remembrance."
    >
        <div class="flex items-center gap-3">
            <DataViewToggle module="calendar" onchange={(mode) => viewMode = mode} />
            <button
                class="bg-[#304743] text-white px-6 py-2 rounded-xl font-bold hover:bg-[#2a3f3b] transition-colors flex items-center gap-2"
                onclick={() => (showAddForm = true)}
            >
                <Plus size={20} /> Add Significant Date
            </button>
        </div>
    </LivingBlueprintHeader>

    <!-- Affirmation Message -->
    <Affirmation module="general" bind:show={showAffirmation} />

    {#if events.length === 0}
        <EmptyState
            title="Create meaningful moments for the future"
            whyMatters="<strong>Birthdays, anniversaries, and holidays will still arrive after you're gone.</strong> Without your guidance, these dates may become painful reminders instead of opportunities for connection.<br/><br/>By documenting your wishes for these special days, you transform difficult dates into moments of joy. Your family will know exactly how to honor you, celebrate together, and feel your presence even in your absence."
            encouragement="Start with your birthday or a holiday you love. Add others as they come to mind."
            icon={Clock}
            iconClass="text-[#304743]"
            ctaLabel="Add your first significant date"
            onAction={() => (showAddForm = true)}
        />

        <!-- Sample Data GhostRows -->
        <div class="mt-8">
            <p class="text-xs font-bold uppercase text-slate-400 tracking-widest mb-4 text-center">Example entries to inspire you</p>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 opacity-60">
                {#each getSmartSamples($language).calendar || [] as sample}
                    <GhostRow
                        name={sample.title}
                        subtitle={sample.wish}
                        type={sample.type}
                        onClick={() => {
                            newEvent = {
                                ...newEvent,
                                title: sample.title,
                                type: sample.type,
                                isRecurring: sample.isRecurring,
                                wish: sample.wish
                            };
                            showAddForm = true;
                        }}
                    >
                        <svelte:fragment slot="icon">
                            {@const Icon = eventTypeIcons[sample.type] || CalendarIcon}
                            <Icon size={20} class="text-slate-400" />
                        </svelte:fragment>
                    </GhostRow>
                {/each}
            </div>
        </div>
    {:else if viewMode === 'card'}
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            {#each events as evt}
                <div
                    class="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 hover:shadow-md transition-all group relative overflow-hidden"
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
                                    onclick={() => editEvent(evt)}
                                    class="p-2 hover:bg-gray-100 rounded-full text-gray-400 hover:text-blue-500"
                                >
                                    <Pencil size={16} />
                                </button>
                                <button
                                    onclick={() => removeEvent(evt.id)}
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
                class="w-full border-2 border-dashed border-gray-200 rounded-2xl p-6 flex flex-col items-center justify-center text-center text-gray-400 gap-4 min-h-[300px] hover:border-[#304743]/50 hover:bg-gray-50/50 transition-all cursor-pointer"
                onclick={() => (showAddForm = true)}
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
    {:else}
        <!-- Table View -->
        <div class="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <table class="w-full">
                <thead class="bg-slate-50 border-b border-slate-200">
                    <tr>
                        <th class="text-left px-4 py-3 text-xs font-bold uppercase text-slate-500">Event</th>
                        <th class="text-left px-4 py-3 text-xs font-bold uppercase text-slate-500">Date</th>
                        <th class="text-left px-4 py-3 text-xs font-bold uppercase text-slate-500">Type</th>
                        <th class="text-left px-4 py-3 text-xs font-bold uppercase text-slate-500">Recurring</th>
                        <th class="text-left px-4 py-3 text-xs font-bold uppercase text-slate-500">Wish</th>
                        <th class="text-right px-4 py-3 text-xs font-bold uppercase text-slate-500">Actions</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-slate-100">
                    {#each events as evt}
                        <tr class="hover:bg-slate-50 transition-colors group">
                            <td class="px-4 py-3">
                                <div class="flex items-center gap-2">
                                    <div class={`p-1.5 rounded-lg ${eventTypeColors[evt.type]}`}>
                                        <svelte:component this={eventTypeIcons[evt.type]} size={14} />
                                    </div>
                                    <span class="font-medium text-slate-800">{evt.title}</span>
                                </div>
                            </td>
                            <td class="px-4 py-3 text-slate-600">{formatDisplayDate(evt.date, evt.isRecurring)}</td>
                            <td class="px-4 py-3">
                                <span class="px-2 py-1 bg-slate-100 text-slate-600 rounded text-xs font-medium capitalize">
                                    {evt.type}
                                </span>
                            </td>
                            <td class="px-4 py-3 text-slate-500 text-sm">{evt.isRecurring ? 'Yes' : 'No'}</td>
                            <td class="px-4 py-3 text-slate-500 text-sm max-w-[200px] truncate">{evt.wish || '-'}</td>
                            <td class="px-4 py-3 text-right">
                                <div class="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onclick={() => editEvent(evt)}
                                        class="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-blue-500"
                                    >
                                        <Pencil size={14} />
                                    </button>
                                    <button
                                        onclick={() => removeEvent(evt.id)}
                                        class="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-red-500"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </td>
                        </tr>
                    {/each}
                </tbody>
            </table>
        </div>
    {/if}

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
            class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
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
                        onclick={resetForm}
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

                    <!-- Custom Fields -->
                    <div class="pt-4 mt-4 border-t border-gray-100">
                        <CustomFieldsManager
                            entityType="calendar"
                            bind:data={parsedCustomAttributes}
                        />
                    </div>
                </div>

                <div
                    class="p-6 bg-gray-50 flex justify-end gap-3 sticky bottom-0 border-t border-gray-100"
                >
                    <button
                        onclick={resetForm}
                        class="px-6 py-2 rounded-xl font-bold text-gray-500 hover:bg-gray-200 transition-colors"
                        >Not right now</button
                    >
                    <button
                        onclick={handleSave}
                        disabled={!newEvent.title || !formDate}
                        class="px-6 py-2 rounded-xl font-bold bg-[#304743] text-white hover:bg-[#20302d] transition-colors disabled:opacity-50"
                        >Save Event</button
                    >
                </div>
            </div>
        </div>
    {/if}
</div>
{/if}
