<script lang="ts">
    import { fade, fly, slide, scale } from "svelte/transition";
    import {
        Calendar,
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
    } from "lucide-svelte";
    import SmartTextarea from "$lib/components/ui/SmartTextarea.svelte";

    import { timelineStore, type LifeEvent } from "$lib/stores/timelineStore";
    import { familyMembers } from "$lib/stores/familyStore";

    // --- State & Types ---
    // LifeEvent imported from store

    $: getContactById = (id: string | undefined) =>
        $familyMembers.find((m) => m.id === id);

    let showMemento = false;
    let birthYear = 1990;
    let currentYear = new Date().getFullYear();
    let lifeExpectancy = 85;

    // Use store directly
    $: lifeEvents = $timelineStore;

    let showAddModal = false;
    let newEvent: Partial<LifeEvent> & { id?: number } = {
        year: currentYear,
        label: "",
        type: "milestone",
    };

    function saveEvent() {
        if (!newEvent.label || !newEvent.year) return;

        timelineStore.update((events) => {
            let updated;
            if (newEvent.id) {
                // Edit Mode
                updated = events.map((e) =>
                    e.id === newEvent.id ? ({ ...newEvent } as LifeEvent) : e,
                );
            } else {
                // Create Mode
                updated = [
                    ...events,
                    { ...newEvent, id: Date.now() } as LifeEvent,
                ];
            }
            return updated.sort((a, b) => a.year - b.year);
        });

        resetForm();
    }

    function editEvent(event: LifeEvent) {
        newEvent = { ...event };
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
        };
    }

    function removeEvent(id: number) {
        if (!confirm("Remove this event?")) return;
        timelineStore.update((events) => events.filter((e) => e.id !== id));
    }

    // Memento Mori Calculation
    let weeksLived = (currentYear - birthYear) * 52;

    // Dynamic Grid Sizing: Furthest event OR Current Year + 3
    $: maxEventYear =
        lifeEvents.length > 0
            ? Math.max(currentYear, ...lifeEvents.map((e) => e.year))
            : currentYear;
    $: endYear = Math.max(maxEventYear, currentYear + 3);
    $: totalWeeks = (endYear - birthYear) * 52;

    // Zoom State
    let pixelsPerYear = 20;

    function getPosition(year: number) {
        return (year - birthYear) * pixelsPerYear;
    }

    // Reactively calculate Memento Mori Grid Data
    let hoveredWeek: any = null;
    let tooltipX = 0;
    let tooltipY = 0;

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

    $: weeksData = Array.from({ length: totalWeeks }, (_, i) => {
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
    });

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

