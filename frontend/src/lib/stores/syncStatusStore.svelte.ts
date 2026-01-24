/**
 * Sync Status Store
 *
 * Aggregates sync status from all SyncManagers and provides a unified view
 * for the dashboard. Maps internal sync states to compassionate user-facing labels.
 */

import { browser } from "$app/environment";
import type { SyncStatus } from "$lib/services/sync.svelte";
import type { CompassionateSyncStatus } from "$lib/components/ui/SyncBadge.svelte";

// Import sync managers from stores
import { contactSync } from "$lib/stores/familyStore.svelte";
import { insuranceSync } from "$lib/stores/insuranceStore.svelte";
import { profileSync, directiveSync } from "$lib/stores/medicalStore.svelte";
import { petSync } from "$lib/stores/petStore.svelte";
import { propertySync } from "$lib/stores/propertyStore.svelte";
import { digitalAssetsSync } from "$lib/stores/digitalAssetsStore.svelte";
import { heirloomSync } from "$lib/stores/heirloomStore.svelte";
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
import { pulseStatus } from "$lib/stores/pulse.svelte";

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
 * Module to SyncManager mapping.
 * Maps navigation module keys to their corresponding sync managers.
 */
type ModuleSyncInfo = {
    getStatus: () => CompassionateSyncStatus;
};

const moduleMapping: Record<string, ModuleSyncInfo> = {
    // Core Essentials
    contacts: {
        getStatus: () => mapToCompassionateStatus(
            contactSync.status,
            contactSync.items.length > 0
        )
    },
    financial: {
        getStatus: () => mapToCompassionateStatus(
            propertySync.status,
            propertySync.items.length > 0
        )
    },
    insurance: {
        getStatus: () => mapToCompassionateStatus(
            insuranceSync.status,
            insuranceSync.items.length > 0
        )
    },
    medical: {
        getStatus: () => {
            // Medical has both profile and directives - combine status
            const profileStatus = profileSync.status;
            const directiveStatus = directiveSync.status;

            // If either has error, show attention-needed
            if (profileStatus === "error" || directiveStatus === "error") {
                return "attention-needed";
            }

            // If either is syncing, show saving
            if (profileStatus === "syncing" || directiveStatus === "syncing") {
                return "saving";
            }

            // Check if has meaningful data (not just empty defaults)
            const hasDirectives = directiveSync.items.length > 0;
            const profile = profileSync.data;
            const hasProfileData = Boolean(profile && (
                profile.organDonor === true ||
                (profile.bloodType && profile.bloodType.trim() !== '') ||
                (profile.allergies && profile.allergies.trim() !== '')
            ));
            const hasData = hasDirectives || hasProfileData;

            return mapToCompassionateStatus(
                profileStatus === "synced" && directiveStatus === "synced" ? "synced" : "idle",
                hasData
            );
        }
    },
    pets: {
        getStatus: () => mapToCompassionateStatus(
            petSync.status,
            petSync.items.length > 0
        )
    },
    property: {
        getStatus: () => mapToCompassionateStatus(
            propertySync.status,
            propertySync.items.length > 0
        )
    },
    guardian: {
        getStatus: () => mapToCompassionateStatus(
            digitalAssetsSync.status,
            digitalAssetsSync.items.length > 0
        )
    },
    heirlooms: {
        getStatus: () => mapToCompassionateStatus(
            heirloomSync.status,
            heirloomSync.items.length > 0
        )
    },
    documents: {
        getStatus: () => mapToCompassionateStatus(
            documentStore.status,
            documentStore.items.length > 0
        )
    },
    subscriptions: {
        getStatus: () => mapToCompassionateStatus(
            subscriptionStore.status,
            subscriptionStore.items.length > 0
        )
    },
    letters: {
        getStatus: () => mapToCompassionateStatus(
            letterStore.status,
            letterStore.items.length > 0
        )
    },
    pulse: {
        getStatus: () => {
            // Pulse uses a different pattern - check loading state and data
            if (pulseStatus.loading) return "saving";
            const current = pulseStatus.current;
            const hasData = current && current.status !== 'not_configured';
            return hasData ? "safe" : "ready";
        }
    },
    "home-manual": {
        getStatus: () => {
            // Home manual combines home access, utilities, and vendors
            const hasHomeAccess = homeAccessStore.items.length > 0;
            const hasUtilities = utilityStore.items.length > 0;
            const hasVendors = vendorStore.items.length > 0;
            const hasData = hasHomeAccess || hasUtilities || hasVendors;

            // Check statuses
            const statuses = [homeAccessStore.status, utilityStore.status, vendorStore.status];
            if (statuses.includes('error')) return "attention-needed";
            if (statuses.includes('syncing')) return "saving";

            return mapToCompassionateStatus(
                statuses.every(s => s === 'synced') ? 'synced' : 'idle',
                hasData
            );
        }
    },
    funeral: {
        getStatus: () => {
            const data = funeralSync.data;
            // Check if funeral data has any meaningful values
            // FuneralData has wishes.disposition, wishes.venue, etc.
            const hasData = data && data.wishes && (
                data.wishes.disposition ||
                data.wishes.venue ||
                data.wishes.mood ||
                data.budget.length > 0
            );
            return mapToCompassionateStatus(funeralSync.status, !!hasData);
        }
    },
    journal: {
        getStatus: () => mapToCompassionateStatus(
            journalStore.status,
            journalStore.items.length > 0
        )
    },
    calendar: {
        getStatus: () => mapToCompassionateStatus(
            calendarSync.status,
            calendarSync.items.length > 0
        )
    },
    "advanced-registry": {
        getStatus: () => {
            const data = advancedAssetSync.data;
            // Check if has any meaningful data
            // AdvancedAssetState has transactions, maintenance, claims
            const hasData = data && (
                (data.transactions && data.transactions.length > 0) ||
                (data.maintenance && data.maintenance.length > 0) ||
                (data.claims && data.claims.length > 0)
            );
            return mapToCompassionateStatus(advancedAssetSync.status, !!hasData);
        }
    },
    capsule: {
        getStatus: () => mapToCompassionateStatus(
            timeCapsuleSync.status,
            timeCapsuleSync.items.length > 0
        )
    },
    timeline: {
        getStatus: () => mapToCompassionateStatus(
            timelineSync.status,
            timelineSync.items.length > 0
        )
    }
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
