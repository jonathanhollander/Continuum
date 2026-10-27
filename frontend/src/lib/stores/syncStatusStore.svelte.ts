/**
 * Sync Status Store
 *
 * Aggregates sync status from all SyncManagers and provides a unified view
 * for the dashboard. Maps internal sync states to compassionate user-facing labels.
 */

import { browser } from "$app/environment";
import { getRegistry, type SyncStatus } from "$lib/services/sync.svelte";
import type { CompassionateSyncStatus } from "$lib/components/ui/SyncBadge.svelte";

// Import sync managers from stores
import { contactSync } from "$lib/stores/familyStore.svelte";
import { insuranceSync } from "$lib/stores/insuranceStore.svelte";
import { profileSync, directiveSync } from "$lib/stores/medicalStore.svelte";
import { petSync } from "$lib/stores/petStore.svelte";
import { propertySync } from "$lib/stores/propertyStore.svelte";
import { digitalAssetsSync } from "$lib/stores/digitalAssetsStore.svelte";
import { financialAssetsSync } from "$lib/stores/financialAssetsStore.svelte";
import { heirloomSync } from "$lib/stores/heirloomStore.svelte";
import { visualMemories } from "$lib/stores/visualMemoryStore.svelte";
import { documentStore } from "$lib/stores/documentStore.svelte";
import { letterStore } from "$lib/stores/letterStore.svelte";
import { subscriptionStore } from "$lib/stores/subscriptionStore.svelte";
import { funeralSync } from "$lib/stores/funeralStore.svelte";
import { journalStore } from "$lib/stores/journalStore.svelte";
import { calendarSync } from "$lib/stores/calendarStore.svelte";
import { advancedAssetSync } from "$lib/stores/advancedAssetStore.svelte";
import { timeCapsuleSync } from "$lib/stores/timeCapsuleStore.svelte";
import { timelineSync } from "$lib/stores/timelineStore.svelte";
import { homeAccessStore } from "$lib/stores/homeAccessStore.svelte";
import { utilityStore } from "$lib/stores/utilityStore.svelte";
import { vendorStore } from "$lib/stores/vendorStore.svelte";
import { pulseStatus } from "$lib/stores/pulse.svelte"; // also registers pulse_settings

/**
 * Maps SyncManager status to compassionate user-facing status.
 *
 * @param syncStatus - The internal SyncManager status
 * @param hasLocalData - Whether the store has local data
 * @param hasRemoteData - Whether the store has been synced with remote
 */
function mapToCompassionateStatus(
    syncStatus: SyncStatus,
    hasLocalData: boolean = false,
    hasRemoteData: boolean = true
): CompassionateSyncStatus {
    switch (syncStatus) {
        case "synced":
            // Only show "safe" if there's actually data to be safe
            return hasLocalData ? "safe" : "ready";
        case "syncing":
            return "saving";
        case "error":
            return "attention-needed";
        case "idle":
            // Differentiate between ready (empty) and local-only
            if (hasLocalData && !hasRemoteData) {
                return "local";
            }
            return hasLocalData ? "safe" : "ready";
        default:
            return "ready";
    }
}

/**
 * Registry keys of the SyncManagers behind each module card: the stores that module's own page
 * reads and saves through. A card's badge (and the dashboard's loading check) reads exactly these.
 */
export const moduleSyncKeys: Record<string, readonly string[]> = {
    contacts: ["family_members"],
    financial: ["financial_assets"],
    insurance: ["insurance_policies"],
    medical: ["medical_profile", "medical_directives"],
    pets: ["pets"],
    property: ["properties"],
    guardian: ["digital_assets", "digital_guardian"], // digital_guardian: registered by its page
    heirlooms: ["heirlooms"],
    "visual-memories": ["visual_memories"],
    // The legal-documents page saves through the documents manager (documentStore).
    documents: ["documents"],
    subscriptions: ["subscriptions"],
    letters: ["letters"],
    pulse: ["pulse_status", "pulse_settings"],
    "home-manual": ["home_access", "utilities", "vendors"],
    funeral: ["funeral_data"],
    journal: ["journal_entries"],
    calendar: ["calendar_events"],
    "advanced-registry": ["advanced_assets"],
    capsule: ["time_capsule"],
    timeline: ["timeline_events"],
};

type WatchedManager = { status: SyncStatus; lastSync: Date | null };

/** The registered managers behind a module card (a lazily registered one is skipped until it exists). */
export function moduleManagers(moduleKey: string): WatchedManager[] {
    const registry = getRegistry() as Record<string, WatchedManager | undefined>;
    return (moduleSyncKeys[moduleKey] ?? [])
        .map((k) => registry[k])
        .filter((m): m is WatchedManager => !!m);
}

/** One status for a module's managers: any error, else any saving, else synced only when all are. */
function combinedStatus(moduleKey: string): SyncStatus {
    const statuses = moduleManagers(moduleKey).map((m) => m.status);
    if (statuses.includes("error")) return "error";
    if (statuses.includes("syncing")) return "syncing";
    return statuses.length > 0 && statuses.every((s) => s === "synced") ? "synced" : "idle";
}

