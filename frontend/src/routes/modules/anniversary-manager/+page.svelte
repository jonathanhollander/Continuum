<script lang="ts">
    import { askConfirm } from "$lib/components/ui/ConfirmModal.svelte";
    import {
        calendarStore,
        upcomingEvents,
        EVENT_TYPES,
        type AnniversaryEvent,
    } from "$lib/stores/calendarStore.svelte";
    import { readCustom } from "$lib/utils/customFields";
    import {
        Calendar,
        Heart,
        Plus,
        Trash2,
        Sparkles,
        Flame,
        Music,
        Wind,
        Info,
        Pencil,
        Tag,
        Clock,
        Loader2,
    } from "lucide-svelte";
    import AIPromptBar from "$lib/components/concierge/AIPromptBar.svelte";
    import { onMount } from "svelte";
    import { fade, slide, scale } from "svelte/transition";
    import { quintOut } from "svelte/easing";
    import DataViewToggle from "$lib/components/ui/DataViewToggle.svelte";
    import { userPreferencesStore, type ViewMode } from "$lib/stores/userPreferencesStore.svelte";
    import GhostRow from "$lib/components/ui/GhostRow.svelte";
    import EmptyState from "$lib/components/EmptyState.svelte";
    import { t, language } from "$lib/stores/localization";
    import { getSmartSamples } from "$lib/data/smartSamples";
    import CustomFieldsManager from "$lib/components/ui/CustomFieldsManager.svelte";
    import LivingBlueprintHeader from "$lib/components/LivingBlueprintHeader.svelte";
    import { focusTrap } from "$lib/actions/focusTrap";

    let viewMode = $state<ViewMode>('card');
    let customAttributes = $state<Record<string, any>>({});
    let isLoading = $state(true);

    onMount(async () => {
        await calendarStore.sync?.();
        isLoading = false;
    });

    let showAddModal = $state(false);
    let editingId = $state<string | number | null>(null);
    let newEvent = $state<Partial<AnniversaryEvent>>({
        title: "",
        date: "",
        type: "birthday",
        description: "",
        ritualInstructions: "",
        recurring: true,
        tags: [],
    });

    const typeIcons: Record<string, typeof Sparkles> = {
        birthday: Sparkles,
        anniversary: Heart,
        passing: Wind,
        ritual: Flame,
        holiday: Music,
        other: Calendar,
    };

    const typeColors: Record<string, string> = {
        birthday: "bg-amber-100 text-amber-700 border-amber-200",
        anniversary: "bg-rose-100 text-rose-700 border-rose-200",
        passing: "bg-indigo-100 text-indigo-700 border-indigo-200",
        ritual: "bg-emerald-100 text-emerald-700 border-emerald-200",
    };
    // Types added on the calendar page (holiday, other) share one neutral badge until the colour pass.
    const typeClass = (type: string) => typeColors[type] ?? "bg-slate-100 text-slate-700 border-slate-200";
    const typeLabel = (type: string) => EVENT_TYPES.find((t) => t.value === type)?.label ?? type;

    // The date is chosen as a month and a day. Stored as "MM-DD"; a one-time date from the calendar
    // page ("YYYYMMDD") keeps its year as "YYYY-MM-DD".
    const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const DAYS_IN_MONTH = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    let formMonth = $state("");
    let formDay = $state("");
    let formYear = $state("");
    let dayCount = $derived(formMonth ? DAYS_IN_MONTH[Number(formMonth) - 1] : 31);
    $effect(() => {
        if (formDay && Number(formDay) > dayCount) formDay = String(dayCount).padStart(2, "0");
    });

    function setFormDate(dateStr: string | undefined) {
        const digits = (dateStr || "").replace(/-/g, "");
        if (digits.length < 4) {
            formMonth = formDay = formYear = "";
            return;
        }
        formMonth = digits.slice(-4, -2);
        formDay = digits.slice(-2);
        formYear = digits.length >= 8 ? digits.slice(0, 4) : "";
    }

    function formDateValue() {
        if (!formMonth || !formDay) return "";
        return formYear ? `${formYear}-${formMonth}-${formDay}` : `${formMonth}-${formDay}`;
    }

    function openEdit(id: string | number) {
        const ev = calendarStore.items.find((i) => String(i.id) === String(id));
        if (!ev) return;
        editingId = ev.id;
        setFormDate(ev.date);
        newEvent = {
            title: ev.title,
            date: ev.date,
            type: ev.type,
            description: ev.description ?? "",
            ritualInstructions: ev.emailTemplate ? "" : (ev.ritualInstructions ?? ""),
            recurring: ev.recurring,
            tags: ev.tags ?? [],
        };
        // Server rows arrive as customAttributes, form-saved ones as custom_attributes.
        customAttributes = readCustom(ev);
        showAddModal = true;
    }

    function closeModal() {
        showAddModal = false;
        if (editingId !== null) {
            editingId = null;
            customAttributes = {};
            setFormDate("");
            newEvent = {
                title: "",
                date: "",
                type: "birthday",
                description: "",
                ritualInstructions: "",
                recurring: true,
                tags: [],
            };
        }
    }

    async function removeEvent(id: string | number) {
        if (!(await askConfirm("Remove this remembrance?"))) return;
        calendarStore.removeEvent(id);
    }

    // One save at a time; the form closes only once the save has gone through (the store shows
    // the gentle error and the form stays open with what was typed).
    let saving = $state(false);
    async function handleAdd() {
        const date = formDateValue();
        if (!newEvent.title || !date || saving) return;
        saving = true;
        try {
            await saveEvent(date);
        } catch {
            return;
        } finally {
            saving = false;
        }
        editingId = null;
        customAttributes = {};
        setFormDate("");
        newEvent = {
            title: "",
            date: "",
            type: "birthday",
            description: "",
            ritualInstructions: "",
            recurring: true,
            tags: [],
        };
        showAddModal = false;
    }

    async function saveEvent(date: string) {
        if (editingId !== null) {
            const ev = calendarStore.items.find((i) => String(i.id) === String(editingId));
            const updates: Partial<AnniversaryEvent> = {
                title: newEvent.title,
                date,
                type: newEvent.type,
                description: newEvent.description,
                custom_attributes: JSON.stringify(customAttributes),
            };
            // Events made on the calendar page keep their email template in ritual instructions.
            if (!ev?.emailTemplate) updates.ritualInstructions = newEvent.ritualInstructions;
            await calendarStore.updateEvent(editingId, updates);
        } else {
            await calendarStore.addEvent({
                ...newEvent,
                date,
                custom_attributes: JSON.stringify(customAttributes),
            } as Omit<AnniversaryEvent, "id">);
        }
    }