<div class="max-w-6xl mx-auto p-8 animate-in fade-in duration-500">
    <!-- Add Modal -->
    {#if showAddModal}
        <div
            class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
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
                    <button on:click={resetForm}
                        ><X
                            size={20}
                            class="text-gray-400 hover:text-gray-600"
                        /></button
                    >
                </div>
                <div class="p-6 space-y-4">
                    <div class="space-y-1">
                        <label class="text-xs font-bold uppercase text-gray-400"
                            >Label</label
                        >
                        <input
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
                                class="text-xs font-bold uppercase text-gray-400"
                                >Date</label
                            >
                            <input
                                type="date"
                                value={newEvent.date ||
                                    (newEvent.year
                                        ? `${newEvent.year}-01-01`
                                        : "")}
                                on:input={(e) => {
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
                                class="text-xs font-bold uppercase text-gray-400"
                                >Type</label
                            >
                            <select
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
                        <label class="text-xs font-bold uppercase text-gray-400"
                            >Designated Contact</label
                        >
                        <select
                            bind:value={newEvent.assignedContactId}
                            class="w-full p-2 rounded-lg border focus:ring-2 ring-[#4A7C74] outline-none bg-white text-sm"
                        >
                            <option value={undefined}>No one assigned</option>
                            {#each $familyMembers as member}
                                <option value={member.id}
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
                                    class="text-xs font-bold uppercase text-gray-400"
                                    >Category</label
                                >
                                <select
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
                    <button
                        on:click={saveEvent}
                        class="w-full py-3 bg-[#4A7C74] text-white rounded-xl font-bold mt-2"
                    >
                        {newEvent.id ? "Update Event" : "Add to Timeline"}
                    </button>
                </div>
            </div>
        </div>
    {/if}

    <!-- Header -->
    <div
        class="flex flex-col md:flex-row justify-between items-end mb-12 gap-6"
    >
        <div>
            <div
                class="inline-flex items-center justify-center p-3 bg-purple-100 text-purple-700 rounded-full mb-4"
            >
                <Calendar size={32} />
            </div>
            <h1 class="font-serif font-bold text-4xl text-[#304743] mb-2">
                The Life Timeline
            </h1>
            <p class="text-lg text-muted-foreground">
                Your story isn't just a list of assets. It's a series of
                moments.
            </p>
        </div>

        <div class="flex flex-col items-end gap-4">
            <div class="flex gap-4">
                <button
                    class="px-4 py-2 rounded-lg text-sm font-bold bg-[#4A7C74] text-white shadow-md flex items-center gap-2 hover:bg-[#3b635d]"
                    on:click={() => (showAddModal = true)}
                >
                    <Plus size={16} /> Add Event
                </button>

                <div
                    class="flex items-center gap-2 bg-white p-1 rounded-xl border border-gray-100 shadow-sm"
                >
                    <button
                        class="px-4 py-2 rounded-lg text-sm font-bold transition-all {showMemento
                            ? 'text-gray-500 hover:bg-gray-50'
                            : 'bg-stone-100 text-stone-800'}"
                        on:click={() => (showMemento = false)}
                    >
                        Timeline
                    </button>
                    <button
                        class="px-4 py-2 rounded-lg text-sm font-bold transition-all {showMemento
                            ? 'bg-purple-600 text-white shadow-md'
                            : 'text-gray-500 hover:bg-gray-50'}"
                        on:click={() => (showMemento = true)}
                    >
                        Memento Mori
                    </button>
                </div>
            </div>
        </div>
    </div>

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
                        on:click={() => editEvent(trophy)}
                    >
                        <div
                            class="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2"
                        >
                            <button
                                on:click|stopPropagation={() =>
                                    editEvent(trophy)}
                                class="p-2 bg-amber-50 text-amber-600 rounded-full hover:bg-amber-100"
                            >
                                <Pencil size={14} />
                            </button>
                        </div>

                        <div class="flex items-center gap-2 mb-4">
                            <div
                                class="px-3 py-1 bg-amber-50 text-amber-700 text-[10px] font-black uppercase tracking-tighter rounded-full border border-amber-100"
                            >
                                {trophy.category || "General"}
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
                                        on:click|stopPropagation={() =>
                                            alert(
                                                `Mock Notification: Email sent to ${contact.email} regarding "${trophy.label}"`,
                                            )}
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
            class="bg-white rounded-3xl border border-border shadow-sm p-8"
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

            <div
                class="flex flex-wrap gap-1 justify-center max-h-[600px] overflow-y-auto p-4 custom-scrollbar relative"
                on:mouseleave={() => (hoveredWeek = null)}
                on:mousemove={handleMouseMove}
            >
                {#each weeksData as week (week.index)}
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
                        on:mouseenter={() => (hoveredWeek = week)}
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
                        <div class="flex items-start gap-2 mb-2 last:mb-0">
                            <svelte:component
                                this={getIcon(event.type)}
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
    {:else}
        <!-- Timeline View -->
        <div
            class="bg-white rounded-3xl shadow-xl border border-stone-100 p-8 overflow-hidden relative"
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
                        class="w-32 accent-[#4A7C74] cursor-pointer"
                    />
                    <span class="text-xs text-gray-400 font-mono w-8"
                        >{pixelsPerYear}px</span
                    >
                </div>

                <div class="flex gap-4 text-sm text-gray-400">
                    <div class="flex items-center gap-2">
                        <div class="w-2 h-2 rounded-full bg-purple-500"></div>
                        <span>Milestone</span>
                    </div>
                    <div class="flex items-center gap-2">
                        <div class="w-2 h-2 rounded-full bg-blue-500"></div>
                        <span>Education</span>
                    </div>
                    <div class="flex items-center gap-2">
                        <div class="w-2 h-2 rounded-full bg-emerald-500"></div>
                        <span>Work</span>
                    </div>
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
                    style="width: {(lifeExpectancy + 10) * pixelsPerYear}px"
                >
                    <!-- events logic -->
                    {#each lifeEvents as event, i (event.id)}
                        <div
                            class="absolute top-1/2 -translate-y-1/2 flex flex-col items-center group cursor-pointer w-12 -ml-6 z-10 hover:z-50 transition-all duration-200"
                            style="left: {(event.year - birthYear) *
                                pixelsPerYear}px"
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
                                        : 'bg-[#304743] text-white'}"
                                >
                                    <svelte:component
                                        this={getIcon(event.type)}
                                        size={18}
                                    />
                                </div>
                                <!-- Actions -->
                                <div
                                    class="absolute -top-3 -right-3 flex gap-1 z-20 opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <button
                                        on:click|stopPropagation={() =>
                                            editEvent(event)}
                                        class="bg-blue-100 text-blue-500 p-1 rounded-full hover:scale-110 shadow-sm"
                                        title="Edit Event"
                                    >
                                        <Pencil size={12} />
                                    </button>
                                    <button
                                        on:click|stopPropagation={() =>
                                            removeEvent(event.id)}
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