/**
 * Module to SyncManager mapping.
 * Status comes from moduleSyncKeys; each entry says whether the module holds meaningful data.
 */
type ModuleSyncInfo = {
    getStatus: () => CompassionateSyncStatus;
};

const fromKeys = (moduleKey: string, hasData: () => boolean): ModuleSyncInfo => ({
    getStatus: () => mapToCompassionateStatus(combinedStatus(moduleKey), hasData()),
});

const moduleMapping: Record<string, ModuleSyncInfo> = {
    // Core Essentials
    contacts: fromKeys("contacts", () => contactSync.items.length > 0),
    financial: fromKeys("financial", () => financialAssetsSync.items.length > 0),
    insurance: fromKeys("insurance", () => insuranceSync.items.length > 0),
    medical: fromKeys("medical", () => {
        // Meaningful data: any directive, or a profile beyond its empty defaults
        const profile = profileSync.data;
        const hasProfileData = Boolean(profile && (
            profile.organDonor === true ||
            (profile.bloodType && profile.bloodType.trim() !== '') ||
            (profile.allergies && profile.allergies.trim() !== '')
        ));
        return directiveSync.items.length > 0 || hasProfileData;
    }),
    pets: fromKeys("pets", () => petSync.items.length > 0),
    property: fromKeys("property", () => propertySync.items.length > 0),
    guardian: fromKeys("guardian", () => digitalAssetsSync.items.length > 0),
    heirlooms: fromKeys("heirlooms", () => heirloomSync.items.length > 0),
    "visual-memories": fromKeys("visual-memories", () => visualMemories.items.length > 0),
    documents: fromKeys("documents", () => documentStore.items.length > 0),
    subscriptions: fromKeys("subscriptions", () => subscriptionStore.items.length > 0),
    letters: fromKeys("letters", () => letterStore.items.length > 0),
    pulse: {
        getStatus: () => {
            // Pulse reads "saving" while any of its stores is in flight, else whether it is set up
            if (combinedStatus("pulse") === "syncing") return "saving";
            const current = pulseStatus.current;
            const hasData = current && current.status !== 'not_configured';
            return hasData ? "safe" : "ready";
        }
    },
    // Home manual combines home access, utilities, and vendors
    "home-manual": fromKeys("home-manual", () =>
        homeAccessStore.items.length > 0 ||
        utilityStore.items.length > 0 ||
        vendorStore.items.length > 0
    ),
    funeral: fromKeys("funeral", () => {
        const data = funeralSync.data;
        // FuneralData has wishes.disposition, wishes.venue, etc.
        return !!(data && data.wishes && (
            data.wishes.disposition ||
            data.wishes.venue ||
            data.wishes.mood ||
            data.budget.length > 0
        ));
    }),
    journal: fromKeys("journal", () => journalStore.items.length > 0),
    calendar: fromKeys("calendar", () => calendarSync.items.length > 0),
    "advanced-registry": fromKeys("advanced-registry", () => {
        const data = advancedAssetSync.data;
        // AdvancedAssetState has transactions, maintenance, claims
        return !!(data && (
            (data.transactions && data.transactions.length > 0) ||
            (data.maintenance && data.maintenance.length > 0) ||
            (data.claims && data.claims.length > 0)
        ));
    }),
    capsule: fromKeys("capsule", () => timeCapsuleSync.items.length > 0),
    timeline: fromKeys("timeline", () => timelineSync.items.length > 0),
};

/**
 * Gets the sync status for a module by its navigation key.
 */
export function getModuleSyncStatus(moduleKey: string): CompassionateSyncStatus {
    if (!browser) return "ready";

    const mapping = moduleMapping[moduleKey];
    if (mapping) {
        try {
            return mapping.getStatus();
        } catch {
            return "ready";
        }
    }

    // Default for unmapped modules
    return "ready";
}

/**
 * Gets all module sync statuses as a reactive object.
 * Use this in components that need to track multiple module statuses.
 */
class SyncStatusStore {
    // Reactive getter that recomputes when any underlying store changes
    getStatus(moduleKey: string): CompassionateSyncStatus {
        return getModuleSyncStatus(moduleKey);
    }

    // Get aggregated status for dashboard summary
    getSummary() {
        if (!browser) return { safe: 0, saving: 0, attention: 0, ready: 0, local: 0 };

        const counts = { safe: 0, saving: 0, attention: 0, ready: 0, local: 0 };

        for (const key of Object.keys(moduleMapping)) {
            const status = getModuleSyncStatus(key);
            switch (status) {
                case "safe":
                    counts.safe++;
                    break;
                case "saving":
                    counts.saving++;
                    break;
                case "attention-needed":
                    counts.attention++;
                    break;
                case "local":
                    counts.local++;
                    break;
                default:
                    counts.ready++;
            }
        }

        return counts;
    }
}

export const syncStatusStore = new SyncStatusStore();
