import { financialAssetsStore, isDebt } from './financialAssetsStore.svelte';
import { insuranceStore } from './insuranceStore.svelte';
import { familyStore } from './familyStore.svelte';
import { medicalStore } from './medicalStore.svelte';
import { digitalAssetsStore } from './digitalAssetsStore.svelte';
import { heirloomStore } from './heirloomStore.svelte';
import { letterStore } from './letterStore.svelte';
import { funeralStore } from './funeralStore.svelte';
import { journalStore } from './journalStore.svelte';
import { visualMemories } from './visualMemoryStore.svelte';
import { timeCapsuleStore } from './timeCapsuleStore.svelte';

// A saved wish is any filled value; the untouched default tradition ("secular") is no choice yet
const filled = (v: any): boolean =>
    Array.isArray(v) ? v.some(filled)
        : v && typeof v === 'object' ? Object.values(v).some(filled)
            : typeof v === 'string' ? v.trim() !== '' : typeof v === 'number' || v === true;
export const hasFuneralWishes = (wishes: any): boolean =>
    !!wishes && typeof wishes === 'object' && Object.entries(wishes)
        .some(([k, v]) => !(k === 'religiousTradition' && v === 'secular') && filled(v));

export interface AuditResult {
    totalScore: number;
    maxTotalScore: number;
    percentage: number;
    moduleScores: Record<string, number>;
    issues: string[];
    zombieData: string[];
}

function calculateAudit(): AuditResult {
    let totalScore = 0;
    let maxTotalScore = 0;
    const moduleScores: Record<string, number> = {};
    const issues: string[] = [];

    // 1. Financial: the open accounts on the financial page (debts are owed, so they are no account)
    {
        const items = financialAssetsStore.items.filter((a) => a && !a.is_closed && !isDebt(a));
        maxTotalScore += 100;
        if (items.length === 0) {
            issues.push('[Assets] Add your financial accounts when you are ready');
            moduleScores['financial'] = 0;
        } else {
            let s = 20;
            const withBen = items.filter((i) => String(i.beneficiaries ?? '').trim() && i.beneficiaries !== 'None').length;
            s += (withBen / items.length) * 40;
            const withVal = items.filter((i) => Number(i.value) > 0).length;
            s += (withVal / items.length) * 40;
            moduleScores['financial'] = Math.round(s);
            totalScore += moduleScores['financial'];
            if (withBen < items.length) {
                const n = items.length - withBen;
                issues.push(`[Assets] Name a beneficiary for ${n} ${n === 1 ? 'account' : 'accounts'}`);
            }
            // Value is the other half of the score, so a partial score always names its step
            if (withVal < items.length) {
                const n = items.length - withVal;
                issues.push(`[Assets] Add an estimated value for ${n} ${n === 1 ? 'account' : 'accounts'}`);
            }
        }
    }

    // 2. Insurance
    {
        const items = insuranceStore.policies;
        maxTotalScore += 50;
        if (items.length === 0) {
            issues.push('[Insurance] Add your policies when you are ready');
            moduleScores['insurance'] = 0;
        } else {
            moduleScores['insurance'] = 50;
            totalScore += 50;
        }
    }

    // 3. Family / Contacts
    {
        const items = familyStore.members;
        maxTotalScore += 50;
        if (items.length <= 1) { // Owner only
            issues.push('[Network] Add the people who matter to you');
            moduleScores['family'] = 0;
        } else {
            moduleScores['family'] = 50;
            totalScore += 50;
        }
    }

    // 4. Medical
    {
        const items = medicalStore.directives;
        maxTotalScore += 50;
        if (items.length === 0) {
            issues.push('[Logistics] Add your medical wishes when you are ready');
            moduleScores['medical'] = 0;
        } else {
            moduleScores['medical'] = 50;
            totalScore += 50;
        }
    }

    // 5. Digital Assets
    {
        const items = digitalAssetsStore.items;
        maxTotalScore += 50;
        if (items.length === 0) {
            issues.push('[Digital] Add your online accounts when you are ready');
            moduleScores['digital'] = 0;
        } else {
            moduleScores['digital'] = 50;
            totalScore += 50;
        }
    }

    // 6. Legacy: 25 points each for heirlooms, letters, funeral wishes and memories
    //    (a journal entry, a visual memory or a time capsule message)
    {
        const parts = [
            { ok: heirloomStore.items.length > 0, issue: '[Legacy] Add a treasured heirloom when you are ready' },
            { ok: letterStore.items.length > 0, issue: '[Legacy] Write a letter to someone you love when you are ready' },
            { ok: hasFuneralWishes(funeralStore.wishes), issue: '[Legacy] Share your funeral wishes when you are ready' },
            {
                ok: journalStore.items.length > 0 || visualMemories.items.length > 0 || timeCapsuleStore.items.length > 0,
                issue: '[Legacy] Keep a memory when you are ready'
            }
        ];
        maxTotalScore += 100;
        moduleScores['legacy'] = parts.filter((p) => p.ok).length * 25;
        totalScore += moduleScores['legacy'];
        parts.forEach((p) => { if (!p.ok) issues.push(p.issue); });
    }

    return {
        totalScore,
        maxTotalScore,
        percentage: maxTotalScore > 0 ? Math.round((totalScore / maxTotalScore) * 100) : 0,
        moduleScores,
        issues,
        zombieData: []
    };
}

export class AuditStore {
    #result = $derived(calculateAudit());

    get totalScore() { return this.#result.totalScore; }
    get maxTotalScore() { return this.#result.maxTotalScore; }
    get percentage() { return this.#result.percentage; }
    get moduleScores() { return this.#result.moduleScores; }
    get issues() { return this.#result.issues; }
    get zombieData() { return this.#result.zombieData; }

    runAudit() {
        // No-op in Svelte 5 as it's derived, 
        // but kept for compatibility with legacy calls
    }

    /** The most points each area can earn, for progress bars. */
    static readonly maxScores: Record<string, number> = { financial: 100, insurance: 50, family: 50, medical: 50, digital: 50, legacy: 100 };

    // Store compatibility: the current value right away (as a store must), then each change
    subscribe(run: (value: AuditResult) => void) {
        run(this.#result);
        let first = true;
        return $effect.root(() => {
            $effect(() => {
                const value = this.#result;
                if (first) { first = false; return; }
                run(value);
            });
        });
    }
}

export const estateAudit = new AuditStore();
