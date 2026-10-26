import { getStored, setStored } from "$lib/stores/persistence";
import { getRegistry } from "$lib/services/sync.svelte";
import { get } from 'svelte/store';
import { activeAccountId } from '$lib/stores/keyringStore';
import { currentProfileId } from '$lib/stores/profileContext';
import { captureSession, isCurrentSession } from '$lib/services/sessionOwnership';
// Every key the factory writes is registered by its owning store, with that store's mapper.
import "$lib/stores/propertyStore.svelte";
import "$lib/stores/financialAssetsStore.svelte";
import "$lib/stores/subscriptionStore.svelte";
import "$lib/stores/calendarStore.svelte";
import "$lib/stores/letterStore.svelte";
import "$lib/stores/documentStore.svelte";

// Fake-item kind -> the owning store's registry key. Test registries saved before this used the kind.
const SYNC_KEY: Record<string, string> = { assets: "properties", financial_accounts: "financial_assets" };
const syncKeyOf = (mod: string) => SYNC_KEY[mod] ?? mod;

const TEST_REGISTRY_KEY = "continuum_test_registry";

type TestRegistry = {
    [moduleId: string]: string[];
};

export type SamplePurgeResult = { deletedCount: number; remainingCount: number };

// Older registries used the sample kind. The owning store key also drives the settings markers.
const normalizedRegistry = (registry: TestRegistry): TestRegistry => {
    const result: TestRegistry = {};
    for (const [mod, ids] of Object.entries(registry)) {
        const key = syncKeyOf(mod);
        result[key] = [...new Set([...(result[key] || []), ...ids.map(String)])];
    }
    return result;
};

function captureFactoryOwner() {
    const session = captureSession();
    const account = get(activeAccountId) || 'anonymous';
    const profile = get(currentProfileId) || 'owner';
    return { account, profile, current: () => isCurrentSession(session)
        && account === (get(activeAccountId) || 'anonymous')
        && profile === (get(currentProfileId) || 'owner') };
}
type FactoryOwner = ReturnType<typeof captureFactoryOwner>;
const registryFor = (owner: FactoryOwner) =>
    normalizedRegistry(getStored<TestRegistry>(TEST_REGISTRY_KEY, {}, owner.profile, owner.account));
const saveRegistry = (owner: FactoryOwner, registry: TestRegistry) =>
    setStored(TEST_REGISTRY_KEY, registry, owner.profile, owner.account);

class TestDataFactoryService {
    private _initialized = false;

    ensureInitialized() {
        if (this._initialized) return;

        // The owning stores (imported above) register every key at module load.
        this._initialized = true;
        console.log("[FactoryService] Initialized sync managers.");
    }

    async generate() {
        console.log("[FactoryService] Generate REQUESTED");
        this.ensureInitialized();

        const owner = captureFactoryOwner();
        const modules = ["assets", "financial_accounts", "subscriptions", "calendar_events", "letters", "documents"];

        for (const mod of modules) {
            if (!owner.current()) break;
            const syncKey = syncKeyOf(mod);

            const sync = getRegistry()[syncKey];
            console.log(`[FactoryService] Mod: ${mod}, Key: ${syncKey}, SyncFound: ${!!sync}`);

            if (sync) {
                const count = Math.floor(Math.random() * 3) + 1;

                for (let i = 0; i < count; i++) {
                    if (!owner.current()) break;
                    const fakeItem = this.createFakeItem(mod);
                    try {
                        // A returned confirmation always belongs to this batch's namespace.
                        // A session change can withhold a late response; it stops the batch below.
                        const created = await sync.create(fakeItem);
                        if (created && created.id != null) {
                            const registry = registryFor(owner);
                            registry[syncKey] = [...new Set([...(registry[syncKey] || []), String(created.id)])];
                            saveRegistry(owner, registry);
                        }
                    } catch (e) {
                        console.error(`[FactoryService] Failed to create for ${mod}`, e);
                    }
                }
            }
        }

        return registryFor(owner);
    }

