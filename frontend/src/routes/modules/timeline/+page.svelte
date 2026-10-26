<script lang="ts">
    import { askConfirm } from "$lib/components/ui/ConfirmModal.svelte";
    import { focusTrap } from "$lib/actions/focusTrap";
    import { readCustom } from "$lib/utils/customFields";
    import { fade, fly, slide, scale } from "svelte/transition";
    import {
        Baby,
        GraduationCap,
        Heart,
        Briefcase,
        Home,
        Plane,
        Star,
        Hourglass,
        Plus,
        X,
        Pencil,
        Trophy,
        Trash2,
        Mail,
        Loader2,
        Sparkles,
    } from "lucide-svelte";
    import { onMount } from "svelte";
    import SmartTextarea from "$lib/components/ui/SmartTextarea.svelte";
    import AIPromptBar from "$lib/components/concierge/AIPromptBar.svelte";
    import GhostRow from "$lib/components/ui/GhostRow.svelte";
    import { getSmartSamples } from "$lib/data/smartSamples";
    import { language } from "$lib/stores/localization";

    import {
        timelineStore,
        type LifeEvent,
    } from "$lib/stores/timelineStore.svelte";
    import { familyStore } from "$lib/stores/familyStore.svelte";
    import CustomFieldsManager from "$lib/components/ui/CustomFieldsManager.svelte";
    import DataViewToggle from "$lib/components/ui/DataViewToggle.svelte";
    import { userPreferencesStore, type ViewMode } from "$lib/stores/userPreferencesStore.svelte";
    import LivingBlueprintHeader from "$lib/components/LivingBlueprintHeader.svelte";

    let parsedCustomAttributes = $state<Record<string, any>>({});
    let isLoading = $state(true);
    let viewMode = $derived<ViewMode>(userPreferencesStore.getViewMode('timeline'));

    onMount(async () => {
        await timelineStore.sync?.();
        isLoading = false;
    });

    // --- State & Types ---
    // LifeEvent imported from store

    let getContactById = $derived((id: string | number | undefined) =>
        // The server keeps the contact id as text; contact ids are numbers.
        id == null ? undefined : familyStore.members.find((m) => String(m.id) === String(id)),
    );

    let showMemento = $state(false);
    let currentYear = new Date().getFullYear();

    // Use store directly
    let lifeEvents = $derived(timelineStore.items);

    // The track starts at the earliest event (1990 until the first event exists)
    let eventYears = $derived(
        lifeEvents.map((e) => Number(e.year)).filter((y) => Number.isFinite(y)),
    );
    let birthYear = $derived(eventYears.length > 0 ? Math.min(...eventYears) : 1990);

    let showAddModal = $state(false);
    let newEvent: Partial<LifeEvent> = $state({
        id: undefined,
        year: currentYear,
        label: "",
        type: "milestone",
        assignedContactId: undefined,
        description: "",
        reflection: "",
        category: "Personal",
        date: undefined,
    });

    function saveEvent() {
        if (!newEvent.label || !newEvent.year) return;

        const eventData = {
            ...newEvent,
            custom_attributes: JSON.stringify(parsedCustomAttributes),
        };

        if (newEvent.id) {
            timelineStore.updateEvent(newEvent.id, eventData);
        } else {
            timelineStore.addEvent(eventData);
        }

        resetForm();
    }

    function editEvent(event: LifeEvent) {
        // The contact select's option values are text, matching the id the server keeps.
        newEvent = {
            ...event,
            assignedContactId: event.assignedContactId == null ? undefined : String(event.assignedContactId),
        };
        parsedCustomAttributes = readCustom(event);
        showAddModal = true;
    }

    function resetForm() {
        showAddModal = false;
        newEvent = {
            id: undefined,
            year: currentYear,
            label: "",
            type: "milestone",
            assignedContactId: undefined,
            description: "",
            reflection: "",
            category: "Personal",
        };
        parsedCustomAttributes = {};
    }

    async function removeEvent(id: string | number) {
        if (!(await askConfirm("Remove this event from your timeline?"))) return;
        timelineStore.removeEvent(id);
    }

    // Memento Mori Calculation
    let weeksLived = $derived(Math.max(0, (currentYear - birthYear) * 52));

    // Dynamic Grid Sizing: Furthest event OR Current Year + 3
    let maxEventYear = $derived(
        eventYears.length > 0 ? Math.max(...eventYears) : currentYear,
    );
    let endYear = $derived(Math.max(maxEventYear, currentYear + 3));
    let totalWeeks = $derived((endYear - birthYear) * 52);

    // Zoom State
    let pixelsPerYear = $state(20);
    // Room either side so the first and last labels sit fully on the track
    const TRACK_PAD = 80;
    let trackWidth = $derived(TRACK_PAD * 2 + (endYear - birthYear) * pixelsPerYear);

    function getPosition(year: number) {
        return TRACK_PAD + (year - birthYear) * pixelsPerYear;
    }

    // One colour per event type, shared by the dots and the legend
    const TYPE_STYLES: { type: LifeEvent["type"]; label: string; dot: string }[] = [
        { type: "milestone", label: "Milestone", dot: "bg-purple-500" },
        { type: "education", label: "Education", dot: "bg-blue-500" },
        { type: "work", label: "Work", dot: "bg-emerald-500" },
        { type: "relationship", label: "Relationship", dot: "bg-rose-500" },
        { type: "accomplishment", label: "Accomplishment", dot: "bg-amber-500" },
    ];
    function dotClass(type: string) {
        if (type === "future") return "bg-gray-400";
        return TYPE_STYLES.find((t) => t.type === type)?.dot ?? "bg-purple-500";
    }

    // Reactively calculate Memento Mori Grid Data
    let hoveredWeek: any = $state(null);
    let tooltipX = $state(0);
    let tooltipY = $state(0);

    function handleMouseMove(e: MouseEvent) {
        const tooltipWidth = 260; // Approx width of our w-64 tooltip + padding
        const tooltipHeight = 160; // Estimated height

        // Horizontal check
        if (e.clientX + tooltipWidth > window.innerWidth) {
            tooltipX = e.clientX - tooltipWidth - 20;
        } else {
            tooltipX = e.clientX + 20;
        }

        // Vertical check (safety)
        if (e.clientY + tooltipHeight > window.innerHeight) {
            tooltipY = e.clientY - tooltipHeight - 20;
        } else {
            tooltipY = e.clientY + 20;
        }
    }

    let weeksData = $derived(
        Array.from({ length: totalWeeks }, (_, i) => {
            const isLived = i < weeksLived;

            // Find events that happened in this week (approximate)
            // We broadly map events to the specific week index corresponding to the start of their year
            const weekEvents = lifeEvents.filter((e) => {
                const eventWeekStart = (e.year - birthYear) * 52;
                // Match if the current week index 'i' is the one we calculated for this event's year
                return Math.floor(eventWeekStart) === i;
            });

            return {
                index: i,
                isLived,
                events: weekEvents,
                hasEvent: weekEvents.length > 0,
            };
        }),
    );

    function getIcon(type: string) {
        switch (type) {
            case "education":
                return GraduationCap;
            case "work":
                return Briefcase;
            case "relationship":
                return Heart;
            case "future":
                return Plane;
            case "accomplishment":
                return Trophy;
            default:
                return Star;
        }
    }
