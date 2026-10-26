<script lang="ts">
    import { focusTrap } from "$lib/actions/focusTrap";
    import { readCustom } from "$lib/utils/customFields";
    import {
        timeCapsuleStore,
        capsuleStatus,
        COMMON_MILESTONES,
        type TimeCapsuleMessage,
        type ReleaseTrigger,
        isCapsuleReleased,
        timeCapsuleSync,
        capsuleMedia,
        CAPSULE_MEDIA_KEY,
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
        Pencil,
    } from "lucide-svelte";
    import AIPromptBar from "$lib/components/concierge/AIPromptBar.svelte";
    import { onMount } from "svelte";
    import { fade, slide, scale } from "svelte/transition";
    import { quintOut } from "svelte/easing";
    import VideoRecorder from "$lib/components/media/VideoRecorder.svelte";
    import EmptyState from "$lib/components/EmptyState.svelte";
    import { mediaStorage } from "$lib/services/indexedDB";
    import { uploadMedia } from "$lib/services/mediaService";
    import MediaView from "$lib/components/ui/MediaView.svelte";
    import CustomFieldsManager from "$lib/components/ui/CustomFieldsManager.svelte";
    import DataViewToggle from "$lib/components/ui/DataViewToggle.svelte";
    import { userPreferencesStore, type ViewMode } from "$lib/stores/userPreferencesStore.svelte";
    import LivingBlueprintHeader from "$lib/components/LivingBlueprintHeader.svelte";
    import GhostRow from "$lib/components/ui/GhostRow.svelte";
    import { t, language } from "$lib/stores/localization";
    import { getSmartSamples } from "$lib/data/smartSamples";
    import { contactSync } from "$lib/stores/familyStore.svelte";

    let viewMode = $state<ViewMode>('card');
    // A gentle cue until the first server answer, unless this device already holds capsules.
    let firstSyncPending = $derived(timeCapsuleSync.lastSync === null && timeCapsuleSync.status !== "error");
    let isLoading = $derived(firstSyncPending && timeCapsuleSync.items.length === 0);

    // The people in contacts; a capsule can name one of them (recipientContactId).
    let contacts = $derived(contactSync.items);
    /** The contact chosen in the form, as the select's string value ("" for none). */
    let capsuleRecipientId = $state("");

    onMount(() => {
        timeCapsuleStore.sync().catch(() => {});
        contactSync.init().catch(() => {});
    });

    function chooseRecipient(id: string) {
        capsuleRecipientId = id;
        const person = contacts.find((c) => String(c.id) === id);
        if (person && !newMessage.recipient?.trim()) newMessage.recipient = person.name;
    }

    let showAddModal = $state(false);
    let parsedCustomAttributes = $state<Record<string, any>>({});
    let isRecording = $state(false);
    let isUploading = $state(false);
    let formNote = $state<string | null>(null);
    let isSaving = $state(false);
    /** The capsule being edited; null while writing a new one. */
    let editingId = $state<string | null>(null);

    const emptyMessage = (): Partial<TimeCapsuleMessage> => ({
        title: "",
        recipient: "",
        contentPreview: "",
        triggerType: "date",
        triggerValue: "",
        videoUrl: undefined,
        mediaId: undefined,
    });
    let newMessage = $state<Partial<TimeCapsuleMessage>>(emptyMessage());
    let hasVideo = $derived(!!(newMessage.videoUrl || newMessage.mediaId));

    function resetForm() {
        newMessage = emptyMessage();
        parsedCustomAttributes = {};
        capsuleRecipientId = "";
        editingId = null;
        isRecording = false;
        formNote = null;
    }

    function openNew() {
        if (editingId) resetForm(); // a draft of a new capsule stays; an edit does not carry over
        showAddModal = true;
    }

    function openEdit(msg: TimeCapsuleMessage) {
        resetForm();
        editingId = String(msg.id);
        newMessage = {
            title: msg.title,
            recipient: msg.recipient,
            contentPreview: msg.contentPreview ?? "",
            triggerType: msg.triggerType,
            triggerValue: msg.triggerValue,
            videoUrl: msg.videoUrl,
            mediaId: msg.mediaId,
        };
        capsuleRecipientId = msg.recipientContactId != null ? String(msg.recipientContactId) : "";
        parsedCustomAttributes = readCustom(msg);
        activeCapsule = null;
        showAddModal = true;
    }

    function setTrigger(type: ReleaseTrigger) {
        if (newMessage.triggerType === type) return;
        newMessage.triggerType = type;
        // The milestone list shows its first choice, so the value matches what is shown.
        newMessage.triggerValue = type === "milestone" ? COMMON_MILESTONES[0].id : "";
    }

    async function handleAdd() {
        const person = contacts.find((c) => String(c.id) === capsuleRecipientId);
        if (!newMessage.recipient?.trim() && person) newMessage.recipient = person.name;
        if (!newMessage.title || !newMessage.recipient || !newMessage.triggerValue) {
            formNote = "A title, a name and a release moment complete this capsule.";
            return;
        }
        if (isUploading || isSaving) return;

        const fields = {
            title: newMessage.title,
            recipient: newMessage.recipient,
            recipientContactId: person ? Number(person.id) : null,
            contentPreview: newMessage.contentPreview ?? "",
            triggerType: newMessage.triggerType as ReleaseTrigger,
            triggerValue: newMessage.triggerValue,
            videoUrl: newMessage.videoUrl ?? null,
            mediaId: newMessage.mediaId ?? null,
            custom_attributes: JSON.stringify(parsedCustomAttributes),
        } as any;

        isSaving = true;
        try {
            if (editingId) {
                await timeCapsuleStore.updateMessage(editingId, fields);
            } else {
                await timeCapsuleStore.addMessage(fields);
            }
            resetForm();
            showAddModal = false;
        } catch {
            // The sync manager shows a gentle note; the form keeps every word.
        } finally {
            isSaving = false;
        }
    }

    async function handleSaveVideo(event: CustomEvent<{ blob: Blob; duration: number }>) {
        const blob = event.detail.blob;
        isUploading = true;
        formNote = null;
        try {
            const file = new File([blob], "capsule.webm", { type: blob.type || "video/webm" });
            const saved = await uploadMedia(file, "time_capsules", editingId ?? undefined);
            newMessage.videoUrl = saved.download_url;
            newMessage.mediaId = undefined;
            parsedCustomAttributes = {
                ...parsedCustomAttributes,
                [CAPSULE_MEDIA_KEY]: {
                    id: saved.id,
                    mime_type: saved.mime_type,
                    filename: saved.filename,
                    file_size: saved.file_size,
                },
            };
        } catch (e: any) {
            formNote = e?.message || "Your video is taking a moment to save. Record again when you're ready.";
        } finally {
            isUploading = false;
            isRecording = false;
        }
    }

    /** The capsule open in the reader; legacyVideoUrl plays a video kept in this browser. */
    let activeCapsule = $state<TimeCapsuleMessage | null>(null);
    let legacyVideoUrl = $state<string | null>(null);
    let readerNote = $state<string | null>(null);

    async function openCapsule(msg: TimeCapsuleMessage) {
        closeCapsule();
        activeCapsule = msg;
        if (!msg.videoUrl && msg.mediaId) {
            legacyVideoUrl = await mediaStorage.getUrl(msg.mediaId);
            if (!legacyVideoUrl) readerNote = "This video lives in the browser where it was recorded.";
        }
    }

    function closeCapsule() {
        if (legacyVideoUrl) URL.revokeObjectURL(legacyVideoUrl);
        legacyVideoUrl = null;
        readerNote = null;
        activeCapsule = null;
    }

    function getMilestoneLabel(id: string) {
        return COMMON_MILESTONES.find((m) => m.id === id)?.label || id;
    }

    /** "2030-01-01" -> "January 1, 2030" in the reader's locale, read as a local day (no time-zone shift). */
    function formatDate(iso: string) {
        const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso ?? "");
        if (!m) return iso;
        return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])).toLocaleDateString(undefined, {
            year: "numeric",
            month: "long",
            day: "numeric",
        });
    }
