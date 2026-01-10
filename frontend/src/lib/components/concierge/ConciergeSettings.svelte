<script lang="ts">
    import {
        encouragementMode,
        userRole,
        language,
        t,
    } from "$lib/stores/concierge";
    import { accessibilityStore } from "$lib/stores/accessibilityStore";
    import { estateProfile } from "$lib/stores/estateStore";
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

    import { profiles, currentProfileId } from "$lib/stores/profileContext";
    import { triggerMagic } from "$lib/stores/magicStore";
    import { get } from "svelte/store";

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

    // Export State
    let selectedScope: ExportScope = "full";
    let includeImages = true;
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
                return $t.encFull || "Full Support";
            case "Soft":
                return $t.encSoft || "Gentle Reminders";
            case "Hidden":
                return $t.encHidden || "Zen Mode (Off)";
            default:
                return mode;
        }
    }

    async function saveProfile() {
        isSaving = true;

        // 1. Sync owner name to profiles store if we are looking at the 'owner' profile
        // or if we are the owner and changing the 'ownerName'
        const pid = get(currentProfileId);
        profiles.update((current) => {
            return current.map((p) => {
                if (p.id === "owner" && $estateProfile.ownerName) {
                    return { ...p, name: $estateProfile.ownerName };
                }
                return p;
            });
        });

        // 2. Trigger feedback
        triggerMagic("success");

        // Artificial delay
        setTimeout(() => {
            isSaving = false;
        }, 1000);
    }
</script>

