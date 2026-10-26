import { derived } from 'svelte/store';
import { estateProfile } from './estateStore.svelte';
import { petStore } from './petStore.svelte';
import { medicalStore } from './medicalStore.svelte';
import { advancedAssetStore } from './advancedAssetStore.svelte';
import { digitalAssetsStore } from "./digitalAssetsStore.svelte";
import { estateAudit } from './auditStore.svelte';
import { heirloomStore } from './heirloomStore.svelte';
import { funeralStore } from './funeralStore.svelte';
import { pulse } from './pulse.svelte';
import { financialAssetsStore, estateTotals, isDebt } from './financialAssetsStore.svelte';
import { familyStore } from './familyStore.svelte';

export const estateAnalytics = derived(
    [estateProfile, petStore, medicalStore, advancedAssetStore, digitalAssetsStore, estateAudit, heirloomStore, funeralStore, pulse, financialAssetsStore, familyStore],
    ([$profile, $pets, $medical, $advanced, $digital, $audit, $heirlooms, $funeral, $pulse, $accounts, $family]) => {

        // --- 1. Legal Readiness ---
        // The executor is named on the profile, or is a contact with the Executor role
        const hasExecutor = !!$profile?.executorName || ($family?.members || []).some((m: any) =>
            m && (m.isExecutor === true || String(m.role ?? '').toLowerCase() === 'executor'));
        const hasMedicalProxy = ($medical?.directives || []).some((d: any) => d.type === 'healthcare_proxy');
        const hasLivingWill = ($medical?.directives || []).some((d: any) => d.type === 'living_will');

        let legalScore = 0;
        if (hasExecutor) legalScore += 40;
        if (hasMedicalProxy) legalScore += 30;
        if (hasLivingWill) legalScore += 30;

        // --- 2. Financial Clarity ---
        // The financial page's net (open assets less open debts); estateProfile.totalValue is never set
        const openAccounts = ($accounts || []).filter((a: any) => a && !a.is_closed && !isDebt(a));
        const assetValue = estateTotals($accounts || []).net;
        const hasAssets = openAccounts.length > 0 || ($advanced?.maintenance || []).length > 0;
        const hasBeneficiary = !!$profile?.primaryBeneficiary;

        let financialScore = 0;
        if (hasAssets) financialScore += 50;
        if (hasBeneficiary) financialScore += 50;

        // --- 3. Legacy Vitality ---
        const heirloomCount = $heirlooms ? $heirlooms.length : 0;
        const wishesDefined = $funeral?.wishes ?
            !!($funeral.wishes.disposition || $funeral.wishes.venue || $funeral.wishes.music?.length > 0) : false;
        // Points only when there are pets and each has a guardian ([].every is true for no pets)
        const petGuardians = ($pets || []).length > 0 && ($pets || []).every((p: any) => p.guardian);

        let legacyScore = 0;
        if (heirloomCount > 0) legacyScore += 40;
        if (wishesDefined) legacyScore += 40;
        if (petGuardians) legacyScore += 20;

        // --- 4. Operational Wellness (Pulse) ---
        const pulseEnabled = $pulse?.enabled;
        const hasPulseContacts = ($pulse?.contacts || []).length > 0;


        // --- Overall Pulse: the readiness audit, the same number as /admin/readiness and /modules/pulse ---
        const overallHealth = $audit?.percentage ?? 0;

        return {
            overallHealth,
            pillars: {
                legal: {
                    score: legalScore,
                    metrics: {
                        hasExecutor,
                        hasMedicalProxy,
                        hasLivingWill
                    }
                },
                financial: {
                    score: financialScore,
                    metrics: {
                        totalValue: assetValue,
                        hasBeneficiary,
                        digitalCount: ($digital || []).length
                    }
                },
                legacy: {
                    score: legacyScore,
                    metrics: {
                        heirloomCount,
                        wishesDefined,
                        petCount: ($pets || []).length
                    }
                }
            },
            gaps: [
                !hasExecutor && { type: 'legal', message: "Choose who will carry out your wishes", link: "/modules/contacts" },
                !hasMedicalProxy && { type: 'legal', message: "Choose who speaks for your care", link: "/modules/medical" },
                !hasBeneficiary && { type: 'financial', message: "Choose who receives your estate", link: "/modules/contacts" },
                heirloomCount === 0 && { type: 'legacy', message: "Add a treasured heirloom", link: "/modules/heirlooms" },
                !wishesDefined && { type: 'legacy', message: "Share your funeral wishes", link: "/modules/funeral" },
                !pulseEnabled && { type: 'pulse', message: "Turn on Pulse check-ins", link: "/modules/pulse/settings" },
                !hasPulseContacts && { type: 'pulse', message: "Choose your Pulse guardians", link: "/modules/pulse/settings" }
            ].filter(Boolean)
        };
    }
);