</script>

{#if isLoading}
    <div class="flex items-center justify-center py-12">
        <Loader2 class="w-8 h-8 animate-spin text-primary" />
    </div>
{:else}
<!-- Header -->
    <LivingBlueprintHeader
        title="Important Dates"
        subtitle="Transforming sensitive dates into intentional moments of connection"
        detailedDescription="Create meaningful rituals for birthdays, anniversaries, and remembrance days. Guide your family on how to observe these dates with intention, healing, and legacy."
        whyMatters="With your guidance, your family has gentle rituals for the dates that carry emotion. Creating rituals transforms grief into intentional remembrance."
    >
        <button
            onclick={() => (showAddModal = true)}
            class="px-8 py-3.5 bg-primary text-primary-foreground rounded-full font-bold shadow-xl hover:opacity-90 transition-all flex items-center gap-2"
        >
            <Plus size={20} />
            Add New Remembrance
        </button>
    </LivingBlueprintHeader>

<div class="max-w-7xl mx-auto p-8 space-y-10 animate-in fade-in duration-500">
    <p class="text-sm text-slate-500">
        These dates also appear in your
        <a href="/modules/calendar" class="font-bold text-indigo-700 hover:underline">Event Calendar</a>,
        where you can add a wish and a future message for each day.
    </p>

    <!-- AI Concierge Drafting Assistant -->
    <AIPromptBar
        context="calendar"
        prompts={[
            "Suggest a meaningful ritual for this anniversary...",
            "Help me write about the significance of this date...",
            "Draft instructions for commemorating this day...",
            "Create a remembrance message for my family..."
        ]}
    />

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <!-- Upcoming Timeline -->
        <div class="lg:col-span-2 space-y-8">
            <div class="flex items-center justify-between">
                <h2 class="font-serif text-2xl font-bold text-slate-900">
                    Upcoming Moments
                </h2>
                <div class="flex items-center gap-3">
                    <DataViewToggle module="anniversary-manager" onchange={(mode) => viewMode = mode} />
                    <div
                        class="px-3 py-1 bg-slate-100 rounded-full text-xs font-bold text-slate-500 uppercase tracking-wider"
                    >
                        The year ahead
                    </div>
                </div>
            </div>

            {#if $upcomingEvents.length === 0}
                <EmptyState
                    title="Honor the moments that matter"
                    whyMatters="<strong>Birthdays, anniversaries, and remembrance days carry deep emotional weight.</strong> With your guidance, your family has gentle rituals for the dates that carry emotion.<br/><br/>Creating rituals for these moments transforms grief into intentional remembrance. Your family will have a ritual to follow, making hard days feel purposeful."
                    encouragement="Start with one meaningful date. Add a simple ritual that feels true to your spirit."
                    icon={Heart}
                    iconClass="text-rose-500"
                    ctaLabel="Add your first remembrance"
                    onAction={() => (showAddModal = true)}
                />

                <!-- Sample Data GhostRows -->
                <div class="mt-8">
                    <p class="text-xs font-bold uppercase text-slate-400 tracking-widest mb-4 text-center">Example entries to inspire you</p>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 opacity-60">
                        {#each getSmartSamples($language).anniversary || [] as sample}
                            <GhostRow
                                name={sample.title}
                                subtitle={sample.ritualInstructions}
                                type={sample.type}
                                onClick={() => {
                                    setFormDate(sample.date);
                                    newEvent = {
                                        ...newEvent,
                                        title: sample.title,
                                        date: sample.date,
                                        type: sample.type,
                                        description: sample.description,
                                        ritualInstructions: sample.ritualInstructions
                                    };
                                    showAddModal = true;
                                }}
                            >
                                {#snippet icon()}
                                    {@const Icon = typeIcons[sample.type] || Heart}
                                    <Icon size={20} class="text-slate-400" />
                                {/snippet}
                            </GhostRow>
                        {/each}
                    </div>
                </div>
            {:else if viewMode === 'card'}
                <div class="space-y-6">
                    {#each $upcomingEvents as event (event.id)}
                        <div
                            class="group relative bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-xl hover:border-indigo-200 transition-all duration-500 overflow-hidden"
                            transition:slide
                        >
                            <div class="flex items-start gap-6">
                                <div
                                    class="flex flex-col items-center shrink-0 w-16 h-16 rounded-2xl bg-slate-50 border border-slate-100 overflow-hidden group-hover:bg-indigo-50 transition-colors"
                                >
                                    <span
                                        class="bg-indigo-600 w-full text-center text-[10px] font-black text-white py-1"
                                    >
                                        {event.nextDate
                                            .toLocaleDateString("en-US", {
                                                month: "short",
                                            })
                                            .toUpperCase()}
                                    </span>
                                    <span
                                        class="text-2xl font-serif font-black text-slate-900 mt-1"
                                    >
                                        {event.nextDate.getDate()}
                                    </span>
                                </div>

                                <div class="flex-1 min-w-0 space-y-3">
                                    <div class="flex items-center justify-between gap-2">
                                        <div class="flex flex-wrap items-center gap-x-3 gap-y-1 min-w-0">
                                            <h3
                                                class="font-bold text-xl text-slate-900 uppercase tracking-tight break-words min-w-0"
                                            >
                                                {event.title}
                                            </h3>
                                            <span
                                                class="text-xs font-bold px-3 py-0.5 rounded-full border {typeClass(event.type)}"
                                            >
                                                {typeLabel(event.type)}
                                            </span>
                                        </div>
                                        <div class="flex items-center gap-1 shrink-0">
                                            <button
                                                onclick={() => openEdit(event.id)}
                                                aria-label="Edit this item"
                                                class="p-2 text-slate-400 hover:text-slate-700 transition-all"
                                            >
                                                <Pencil size={18} />
                                            </button>
                                            <button
                                                onclick={() => removeEvent(event.id)}
                                                aria-label="Remove this item"
                                                class="p-2 text-slate-300 hover:text-rose-500 transition-all"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </div>
                                    <p
                                        class="text-slate-500 leading-relaxed font-medium"
                                    >
                                        {event.description}
                                    </p>

                                    {#if event.ritualInstructions}
                                        <div
                                            class="mt-4 p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100/50 flex gap-4"
                                        >
                                            <div
                                                class="shrink-0 p-2 bg-emerald-100 rounded-lg text-emerald-600 h-fit mt-1"
                                            >
                                                <Sparkles size={16} />
                                            </div>
                                            <div class="space-y-1">
                                                <span
                                                    class="text-[10px] font-black uppercase text-emerald-600 tracking-widest"
                                                    >Recommended Ritual</span
                                                >
                                                <p
                                                    class="text-sm text-slate-600 italic leading-relaxed"
                                                >
                                                    "{event.ritualInstructions}"
                                                </p>
                                            </div>
                                        </div>
                                    {/if}

                                    <div class="flex items-center gap-4 pt-2">
                                        {#each event.tags as tag}
                                            <div
                                                class="flex items-center gap-1.5 text-[10px] font-black text-slate-400 uppercase tracking-widest"
                                            >
                                                <Tag size={12} />
                                                {tag}
                                            </div>
                                        {/each}
                                    </div>
                                </div>
                            </div>
                        </div>
                    {/each}
                </div>
            {:else}
                <!-- Table View -->
                <div class="bg-white rounded-xl border border-slate-200 overflow-hidden">
                    <table class="w-full">
                        <thead class="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th class="text-left px-4 py-3 text-xs font-bold uppercase text-slate-500">Date</th>
                                <th class="text-left px-4 py-3 text-xs font-bold uppercase text-slate-500">Title</th>
                                <th class="text-left px-4 py-3 text-xs font-bold uppercase text-slate-500">Type</th>
                                <th class="text-left px-4 py-3 text-xs font-bold uppercase text-slate-500">Description</th>
                                <th class="text-left px-4 py-3 text-xs font-bold uppercase text-slate-500">Ritual</th>
                                <th class="text-right px-4 py-3 text-xs font-bold uppercase text-slate-500">Actions</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-slate-100">
                            {#each $upcomingEvents as event (event.id)}
                                <tr class="hover:bg-slate-50 transition-colors group">
                                    <td class="px-4 py-3 font-mono text-sm text-slate-600">
                                        {event.nextDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                                    </td>
                                    <td class="px-4 py-3 font-medium text-slate-800">{event.title}</td>
                                    <td class="px-4 py-3">
                                        <span class="text-xs font-bold px-2 py-1 rounded-full border {typeClass(event.type)}">
                                            {typeLabel(event.type)}
                                        </span>
                                    </td>
                                    <td class="px-4 py-3 text-slate-500 text-sm max-w-[200px] truncate">{event.description || '-'}</td>
                                    <td class="px-4 py-3 text-slate-500 text-sm max-w-[150px] truncate">{event.ritualInstructions || '-'}</td>
                                    <td class="px-4 py-3 text-right">
                                        <button
                                            onclick={() => openEdit(event.id)}
                                            aria-label="Edit this item"
                                            class="p-1 text-slate-400 hover:text-slate-700 transition-all"
                                        >
                                            <Pencil size={16} />
                                        </button>
                                        <button
                                            onclick={() => removeEvent(event.id)}
                                            aria-label="Remove this item"
                                            class="p-1 text-slate-300 hover:text-rose-500 transition-all"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </td>
                                </tr>
                            {/each}
                        </tbody>
                    </table>
                </div>
            {/if}
        </div>

        <!-- Sidebar / Tools -->
        <div class="space-y-8">
            <!-- Grief Insights -->
            <div
                class="bg-indigo-50/50 rounded-[2rem] border border-indigo-100 p-8 space-y-6"
            >
                <div class="flex items-center gap-3 text-indigo-900">
                    <Info size={24} />
                    <h3 class="font-bold text-lg">Grief-Aware Design</h3>
                </div>
                <div class="space-y-4">
                    <div class="flex gap-4">
                        <div
                            class="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-2 shrink-0"
                        ></div>
                        <p class="text-sm text-indigo-800/80 leading-relaxed">
                            <strong>Gentle Pacing:</strong> Reminders arrive only
                            when they matter.
                        </p>
                    </div>
                    <div class="flex gap-4">
                        <div
                            class="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-2 shrink-0"
                        ></div>
                        <p class="text-sm text-indigo-800/80 leading-relaxed">
                            <strong>Ritual focus:</strong> Each date is an
                            opportunity for remembrance.
                        </p>
                    </div>
                </div>
                <div class="pt-4 border-t border-indigo-100 mt-4">
                    <p class="text-xs text-indigo-800/60 text-center">
                        Your Emotional Registry
                    </p>
                </div>
            </div>

            <!-- Ritual Library Preview -->
            <div
                class="bg-white rounded-[2rem] border border-slate-200 p-8 space-y-6 shadow-sm"
            >
                <div class="flex items-center gap-3 text-slate-900">
                    <Flame size={24} class="text-slate-400" />
                    <h3 class="font-bold text-lg">Ritual Library</h3>
                </div>
                <ul class="space-y-4">
                    {#each ["Sound & Silence", "Elemental Release", "Physical Memorial"] as ritual}
                        <li
                            class="p-4 rounded-xl border border-slate-100 font-medium text-slate-700"
                        >
                            {ritual}
                        </li>
                    {/each}
                </ul>
            </div>
        </div>
    </div>

    <!-- Simple Add Modal -->
    {#if showAddModal}
        <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="remembrance-dialog-title"
            use:focusTrap={{ onEscape: closeModal }}
            class="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm"
            transition:fade
        >
            <div
                class="bg-white w-full max-w-lg rounded-[2.5rem] p-8 shadow-2xl space-y-6"
                transition:scale={{ start: 0.95, easing: quintOut }}
            >
                <div class="flex items-center justify-between">
                    <h2 id="remembrance-dialog-title" class="font-serif text-2xl font-bold text-slate-900">
                        {editingId !== null ? "Edit Remembrance" : "Add Remembrance"}
                    </h2>
                    <button
                        onclick={closeModal}
                        aria-label="Close"
                        class="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400"
                    >
                        <Plus class="rotate-45" />
                    </button>
                </div>

                <div class="space-y-4">
                    <div class="space-y-1">
                        <label
                            for="remembrance-title"
                            class="text-xs font-black uppercase text-slate-400 tracking-widest pl-1"
                            >Title</label
                        >
                        <input
                            id="remembrance-title"
                            bind:value={newEvent.title}
                            placeholder="e.g., Mom's Birthday"
                            class="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                        />
                    </div>

                    <div class="grid grid-cols-3 gap-4">
                        <div class="col-span-2 space-y-1">
                            <span
                                id="remembrance-date-label"
                                class="text-xs font-black uppercase text-slate-400 tracking-widest pl-1"
                                >Date</span
                            >
                            <div class="grid grid-cols-2 gap-4" role="group" aria-labelledby="remembrance-date-label">
                                <select
                                    id="remembrance-month"
                                    aria-label="Month"
                                    bind:value={formMonth}
                                    class="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all appearance-none"
                                >
                                    <option value="" disabled>Month</option>
                                    {#each MONTHS as name, i}
                                        <option value={String(i + 1).padStart(2, "0")}>{name}</option>
                                    {/each}
                                </select>
                                <select
                                    id="remembrance-day"
                                    aria-label="Day"
                                    bind:value={formDay}
                                    class="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all appearance-none"
                                >
                                    <option value="" disabled>Day</option>
                                    {#each Array.from({ length: dayCount }, (_, i) => String(i + 1).padStart(2, "0")) as d}
                                        <option value={d}>{Number(d)}</option>
                                    {/each}
                                </select>
                            </div>
                        </div>

                        <div class="space-y-1">
                            <label
                                for="remembrance-type"
                                class="text-xs font-black uppercase text-slate-400 tracking-widest pl-1"
                                >Type</label
                            >
                            <select
                                id="remembrance-type"
                                bind:value={newEvent.type}
                                class="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all appearance-none"
                            >
                                {#each EVENT_TYPES as t}
                                    <option value={t.value}>{t.label}</option>
                                {/each}
                            </select>
                        </div>
                    </div>

                    <div class="space-y-1">
                        <label
                            for="remembrance-description"
                            class="text-xs font-black uppercase text-slate-400 tracking-widest pl-1"
                            >Description</label
                        >
                        <textarea
                            id="remembrance-description"
                            bind:value={newEvent.description}
                            placeholder="Share a short summary of this day..."
                            class="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all resize-none h-24"
                        ></textarea>
                    </div>

                    <div class="space-y-1">
                        <label
                            for="remembrance-instructions"
                            class="text-xs font-black uppercase text-slate-400 tracking-widest pl-1"
                            >Ritual guidance, if you wish</label
                        >
                        <textarea
                            id="remembrance-instructions"
                            bind:value={newEvent.ritualInstructions}
                            placeholder="Step-by-step guidance for remembrance..."
                            class="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all resize-none h-24 text-sm italic"
                        ></textarea>
                    </div>

                    <!-- Custom Fields -->
                    <div class="pt-2 border-t border-slate-100">
                        <CustomFieldsManager
                            entityType="calendar"
                            bind:data={customAttributes}
                        />
                    </div>
                </div>

                <div class="flex gap-4 pt-4">
                    <button
                        onclick={closeModal}
                        class="flex-1 px-6 py-3.5 border border-slate-200 rounded-2xl font-bold text-slate-600 hover:bg-slate-50 transition-all font-sans whitespace-nowrap"
                    >
                        Maybe later
                    </button>
                    <button
                        onclick={handleAdd}
                        disabled={!newEvent.title || !formMonth || !formDay || saving}
                        aria-busy={saving}
                        class="flex-2 px-10 py-3.5 bg-primary text-primary-foreground rounded-2xl font-bold shadow-lg hover:opacity-90 transition-all font-sans disabled:opacity-50"
                    >
                        {saving ? "Saving..." : "Save Memory"}
                    </button>
                </div>
            </div>
        </div>
    {/if}
</div>
{/if}
