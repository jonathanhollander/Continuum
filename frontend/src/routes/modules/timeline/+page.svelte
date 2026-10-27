<script lang="ts">
    import { aiJobId, aiSourceFacts } from "$lib/services/aiCapabilities";
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

    // A schematic timeline of recorded years, with current-year planning space.
    let eventYears = $derived(
        lifeEvents.map((e) => Number(e.year)).filter((y) => Number.isInteger(y) && y > 0),
    );
    let startYear = $derived(Math.min(currentYear, ...eventYears));

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

    let saving = $state(false);
    const saveVersions = new WeakMap<object, number>();
    const recoveryIds = new WeakMap<object, string>();
    async function saveEvent() {
        if (saving || !newEvent.label || !newEvent.year) return;
        const form = newEvent;
        const eventData: Partial<LifeEvent> = JSON.parse(JSON.stringify({
            ...form,
            custom_attributes: JSON.stringify(parsedCustomAttributes),
        }));
        const version = (saveVersions.get(form) ?? 0) + 1;
        saveVersions.set(form, version);
        let completed = false;
        const attempt = async () => {
            if (saving || completed || saveVersions.get(form) !== version) return;
            saving = true;
            try {
                const saved = eventData.id
                    ? await timelineStore.updateEvent(eventData.id, eventData, attempt, recoveryIds.get(form))
                    : await timelineStore.addEvent(eventData, attempt, recoveryIds.get(form));
                completed = true;
                recoveryIds.delete(form);
                if (newEvent === form) {
                    const current = { ...newEvent, custom_attributes: JSON.stringify(parsedCustomAttributes) };
                    if (JSON.stringify(current) === JSON.stringify(eventData)) resetForm();
                    else newEvent.id = saved.id; // newer typing stays open and continues this same record
                }
            } catch (e) {
                if (e && typeof e === "object" && "recoveryId" in e && typeof e.recoveryId === "string") recoveryIds.set(form, e.recoveryId);
                // The manager keeps the submitted operation for Retry; this editor keeps its words.
            } finally {
                saving = false;
            }
        };
        await attempt();
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

    // The weekly overview uses 52 schematic squares per year, rather than calendar dates.
    let earlierCells = $derived(Math.max(0, (currentYear - startYear) * 52));

    // Exclusive upper boundary includes the entire latest recorded year.
    let maxEventYear = $derived(
        eventYears.length > 0 ? Math.max(...eventYears) : currentYear,
    );
    let endYear = $derived(Math.max(maxEventYear + 1, currentYear + 3));
    let totalCells = $derived((endYear - startYear) * 52);

    // Zoom State
    let pixelsPerYear = $state(20);
    // Room either side so the first and last labels sit fully on the track
    const TRACK_PAD = 80;
    let trackWidth = $derived(TRACK_PAD * 2 + (endYear - startYear) * pixelsPerYear);

    function getPosition(year: number) {
        return TRACK_PAD + (year - startYear) * pixelsPerYear;
    }

    // One colour per event type, shared by the dots and the legend
    const TYPE_STYLES: { type: LifeEvent["type"]; label: string; dot: string }[] = [
        { type: "milestone", label: "Milestone", dot: "bg-purple-500" },
        { type: "education", label: "Education", dot: "bg-blue-500" },
        { type: "work", label: "Work", dot: "bg-emerald-500" },
        { type: "relationship", label: "Relationship", dot: "bg-rose-500" },
        { type: "accomplishment", label: "Accomplishment", dot: "bg-amber-700" },
    ];
    function dotClass(type: string) {
        if (type === "future") return "bg-slate-400";
        return TYPE_STYLES.find((t) => t.type === type)?.dot ?? "bg-purple-500";
    }

    // Events are grouped in their recorded year's first square.
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

    let weeklyCells = $derived(
        Array.from({ length: totalCells }, (_, i) => {
            const isEarlier = i < earlierCells;

            // Preserve every record in its year's group; no week or birth date is inferred.
            const weekEvents = lifeEvents.filter((e) => {
                const year = Number(e.year);
                return Number.isInteger(year) && year > 0 && (year - startYear) * 52 === i;
            });

            return {
                index: i,
                isEarlier,
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
        subtitle="Events, accomplishments, and the stories behind them"
        detailedDescription="Add a recognizable title, a year or date, and what happened. Explain who was involved and why the event matters to you. Mark an event as Accomplishment to include it in the Journal's accomplishments gallery."
        whyMatters="Putting events in order gives your family the context around a memory, a relationship, or a turning point in your life."
    >
        <div class="flex items-center gap-3">
            <DataViewToggle module="timeline" />
            <button
                class="px-4 py-2 rounded-lg text-sm font-bold bg-primary text-primary-foreground shadow-md flex items-center gap-2 hover:bg-primary-hover"
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
        <div role="dialog" aria-modal="true" aria-labelledby="timeline-dialog-title" use:focusTrap={{ onEscape: resetForm }}
            class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
            transition:fade
        >
            <div
                class="bg-card rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden"
                in:scale
            >
                <div
                    class="p-4 border-b border-border flex justify-between items-center bg-muted"
                >
                    <h3 id="timeline-dialog-title" class="font-bold text-primary-deep dark:text-primary-hover">{newEvent.id ? "Update this event" : "New Life Event"}</h3>
                    <button aria-label="Close" onclick={resetForm}
                        ><X
                            size={20}
                            class="text-muted-foreground hover:text-foreground"
                        /></button
                    >
                </div>
                <div class="p-6 space-y-4">
                    <div class="space-y-1">
                        <label for="timeline-label" class="text-xs font-bold uppercase text-muted-foreground"
                            >Label</label
                        >
                        <input
                            id="timeline-label"
                            bind:value={newEvent.label}
                            class="w-full p-2 rounded-lg border border-border focus:ring-2 ring-primary outline-none bg-card text-foreground"
                            placeholder="e.g. Started Business"
                        />
                    </div>

                    <div class="space-y-1">
                        <SmartTextarea
                            job={{job_id:aiJobId("timeline", newEvent, newEvent.id)+":description",document_title:newEvent.label,source_facts:aiSourceFacts({label:newEvent.label,type:newEvent.type,year:newEvent.year,date:newEvent.date,assignedContactId:newEvent.assignedContactId})}}
                            bind:value={newEvent.description}
                            context="timeline"
                            placeholder="What happened, who was involved, and why does this moment matter to you?"
                            label="Details"
                            minHeight="80px"
                        />
                    </div>

                    <div class="grid grid-cols-2 gap-4">
                        <div class="space-y-1">
                            <label
                                for="timeline-date"
                                class="text-xs font-bold uppercase text-muted-foreground"
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
                                        newEvent.year = Number(val.slice(0, 4));
                                    }
                                }}
                                class="w-full p-2 rounded-lg border border-border focus:ring-2 ring-primary outline-none bg-card text-foreground"
                            />
                        </div>
                        <div class="space-y-1">
                            <label
                                for="timeline-type"
                                class="text-xs font-bold uppercase text-muted-foreground"
                                >Type</label
                            >
                            <select
                                id="timeline-type"
                                bind:value={newEvent.type}
                                class="w-full p-2 rounded-lg border border-border focus:ring-2 ring-primary outline-none bg-card text-foreground"
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
                        <label for="timeline-contact" class="text-xs font-bold uppercase text-muted-foreground"
                            >Designated Contact</label
                        >
                        <select
                            id="timeline-contact"
                            bind:value={newEvent.assignedContactId}
                            class="w-full p-2 rounded-lg border border-border focus:ring-2 ring-primary outline-none bg-card text-foreground text-sm"
                        >
                            <option value={undefined}>Choose someone from your contacts</option>
                            {#each familyStore.members as member}
                                <option value={String(member.id)}
                                    >{member.name} ({member.role})</option
                                >
                            {/each}
                        </select>
                    </div>

                    {#if newEvent.type === "accomplishment"}
                        <div
                            class="space-y-4 pt-2 border-t border-border animate-in fade-in slide-in-from-top-2 duration-300"
                        >
                            <div class="space-y-1">
                                <label
                                    for="timeline-category"
                                    class="text-xs font-bold uppercase text-muted-foreground"
                                    >Category</label
                                >
                                <select
                                    id="timeline-category"
                                    bind:value={newEvent.category}
                                    class="w-full p-2 rounded-lg border border-border focus:ring-2 ring-primary outline-none bg-card text-foreground"
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
                            job={{job_id:aiJobId("timeline", newEvent, newEvent.id)+":reflection",document_title:newEvent.label,source_facts:aiSourceFacts({label:newEvent.label,type:newEvent.type,year:newEvent.year,date:newEvent.date,assignedContactId:newEvent.assignedContactId})}}
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
                    <div class="pt-4 mt-4 border-t border-border">
                        <CustomFieldsManager
                            entityType="timeline"
                            bind:data={parsedCustomAttributes}
                        />
                    </div>

                    <button
                        onclick={saveEvent}
                        disabled={saving}
                        aria-busy={saving}
                        class="w-full py-3 bg-primary text-primary-foreground rounded-xl font-bold mt-2 disabled:opacity-50"
                    >
                        {saving ? "Saving..." : newEvent.id ? "Update Event" : "Add to Timeline"}
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
                    class="flex items-center gap-2 bg-card p-1 rounded-xl border border-border shadow-sm"
                >
                    <button
                        class="px-4 py-2 rounded-lg text-sm font-bold transition-all {showMemento
                            ? 'text-muted-foreground hover:bg-muted'
                            : 'bg-muted text-foreground'}"
                        onclick={() => (showMemento = false)}
                    >
                        Timeline
                    </button>
                    <button
                        class="px-4 py-2 rounded-lg text-sm font-bold transition-all {showMemento
                            ? 'bg-primary text-primary-foreground shadow-md'
                            : 'text-muted-foreground hover:bg-muted'}"
                        onclick={() => (showMemento = true)}
                    >
                        Weekly overview
                    </button>
                </div>
            </div>
        </div>
    </div>

    <!-- AI Concierge Drafting Assistant -->
    <AIPromptBar
        context="heirlooms"
        promptSource="routes/modules/timeline/+page.svelte:prompts"
    />

    <!-- Empty State with GhostRow Samples -->
    {#if lifeEvents.length === 0 && !showMemento}
        <div class="mb-8" in:fade>
            <div class="border border-gold/30 bg-gold/10 rounded-xl p-4 mb-4 flex items-center gap-3 text-foreground">
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
                            <SampleIcon size={20} class="text-muted-foreground" />
                        {/snippet}
                    </GhostRow>
                {/each}
            </div>
            <div class="flex justify-center mt-4">
                <button
                    onclick={() => (showAddModal = true)}
                    class="text-sm font-bold text-primary hover:bg-primary/5 px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
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
                <Trophy class="text-gold-text" size={20} />
                <h3
                    class="font-bold text-primary-deep dark:text-primary-hover uppercase tracking-widest text-sm"
                >
                    Trophy Case
                </h3>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {#each lifeEvents.filter((e) => e.type === "accomplishment") as trophy}
                    <div
                        class="bg-card border border-gold/30 p-6 rounded-2xl relative group cursor-pointer hover:shadow-xl hover:border-gold transition-all flex flex-col h-full"
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
                                class="p-2 bg-gold/15 text-gold-text rounded-full hover:bg-gold/25"
                            >
                                <Pencil size={14} />
                            </button>
                        </div>

                        <div class="flex items-center gap-2 mb-4">
                            <div
                                class="px-3 py-1 bg-gold/10 text-gold-text text-[10px] font-black uppercase tracking-tighter rounded-full border border-gold/30"
                            >
                                {trophy.category || "Personal"}
                            </div>
                            <div
                                class="text-xs font-bold text-muted-foreground capitalize"
                            >
                                {trophy.year}
                            </div>
                        </div>

                        <h4
                            class="font-serif font-bold text-xl text-primary-deep dark:text-primary-hover mb-2 group-hover:text-primary-hover transition-colors"
                        >
                            {trophy.label}
                        </h4>

                        {#if trophy.description}
                            <p class="text-sm text-muted-foreground mb-4 line-clamp-2">
                                {trophy.description}
                            </p>
                        {/if}

                        {#if trophy.assignedContactId}
                            {@const contact = getContactById(
                                trophy.assignedContactId,
                            )}
                            <div
                                class="mt-4 pt-4 border-t border-border flex items-center justify-between"
                            >
                                <div class="flex items-center gap-2">
                                    <div
                                        class="w-6 h-6 rounded-full bg-muted flex items-center justify-center overflow-hidden border border-border"
                                    >
                                        {#if contact?.avatar}
                                            <img
                                                src={contact.avatar}
                                                alt={contact.name}
                                                class="w-full h-full object-cover"
                                            />
                                        {:else}
                                            <span
                                                class="text-[8px] font-bold text-muted-foreground"
                                                >{contact?.name
                                                    ?.slice(0, 2)
                                                    .toUpperCase() ||
                                                    "??"}</span
                                            >
                                        {/if}
                                    </div>
                                    <div class="flex flex-col">
                                        <span
                                            class="text-[10px] font-bold text-muted-foreground leading-tight"
                                            >{contact?.name || "Unknown"}</span
                                        >
                                        <span
                                            class="text-[8px] text-muted-foreground leading-tight capitalize"
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
                                        class="p-2 bg-primary-soft text-primary-hover rounded-full hover:bg-primary/20 transition-colors shadow-sm"
                                        title="Notify via Email"
                                    >
                                        <Mail size={12} />
                                    </button>
                                {/if}
                            </div>
                        {/if}

                        {#if trophy.reflection}
                            <div class="mt-4 pt-4 border-t border-border">
                                <p
                                    class="text-xs text-muted-foreground italic line-clamp-3"
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
        <!-- Schematic weekly overview of the displayed timeline range -->
        <div
            class="bg-card rounded-2xl border border-border shadow-sm p-8"
            in:fade
        >
            <div
                class="flex items-start gap-4 mb-8 bg-primary-soft p-4 rounded-xl text-foreground border border-primary/20"
            >
                <Hourglass class="shrink-0 mt-1" />
                <div>
                    <h3 class="font-bold">Timeline in weekly squares</h3>
                    <p class="text-sm opacity-90">
                        This view uses 52 squares for each year from {startYear}
                        through {endYear - 1}. Filled squares mark years before
                        {currentYear}; unfilled squares provide space for the current
                        year and future plans. Events appear in their year's first square.
                    </p>
                    {#if eventYears.length === 0}
                        <p class="mt-2 text-sm">Add an event with a year to place your story here. This empty planning range begins with {currentYear}.</p>
                    {/if}
                </div>
                <div class="ml-auto text-right hidden md:block">
                    <div class="text-2xl font-bold">
                        {Math.floor(earlierCells)}
                    </div>
                    <div class="text-xs uppercase opacity-75">Earlier-year squares</div>
                </div>
            </div>

            <!-- Hover reveals the week details; the Life Events list holds the same entries for keyboard use. -->
            <!-- svelte-ignore a11y_no_static_element_interactions -->
            <div
                class="flex flex-wrap gap-1 justify-center max-h-[600px] overflow-y-auto p-4 custom-scrollbar relative"
                data-testid="weekly-timeline"
                data-start-year={startYear}
                data-end-year-exclusive={endYear}
                data-total-cells={totalCells}
                data-earlier-cells={earlierCells}
                onmouseleave={() => (hoveredWeek = null)}
                onmousemove={handleMouseMove}
            >
                {#each weeklyCells as week (week.index)}
                    <!-- Hover reveals the week details; the Life Events list holds the same entries for keyboard use. -->
                    <!-- svelte-ignore a11y_no_static_element_interactions -->
                    <div
                        data-week-index={week.index}
                        data-year={startYear + Math.floor(week.index / 52)}
                        data-event-ids={week.events.map((event) => String(event.id)).join(",")}
                        class="w-2 h-2 rounded-[1px] transition-colors cursor-pointer relative group
                        {week.hasEvent
                            ? 'bg-gold hover:bg-gold-muted ring-2 ring-gold/40 z-10'
                            : ''}
                        {!week.hasEvent && week.isEarlier
                            ? 'bg-primary-deep/80 hover:bg-primary-deep'
                            : ''}
                        {!week.hasEvent && !week.isEarlier
                            ? 'bg-muted hover:bg-primary/30'
                            : ''}"
                        onmouseenter={() => (hoveredWeek = week)}
                    ></div>
                {/each}
            </div>

            <!-- Active Hover Info Bar -->
            <!-- Permanent Legend -->
            <div class="mt-8 flex justify-center gap-8 text-sm opacity-60">
                <div class="flex items-center gap-2">
                    <div class="w-3 h-3 bg-primary-deep/80 rounded-[1px]"></div>
                    <span class="text-muted-foreground">Earlier years</span>
                </div>
                <div class="flex items-center gap-2">
                    <div class="w-3 h-3 bg-gold rounded-[1px]"></div>
                    <span class="text-muted-foreground">Recorded events</span>
                </div>
                <div class="flex items-center gap-2">
                    <div
                        class="w-2 h-2 rounded-[1px] bg-muted rounded-[1px]"
                    ></div>
                    <span class="text-muted-foreground">Current &amp; future years</span>
                </div>
            </div>

            <!-- Floating Tooltip -->
            {#if hoveredWeek && hoveredWeek.hasEvent}
                <div
                    class="fixed z-50 bg-card/95 backdrop-blur shadow-xl border border-border rounded-xl p-4 pointer-events-none w-64 animate-in fade-in zoom-in-95 duration-150"
                    style="top: {tooltipY}px; left: {tooltipX}px;"
                >
                    <div
                        class="text-xs uppercase tracking-widest text-muted-foreground font-bold mb-2 pb-2 border-b border-border"
                    >
                        Square {hoveredWeek.index + 1} | {startYear +
                            Math.floor(hoveredWeek.index / 52)}
                    </div>

                    {#each hoveredWeek.events as event}
                        {@const Icon = getIcon(event.type)}
                        <div class="flex items-start gap-2 mb-2 last:mb-0">
                            <Icon
                                size={16}
                                class="text-gold-text shrink-0 mt-1"
                            />
                            <div>
                                <div
                                    class="text-primary-deep dark:text-primary-hover font-bold leading-tight"
                                >
                                    {event.label}
                                </div>
                                {#if event.description}
                                    <p
                                        class="text-xs text-muted-foreground italic mt-0.5 line-clamp-2"
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
        <div class="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
            <table class="w-full">
                <thead class="bg-muted border-b border-border">
                    <tr>
                        <th class="px-4 py-3 text-left text-xs font-bold uppercase text-muted-foreground">Year</th>
                        <th class="px-4 py-3 text-left text-xs font-bold uppercase text-muted-foreground">Label</th>
                        <th class="px-4 py-3 text-left text-xs font-bold uppercase text-muted-foreground">Type</th>
                        <th class="px-4 py-3 text-left text-xs font-bold uppercase text-muted-foreground">Details</th>
                        <th class="px-4 py-3 text-right text-xs font-bold uppercase text-muted-foreground">Actions</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-border">
                    {#each [...lifeEvents].sort((a, b) => a.year - b.year) as event (event.id)}
                        <tr class="hover:bg-muted transition-colors">
                            <td class="px-4 py-3 text-sm font-bold text-muted-foreground">{event.year}</td>
                            <td class="px-4 py-3 font-medium text-foreground">{event.label}</td>
                            <td class="px-4 py-3 text-sm text-muted-foreground">
                                <span class="inline-flex items-center gap-2">
                                    <span class="w-2 h-2 rounded-full {dotClass(event.type)}"></span>
                                    {TYPE_STYLES.find((t) => t.type === event.type)?.label ?? "Future Plan"}
                                </span>
                            </td>
                            <td class="px-4 py-3 text-sm text-muted-foreground max-w-xs truncate">{event.description || ''}</td>
                            <td class="px-4 py-3 text-right">
                                <div class="flex items-center justify-end gap-2">
                                    <button
                                        onclick={() => editEvent(event)}
                                        class="p-1.5 text-muted-foreground hover:text-primary transition-colors"
                                        title="Edit Event"
                                        aria-label="Edit Event"
                                    >
                                        <Pencil size={14} />
                                    </button>
                                    <button
                                        onclick={() => removeEvent(event.id)}
                                        class="p-1.5 text-muted-foreground hover:text-foreground transition-colors"
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
            class="bg-card rounded-2xl shadow-xl border border-border p-8 overflow-hidden relative"
        >
            <!-- Controls -->
            <div class="flex justify-between items-center mb-6">
                <!-- Zoom Control -->
                <div
                    class="flex items-center gap-3 bg-muted px-4 py-2 rounded-xl border border-border"
                >
                    <span class="text-xs font-bold text-muted-foreground uppercase"
                        >Zoom Level</span
                    >
                    <input
                        type="range"
                        min="10"
                        max="100"
                        bind:value={pixelsPerYear}
                        aria-label="Zoom Level"
                        class="w-32 accent-primary cursor-pointer"
                    />
                    <span class="text-xs text-muted-foreground font-mono w-8"
                        >{pixelsPerYear}px</span
                    >
                </div>

                <div class="flex flex-wrap justify-end gap-4 text-sm text-muted-foreground">
                    {#each TYPE_STYLES as t (t.type)}
                        <div class="flex items-center gap-2">
                            <div class="w-2 h-2 rounded-full {t.dot}"></div>
                            <span>{t.label}</span>
                        </div>
                    {/each}
                </div>
            </div>

            <div
                class="overflow-x-auto pb-12 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent"
            >
                <!-- Line -->
                <div
                    class="absolute top-32 left-0 right-0 h-0.5 bg-gradient-to-r from-border via-slate-300 to-border"
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
                                    class="mb-6 opacity-80 group-hover:opacity-100 transition-all -translate-y-1 group-hover:translate-y-0 text-center w-32"
                                >
                                    <div
                                        class="text-sm font-bold text-primary-deep dark:text-primary-hover"
                                    >
                                        {event.label}
                                    </div>
                                    {#if event.assignedContactId}
                                        <div
                                            class="text-[9px] font-bold text-muted-foreground uppercase tracking-tighter truncate px-2"
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
                                        ? 'bg-muted text-muted-foreground border-dashed border-slate-300'
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
                                        class="bg-primary-soft text-primary-hover p-1 rounded-full hover:scale-110 shadow-sm"
                                        title="Edit Event"
                                    >
                                        <Pencil size={12} />
                                    </button>
                                    <button
                                        onclick={(e) => {
                                            e.stopPropagation();
                                            removeEvent(event.id);
                                        }}
                                        class="bg-muted text-muted-foreground hover:text-foreground p-1 rounded-full hover:scale-110 shadow-sm"
                                        title="Delete Event"
                                    >
                                        <Trash2 size={12} />
                                    </button>
                                </div>
                            </div>

                            <!-- Year -->
                            <div
                                class="mt-3 text-xs font-bold text-muted-foreground group-hover:text-primary-deep dark:group-hover:text-primary-hover transition-colors"
                            >
                                {event.year}
                            </div>

                            <!-- Bottom Label (Alternating) -->
                            {#if i % 2 !== 0}
                                <div
                                    class="mt-6 opacity-80 group-hover:opacity-100 transition-all translate-y-1 group-hover:translate-y-0 text-center w-32"
                                >
                                    <div
                                        class="text-sm font-bold text-primary-deep dark:text-primary-hover"
                                    >
                                        {event.label}
                                    </div>
                                    {#if event.assignedContactId}
                                        <div
                                            class="text-[9px] font-bold text-muted-foreground uppercase tracking-tighter truncate px-2"
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
                            class="absolute -top-16 text-xs font-bold uppercase tracking-widest text-primary"
                        >
                            Today
                        </div>
                        <div
                            class="w-0.5 h-32 bg-primary/50 border-l-2 border-dashed border-primary"
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
