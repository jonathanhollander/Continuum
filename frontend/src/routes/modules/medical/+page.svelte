<script lang="ts">
    import { directiveSync, profileSync } from "$lib/stores/medicalStore.svelte";
    import { captureSession } from "$lib/services/sessionOwnership";
    import { activeAccountId } from "$lib/stores/keyringStore";
    import { currentProfileId } from "$lib/stores/profileContext";
    import { get } from "svelte/store";
    import { formSaveAttempt } from "$lib/utils/formSaveAttempt";
    import { askConfirm } from "$lib/components/ui/ConfirmModal.svelte";
    import { readCustom } from "$lib/utils/customFields";
    import { fade, slide } from "svelte/transition";
    import { onMount } from "svelte";
    import {
        Heart,
        Shield,
        FileText,
        Phone,
        Plus,
        Trash2,
        Pencil,
        Activity,
        CircleAlert,
        CircleCheck,
        User,
        Loader2,
        Download,
    } from "lucide-svelte";
    import Modal from "$lib/components/ui/Modal.svelte";
    import AIPromptBar from "$lib/components/concierge/AIPromptBar.svelte";
    import {
        medicalStore,
        directiveMedia,
        DIRECTIVE_MEDIA_KEY,
        type DirectiveMedia,
        type MedicalDirective,
    } from "$lib/stores/medicalStore.svelte";
    import UniversalUploader from "$lib/components/ui/UniversalUploader.svelte";
    import { cachedBlobUrl } from "$lib/components/ui/MediaView.svelte";
    import {
        deleteMedia,
        downloadMedia,
        updateMediaMetadata,
    } from "$lib/services/mediaService";
    import { t, language } from "$lib/stores/localization";
    import { getSmartSamples } from "$lib/data/smartSamples";
    import GhostRow from "$lib/components/ui/GhostRow.svelte";
    import EmptyState from "$lib/components/EmptyState.svelte";
    import { estateProfile } from "$lib/stores/estateStore.svelte";
    import { familyStore } from "$lib/stores/familyStore.svelte";
    import { activityLog } from "$lib/stores/activityLog.svelte";
    import LegalDisclaimer from "$lib/components/common/LegalDisclaimer.svelte";
    import GriefSupportBanner from "$lib/components/GriefSupportBanner.svelte";
    import LivingBlueprintHeader from "$lib/components/LivingBlueprintHeader.svelte";
    import CustomFieldsManager from "$lib/components/ui/CustomFieldsManager.svelte";

    let showAddForm = $state(false);
    let parsedCustomAttributes = $state<Record<string, any>>({});
    /** The file attached in the form, and the one the directive held when the form opened. */
    let formMedia = $state<DirectiveMedia | null>(null);
    let savedMedia: DirectiveMedia | null = null;
    let formMediaUrl = $derived(formMedia ? `/api/media/${formMedia.id}/download` : "");
    let editMode = $state(false);
    let isLoading = $state(true);
    let newDirective: Partial<MedicalDirective> = $state({
        type: "healthcare_proxy",
        title: "",
        locationOfOriginal: "",
        primaryContact: "",
        contactPhone: "",
        summary: "",
    });

    let showProfileEdit = $state(false);
    let savingProfile = $state(false);
    const profileFailures = new Map<string, Set<string>>();
    let tempProfile = $state({
        organDonor: medicalStore.profile.organDonor,
        bloodType: medicalStore.profile.bloodType,
        allergies: medicalStore.profile.allergies,
    });

    // Reactive profile derived from store subscription for display
    let currentProfile = $state(medicalStore.profile);

    // Sync medical data on mount and update reactive profile
    onMount(() => {
        // Contacts fill the proxy suggestions; the page opens without waiting for them.
        familyStore.sync().catch(() => undefined);
        medicalStore.sync().then(() => {
            isLoading = false;
        });
        // Subscribe to store changes to update reactive profile; the returned cleanup runs on leave.
        return medicalStore.subscribe(() => {
            currentProfile = medicalStore.profile;
        });
    });

    function openProfileEdit() {
        tempProfile = { ...medicalStore.profile };
        showProfileEdit = true;
    }

    async function saveProfile() {
        if (savingProfile) return;
        const form = tempProfile;
        const fields = JSON.stringify(form);
        const submitted = { ...form };
        const ownerName = estateProfile.current.ownerName || "User";
        const owner = captureSession();
        const failuresKey = JSON.stringify([owner.generation, get(activeAccountId), get(currentProfileId)]);
        savingProfile = true;
        try {
            // This explicit full-profile save supersedes earlier failed snapshots
            // in the same session/namespace, including an editor that was reopened.
            for (const id of profileFailures.get(failuresKey) || []) profileSync.releaseRecovery(id, owner);
            profileFailures.delete(failuresKey);
            await medicalStore.updateProfile(submitted);
            // New typing, or a newly opened editor, still belongs to the person editing.
            if (tempProfile === form && JSON.stringify(form) === fields) showProfileEdit = false;
            activityLog.logEvent({
                module: "Health & Medical",
                action: "UPDATE",
                entityType: "Medical Profile",
                entityId: "profile",
                entityName: "Health Data",
                userContext: ownerName,
            });
        } catch (error) {
            const recoveryId = (error as { recoveryId?: string } | null)?.recoveryId;
            if (recoveryId) {
                const failures = profileFailures.get(failuresKey) || new Set<string>();
                failures.add(recoveryId);
                profileFailures.set(failuresKey, failures);
            }
            // The manager keeps the submitted draft and shows its gentle retry message.
        } finally {
            savingProfile = false;
        }
    }

    const saveAttempt = formSaveAttempt(directiveSync);
    // A failed attempt's uploaded document remains available after its form closes or changes.
    const keptMedia = new Set<number>();

    // One save at a time: while it is open the button waits, so a second click sends nothing.
    let saving = $state(false);
    async function saveDirective() {
        if (saving) return;
        saving = true;
        try {
            await saveDirectiveOnce();
        } finally {
            saving = false;
        }
    }

    async function saveDirectiveOnce() {
        if (!newDirective.title) return;
        const form = newDirective;
        const fields = JSON.stringify([form, parsedCustomAttributes, formMedia]);
        const id = form.id;
        const ownerName = estateProfile.current.ownerName || "User";
        const { [DIRECTIVE_MEDIA_KEY]: _ignored, ...customValues } = parsedCustomAttributes;
        const attached = formMedia ? { ...formMedia } : null;
        const replaced = savedMedia && savedMedia.id !== attached?.id ? { ...savedMedia } : null;
        const customJson = JSON.stringify(attached ? { ...customValues, [DIRECTIVE_MEDIA_KEY]: attached } : customValues);
        const payload = { ...form, custom_attributes: customJson, customAttributes: customJson };
        if (attached) keptMedia.add(attached.id);
        try {
            await saveAttempt(form, payload, (saved) => {
                if (attached) updateMediaMetadata(attached.id, undefined, String(saved.id)).catch(() => undefined);
                if (replaced) deleteMedia(replaced.id).catch((e) => console.warn("[medical] file removal paused", replaced.id, e));
                activityLog.logEvent({
                    module: "Health & Medical", action: id ? "UPDATE" : "CREATE", entityType: "Medical Directive",
                    entityId: String(saved.id), entityName: saved.title, userContext: ownerName,
                });
                if (newDirective !== form) return;
                savedMedia = attached;
                if (JSON.stringify([form, parsedCustomAttributes, formMedia]) === fields) resetForm();
                else newDirective.id = saved.id;
            }, id);
        } catch {
            // The captured attempt and its document stay available through Try Again.
        }
    }

    /** A proxy picked from contacts brings their phone along when that field is still empty. */
    function fillProxyPhone() {
        const name = (newDirective.primaryContact || "").trim();
        const person = familyStore.members.find((m) => m.name === name);
        if (person?.phone && !newDirective.contactPhone) newDirective.contactPhone = person.phone;
    }

    function editDirective(dir: MedicalDirective) {
        newDirective = { ...dir };
        const { [DIRECTIVE_MEDIA_KEY]: _media, ...customValues } = readCustom(dir);
        parsedCustomAttributes = customValues;
        formMedia = savedMedia = directiveMedia(dir) ?? null;
        showAddForm = true;
    }

    /** A file attached in this form but never saved on the directive. */
    function dropUnsavedFile() {
        if (formMedia && formMedia.id !== savedMedia?.id && !keptMedia.has(formMedia.id)) {
            const id = formMedia.id;
            deleteMedia(id).catch((e) => console.warn("[medical] file removal paused", id, e));
        }
    }

    function onFileChange(
        _url: string,
        id?: number,
        file?: { filename: string; mime_type: string; file_size: number },
    ) {
        dropUnsavedFile();
        formMedia =
            id === undefined
                ? null
                : { id, mime_type: file?.mime_type ?? "", filename: file?.filename ?? "", file_size: file?.file_size ?? 0 };
    }

    /** The modal closes through ×, Escape, the backdrop or "Maybe later"; each one drops the draft. */
    function setFormOpen(open: boolean) {
        if (open) showAddForm = true;
        else if (showAddForm) resetForm();
    }

    function resetForm() {
        dropUnsavedFile();
        formMedia = null;
        savedMedia = null;
        showAddForm = false;
        newDirective = {
            type: "healthcare_proxy",
            title: "",
            locationOfOriginal: "",
            primaryContact: "",
            contactPhone: "",
            summary: "",
        };
        parsedCustomAttributes = {};
    }

    async function removeDirective(id: string | number) {
        if (
            !(await askConfirm(
                "Remove this directive? Do this when the document has been replaced.",
            ))
        )
            return;
        medicalStore.removeDirective(id);
    }

    const typeLabels: Record<string, string> = {
        healthcare_proxy: "Healthcare Proxy",
        living_will: "Living Will",
        dnr: "DNR Orders",
        palliative_care: "Palliative care",
        other: "Other Directive",
    };
