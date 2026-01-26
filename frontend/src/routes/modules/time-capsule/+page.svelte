<script lang="ts">
    import {
        timeCapsuleStore,
        capsuleStatus,
        COMMON_MILESTONES,
        type TimeCapsuleMessage,
        type ReleaseTrigger,
    } from "$lib/stores/timeCapsuleStore.svelte";
    import {
        Lock,
        Unlock,
        Video,
        Mic,
        Plus,
        Trash2,
        Clock,
        Milestone as MilestoneIcon,
        Calendar,
        MessageSquare,
        User,
        ExternalLink,
        ShieldCheck,
        X,
        Loader2,
        Sparkles,
    } from "lucide-svelte";
    import AIPromptBar from "$lib/components/concierge/AIPromptBar.svelte";
    import { onMount } from "svelte";
    import { fade, slide, scale } from "svelte/transition";
    import { quintOut } from "svelte/easing";
    import VideoRecorder from "$lib/components/media/VideoRecorder.svelte";
    import EmptyState from "$lib/components/EmptyState.svelte";
    import { mediaStorage } from "$lib/services/indexedDB";
    import CustomFieldsManager from "$lib/components/ui/CustomFieldsManager.svelte";
    import DataViewToggle from "$lib/components/ui/DataViewToggle.svelte";
    import { userPreferencesStore, type ViewMode } from "$lib/stores/userPreferencesStore.svelte";
    import LivingBlueprintHeader from "$lib/components/LivingBlueprintHeader.svelte";
    import GhostRow from "$lib/components/ui/GhostRow.svelte";
    import { t, language } from "$lib/stores/localization";
    import { getSmartSamples } from "$lib/data/smartSamples";
    import Affirmation from "$lib/components/Affirmation.svelte";

    let viewMode = $state<ViewMode>('card');
    let showAffirmation = $state(false);
    let isLoading = $state(true);

    onMount(async () => {
        await timeCapsuleStore.sync?.();
        isLoading = false;
    });

    let showAddModal = $state(false);
    let parsedCustomAttributes = $state<Record<string, any>>({});
    let isRecording = $state(false);
    let recordedMediaId = $state<string | null>(null);
    let newMessage = $state<Partial<TimeCapsuleMessage>>({
        title: "",
        recipient: "",
        contentPreview: "",
        triggerType: "date",
        triggerValue: "",
    });

    async function handleAdd() {
        if (
            !newMessage.title ||
            !newMessage.recipient ||
            !newMessage.triggerValue
        )
            return;

        const messageToAdd = {
            ...newMessage,
            mediaId: recordedMediaId,
            custom_attributes: JSON.stringify(parsedCustomAttributes),
        };

        timeCapsuleStore.addMessage(messageToAdd as any);

        // Reset
        newMessage = {
            title: "",
            recipient: "",
            contentPreview: "",
            triggerType: "date",
            triggerValue: "",
        };
        recordedMediaId = null;
        isRecording = false;
        showAddModal = false;
        parsedCustomAttributes = {};
        showAffirmation = true;
    }

    async function handleSaveVideo(event: CustomEvent<Blob>) {
        const id = crypto.randomUUID();
        await mediaStorage.save(id, event.detail);
        recordedMediaId = id;
        isRecording = false;
    }

    let activeVideoUrl = $state<string | null>(null);
    async function playVideo(mediaId: string) {
        if (!mediaId) return;
        const url = await mediaStorage.getUrl(mediaId);
        if (url) {
            activeVideoUrl = url;
        } else {
            alert("Video file not found in local storage.");
        }
    }

    function getMilestoneLabel(id: string) {
        return COMMON_MILESTONES.find((m) => m.id === id)?.label || id;
    }

    function formatDate(iso: string) {
        return new Date(iso).toLocaleDateString();
    }
</script>

<LivingBlueprintHeader
    title="Time Capsule Vault"
    subtitle="Preserving wisdom, voice, and presence across time"
    tier="legacy"
    detailedDescription="Messages safely locked until the perfect milestone. Record video messages, write letters, or preserve your voice for graduations, weddings, and life's meaningful moments."
    whyMatters="The messages you write here will comfort your loved ones when you're no longer here to say them yourself. Imagine your daughter graduating, getting married, or having her first child—and finding your voice waiting for her at each milestone."
