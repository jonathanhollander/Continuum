<script lang="ts">
    import { askConfirm } from "$lib/components/ui/ConfirmModal.svelte";
    import { getRegistry, type SyncManager } from "$lib/services/sync.svelte";
    import { onMount } from "svelte";
    import { navGroups, catalogCategories, type NavItem } from "$lib/config/navigation";
    import { dict, userRole } from "$lib/stores/conciergeStore.svelte";
    import { auth } from "$lib/stores/auth";
    import {
        RefreshCw,
        Database,
        Server,
        HardDrive,
        CheckCircle,
        AlertTriangle,
        ShieldCheck,
        Trash2,
        TestTube,
    } from "lucide-svelte";
    import { fade, slide } from "svelte/transition";

    // Initialize Registry safely via lazy getter
    const syncRegistry = getRegistry();

    // The validation tooling and the cloud comparison are for the admin only: the same rule the
    // server uses for admin access (backend/routers/email.py, user id 1).
    let isAdmin = $derived($auth.user?.id === 1);

    let syncingAll = $state(false);
    let generatingTest = $state(false);
    let purgingTest = $state(false);
    let selectedModule = $state<string | null>(null);
    let testDataFactory = $state<any>(null); // Dynamic import

    // Audit State
    let auditResults = $state<Record<string, any>>({});
    let lastAudit = $state<Date | null>(null);
    let isAuditing = $state(false);
    let showConfirmGenerate = $state(false);

    // Test Registry Cache (for highlighting)
    let testRegistry = $state<Record<string, string[]>>({});

    onMount(async () => {
        // Load factory client-side only to avoid SSR complications
        const module = await import("$lib/services/testDataFactory");
        testDataFactory = module.testDataFactory;

        if (testDataFactory) {
            testDataFactory.ensureInitialized();
            refreshTestRegistry();
        }

        // Register every module's own store so a direct load counts them all.
        await Promise.allSettled(OWNING_STORES.map((load) => load()));
    });

    // Stores behind the module cards; loading one registers (and syncs) its managers.
    const OWNING_STORES = [
        () => import("$lib/stores/financialAssetsStore.svelte"),
        () => import("$lib/stores/insuranceStore.svelte"),
        () => import("$lib/stores/familyStore.svelte"),
        () => import("$lib/stores/medicalStore.svelte"),
        () => import("$lib/stores/pulse.svelte"),
        () => import("$lib/stores/subscriptionStore.svelte"),
        () => import("$lib/stores/petStore.svelte"),
        () => import("$lib/stores/propertyStore.svelte"),
        () => import("$lib/stores/digitalGuardianStore.svelte"),
        () => import("$lib/stores/digitalAssetsStore.svelte"),
        () => import("$lib/stores/letterStore.svelte"),
        () => import("$lib/stores/heirloomStore.svelte"),
        () => import("$lib/stores/estateStore.svelte"),
        () => import("$lib/stores/toneStore.svelte"),
        () => import("$lib/stores/onboardingStore.svelte"),
        () => import("$lib/stores/visualMemoryStore.svelte"),
        () => import("$lib/stores/calendarStore.svelte"),
        () => import("$lib/stores/advancedAssetStore.svelte"),
        () => import("$lib/stores/acceptanceStore.svelte"),
        () => import("$lib/stores/journalStore.svelte"),
        () => import("$lib/stores/timeCapsuleStore.svelte"),
        () => import("$lib/stores/timelineStore.svelte"),
        () => import("$lib/stores/funeralStore.svelte"),
        () => import("$lib/stores/scenarioStore.svelte"),
        () => import("$lib/stores/activityLog.svelte"),
        () => import("$lib/stores/documentStore.svelte"),
        () => import("$lib/stores/vendorStore.svelte"),
        () => import("$lib/stores/homeAccessStore.svelte"),
        () => import("$lib/stores/utilityStore.svelte"),
    ];

    function refreshTestRegistry() {
        if (testDataFactory) {
            testRegistry = testDataFactory.getRegistry();
        }
    }

    async function runAudit() {
        isAuditing = true;
        const tasks = Object.entries(syncRegistry).map(
            async ([key, manager]) => {
                // Singleton managers (one record, e.g. estate profile, funeral_data) have no audit.
                if (typeof (manager as any).audit !== "function") return;
                try {
                    const result = await manager.audit();
                    auditResults[key] = result;
                } catch (e) {
                    auditResults[key] = { error: true };
                }
            },
        );
        await Promise.all(tasks);
        lastAudit = new Date();
        isAuditing = false;
    }

    async function syncAll() {
        syncingAll = true;
        // Object.values works on the proxy
        const managers = Object.values(syncRegistry);
        await Promise.all(managers.map((m) => m.sync()));
        if (isAdmin) await runAudit();
        syncingAll = false;
    }

    async function generateTestData() {
        if (!testDataFactory) return;
        if (!showConfirmGenerate) {
            showConfirmGenerate = true;
            return;
        }

        showConfirmGenerate = false;

        generatingTest = true;
        await testDataFactory.generate();
        refreshTestRegistry();
        await syncAll();
        generatingTest = false;
    }

    async function purgeTestData() {
        if (!testDataFactory) return;
        if (!(await askConfirm("Remove all test data? This will clean up sample content from your account."))) return;

        purgingTest = true;
        await testDataFactory.purge();
        refreshTestRegistry();
        await syncAll();
        purgingTest = false;
    }

    // List managers hold `items`; a singleton holds one `data` record, counted once only when it
    // carries something the person saved: compared with what its mapper makes from an empty record,
    // leaving out server-owned fields and blank values.
    const SERVER_FIELDS = new Set(["id", "userId", "user_id", "createdAt", "created_at", "updatedAt", "updated_at"]);
    function meaningful(v: any): any {
        // false and empty JSON text ("{}", "[]") are what an untouched record holds.
        if (v === null || v === undefined || v === "" || v === false || v === "{}" || v === "[]") return undefined;
        if (Array.isArray(v)) {
            const a = v.map(meaningful).filter((x) => x !== undefined);
            return a.length ? a : undefined;
        }
        if (typeof v === "object") {
            const out: Record<string, any> = {};
            for (const k of Object.keys(v).sort()) {
                if (SERVER_FIELDS.has(k)) continue;
                const m = meaningful(v[k]);
                if (m !== undefined) out[k] = m;
            }
            return Object.keys(out).length ? out : undefined;
        }
        return v;
    }
    // Singletons the server fills with its own defaults on first read: saved means switched on.
    const SAVED_WHEN: Record<string, (d: any) => boolean> = {
        pulse_settings: (d) => d.enabled === true,
    };
    function rowsOf(manager: any): any[] {
        if (!manager) return [];
        if (Array.isArray(manager.items)) return manager.items;
        const d = manager.data;
        if (!d || typeof d !== "object") return [];
        const savedWhen = SAVED_WHEN[manager.key];
        if (savedWhen) return savedWhen(d) ? [d] : [];
        const mapper = manager.mapper; // SingletonSyncManager's own mapper (TS-private, readable at runtime)
        let empty: any = {};
        try {
            empty = typeof mapper === "function" ? mapper({}) : {};
        } catch {
            empty = {};
        }
        const saved = JSON.stringify(meaningful(d) ?? null) !== JSON.stringify(meaningful(empty) ?? null);
        return saved ? [d] : [];
    }

    // Home Manual rows carry no name: utilities are named by provider, home access by location.
    function rowName(item: any) {
        return item.name || item.title || item.provider || item.service_type || item.location || "Untitled";
    }

    // Assets and utilities carry their kind in category / service_type rather than type.
    function rowType(item: any) {
        return item.type || item.category || item.service_type || item.serviceType || "Generic";
    }

    // Helper: isTestRow
    function isTestRow(moduleKey: string, id: string | number) {
        return testRegistry[moduleKey]?.includes(String(id));
    }

    // Module cards come from the navigation (navGroups, plus the catalog modules reached from
    // "Explore All Features"), so every module is listed whether or not its store has registered.
    // Each card sums the sync registry keys its page owns.
    const moduleKeys: Record<string, string[]> = {
        financial: ["financial_assets"],
        insurance: ["insurance_policies"],
        contacts: ["family_members", "family_relationships"],
        documents: ["documents"],
        medical: ["medical_profile", "medical_directives"],
        "home-manual": ["vendors", "home_access", "utilities"],
        pulse: ["pulse_settings"],
        subscriptions: ["subscriptions"],
        pets: ["pets"],
        property: ["properties"],
        guardian: ["digital_guardian", "digital_assets"],
        letters: ["letters"],
        heirlooms: ["heirlooms"],
        settings: ["estate_profile", "app_tone", "concierge_settings", "onboarding_settings"],
        "family-hub": ["family_memories"],
        calendar: ["calendar_events"],
        "advanced-registry": ["advanced_assets"],
        builders: ["acceptance_tasks", "estate_complexity"],
        journal: ["journal_entries"],
        "visual-memories": ["visual_memories", "external_archives"],
        capsule: ["time_capsule"],
        timeline: ["timeline_events"],
        funeral: ["funeral_data"],
        executor: ["scenario_settings"],
        activity: ["activity_log"],
        anniversary: ["calendar_events"],
    };
    // Hubs that show other modules' data rather than holding their own.
    const hubKeys = new Set(["dashboard", "catalog", "binder"]);
    // Catalog categories join the nav group they belong to.
    const catalogGroup: Record<string, string> = { legacy: "groupMyLegacy", tools: "groupExtras" };

    type ModuleCard = { id: string; label: string; keys: string[] };

    let moduleGroups = $derived.by(() => {
        const role = $userRole;
        const seen = new Set<string>();
        const groups = navGroups.map((g) => ({ group: g, cards: [] as ModuleCard[] }));
        const add = (groupKey: string, item: NavItem) => {
            if (hubKeys.has(item.key) || seen.has(item.key)) return;
            if (!item.allowedRoles.includes(role)) return;
            const target = groups.find((x) => x.group.groupKey === groupKey);
            if (!target) return;
            seen.add(item.key);
            target.cards.push({ id: item.key, label: item.label, keys: moduleKeys[item.key] ?? [] });
        };
        for (const g of navGroups) for (const item of g.items) add(g.groupKey, item);
        for (const c of catalogCategories) for (const item of c.items) add(catalogGroup[c.id], item);
        return groups.filter((x) => x.cards.length > 0);
    });

    let cardsById = $derived(
        Object.fromEntries(moduleGroups.flatMap((g) => g.cards).map((c) => [c.id, c])),
    );

    function cardCount(card: ModuleCard) {
        return card.keys.reduce(
            (n, k) => n + rowsOf(syncRegistry[k]).length,
            0,
        );
    }
    function cardManagers(card: ModuleCard) {
        return card.keys.filter((k) => syncRegistry[k]).map((k) => [k, syncRegistry[k]] as const);
    }
    function cardStatus(card: ModuleCard) {
        const ms = cardManagers(card).map(([, m]) => m.status);
        if (ms.includes("syncing")) return "syncing";
        if (ms.includes("error")) return "error";
        return "idle";
    }
    // Cloud count: known once every registered list store of the card has been audited.
    function cardAudit(card: ModuleCard) {
        const audited = cardManagers(card)
            .map(([k]) => auditResults[k])
            .filter((a) => a && !a.error);
        if (audited.length === 0) return null;
        return {
            remoteCount: audited.reduce((n, a) => n + (a.remoteCount ?? 0), 0),
            matches: audited.every((a) => a.matches),
        };
    }

    // Registered stores no card owns (pulse_status is the server's own check-in state).
    let otherModules = $derived.by(() => {
        const owned = new Set([...Object.values(moduleKeys).flat(), "pulse_status"]);
        return Object.entries(syncRegistry).filter(([key]) => !owned.has(key));
    });
