import { propertyStore } from './propertyStore.svelte';
import { insuranceStore } from './insuranceStore.svelte';
import { familyStore } from './familyStore.svelte';
import { medicalStore } from './medicalStore.svelte';
import { digitalAssetsStore } from './digitalAssetsStore.svelte';

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

    // 1. Property / Financial
    {
        const items = propertyStore.items;
        maxTotalScore += 100;
        if (items.length === 0) {
            issues.push('[Assets] No financial accounts or property listed');
            moduleScores['financial'] = 0;
        } else {
            let s = 20;
            const withBen = items.filter(i => i.beneficiary && i.beneficiary !== 'None').length;
            s += (withBen / items.length) * 40;
            const withVal = items.filter(i => i.valuation > 0).length;
            s += (withVal / items.length) * 40;
            moduleScores['financial'] = Math.round(s);
            totalScore += moduleScores['financial'];
            if (withBen < items.length) {
                issues.push(`[Assets] ${items.length - withBen} items missing beneficiaries`);
            }
        }
    }

    // 2. Insurance
    {
        const items = insuranceStore.policies;
        maxTotalScore += 50;
        if (items.length === 0) {
            issues.push('[Insurance] No policies listed');
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
            issues.push('[Network] No family contacts listed');
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
            issues.push('[Logistics] No medical directives found');
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
            issues.push('[Digital] Digital Estate not configured');
            moduleScores['digital'] = 0;
        } else {
            moduleScores['digital'] = 50;
            totalScore += 50;
        }
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

class AuditStore {
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

    // Store compatibility
    subscribe(run: (value: AuditResult) => void) {
        // Create an effect that runs once and then whenever #result changes
        // Using Svelte 5's $effect is for components, but for store-like behavior we can just return the data
        // For actual subscribe support, we might need a writable underneath or just manual trigger
        // Let's use a simpler approach:
        const unsub = $effect.root(() => {
            $effect(() => {
                run(this.#result);
            });
        });
        return unsub;
    }
}

export const estateAudit = new AuditStore();