</script>

{#if isLoading}
    <div class="flex items-center justify-center py-12">
        <Loader2 class="w-8 h-8 animate-spin text-primary" />
    </div>
{:else}
<div class="max-w-5xl mx-auto space-y-8 p-4 md:p-8">
    <!-- Header -->
    <LivingBlueprintHeader
        title="Health & Medical"
        subtitle="Directives, care preferences, and people to contact"
        detailedDescription="Record the directives you have prepared, who to contact, and where the signed originals are kept. Add a readable summary of the wishes your proxy and care team should know."
        whyMatters="Keeping the document, its location, and the contact details together helps your family find the information you intended them to use."
    >
        <button
            onclick={() => (showAddForm = true)}
            class="flex items-center justify-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-2xl font-bold hover:scale-105 transition-all shadow-lg shadow-primary/20"
        >
            <Plus size={20} />
            Add a healthcare directive
        </button>
    </LivingBlueprintHeader>

    <GriefSupportBanner compact={true} />


    <!-- AI Prompt Bar -->
    <div class="mb-8">
        <AIPromptBar context="medical" />
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <!-- Life Saving Profile -->
        <div class="lg:col-span-1 space-y-8">
            <section
                class="bg-card rounded-2xl border border-primary/10 shadow-sm overflow-hidden"
            >
                <div class="p-6 bg-primary/5 border-b border-primary/10">
                    <h2
                        class="text-lg font-bold text-primary-hover flex items-center gap-2"
                    >
                        <Activity size={20} />
                        Emergency Profile
                    </h2>
                </div>
                <div class="p-6 space-y-6">
                    {#if !showProfileEdit}
                        <div class="space-y-4">
                            <div
                                class="flex items-center justify-between p-4 bg-muted rounded-2xl border border-border"
                            >
                                <div>
                                    <p
                                        class="text-xs font-bold uppercase text-muted-foreground"
                                    >
                                        Blood Type
                                    </p>
                                    {#if medicalStore.profile.bloodType}
                                        <p class="text-xl font-bold text-foreground">
                                            {medicalStore.profile.bloodType}
                                        </p>
                                    {:else}
                                        <button
                                            type="button"
                                            onclick={openProfileEdit}
                                            class="text-sm font-semibold text-primary-hover hover:underline"
                                        >
                                            Add blood type
                                        </button>
                                    {/if}
                                </div>
                                {#if medicalStore.profile.bloodType}
                                    <span
                                        class="px-3 py-1 bg-primary/10 text-primary-hover rounded-full text-xs font-bold"
                                    >
                                        Rh {medicalStore.profile.bloodType.includes("+")
                                            ? "positive"
                                            : "negative"}
                                    </span>
                                {/if}
                            </div>

                            <div
                                class="p-4 rounded-2xl border {medicalStore.profile.allergies
                                    ? 'bg-warning-soft border-warning/20'
                                    : 'bg-muted border-border'}"
                            >
                                <p
                                    class="text-xs font-bold uppercase mb-1 {medicalStore.profile.allergies
                                        ? 'text-warning'
                                        : 'text-muted-foreground'}"
                                >
                                    Allergies
                                </p>
                                {#if medicalStore.profile.allergies}
                                    <p class="text-sm font-medium text-foreground">
                                        {medicalStore.profile.allergies}
                                    </p>
                                {:else}
                                    <button
                                        type="button"
                                        onclick={openProfileEdit}
                                        class="text-sm font-semibold text-primary-hover hover:underline"
                                    >
                                        Add any allergies
                                    </button>
                                {/if}
                            </div>

                            <div
                                class="flex items-center gap-3 p-4 bg-info/10 rounded-2xl border border-info/20"
                            >
                                {#if currentProfile.organDonor}
                                    <CircleCheck
                                        class="text-info"
                                        size={20}
                                    />
                                    <p class="text-sm font-bold text-foreground">
                                        Organ donor enrollment recorded
                                    </p>
                                {:else}
                                    <CircleAlert
                                        class="text-info"
                                        size={20}
                                    />
                                    <p class="text-sm font-bold text-foreground">
                                        Add your donor wishes
                                    </p>
                                {/if}
                            </div>

                            <button
                                onclick={openProfileEdit}
                                class="w-full py-3 text-primary-hover hover:bg-primary/5 rounded-xl transition-colors font-bold text-sm"
                            >
                                Edit my profile
                            </button>
                        </div>
                    {:else}
                        <div class="space-y-4" in:slide>
                            <div>
                                <label for="medical-blood-type"
                                    class="block text-xs font-bold uppercase text-muted-foreground mb-1"
                                    >Blood Type</label
                                >
                                <select id="medical-blood-type"
                                    bind:value={tempProfile.bloodType}
                                    class="w-full px-4 py-3 rounded-xl border border-border bg-card focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                >
                                    <option value="">Unknown</option>
                                    <option value="A+">A+</option>
                                    <option value="A-">A-</option>
                                    <option value="B+">B+</option>
                                    <option value="B-">B-</option>
                                    <option value="AB+">AB+</option>
                                    <option value="AB-">AB-</option>
                                    <option value="O+">O+</option>
                                    <option value="O-">O-</option>
                                </select>
                            </div>
                            <div>
                                <label for="medical-allergies"
                                    class="block text-xs font-bold uppercase text-muted-foreground mb-1"
                                    >Allergies</label
                                >
                                <textarea id="medical-allergies"
                                    bind:value={tempProfile.allergies}
                                    class="w-full px-4 py-3 rounded-xl border border-border bg-card focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                    rows="3"
                                    placeholder="Latex, Penicillin, Peanuts..."
                                ></textarea>
                            </div>
                            <div class="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    bind:checked={tempProfile.organDonor}
                                    id="donor-check"
                                />
                                <label
                                    for="donor-check"
                                    class="text-sm font-medium text-foreground"
                                    >I have registered as an organ donor</label
                                >
                            </div>
                            <div class="flex gap-2">
                                <button
                                    onclick={saveProfile}
                                    disabled={savingProfile}
                                    aria-busy={savingProfile}
                                    class="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-xl font-bold text-sm"
                                    >Save my updates</button
                                >
                                <button
                                    onclick={() => (showProfileEdit = false)}
                                    class="flex-1 px-4 py-2 bg-muted text-muted-foreground rounded-xl font-bold text-sm"
                                    >Maybe later</button
                                >
                            </div>
                        </div>
                    {/if}
                </div>
            </section>
        </div>

        <!-- Directives List -->
        <div class="lg:col-span-2 space-y-6">
            <div
                class="bg-primary/5 p-6 rounded-2xl border border-primary/10 flex items-start gap-4"
            >
                <Shield class="text-primary mt-1 shrink-0" size={24} />
                <div>
                    <h3 class="font-bold text-primary-hover text-lg">
                        Your recorded healthcare directives
                    </h3>
                    <p class="text-sm text-primary-hover mt-1 leading-relaxed">
                        Keep each directive with a short summary, the person to
                        contact, and the location of the original. Review these
                        details with your chosen proxy and care team.
                    </p>
                </div>
            </div>

            {#each medicalStore.directives as dir}
                <div
                    class="bg-card rounded-2xl border border-border shadow-sm p-6 hover:shadow-md transition-shadow relative group"
                >
                    <div class="flex items-start justify-between">
                        <div class="flex gap-4">
                            <div
                                class="p-3 bg-muted text-muted-foreground rounded-2xl group-hover:bg-primary/5 group-hover:text-primary transition-colors"
                            >
                                <FileText size={24} />
                            </div>
                            <div>
                                <span
                                    class="px-2 py-1 bg-muted text-muted-foreground rounded-lg text-[10px] font-black uppercase tracking-wider"
                                >
                                    {typeLabels[dir.type]}
                                </span>
                                <h3
                                    class="text-xl font-bold text-foreground mt-1"
                                >
                                    {dir.title}
                                </h3>
                                <p class="text-sm text-muted-foreground mt-1">
                                    {dir.summary}
                                </p>
                                {#if directiveMedia(dir)}
                                    {@const media = directiveMedia(dir)!}
                                    <button
                                        type="button"
                                        onclick={() => downloadMedia(media.id, media.filename || undefined, cachedBlobUrl(media.id)).catch((e) => console.warn("[medical] file save paused", media.id, e))}
                                        class="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
                                    >
                                        <Download size={14} />
                                        {media.filename}
                                    </button>
                                {/if}
                            </div>
                        </div>

                        <div class="flex gap-1">
                            <button aria-label="Edit these details"
                                onclick={() => editDirective(dir)}
                                class="p-2 text-muted-foreground hover:text-primary-hover hover:bg-muted rounded-lg transition-all"
                            >
                                <Pencil size={18} />
                            </button>
                            <button aria-label="Remove this item"
                                onclick={() => removeDirective(dir.id)}
                                class="p-2 text-muted-foreground hover:text-danger hover:bg-danger-soft rounded-lg transition-all"
                            >
                                <Trash2 size={18} />
                            </button>
                        </div>
                    </div>

                    {#if dir.primaryContact || dir.contactPhone || dir.locationOfOriginal}
                    <div class="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {#if dir.primaryContact || dir.contactPhone}
                        <div
                            class="p-4 bg-muted rounded-2xl border border-border"
                        >
                            <span
                                class="text-[10px] font-black uppercase text-muted-foreground block mb-1"
                                >Primary Contact / Proxy</span
                            >
                            {#if dir.primaryContact}
                                <p class="text-sm font-bold text-foreground">
                                    {dir.primaryContact}
                                </p>
                            {/if}
                            {#if dir.contactPhone}
                                <p
                                    class="text-xs text-muted-foreground flex items-center gap-1 mt-1"
                                >
                                    <Phone size={12} />
                                    {dir.contactPhone}
                                </p>
                            {/if}
                        </div>
                        {/if}
                        {#if dir.locationOfOriginal}
                        <div
                            class="p-4 bg-muted rounded-2xl border border-border"
                        >
                            <span
                                class="text-[10px] font-black uppercase text-muted-foreground block mb-1"
                                >Location of Original</span
                            >
                            <p class="text-sm font-bold text-foreground">
                                {dir.locationOfOriginal}
                            </p>
                        </div>
                        {/if}
                    </div>
                    {/if}
                </div>
            {/each}

            {#if medicalStore.directives.length === 0}
                <EmptyState
                    title="Your healthcare wishes matter"
                    whyMatters="Record the directive you have prepared, the key wishes it expresses, and who should be contacted. A copy and the original's location help your family and care team find it."
                    encouragement="Start with one document, such as your healthcare proxy or living will. Use its title and signed date to distinguish it from older versions."
                    icon={Shield}
                    iconClass="text-primary"
                    ctaLabel="Add a healthcare directive"
                    onAction={() => (showAddForm = true)}
                />
                <!-- GHOST ROWS (Hidden, keeping for reference) -->
                <div class="mb-6 space-y-4 hidden">
                    {#each getSmartSamples($language).medical || [] as sample}
                        <GhostRow
                            name={sample.title}
                            subtitle={sample.summary}
                            type={sample.type === "dnr" ? "DNR" : "Proxy"}
                            onclick={() => {
                                newDirective = {
                                    ...newDirective,
                                    title: sample.title,
                                    type: sample.type as any,
                                    locationOfOriginal:
                                        sample.locationOfOriginal,
                                    summary: sample.summary,
                                };
                                showAddForm = true;
                            }}
                        >
                            {#snippet icon()}
                                <div
                                    class="w-10 h-10 rounded-xl bg-muted flex items-center justify-center text-muted-foreground"
                                >
                                    <FileText size={20} />
                                </div>
                            {/snippet}
                        </GhostRow>
                    {/each}
                </div>
            {/if}
        </div>
    </div>
</div>

<!-- Add/Edit Modal -->
<Modal
    bind:open={() => showAddForm, setFormOpen}
    title={newDirective.id ? "Edit healthcare directive" : "Add a healthcare directive"}
    description="Keep a readable summary alongside the original document and the contact details of the person who can help your care team find it."
    maxWidth="max-w-lg"
>
    <form
        onsubmit={(e) => {
            e.preventDefault();
            saveDirective();
        }}
        class="space-y-6"
    >
        <div class="grid grid-cols-2 gap-4">
            <div>
                <label for="medical-type"
                    class="block text-xs font-bold uppercase text-muted-foreground mb-1"
                    >Directive Type</label
                >
                <select id="medical-type"
                    bind:value={newDirective.type}
                    class="w-full px-4 py-3 rounded-xl border border-border bg-card focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                >
                    <option value="healthcare_proxy">Healthcare Proxy</option>
                    <option value="living_will">Living Will</option>
                    <option value="dnr">DNR Order</option>
                    <option value="palliative_care">Palliative Care</option>
                    <option value="other">Other</option>
                </select>
            </div>
            <div>
                <label for="medical-title"
                    class="block text-xs font-bold uppercase text-muted-foreground mb-1"
                    >Title</label
                >
                <input id="medical-title"
                    type="text"
                    bind:value={newDirective.title}
                    placeholder="e.g. Living Will 2024"
                    class="w-full px-4 py-3 rounded-xl border border-border bg-card focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                />
            </div>
        </div>

        <div>
            <label for="medical-summary"
                class="block text-xs font-bold uppercase text-muted-foreground mb-1"
                >Summary of Wishes</label
            >
            <textarea id="medical-summary"
                bind:value={newDirective.summary}
                placeholder="The key wishes this document records, in your own words..."
                class="w-full px-4 py-3 rounded-xl border border-border bg-card focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                rows="3"
            ></textarea>
        </div>

        <div class="grid grid-cols-2 gap-4">
            <div>
                <label for="medical-primary-contact"
                    class="block text-xs font-bold uppercase text-muted-foreground mb-1"
                    >Primary Proxy/Contact</label
                >
                <input id="medical-primary-contact"
                    type="text"
                    list="medical-contact-options"
                    bind:value={newDirective.primaryContact}
                    onchange={fillProxyPhone}
                    placeholder="e.g. Sam — my chosen healthcare proxy"
                    class="w-full px-4 py-3 rounded-xl border border-border bg-card focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                />
                <!-- People from Family & Contacts; any other name can still be typed. -->
                <datalist id="medical-contact-options">
                    {#each familyStore.members as person (person.id)}
                        <option value={person.name}>{person.relation || person.role}</option>
                    {/each}
                </datalist>
            </div>
            <div>
                <label for="medical-contact-phone"
                    class="block text-xs font-bold uppercase text-muted-foreground mb-1"
                    >Contact Phone</label
                >
                <input id="medical-contact-phone"
                    type="text"
                    bind:value={newDirective.contactPhone}
                    placeholder="e.g. +1 (555) 000-0000"
                    class="w-full px-4 py-3 rounded-xl border border-border bg-card focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                />
            </div>
        </div>

        <div>
            <label for="medical-location-of-original"
                class="block text-xs font-bold uppercase text-muted-foreground mb-1"
                >Location of Original Document</label
            >
            <input id="medical-location-of-original"
                type="text"
                bind:value={newDirective.locationOfOriginal}
                placeholder="e.g. Signed original in the blue folder; copy with my proxy"
                class="w-full px-4 py-3 rounded-xl border border-border bg-card focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
            />
        </div>

        <UniversalUploader
            module="medical_directives"
            referenceId={newDirective.id ? String(newDirective.id) : undefined}
            value={formMediaUrl}
            mediaId={formMedia?.id ?? null}
            onchange={onFileChange}
        />

        <!-- Custom Fields -->
        <div class="pt-4 mt-4 border-t border-border">
            <CustomFieldsManager
                entityType="medical"
                bind:data={parsedCustomAttributes}
            />
        </div>

        <div class="flex gap-4 pt-4">
            <button
                type="button"
                onclick={resetForm}
                class="flex-1 py-3 px-6 bg-muted text-muted-foreground rounded-xl font-semibold hover:bg-border transition-colors"
            >
                Maybe later
            </button>
            <button
                type="submit"
                disabled={saving}
                aria-busy={saving}
                class="flex-1 py-3 px-6 bg-primary text-primary-foreground rounded-xl font-semibold shadow-lg shadow-primary/20 hover:opacity-90 transition-all disabled:opacity-50"
            >
                {saving
                    ? "Saving..."
                    : newDirective.id
                    ? "Save my updates"
                    : "Include this directive"}
            </button>
        </div>
    </form>
</Modal>
{/if}
