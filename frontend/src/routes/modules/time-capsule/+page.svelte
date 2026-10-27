<script lang="ts">
    import { focusTrap } from "$lib/actions/focusTrap";
    import { askConfirm } from "$lib/components/ui/ConfirmModal.svelte";
    import { milestoneLabel } from "$lib/utils/milestones";
    import { activeAccountId } from "$lib/stores/keyringStore";
    import { auth } from "$lib/stores/auth";
    import { getStored, setStored, cacheStorageState, retryStored } from "$lib/stores/persistence";
    import { captureSession, isCurrentSession, type SessionOwnership } from "$lib/services/sessionOwnership";
    import { get } from "svelte/store";
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
    import { onMount, untrack } from "svelte";
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

    let viewMode = $derived<ViewMode>(userPreferencesStore.getViewMode('time-capsule'));
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

    // Drafts belong to the authenticated account, including an in-page copy when its device
    // write pauses. The owner namespace preserves the existing per-account draft behavior.
    const DRAFT_KEY = "capsule_draft";
    type CapsuleDraft = {
        message: Partial<TimeCapsuleMessage>;
        recipientId: string;
        custom: Record<string, any>;
    };
    const openDrafts = new Map<string, { draft: CapsuleDraft; preserve: boolean }>();
    let draftAccount: string | null = null;
    let draftOwner: SessionOwnership | null = null;
    // Empty values can be deliberate edits. Presence of words cannot decide whether a
    // retried device read may replace the current form.
    let draftRevision = 0;
    let draftHasCurrent = false;
    const markDraftEdited = () => { draftRevision++; };
    const preserveCurrentDraft = () => draftHasCurrent || draftRevision > 0;
    let draftNote = $state<string | null>(null);
    let draftNeedsRead = $state(false);
    let draftNeedsRetry = $state(false);
    const memoryDraftNote = "Your draft is here in this open page. Keep this page open, then choose Try Again to save it on this device.";
    const readDraftNote = "Your words here stay in this open page. Choose Try Again to read drafts from this device.";

    const currentDraft = (): CapsuleDraft => ({
        message: $state.snapshot(newMessage),
        recipientId: capsuleRecipientId,
        custom: $state.snapshot(parsedCustomAttributes),
    });
    const ownsDraft = () => !!draftAccount && get(activeAccountId) === draftAccount && !!draftOwner && isCurrentSession(draftOwner);

    $effect(() => {
        const account = $activeAccountId;
        const signedIn = $auth;
        if (!account || !signedIn.isAuthenticated || signedIn.user?.email !== account) return;
        const owner = captureSession();
        if (!isCurrentSession(owner) || (account === draftAccount && draftOwner?.generation === owner.generation)) return;
        untrack(() => {
            if (draftAccount && !editingId) openDrafts.set(draftAccount, { draft: currentDraft(), preserve: preserveCurrentDraft() });
            draftAccount = account;
            draftOwner = owner;
            resetForm();
            showAddModal = false;
            draftNote = null;
            draftNeedsRead = false;
            draftNeedsRetry = false;
            restoreDraft();
        });
    });

    function saveDraft() {
        if (!ownsDraft()) {
            draftNote = "Your draft stays with the account where you started it.";
            return;
        }
        if (draftNeedsRead) {
            retryDraft();
            return;
        }
        const draft = currentDraft();
        draftHasCurrent = true;
        openDrafts.set(draftAccount!, { draft, preserve: true });
        setStored(DRAFT_KEY, draft, "owner", draftAccount!);
        // setStored can succeed in memory only. Save Draft promises a copy on this device.
        if (cacheStorageState(DRAFT_KEY, "owner", draftAccount!) !== "device") {
            draftNeedsRetry = true;
            draftNote = memoryDraftNote;
            return;
        }
        draftNeedsRetry = false;
        draftNote = null;
        showAddModal = false;
    }

    function clearDraft() {
        if (!draftAccount) return;
        openDrafts.delete(draftAccount);
        // A stored null also prevents a legacy draft from reappearing after sealing.
        setStored(DRAFT_KEY, null, "owner", draftAccount);
        try {
            localStorage.removeItem(`continuum_capsule_draft:${draftAccount}`);
        } catch {}
    }

    function restoreDraft(keepCurrent = false) {
        if (!ownsDraft()) return;
        const account = draftAccount!;
        const retained = openDrafts.get(account);
        const current = keepCurrent ? currentDraft() : retained?.preserve ? retained.draft : undefined;
        try {
            let draft = getStored<CapsuleDraft | null | undefined>(DRAFT_KEY, undefined, "owner", account);
            const storage = cacheStorageState(DRAFT_KEY, "owner", account);
            if (storage === "unavailable") throw new Error("Device draft read paused");
            if (draft === undefined) {
                const legacy = localStorage.getItem(`continuum_capsule_draft:${account}`);
                draft = legacy ? JSON.parse(legacy) : null;
            }
            if (draft !== null && (!draft || typeof draft !== "object" || !draft.message || typeof draft.message !== "object")) {
                throw new Error("Device draft needs another read");
            }
            const restored = current ?? draft;
            if (restored) {
                newMessage = { ...emptyMessage(), ...restored.message };
                capsuleRecipientId = String(restored.recipientId ?? "");
                parsedCustomAttributes = restored.custom ?? {};
                draftHasCurrent = true;
            }
            draftNeedsRead = false;
            draftNeedsRetry = storage !== "device";
            draftNote = draftNeedsRetry ? memoryDraftNote : null;
            if (draftNeedsRetry) showAddModal = true;
        } catch {
            // A refused read is not an empty draft, and never replaces words already entered.
            if (current) {
                newMessage = { ...emptyMessage(), ...current.message };
                capsuleRecipientId = current.recipientId;
                parsedCustomAttributes = current.custom;
            }
            draftNeedsRead = true;
            draftNote = readDraftNote;
            showAddModal = true;
        }
    }

    function retryDraft() {
        if (!ownsDraft()) {
            draftNote = "Your draft stays with the account where you started it.";
            return;
        }
        if (!draftNeedsRead) {
            saveDraft();
            return;
        }
        if (!retryStored(DRAFT_KEY, "owner", draftAccount!)) return;
        restoreDraft(preserveCurrentDraft());
    }

    async function removeCapsule(msg: TimeCapsuleMessage) {
        if (
            !(await askConfirm(
                `Remove the capsule "${msg.title}"? You can always start over if you feel like it later.`,
            ))
        )
            return;
        await timeCapsuleStore.removeMessage(msg.id).catch(() => {});
    }

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
    /** The milestone capsule asking "release?" in its card; null when none is asking. */
    let releasingId = $state<string | null>(null);

    async function confirmRelease(id: string) {
        releasingId = null;
        await timeCapsuleStore.releaseMessage(id).catch(() => {});
    }

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
        draftNote = null;
        draftNeedsRead = false;
        draftNeedsRetry = false;
        draftRevision = 0;
        draftHasCurrent = false;
    }

    function openNew() {
        if (editingId) {
            resetForm(); // an edit does not carry over; the new capsule's own draft can return
            restoreDraft();
        }
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
        markDraftEdited();
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
                clearDraft();
            }
            resetForm();
            showAddModal = false;
        } catch {
            // The sync manager shows a gentle note; the form keeps every word.
        } finally {
            isSaving = false;
        }
    }

    async function handleSaveVideo(event: CustomEvent<{ blob: Blob; duration: number; done?: () => void }>) {
        const blob = event.detail.blob;
        isUploading = true;
        formNote = null;
        try {
            const type = blob.type || "video/webm";
            const ext = type.startsWith("video/mp4") ? "mp4" : type.startsWith("video/quicktime") ? "mov" : "webm";
            const file = new File([blob], `capsule.${ext}`, { type });
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
            markDraftEdited();
            isRecording = false;
        } catch (e: any) {
            // The recorder stays open with this recording, so Save Memory can try again (X223).
            console.error("Capsule video upload:", e);
            formNote = "Your recording is right here, ready to save again whenever you like.";
        } finally {
            isUploading = false;
            event.detail.done?.();
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
        return milestoneLabel(id);
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
    detailedDescription="Messages safely locked until the perfect milestone. Record video messages, write letters, or preserve your voice for graduations, weddings, and life's meaningful moments."
    whyMatters="The messages you write here will comfort your loved ones for years to come, in your own words. Imagine your daughter graduating, getting married, or having her first child—and finding your voice waiting for her at each milestone."
>
    <div class="flex items-center gap-3">
        <DataViewToggle module="time-capsule" />
        <button
            onclick={openNew}
            class="px-8 py-4 bg-primary text-primary-foreground rounded-full font-bold shadow-xl shadow-primary/20 hover:opacity-90 hover:scale-105 transition-all flex items-center gap-3 shrink-0"
        >
            <Plus size={24} />
            Seal New Message
        </button>
    </div>
</LivingBlueprintHeader>

{#if isLoading}
    <div class="flex flex-col items-center justify-center gap-3 py-16" role="status" data-testid="capsules-loading">
        <Loader2 class="w-8 h-8 animate-spin text-primary" />
        <p class="text-sm text-muted-foreground">Gathering your messages…</p>
    </div>
{:else}
<div
    class="max-w-6xl mx-auto p-6 md:p-8 space-y-10 animate-in fade-in duration-700"
>

    <!-- AI Concierge Drafting Assistant -->
    <AIPromptBar
        context="letters"
        promptSource="routes/modules/time-capsule/+page.svelte:prompts"
    />

    <!-- Active Capsules Grid -->
    {#if viewMode === 'card'}
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <!-- Locked Capsules -->
        {#each $capsuleStatus.locked as msg (msg.id)}
            <div
                class="group flex flex-col bg-muted/50 border border-border rounded-[2rem] p-6 space-y-4 hover:bg-card hover:border-primary/40 transition-all duration-500"
                transition:scale
            >
                <div class="flex items-start justify-between">
                    <div
                        class="p-3 bg-card rounded-2xl shadow-sm text-muted-foreground group-hover:text-primary transition-colors"
                    >
                        <Lock size={20} />
                    </div>
                    <div class="flex items-center gap-1">
                        <button
                            onclick={() => openEdit(msg)}
                            aria-label="Edit this capsule"
                            class="p-2 text-muted-foreground hover:text-primary transition-colors"
                        >
                            <Pencil size={16} />
                        </button>
                        <button
                            onclick={() => removeCapsule(msg)}
                            aria-label="Remove this capsule"
                            class="p-2 text-muted-foreground hover:text-foreground transition-colors"
                        >
                            <Trash2 size={16} />
                        </button>
                    </div>
                </div>

                <div class="space-y-1">
                    <h3
                        class="font-serif font-bold text-xl text-foreground group-hover:text-primary transition-colors"
                    >
                        {msg.title}
                    </h3>
                    <p
                        class="text-xs font-black uppercase text-muted-foreground tracking-widest flex items-center gap-2"
                    >
                        <User size={12} />
                        Recipient:
                        <span class="text-foreground">{msg.recipient}</span>
                    </p>
                </div>

                <div
                    class="p-4 bg-card/60 rounded-xl border border-border group-hover:border-primary/20 transition-colors"
                >
                    {#if msg.contentPreview}
                        <p class="text-sm text-muted-foreground italic line-clamp-2">
                            "{msg.contentPreview}"
                        </p>
                    {/if}
                    {#if msg.videoUrl || msg.mediaId}
                        <p class="text-xs font-bold text-primary-hover flex items-center gap-2 {msg.contentPreview ? 'mt-2' : ''}">
                            <Video size={14} /> Video message
                        </p>
                    {/if}
                </div>

                {#if releasingId === String(msg.id)}
                <div class="p-4 bg-success/10 rounded-xl border border-success/20 space-y-3" role="group" aria-label="Release this capsule" transition:slide>
                    <p class="text-sm text-foreground">Release this capsule to {msg.recipient}? It moves to Available Now.</p>
                    <div class="flex gap-2">
                        <button
                            onclick={() => (releasingId = null)}
                            class="flex-1 py-2 text-sm font-bold text-muted-foreground bg-card border border-border rounded-xl hover:bg-muted transition-all"
                        >
                            Keep it locked
                        </button>
                        <button
                            onclick={() => confirmRelease(String(msg.id))}
                            class="flex-1 py-2 text-sm font-bold text-primary-foreground bg-primary rounded-xl hover:bg-primary-hover transition-all"
                        >
                            Release now
                        </button>
                    </div>
                </div>
                {:else}
                <div class="flex gap-2">
                    <button
                        onclick={() => openCapsule(msg)}
                        class="flex-1 py-2 text-sm font-bold text-primary-hover bg-card border border-primary/20 rounded-xl hover:bg-primary-soft transition-all"
                    >
                        {msg.videoUrl || msg.mediaId ? "Watch" : "Read"}
                    </button>
                    {#if msg.triggerType === "milestone"}
                        <button
                            onclick={() => (releasingId = String(msg.id))}
                            class="flex-1 py-2 text-sm font-bold text-success bg-card border border-success/20 rounded-xl hover:bg-success/10 transition-all"
                        >
                            Release this capsule
                        </button>
                    {/if}
                </div>
                {/if}

                <div
                    class="pt-4 border-t border-border flex items-center justify-between"
                >
                    <div class="flex items-center gap-2 text-gold-text">
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
                        class="text-[10px] font-black uppercase text-muted-foreground tracking-widest"
                        >Locked</span
                    >
                </div>
            </div>
        {/each}

        <!-- Unlocked Capsules (Success State) -->
        {#each $capsuleStatus.unlocked as msg (msg.id)}
            <div
                class="group flex flex-col bg-success/5 border border-success/30 rounded-[2rem] p-6 space-y-4 hover:shadow-lg transition-all"
                transition:scale
            >
                <div class="flex items-start justify-between">
                    <div
                        class="p-3 bg-card rounded-2xl shadow-sm text-success"
                    >
                        <Unlock size={20} />
                    </div>
                    <button
                        onclick={() => openEdit(msg)}
                        aria-label="Edit this capsule"
                        class="p-2 text-muted-foreground hover:text-success transition-colors"
                    >
                        <Pencil size={16} />
                    </button>
                </div>

                <div class="space-y-1">
                    <h3
                        class="font-serif font-bold text-xl text-foreground group-hover:text-success"
                    >
                        {msg.title}
                    </h3>
                    <p
                        class="text-xs font-black uppercase text-success tracking-widest flex items-center gap-2"
                    >
                        <Unlock size={12} />
                        Available Now
                    </p>
                </div>

                <div class="p-4 bg-card rounded-xl border border-success/20">
                    <p class="text-sm text-foreground line-clamp-2">
                        {msg.contentPreview}
                    </p>
                </div>

                <button
                    onclick={() => openCapsule(msg)}
                    class="w-full py-3 bg-primary text-primary-foreground rounded-2xl font-bold hover:bg-primary-hover transition-all flex items-center justify-center gap-2"
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
                    iconClass="text-primary"
                    ctaLabel="Write your first message"
                    onAction={openNew}
                />

                <!-- Sample Data GhostRows -->
                <div class="mt-8">
                    <p class="text-xs font-bold uppercase text-muted-foreground tracking-widest mb-4 text-center">Example entries to inspire you</p>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                                    markDraftEdited();
                                    openNew();
                                }}
                            >
                                {#snippet icon()}
                                    <Lock size={20} class="text-muted-foreground" />
                                {/snippet}
                            </GhostRow>
                        {/each}
                    </div>
                </div>
            </div>
        {/if}
    </div>
    {:else}
        <!-- Table View -->
        <div class="bg-card rounded-xl border border-border overflow-hidden">
            <table class="w-full">
                <thead class="bg-muted border-b border-border">
                    <tr>
                        <th class="text-left px-4 py-3 text-xs font-bold uppercase text-muted-foreground">Title</th>
                        <th class="text-left px-4 py-3 text-xs font-bold uppercase text-muted-foreground">Recipient</th>
                        <th class="text-left px-4 py-3 text-xs font-bold uppercase text-muted-foreground">Trigger</th>
                        <th class="text-left px-4 py-3 text-xs font-bold uppercase text-muted-foreground">Status</th>
                        <th class="text-left px-4 py-3 text-xs font-bold uppercase text-muted-foreground">Preview</th>
                        <th class="text-right px-4 py-3 text-xs font-bold uppercase text-muted-foreground">Actions</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-border">
                    {#each [...$capsuleStatus.locked, ...$capsuleStatus.unlocked] as msg (msg.id)}
                        <tr class="hover:bg-muted transition-colors group">
                            <td class="px-4 py-3 font-medium text-foreground">{msg.title}</td>
                            <td class="px-4 py-3 text-muted-foreground">{msg.recipient}</td>
                            <td class="px-4 py-3">
                                <span class="text-xs font-medium text-gold-text">
                                    {msg.triggerType === 'milestone' ? getMilestoneLabel(msg.triggerValue) : formatDate(msg.triggerValue)}
                                </span>
                            </td>
                            <td class="px-4 py-3">
                                <span class="px-2 py-1 rounded text-xs font-bold {$capsuleStatus.unlocked.includes(msg) ? 'bg-success/10 text-success' : 'bg-muted text-muted-foreground'}">
                                    {$capsuleStatus.unlocked.includes(msg) ? 'Unlocked' : 'Locked'}
                                </span>
                            </td>
                            <td class="px-4 py-3 text-muted-foreground text-sm max-w-[200px] truncate">{msg.contentPreview || '-'}</td>
                            <td class="px-4 py-3 text-right whitespace-nowrap">
                                <button
                                    onclick={() => openEdit(msg)}
                                    aria-label="Edit this capsule"
                                    class="p-1 text-muted-foreground hover:text-primary transition-all"
                                >
                                    <Pencil size={16} />
                                </button>
                                <button aria-label="Remove this item"
                                    onclick={() => removeCapsule(msg)}
                                    class="p-1 text-muted-foreground hover:text-foreground transition-all"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </td>
                        </tr>
                    {/each}
                </tbody>
            </table>
            {#if $timeCapsuleStore.length === 0}
                <div class="p-8 text-center text-muted-foreground">
                    Your first message will appear here, ready for the moment you choose.
                </div>
            {/if}
        </div>
    {/if}

    <!-- Modal for New Capsule -->
    {#if showAddModal}
        <div role="dialog" aria-modal="true" use:focusTrap={{ onEscape: () => (showAddModal = false) }}
            oninput={markDraftEdited} onchange={markDraftEdited}
            class="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md"
            aria-labelledby="capsule-form-title"
            transition:fade
        >
            <div
                class="bg-card w-full max-w-2xl rounded-[3rem] p-10 shadow-2xl space-y-8 max-h-[90vh] overflow-y-auto"
                transition:scale={{ start: 0.95, easing: quintOut }}
            >
                <div class="flex items-start justify-between">
                    <div class="flex-1 pr-6">
                        <div class="flex items-center gap-4 mb-3">
                            <div
                                class="p-3 bg-primary-soft text-primary-hover rounded-2xl"
                            >
                                {#if editingId}<Pencil size={24} />{:else}<Plus size={24} />{/if}
                            </div>
                            <h2
                                id="capsule-form-title"
                                class="font-serif text-3xl font-bold text-foreground tracking-tight"
                            >
                                {editingId ? "Revisit This Capsule" : "Speak Across Time"}
                            </h2>
                        </div>
                        <p class="text-muted-foreground text-sm leading-relaxed pl-16">
                            These words will find their way to someone you love at exactly the right moment—a graduation, a wedding, a milestone worth celebrating. This is your presence, preserved.
                        </p>
                    </div>
                    <button
                        onclick={() => (showAddModal = false)}
                        aria-label="Close"
                        class="p-2 hover:bg-muted rounded-full transition-colors text-muted-foreground"
                    >
                        <X />
                    </button>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div class="space-y-1">
                        <label
                            for="capsule-title"
                            class="text-[10px] font-black uppercase text-muted-foreground tracking-[0.2em] pl-1"
                            >Message Title</label
                        >
                        <input
                            id="capsule-title"
                            bind:value={newMessage.title}
                            placeholder="e.g., Graduation Heart-to-Heart"
                            class="w-full px-5 py-3.5 bg-muted border border-border rounded-2xl focus:ring-2 focus:ring-primary outline-none font-medium"
                        />
                    </div>
                    <div class="space-y-1">
                        <label
                            for="capsule-recipient"
                            class="text-[10px] font-black uppercase text-muted-foreground tracking-[0.2em] pl-1"
                            >Who is this for?</label
                        >
                        <input
                            id="capsule-recipient"
                            bind:value={newMessage.recipient}
                            placeholder="e.g., Emily (Daughter)"
                            class="w-full px-5 py-3.5 bg-muted border border-border rounded-2xl focus:ring-2 focus:ring-primary outline-none font-medium"
                        />
                        <label for="capsule-recipient-contact" class="sr-only">The person in your contacts</label>
                        <select
                            id="capsule-recipient-contact"
                            value={capsuleRecipientId}
                            onchange={(e) => chooseRecipient(e.currentTarget.value)}
                            class="w-full mt-2 px-4 py-2.5 bg-card border border-border rounded-xl focus:ring-2 focus:ring-primary outline-none text-sm text-foreground"
                        >
                            <option value="">Choose them from your contacts</option>
                            {#each contacts as contact (contact.id)}
                                <option value={String(contact.id)}
                                    >{contact.name}{contact.relation ? ` (${contact.relation})` : ""}</option
                                >
                            {/each}
                        </select>
                        {#if contacts.length === 0}
                            <p class="text-[11px] text-muted-foreground pl-1">
                                People you add in <a href="/modules/contacts" class="text-primary-hover underline">Contacts</a> appear here.
                            </p>
                        {/if}
                    </div>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div class="space-y-1">
                        <p
                            id="capsule-release-type"
                            class="text-[10px] font-black uppercase text-muted-foreground tracking-[0.2em] pl-1"
                            >Release Type</p
                        >
                        <div class="flex gap-2" role="group" aria-labelledby="capsule-release-type">
                            <button
                                onclick={() => setTrigger("date")}
                                aria-pressed={newMessage.triggerType === "date"}
                                class="flex-1 py-3 px-4 rounded-xl border-2 transition-all font-bold text-sm {newMessage.triggerType ===
                                'date'
                                    ? 'bg-primary-soft border-primary text-primary-hover'
                                    : 'bg-transparent border-border text-muted-foreground'}"
                            >
                                <Calendar size={16} class="inline mr-2" />
                                Date
                            </button>
                            <button
                                onclick={() => setTrigger("milestone")}
                                aria-pressed={newMessage.triggerType === "milestone"}
                                class="flex-1 py-3 px-4 rounded-xl border-2 transition-all font-bold text-sm {newMessage.triggerType ===
                                'milestone'
                                    ? 'bg-primary-soft border-primary text-primary-hover'
                                    : 'bg-transparent border-border text-muted-foreground'}"
                            >
                                <MilestoneIcon size={16} class="inline mr-2" />
                                Milestone
                            </button>
                        </div>
                    </div>
                    <div class="space-y-1">
                        <label
                            for="capsule-release-condition"
                            class="text-[10px] font-black uppercase text-muted-foreground tracking-[0.2em] pl-1"
                            >Release Condition</label
                        >
                        {#if newMessage.triggerType === "date"}
                            <input
                                id="capsule-release-condition"
                                type="date"
                                bind:value={newMessage.triggerValue}
                                class="w-full px-5 py-3.5 bg-muted border border-border rounded-2xl focus:ring-2 focus:ring-primary outline-none font-medium"
                            />
                        {:else}
                            <select
                                id="capsule-release-condition"
                                bind:value={newMessage.triggerValue}
                                class="w-full px-5 py-3.5 bg-muted border border-border rounded-2xl focus:ring-2 focus:ring-primary outline-none font-medium appearance-none"
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
                        for="capsule-content"
                        class="text-[10px] font-black uppercase text-muted-foreground tracking-[0.2em] pl-1"
                        >Legacy Content</label
                    >

                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {#if isRecording}
                            <div class="md:col-span-2 space-y-2">
                                <VideoRecorder on:save={handleSaveVideo} />
                                {#if isUploading}
                                    <p class="text-sm text-muted-foreground flex items-center gap-2">
                                        <Loader2 size={16} class="animate-spin" /> Keeping your video safe…
                                    </p>
                                {/if}
                            </div>
                        {:else if hasVideo}
                            <div
                                class="p-6 bg-success/10 rounded-2xl border border-success/20 flex flex-col justify-center gap-3"
                            >
                                <div
                                    class="flex items-center gap-3 text-success"
                                >
                                    <ShieldCheck size={24} />
                                    <span class="font-bold"
                                        >Video Message Recorded</span
                                    >
                                </div>
                                <button
                                    onclick={() => {
                                        isRecording = true;
                                        formNote = null;
                                    }}
                                    class="self-start text-xs font-bold text-success hover:underline"
                                >
                                    Re-record
                                </button>
                            </div>
                        {:else}
                            <button
                                onclick={() => {
                                    isRecording = true;
                                    formNote = null;
                                }}
                                class="p-6 border-2 border-dashed border-border rounded-2xl flex flex-col items-center gap-3 text-muted-foreground hover:border-primary/40 hover:text-primary transition-all"
                            >
                                <Video size={32} />
                                <span class="text-xs font-bold uppercase"
                                    >Record Video</span
                                >
                            </button>
                        {/if}
                        <textarea
                            id="capsule-content"
                            bind:value={newMessage.contentPreview}
                            placeholder="Your written words, in your own voice..."
                            class="w-full px-5 py-4 bg-muted border border-border rounded-2xl min-h-32 focus:ring-2 focus:ring-primary outline-none font-medium resize-none {isRecording ? 'md:col-span-2' : ''}"
                        ></textarea>
                    </div>
                </div>

                <!-- Custom Fields -->
                <div class="pt-4 mt-4 border-t border-border">
                    <CustomFieldsManager
                        entityType="timecapsule"
                        bind:data={parsedCustomAttributes}
                    />
                </div>

                {#if formNote}
                    <p class="text-sm text-foreground bg-primary-soft rounded-xl px-4 py-3">{formNote}</p>
                {/if}
                {#if !editingId && draftNote}
                    <p role="status" class="text-sm text-foreground bg-primary-soft rounded-xl px-4 py-3" data-testid="capsule-draft-note">{draftNote}</p>
                {/if}

                <div class="flex gap-4">
                    <button
                        onclick={() => {
                            if (editingId) resetForm(); // a new capsule's draft stays for later
                            showAddModal = false;
                        }}
                        class="px-6 py-4 border border-border rounded-2xl font-bold text-muted-foreground hover:bg-muted hover:text-foreground transition-all"
                    >
                        Maybe later
                    </button>
                    {#if !editingId}
                    <button
                        onclick={draftNeedsRead || draftNeedsRetry ? retryDraft : saveDraft}
                        disabled={isUploading || isSaving}
                        class="flex-1 py-4 px-6 border border-border rounded-2xl font-bold text-muted-foreground hover:bg-muted hover:text-foreground transition-all disabled:opacity-60"
                    >
                        {draftNeedsRead || draftNeedsRetry ? "Try Again" : "Save Draft"}
                    </button>
                    {/if}
                    <button
                        onclick={handleAdd}
                        disabled={isUploading || isSaving}
                        class="flex-2 py-4 px-10 bg-primary text-primary-foreground rounded-2xl font-bold shadow-xl shadow-primary/20 hover:opacity-90 transition-all disabled:opacity-60"
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
            <div class="relative w-full max-w-3xl bg-card rounded-[2rem] shadow-2xl p-8 space-y-5 max-h-[90vh] overflow-y-auto">
                <button
                    onclick={closeCapsule}
                    aria-label="Close"
                    class="absolute top-5 right-5 p-2 hover:bg-muted rounded-full text-muted-foreground transition-all"
                >
                    <X size={24} />
                </button>
                <div class="space-y-1 pr-10">
                    <h2 class="font-serif text-2xl font-bold text-foreground">{activeCapsule.title}</h2>
                    <p class="text-xs font-black uppercase text-muted-foreground tracking-widest flex items-center gap-2">
                        <User size={12} /> For <span class="text-muted-foreground">{activeCapsule.recipient}</span>
                        <span class="text-muted-foreground">·</span>
                        {isCapsuleReleased(activeCapsule) ? "Released" : "Locked"}
                    </p>
                </div>
                {#if activeCapsule.videoUrl}
                    <div class="rounded-2xl overflow-hidden border border-border">
                        <MediaView src={activeCapsule.videoUrl} record={capsuleMedia(activeCapsule)} />
                    </div>
                {:else if legacyVideoUrl}
                    <div class="rounded-2xl overflow-hidden bg-black aspect-video">
                        <!-- svelte-ignore a11y_media_has_caption -->
                        <video src={legacyVideoUrl} controls class="w-full h-full"></video>
                    </div>
                {/if}
                {#if readerNote}
                    <p class="text-sm text-muted-foreground">{readerNote}</p>
                {/if}
                {#if activeCapsule.contentPreview}
                    <p class="text-foreground leading-relaxed whitespace-pre-wrap">{activeCapsule.contentPreview}</p>
                {/if}
            </div>
        </div>
    {/if}
</div>
{/if}