</script>

<LivingBlueprintHeader
        title="The Life Timeline"
        subtitle="Your story is a series of moments."
        detailedDescription="Document the milestones, accomplishments, and meaningful moments that shaped your life. Create a visual narrative that helps your family understand who you were and what mattered to you."
        whyMatters="Your life story deserves to be told. Your timeline becomes a gift of understanding for future generations."
    >
        <div class="flex items-center gap-3">
            <DataViewToggle module="timeline" />
            <button
                class="px-4 py-2 rounded-lg text-sm font-bold bg-[#4A7C74] text-white shadow-md flex items-center gap-2 hover:bg-[#3b635d]"
                onclick={() => (showAddModal = true)}
            >
                <Plus size={16} /> Add Event
            </button>
        </div>
    </LivingBlueprintHeader>

{#if isLoading}
    <div class="flex items-center justify-center py-12">
        <Loader2 class="w-8 h-8 animate-spin text-primary" />
    </div>
{:else}
<div class="max-w-6xl mx-auto p-8 animate-in fade-in duration-500">

    <!-- Add Modal -->
    {#if showAddModal}
        <div role="dialog" aria-modal="true" use:focusTrap={{ onEscape: resetForm }}
            class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
            transition:fade
        >
            <div
                class="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden"
                in:scale
            >
                <div
                    class="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50"
                >
                    <h3 class="font-bold text-[#304743]">New Life Event</h3>
                    <button aria-label="Close" onclick={resetForm}
                        ><X
                            size={20}
                            class="text-gray-400 hover:text-gray-600"
                        /></button
                    >
                </div>
                <div class="p-6 space-y-4">
                    <div class="space-y-1">
                        <label for="timeline-label" class="text-xs font-bold uppercase text-gray-400"
                            >Label</label
                        >
                        <input
                            id="timeline-label"
                            bind:value={newEvent.label}
                            class="w-full p-2 rounded-lg border focus:ring-2 ring-[#4A7C74] outline-none"
                            placeholder="e.g. Started Business"
                        />
                    </div>

                    <div class="space-y-1">
                        <SmartTextarea
                            bind:value={newEvent.description}
                            context="timeline"
                            placeholder="Share the memory..."
                            label="Details"
                            minHeight="80px"
                        />
                    </div>

                    <div class="grid grid-cols-2 gap-4">
                        <div class="space-y-1">
                            <label
                                for="timeline-date"
                                class="text-xs font-bold uppercase text-gray-400"
                                >Date</label
                            >
                            <input
                                id="timeline-date"
                                type="date"
                                value={newEvent.date ||
                                    (newEvent.year
                                        ? `${newEvent.year}-01-01`
                                        : "")}
                                oninput={(e) => {
                                    const val = e.currentTarget.value;
                                    newEvent.date = val;
                                    if (val) {
                                        newEvent.year = new Date(
                                            val,
                                        ).getFullYear();
                                    }
                                }}
                                class="w-full p-2 rounded-lg border focus:ring-2 ring-[#4A7C74] outline-none"
                            />
                        </div>
                        <div class="space-y-1">
                            <label
                                for="timeline-type"
                                class="text-xs font-bold uppercase text-gray-400"
                                >Type</label
                            >
                            <select
                                id="timeline-type"
                                bind:value={newEvent.type}
                                class="w-full p-2 rounded-lg border focus:ring-2 ring-[#4A7C74] outline-none bg-white"
                            >
                                <option value="milestone">Milestone</option>
                                <option value="education">Education</option>
                                <option value="work">Work</option>
                                <option value="relationship"
                                    >Relationship</option
                                >
                                <option value="accomplishment"
                                    >Accomplishment 🏆</option
                                >
                                <option value="future">Future Plan</option>
                            </select>
                        </div>
                    </div>

                    <div class="space-y-1">
                        <label for="timeline-contact" class="text-xs font-bold uppercase text-gray-400"
                            >Designated Contact</label
                        >
                        <select
                            id="timeline-contact"
                            bind:value={newEvent.assignedContactId}
                            class="w-full p-2 rounded-lg border focus:ring-2 ring-[#4A7C74] outline-none bg-white text-sm"
                        >
                            <option value={undefined}>No one assigned</option>
                            {#each familyStore.members as member}
                                <option value={String(member.id)}
                                    >{member.name} ({member.role})</option
                                >
                            {/each}
                        </select>
                    </div>

                    {#if newEvent.type === "accomplishment"}
                        <div
                            class="space-y-4 pt-2 border-t border-stone-100 animate-in fade-in slide-in-from-top-2 duration-300"
                        >
                            <div class="space-y-1">
                                <label
                                    for="timeline-category"
                                    class="text-xs font-bold uppercase text-gray-400"
                                    >Category</label
                                >
                                <select
                                    id="timeline-category"
                                    bind:value={newEvent.category}
                                    class="w-full p-2 rounded-lg border focus:ring-2 ring-amber-400 outline-none bg-white"
                                >
                                    <option value="Personal">Personal</option>
                                    <option value="Career">Career</option>
                                    <option value="Education">Education</option>
                                    <option value="Relationships"
                                        >Relationships</option
                                    >
                                    <option value="Travel">Travel</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>
                            <div class="space-y-1">
                                <SmartTextarea
                                    bind:value={newEvent.reflection}
                                    context="storytelling"
                                    placeholder="What does this achievement mean to you?"
                                    label="The Story (Reflection)"
                                    minHeight="120px"
                                />
                            </div>
                        </div>
                    {/if}

                    <!-- Custom Fields -->
                    <div class="pt-4 mt-4 border-t border-gray-100">
                        <CustomFieldsManager
                            entityType="timeline"
                            bind:data={parsedCustomAttributes}
                        />
                    </div>

                    <button
                        onclick={saveEvent}
                        class="w-full py-3 bg-[#4A7C74] text-white rounded-xl font-bold mt-2"
                    >
                        {newEvent.id ? "Update Event" : "Add to Timeline"}
                    </button>
                </div>
            </div>
        </div>
    {/if}

    <!-- View switch (the page header above holds the title and Add Event) -->
    <div class="flex justify-end mb-12">
        <div class="flex flex-col items-end gap-4">
            <div class="flex gap-4">
                <div
                    class="flex items-center gap-2 bg-white p-1 rounded-xl border border-gray-100 shadow-sm"
                >
                    <button
                        class="px-4 py-2 rounded-lg text-sm font-bold transition-all {showMemento
                            ? 'text-gray-500 hover:bg-gray-50'
                            : 'bg-stone-100 text-stone-800'}"
                        onclick={() => (showMemento = false)}
                    >
                        Timeline
                    </button>
                    <button
                        class="px-4 py-2 rounded-lg text-sm font-bold transition-all {showMemento
                            ? 'bg-purple-600 text-white shadow-md'
                            : 'text-gray-500 hover:bg-gray-50'}"
                        onclick={() => (showMemento = true)}
                    >
                        Memento Mori
                    </button>
                </div>
            </div>
        </div>
    </div>

    <!-- AI Concierge Drafting Assistant -->
    <AIPromptBar
        context="heirlooms"
        prompts={[
            "Help me capture a milestone from my life...",
            "Draft a reflection on a major life event...",
            "Describe the meaning of this accomplishment...",
            "Write about a turning point in my story..."
        ]}
    />

    <!-- Empty State with GhostRow Samples -->
    {#if lifeEvents.length === 0 && !showMemento}
        <div class="mb-8" in:fade>
            <div class="border border-amber-200 bg-amber-50/50 rounded-xl p-4 mb-4 flex items-center gap-3 text-amber-800">
                <Sparkles size={20} />
                <p class="text-sm font-medium">
                    Concierge Mode: Showing example life events to inspire you.
                </p>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {#each getSmartSamples($language)['timeline'] || [] as sample}
                    {@const SampleIcon = getIcon(sample.type || 'milestone')}
                    <GhostRow
                        name={sample.name || sample.label}
                        subtitle={sample.type || 'Milestone'}
                        type="Life Event"
                        onclick={() => {
                            newEvent = {
                                ...newEvent,
                                label: sample.name || sample.label,
                                type: sample.type || 'milestone',
                                year: sample.year || currentYear,
                                description: sample.description || '',
                            };
                            showAddModal = true;
                        }}
                    >
                        {#snippet icon()}
                            <SampleIcon size={20} class="text-slate-400" />
                        {/snippet}
                    </GhostRow>
                {/each}
            </div>
            <div class="flex justify-center mt-4">
                <button
                    onclick={() => (showAddModal = true)}
                    class="text-sm font-bold text-[#4A7C74] hover:bg-[#4A7C74]/5 px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
                >
                    <Plus size={14} /> Add Your First Life Event
                </button>
            </div>
        </div>
    {/if}

    <!-- The Trophy Case (Accomplishments) -->
    {#if !showMemento && lifeEvents.some((e) => e.type === "accomplishment")}
        <div class="mb-12" in:slide>
            <div class="flex items-center gap-2 mb-4">
                <Trophy class="text-amber-500" size={20} />
                <h3
                    class="font-bold text-[#304743] uppercase tracking-widest text-sm"
                >
                    Trophy Case
                </h3>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {#each lifeEvents.filter((e) => e.type === "accomplishment") as trophy}
                    <div
                        class="bg-white border border-amber-100 p-6 rounded-2xl relative group cursor-pointer hover:shadow-xl hover:border-amber-300 transition-all flex flex-col h-full"
                        role="button"
                        tabindex="0"
                        onclick={() => editEvent(trophy)}
                        onkeydown={(e) => {
                            if (e.target === e.currentTarget && (e.key === "Enter" || e.key === " ")) {
                                e.preventDefault();
                                editEvent(trophy);
                            }
                        }}
                    >
                        <div
                            class="absolute top-4 right-4 flex gap-2"
                        >
                            <button
                                onclick={(e) => {
                                    e.stopPropagation();
                                    editEvent(trophy);
                                }}
                                aria-label="Edit Event"
                                class="p-2 bg-amber-50 text-amber-600 rounded-full hover:bg-amber-100"
                            >
                                <Pencil size={14} />
                            </button>
                        </div>

                        <div class="flex items-center gap-2 mb-4">
                            <div
                                class="px-3 py-1 bg-amber-50 text-amber-700 text-[10px] font-black uppercase tracking-tighter rounded-full border border-amber-100"
                            >
                                {trophy.category || "Personal"}
                            </div>
                            <div
                                class="text-xs font-bold text-stone-400 capitalize"
                            >
                                {trophy.year}
                            </div>
                        </div>

                        <h4
                            class="font-serif font-bold text-xl text-[#304743] mb-2 group-hover:text-amber-700 transition-colors"
                        >
                            {trophy.label}
                        </h4>

                        {#if trophy.description}
                            <p class="text-sm text-stone-500 mb-4 line-clamp-2">
                                {trophy.description}
                            </p>
                        {/if}

                        {#if trophy.assignedContactId}
                            {@const contact = getContactById(
                                trophy.assignedContactId,
                            )}
                            <div
                                class="mt-4 pt-4 border-t border-stone-100 flex items-center justify-between"
                            >
                                <div class="flex items-center gap-2">
                                    <div
                                        class="w-6 h-6 rounded-full bg-stone-100 flex items-center justify-center overflow-hidden border border-stone-200"
                                    >
                                        {#if contact?.avatar}
                                            <img
                                                src={contact.avatar}
                                                alt={contact.name}
                                                class="w-full h-full object-cover"
                                            />
                                        {:else}
                                            <span
                                                class="text-[8px] font-bold text-stone-400"
                                                >{contact?.name
                                                    ?.slice(0, 2)
                                                    .toUpperCase() ||
                                                    "??"}</span
                                            >
                                        {/if}
                                    </div>
                                    <div class="flex flex-col">
                                        <span
                                            class="text-[10px] font-bold text-stone-600 leading-tight"
                                            >{contact?.name || "Unknown"}</span
                                        >
                                        <span
                                            class="text-[8px] text-stone-400 leading-tight capitalize"
                                            >{contact?.role || "Contact"}</span
                                        >
                                    </div>
                                </div>

                                {#if contact?.email}
                                    <button
                                        onclick={(e) => {
                                            e.stopPropagation();
                                            // Opens the person's own mail app, prefilled; nothing is sent from here.
                                            const body = [trophy.label, trophy.year, trophy.description]
                                                .filter(Boolean)
                                                .join("\n\n");
                                            window.location.href = `mailto:${contact.email}?subject=${encodeURIComponent(trophy.label)}&body=${encodeURIComponent(body)}`;
                                        }}
                                        class="p-2 bg-blue-50 text-blue-600 rounded-full hover:bg-blue-100 transition-colors shadow-sm"
                                        title="Notify via Email"
                                    >
                                        <Mail size={12} />
                                    </button>
                                {/if}
                            </div>
                        {/if}

                        {#if trophy.reflection}
                            <div class="mt-4 pt-4 border-t border-stone-100">
                                <p
                                    class="text-xs text-stone-400 italic line-clamp-3"
                                >
                                    "{trophy.reflection}"
                                </p>
                            </div>
                        {/if}
                    </div>
                {/each}
            </div>
        </div>
    {/if}

    {#if showMemento}
        <!-- Memento Mori Grid -->
        <div
            class="bg-white rounded-2xl border border-border shadow-sm p-8"
            in:fade
        >
            <div
                class="flex items-start gap-4 mb-8 bg-purple-50 p-4 rounded-xl text-purple-900 border border-purple-100"
            >
                <Hourglass class="shrink-0 mt-1" />
                <div>
                    <h3 class="font-bold">Weeks of Your Life</h3>
                    <p class="text-sm opacity-90">
                        Each square represents one week. Filled squares are the
                        past. Empty squares are the future.
                    </p>
                </div>
                <div class="ml-auto text-right hidden md:block">
                    <div class="text-2xl font-bold">
                        {Math.floor(weeksLived)}
                    </div>
                    <div class="text-xs uppercase opacity-75">Weeks Lived</div>
                </div>
            </div>

            <!-- Hover reveals the week details; the Life Events list holds the same entries for keyboard use. -->
            <!-- svelte-ignore a11y_no_static_element_interactions -->
            <div
                class="flex flex-wrap gap-1 justify-center max-h-[600px] overflow-y-auto p-4 custom-scrollbar relative"
                onmouseleave={() => (hoveredWeek = null)}
                onmousemove={handleMouseMove}
            >
                {#each weeksData as week (week.index)}
                    <!-- Hover reveals the week details; the Life Events list holds the same entries for keyboard use. -->
                    <!-- svelte-ignore a11y_no_static_element_interactions -->
                    <div
                        class="w-2 h-2 rounded-[1px] transition-colors cursor-pointer relative group
                        {week.hasEvent
                            ? 'bg-amber-400 hover:bg-amber-500 ring-2 ring-amber-200 z-10'
                            : ''}
                        {!week.hasEvent && week.isLived
                            ? 'bg-[#304743]/80 hover:bg-[#304743]'
                            : ''}
                        {!week.hasEvent && !week.isLived
                            ? 'bg-gray-100 hover:bg-purple-200'
                            : ''}"
                        onmouseenter={() => (hoveredWeek = week)}
                    ></div>
                {/each}
            </div>

            <!-- Active Hover Info Bar -->
            <!-- Permanent Legend -->
            <div class="mt-8 flex justify-center gap-8 text-sm opacity-60">
                <div class="flex items-center gap-2">
                    <div class="w-3 h-3 bg-[#304743]/80 rounded-[1px]"></div>
                    <span class="text-gray-600">Lived</span>
                </div>
                <div class="flex items-center gap-2">
                    <div class="w-3 h-3 bg-amber-400 rounded-[1px]"></div>
                    <span class="text-gray-600">Event</span>
                </div>
                <div class="flex items-center gap-2">
                    <div
                        class="w-2 h-2 rounded-[1px] bg-gray-100 rounded-[1px]"
                    ></div>
                    <span class="text-gray-600">Remaining</span>
                </div>
            </div>

            <!-- Floating Tooltip -->
            {#if hoveredWeek && hoveredWeek.hasEvent}
                <div
                    class="fixed z-50 bg-white/95 backdrop-blur shadow-xl border border-stone-200 rounded-xl p-4 pointer-events-none w-64 animate-in fade-in zoom-in-95 duration-150"
                    style="top: {tooltipY}px; left: {tooltipX}px;"
                >
                    <div
                        class="text-xs uppercase tracking-widest text-[#304743]/60 font-bold mb-2 pb-2 border-b border-stone-100"
                    >
                        Week {hoveredWeek.index + 1} | {birthYear +
                            Math.floor(hoveredWeek.index / 52)}
                    </div>

                    {#each hoveredWeek.events as event}
                        {@const Icon = getIcon(event.type)}
                        <div class="flex items-start gap-2 mb-2 last:mb-0">
                            <Icon
                                size={16}
                                class="text-amber-500 shrink-0 mt-1"
                            />
                            <div>
                                <div
                                    class="text-[#304743] font-bold leading-tight"
                                >
                                    {event.label}
                                </div>
                                {#if event.description}
                                    <p
                                        class="text-xs text-stone-500 italic mt-0.5 line-clamp-2"
                                    >
                                        {event.description}
                                    </p>
                                {/if}
                            </div>
                        </div>
                    {/each}
                </div>
            {/if}
        </div>
    {:else if viewMode === 'table' && lifeEvents.length > 0}
        <!-- Table View -->
        <div class="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <table class="w-full">
                <thead class="bg-slate-50 border-b border-slate-200">
                    <tr>
                        <th class="px-4 py-3 text-left text-xs font-bold uppercase text-slate-500">Year</th>
                        <th class="px-4 py-3 text-left text-xs font-bold uppercase text-slate-500">Label</th>
                        <th class="px-4 py-3 text-left text-xs font-bold uppercase text-slate-500">Type</th>
                        <th class="px-4 py-3 text-left text-xs font-bold uppercase text-slate-500">Details</th>
                        <th class="px-4 py-3 text-right text-xs font-bold uppercase text-slate-500">Actions</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-slate-100">
                    {#each [...lifeEvents].sort((a, b) => a.year - b.year) as event (event.id)}
                        <tr class="hover:bg-slate-50 transition-colors">
                            <td class="px-4 py-3 text-sm font-bold text-slate-600">{event.year}</td>
                            <td class="px-4 py-3 font-medium text-slate-800">{event.label}</td>
                            <td class="px-4 py-3 text-sm text-slate-600">
                                <span class="inline-flex items-center gap-2">
                                    <span class="w-2 h-2 rounded-full {dotClass(event.type)}"></span>
                                    {TYPE_STYLES.find((t) => t.type === event.type)?.label ?? "Future Plan"}
                                </span>
                            </td>
                            <td class="px-4 py-3 text-sm text-slate-600 max-w-xs truncate">{event.description || ''}</td>
                            <td class="px-4 py-3 text-right">
                                <div class="flex items-center justify-end gap-2">
                                    <button
                                        onclick={() => editEvent(event)}
                                        class="p-1.5 text-slate-400 hover:text-primary transition-colors"
                                        title="Edit Event"
                                        aria-label="Edit Event"
                                    >
                                        <Pencil size={14} />
                                    </button>
                                    <button
                                        onclick={() => removeEvent(event.id)}
                                        class="p-1.5 text-slate-400 hover:text-red-500 transition-colors"
                                        title="Delete Event"
                                        aria-label="Delete Event"
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
    {:else}
        <!-- Timeline View -->
        <div
            class="bg-white rounded-2xl shadow-xl border border-stone-100 p-8 overflow-hidden relative"
        >
            <!-- Controls -->
            <div class="flex justify-between items-center mb-6">
                <!-- Zoom Control -->
                <div
                    class="flex items-center gap-3 bg-gray-50 px-4 py-2 rounded-xl border border-gray-100"
                >
                    <span class="text-xs font-bold text-gray-400 uppercase"
                        >Zoom Level</span
                    >
                    <input
                        type="range"
                        min="10"
                        max="100"
                        bind:value={pixelsPerYear}
                        aria-label="Zoom Level"
                        class="w-32 accent-[#4A7C74] cursor-pointer"
                    />
                    <span class="text-xs text-gray-400 font-mono w-8"
                        >{pixelsPerYear}px</span
                    >
                </div>

                <div class="flex flex-wrap justify-end gap-4 text-sm text-gray-400">
                    {#each TYPE_STYLES as t (t.type)}
                        <div class="flex items-center gap-2">
                            <div class="w-2 h-2 rounded-full {t.dot}"></div>
                            <span>{t.label}</span>
                        </div>
                    {/each}
                </div>
            </div>

            <div
                class="overflow-x-auto pb-12 scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent"
            >
                <!-- Line -->
                <div
                    class="absolute top-32 left-0 right-0 h-0.5 bg-gradient-to-r from-stone-200 via-stone-300 to-stone-200"
                ></div>

                <!-- Events -->
                <div
                    class="relative h-64 transition-all duration-300"
                    style="width: {trackWidth}px"
                >
                    <!-- events logic -->
                    {#each lifeEvents as event, i (event.id)}
                        {@const Icon = getIcon(event.type)}
                        <div
                            class="absolute top-1/2 -translate-y-1/2 flex flex-col items-center group cursor-pointer w-12 -ml-6 z-10 hover:z-50 transition-all duration-200"
                            style="left: {getPosition(event.year)}px"
                            in:fly={{ y: 20, delay: i * 50 }}
                        >
                            <!-- Top Label (Alternating) -->
                            {#if i % 2 === 0}
                                <div
                                    class="mb-6 opacity-60 group-hover:opacity-100 transition-all -translate-y-1 group-hover:translate-y-0 text-center w-32"
                                >
                                    <div
                                        class="text-sm font-bold text-[#304743]"
                                    >
                                        {event.label}
                                    </div>
                                    {#if event.assignedContactId}
                                        <div
                                            class="text-[9px] font-bold text-stone-400 uppercase tracking-tighter truncate px-2"
                                        >
                                            Assigned: {getContactById(
                                                event.assignedContactId,
                                            )?.name || "..."}
                                        </div>
                                    {/if}
                                </div>
                            {/if}

                            <!-- Dot / Icon -->
                            <div class="relative">
                                <div
                                    class="relative z-10 w-12 h-12 rounded-full border-4 border-white shadow-lg flex items-center justify-center transition-transform group-hover:scale-110
                                {event.year > currentYear
                                        ? 'bg-gray-100 text-gray-400 border-dashed border-gray-300'
                                        : `${dotClass(event.type)} text-white`}"
                                >
                                    <Icon
                                        size={18}
                                    />
                                </div>
                                <!-- Actions -->
                                <div
                                    class="absolute -top-3 -right-3 flex gap-1 z-20"
                                >
                                    <button
                                        onclick={(e) => {
                                            e.stopPropagation();
                                            editEvent(event);
                                        }}
                                        aria-label="Edit Event"
                                        class="bg-blue-100 text-blue-500 p-1 rounded-full hover:scale-110 shadow-sm"
                                        title="Edit Event"
                                    >
                                        <Pencil size={12} />
                                    </button>
                                    <button
                                        onclick={(e) => {
                                            e.stopPropagation();
                                            removeEvent(event.id);
                                        }}
                                        class="bg-red-100 text-red-500 p-1 rounded-full hover:scale-110 shadow-sm"
                                        title="Delete Event"
                                    >
                                        <Trash2 size={12} />
                                    </button>
                                </div>
                            </div>

                            <!-- Year -->
                            <div
                                class="mt-3 text-xs font-bold text-gray-400 group-hover:text-[#304743] transition-colors"
                            >
                                {event.year}
                            </div>

                            <!-- Bottom Label (Alternating) -->
                            {#if i % 2 !== 0}
                                <div
                                    class="mt-6 opacity-60 group-hover:opacity-100 transition-all translate-y-1 group-hover:translate-y-0 text-center w-32"
                                >
                                    <div
                                        class="text-sm font-bold text-[#304743]"
                                    >
                                        {event.label}
                                    </div>
                                    {#if event.assignedContactId}
                                        <div
                                            class="text-[9px] font-bold text-stone-400 uppercase tracking-tighter truncate px-2"
                                        >
                                            Assigned: {getContactById(
                                                event.assignedContactId,
                                            )?.name || "..."}
                                        </div>
                                    {/if}
                                </div>
                            {/if}
                        </div>
                    {/each}

                    <!-- Unwritten Future Section -->
                    <div
                        class="absolute top-1/2 -translate-y-1/2 flex flex-col items-center"
                        style="left: {getPosition(currentYear)}px"
                    >
                        <div
                            class="absolute -top-16 text-xs font-bold uppercase tracking-widest text-[#4A7C74]"
                        >
                            Today
                        </div>
                        <div
                            class="w-0.5 h-32 bg-[#4A7C74]/50 border-l-2 border-dashed border-[#4A7C74]"
                        ></div>
                    </div>
                </div>
            </div>

            <p class="text-center text-sm text-muted-foreground mt-6 italic">
                "We plan for the future, but we live in moments."
            </p>
        </div>
    {/if}
</div>
{/if}

<style>
    /* Custom Scrollbar for the Memento Grid */
    .custom-scrollbar::-webkit-scrollbar {
        width: 8px;
    }
    .custom-scrollbar::-webkit-scrollbar-track {
        background: #f1f1f1;
        border-radius: 4px;
    }
    .custom-scrollbar::-webkit-scrollbar-thumb {
        background: #d1d5db;
        border-radius: 4px;
    }
    .custom-scrollbar::-webkit-scrollbar-thumb:hover {
        background: #9ca3af;
    }

    .custom-scrollbar-x::-webkit-scrollbar {
        height: 8px;
    }
    .custom-scrollbar-x::-webkit-scrollbar-track {
        background: #f1f1f1;
        border-radius: 4px;
    }
    .custom-scrollbar-x::-webkit-scrollbar-thumb {
        background: #d1d5db;
        border-radius: 4px;
    }
</style>