</script>

<div
    class="max-w-6xl mx-auto p-6 md:p-8 space-y-8 animate-in fade-in duration-500"
>
    <!-- Header -->
    <div
        class="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-border pb-8"
    >
        <div>
            <div class="flex items-center gap-3 mb-2">
                <div class="p-2 bg-primary-soft rounded-lg text-primary-hover">
                    <ShieldCheck size={32} />
                </div>
                <h1 class="font-bold text-3xl text-foreground">
                    Your records, kept safe
                </h1>
            </div>
            <p class="text-muted-foreground max-w-xl text-lg">
                See what is saved on this device and in your Continuum
                space.
            </p>
        </div>

        <div class="flex items-center gap-3 shrink-0 whitespace-nowrap">
            {#if isAdmin}
            <a
                href="/admin"
                class="px-4 py-2.5 bg-card border border-border text-foreground rounded-xl flex items-center gap-2 font-semibold hover:bg-muted transition-all shadow-sm"
            >
                <ShieldCheck size={18} />
                Admin
            </a>
            <button
                onclick={runAudit}
                disabled={isAuditing}
                class="px-4 py-2.5 bg-card border border-border text-foreground rounded-xl flex items-center gap-2 font-semibold hover:bg-muted transition-all shadow-sm"
            >
                <div class={isAuditing ? "animate-spin" : ""}>
                    <RefreshCw size={18} />
                </div>
                {isAuditing ? "Checking..." : "Take a look"}
            </button>
            {/if}

            <button
                onclick={syncAll}
                disabled={syncingAll}
                class="px-5 py-2.5 bg-primary text-primary-foreground rounded-xl flex items-center gap-2 font-bold hover:bg-primary-hover disabled:opacity-50 transition-all shadow-lg shadow-primary/10"
            >
                <RefreshCw class={syncingAll ? "animate-spin" : ""} size={18} />
                {syncingAll ? "Syncing..." : "Sync All"}
            </button>
        </div>
    </div>

    <!-- Test Data Controls -->
    {#if isAdmin}
    <div
        class="bg-primary-soft border border-primary/20 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-6"
    >
        <div class="flex items-center gap-4">
            <div class="p-3 bg-card rounded-xl text-primary-hover">
                <TestTube size={24} />
            </div>
            <div>
                <h3 class="font-bold text-foreground text-lg">
                    Sample data
                </h3>
                <p class="text-primary-hover text-sm font-medium">
                    Add sample entries to see how saving works.
                </p>
            </div>
        </div>

        <div class="flex items-center gap-3 w-full md:w-auto">
            <button
                onclick={generateTestData}
                disabled={generatingTest || !testDataFactory}
                class="flex-1 md:flex-none px-4 py-2 bg-primary text-primary-foreground font-semibold rounded-lg hover:bg-primary-hover transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
                {#if generatingTest}<RefreshCw
                        class="animate-spin"
                        size={16}
                    />{/if}
                {showConfirmGenerate
                    ? "Tap again if you'd like to continue"
                    : "Add sample data"}
            </button>
            <button
                onclick={purgeTestData}
                disabled={purgingTest || !testDataFactory}
                class="flex-1 md:flex-none px-4 py-2 bg-card border border-danger/30 text-danger font-semibold rounded-lg hover:bg-danger-soft transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
                {#if purgingTest}<RefreshCw
                        class="animate-spin"
                        size={16}
                    />{/if}
                Remove sample data
            </button>
        </div>
    </div>
    {/if}

    <!-- Module Grid -->
    <div class="space-y-12">
        {#each moduleGroups as { group, cards }}
                <section>
                    <div
                        class="flex items-center gap-3 mb-6 border-b border-border pb-4"
                    >
                        <h2 class="font-bold text-xl text-foreground">
                            {$dict[group.groupKey] || group.groupLabel}
                        </h2>
                        <span class="text-muted-foreground text-sm"
                            >{group.groupDescription}</span
                        >
                    </div>

                    <div
                        class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                    >
                        {#each cards as card (card.id)}
                            {@const key = card.id}
                            {@const audit = cardAudit(card)}
                            {@const status = cardStatus(card)}
                            {@const isTest = card.keys.some((k) => testRegistry[k]?.length > 0)}

                            <div
                                class="bg-card rounded-xl border transition-all cursor-pointer overflow-hidden group
                                    {selectedModule === key
                                    ? 'ring-2 ring-primary border-primary shadow-xl'
                                    : 'border-border shadow-sm hover:shadow-md hover:border-primary/40'}"
                                role="button"
                                tabindex="0"
                                onclick={() =>
                                    (selectedModule =
                                        selectedModule === key ? null : key)}
                                onkeydown={(e) => {
                                    if (e.target === e.currentTarget && (e.key === "Enter" || e.key === " ")) {
                                        e.preventDefault();
                                        selectedModule = selectedModule === key ? null : key;
                                    }
                                }}
                            >
                                <div
                                    class="p-5 flex items-center justify-between border-b border-border bg-muted/50"
                                >
                                    <div class="flex items-center gap-3">
                                        <h3
                                            class="font-bold text-foreground text-lg"
                                        >
                                            {card.label}
                                        </h3>
                                        {#if isTest}
                                            <span
                                                class="px-1.5 py-0.5 bg-primary-soft text-primary-hover text-[10px] font-black uppercase rounded tracking-wider"
                                                >Sample data shown</span
                                            >
                                        {/if}
                                    </div>
                                    <div class="flex items-center gap-2">
                                        {#if status === "syncing"}
                                            <RefreshCw
                                                size={16}
                                                class="text-info animate-spin"
                                            />
                                        {:else if status === "error"}
                                            <AlertTriangle
                                                size={16}
                                                class="text-warning"
                                            />
                                        {:else if audit?.matches}
                                            <CheckCircle
                                                size={18}
                                                class="text-success"
                                            />
                                        {:else}
                                            <div
                                                class="w-3 h-3 rounded-full bg-muted-foreground/40"
                                            ></div>
                                        {/if}
                                    </div>
                                </div>
                                <div
                                    class="grid {isAdmin
                                        ? 'grid-cols-2 divide-x divide-border'
                                        : 'grid-cols-1'}"
                                >
                                    <div class="p-4 text-center">
                                        <div
                                            class="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1"
                                        >
                                            Local
                                        </div>
                                        <div
                                            class="text-2xl font-mono text-foreground font-bold"
                                        >
                                            {cardCount(card)}
                                        </div>
                                    </div>
                                    {#if isAdmin}
                                    <div class="p-4 text-center bg-muted/30">
                                        <div
                                            class="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1"
                                        >
                                            Cloud DB
                                        </div>
                                        {#if audit}
                                            <div
                                                class="text-2xl font-mono font-bold {audit.matches
                                                    ? 'text-success'
                                                    : 'text-warning'}"
                                            >
                                                {audit.remoteCount}
                                            </div>
                                        {:else}
                                            <div
                                                class="text-sm text-muted-foreground py-1.5 italic"
                                            >
                                                --
                                            </div>
                                        {/if}
                                    </div>
                                    {/if}
                                </div>
                            </div>
                        {/each}
                    </div>
                </section>
        {/each}

        <!-- Other / Unassigned Modules -->
        {#if otherModules.length > 0}
            <section>
                <div
                    class="flex items-center gap-3 mb-6 border-b border-border pb-4"
                >
                    <h2 class="font-bold text-xl text-muted-foreground">
                        {$dict.groupOtherModules}
                    </h2>
                </div>
                <div
                    class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                >
                    {#each otherModules as [key, manager]}
                        <div
                            class="bg-card rounded-xl border border-border shadow-sm p-4 text-center"
                        >
                            <h3 class="font-bold text-foreground capitalize">
                                {key.replaceAll("_", " ")}
                            </h3>
                            <p class="text-sm text-muted-foreground">
                                {rowsOf(manager).length} items
                            </p>
                        </div>
                    {/each}
                </div>
            </section>
        {/if}
    </div>

    <!-- Drill Down View -->
    {#if selectedModule && cardsById[selectedModule]}
        {@const card = cardsById[selectedModule]}
        {@const managers = cardManagers(card)}

        <div
            transition:slide
            class="bg-card rounded-2xl border border-border shadow-xl overflow-hidden mt-4"
        >
            <div
                class="p-6 border-b border-border flex items-center justify-between bg-muted/50"
            >
                <h3
                    class="font-bold text-xl text-foreground flex items-center gap-2"
                >
                    <Database size={20} class="text-muted-foreground" />
                    {card.label} Records
                </h3>
                <div class="text-sm text-muted-foreground">
                    Showing merged view of Local & Cloud State
                </div>
            </div>
            <div class="max-h-[500px] overflow-y-auto">
                <table class="w-full text-left text-sm">
                    <thead
                        class="bg-muted sticky top-0 z-10 font-bold text-muted-foreground uppercase tracking-wider text-xs"
                    >
                        <tr>
                            {#if isAdmin}<th class="p-4 border-b border-border">Status</th>{/if}
                            <th class="p-4 border-b border-border">Type</th>
                            <th class="p-4 border-b border-border">Name/Title</th>
                            <th class="p-4 border-b border-border">Origin</th>
                            <th class="p-4 border-b border-border font-mono text-right"
                                >Data ID</th
                            >
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-border">
                        {#each managers as [mkey, manager]}
                        {@const audit = auditResults[mkey]}
                        {#each rowsOf(manager) as item}
                            {@const isTest = isTestRow(mkey, item.id)}
                            {@const inCloud = audit?.details?.remoteItems?.find(
                                (r: any) => String(r.id) === String(item.id),
                            )}
                            <tr
                                class="hover:bg-muted transition-colors {isTest
                                    ? 'bg-primary-soft/50'
                                    : ''}"
                            >
                                {#if isAdmin}
                                <td class="p-4">
                                    {#if !audit || audit.error}
                                        <span class="text-muted-foreground">--</span>
                                    {:else if inCloud}
                                        <div
                                            class="flex items-center gap-2 text-success font-bold"
                                        >
                                            <CheckCircle size={16} /> Synced
                                        </div>
                                    {:else}
                                        <div
                                            class="flex items-center gap-2 text-warning font-bold"
                                        >
                                            <RefreshCw size={16} /> Pending
                                        </div>
                                    {/if}
                                </td>
                                {/if}
                                <td class="p-4"
                                    ><span
                                        class="px-2 py-1 rounded-full text-xs font-bold bg-muted text-muted-foreground border border-border"
                                        >{rowType(item)}</span
                                    ></td
                                >
                                <td class="p-4 font-medium text-foreground"
                                    >{rowName(item)}</td
                                >
                                <td class="p-4">
                                    {#if isTest}
                                        <span
                                            class="inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs font-bold bg-primary-soft text-primary-hover border border-primary/20"
                                            ><TestTube size={12} /> Validation</span
                                        >
                                    {:else}
                                        <span class="text-muted-foreground"
                                            >User Input</span
                                        >
                                    {/if}
                                </td>
                                <td
                                    class="p-4 font-mono text-xs text-muted-foreground text-right"
                                    >{item.id}</td
                                >
                            </tr>
                        {/each}
                        {#if audit?.details?.onlyRemote}
                            {#each audit.details.onlyRemote as item}
                                <tr class="bg-muted/50">
                                    <td class="p-4 text-muted-foreground italic"
                                        >Saved online</td
                                    >
                                    <td class="p-4 text-muted-foreground"
                                        >{rowType(item)}</td
                                    >
                                    <td class="p-4 text-muted-foreground"
                                        >{rowName(item)}</td
                                    >
                                    <td class="p-4 text-muted-foreground">—</td>
                                    <td
                                        class="p-4 font-mono text-xs text-muted-foreground text-right"
                                        >{item.id}</td
                                    >
                                </tr>
                            {/each}
                        {/if}
                        {/each}
                        {#if cardCount(card) === 0 && !managers.some(([mkey]) => auditResults[mkey]?.details?.onlyRemote?.length)}
                            <tr
                                ><td
                                    colspan={isAdmin ? 5 : 4}
                                    class="p-12 text-center text-muted-foreground italic"
                                    >What you save in {card.label} will appear here.</td
                                ></tr
                            >
                        {/if}
                    </tbody>
                </table>
            </div>
        </div>
    {/if}
</div>