</script>

<LivingBlueprintHeader
    title="Time Capsule Vault"
    subtitle="Preserving wisdom, voice, and presence across time"
    tier="legacy"
    detailedDescription="Messages safely locked until the perfect milestone. Record video messages, write letters, or preserve your voice for graduations, weddings, and life's meaningful moments."
    whyMatters="The messages you write here will comfort your loved ones for years to come, in your own words. Imagine your daughter graduating, getting married, or having her first child—and finding your voice waiting for her at each milestone."
>
    <div class="flex items-center gap-3">
        <DataViewToggle module="time-capsule" onchange={(mode) => viewMode = mode} />
        <button
            on:click={openNew}
            class="px-8 py-4 bg-indigo-600 text-white rounded-full font-bold shadow-xl shadow-indigo-200 hover:bg-indigo-700 hover:scale-105 transition-all flex items-center gap-3 shrink-0"
        >
            <Plus size={24} />
            Seal New Message
        </button>
    </div>
</LivingBlueprintHeader>

{#if isLoading}
    <div class="flex flex-col items-center justify-center gap-3 py-16" role="status" data-testid="capsules-loading">
        <Loader2 class="w-8 h-8 animate-spin text-indigo-500" />
        <p class="text-sm text-slate-500">Gathering your messages…</p>
    </div>
{:else}
<div
    class="max-w-6xl mx-auto p-6 md:p-8 space-y-10 animate-in fade-in duration-700"
>

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
                    <div class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                            on:click={() => openEdit(msg)}
                            aria-label="Edit this capsule"
                            class="p-2 text-slate-300 hover:text-indigo-600 transition-colors"
                        >
                            <Pencil size={16} />
                        </button>
                        <button
                            on:click={() => timeCapsuleStore.removeMessage(msg.id)}
                            aria-label="Remove this capsule"
                            class="p-2 text-slate-300 hover:text-rose-500 transition-colors"
                        >
                            <Trash2 size={16} />
                        </button>
                    </div>
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
                    {#if msg.contentPreview}
                        <p class="text-sm text-slate-500 italic line-clamp-2">
                            "{msg.contentPreview}"
                        </p>
                    {/if}
                    {#if msg.videoUrl || msg.mediaId}
                        <p class="text-xs font-bold text-indigo-600 flex items-center gap-2 {msg.contentPreview ? 'mt-2' : ''}">
                            <Video size={14} /> Video message
                        </p>
                    {/if}
                </div>

                <div class="flex gap-2">
                    <button
                        on:click={() => openCapsule(msg)}
                        class="flex-1 py-2 text-sm font-bold text-indigo-700 bg-white border border-indigo-100 rounded-xl hover:bg-indigo-50 transition-all"
                    >
                        {msg.videoUrl || msg.mediaId ? "Watch" : "Read"}
                    </button>
                    {#if msg.triggerType === "milestone"}
                        <button
                            on:click={() => timeCapsuleStore.releaseMessage(String(msg.id))}
                            class="flex-1 py-2 text-sm font-bold text-emerald-700 bg-white border border-emerald-100 rounded-xl hover:bg-emerald-50 transition-all"
                        >
                            Milestone reached
                        </button>
                    {/if}
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
                                class="text-xs font-bold tracking-wide"
                                data-testid="capsule-date"
                                >{formatDate(msg.triggerValue)}</span
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
                    <button
                        on:click={() => openEdit(msg)}
                        aria-label="Edit this capsule"
                        class="p-2 text-slate-300 hover:text-emerald-700 transition-colors opacity-0 group-hover:opacity-100"
                    >
                        <Pencil size={16} />
                    </button>
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
                    on:click={() => openCapsule(msg)}
                    class="w-full py-3 bg-emerald-600 text-white rounded-2xl font-bold hover:bg-emerald-700 transition-all flex items-center justify-center gap-2"
                >
                    <Video size={18} />
                    {msg.videoUrl || msg.mediaId ? "Play Message" : "View Message"}
                </button>
            </div>
        {/each}

        {#if $timeCapsuleStore.length === 0}
            <div class="md:col-span-2 lg:col-span-3">
                <EmptyState
                    title="Words waiting to be written"
                    whyMatters="<strong>The messages you write here will comfort your loved ones for years to come, in your own words.</strong> Imagine your daughter graduating, getting married, or having her first child—and finding your voice waiting for her at each milestone.<br/><br/>Each one is your presence at a moment that matters, and proof that you thought about their future and cared enough to speak across time."
                    encouragement="Start with one person and one moment. The rest will come when you're ready."
                    icon={MessageSquare}
                    iconClass="text-purple-500"
                    ctaLabel="Write your first message"
                    onAction={openNew}
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
                                    openNew();
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
                on:click={openNew}
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
                                    {msg.triggerType === 'milestone' ? getMilestoneLabel(msg.triggerValue) : formatDate(msg.triggerValue)}
                                </span>
                            </td>
                            <td class="px-4 py-3">
                                <span class="px-2 py-1 rounded text-xs font-bold {$capsuleStatus.unlocked.includes(msg) ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-500'}">
                                    {$capsuleStatus.unlocked.includes(msg) ? 'Unlocked' : 'Locked'}
                                </span>
                            </td>
                            <td class="px-4 py-3 text-slate-500 text-sm max-w-[200px] truncate">{msg.contentPreview || '-'}</td>
                            <td class="px-4 py-3 text-right whitespace-nowrap">
                                <button
                                    on:click={() => openEdit(msg)}
                                    aria-label="Edit this capsule"
                                    class="opacity-0 group-hover:opacity-100 p-1 text-slate-300 hover:text-indigo-600 transition-all"
                                >
                                    <Pencil size={16} />
                                </button>
                                <button aria-label="Remove this item"
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
                    Your first message will appear here, ready for the moment you choose.
                </div>
            {/if}
        </div>
    {/if}

    <!-- Modal for New Capsule -->
    {#if showAddModal}
        <div role="dialog" aria-modal="true" use:focusTrap={{ onEscape: () => (showAddModal = false) }}
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
                                {editingId ? "Revisit This Capsule" : "Speak Across Time"}
                            </h2>
                        </div>
                        <p class="text-slate-500 text-sm leading-relaxed pl-16">
                            These words will find their way to someone you love at exactly the right moment—a graduation, a wedding, a milestone worth celebrating. This is your presence, preserved.
                        </p>
                    </div>
                    <button
                        on:click={() => (showAddModal = false)}
                        aria-label="Close"
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
                        <label for="capsule-recipient-contact" class="sr-only">The person in your contacts</label>
                        <select
                            id="capsule-recipient-contact"
                            value={capsuleRecipientId}
                            on:change={(e) => chooseRecipient(e.currentTarget.value)}
                            class="w-full mt-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm text-slate-700"
                        >
                            <option value="">Choose them from your contacts</option>
                            {#each contacts as contact (contact.id)}
                                <option value={String(contact.id)}
                                    >{contact.name}{contact.relation ? ` (${contact.relation})` : ""}</option
                                >
                            {/each}
                        </select>
                        {#if contacts.length === 0}
                            <p class="text-[11px] text-slate-500 pl-1">
                                People you add in <a href="/modules/contacts" class="text-indigo-600 underline">Contacts</a> appear here.
                            </p>
                        {/if}
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
                                on:click={() => setTrigger("date")}
                                class="flex-1 py-3 px-4 rounded-xl border-2 transition-all font-bold text-sm {newMessage.triggerType ===
                                'date'
                                    ? 'bg-indigo-50 border-indigo-600 text-indigo-700'
                                    : 'bg-transparent border-slate-100 text-slate-400'}"
                            >
                                <Calendar size={16} class="inline mr-2" />
                                Date
                            </button>
                            <button
                                on:click={() => setTrigger("milestone")}
                                class="flex-1 py-3 px-4 rounded-xl border-2 transition-all font-bold text-sm {newMessage.triggerType ===
                                'milestone'
                                    ? 'bg-indigo-50 border-indigo-600 text-indigo-700'
                                    : 'bg-transparent border-slate-100 text-slate-400'}"
                            >
                                <MilestoneIcon size={16} class="inline mr-2" />
                                Milestone
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

                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {#if isRecording}
                            <div class="md:col-span-2 space-y-2">
                                <VideoRecorder on:save={handleSaveVideo} />
                                {#if isUploading}
                                    <p class="text-sm text-slate-500 flex items-center gap-2">
                                        <Loader2 size={16} class="animate-spin" /> Keeping your video safe…
                                    </p>
                                {/if}
                            </div>
                        {:else if hasVideo}
                            <div
                                class="p-6 bg-emerald-50 rounded-2xl border border-emerald-100 flex flex-col justify-center gap-3"
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
                                        isRecording = true;
                                        formNote = null;
                                    }}
                                    class="self-start text-xs font-bold text-emerald-600 hover:underline"
                                >
                                    Re-record
                                </button>
                            </div>
                        {:else}
                            <button
                                on:click={() => {
                                    isRecording = true;
                                    formNote = null;
                                }}
                                class="p-6 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center gap-3 text-slate-400 hover:border-indigo-300 hover:text-indigo-600 transition-all"
                            >
                                <Video size={32} />
                                <span class="text-xs font-bold uppercase"
                                    >Record Video</span
                                >
                            </button>
                        {/if}
                        <textarea
                            bind:value={newMessage.contentPreview}
                            placeholder="Your written words, in your own voice..."
                            class="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl min-h-32 focus:ring-2 focus:ring-indigo-500 outline-none font-medium resize-none {isRecording ? 'md:col-span-2' : ''}"
                        ></textarea>
                    </div>
                </div>

                <!-- Custom Fields -->
                <div class="pt-4 mt-4 border-t border-slate-200">
                    <CustomFieldsManager
                        entityType="timecapsule"
                        bind:data={parsedCustomAttributes}
                    />
                </div>

                {#if formNote}
                    <p class="text-sm text-indigo-700 bg-indigo-50 rounded-xl px-4 py-3">{formNote}</p>
                {/if}

                <div class="flex gap-4">
                    <button
                        on:click={() => {
                            resetForm();
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
                        disabled={isUploading || isSaving}
                        class="flex-2 py-4 px-10 bg-indigo-900 text-white rounded-2xl font-bold shadow-xl shadow-indigo-100 hover:bg-indigo-950 transition-all disabled:opacity-60"
                    >
                        {editingId ? "Save Changes" : "Seal Capsule"}
                    </button>
                </div>
            </div>
        </div>
    {/if}

    <!-- Capsule Reader -->
    {#if activeCapsule}
        <div role="dialog" aria-modal="true" use:focusTrap={{ onEscape: closeCapsule }}
            class="fixed inset-0 z-[100] bg-slate-900/80 backdrop-blur-xl flex items-center justify-center p-4"
            transition:fade
        >
            <div class="relative w-full max-w-3xl bg-white rounded-[2rem] shadow-2xl p-8 space-y-5 max-h-[90vh] overflow-y-auto">
                <button
                    on:click={closeCapsule}
                    aria-label="Close"
                    class="absolute top-5 right-5 p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-all"
                >
                    <X size={24} />
                </button>
                <div class="space-y-1 pr-10">
                    <h2 class="font-serif text-2xl font-bold text-slate-900">{activeCapsule.title}</h2>
                    <p class="text-xs font-black uppercase text-slate-400 tracking-widest flex items-center gap-2">
                        <User size={12} /> For <span class="text-slate-600">{activeCapsule.recipient}</span>
                        <span class="text-slate-300">·</span>
                        {isCapsuleReleased(activeCapsule) ? "Released" : "Locked"}
                    </p>
                </div>
                {#if activeCapsule.videoUrl}
                    <div class="rounded-2xl overflow-hidden border border-slate-100">
                        <MediaView src={activeCapsule.videoUrl} record={capsuleMedia(activeCapsule)} />
                    </div>
                {:else if legacyVideoUrl}
                    <div class="rounded-2xl overflow-hidden bg-black aspect-video">
                        <!-- svelte-ignore a11y_media_has_caption -->
                        <video src={legacyVideoUrl} controls class="w-full h-full"></video>
                    </div>
                {/if}
                {#if readerNote}
                    <p class="text-sm text-slate-500">{readerNote}</p>
                {/if}
                {#if activeCapsule.contentPreview}
                    <p class="text-slate-700 leading-relaxed whitespace-pre-wrap">{activeCapsule.contentPreview}</p>
                {/if}
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