<div class="space-y-12">
    <!-- 1. PERSPECTIVE & LANGUAGE -->
    <section class="space-y-6">
        <div class="flex items-center gap-3 border-b border-slate-100 pb-2">
            <div class="p-2 bg-primary/10 text-primary rounded-lg">
                <Users size={18} />
            </div>
            <h2 class="font-serif text-xl text-slate-800">
                {$t.sectionIdentity}
            </h2>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <!-- Role Selection -->
            <div class="space-y-4">
                <label
                    class="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500"
                >
                    {$t.labelPerspective}
                </label>
                <div
                    class="bg-slate-100 p-1 rounded-xl flex items-center gap-1"
                >
                    {#each roles as role}
                        <button
                            class="flex-1 px-4 py-3 rounded-lg text-sm font-bold uppercase tracking-wider transition-all duration-200
                            {$userRole === role.id
                                ? 'bg-primary text-primary-foreground shadow-lg'
                                : 'text-slate-400 hover:text-slate-600'}"
                            onclick={() => userRole.set(role.id as any)}
                        >
                            <div class="flex flex-col items-center gap-1">
                                <span>{$t[role.key] || role.id}</span>
                                <span
                                    class="text-[8px] opacity-60 normal-case font-medium leading-none"
                                >
                                    {$t[role.descKey]}
                                </span>
                            </div>
                        </button>
                    {/each}
                </div>
            </div>

            <!-- Language Selection -->
            <div class="space-y-4">
                <label
                    class="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500"
                >
                    {$t.labelLanguages}
                </label>
                <div class="grid grid-cols-2 gap-2">
                    {#each languages as lang}
                        <button
                            class="flex flex-col items-center justify-center p-3 rounded-xl border transition-all duration-200
                            {$language === lang.id
                                ? 'bg-primary border-primary text-primary-foreground shadow-md'
                                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}"
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
        <div class="flex items-center gap-3 border-b border-slate-100 pb-2">
            <div class="p-2 bg-primary/10 text-primary rounded-lg">
                <ShieldCheck size={18} />
            </div>
            <h2 class="font-serif text-xl text-slate-800">
                {$t.sectionProfile}
            </h2>
        </div>

        <div
            class="space-y-6 bg-slate-50 p-6 rounded-2xl border border-slate-100 shadow-inner"
        >
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <!-- Names -->
                <div class="space-y-4">
                    <div class="grid grid-cols-1 gap-1.5">
                        <label
                            class="text-[10px] font-bold text-slate-400 uppercase"
                            >{$t.labelOwner}</label
                        >
                        <input
                            type="text"
                            bind:value={$estateProfile.ownerName}
                            placeholder={$t.placeholderName}
                            class="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all shadow-sm"
                        />
                    </div>
                    <div class="grid grid-cols-1 gap-1.5">
                        <label
                            class="text-[10px] font-bold text-slate-400 uppercase"
                            >{$t.labelExecutor}</label
                        >
                        <input
                            type="text"
                            bind:value={$estateProfile.executorName}
                            placeholder={$t.placeholderPrimary}
                            class="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all shadow-sm"
                        />
                    </div>
                </div>

                <!-- Vital Info -->
                <div class="space-y-4">
                    <div class="grid grid-cols-2 gap-4">
                        <div class="space-y-1.5">
                            <label
                                class="text-[10px] font-bold text-slate-400 uppercase"
                                >{$t.labelDeathDate}</label
                            >
                            <input
                                type="date"
                                bind:value={$estateProfile.dateOfDeath}
                                class="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none shadow-sm"
                            />
                        </div>
                        <div class="space-y-1.5">
                            <label
                                class="text-[10px] font-bold text-slate-400 uppercase"
                                >{$t.labelSSN}</label
                            >
                            <input
                                type="text"
                                maxlength="4"
                                bind:value={$estateProfile.last4SSN}
                                placeholder="####"
                                class="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none shadow-sm"
                            />
                        </div>
                    </div>
                    <div class="grid grid-cols-1 gap-1.5 pt-0.5">
                        <label
                            class="text-[10px] font-bold text-slate-400 uppercase"
                            >{$t.labelResidence}</label
                        >
                        <input
                            type="text"
                            bind:value={$estateProfile.legalCityState}
                            placeholder={$t.placeholderCityState}
                            class="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none shadow-sm"
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
                        {$t.saving || "Saving..."}
                    {:else}
                        <Check size={18} />
                        {$t.btnSaveProfile || "Save Profile"}
                    {/if}
                </button>
            </div>
        </div>
    </section>

    <!-- 3. ACCESSIBILITY & PREFERENCES -->
    <section class="space-y-6">
        <div class="flex items-center gap-3 border-b border-slate-100 pb-2">
            <div class="p-2 bg-amber-50 text-amber-600 rounded-lg">
                <Shield size={18} />
            </div>
            <h2 class="font-serif text-xl text-slate-800">
                {$t.sectionExperience}
            </h2>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <!-- High Contrast -->
            <button
                class="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-2xl hover:border-slate-300 transition-all text-left"
                onclick={() => accessibilityStore.toggleHighContrast()}
            >
                <div class="flex items-center gap-3">
                    <div class="p-2 bg-slate-50 rounded-lg text-slate-500">
                        <Activity class="w-4 h-4" />
                    </div>
                    <div>
                        <p class="text-sm font-bold text-slate-700">
                            {$t.labelHighContrast}
                        </p>
                        <p class="text-[10px] text-slate-400">
                            {$t.labelHighContrastDesc}
                        </p>
                    </div>
                </div>
                <div
                    class="w-10 h-5 bg-slate-200 rounded-full relative transition-colors {$accessibilityStore.highContrast
                        ? 'bg-primary'
                        : ''}"
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
                class="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-2xl hover:border-slate-300 transition-all text-left"
                onclick={toggleEncouragement}
            >
                <div class="flex items-center gap-3">
                    <div class="p-2 bg-slate-50 rounded-lg text-slate-500">
                        <HeartHandshake class="w-4 h-4" />
                    </div>
                    <div>
                        <p class="text-sm font-bold text-slate-700">
                            {$t.labelEncouragement}
                        </p>
                        <p class="text-[10px] text-slate-400">
                            {getEncouragementLabel($encouragementMode)}
                        </p>
                    </div>
                </div>
                <div
                    class="w-10 h-5 bg-slate-200 rounded-full relative transition-colors {$encouragementMode !==
                    'Hidden'
                        ? 'bg-primary'
                        : ''}"
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
            class="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-center justify-between"
        >
            <span
                class="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-2"
                >{$t.labelFontScaling}</span
            >
            <div
                class="flex bg-white border border-slate-200 rounded-xl p-1 shadow-sm overflow-hidden"
            >
                {#each ["normal", "large", "xlarge", "max"] as size}
                    <button
                        class="px-3 py-1.5 text-[10px] font-bold rounded-lg transition-all whitespace-nowrap
                        {$accessibilityStore.fontSize === size
                            ? 'bg-primary text-primary-foreground shadow-sm'
                            : 'text-slate-400 hover:text-slate-600'}"
                        onclick={() =>
                            accessibilityStore.setFontSize(size as any)}
                    >
                        {$t[
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
            class="mt-4 p-4 bg-white border border-slate-200 rounded-2xl space-y-3"
        >
            <div
                class="flex items-center justify-between pb-2 border-b border-slate-50"
            >
                <span
                    class="text-[9px] font-bold text-slate-400 uppercase tracking-widest"
                    >Accessibility Preview</span
                >
                <span
                    class="text-[9px] font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full"
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
                <p class="font-serif text-slate-800 leading-relaxed">
                    This is a preview of how the text will appear throughout the
                    platform. Continuum is designed to remain legible and usable
                    even at larger scales.
                </p>
                <div class="flex gap-2">
                    <span
                        class="px-2 py-1 bg-slate-100 rounded text-[0.8em] font-bold text-slate-500 uppercase tracking-tighter"
                        >Sample Label</span
                    >
                    <span
                        class="px-2 py-1 bg-primary/10 rounded text-[0.8em] font-bold text-primary uppercase tracking-tighter italic"
                        >Important Note</span
                    >
                </div>
            </div>
        </div>
        <!-- Theme & Color Picker -->
        <div class="space-y-4 pt-4 border-t border-slate-100">
            <div class="flex items-center gap-3 pb-2">
                <div class="p-2 bg-primary/10 text-primary rounded-lg">
                    <Palette size={18} />
                </div>
                <h3 class="font-serif text-lg text-slate-800">
                    Theme & Appearance
                </h3>
            </div>

            <!-- Theme Toggle -->
            <div class="bg-slate-50 p-1.5 rounded-xl flex items-center gap-1">
                {#each [{ id: "light", icon: Sun, label: "Light" }, { id: "dark", icon: Moon, label: "Dark" }, { id: "system", icon: Monitor, label: "Auto" }] as theme}
                    <button
                        class="flex-1 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all duration-200 flex items-center justify-center gap-2
                        {$accessibilityStore.theme === theme.id
                            ? 'bg-white text-primary shadow-sm'
                            : 'text-slate-400 hover:text-slate-600'}"
                        onclick={() =>
                            accessibilityStore.setTheme(theme.id as any)}
                    >
                        <svelte:component
                            this={theme.icon}
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
                class="bg-white border border-slate-200 p-4 rounded-2xl flex items-center justify-between"
            >
                <div>
                    <p class="text-sm font-bold text-slate-700">Accent Color</p>
                    <button
                        class="text-[10px] text-slate-400 hover:text-primary flex items-center gap-1 mt-1 transition-colors"
                        onclick={() => accessibilityStore.resetDefaults()}
                    >
                        <RotateCcw size={10} />
                        Reset to Default
                    </button>
                </div>

                <div class="flex items-center gap-2">
                    {#each [{ id: "teal", color: "#4A7C74" }, { id: "indigo", color: "#6366f1" }, { id: "emerald", color: "#10b981" }, { id: "rose", color: "#f43f5e" }, { id: "amber", color: "#f59e0b" }, { id: "slate", color: "#0f172a" }] as swatch}
                        <button
                            class="w-8 h-8 rounded-full border-2 transition-all duration-200 relative flex items-center justify-center
                            {$accessibilityStore.color === swatch.id
                                ? 'border-primary scale-110'
                                : 'border-transparent hover:scale-105'}"
                            style="background-color: {swatch.color}"
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
        <div class="flex items-center gap-3 border-b border-slate-100 pb-2">
            <div class="p-2 bg-slate-900 text-white rounded-lg shadow-lg">
                <Download size={18} />
            </div>
            <h2 class="font-serif text-xl text-slate-800">
                {$t.sectionData}
            </h2>
        </div>

        <div
            class="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6"
        >
            <div class="flex gap-4">
                <div class="p-3 bg-slate-50 rounded-xl h-fit">
                    <ShieldCheck class="w-6 h-6 text-slate-400" />
                </div>
                <div class="space-y-1">
                    <h3 class="font-bold text-slate-800 italic">
                        {$t.exportTitle}
                    </h3>
                    <p class="text-sm text-slate-500 leading-relaxed">
                        {$t.exportDesc}
                    </p>
                </div>
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
                <!-- Scope selection -->
                <div class="space-y-3">
                    <label
                        class="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1"
                        >{$t.labelExportScope}</label
                    >
                    <div class="space-y-2">
                        {#each [{ id: "full", key: "scopeFull", color: "slate-900" }, { id: "insurance", key: "scopeInsurance", color: "emerald-600" }, { id: "medical", key: "scopeMedical", color: "rose-600" }] as scope}
                            <button
                                class="w-full flex items-center justify-between p-3 rounded-xl border-2 transition-all
                                {selectedScope === scope.id
                                    ? `border-${scope.color} bg-slate-50`
                                    : 'border-slate-100 hover:border-slate-200'}"
                                onclick={() =>
                                    (selectedScope = scope.id as any)}
                            >
                                <span
                                    class="text-sm font-semibold {selectedScope ===
                                    scope.id
                                        ? 'text-slate-900'
                                        : 'text-slate-600'}"
                                >
                                    {$t[scope.key]}
                                </span>
                                {#if selectedScope === scope.id}
                                    <Check size={16} class="text-slate-900" />
                                {/if}
                            </button>
                        {/each}
                    </div>
                </div>

                <!-- Toggles & Action -->
                <div class="flex flex-col justify-between space-y-4 lg:pt-7">
                    <div
                        class="bg-slate-50 p-4 rounded-xl flex items-center justify-between"
                    >
                        <div>
                            <p class="text-sm font-bold text-slate-700">
                                {$t.labelIncludeMedia}
                            </p>
                            <p class="text-[10px] text-slate-400 italic">
                                {$t.includeMediaDesc}
                            </p>
                        </div>
                        <button
                            class="w-11 h-6 rounded-full transition-colors relative {includeImages
                                ? 'bg-emerald-500'
                                : 'bg-slate-300'}"
                            onclick={() => (includeImages = !includeImages)}
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
                        class="w-full py-4 bg-slate-900 text-white rounded-xl font-bold hover:bg-black transition-all shadow-xl flex items-center justify-center gap-3 group"
                    >
                        <Download
                            size={20}
                            class="group-hover:-translate-y-1 transition-transform"
                        />
                        {$t.btnGenerateExport}
                    </button>
                </div>
            </div>
        </div>
    </section>
</div>
