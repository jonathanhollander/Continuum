import { derived } from 'svelte/store';
import { estateProfile } from './estateStore.svelte';
import { petStore } from './petStore.svelte';
import { medicalStore } from './medicalStore.svelte';
import { advancedAssetStore } from './advancedAssetStore.svelte';
import { digitalAssetsStore } from "./digitalAssetsStore.svelte";
import { estateAudit, AuditStore } from './auditStore.svelte';
import { heirloomStore } from './heirloomStore.svelte';
import { funeralStore } from './funeralStore.svelte';
import { pulse } from './pulse.svelte';
import { financialAssetsStore, estateTotals, isDebt } from './financialAssetsStore.svelte';
import { familyStore } from './familyStore.svelte';
import { insuranceStore } from './insuranceStore.svelte';

// Each pillar is the share of points its readiness-audit sections earned (the /admin/readiness numbers):
// Legal = family + medical, Financial = financial + insurance, Legacy = digital.
const PILLAR_SECTIONS = { legal: ['family', 'medical'], financial: ['financial', 'insurance'], legacy: ['digital'] } as const;
const pillarScore = (scores: Record<string, number> | undefined, ids: readonly string[]) => {
    const max = ids.reduce((n, id) => n + (AuditStore.maxScores[id] ?? 0), 0);
    const got = ids.reduce((n, id) => n + (Number(scores?.[id]) || 0), 0);
    return max > 0 ? Math.round((got / max) * 100) : 0;
};

// A saved wish is any filled value; the untouched default tradition ("secular") is no choice yet
const filled = (v: any): boolean =>
    Array.isArray(v) ? v.some(filled)
        : v && typeof v === 'object' ? Object.values(v).some(filled)
            : typeof v === 'string' ? v.trim() !== '' : typeof v === 'number' || v === true;
const named = (v: any) => { const t = String(v ?? '').trim(); return t !== '' && t !== 'None'; };

export const estateAnalytics = derived(
    [estateProfile, petStore, medicalStore, advancedAssetStore, digitalAssetsStore, estateAudit, heirloomStore, funeralStore, pulse, financialAssetsStore, familyStore, insuranceStore],
    ([$profile, $pets, $medical, $advanced, $digital, $audit, $heirlooms, $funeral, $pulse, $accounts, $family, $policies]) => {

        // --- 1. Legal Readiness ---
        // The executor is named on the profile, or is a contact with the Executor role
        const hasExecutor = !!$profile?.executorName || ($family?.members || []).some((m: any) =>
            m && (m.isExecutor === true || String(m.role ?? '').toLowerCase() === 'executor'));
        const hasMedicalProxy = ($medical?.directives || []).some((d: any) => d.type === 'healthcare_proxy');
        const hasLivingWill = ($medical?.directives || []).some((d: any) => d.type === 'living_will');

        const legalScore = pillarScore($audit?.moduleScores, PILLAR_SECTIONS.legal);

        // --- 2. Financial Clarity ---
        // The financial page's net (open assets less open debts); estateProfile.totalValue is never set
        const openAccounts = ($accounts || []).filter((a: any) => a && !a.is_closed && !isDebt(a));
        const assetValue = estateTotals($accounts || []).net;
        // A beneficiary named on the profile, on an open account, or on a policy
        const hasBeneficiary = named($profile?.primaryBeneficiary)
            || openAccounts.some((a: any) => named(a.beneficiaries))
            || ($policies || []).some((p: any) => p && named(p.beneficiaries));

        const financialScore = pillarScore($audit?.moduleScores, PILLAR_SECTIONS.financial);

        // --- 3. Legacy Vitality ---
        const heirloomCount = $heirlooms ? $heirlooms.length : 0;
        const wishes = $funeral?.wishes;
        const wishesDefined = !!wishes && typeof wishes === 'object' && Object.entries(wishes)
            .some(([k, v]) => !(k === 'religiousTradition' && v === 'secular') && filled(v));
        const legacyScore = pillarScore($audit?.moduleScores, PILLAR_SECTIONS.legacy);

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
