<script lang="ts">
    import { focusTrap } from "$lib/actions/focusTrap";
    import { fade, slide } from "svelte/transition";
    import {
        Shield,
        Mail,
        Facebook,
        Linkedin,
        CircleCheck,
        ExternalLink,
        Key,
        Lock,
        Siren,
        Apple,
        ChevronDown,
        ChevronRight,
        UserCheck,
        FingerprintPattern as Fingerprint,
        X,
        Loader2,
        Pencil,
        Plus,
    } from "lucide-svelte";
    import { onMount } from "svelte";
    import { estateProfile } from "$lib/stores/estateStore.svelte";
    import { estateExecutorName } from "$lib/stores/analyticsStore";
    import { getStored, setStored } from "$lib/stores/persistence";
    import { digitalGuardianSync, type GuardianChecks } from "$lib/stores/digitalGuardianStore.svelte";
    import GhostRow from "$lib/components/ui/GhostRow.svelte";
    import ConciergeFlow from "$lib/components/concierge/ConciergeFlow.svelte";
    import AIPromptBar from "$lib/components/concierge/AIPromptBar.svelte";
    import { t, language } from "$lib/stores/localization";
    import { getSmartSamples } from "$lib/data/smartSamples";
    import { activityLog } from "$lib/stores/activityLog.svelte";
    import { notifications } from "$lib/stores/notificationStore";
    import DataViewToggle from "$lib/components/ui/DataViewToggle.svelte";
    import { userPreferencesStore, type ViewMode } from "$lib/stores/userPreferencesStore.svelte";
    import LivingBlueprintHeader from "$lib/components/LivingBlueprintHeader.svelte";
    import { askConfirm } from "$lib/components/ui/ConfirmModal.svelte";

    let viewMode = $derived<ViewMode>(userPreferencesStore.getViewMode('digital-guardian'));

    // Sync Integration
    import {
        digitalAssetsSync,
        digitalAssetsStore,
        type DigitalAccount,
    } from "$lib/stores/digitalAssetsStore.svelte";

    let activeGuide = $state<string | null>(null);

    // --- SETUP STATUS SYNC ---
    interface GuardianStatus {
        id: string;
        apple: boolean;
        google: boolean;
        facebook: boolean;
        linkedin: boolean;
        passwordManager: boolean;
    }
    // Setup status and fire drill follow the account: one server row (/api/data/digital_guardian),
    // shown from the device copy until the server answers. Device-only values saved under the
    // earlier keys (X38) seed that copy once, and the manager uploads them if the server has none.
    const LEGACY_STATUS_KEY = "digital_guardian_status";
    const LEGACY_DRILL_KEY = "digital_guardian_drill";
    const legacyMap = (key: string): GuardianChecks | undefined => {
        const row = getStored<any[]>(key, []).find?.((i: any) => i?.id === "main");
        if (!row) return undefined;
        const { id: _id, ...rest } = row;
        return rest;
    };
    if (Object.keys(digitalGuardianSync.data ?? {}).length === 0) {
        const legacyStatus = legacyMap(LEGACY_STATUS_KEY);
        const legacyDrill = legacyMap(LEGACY_DRILL_KEY);
        if (legacyStatus || legacyDrill) {
            digitalGuardianSync.updateLocal({
                ...(legacyStatus ? { setupStatus: legacyStatus } : {}),
                ...(legacyDrill ? { fireDrill: legacyDrill } : {}),
            });
        }
    }

    // Toggles show at once and are saved together ~500 ms after the last one. Until a save that
    // carries them succeeds they stay in `pending`, drawn over whatever the manager holds (its
    // rollback, a sync, or its own Try Again), and the next save re-sends them.
    type Checks = { setupStatus?: GuardianChecks; fireDrill?: GuardianChecks };
    // `pending` is also kept on this device (namespaced like the manager's own key), so unsaved
    // toggles survive a reload; it is cleared once a save carrying them lands.
    const PENDING_KEY = "digital_guardian_pending";
    let pending = $state<Checks | null>(getStored<Checks | null>(PENDING_KEY, null));
    let saveTimer: ReturnType<typeof setTimeout> | undefined;
    let saving = false;
    let failed = false;
    $effect(() => {
        setStored(PENDING_KEY, pending ? $state.snapshot(pending) : null);
    });
    // Toggles kept from before a reload: shown at once, sent once the server row has loaded.
    // One-time start-up read of the device copy, on purpose.
    // svelte-ignore state_referenced_locally
    let restored = pending !== null;
    // Restored before this sync ran: the sync's answer (or its upload of the device copy) is the
    // server's, so it can show the toggles already saved. After it, the copy is only this page's.
    const restoredBeforeSync = digitalGuardianSync.status !== "synced";
    // True when the manager's server copy already holds every pending map.
    const pendingSaved = () => {
        const data: Checks = digitalGuardianSync.data ?? {};
        return (Object.keys(pending ?? {}) as (keyof Checks)[]).every(
            (k) => JSON.stringify(data[k]) === JSON.stringify(pending![k]),
        );
    };
    // One-time start-up read of the device copy, on purpose.
    // svelte-ignore state_referenced_locally
    if (pending) digitalGuardianSync.updateLocal({ ...(digitalGuardianSync.data ?? {}), ...pending });
    $effect(() => {
        if (restored && digitalGuardianSync.status === "synced") {
            restored = false;
            // A new account's sync already uploaded the device copy, which carries them: one POST.
            if (restoredBeforeSync && pendingSaved()) { pending = null; return; }
            clearTimeout(saveTimer);
            saveTimer = setTimeout(flushChecks, 500);
        }
    });

    function saveChecks(next: Checks) {
        pending = { ...(pending ?? {}), ...next };
        digitalGuardianSync.updateLocal({ ...(digitalGuardianSync.data ?? {}), ...pending });
        clearTimeout(saveTimer);
        saveTimer = setTimeout(flushChecks, 500);
    }

    async function flushChecks() {
        if (!pending) return;
        if (saving) { saveTimer = setTimeout(flushChecks, 500); return; }
        const sent = pending;
        saving = true;
        try {
            await digitalGuardianSync.update(sent);
            failed = false;
            if (pending === sent) pending = null;
        } catch {
            failed = true;
            // the manager shows the one gentle retry line; `pending` keeps the toggles
        } finally {
            saving = false;
        }
        if (pending) digitalGuardianSync.updateLocal({ ...(digitalGuardianSync.data ?? {}), ...pending });
    }

    // The manager's Try Again re-sends the save that failed; once it lands, send anything newer.
    $effect(() => {
        if (digitalGuardianSync.status === "synced" && pending && failed && !saving) {
            failed = false;
            if (pendingSaved()) { pending = null; return; }
            clearTimeout(saveTimer);
            saveTimer = setTimeout(flushChecks, 500);
        }
    });

    // Default Status
    const DEFAULT_STATUS = {
        id: "main",
        apple: false,
        google: false,
        facebook: false,
        linkedin: false,
        passwordManager: false,
    };

    let setupStatus = $derived<GuardianStatus>({
        ...DEFAULT_STATUS,
        ...(pending?.setupStatus ?? digitalGuardianSync.data?.setupStatus ?? {}),
        id: "main",
    });

    // --- FIRE DRILL SYNC ---
    interface FireDrill {
        id: string;
        key: boolean;
        twoFactor: boolean;
        login: boolean;
        phone: boolean;
        email: boolean;
        will: boolean;
    }
    const DEFAULT_DRILL = {
        id: "main",
        key: false,
        twoFactor: false,
        login: false,
        phone: false,
        email: false,
        will: false,
    };

    let fireDrill = $derived<FireDrill>({
        ...DEFAULT_DRILL,
        ...(pending?.fireDrill ?? digitalGuardianSync.data?.fireDrill ?? {}),
        id: "main",
    });

    // --- ASSETS SYNC ---
    // Use the unified store's sync instance
    let assets = $derived(digitalAssetsSync.items);
    let showWizard = $state(false);
    let isLoading = $state(true);

    onMount(async () => {
        await digitalAssetsSync.init();
        isLoading = false;
    });

    const wizardSteps = [
        {
            id: "intro",
            question: "wizard.digital_intro",
            type: "boolean" as const,
            logic: { yes: "password_manager", no: "EXIT" },
        },
        {
            id: "password_manager",
            question:
                "Do you use a Password Manager (like 1Password, LastPass)?",
            type: "boolean" as const,
            logic: { next: "email" },
        },
        {
            id: "email",
            question: "What is your primary email provider?",
            type: "select" as const,
            options: ["Gmail", "Outlook", "Yahoo", "iCloud", "Other"],
        },
    ];

    async function handleWizardComplete(answers: Record<string, any>) {
        if (answers.intro === false) {
            showWizard = false;
            return;
        }

        // Only what the answers say: the manager and usernames are left for the person to fill in.
        const wanted: [string, string, string][] = [];
        if (answers.password_manager) {
            // Update status (fire and forget update)
            updateStatus("passwordManager", true);
            wanted.push(["Password Manager", "", "Access"]);
        }
        if (answers.email) {
            wanted.push([answers.email === "Other" ? "Email" : answers.email, "", "Email"]);
        }

        showWizard = false;
        if (wanted.length > 0) await saveWizardAssets(wanted);
    }

    // One wizard run is one save: the creates run quietly, then one affirmation when all land,
    // or one gentle message whose Try Again re-sends only the accounts still waiting.
    async function saveWizardAssets(wanted: [string, string, string][]) {
        const results = await Promise.allSettled(
            wanted.map(([platform, username, type]) => addAsset(platform, username, type, true)),
        );
        const waiting = wanted.filter((_, i) => results[i].status === "rejected");
        if (waiting.length === 0) {
            notifications.showAffirmation("general", "create");
            return;
        }
        const reason = results.find((r) => r.status === "rejected") as PromiseRejectedResult;
        notifications.showError(
            {
                message:
                    "Your answers are safe here. We can save them again whenever you're ready.",
                code: "DATABASE_ERROR",
                technicalDetails: reason.reason?.technicalDetails || reason.reason?.message || String(reason.reason),
            },
            () => saveWizardAssets(waiting),
        );
    }

    function updateStatus(
        key: keyof Omit<GuardianStatus, "id">,
        value: boolean,
    ) {
        const { id: _id, ...current } = setupStatus;
        saveChecks({ setupStatus: { ...current, [key]: value } });
    }

    type Wishes = Pick<DigitalAccount, "description" | "preference" | "instructions" | "priority">;
    async function addAsset(platform: string, username: string, type: string, quiet = false, wishes: Wishes = {}) {
        let newAsset;
        try {
        newAsset = await digitalAssetsSync.create({
            platform,
            username,
            type,
            isClosed: false,
            ...wishes,
            description: wishes.description || `${type} Account`,
        }, false, quiet, quiet ? undefined : () => addAsset(platform, username, type, false, wishes));
        } catch (e) {
            if (quiet) throw e; // the wizard shows one message for the whole run
            return; // the manager already showed the one gentle message
        }

        activityLog.logEvent({
            module: "Digital Guardian",
            action: "CREATE",
            entityType: "Digital Asset",
            entityId: newAsset.id,
            entityName: platform,
            userContext: $estateProfile.ownerName || "User",
        });
    }

    // Edit: the add modal's shell, filled in with the account's details; one update on save.
    let editingId = $state<string | null>(null);
    // Wishes (preference, instructions, priority) are set here too, not only in the Advanced Registry.
    const EMPTY_DRAFT = { platform: "", username: "", type: "", description: "", preference: "", instructions: "", priority: "" };
    let draft = $state({ ...EMPTY_DRAFT });

    // An example row opens the form filled in; nothing is saved until the person saves it.
    function openNew(prefill: Partial<DigitalAccount> = {}) {
        editingId = "new";
        draft = {
            ...EMPTY_DRAFT,
            platform: prefill.platform ?? "",
            username: prefill.username ?? "",
            type: prefill.type ?? "",
            preference: prefill.preference && prefill.preference !== "none" ? prefill.preference : "",
            instructions: prefill.instructions ?? "",
            priority: prefill.priority ?? "",
        };
    }

    function openEdit(asset: DigitalAccount) {
        editingId = String(asset.id);
        draft = {
            platform: asset.platform || asset.name || "",
            username: asset.username ?? "",
            type: asset.type ?? "",
            description: asset.description ?? "",
            preference: asset.preference && asset.preference !== "none" ? asset.preference : "",
            instructions: asset.instructions ?? "",
            priority: asset.priority ?? "",
        };
    }

    // One save at a time: while it is open the button waits, so a second click sends nothing.
    let savingEdit = $state(false);
    async function saveEdit() {
        if (savingEdit) return;
        savingEdit = true;
        try {
            await saveEditOnce();
        } finally {
            savingEdit = false;
        }
    }

    async function saveEditOnce() {
        if (!editingId) return;
        const id = editingId;
        if (id === "new") {
            const d = $state.snapshot(draft);
            editingId = null;
            const { platform, username, type, ...wishes } = d;
            await addAsset(platform.trim(), username, type || "Account", false, wishes as Wishes);
            return;
        }
        const changes = { ...$state.snapshot(draft), name: draft.platform };
        editingId = null;
        try {
            await digitalAssetsSync.update(id, changes as Partial<DigitalAccount>);
        } catch {
            // the manager already showed the one gentle message
        }
    }

    async function deleteAsset(id: string) {
        if (!(await askConfirm("Remove this account from your inventory?"))) return;
        try {
            await digitalAssetsSync.delete(id);
        } catch {
            // the manager already showed the one gentle message
        }
    }

    function markComplete(id: keyof Omit<GuardianStatus, "id">) {
        // Toggle current value
        const current = setupStatus[id];
        updateStatus(id, !current);
    }

    function toggleGuide(id: string) {
        if (activeGuide === id) {
            activeGuide = null;
        } else {
            activeGuide = id;
        }
    }

    function toggleDrill(step: keyof Omit<FireDrill, "id">) {
        const { id: _id, ...current } = fireDrill;
        saveChecks({ fireDrill: { ...current, [step]: !current[step] } });
    }
