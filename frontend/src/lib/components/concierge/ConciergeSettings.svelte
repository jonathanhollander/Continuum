<script lang="ts">
    import { askConfirm } from "$lib/components/ui/ConfirmModal.svelte";
    import {
        encouragementMode,
        userRole,
        language,
        dict,
    } from "$lib/stores/conciergeStore.svelte";
    import { accessibilityStore } from "$lib/stores/accessibilityStore";
    import {
        estateProfile,
        type EstateProfile,
    } from "$lib/stores/estateStore.svelte";
    import {
        Download,
        FileText,
        HeartHandshake,
        Shield,
        Users,
        Languages,
        Sparkles,
        UserCircle,
        Check,
        Building,
        CalendarDays,
        ShieldCheck,
        Activity,
        Palette,
        Sun,
        Moon,
        Monitor,
        RotateCcw,
    } from "lucide-svelte";
    import { goto } from "$app/navigation";
    import type { ExportScope } from "$lib/services/exportService";

    import { profiles } from "$lib/stores/profileContext";
    import { triggerMagic } from "$lib/stores/magicStore";

    const roles = [
        { id: "Owner", key: "roleOwner", descKey: "roleOwnerDesc" },
        { id: "Executor", key: "roleExecutor", descKey: "roleExecutorDesc" },
        { id: "Family", key: "roleFamily", descKey: "roleFamilyDesc" },
    ];

    const languages = [
        { id: "en", label: "English", native: "English" },
        { id: "es", label: "Spanish", native: "Español" },
        { id: "fr", label: "French", native: "Français" },
        { id: "de", label: "German", native: "Deutsch" },
        { id: "ru", label: "Russian", native: "Русский" },
        { id: "he", label: "Hebrew", native: "עברית" },
    ];

    // The perspective is saved with the account, so it changes only after a confirm
    async function choosePerspective(role: (typeof roles)[number]) {
        if ($userRole === role.id) return;
        const label = $dict[role.key] || role.id;
        if (!(await askConfirm(`Change your perspective to ${label}? You can switch back here anytime.`, "Change my perspective"))) return;
        userRole.set(role.id as any);
    }

    // Export State
    let selectedScope = $state<ExportScope>("full");
    let includeImages = $state(true);
    let isSaving = $state(false);

    async function handleExport() {
        const params = new URLSearchParams({
            scope: selectedScope,
            images: String(includeImages),
        });
        await goto(`/export/preview?${params.toString()}`);
    }

    function toggleEncouragement() {
        encouragementMode.update((current) => {
            if (current === "Full") return "Soft";
            if (current === "Soft") return "Hidden";
            return "Full";
        });
    }

    function getEncouragementLabel(mode: string) {
        switch (mode) {
            case "Full":
                return $dict.encFull || "Full Support";
            case "Soft":
                return $dict.encSoft || "Gentle Reminders";
            case "Hidden":
                return $dict.encHidden || "Zen Mode";
            default:
                return mode;
        }
    }

    // The profile form edits a local draft; "Save Profile" writes it through estateProfile.update.
    // (estateProfile has no set, so binding $estateProfile.x directly threw on every keystroke.)
    const profileKeys = [
        "ownerName",
        "ownerPhone",
        "executorName",
        "dateOfDeath",
        "last4SSN",
        "legalCityState",
        "legalAddress",
        "spouseName",
        "primaryBeneficiary",
    ] as const;
    type ProfileDraft = Pick<EstateProfile, (typeof profileKeys)[number]>;
    const pickDraft = (p: EstateProfile): ProfileDraft =>
        Object.fromEntries(profileKeys.map((k) => [k, p[k] ?? ""])) as ProfileDraft;

    let draft = $state<ProfileDraft>(pickDraft(estateProfile.current));
    // Set while the person has unsaved edits, so a sync arriving meanwhile keeps their words.
    let draftEdited = false;

    $effect(() => {
        const p = $estateProfile;
        if (!draftEdited) draft = pickDraft(p);
    });

    async function saveProfile() {
        if (isSaving) return;
        isSaving = true;
        try {
            await estateProfile.update({ ...draft });
            draftEdited = false;

            // Keep the owner profile chip's name in step with the saved owner name
            if (draft.ownerName) {
                profiles.update((current) =>
                    current.map((p) =>
                        p.id === "owner" ? { ...p, name: draft.ownerName } : p,
                    ),
                );
            }
            triggerMagic("success");
        } catch {
            // The store has already shown the gentle failure note with a retry; the draft stays.
        } finally {
            isSaving = false;
        }
    }
