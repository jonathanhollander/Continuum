import { derived } from 'svelte/store';
import { estateProfile } from './estateStore.svelte';
import { petStore } from './petStore.svelte';
import { medicalStore } from './medicalStore.svelte';
import { advancedAssetStore } from './advancedAssetStore.svelte';
import { digitalAssetsStore } from "./digitalAssetsStore.svelte";
import { estateAudit, AuditStore, hasFuneralWishes } from './auditStore.svelte';
import { heirloomStore } from './heirloomStore.svelte';
import { funeralStore } from './funeralStore.svelte';
import { pulse } from './pulse.svelte';
import { financialAssetsStore, estateTotals, isDebt } from './financialAssetsStore.svelte';
import { familyStore } from './familyStore.svelte';
import { insuranceStore } from './insuranceStore.svelte';
import { pulseEnrollment } from './pulseEnrollmentStore.svelte';

// Financial and Legacy are the share of points their readiness-audit sections earned (the /admin/readiness numbers):
// Financial = financial + insurance, Legacy = legacy + digital. Legal is the share of its own checkboxes.
const PILLAR_SECTIONS = { financial: ['financial', 'insurance'], legacy: ['legacy', 'digital'] } as const;
const pillarScore = (scores: Record<string, number> | undefined, ids: readonly string[]) => {
    const max = ids.reduce((n, id) => n + (AuditStore.maxScores[id] ?? 0), 0);
    const got = ids.reduce((n, id) => n + (Number(scores?.[id]) || 0), 0);
    return max > 0 ? Math.round((got / max) * 100) : 0;
};

const named = (v: any) => { const t = String(v ?? '').trim(); return t !== '' && t !== 'None'; };

// The executor is named on the profile, or is a contact with the Executor role
export const findExecutorName = (profile: any, members: any[] | undefined): string => {
    const own = String(profile?.executorName ?? '').trim();
    if (own) return own;
    const m = (members || []).find((c: any) =>
        c && (c.isExecutor === true || String(c.role ?? '').toLowerCase() === 'executor'));
    return m ? String(m.name ?? '').trim() : '';
};

// The executor's name for any page (profile first, then the Executor contact)
export const estateExecutorName = derived([estateProfile, familyStore], ([$profile, $familyRaw]) =>
    findExecutorName($profile, ($familyRaw as typeof familyStore)?.members));

export const estateAnalytics = derived(
    [estateProfile, petStore, medicalStore, advancedAssetStore, digitalAssetsStore, estateAudit, heirloomStore, funeralStore, pulse, financialAssetsStore, familyStore, insuranceStore, pulseEnrollment],
    ([$profile, $pets, $medicalRaw, $advanced, $digital, $audit, $heirlooms, $funeral, $pulse, $accounts, $familyRaw, $policies, $guardians]) => {
        // Their subscribe hands over the store itself (members / directives getters)
        const $medical = $medicalRaw as typeof medicalStore;
        const $family = $familyRaw as typeof familyStore;

        // --- 1. Legal Readiness ---
        // The executor is named on the profile, or is a contact with the Executor role
        const executorName = findExecutorName($profile, $family?.members);
        const hasExecutor = !!executorName;
        const hasMedicalProxy = ($medical?.directives || []).some((d: any) => d.type === 'healthcare_proxy');
        const hasLivingWill = ($medical?.directives || []).some((d: any) => d.type === 'living_will');

        // The score and its checkboxes read the same facts, so a box and the score move together
        const legalFacts = [hasExecutor, hasMedicalProxy, hasLivingWill];
        const legalScore = Math.round((legalFacts.filter(Boolean).length / legalFacts.length) * 100);

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
        const wishesDefined = hasFuneralWishes(wishes);
        const legacyScore = pillarScore($audit?.moduleScores, PILLAR_SECTIONS.legacy);

        // --- 4. Operational Wellness (Pulse) ---
        const pulseEnabled = $pulse?.enabled;
        const hasPulseContacts = ($guardians.count ?? 0) > 0;


        // --- Overall Pulse: the readiness audit, the same number as /admin/readiness and /modules/pulse ---
        const overallHealth = $audit?.percentage ?? 0;

        return {
            overallHealth,
            guardians: $guardians,
            pillars: {
                legal: {
                    score: legalScore,
                    metrics: {
                        hasExecutor,
                        executorName,
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
                $guardians.loaded && !hasPulseContacts && { type: 'pulse', message: "Choose your Pulse guardians", link: "/modules/pulse/contacts" }
            ].filter(Boolean)
        };
    }
);