    async purge(onProgress?: (result: SamplePurgeResult) => void): Promise<SamplePurgeResult> {
        this.ensureInitialized();
        const owner = captureFactoryOwner();
        const registry = registryFor(owner);
        const removed = new Set<string>();
        const result = (): SamplePurgeResult => ({ deletedCount: removed.size,
            remainingCount: Object.values(registryFor(owner)).reduce((n, ids) => n + ids.length, 0) });

        for (const [mod, ids] of Object.entries(registry)) {
            if (!owner.current()) break;
            const syncKey = syncKeyOf(mod);

            const sync = getRegistry()[syncKey];
            if (sync) {
                for (const id of ids) {
                    if (!owner.current()) break;
                    try {
                        // delete catches failures. Its confirmation hook also runs on its own
                        // Try Again path, so that retry clears the same marker only after removal.
                        await sync.delete(id, () => {
                            if (!owner.current()) return;
                            const latest = registryFor(owner);
                            latest[syncKey] = (latest[syncKey] || []).filter((key) => key !== String(id));
                            if (latest[syncKey].length === 0) delete latest[syncKey];
                            saveRegistry(owner, latest);
                            removed.add(JSON.stringify([syncKey, String(id)]));
                            onProgress?.(result());
                        });
                    } catch (e) {
                        console.warn(`[FactoryService] Failed delete ${id}`, e);
                    }
                }
            }
        }

        const final = result();
        if (owner.current()) onProgress?.(final);
        return final;
    }

    getRegistry() {
        return normalizedRegistry(getStored<TestRegistry>(TEST_REGISTRY_KEY, {}));
    }

    isTestId(mod: string, id: string) {
        return this.getRegistry()[syncKeyOf(mod)]?.includes(String(id)) || false;
    }

    private createFakeItem(moduleType: string): any {
        const r = (n: number) => Math.floor(Math.random() * n);

        switch (moduleType) {
            case "assets":
                return {
                    name: `Test Asset #${r(999)}`,
                    type: "Valuable",
                    location: "Test Vault",
                    valuation: (r(100) + 1) * 1000,
                    status: "Owned",
                    ownershipDetails: "Sole",
                    documents: "None",
                    notes: "Generated by Test Suite"
                };
            case "subscriptions":
                return {
                    name: `Test Service #${r(999)}`,
                    cost: (r(20) + 5),
                    cycle: "Monthly",
                    difficulty: "Easy",
                    paymentMethod: "Test Card"
                };
            case "calendar_events":
                // CalendarEvent: date is "YYYY-MM-DD" text, type one the calendar offers, recurring a boolean.
                return {
                    title: `Test Event #${r(999)}`,
                    date: new Date(Date.now() + 86400000 * r(30)).toISOString().slice(0, 10),
                    type: "other",
                    recurring: false
                };
            case "letters":
                return {
                    title: `Test Letter #${r(999)}`,
                    recipient_name: "Test User",
                    content: "This is a test letter generated by the validation suite.",
                    status: "draft",
                    release_condition: "death"
                };
            case "financial_accounts":
                // The fields AssetManager reads (FinancialAccount name/type/value), not the legacy columns.
                return {
                    name: `Test Bank #${r(99)}`,
                    type: "Financial",
                    value: r(50000),
                    location: "Test Bank",
                    ownershipPercentage: 100,
                    beneficiaries: "Test User",
                    notes: "Generated by Test Suite",
                    valueHistory: []
                };
            case "documents":
                return {
                    title: `Test Doc #${r(999)}`,
                    name: `Test Doc #${r(999)}`,
                    category: ["will", "trust", "deed", "insurance"][r(4)],
                    location: "Digital Vault",
                    status: "verified"
                };
            default:
                return { name: "Test Item" };
        }
    }
}

export const testDataFactory = new TestDataFactoryService();