</script>

<div class="space-y-12">
    <!-- 1. PERSPECTIVE & LANGUAGE -->
    <section class="space-y-6">
        <div class="flex items-center gap-3 border-b border-border pb-2">
            <div class="p-2 bg-primary-soft text-primary-hover rounded-lg">
                <Users size={18} />
            </div>
            <h2 class="font-serif text-xl text-foreground">
                {$dict.sectionIdentity}
            </h2>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <!-- Role Selection -->
            <div class="space-y-4">
                <span
                    id="cs-perspective-label"
                    class="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                >
                    {$dict.labelPerspective}
                </span>
                <p class="text-sm text-muted-foreground">
                    Choose how you view the records in this account. Use recipient links
                    and their previews to manage what you share with someone else.
                </p>
                <div
                    role="group"
                    aria-labelledby="cs-perspective-label"
                    class="bg-background border border-border p-1 rounded-xl flex items-center gap-1"
                >
                    {#each roles as role}
                        <button
                            class="flex-1 px-4 py-3 rounded-lg text-sm font-bold uppercase tracking-wider transition-all duration-200
                            {$userRole === role.id
                                ? 'bg-primary text-primary-foreground shadow-lg'
                                : 'text-muted-foreground hover:text-foreground'}"
                            onclick={() => choosePerspective(role)}
                        >
                            <div class="flex flex-col items-center gap-1">
                                <span>{$dict[role.key] || role.id}</span>
                                <span
                                    class="text-[8px] normal-case font-medium leading-none"
                                >
                                    {$dict[role.descKey]}
                                </span>
                            </div>
                        </button>
                    {/each}
                </div>
            </div>

            <!-- Language Selection -->
            <div class="space-y-4">
                <span
                    id="cs-language-label"
                    class="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                >
                    {$dict.labelLanguages}
                </span>
                <div
                    role="group"
                    aria-labelledby="cs-language-label"
                    class="grid grid-cols-2 gap-2"
                >
                    {#each languages as lang}
                        <button
                            class="flex flex-col items-center justify-center p-3 rounded-xl border transition-all duration-200
                            {$language === lang.id
                                ? 'bg-primary border-primary text-primary-foreground shadow-md'
                                : 'bg-card border-border text-muted-foreground hover:bg-muted'}"
                            onclick={() => language.set(lang.id as any)}
                        >
                            <span class="text-sm font-medium"
                                >{lang.native}</span
                            >
                        </button>
                    {/each}
                </div>
            </div>
        </div>
    </section>

    <!-- 2. ESTATE PROFILE -->
    <section class="space-y-6">
        <div class="flex items-center gap-3 border-b border-border pb-2">
            <div class="p-2 bg-primary-soft text-primary-hover rounded-lg">
                <ShieldCheck size={18} />
            </div>
            <h2 class="font-serif text-xl text-foreground">
                {$dict.sectionProfile}
            </h2>
        </div>

        <div
            class="space-y-6 bg-muted p-6 rounded-2xl border border-border shadow-inner"
            oninput={() => (draftEdited = true)}
        >
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <!-- Names -->
                <div class="space-y-4">
                    <div class="grid grid-cols-1 gap-1.5">
                        <label for="cs-owner"
                            class="text-[10px] font-bold text-muted-foreground uppercase"
                            >{$dict.labelOwner}</label
                        >
                        <input
 id="cs-owner"
                            type="text"
                            bind:value={draft.ownerName}
                            placeholder={$dict.placeholderName}
                            class="w-full px-4 py-2 bg-card border border-border rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all shadow-sm"
                        />
                    </div>
                    <div class="grid grid-cols-1 gap-1.5">
                        <label for="cs-phone"
                            class="text-[10px] font-bold text-muted-foreground uppercase"
                            >{$dict.labelOwnerPhone}</label
                        >
                        <input
                            id="cs-phone"
                            type="tel"
                            autocomplete="tel"
                            bind:value={draft.ownerPhone}
                            class="w-full px-4 py-2 bg-card border border-border rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all shadow-sm"
                        />
                    </div>
                    <div class="grid grid-cols-1 gap-1.5">
                        <label for="cs-executor"
                            class="text-[10px] font-bold text-muted-foreground uppercase"
                            >{$dict.labelExecutor}</label
                        >
                        <input
 id="cs-executor"
                            type="text"
                            bind:value={draft.executorName}
                            placeholder={$dict.placeholderPrimary}
                            class="w-full px-4 py-2 bg-card border border-border rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all shadow-sm"
                        />
                    </div>
                    <div class="grid grid-cols-1 gap-1.5">
                        <label for="cs-spouse"
                            class="text-[10px] font-bold text-muted-foreground uppercase"
                            >{$dict.labelSpouse || "Spouse / Partner"}</label
                        >
                        <input
                            id="cs-spouse"
                            type="text"
                            bind:value={draft.spouseName}
                            placeholder={$dict.placeholderName}
                            class="w-full px-4 py-2 bg-card border border-border rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all shadow-sm"
                        />
                    </div>
                    <div class="grid grid-cols-1 gap-1.5">
                        <label for="cs-beneficiary"
                            class="text-[10px] font-bold text-muted-foreground uppercase"
                            >{$dict.labelPrimaryBeneficiary || "Primary Beneficiary"}</label
                        >
                        <input
                            id="cs-beneficiary"
                            type="text"
                            bind:value={draft.primaryBeneficiary}
                            placeholder={$dict.placeholderName}
                            class="w-full px-4 py-2 bg-card border border-border rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all shadow-sm"
                        />
                    </div>
                </div>

                <!-- Vital Info -->
                <div class="space-y-4">
                    <div class="grid grid-cols-2 gap-4">
                        {#if $userRole !== "Owner"}
<div class="grid grid-cols-1 gap-1.5">
                            <label for="cs-death"
                                class="text-[10px] font-bold text-muted-foreground uppercase"
                                >{$dict.labelDeathDate}</label
                            >
                            <input
 id="cs-death"
                                type="date"
                                bind:value={draft.dateOfDeath}
                                class="w-full px-4 py-2 bg-card border border-border rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none shadow-sm"
                            />
                        </div>
{/if}
                        <div class="grid grid-cols-1 gap-1.5">
                            <label for="cs-ssn"
                                class="text-[10px] font-bold text-muted-foreground uppercase"
                                >{$dict.labelSSN}</label
                            >
                            <input
 id="cs-ssn"
                                type="text"
                                maxlength="4"
                                bind:value={draft.last4SSN}
                                placeholder="####"
                                class="w-full px-4 py-2 bg-card border border-border rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none shadow-sm"
                            />
                        </div>
                    </div>
                    <div class="grid grid-cols-1 gap-1.5 pt-0.5">
                        <label for="cs-residence"
                            class="text-[10px] font-bold text-muted-foreground uppercase"
                            >{$dict.labelResidence}</label
                        >
                        <input
 id="cs-residence"
                            type="text"
                            bind:value={draft.legalCityState}
                            placeholder={$dict.placeholderCityState}
                            class="w-full px-4 py-2 bg-card border border-border rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none shadow-sm"
                        />
                    </div>
                    <div class="grid grid-cols-1 gap-1.5">
                        <label for="cs-address"
                            class="text-[10px] font-bold text-muted-foreground uppercase"
                            >{$dict.labelLegalAddress || "Legal Address"}</label
                        >
                        <input
                            id="cs-address"
                            type="text"
                            bind:value={draft.legalAddress}
                            placeholder={$dict.placeholderAddress}
                            class="w-full px-4 py-2 bg-card border border-border rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none shadow-sm"
                        />
                    </div>
                </div>
            </div>

            <!-- Save Button Row -->
            <div class="flex justify-end pt-4">
                <button
                    onclick={saveProfile}
                    class="flex items-center gap-2 px-6 py-2.5 bg-primary text-primary-foreground rounded-xl font-bold hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 disabled:opacity-50"
                    disabled={isSaving}
                >
                    {#if isSaving}
                        <Check size={18} class="animate-bounce" />
                        {$dict.saving || "Saving..."}
                    {:else}
                        <Check size={18} />
                        {$dict.btnSaveProfile || "Save Profile"}
                    {/if}
                </button>
            </div>
        </div>
    </section>

    <!-- 3. ACCESSIBILITY & PREFERENCES -->
    <section class="space-y-6">
        <div class="flex items-center gap-3 border-b border-border pb-2">
            <div class="p-2 bg-primary-soft text-primary-hover rounded-lg">
                <Shield size={18} />
            </div>
            <h2 class="font-serif text-xl text-foreground">
                {$dict.sectionExperience}
            </h2>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <!-- High Contrast -->
            <button
                class="flex items-center justify-between p-4 bg-card border border-border rounded-2xl hover:border-primary/40 transition-all text-left"
                onclick={() => accessibilityStore.toggleHighContrast()}
            >
                <div class="flex items-center gap-3">
                    <div class="p-2 bg-muted rounded-lg text-muted-foreground">
                        <Activity class="w-4 h-4" />
                    </div>
                    <div>
                        <p class="text-sm font-bold text-foreground">
                            {$dict.labelHighContrast}
                        </p>
                        <p class="text-[10px] text-muted-foreground">
                            {$dict.labelHighContrastDesc}
                        </p>
                    </div>
                </div>
                <div
                    class="w-10 h-5 rounded-full relative transition-colors {$accessibilityStore.highContrast
                        ? 'bg-primary'
                        : 'bg-border'}"
                >
                    <div
                        class="absolute top-1 left-1 w-3 h-3 bg-white rounded-full transition-transform {$accessibilityStore.highContrast
                            ? 'translate-x-5'
                            : ''}"
                    ></div>
                </div>
            </button>

            <!-- Tone & Guidance -->
            <button
                class="flex items-center justify-between p-4 bg-card border border-border rounded-2xl hover:border-primary/40 transition-all text-left"
                onclick={toggleEncouragement}
            >
                <div class="flex items-center gap-3">
                    <div class="p-2 bg-muted rounded-lg text-muted-foreground">
                        <HeartHandshake class="w-4 h-4" />
                    </div>
                    <div>
                        <p class="text-sm font-bold text-foreground">
                            {$dict.labelEncouragement}
                        </p>
                        <p class="text-[10px] text-muted-foreground">
                            {getEncouragementLabel($encouragementMode)}
                        </p>
                    </div>
                </div>
                <div
                    class="w-10 h-5 rounded-full relative transition-colors {$encouragementMode !==
                    'Hidden'
                        ? 'bg-primary'
                        : 'bg-border'}"
                >
                    <div
                        class="absolute top-1 left-1 w-3 h-3 bg-white rounded-full transition-transform {$encouragementMode ===
                        'Full'
                            ? 'translate-x-5'
                            : $encouragementMode === 'Soft'
                              ? 'translate-x-2.5'
                              : ''}"
                    ></div>
                </div>
            </button>
        </div>

        <!-- Text Scaling -->
        <div
            class="bg-muted p-4 rounded-2xl border border-border flex items-center justify-between"
        >
            <span
                class="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-2"
                >{$dict.labelFontScaling}</span
            >
            <div
                class="flex bg-card border border-border rounded-xl p-1 shadow-sm overflow-hidden"
            >
                {#each ["normal", "large", "xlarge", "max"] as size}
                    <button
                        class="px-3 py-1.5 text-[10px] font-bold rounded-lg transition-all whitespace-nowrap
                        {$accessibilityStore.fontSize === size
                            ? 'bg-primary text-primary-foreground shadow-sm'
                            : 'text-muted-foreground hover:text-foreground'}"
                        onclick={() =>
                            accessibilityStore.setFontSize(size as any)}
                    >
                        {$dict[
                            "font" +
                                size.charAt(0).toUpperCase() +
                                size.slice(1)
                        ] || size.toUpperCase()}
                    </button>
                {/each}
            </div>
        </div>

        <!-- Scaling Preview Block -->
        <div
            class="mt-4 p-4 bg-card border border-border rounded-2xl space-y-3"
        >
            <div
                class="flex items-center justify-between pb-2 border-b border-border"
            >
                <span
                    class="text-[9px] font-bold text-muted-foreground uppercase tracking-widest"
                    >Accessibility Preview</span
                >
                <span
                    class="text-[9px] font-medium text-primary-hover bg-primary-soft px-2 py-0.5 rounded-full"
                >
                    Scale: {$accessibilityStore.fontSize === "normal"
                        ? "100%"
                        : $accessibilityStore.fontSize === "large"
                          ? "130%"
                          : $accessibilityStore.fontSize === "xlarge"
                            ? "165%"
                            : "200%"}
                </span>
            </div>
            <div class="space-y-2">
                <p class="font-serif text-foreground leading-relaxed">
                    This is a preview of how the text will appear throughout the
                    platform. Continuum is designed to remain legible and usable
                    even at larger scales.
                </p>
                <div class="flex gap-2">
                    <span
                        class="px-2 py-1 bg-muted rounded text-[0.8em] font-bold text-muted-foreground uppercase tracking-tighter"
                        >Sample Label</span
                    >
                    <span
                        class="px-2 py-1 bg-primary-soft rounded text-[0.8em] font-bold text-primary-hover uppercase tracking-tighter italic"
                        >Important Note</span
                    >
                </div>
            </div>
        </div>
        <!-- Theme & Color Picker -->
        <div class="space-y-4 pt-4 border-t border-border">
            <div class="flex items-center gap-3 pb-2">
                <div class="p-2 bg-primary-soft text-primary-hover rounded-lg">
                    <Palette size={18} />
                </div>
                <h3 class="font-serif text-lg text-foreground">
                    Theme & Appearance
                </h3>
            </div>

            <!-- Theme Toggle -->
            <div class="bg-background border border-border p-1.5 rounded-xl flex items-center gap-1">
                {#each [{ id: "light", icon: Sun, label: "Light" }, { id: "dark", icon: Moon, label: "Dark" }, { id: "system", icon: Monitor, label: "Auto" }] as theme}
                    {@const ThemeIcon = theme.icon}
                    <button
                        class="flex-1 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all duration-200 flex items-center justify-center gap-2
                        {$accessibilityStore.theme === theme.id
                            ? 'bg-card text-primary-hover shadow-sm ring-1 ring-border'
                            : 'text-muted-foreground hover:text-foreground'}"
                        onclick={() =>
                            accessibilityStore.setTheme(theme.id as any)}
                    >
                        <ThemeIcon
                            size={14}
                            class={$accessibilityStore.theme === theme.id
                                ? "text-primary"
                                : ""}
                        />
                        {theme.label}
                    </button>
                {/each}
            </div>

            <!-- Color Picker -->
            <div
                class="bg-card border border-border p-4 rounded-2xl flex items-center justify-between"
            >
                <div>
                    <p class="text-sm font-bold text-foreground">Accent Color</p>
                    <button
                        class="text-[10px] text-muted-foreground hover:text-primary flex items-center gap-1 mt-1 transition-colors"
                        onclick={() => accessibilityStore.resetDefaults()}
                    >
                        <RotateCcw size={10} />
                        Reset to Default
                    </button>
                </div>

                <div class="flex items-center gap-2">
                    {#each [{ id: "teal", color: "#4A7C74" }, { id: "indigo", color: "#4F46E5" }, { id: "emerald", color: "#047857" }, { id: "rose", color: "#E11D48" }, { id: "amber", color: "#B45309" }, { id: "carbon", color: "#0f172a" }] as swatch}
                        <button
                            class="w-8 h-8 rounded-full border-2 transition-all duration-200 relative flex items-center justify-center
                            {$accessibilityStore.color === swatch.id
                                ? 'border-primary scale-110'
                                : 'border-transparent hover:scale-105'}"
                            style="background-color: {swatch.color}"
                            aria-label={swatch.id.charAt(0).toUpperCase() + swatch.id.slice(1)}
                            aria-pressed={$accessibilityStore.color === swatch.id}
                            onclick={() =>
                                accessibilityStore.setColor(swatch.id as any)}
                        >
                            {#if $accessibilityStore.color === swatch.id}
                                <div
                                    class="w-2.5 h-2.5 bg-white rounded-full shadow-sm"
                                ></div>
                            {/if}
                        </button>
                    {/each}
                </div>
            </div>
        </div>
    </section>

    <!-- 4. DATA & SOVEREIGNTY -->
    <section class="space-y-6 pt-4">
        <div class="flex items-center gap-3 border-b border-border pb-2">
            <div class="p-2 bg-primary-soft text-primary-hover rounded-lg">
                <Download size={18} />
            </div>
            <h2 class="font-serif text-xl text-foreground">
                {$dict.sectionData}
            </h2>
        </div>

        <div
            class="bg-card rounded-2xl border border-border p-6 shadow-sm space-y-6"
        >
            <div class="flex gap-4">
                <div class="p-3 bg-muted rounded-xl h-fit">
                    <ShieldCheck class="w-6 h-6 text-muted-foreground" />
                </div>
                <div class="space-y-1">
                    <h3 class="font-bold text-foreground italic">
                        {$dict.exportTitle}
                    </h3>
                    <p class="text-sm text-muted-foreground leading-relaxed">
                        {$dict.exportDesc}
                    </p>
                </div>
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
                <!-- Scope selection -->
                <div class="space-y-3">
                    <span
                        id="cs-export-scope-label"
                        class="text-[10px] font-bold text-muted-foreground uppercase tracking-widest pl-1"
                        >{$dict.labelExportScope}</span
                    >
                    <div
                        role="group"
                        aria-labelledby="cs-export-scope-label"
                        class="space-y-2"
                    >
                        {#each [{ id: "full", key: "scopeFull" }, { id: "insurance", key: "scopeInsurance" }, { id: "medical", key: "scopeMedical" }] as scope}
                            <button
                                class="w-full flex items-center justify-between p-3 rounded-xl border-2 transition-all
                                {selectedScope === scope.id
                                    ? 'border-primary bg-primary-soft'
                                    : 'border-border hover:border-primary/40'}"
                                onclick={() =>
                                    (selectedScope = scope.id as any)}
                            >
                                <span
                                    class="text-sm font-semibold {selectedScope ===
                                    scope.id
                                        ? 'text-foreground'
                                        : 'text-muted-foreground'}"
                                >
                                    {$dict[scope.key]}
                                </span>
                                {#if selectedScope === scope.id}
                                    <Check size={16} class="text-foreground" />
                                {/if}
                            </button>
                        {/each}
                    </div>
                </div>

                <!-- Toggles & Action -->
                <div class="flex flex-col justify-between space-y-4 lg:pt-7">
                    <div
                        class="bg-muted p-4 rounded-xl flex items-center justify-between"
                    >
                        <div>
                            <p class="text-sm font-bold text-foreground">
                                {$dict.labelIncludeMedia}
                            </p>
                            <p class="text-[10px] text-muted-foreground italic">
                                {$dict.includeMediaDesc}
                            </p>
                        </div>
                        <button
                            class="w-11 h-6 rounded-full transition-colors relative {includeImages
                                ? 'bg-primary'
                                : 'bg-border'}"
                            onclick={() => (includeImages = !includeImages)}
                            role="switch"
                            aria-checked={includeImages}
                            aria-label={$dict.labelIncludeMedia}
                        >
                            <div
                                class="absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform {includeImages
                                    ? 'translate-x-5'
                                    : ''}"
                            ></div>
                        </button>
                    </div>

                    <button
                        onclick={handleExport}
                        class="w-full py-4 bg-primary text-primary-foreground rounded-xl font-bold hover:bg-primary-hover transition-all shadow-xl flex items-center justify-center gap-3 group"
                    >
                        <Download
                            size={20}
                            class="group-hover:-translate-y-1 transition-transform"
                        />
                        {$dict.btnGenerateExport}
                    </button>
                </div>
            </div>
        </div>
    </section>
</div>