</script>

{#if isLoading}
    <div class="flex items-center justify-center py-12">
        <Loader2 class="w-8 h-8 animate-spin text-primary" />
    </div>
{:else}
<div class="max-w-5xl mx-auto p-8 animate-in fade-in duration-500">
    <!-- Header -->
    <LivingBlueprintHeader
        title="Digital Guardian"
        subtitle="Keep your digital legacy within your family's reach"
        detailedDescription="Your physical assets are protected by law. Your digital assets are protected by passwords. Set up legacy contacts, inactive account managers, and document your digital inventory so your family can reach your photos, emails, and accounts."
        whyMatters="These setups keep your family connected to irreplaceable memories, important accounts, and digital assets."
    />

    <!-- AI Prompt Bar -->
    <div class="max-w-3xl mx-auto mb-8">
        <AIPromptBar context="digital-guardian" />
    </div>

    <!-- Global Successor Sync Card -->
    <div class="mb-12 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div
            class="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex items-center gap-5"
        >
            <div class="p-4 bg-primary/10 text-primary rounded-2xl shrink-0">
                <UserCheck size={28} />
            </div>
            <div>
                <span
                    class="text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-1"
                    >Primary Digital Successor</span
                >
                <div class="text-xl font-bold text-slate-800">
                    {$estateExecutorName || "Your Lead Executor"}
                </div>
                <p class="text-xs text-slate-500 mt-1">
                    Synced from your Lead Executor designation.
                </p>
            </div>
        </div>

        <div
            class="bg-white border border-indigo-100 rounded-2xl p-6 shadow-sm flex items-center gap-5 relative overflow-hidden group"
        >
            <div
                class="absolute right-0 top-0 p-8 opacity-[0.03] group-hover:scale-110 transition-transform"
            >
                <Fingerprint size={80} />
            </div>
            <div class="p-4 bg-primary/10 text-primary rounded-2xl shrink-0">
                <Fingerprint size={28} />
            </div>
            <div>
                <span
                    class="text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-1"
                    >Recovery Verification Info</span
                >
                <div class="text-xl font-bold text-slate-800">
                    ID: {($estateProfile.ownerName || "").split(" ")[0]} / SSN: ***-**-{$estateProfile.last4SSN ||
                        "####"}
                </div>
                <p class="text-xs text-slate-500 mt-1">
                    Pre-filled for identity verification forms.
                </p>
            </div>
        </div>
    </div>

    <!-- Access Drill (Verification Mode) -->
    <div
        class="mb-12 bg-rose-50 border border-rose-100 rounded-2xl p-8 relative overflow-hidden"
    >
        <div class="relative z-10 flex flex-col md:flex-row items-start gap-6">
            <div class="p-4 bg-primary/10 text-primary rounded-2xl shrink-0">
                <Siren size={32} />
            </div>
            <div class="flex-1">
                <h3 class="font-serif font-bold text-2xl text-[#304743] mb-2">
                    A gentle practice run
                </h3>
                <p class="text-gray-600 mb-6 max-w-xl leading-relaxed">
                    Walk through it once with your Legacy Contact, so getting in
                    is simple when it matters.
                </p>

                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <button
                        class="text-left p-4 rounded-xl border transition-all group {fireDrill.key
                            ? 'bg-primary border-primary/20 text-primary-foreground'
                            : 'bg-white border-rose-200 hover:shadow-md'}"
                        onclick={() => toggleDrill("key")}
                    >
                        <span
                            class="block text-xs font-bold uppercase tracking-wide mb-1 {fireDrill.key
                                ? 'text-white/80'
                                : 'text-primary'}">Step 1</span
                        >
                        <div class="flex items-center gap-2">
                            <span
                                class="font-bold {fireDrill.key
                                    ? 'text-white'
                                    : 'text-gray-900 group-hover:text-primary'}"
                                >Locate the Key</span
                            >
                            {#if fireDrill.key}
                                <CircleCheck size={16} />
                            {/if}
                        </div>
                    </button>
                    <button
                        class="text-left p-4 rounded-xl border transition-all group {fireDrill.twoFactor
                            ? 'bg-primary border-primary/20 text-primary-foreground'
                            : 'bg-white border-rose-200 hover:shadow-md'}"
                        onclick={() => toggleDrill("twoFactor")}
                    >
                        <span
                            class="block text-xs font-bold uppercase tracking-wide mb-1 {fireDrill.twoFactor
                                ? 'text-white/80'
                                : 'text-primary'}">Step 2</span
                        >
                        <div class="flex items-center gap-2">
                            <span
                                class="font-bold {fireDrill.twoFactor
                                    ? 'text-white'
                                    : 'text-gray-900 group-hover:text-primary'}"
                                >Bypass 2FA</span
                            >
                            {#if fireDrill.twoFactor}
                                <CircleCheck size={16} />
                            {/if}
                        </div>
                    </button>
                    <button
                        class="text-left p-4 rounded-xl border transition-all group {fireDrill.login
                            ? 'bg-primary border-primary/20 text-primary-foreground'
                            : 'bg-white border-rose-200 hover:shadow-md'}"
                        onclick={() => toggleDrill("login")}
                    >
                        <span
                            class="block text-xs font-bold uppercase tracking-wide mb-1 {fireDrill.login
                                ? 'text-white/80'
                                : 'text-primary'}">Step 3</span
                        >
                        <div class="flex items-center gap-2">
                            <span
                                class="font-bold {fireDrill.login
                                    ? 'text-white'
                                    : 'text-gray-900 group-hover:text-primary'}"
                                >Confirm Login</span
                            >
                            {#if fireDrill.login}
                                <CircleCheck size={16} />
                            {/if}
                        </div>
                    </button>
                    <button
                        class="text-left p-4 rounded-xl border transition-all group {fireDrill.phone
                            ? 'bg-primary border-primary/20 text-primary-foreground'
                            : 'bg-white border-rose-200 hover:shadow-md'}"
                        onclick={() => toggleDrill("phone")}
                    >
                        <span
                            class="block text-xs font-bold uppercase tracking-wide mb-1 {fireDrill.phone
                                ? 'text-white/80'
                                : 'text-primary'}">Step 4</span
                        >
                        <div class="flex items-center gap-2">
                            <span
                                class="font-bold {fireDrill.phone
                                    ? 'text-white'
                                    : 'text-gray-900 group-hover:text-primary'}"
                                >Unlock Phone</span
                            >
                            {#if fireDrill.phone}
                                <CircleCheck size={16} />
                            {/if}
                        </div>
                    </button>
                    <button
                        class="text-left p-4 rounded-xl border transition-all group {fireDrill.email
                            ? 'bg-primary border-primary/20 text-primary-foreground'
                            : 'bg-white border-rose-200 hover:shadow-md'}"
                        onclick={() => toggleDrill("email")}
                    >
                        <span
                            class="block text-xs font-bold uppercase tracking-wide mb-1 {fireDrill.email
                                ? 'text-white/80'
                                : 'text-primary'}">Step 5</span
                        >
                        <div class="flex items-center gap-2">
                            <span
                                class="font-bold {fireDrill.email
                                    ? 'text-white'
                                    : 'text-gray-900 group-hover:text-primary'}"
                                >Access Email</span
                            >
                            {#if fireDrill.email}
                                <CircleCheck size={16} />
                            {/if}
                        </div>
                    </button>
                    <button
                        class="text-left p-4 rounded-xl border transition-all group {fireDrill.will
                            ? 'bg-primary border-primary/20 text-primary-foreground'
                            : 'bg-white border-rose-200 hover:shadow-md'}"
                        onclick={() => toggleDrill("will")}
                    >
                        <span
                            class="block text-xs font-bold uppercase tracking-wide mb-1 {fireDrill.will
                                ? 'text-white/80'
                                : 'text-primary'}">Step 6</span
                        >
                        <div class="flex items-center gap-2">
                            <span
                                class="font-bold {fireDrill.will
                                    ? 'text-white'
                                    : 'text-gray-900 group-hover:text-primary'}"
                                >Locate Will</span
                            >
                            {#if fireDrill.will}
                                <CircleCheck size={16} />
                            {/if}
                        </div>
                    </button>
                </div>
            </div>
        </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
        <!-- Apple Legacy Contact -->
        <div
            class="bg-white rounded-2xl border border-border overflow-hidden shadow-sm hover:shadow-md transition-shadow"
        >
            <button
                class="w-full text-left p-6 flex items-start gap-4 cursor-pointer"
                onclick={() => toggleGuide("apple")}
            >
                <div
                    class="w-12 h-12 rounded-xl bg-gray-50 flex items-center justify-center shrink-0"
                >
                    <Apple class="w-6 h-6 text-foreground" />
                </div>
                <div class="flex-1">
                    <div class="flex items-center justify-between mb-1">
                        <h3 class="font-bold text-lg text-foreground">
                            Apple Legacy Contact
                        </h3>
                        {#if activeGuide === "apple"}
                            <ChevronDown
                                class="w-5 h-5 text-muted-foreground"
                            />
                        {:else}
                            <ChevronRight
                                class="w-5 h-5 text-muted-foreground"
                            />
                        {/if}
                    </div>
                    <p class="text-sm text-muted-foreground">
                        Choose someone who can reach your Apple account data
                        when you're gone.
                    </p>
                </div>
            </button>

            {#if activeGuide === "apple"}
                <div
                    class="p-6 bg-gray-50 border-t border-gray-100"
                    transition:slide
                >
                    <ol
                        class="space-y-4 text-sm text-gray-700 list-decimal pl-4 mb-6"
                    >
                        <li>
                            Open <strong>Settings</strong> on your iPhone / iPad.
                        </li>
                        <li>
                            Tap your <strong>Name</strong> (Apple ID) at the top.
                        </li>
                        <li>
                            Select <strong>Sign-In & Security</strong> >
                            <strong>Legacy Contact</strong>.
                        </li>
                        <li>
                            Tap <strong>Add Legacy Contact</strong> and choose a
                            trusted person.
                        </li>
                        <li>
                            <strong>Print the Access Key</strong> provided and store
                            it in your physical Red Binder.
                        </li>
                    </ol>
                    <div
                        class="flex items-center gap-4 pt-4 border-t border-gray-200"
                    >
                        <a
                            href="https://support.apple.com/en-us/HT212360"
                            target="_blank"
                            class="text-sky-600 font-bold text-xs flex items-center gap-1 hover:underline"
                        >
                            Official Guide <ExternalLink size={12} />
                        </a>
                        <button
                            onclick={() => markComplete("apple")}
                            class="ml-auto text-xs font-bold px-3 py-1.5 rounded-full border border-gray-300 hover:bg-green-50 hover:text-green-700 hover:border-green-200 transition-colors"
                        >
                            {setupStatus.apple
                                ? "Mark In Progress"
                                : "Mark Done"}
                        </button>
                    </div>
                </div>
            {/if}
        </div>

        <!-- Google Inactive Account Manager -->
        <div
            class="bg-white rounded-2xl border border-border overflow-hidden shadow-sm hover:shadow-md transition-shadow"
        >
            <button
                class="w-full text-left p-6 flex items-start gap-4 cursor-pointer"
                onclick={() => toggleGuide("google")}
            >
                <div
                    class="w-12 h-12 rounded-xl bg-gray-50 flex items-center justify-center shrink-0"
                >
                    <Mail class="w-6 h-6 text-foreground" />
                </div>
                <div class="flex-1">
                    <div class="flex items-center justify-between mb-1">
                        <h3 class="font-bold text-lg text-foreground">
                            Google Inactive Account
                        </h3>
                        {#if activeGuide === "google"}
                            <ChevronDown
                                class="w-5 h-5 text-muted-foreground"
                            />
                        {:else}
                            <ChevronRight
                                class="w-5 h-5 text-muted-foreground"
                            />
                        {/if}
                    </div>
                    <p class="text-sm text-muted-foreground">
                        Decide when Google should consider your account inactive
                        and what to do with your data.
                    </p>
                </div>
            </button>

            {#if activeGuide === "google"}
                <div
                    class="p-6 bg-gray-50 border-t border-gray-100"
                    transition:slide
                >
                    <p class="text-sm text-gray-600 mb-4">
                        Google can notify your chosen contact after a period of
                        no sign-ins that you choose.
                    </p>
                    <ol
                        class="space-y-4 text-sm text-gray-700 list-decimal pl-4 mb-6"
                    >
                        <li>Go to <strong>myaccount.google.com</strong>.</li>
                        <li>
                            Search for <strong
                                >"Inactive Account Manager"</strong
                            >.
                        </li>
                        <li>Set waiting period (e.g., 3 months).</li>
                        <li>
                            Choose who to notify and what data they can access
                            (Photos, Drive, etc.).
                        </li>
                        <li>Review the auto-reply email they will receive.</li>
                    </ol>
                    <div
                        class="flex items-center gap-4 pt-4 border-t border-gray-200"
                    >
                        <a
                            href="https://myaccount.google.com/inactive"
                            target="_blank"
                            class="text-sky-600 font-bold text-xs flex items-center gap-1 hover:underline"
                        >
                            Direct Link <ExternalLink size={12} />
                        </a>
                        <button
                            onclick={() => markComplete("google")}
                            class="ml-auto text-xs font-bold px-3 py-1.5 rounded-full border border-gray-300 hover:bg-green-50 hover:text-green-700 hover:border-green-200 transition-colors"
                        >
                            {setupStatus.google
                                ? "Mark In Progress"
                                : "Mark Done"}
                        </button>
                    </div>
                </div>
            {/if}
        </div>

        <!-- Password Manager (The Master Key) -->
        <div
            class="bg-white rounded-2xl border border-border overflow-hidden shadow-sm hover:shadow-md transition-shadow md:col-span-2"
        >
            <button
                class="w-full text-left p-6 flex items-start gap-4 cursor-pointer"
                onclick={() => toggleGuide("passwordManager")}
            >
                <div
                    class="w-12 h-12 rounded-xl bg-gray-50 flex items-center justify-center shrink-0"
                >
                    <Key class="w-6 h-6 text-foreground" />
                </div>
                <div class="flex-1">
                    <div class="flex items-center justify-between mb-1">
                        <h3 class="font-bold text-lg text-foreground">
                            Password Manager Setup
                        </h3>
                        {#if activeGuide === "passwordManager"}
                            <ChevronDown
                                class="w-5 h-5 text-muted-foreground"
                            />
                        {:else}
                            <ChevronRight
                                class="w-5 h-5 text-muted-foreground"
                            />
                        {/if}
                    </div>
                    <p class="text-sm text-muted-foreground">
                        You can let your executor know where to find your master
                        password, through a secure mechanism (e.g., emergency kit).
                    </p>
                </div>
            </button>
            {#if activeGuide === "passwordManager"}
                <div
                    class="p-6 bg-gray-50 border-t border-gray-100"
                    transition:slide
                >
                    <div
                        class="flex gap-4 items-start bg-amber-50 p-4 rounded-lg border border-amber-100 text-amber-900 text-sm mb-6"
                    >
                        <Lock size={18} class="shrink-0 mt-0.5" />
                        <div>
                            <strong
                                >It is safest to keep your Master Password on paper, in your Red Binder.</strong
                            ><br />
                            It should be written down on the Emergency Card in your
                            physical Red Binder, or stored in a bank safety deposit
                            box.
                        </div>
                    </div>

                    <h4 class="font-bold text-sm mb-2">
                        Emergency Kit Checklist:
                    </h4>
                    <ul
                        class="space-y-2 text-sm text-gray-700 list-disc pl-4 mb-6"
                    >
                        <li>
                            Export your "Emergency Kit" PDF from your password
                            manager.
                        </li>
                        <li>
                            You can write the Master Password on it.
                        </li>
                        <li>
                            You can seal it in an envelope marked "For Executor".
                        </li>
                        <li>Place in Red Binder or Safe.</li>
                    </ul>
                    <div
                        class="flex items-center gap-4 pt-4 border-t border-gray-200"
                    >
                        <button
                            onclick={() => markComplete("passwordManager")}
                            class="ml-auto text-xs font-bold px-3 py-1.5 rounded-full border border-gray-300 hover:bg-green-50 hover:text-green-700 hover:border-green-200 transition-colors"
                        >
                            {setupStatus.passwordManager
                                ? "Mark In Progress"
                                : "Mark Done"}
                        </button>
                    </div>
                </div>
            {/if}
        </div>

        <!-- Social Media -->
        <div
            class="bg-white rounded-2xl border border-border overflow-hidden shadow-sm hover:shadow-md transition-shadow"
        >
            <button
                class="w-full text-left p-6 flex items-start gap-4 cursor-pointer"
                onclick={() => toggleGuide("facebook")}
            >
                <div
                    class="w-12 h-12 rounded-xl bg-gray-50 flex items-center justify-center shrink-0"
                >
                    <Facebook class="w-6 h-6 text-foreground" />
                </div>
                <div class="flex-1">
                    <div class="flex items-center justify-between mb-1">
                        <h3 class="font-bold text-lg text-foreground">
                            Facebook Legacy Contact
                        </h3>
                        {#if activeGuide === "facebook"}
                            <ChevronDown
                                class="w-5 h-5 text-muted-foreground"
                            />
                        {:else}
                            <ChevronRight
                                class="w-5 h-5 text-muted-foreground"
                            />
                        {/if}
                    </div>
                    <p class="text-sm text-muted-foreground">
                        Designate a legacy contact to manage your memorialized
                        account.
                    </p>
                </div>
            </button>
            {#if activeGuide === "facebook"}
                <div
                    class="p-6 bg-gray-50 border-t border-gray-100"
                    transition:slide
                >
                    <ol
                        class="space-y-4 text-sm text-gray-700 list-decimal pl-4 mb-6"
                    >
                        <li>Settings & Privacy > Settings.</li>
                        <li><strong>Memorialization Settings</strong>.</li>
                        <li>
                            Choose a friend to manage your account (they can pin
                            posts, change profile pic).
                        </li>
                        <li>Or you can choose "Delete After Death".</li>
                    </ol>
                    <div
                        class="flex items-center gap-4 pt-4 border-t border-gray-200"
                    >
                        <button
                            onclick={() => markComplete("facebook")}
                            class="ml-auto text-xs font-bold px-3 py-1.5 rounded-full border border-gray-300 hover:bg-green-50 hover:text-green-700 hover:border-green-200 transition-colors"
                        >
                            {setupStatus.facebook
                                ? "Mark In Progress"
                                : "Mark Done"}
                        </button>
                    </div>
                </div>
            {/if}
        </div>

        <div
            class="bg-white rounded-2xl border border-border overflow-hidden shadow-sm hover:shadow-md transition-shadow"
        >
            <button
                class="w-full text-left p-6 flex items-start gap-4 cursor-pointer"
                onclick={() => toggleGuide("linkedin")}
            >
                <div
                    class="w-12 h-12 rounded-xl bg-gray-50 flex items-center justify-center shrink-0"
                >
                    <Linkedin class="w-6 h-6 text-foreground" />
                </div>
                <div class="flex-1">
                    <div class="flex items-center justify-between mb-1">
                        <h3 class="font-bold text-lg text-foreground">
                            LinkedIn Memorialization
                        </h3>
                        {#if activeGuide === "linkedin"}
                            <ChevronDown
                                class="w-5 h-5 text-muted-foreground"
                            />
                        {:else}
                            <ChevronRight
                                class="w-5 h-5 text-muted-foreground"
                            />
                        {/if}
                    </div>
                    <p class="text-sm text-muted-foreground">
                        Request to memorialize or close the account of a
                        deceased member.
                    </p>
                </div>
            </button>
            {#if activeGuide === "linkedin"}
                <div
                    class="p-6 bg-gray-50 border-t border-gray-100"
                    transition:slide
                >
                    <p class="text-sm text-gray-600 mb-4">
                        Your executor can contact LinkedIn when the time comes.
                    </p>
                    <ul
                        class="space-y-4 text-sm text-gray-700 list-disc pl-4 mb-6"
                    >
                        <li>
                            Include your LinkedIn URL in your Executor Toolkit.
                        </li>
                        <li>
                            Note your preference: <strong>Memorialize</strong>
                            (stays up) or <strong>Close Account</strong>.
                        </li>
                        <li>
                            Your executor will have a link to the obituary or the
                            death certificate ready.
                        </li>
                    </ul>
                    <div
                        class="flex items-center gap-4 pt-4 border-t border-gray-200"
                    >
                        <button
                            onclick={() => markComplete("linkedin")}
                            class="ml-auto text-xs font-bold px-3 py-1.5 rounded-full border border-gray-300 hover:bg-green-50 hover:text-green-700 hover:border-green-200 transition-colors"
                        >
                            {setupStatus.linkedin
                                ? "Mark In Progress"
                                : "Mark Done"}
                        </button>
                    </div>
                </div>
            {/if}
        </div>
    </div>

    <!-- Digital Assets Inventory -->
    <div
        class="mt-12 mb-20 animate-in fade-in slide-in-from-bottom-4 duration-700"
    >
        <div class="flex flex-wrap items-center justify-between gap-4 mb-6">
            <div>
                <h2 class="font-serif font-bold text-2xl text-[#304743]">
                    Digital Asset Inventory
                </h2>
                <p class="text-slate-500 text-sm">
                    Key accounts your executor needs access to.
                </p>
            </div>
            <div class="flex flex-wrap items-center gap-3">
                <button
                    onclick={() => (showWizard = true)}
                    class="bg-[#304743] text-white px-4 py-2 rounded-full font-bold hover:bg-[#2a3f3b] transition-colors flex items-center gap-2 text-sm"
                >
                    <Siren size={16} /> Walk me through my accounts
                </button>
                <button
                    onclick={() => openNew()}
                    data-testid="digital-add"
                    class="flex items-center gap-2 px-5 py-2 bg-primary text-primary-foreground rounded-xl font-semibold shadow-lg shadow-primary/20 hover:opacity-90 transition-all text-sm"
                >
                    <Plus class="w-4 h-4" />
                    Share an account
                </button>
                <DataViewToggle module="digital-guardian" />
            </div>
        </div>

        <div class="space-y-3">
            {#if showWizard}
                <div role="dialog" aria-modal="true" use:focusTrap={{ onEscape: () => (showWizard = false) }}
                    class="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
                    transition:fade
                >
                    <div
                        class="w-full max-w-2xl relative bg-white rounded-2xl shadow-2xl overflow-hidden"
                        transition:slide
                    >
                        <button aria-label="Close"
                            class="absolute top-4 right-4 text-gray-400 hover:text-gray-600 z-10"
                            onclick={() => (showWizard = false)}
                        >
                            <X size={20} />
                        </button>
                        <ConciergeFlow
                            steps={wizardSteps}
                            oncomplete={handleWizardComplete}
                        />
                    </div>
                </div>
            {/if}

            {#if editingId}
                <div
                    role="dialog"
                    aria-modal="true"
                    aria-label={editingId === "new" ? "Add an account" : "Edit these details"}
                    use:focusTrap={{ onEscape: () => (editingId = null) }}
                    class="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
                    transition:fade
                >
                    <form
                        class="w-full max-w-2xl relative bg-white rounded-2xl shadow-2xl overflow-hidden"
                        transition:slide
                        aria-label="Edit these details"
                        data-testid="digital-edit-form"
                        onsubmit={(e) => { e.preventDefault(); saveEdit(); }}
                    >
                        <button
                            type="button"
                            aria-label="Maybe later"
                            class="absolute top-4 right-4 text-gray-400 hover:text-gray-600 z-10"
                            onclick={() => (editingId = null)}
                        >
                            <X size={20} />
                        </button>
                        <div class="p-8 space-y-4">
                            <h3 class="font-serif font-bold text-2xl text-[#304743]">
                                {editingId === "new" ? "Add an account" : "Edit these details"}
                            </h3>
                            <label class="block text-sm font-bold text-slate-600">
                                Platform
                                <input bind:value={draft.platform} name="platform" class="mt-1 w-full border border-slate-200 rounded-xl px-3 py-2 font-normal text-slate-800" />
                            </label>
                            <label class="block text-sm font-bold text-slate-600">
                                Username
                                <input bind:value={draft.username} name="username" class="mt-1 w-full border border-slate-200 rounded-xl px-3 py-2 font-normal text-slate-800" />
                            </label>
                            <label class="block text-sm font-bold text-slate-600">
                                Type
                                <input bind:value={draft.type} name="type" class="mt-1 w-full border border-slate-200 rounded-xl px-3 py-2 font-normal text-slate-800" />
                            </label>
                            <label class="block text-sm font-bold text-slate-600">
                                Description
                                <input bind:value={draft.description} name="description" class="mt-1 w-full border border-slate-200 rounded-xl px-3 py-2 font-normal text-slate-800" />
                            </label>
                            <div class="grid grid-cols-2 gap-4">
                                <label class="block text-sm font-bold text-slate-600">
                                    Preference
                                    <select bind:value={draft.preference} name="preference" class="mt-1 w-full border border-slate-200 rounded-xl px-3 py-2 font-normal text-slate-800 bg-white">
                                        <option value=""></option>
                                        <option value="memorialize">Memorialize</option>
                                        <option value="delete">Remove / Close the account</option>
                                        <option value="transfer">Transfer Ownership</option>
                                    </select>
                                </label>
                                <label class="block text-sm font-bold text-slate-600">
                                    Priority
                                    <select bind:value={draft.priority} name="priority" class="mt-1 w-full border border-slate-200 rounded-xl px-3 py-2 font-normal text-slate-800 bg-white">
                                        <option value=""></option>
                                        <option value="low">Low</option>
                                        <option value="medium">Medium</option>
                                        <option value="high">High</option>
                                    </select>
                                </label>
                            </div>
                            <label class="block text-sm font-bold text-slate-600">
                                Final Instructions
                                <textarea bind:value={draft.instructions} name="instructions" rows="3" placeholder="Any specific details about handling this item..." class="mt-1 w-full border border-slate-200 rounded-xl px-3 py-2 font-normal text-slate-800 resize-none"></textarea>
                            </label>
                        </div>
                        <div class="px-8 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
                            <button
                                type="button"
                                onclick={() => (editingId = null)}
                                class="px-6 py-2.5 rounded-xl font-semibold text-slate-600 hover:bg-slate-200 transition-colors"
                            >
                                Maybe later
                            </button>
                            <button
                                type="submit"
                                disabled={!draft.platform.trim() || savingEdit}
                                aria-busy={savingEdit}
                                class="px-6 py-2.5 rounded-xl font-semibold bg-[#304743] text-white hover:bg-[#2a3f3b] transition-colors disabled:opacity-50"
                            >
                                {savingEdit ? "Saving..." : editingId === "new" ? "Save my thoughts" : "Save my updates"}
                            </button>
                        </div>
                    </form>
                </div>
            {/if}

            {#if assets.length === 0}
                <!-- Ghost Rows -->
                {#each getSmartSamples($language).digital || [] as sample}
                    <GhostRow
                        name={sample.platform}
                        subtitle={`${sample.username} - ${sample.instructions}`}
                        type="Security"
                        onClick={() => openNew({ ...sample, type: "Vault" })}
                    >
                        {#snippet icon()}
                            <Key size={20} class="text-slate-400" />
                        {/snippet}
                    </GhostRow>
                {/each}
            {:else}
                {#if viewMode === 'card'}
                    {#each assets as asset (asset.id)}
                        <div
                            class="bg-white p-4 rounded-xl border border-slate-100 flex justify-between items-center shadow-sm"
                            transition:slide
                        >
                            <div class="flex items-center gap-4">
                                <div
                                    class="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary"
                                >
                                    {#if asset.type === "Email"}
                                        <Mail size={18} />
                                    {:else}
                                        <Key size={18} />
                                    {/if}
                                </div>
                                <div>
                                    <div class="font-bold text-slate-800">
                                        {asset.platform || asset.name}
                                    </div>
                                    <div
                                        class="text-xs text-slate-500 uppercase tracking-wider"
                                    >
                                        {[asset.username, asset.description].filter(Boolean).join(" - ")}
                                    </div>
                                </div>
                            </div>
                            <div class="flex items-center gap-1">
                                <button
                                    onclick={() => openEdit(asset)}
                                    aria-label="Edit these details"
                                    title="Edit these details"
                                    class="text-slate-400 hover:text-primary p-2 hover:bg-primary/5 rounded-full transition-colors"
                                >
                                    <Pencil size={16} />
                                </button>
                                <button
                                    onclick={() => deleteAsset(asset.id)}
                                    aria-label="Remove this item"
                                    title="Remove this item"
                                    class="text-red-400 hover:text-red-600 p-2 hover:bg-red-50 rounded-full transition-colors"
                                >
                                    <X size={16} />
                                </button>
                            </div>
                        </div>
                    {/each}
                {:else}
                    <!-- Table View -->
                    <div class="bg-white rounded-xl border border-slate-200 overflow-hidden">
                        <table class="w-full">
                            <thead class="bg-slate-50 border-b border-slate-200">
                                <tr>
                                    <th class="text-left px-4 py-3 text-xs font-bold uppercase text-slate-500">Platform</th>
                                    <th class="text-left px-4 py-3 text-xs font-bold uppercase text-slate-500">Username</th>
                                    <th class="text-left px-4 py-3 text-xs font-bold uppercase text-slate-500">Type</th>
                                    <th class="text-left px-4 py-3 text-xs font-bold uppercase text-slate-500">Description</th>
                                    <th class="text-right px-4 py-3 text-xs font-bold uppercase text-slate-500">Actions</th>
                                </tr>
                            </thead>
                            <tbody class="divide-y divide-slate-100">
                                {#each assets as asset (asset.id)}
                                    <tr class="hover:bg-slate-50 transition-colors">
                                        <td class="px-4 py-3 font-medium text-slate-800">{asset.platform || asset.name}</td>
                                        <td class="px-4 py-3 text-slate-600">{asset.username}</td>
                                        <td class="px-4 py-3">
                                            <span class="px-2 py-1 bg-slate-100 text-slate-600 rounded text-xs font-medium">
                                                {asset.type}
                                            </span>
                                        </td>
                                        <td class="px-4 py-3 text-slate-500 text-sm">{asset.description}</td>
                                        <td class="px-4 py-3 text-right">
                                            <button
                                                onclick={() => openEdit(asset)}
                                                aria-label="Edit these details"
                                                title="Edit these details"
                                                class="text-slate-400 hover:text-primary p-1 hover:bg-primary/5 rounded transition-colors"
                                            >
                                                <Pencil size={16} />
                                            </button>
                                            <button
                                                onclick={() => deleteAsset(asset.id)}
                                                aria-label="Remove this item"
                                                title="Remove this item"
                                                class="text-red-400 hover:text-red-600 p-1 hover:bg-red-50 rounded transition-colors"
                                            >
                                                <X size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                {/each}
                            </tbody>
                        </table>
                    </div>
                {/if}
            {/if}
        </div>
    </div>
</div>
{/if}
