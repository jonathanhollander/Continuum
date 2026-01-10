import { writable, derived } from 'svelte/store';
import { browser } from '$app/environment';
import { getStored } from './persistence';

// --- Types ---
export interface ModuleAudit {
    id: string;
    name: string;
    category: 'assets' | 'legal' | 'logistics' | 'wisdom';
    storageKey: string;
    check: (data: any) => { score: number; maxScore: number; issues: string[] };
}

export interface AuditResult {
    totalScore: number;
    maxTotalScore: number;
    percentage: number;
    moduleScores: Record<string, number>;
    issues: string[]; // High priority issues
    zombieData: string[]; // Items untouched for > 180 days (mock logic for now)
}

// --- Configuration ---
// This list maps the "Tech Audit 1.txt" sections to actual localStorage keys
const MODULES: ModuleAudit[] = [
    {
        id: 'financial',
        name: 'Financial Accounts',
        category: 'assets',
        storageKey: 'assets_financial-accounts',
        check: (data) => {
            if (!data || data.length === 0) return { score: 0, maxScore: 100, issues: ['No financial accounts listed'] };
            let score = 20;
            // Check for Beneficiaries
            const withBen = data.filter((a: any) => a.beneficiaries?.length > 0).length;
            score += (withBen / data.length) * 40;
            // Check for Value
            const withVal = data.filter((a: any) => a.value > 0).length;
            score += (withVal / data.length) * 40;

            return {
                score: Math.round(score),
                maxScore: 100,
                issues: withBen < data.length ? [`${data.length - withBen} accounts missing beneficiaries`] : []
            };
        }
    },
    {
        id: 'legal',
        name: 'Legal Documents',
        category: 'legal',
        storageKey: 'docs_legal-documents',
        check: (data) => {
            if (!data || data.length === 0) return { score: 0, maxScore: 100, issues: ['Critical Legal Vault empty'] };
            let score = 0;
            const hasWill = data.some((d: any) => d.type === 'Will' || d.title?.toLowerCase().includes('will'));
            const hasTrust = data.some((d: any) => d.type === 'Trust' || d.title?.toLowerCase().includes('trust'));
            const hasPoA = data.some((d: any) => d.type === 'Power of Attorney');

            if (hasWill) score += 40;
            if (hasTrust) score += 30;
            if (hasPoA) score += 30;

            const issues = [];
            if (!hasWill) issues.push('Missing Last Will & Testament');

            return { score, maxScore: 100, issues };
        }
    },
    {
        id: 'digital',
        name: 'Digital Guardian',
        category: 'logistics',
        storageKey: 'digital_guardian',
        check: (data) => {
            if (!data) return { score: 0, maxScore: 50, issues: ['Digital Estate not configured'] };
            let score = 0;
            if (data.apple) score += 10;
            if (data.google) score += 10;
            if (data.passwordManager) score += 30;

            const issues = [];
            if (!data.passwordManager) issues.push('Executor Locked Out (No Password Manager Access)');
            if (!data.apple && !data.google) issues.push('Phone/Email access at risk');

            return { score, maxScore: 50, issues };
        }
    },
    {
        id: 'insurance',
        name: 'Insurance Policies',
        category: 'assets',
        storageKey: 'insurance_policies',
        check: (data) => {
            if (!data || data.length === 0) return { score: 0, maxScore: 50, issues: ['No insurance policies listed'] };
            return { score: 50, maxScore: 50, issues: [] };
        }
    },
    {
        id: 'subscriptions',
        name: 'Subscriptions',
        category: 'logistics',
        storageKey: 'subscriptions',
        check: (data) => {
            if (!data || data.length === 0) return { score: 0, maxScore: 30, issues: [] }; // Not critical
            return { score: 30, maxScore: 30, issues: [] };
        }
    },
    {
        id: 'family',
        name: 'Family Contacts',
        category: 'wisdom',
        storageKey: 'contacts_contacts',
        check: (data) => {
            if (!data || data.length === 0) return { score: 0, maxScore: 50, issues: ['No family contacts listed'] };
            return { score: 50, maxScore: 50, issues: [] };
        }
    }
];

// --- Store Implementation ---

function createAuditStore() {
    const { subscribe, set, update } = writable<AuditResult>({
        totalScore: 0,
        maxTotalScore: 0,
        percentage: 0,
        moduleScores: {},
        issues: [],
        zombieData: []
    });

    return {
        subscribe,
        runAudit: () => {
            if (!browser) return;

            let totalScore = 0;
            let maxTotalScore = 0;
            const moduleScores: Record<string, number> = {};
            const allIssues: string[] = [];

            MODULES.forEach(mod => {
                const data = getStored(mod.storageKey, null);
                const result = mod.check(data);

                moduleScores[mod.id] = result.score;
                totalScore += result.score;
                maxTotalScore += result.maxScore;
                if (result.issues.length > 0) {
                    allIssues.push(...result.issues.map(i => `[${mod.name}] ${i}`));
                }
            });

            set({
                totalScore,
                maxTotalScore,
                percentage: maxTotalScore > 0 ? Math.round((totalScore / maxTotalScore) * 100) : 0,
                moduleScores,
                issues: allIssues,
                zombieData: [] // TODO: Implement timestamps in data models to track this
            });
        }
    };
}

export const estateAudit = createAuditStore();