>
    <div class="flex items-center gap-3">
        <DataViewToggle module="time-capsule" onchange={(mode) => viewMode = mode} />
        <button
            on:click={() => (showAddModal = true)}
            class="px-8 py-4 bg-indigo-600 text-white rounded-full font-bold shadow-xl shadow-indigo-200 hover:bg-indigo-700 hover:scale-105 transition-all flex items-center gap-3 shrink-0"
        >
            <Plus size={24} />
            Seal New Message
        </button>
    </div>
</LivingBlueprintHeader>

{#if isLoading}
    <div class="flex items-center justify-center py-12">
        <Loader2 class="w-8 h-8 animate-spin text-primary" />
    </div>
{:else}
<div
    class="max-w-6xl mx-auto p-6 md:p-8 space-y-10 animate-in fade-in duration-700"
>
    <!-- Affirmation Message -->
    <Affirmation module="timeCapsule" bind:show={showAffirmation} />

    <!-- AI Concierge Drafting Assistant -->
    <AIPromptBar
        context="letters"
        prompts={[
            "Help me write a message to my daughter for her wedding...",
            "Draft words of wisdom for my grandchild's graduation...",
            "Write a letter expressing my love and hopes for the future...",
            "Create a meaningful message for my spouse to read later..."
        ]}
    />

    <!-- Active Capsules Grid -->
    {#if viewMode === 'card'}
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <!-- Locked Capsules -->
        {#each $capsuleStatus.locked as msg (msg.id)}
            <div
                class="group flex flex-col bg-slate-100/50 border border-slate-200 rounded-[2rem] p-6 space-y-4 hover:bg-white hover:border-indigo-300 transition-all duration-500"
                transition:scale
            >
                <div class="flex items-start justify-between">
                    <div
                        class="p-3 bg-white rounded-2xl shadow-sm text-slate-400 group-hover:text-indigo-600 transition-colors"
                    >
                        <Lock size={20} />
                    </div>
                    <button
                        on:click={() => timeCapsuleStore.removeMessage(msg.id)}
                        class="p-2 text-slate-300 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100"
                    >
                        <Trash2 size={16} />
                    </button>
                </div>

                <div class="space-y-1">
                    <h3
                        class="font-serif font-bold text-xl text-slate-900 group-hover:text-indigo-600 transition-colors"
                    >
                        {msg.title}
                    </h3>
                    <p
                        class="text-xs font-black uppercase text-slate-400 tracking-widest flex items-center gap-2"
                    >
                        <User size={12} />
                        Recipient:
                        <span class="text-slate-600">{msg.recipient}</span>
                    </p>
                </div>

                <div
                    class="p-4 bg-white/60 rounded-xl border border-slate-100 group-hover:border-indigo-100 transition-colors"
                >
                    <p class="text-sm text-slate-500 italic line-clamp-2">
                        "{msg.contentPreview}"
                    </p>
                </div>

                <div
                    class="pt-4 border-t border-slate-200 flex items-center justify-between"
                >
                    <div class="flex items-center gap-2 text-amber-600">
                        {#if msg.triggerType === "milestone"}
                            <MilestoneIcon size={16} />
                            <span
                                class="text-xs font-bold uppercase tracking-wider"
                                >{getMilestoneLabel(msg.triggerValue)}</span
                            >
                        {:else}
                            <Calendar size={16} />
                            <span
                                class="text-xs font-bold uppercase tracking-wider"
                                >{msg.triggerValue}</span
                            >
                        {/if}
                    </div>
                    <span
                        class="text-[10px] font-black uppercase text-slate-400 tracking-widest"
                        >Locked</span
                    >
                </div>
            </div>
        {/each}

        <!-- Unlocked Capsules (Success State) -->
        {#each $capsuleStatus.unlocked as msg (msg.id)}
            <div
                class="group flex flex-col bg-emerald-50/50 border border-emerald-200 rounded-[2rem] p-6 space-y-4 hover:shadow-lg transition-all"
                transition:scale
            >
                <div class="flex items-start justify-between">
                    <div
                        class="p-3 bg-white rounded-2xl shadow-sm text-emerald-600"
                    >
                        <Unlock size={20} />
                    </div>
                </div>

                <div class="space-y-1">
                    <h3
                        class="font-serif font-bold text-xl text-slate-900 group-hover:text-emerald-700"
                    >
                        {msg.title}
                    </h3>
                    <p
                        class="text-xs font-black uppercase text-emerald-600 tracking-widest flex items-center gap-2"
                    >
                        <Unlock size={12} />
                        Available Now
                    </p>
                </div>

                <div class="p-4 bg-white rounded-xl border border-emerald-100">
                    <p class="text-sm text-slate-700 line-clamp-2">
                        {msg.contentPreview}
                    </p>
                </div>

                <button
                    on:click={() =>
                        msg.mediaId ? playVideo(msg.mediaId) : null}
                    class="w-full py-3 bg-emerald-600 text-white rounded-2xl font-bold hover:bg-emerald-700 transition-all flex items-center justify-center gap-2"
                >
                    <Video size={18} />
                    {msg.mediaId ? "Play Message" : "View Message"}
                </button>
            </div>
        {/each}

        {#if $timeCapsuleStore.length === 0}
            <div class="md:col-span-2 lg:col-span-3">
                <EmptyState
                    title="Words waiting to be written"
                    whyMatters="<strong>The messages you write here will comfort your loved ones when you're no longer here to say them yourself.</strong> Imagine your daughter graduating, getting married, or having her first child—and finding your voice waiting for her at each milestone.<br/><br/>These aren't just letters. They're your presence at moments you can't physically attend. They're proof that you thought about their future, that you cared enough to speak across time."
                    encouragement="You don't need to write them all today. Start with just one person, one moment. The rest will come when you're ready."
                    icon={MessageSquare}
                    iconClass="text-purple-500"
                    ctaLabel="Write your first message"
                    onAction={() => (showAddModal = true)}
                />

                <!-- Sample Data GhostRows -->
                <div class="mt-8">
                    <p class="text-xs font-bold uppercase text-slate-400 tracking-widest mb-4 text-center">Example entries to inspire you</p>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 opacity-60">
                        {#each getSmartSamples($language).timeCapsule || [] as sample}
                            <GhostRow
                                name={sample.title}
                                subtitle={`For ${sample.recipient} - ${sample.contentPreview}`}
                                type={sample.triggerType === 'milestone' ? 'Milestone' : 'Date'}
                                onClick={() => {
                                    newMessage = {
                                        ...newMessage,
                                        title: sample.title,
                                        recipient: sample.recipient,
                                        contentPreview: sample.contentPreview,
                                        triggerType: sample.triggerType,
                                        triggerValue: sample.triggerValue
                                    };
                                    showAddModal = true;
                                }}
                            >
                                <svelte:fragment slot="icon">
                                    <Lock size={20} class="text-slate-400" />
                                </svelte:fragment>
                            </GhostRow>
                        {/each}
                    </div>
                </div>
            </div>
            <button
                on:click={() => (showAddModal = true)}
                class="px-8 py-3.5 bg-indigo-600 text-white rounded-full font-bold shadow-lg hover:shadow-indigo-200 transition-all flex items-center mx-auto gap-2"
            >
                <Plus size={20} />
                Begin a Legacy
            </button>
        {/if}
    </div>
    {:else}
        <!-- Table View -->
        <div class="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <table class="w-full">
                <thead class="bg-slate-50 border-b border-slate-200">
                    <tr>
                        <th class="text-left px-4 py-3 text-xs font-bold uppercase text-slate-500">Title</th>
                        <th class="text-left px-4 py-3 text-xs font-bold uppercase text-slate-500">Recipient</th>
                        <th class="text-left px-4 py-3 text-xs font-bold uppercase text-slate-500">Trigger</th>
                        <th class="text-left px-4 py-3 text-xs font-bold uppercase text-slate-500">Status</th>
                        <th class="text-left px-4 py-3 text-xs font-bold uppercase text-slate-500">Preview</th>
                        <th class="text-right px-4 py-3 text-xs font-bold uppercase text-slate-500">Actions</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-slate-100">
                    {#each [...$capsuleStatus.locked, ...$capsuleStatus.unlocked] as msg (msg.id)}
                        <tr class="hover:bg-slate-50 transition-colors group">
                            <td class="px-4 py-3 font-medium text-slate-800">{msg.title}</td>
                            <td class="px-4 py-3 text-slate-600">{msg.recipient}</td>
                            <td class="px-4 py-3">
                                <span class="text-xs font-medium text-amber-600">
                                    {msg.triggerType === 'milestone' ? getMilestoneLabel(msg.triggerValue) : msg.triggerValue}
                                </span>
                            </td>
                            <td class="px-4 py-3">
                                <span class="px-2 py-1 rounded text-xs font-bold {$capsuleStatus.unlocked.includes(msg) ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-500'}">
                                    {$capsuleStatus.unlocked.includes(msg) ? 'Unlocked' : 'Locked'}
                                </span>
                            </td>
                            <td class="px-4 py-3 text-slate-500 text-sm max-w-[200px] truncate">{msg.contentPreview || '-'}</td>
                            <td class="px-4 py-3 text-right">
                                <button
                                    on:click={() => timeCapsuleStore.removeMessage(msg.id)}
                                    class="opacity-0 group-hover:opacity-100 p-1 text-slate-300 hover:text-rose-500 transition-all"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </td>
                        </tr>
                    {/each}
                </tbody>
            </table>
            {#if $timeCapsuleStore.length === 0}
                <div class="p-8 text-center text-slate-500">
                    No time capsules yet. Create your first message to preserve your voice across time.
                </div>
            {/if}
        </div>
    {/if}

    <!-- Modal for New Capsule -->
    {#if showAddModal}
        <div
            class="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md"
            transition:fade
        >
            <div
                class="bg-white w-full max-w-2xl rounded-[3rem] p-10 shadow-2xl space-y-8"
                transition:scale={{ start: 0.95, easing: quintOut }}
            >
                <div class="flex items-start justify-between">
                    <div class="flex-1 pr-6">
                        <div class="flex items-center gap-4 mb-3">
                            <div
                                class="p-3 bg-indigo-50 text-indigo-600 rounded-2xl"
                            >
                                <Plus size={24} />
                            </div>
                            <h2
                                class="font-serif text-3xl font-bold text-slate-900 tracking-tight"
                            >
                                Speak Across Time
                            </h2>
                        </div>
                        <p class="text-slate-500 text-sm leading-relaxed pl-16">
                            These words will find their way to someone you love at exactly the right moment—a graduation, a wedding, a milestone you won't be there to witness. This is your presence, preserved.
                        </p>
                    </div>
                    <button
                        on:click={() => (showAddModal = false)}
                        class="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400"
                    >
                        <X />
                    </button>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div class="space-y-1">
                        <label
                            class="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] pl-1"
                            >Message Title</label
                        >
                        <input
                            bind:value={newMessage.title}
                            placeholder="e.g., Graduation Heart-to-Heart"
                            class="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none font-medium"
                        />
                    </div>
                    <div class="space-y-1">
                        <label
                            class="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] pl-1"
                            >Who is this for?</label
                        >
                        <input
                            bind:value={newMessage.recipient}
                            placeholder="e.g., Emily (Daughter)"
                            class="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none font-medium"
                        />
                    </div>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div class="space-y-1">
                        <label
                            class="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] pl-1"
                            >Release Type</label
                        >
                        <div class="flex gap-2">
                            <button
                                on:click={() =>
                                    (newMessage.triggerType = "date")}
                                class="flex-1 py-3 px-4 rounded-xl border-2 transition-all font-bold text-sm {newMessage.triggerType ===
                                'date'
                                    ? 'bg-indigo-50 border-indigo-600 text-indigo-700'
                                    : 'bg-transparent border-slate-100 text-slate-400'}"
                            >
                                <Calendar size={16} class="inline mr-2" />
                            </button>
                            <button
                                on:click={() =>
                                    (newMessage.triggerType = "milestone")}
                                class="flex-1 py-3 px-4 rounded-xl border-2 transition-all font-bold text-sm {newMessage.triggerType ===
                                'milestone'
                                    ? 'bg-indigo-50 border-indigo-600 text-indigo-700'
                                    : 'bg-transparent border-slate-100 text-slate-400'}"
                            >
                                <MilestoneIcon size={16} class="inline mr-2" />
                            </button>
                        </div>
                    </div>
                    <div class="space-y-1">
                        <label
                            class="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] pl-1"
                            >Release Condition</label
                        >
                        {#if newMessage.triggerType === "date"}
                            <input
                                type="date"
                                bind:value={newMessage.triggerValue}
                                class="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none font-medium"
                            />
                        {:else}
                            <select
                                bind:value={newMessage.triggerValue}
                                class="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none font-medium appearance-none"
                            >
                                {#each COMMON_MILESTONES as stone}
                                    <option value={stone.id}
                                        >{stone.label}</option
                                    >
                                {/each}
                            </select>
                        {/if}
                    </div>
                </div>

                <div class="space-y-4">
                    <label
                        class="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] pl-1"
                        >Legacy Content</label
                    >

                    {#if isRecording}
                        <VideoRecorder on:save={handleSaveVideo} />
                    {:else if recordedMediaId}
                        <div
                            class="p-6 bg-emerald-50 rounded-2xl border border-emerald-100 flex items-center justify-between"
                        >
                            <div
                                class="flex items-center gap-3 text-emerald-700"
                            >
                                <ShieldCheck size={24} />
                                <span class="font-bold"
                                    >Video Message Recorded</span
                                >
                            </div>
                            <button
                                on:click={() => {
                                    recordedMediaId = null;
                                    isRecording = true;
                                }}
                                class="text-xs font-bold text-emerald-600 hover:underline"
                            >
                                Re-record
                            </button>
                        </div>
                    {:else}
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <button
                                on:click={() => (isRecording = true)}
                                class="p-6 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center gap-3 text-slate-400 hover:border-indigo-300 hover:text-indigo-600 transition-all"
                            >
                                <Video size={32} />
                                <span class="text-xs font-bold uppercase"
                                    >Record Video</span
                                >
                            </button>
                            <textarea
                                bind:value={newMessage.contentPreview}
                                placeholder="Or type a written legacy note..."
                                class="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl h-full focus:ring-2 focus:ring-indigo-500 outline-none font-medium resize-none"
                            ></textarea>
                        </div>
                    {/if}
                </div>

                <!-- Custom Fields -->
                <div class="pt-4 mt-4 border-t border-slate-200">
                    <CustomFieldsManager
                        entityType="timecapsule"
                        bind:data={parsedCustomAttributes}
                    />
                </div>

                <div class="flex gap-4">
                    <button
                        on:click={() => {
                            newMessage = {
                                title: "",
                                recipient: "",
                                contentPreview: "",
                                triggerType: "date",
                                triggerValue: "",
                            };
                            showAddModal = false;
                        }}
                        class="px-6 py-4 border border-slate-200 rounded-2xl font-bold text-slate-500 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-100 transition-all"
                    >
                        Cancel
                    </button>
                    <button
                        on:click={() => (showAddModal = false)}
                        class="flex-1 py-4 px-6 border border-slate-200 rounded-2xl font-bold text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition-all"
                    >
                        Save Draft
                    </button>
                    <button
                        on:click={handleAdd}
                        class="flex-2 py-4 px-10 bg-indigo-900 text-white rounded-2xl font-bold shadow-xl shadow-indigo-100 hover:bg-indigo-950 transition-all"
                    >
                        Seal Capsule
                    </button>
                </div>
            </div>
        </div>
    {/if}

    <!-- Video Player Overlay -->
    {#if activeVideoUrl}
        <div
            class="fixed inset-0 z-[100] bg-black/90 backdrop-blur-xl flex items-center justify-center p-4"
            transition:fade
        >
            <button
                on:click={() => {
                    URL.revokeObjectURL(activeVideoUrl!);
                    activeVideoUrl = null;
                }}
                class="absolute top-8 right-8 p-4 bg-white/10 hover:bg-white/20 rounded-full text-white transition-all"
            >
                <X size={32} />
            </button>
            <div
                class="w-full max-w-4xl aspect-video rounded-2xl overflow-hidden shadow-2xl bg-black"
            >
                <video
                    src={activeVideoUrl}
                    controls
                    autoplay
                    class="w-full h-full"
                ></video>
            </div>
        </div>
    {/if}
</div>
{/if}

<style>
    :global(body) {
        background-color: #f8fafc;
    }
</style>
