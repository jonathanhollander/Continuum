<script lang="ts">
    import { askConfirm } from "$lib/components/ui/ConfirmModal.svelte";
    import { readCustom } from "$lib/utils/customFields";
    import { fade, slide } from "svelte/transition";
    import { focusTrap } from "$lib/actions/focusTrap";
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
        Flower2,
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
    import LivingBlueprintHeader from "$lib/components/LivingBlueprintHeader.svelte";

    let viewMode = $derived<ViewMode>(userPreferencesStore.getViewMode('calendar'));

    // --- Types ---
    type CalendarEvent = {
        id: string;
        title: string;
        date: string; // MMDD for recurring (e.g. "1225"), YYYYMMDD for one-time
        type: EventType;
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

    import { calendarSync as calendarStoreSync, EVENT_TYPES, type EventType } from "$lib/stores/calendarStore.svelte";
    import type { SyncManager } from "$lib/services/sync.svelte";

    // Stored dates are "MMDD" / "YYYYMMDD" (older rows may be "MM-DD" / "YYYY-MM-DD").
    function normDate(d: string, recurring: boolean) {
        const digits = (d || "").replace(/-/g, "");
        return recurring ? digits.slice(-4) : digits;
    }

    // One owner for 'calendar_events': the store (shared with the anniversary manager). Its mapper
    // maps isRecurring / wish / emailTemplate to the server's recurring / description / ritual_instructions.
    const calendarSync = calendarStoreSync as unknown as SyncManager<CalendarEvent>;
    let events = $derived(calendarSync.items);
    let isLoading = $state(true);

    onMount(async () => {
        await calendarSync.init();
        isLoading = false;
    });

    // onMount removed
    // saveEvents removed

    // One save at a time: while it is open the button waits, so a second click sends nothing.
    let saving = $state(false);
    async function handleSave() {
        if (saving) return;
        saving = true;
        try {
            await handleSaveOnce();
        } finally {
            saving = false;
        }
    }

    async function handleSaveOnce() {
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

        // The store affirms a successful save and shows the gentle error on failure (form stays open).
        try {
            if (editingId) {
                await calendarSync.update(editingId, eventData);
            } else {
                await calendarSync.create(eventData, false, false, handleSave);
            }
        } catch {
            return;
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
            const nd = normDate(evt.date, true);
            const m = nd.substring(0, 2);
            const d = nd.substring(2, 4);
            formDate = `${currentYear}-${m}-${d}`;
        } else {
            // YYYYMMDD
            const nd = normDate(evt.date, false);
            const y = nd.substring(0, 4);
            const m = nd.substring(4, 6);
            const d = nd.substring(6, 8);
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

        parsedCustomAttributes = readCustom(evt);

        showAddForm = true;
    }

    async function removeEvent(id: string) {
        if (!(await askConfirm("Remove this event? You can create it again if needed."))) return;
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

        dateStr = normDate(dateStr, isRecurring);
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

    const eventTypeIcons: Record<string, typeof Gift> = {
        birthday: Gift,
        holiday: Sparkles,
        anniversary: Heart,
        passing: Flower2,
        ritual: Heart,
        other: CalendarIcon,
    };
    const typeLabel = (type: string) => EVENT_TYPES.find((t) => t.value === type)?.label ?? type;

    const eventTypeColors: Record<string, string> = {
        // Same type colours as Important Dates (anniversary manager)
        birthday: "text-warning bg-warning-soft",
        holiday: "text-info bg-info/10",
        anniversary: "text-primary-hover bg-primary-soft",
        ritual: "text-success bg-success/10",
        passing: "text-foreground bg-muted",
        other: "text-muted-foreground bg-muted",
    };
</script>

{#if isLoading}
    <div class="flex items-center justify-center py-12">
        <Loader2 class="w-8 h-8 animate-spin text-primary" />
    </div>
{:else}
    <!-- Header sits outside the content wrapper so its title lines up with sibling module pages -->
    <LivingBlueprintHeader
        title="Event Calendar"
        subtitle="Afterlife Calendar"
        detailedDescription="You can shape how your birthday, holidays and anniversaries are celebrated. Create meaningful rituals and messages for the dates that matter most."
        whyMatters="With your guidance, special dates become moments of connection. By documenting your wishes, you transform grief into intentional remembrance."
    >
        <div class="flex items-center gap-3">
            <DataViewToggle module="calendar" />
            <button
                class="bg-primary text-primary-foreground px-6 py-2 rounded-xl font-bold hover:bg-primary-hover transition-colors flex items-center gap-2"
                onclick={() => (showAddForm = true)}
            >
                <Plus size={20} /> Add Significant Date
            </button>
        </div>
    </LivingBlueprintHeader>

<div class="p-8 max-w-[1400px] mx-auto animate-in fade-in duration-500">
    <p class="text-sm text-muted-foreground mb-6">
        These dates also appear in
        <a href="/modules/anniversary-manager" class="font-bold text-primary-hover hover:underline">Important Dates</a>,
        where you can write ritual guidance for your family.
    </p>

    {#if events.length === 0}
        <EmptyState
            title="Create meaningful moments for the future"
            whyMatters="<strong>Birthdays, anniversaries and holidays will keep arriving, and your family can feel your presence on them.</strong> With your guidance, special dates become moments of connection.<br/><br/>By documenting your wishes for these special days, you transform difficult dates into moments of joy. Your family will know exactly how to honor you, celebrate together, and feel your presence even in your absence."
            encouragement="Start with your birthday or a holiday you love. Add others as they come to mind."
            icon={Clock}
            iconClass="text-primary"
            ctaLabel="Add your first significant date"
            onAction={() => (showAddForm = true)}
        />

        <!-- Sample Data GhostRows -->
        <div class="mt-8">
            <p class="text-xs font-bold uppercase text-muted-foreground tracking-widest mb-4 text-center">Example entries to inspire you</p>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                        {#snippet icon()}
                            {@const Icon = eventTypeIcons[sample.type] || CalendarIcon}
                            <Icon size={20} class="text-muted-foreground" />
                        {/snippet}
                    </GhostRow>
                {/each}
            </div>
        </div>
    {:else if viewMode === 'card'}
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            {#each events as evt}
                {@const Icon = eventTypeIcons[evt.type] ?? CalendarIcon}
                <div
                    class="bg-card rounded-2xl border border-border shadow-sm p-6 hover:shadow-md transition-all group relative overflow-hidden"
                >
                    <!-- Type Badge -->
                    <div class="absolute top-14 right-0 p-4 opacity-10 pointer-events-none" aria-hidden="true">
                        <Icon
                            size={120}
                        />
                    </div>

                    <div class="relative z-10">
                        <div class="flex justify-between items-start mb-4">
                            <div
                                class={`p-3 rounded-2xl ${eventTypeColors[evt.type] ?? eventTypeColors.other} inline-flex`}
                            >
                                <Icon
                                    size={24}
                                />
                            </div>
                            <div
                                class="flex gap-1 transition-opacity"
                            >
                                <button
                                    onclick={() => editEvent(evt)}
                                    aria-label="Edit these details"
                                    class="p-2 hover:bg-muted rounded-full text-muted-foreground hover:text-primary-hover"
                                >
                                    <Pencil size={16} />
                                </button>
                                <button
                                    onclick={() => removeEvent(evt.id)}
                                    aria-label="Remove this item"
                                    class="p-2 hover:bg-muted rounded-full text-muted-foreground hover:text-danger"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>

                        <div class="mb-6">
                            <span
                                class="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1 block"
                            >
                                {evt.isRecurring ? "Every Year" : "One Time Event"}
                            </span>
                            <h3
                                class="font-serif font-bold text-2xl text-foreground leading-tight mb-1"
                            >
                                {evt.title}
                            </h3>
                            <div
                                class="text-primary-hover font-medium flex items-center gap-2"
                            >
                                <CalendarIcon size={14} />
                                {formatDisplayDate(evt.date, evt.isRecurring)}
                            </div>
                        </div>

                        {#if evt.wish}
                            <div
                                class="bg-muted p-4 rounded-xl mb-4 border border-border"
                            >
                                <div class="flex items-start gap-2">
                                    <Sparkles
                                        class="text-gold-text shrink-0 mt-0.5"
                                        size={16}
                                    />
                                    <p class="text-muted-foreground text-sm italic">
                                        "{evt.wish}"
                                    </p>
                                </div>
                            </div>
                        {/if}

                        {#if evt.emailTemplate}
                            <a
                                href={getMailtoLink(evt)}
                                target="_blank"
                                class="w-full flex items-center justify-center gap-2 py-3 border border-border rounded-xl text-muted-foreground font-bold text-sm hover:border-primary hover:text-primary-hover transition-colors bg-card"
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
                class="w-full border-2 border-dashed border-border rounded-2xl p-6 flex flex-col items-center justify-center text-center text-muted-foreground gap-4 min-h-[300px] hover:border-primary/50 hover:bg-muted/50 transition-all cursor-pointer"
                onclick={() => (showAddForm = true)}
            >
                <div class="p-4 bg-muted rounded-full">
                    <Plus size={32} />
                </div>
                <div>
                    <h3 class="font-bold text-muted-foreground mb-1">Add Another Date</h3>
                    <p class="text-sm">
                        Birthdays, anniversaries, or an ordinary Tuesday.
                    </p>
                </div>
            </button>
        </div>
    {:else}
        <!-- Table View -->
        <div class="bg-card rounded-xl border border-border overflow-hidden">
            <table class="w-full">
                <thead class="bg-muted border-b border-border">
                    <tr>
                        <th class="text-left px-4 py-3 text-xs font-bold uppercase text-muted-foreground">Event</th>
                        <th class="text-left px-4 py-3 text-xs font-bold uppercase text-muted-foreground">Date</th>
                        <th class="text-left px-4 py-3 text-xs font-bold uppercase text-muted-foreground">Type</th>
                        <th class="text-left px-4 py-3 text-xs font-bold uppercase text-muted-foreground">Recurring</th>
                        <th class="text-left px-4 py-3 text-xs font-bold uppercase text-muted-foreground">Wish</th>
                        <th class="text-right px-4 py-3 text-xs font-bold uppercase text-muted-foreground">Actions</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-border">
                    {#each events as evt}
                        {@const Icon = eventTypeIcons[evt.type] ?? CalendarIcon}
                        <tr class="hover:bg-muted transition-colors group">
                            <td class="px-4 py-3">
                                <div class="flex items-center gap-2">
                                    <div class={`p-1.5 rounded-lg ${eventTypeColors[evt.type] ?? eventTypeColors.other}`}>
                                        <Icon size={14} />
                                    </div>
                                    <span class="font-medium text-foreground">{evt.title}</span>
                                </div>
                            </td>
                            <td class="px-4 py-3 text-muted-foreground">{formatDisplayDate(evt.date, evt.isRecurring)}</td>
                            <td class="px-4 py-3">
                                <span class="px-2 py-1 bg-muted text-muted-foreground rounded text-xs font-medium capitalize">
                                    {typeLabel(evt.type)}
                                </span>
                            </td>
                            <td class="px-4 py-3 text-muted-foreground text-sm">{evt.isRecurring ? 'Yes' : 'No'}</td>
                            <td class="px-4 py-3 text-muted-foreground text-sm max-w-[200px] truncate">{evt.wish || '-'}</td>
                            <td class="px-4 py-3 text-right">
                                <div class="flex items-center justify-end gap-1 transition-opacity">
                                    <button
                                        onclick={() => editEvent(evt)}
                                        aria-label="Edit these details"
                                        class="p-1 hover:bg-muted rounded text-muted-foreground hover:text-primary-hover"
                                    >
                                        <Pencil size={14} />
                                    </button>
                                    <button
                                        onclick={() => removeEvent(evt.id)}
                                        aria-label="Remove this item"
                                        class="p-1 hover:bg-muted rounded text-muted-foreground hover:text-danger"
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
            context="calendar"
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
            role="dialog"
            aria-modal="true"
            aria-labelledby="calendar-dialog-title"
            use:focusTrap={{ onEscape: resetForm }}
            class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
            transition:fade
        >
            <div
                class="bg-card rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]"
                transition:slide
            >
                <div
                    class="p-6 border-b border-border flex justify-between items-center bg-primary-deep text-white"
                >
                    <h3 id="calendar-dialog-title" class="font-serif font-bold text-2xl text-white!">
                        {editingId ? "Edit Event" : "Add Significant Date"}
                    </h3>
                    <button
                        onclick={resetForm}
                        aria-label="Close"
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
                                class="block text-xs font-bold uppercase text-muted-foreground mb-1"
                                >Event Title</label
                            >
                            <input
                                id="event-title"
                                type="text"
                                bind:value={newEvent.title}
                                placeholder="e.g. My Birthday, Wedding Anniversary"
                                class="w-full px-4 py-2 rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-primary/30"
                            />
                        </div>

                        <div class="grid grid-cols-2 gap-4">
                            <div>
                                <label
                                    for="event-date"
                                    class="block text-xs font-bold uppercase text-muted-foreground mb-1"
                                    >Date</label
                                >
                                <input
                                    id="event-date"
                                    type="date"
                                    bind:value={formDate}
                                    class="w-full px-4 py-2 rounded-xl border border-border"
                                />
                            </div>
                            <div>
                                <label
                                    for="event-type"
                                    class="block text-xs font-bold uppercase text-muted-foreground mb-1"
                                    >Type</label
                                >
                                <select
                                    id="event-type"
                                    bind:value={newEvent.type}
                                    class="w-full px-4 py-2 rounded-xl border border-border bg-card"
                                >
                                    {#each EVENT_TYPES as t}
                                        <option value={t.value}>{t.label}</option>
                                    {/each}
                                </select>
                            </div>
                        </div>

                        <div class="flex items-center gap-2">
                            <input
                                type="checkbox"
                                id="recurring"
                                bind:checked={newEvent.isRecurring}
                                class="rounded border-muted-foreground accent-primary focus:ring-primary"
                            />
                            <label
                                for="recurring"
                                class="text-sm font-medium text-foreground"
                                >Recur every year (e.g. Birthday)</label
                            >
                        </div>
                    </div>

                    <!-- The Wish -->
                    <div
                        class="bg-warning-soft p-4 rounded-xl border border-warning/20"
                    >
                        <label
                            for="event-wish"
                            class="block text-xs font-bold uppercase text-warning mb-2 flex items-center gap-2"
                        >
                            <Sparkles size={14} /> My Wish for this Day
                        </label>
                        <textarea
                            id="event-wish"
                            bind:value={newEvent.wish}
                            rows="2"
                            placeholder="e.g. Go to our favorite diner and order the pancakes."
                            class="w-full px-4 py-2 rounded-xl border border-warning/30 bg-card focus:outline-none focus:ring-2 focus:ring-warning/30"
                        ></textarea>
                        <p class="text-xs text-warning mt-2">
                            A small instruction creates connection.
                        </p>
                    </div>

                    <!-- Future Email -->
                    <div class="border-t border-border pt-4">
                        <div class="flex items-center gap-2 mb-4">
                            <Mail class="text-primary" size={18} />
                            <h4 id="event-message-heading" class="font-bold text-foreground">
                                Future Message
                            </h4>
                        </div>
                        <p class="text-sm text-muted-foreground mb-4">
                            Draft a message for this day. Your executor can open
                            this in their email, ready for them to send for you.
                        </p>

                        <div class="space-y-3">
                            <div>
                                <label
                                    for="event-recipient"
                                    class="block text-xs font-bold uppercase text-muted-foreground mb-1"
                                    >Recipient (Email)</label
                                >
                                <input
                                    id="event-recipient"
                                    type="text"
                                    bind:value={formRecipient}
                                    class="w-full px-4 py-2 rounded-xl border border-border text-sm"
                                />
                            </div>
                            <div>
                                <label
                                    for="event-subject"
                                    class="block text-xs font-bold uppercase text-muted-foreground mb-1"
                                    >Subject Line</label
                                >
                                <input
                                    id="event-subject"
                                    type="text"
                                    bind:value={formSubject}
                                    class="w-full px-4 py-2 rounded-xl border border-border text-sm"
                                />
                            </div>
                            <textarea
                                aria-labelledby="event-message-heading"
                                bind:value={formBody}
                                rows="4"
                                placeholder="Dear..."
                                class="w-full px-4 py-2 rounded-xl border border-border text-sm"
                            ></textarea>
                        </div>
                    </div>

                    <!-- Custom Fields -->
                    <div class="pt-4 mt-4 border-t border-border">
                        <CustomFieldsManager
                            entityType="calendar"
                            bind:data={parsedCustomAttributes}
                        />
                    </div>
                </div>

                <div
                    class="p-6 bg-muted flex justify-end gap-3 sticky bottom-0 border-t border-border"
                >
                    <button
                        onclick={resetForm}
                        class="px-6 py-2 rounded-xl font-bold text-muted-foreground hover:bg-muted transition-colors"
                        >Maybe later</button
                    >
                    <button
                        onclick={handleSave}
                        disabled={!newEvent.title || !formDate || saving}
                        aria-busy={saving}
                        class="px-6 py-2 rounded-xl font-bold bg-primary text-primary-foreground hover:bg-primary-hover transition-colors disabled:opacity-50"
                        >{saving ? "Saving..." : "Save Event"}</button
                    >
                </div>
            </div>
        </div>
    {/if}
</div>
{/if}
