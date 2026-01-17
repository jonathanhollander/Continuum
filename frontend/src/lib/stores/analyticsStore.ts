import { derived } from 'svelte/store';
import { estateProfile } from './estateStore';
import { petStore } from './petStore';
import { medicalStore } from './medicalStore';
import { advancedAssetStore } from './advancedAssetStore';
import { digitalAssetsStore } from './digitalAssetsStore';
import { estateAudit } from './auditStore';
import { heirloomStore } from './heirloomStore';
import { funeralStore } from './funeralStore';
import { pulse } from './pulse';

export const estateAnalytics = derived(
    [estateProfile, petStore, medicalStore, advancedAssetStore, digitalAssetsStore, estateAudit, heirloomStore, funeralStore, pulse],
    ([$profile, $pets, $medical, $advanced, $digital, $audit, $heirlooms, $funeral, $pulse]) => {

        // --- 1. Legal Readiness ---
        const hasExecutor = !!$profile?.executorName;
        const hasMedicalProxy = ($medical?.directives || []).some((d: any) => d.type === 'healthcare_proxy');
        const hasLivingWill = ($medical?.directives || []).some((d: any) => d.type === 'living_will');

        let legalScore = 0;
        if (hasExecutor) legalScore += 40;
        if (hasMedicalProxy) legalScore += 30;
        if (hasLivingWill) legalScore += 30;

        // --- 2. Financial Clarity ---
        const assetValue = $profile?.totalValue || 0;
        const hasAssets = assetValue > 0 || ($advanced?.maintenance || []).length > 0;
        const hasBeneficiary = !!$profile?.primaryBeneficiary;

        let financialScore = 0;
        if (hasAssets) financialScore += 50;
        if (hasBeneficiary) financialScore += 50;

        // --- 3. Legacy Vitality ---
        const heirloomCount = $heirlooms ? $heirlooms.length : 0;
        const wishesDefined = $funeral?.wishes ?
            !!($funeral.wishes.disposition || $funeral.wishes.venue || $funeral.wishes.music?.length > 0) : false;
        const petGuardians = ($pets || []).every((p: any) => p.guardian);

        let legacyScore = 0;
        if (heirloomCount > 0) legacyScore += 40;
        if (wishesDefined) legacyScore += 40;
        if (petGuardians) legacyScore += 20;

        // --- 4. Operational Wellness (Pulse) ---
        const pulseEnabled = $pulse?.enabled;
        const hasPulseContacts = ($pulse?.contacts || []).length > 0;

        let operationalScore = 0;
        if (pulseEnabled) operationalScore += 50;
        if (hasPulseContacts) operationalScore += 50;

        // --- Overall Pulse ---
        const overallHealth = Math.round((legalScore + financialScore + legacyScore + operationalScore) / 4);

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
                !hasExecutor && { type: 'legal', message: "No Executor Assigned", link: "/modules/contacts" },
                !hasMedicalProxy && { type: 'legal', message: "Missing Medical Proxy", link: "/modules/medical" },
                !hasBeneficiary && { type: 'financial', message: "No Primary Beneficiary", link: "/modules/contacts" },
                heirloomCount === 0 && { type: 'legacy', message: "No Heirlooms Cataloged", link: "/modules/heirlooms" },
                !wishesDefined && { type: 'legacy', message: "Funeral Wishes Undefined", link: "/modules/funeral" },
                !pulseEnabled && { type: 'pulse', message: "Pulse Heartbeat Disabled", link: "/modules/pulse/settings" },
                !hasPulseContacts && { type: 'pulse', message: "No Pulse Guardians", link: "/modules/pulse/settings" }
            ].filter(Boolean)
        };
    }
);
