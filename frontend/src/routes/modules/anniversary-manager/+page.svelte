<script lang="ts">
    import {
        calendarStore,
        upcomingEvents,
        type AnniversaryEvent,
    } from "$lib/stores/calendarStore";
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
        ChevronRight,
        Tag,
        Clock,
    } from "lucide-svelte";
    import { fade, slide, scale } from "svelte/transition";
    import { quintOut } from "svelte/easing";

    let showAddModal = false;
    let newEvent: Partial<AnniversaryEvent> = {
        title: "",
        date: "",
        type: "birthday",
        description: "",
        ritualInstructions: "",
        recurring: true,
        tags: [],
    };

    const typeIcons = {
        birthday: Sparkles,
        anniversary: Heart,
        passing: Wind,
        ritual: Flame,
    };

    const typeColors = {
        birthday: "bg-amber-100 text-amber-700 border-amber-200",
        anniversary: "bg-rose-100 text-rose-700 border-rose-200",
        passing: "bg-indigo-100 text-indigo-700 border-indigo-200",
        ritual: "bg-emerald-100 text-emerald-700 border-emerald-200",
    };

    function handleAdd() {
        if (!newEvent.title || !newEvent.date) return;
        calendarStore.addEvent(newEvent as Omit<AnniversaryEvent, "id">);
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

    function formatDate(dateStr: string) {
        if (!dateStr.includes("-")) return dateStr;
        const [month, day] = dateStr.split("-");
        const date = new Date(2000, parseInt(month) - 1, parseInt(day));
        return date.toLocaleDateString("en-US", {
            month: "long",
            day: "numeric",
        });
    }
</script>

<div
    class="max-w-5xl mx-auto p-6 md:p-8 space-y-10 animate-in fade-in duration-1000"
>
    <!-- Hero Header -->
    <div
        class="relative rounded-[2.5rem] bg-gradient-to-br from-indigo-900 via-slate-900 to-black p-10 md:p-16 overflow-hidden shadow-2xl"
    >
        <div
            class="absolute top-0 right-0 p-12 opacity-10 blur-xl scale-150 rotate-12"
        >
            <Calendar size={200} class="text-white" />
        </div>

        <div
            class="relative z-10 flex flex-col items-center text-center space-y-6"
        >
            <div
                class="p-4 bg-white/10 backdrop-blur-md rounded-full border border-white/20 shadow-inner"
            >
                <Heart class="w-10 h-10 text-rose-400 fill-rose-400/20" />
            </div>
            <div class="space-y-3 max-w-2xl">
                <h1
                    class="font-serif text-4xl md:text-5xl font-bold text-white tracking-tight"
                >
                    Anniversary Manager
                </h1>
                <p
                    class="text-indigo-200/80 text-lg md:text-xl font-light leading-relaxed"
                >
                    Transforming sensitive dates into intentional moments of
                    connection, healing, and legacy.
                </p>
            </div>
            <button
                on:click={() => (showAddModal = true)}
                class="mt-4 px-8 py-3.5 bg-white text-indigo-900 rounded-full font-bold shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
            >
                <Plus size={20} />
                Add New Remembrance
            </button>
        </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <!-- Upcoming Timeline -->
        <div class="lg:col-span-2 space-y-8">
            <div class="flex items-center justify-between">
                <h2 class="font-serif text-2xl font-bold text-slate-900">
                    Upcoming Moments
                </h2>
                <div
                    class="px-3 py-1 bg-slate-100 rounded-full text-xs font-bold text-slate-500 uppercase tracking-wider"
                >
                    Next 365 Days
                </div>
            </div>

            <div class="space-y-6">
                {#each $upcomingEvents as event (event.id)}
                    <div
                        class="group relative bg-white rounded-3xl p-6 border border-slate-200 shadow-sm hover:shadow-xl hover:border-indigo-200 transition-all duration-500 overflow-hidden"
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

                            <div class="flex-1 space-y-3">
                                <div class="flex items-center justify-between">
                                    <div class="flex items-center gap-3">
                                        <h3
                                            class="font-bold text-xl text-slate-900 uppercase tracking-tight"
                                        >
                                            {event.title}
                                        </h3>
                                        <span
                                            class="text-xs font-bold px-3 py-0.5 rounded-full border {typeColors[
                                                event.type
                                            ]}"
                                        >
                                            {event.type}
                                        </span>
                                    </div>
                                    <button
                                        on:click={() =>
                                            calendarStore.removeEvent(event.id)}
                                        class="opacity-0 group-hover:opacity-100 p-2 text-slate-300 hover:text-rose-500 transition-all"
                                    >
                                        <Trash2 size={18} />
                                    </button>
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
                            <strong>Gentle Pacing:</strong> We don't flood you with
                            notifications. Only intentional reminders.
                        </p>
                    </div>
                    <div class="flex gap-4">
                        <div
                            class="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-2 shrink-0"
                        ></div>
                        <p class="text-sm text-indigo-800/80 leading-relaxed">
                            <strong>Ritual focus:</strong> Dates aren't just deadlines;
                            they are opportunities for rituals.
                        </p>
                    </div>
                </div>
                <div class="pt-4 border-t border-indigo-100 mt-4">
                    <p
                        class="text-[10px] font-bold text-indigo-400 uppercase tracking-widest text-center"
                    >
                        Your Emotional Registry
                    </p>
                </div>
            </div>

            <!-- Ritual Library Preview -->
            <div
                class="bg-white rounded-[2rem] border border-slate-200 p-8 space-y-6 shadow-sm overflow-hidden relative"
            >
                <div
                    class="absolute -bottom-4 -right-4 opacity-5 pointer-events-none"
                >
                    <Flame size={120} />
                </div>

                <h3 class="font-bold text-lg text-slate-900">Ritual Library</h3>
                <div class="space-y-4">
                    {#each ["Sound & Silence", "Elemental Release", "Physical Memorial"] as ritual}
                        <button
                            class="w-full flex items-center justify-between p-4 rounded-xl border border-slate-100 hover:border-indigo-300 hover:bg-slate-50 transition-all group"
                        >
                            <span class="font-medium text-slate-700"
                                >{ritual}</span
                            >
                            <ChevronRight
                                size={16}
                                class="text-slate-300 group-hover:text-indigo-500 group-hover:translate-x-1 transition-all"
                            />
                        </button>
                    {/each}
                </div>
                <p class="text-xs text-slate-400 text-center italic">
                    Curated by Estate Concierge Psychology experts.
                </p>
            </div>
        </div>
    </div>

    <!-- Simple Add Modal -->
    {#if showAddModal}
        <div
            class="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm"
            transition:fade
        >
            <div
                class="bg-white w-full max-w-lg rounded-[2.5rem] p-8 shadow-2xl space-y-6"
                transition:scale={{ start: 0.95, easing: quintOut }}
            >
                <div class="flex items-center justify-between">
                    <h2 class="font-serif text-2xl font-bold text-slate-900">
                        Add Remembrance
                    </h2>
                    <button
                        on:click={() => (showAddModal = false)}
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

                    <div class="grid grid-cols-2 gap-4">
                        <div class="space-y-1">
                            <label
                                for="remembrance-date"
                                class="text-xs font-black uppercase text-slate-400 tracking-widest pl-1"
                                >Date (MM-DD)</label
                            >
                            <input
                                id="remembrance-date"
                                bind:value={newEvent.date}
                                placeholder="10-24"
                                class="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                            />
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
                                <option value="birthday">Birthday</option>
                                <option value="anniversary">Anniversary</option>
                                <option value="passing">Passing</option>
                                <option value="ritual">Ritual</option>
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
                            >Ritual Instructions (Optional)</label
                        >
                        <textarea
                            id="remembrance-instructions"
                            bind:value={newEvent.ritualInstructions}
                            placeholder="Step-by-step guidance for remembrance..."
                            class="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all resize-none h-24 text-sm italic"
                        ></textarea>
                    </div>
                </div>

                <div class="flex gap-4 pt-4">
                    <button
                        on:click={() => (showAddModal = false)}
                        class="flex-1 px-6 py-3.5 border border-slate-200 rounded-2xl font-bold text-slate-600 hover:bg-slate-50 transition-all font-sans"
                    >
                        Cancel
                    </button>
                    <button
                        on:click={handleAdd}
                        class="flex-2 px-10 py-3.5 bg-indigo-600 text-white rounded-2xl font-bold shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all font-sans"
                    >
                        Save Memory
                    </button>
                </div>
            </div>
        </div>
    {/if}
</div>

<style>
    /* Premium Typography */
    :global(h1, h2, .font-serif) {
        font-family: "Outfit", "Inter", serif;
    }
</style>
