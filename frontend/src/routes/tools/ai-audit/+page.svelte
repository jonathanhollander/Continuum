<script lang="ts">
    import {
        CircleCheck,
        Shield,
        ArrowRight,
        BrainCircuit,
        Loader2,
    } from "lucide-svelte";
    import { fade, slide } from "svelte/transition";
    import { estateAudit, AuditStore } from "$lib/stores/auditStore.svelte";
    import { auditReadiness } from "$lib/utils/auditReadiness.svelte";
    import AuditSourceStatus from "$lib/components/AuditSourceStatus.svelte";

    // One finding per audit issue, and one per area the audit scores in full
    interface AuditFinding {
        id: string;
        severity: "warning" | "pass";
        category: string;
        title: string;
        desc: string;
        actionUrl?: string;
    }

    // The audit's issue prefix -> the page that resolves it
    const issuePath: Record<string, string> = {
        Assets: "/modules/financial-accounts",
        Insurance: "/modules/insurance",
        Network: "/modules/contacts",
        Logistics: "/modules/medical",
        Digital: "/modules/digital-guardian",
    };
    // Legacy issues each name their own page
    const legacyPath = (text: string) =>
        /heirloom/i.test(text) ? "/modules/heirlooms"
            : /letter/i.test(text) ? "/modules/letters"
                : /funeral/i.test(text) ? "/modules/funeral"
                    : "/modules/legacy-journal";
    // The audit's issue prefix -> the area it scores
    const prefixArea: Record<string, string> = {
        Assets: "financial",
        Insurance: "insurance",
        Network: "family",
        Logistics: "medical",
        Digital: "digital",
        Legacy: "legacy",
    };
    const areaLabel: Record<string, string> = {
        financial: "Financial Accounts",
        insurance: "Insurance",
        family: "Contacts",
        medical: "Medical Wishes",
        digital: "Digital Accounts",
        legacy: "Legacy",
    };

    let auditSources = $derived(auditReadiness());
    let scanning = $derived(!auditSources.canScore);
    let score = $derived(estateAudit.percentage);
    let findings = $derived.by((): AuditFinding[] => {
        const open = estateAudit.issues.map((issue, i) => {
            const m = issue.match(/^\[(\w+)\]\s*(.*)$/);
            const prefix = m ? m[1] : "";
            const text = m ? m[2] : issue;
            return {
                id: `issue-${i}`,
                severity: "warning" as const,
                category: areaLabel[prefixArea[prefix]] ?? "",
                title: text,
                desc: "",
                actionUrl: prefix === "Legacy" ? legacyPath(text) : issuePath[prefix],
            };
        });
        const done = Object.entries(estateAudit.moduleScores)
            .filter(([id, s]) => s >= (AuditStore.maxScores[id] ?? Infinity))
            .map(([id]) => ({
                id: `pass-${id}`,
                severity: "pass" as const,
                category: "", // the area is named once, as the title
                title: areaLabel[id] ?? id,
                desc: "The recorded fields used by this section's checks are filled. Review the source records for accuracy and availability.",
            }));
        return [...open, ...done];
    });

    function getIcon(severity: string) {
        return severity === "pass" ? CircleCheck : Shield;
    }

    function getColor(severity: string) {
        return severity === "pass"
            ? "text-success bg-success/10 border-success/20"
            : "text-warning bg-warning-soft border-warning/20";
    }
</script>

<div class="max-w-4xl mx-auto p-8 min-h-screen">
    <div class="mb-12 text-center">
        <div
            class="inline-flex items-center justify-center p-4 bg-primary-soft text-primary-hover rounded-full mb-6 relative"
        >
            <BrainCircuit size={40} />
            {#if scanning}
                <span
                    class="absolute top-0 right-0 w-3 h-3 bg-primary rounded-full animate-ping"
                ></span>
            {/if}
        </div>
        <h1 class="font-serif font-bold text-4xl text-primary-deep dark:text-primary-hover mb-4">
            Recorded Information Check
        </h1>
        <p class="text-lg text-muted-foreground max-w-xl mx-auto">
            Rule-based checks for recorded information across six areas.
        </p>
    </div>

    <AuditSourceStatus state={auditSources} />
    {#if !scanning}
        <div in:slide={{ duration: 400, axis: "y" }}>
            <!-- Score Card -->
            <div
                class="bg-primary-deep text-white rounded-2xl p-10 mb-12 relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8 shadow-xl"
            >
                <div class="relative z-10">
                    <h2
                        class="font-bold text-xl text-white/80 uppercase tracking-widest mb-2"
                    >
                        Record coverage score
                    </h2>
                    <div class="text-6xl font-serif font-bold mb-4">
                        {score}/100
                    </div>
                    <p class="text-white/70 max-w-sm">
                        {score === 0
                            ? "0 points from these record checks so far."
                            : score < 100
                              ? "Some recorded fields used by these checks are filled."
                              : "These checks are filled. Review the actual records and sharing choices."}
                    </p>
                </div>

                <!-- Circular Chart Visualization (CSS only) -->
                <div
                    class="w-32 h-32 rounded-full border-8 border-white/15 relative flex items-center justify-center"
                >
                    <div class="text-2xl font-bold">{score}%</div>
                    <svg class="absolute inset-0 w-full h-full -rotate-90">
                        <circle
                            cx="64"
                            cy="64"
                            r="56"
                            stroke="currentColor"
                            stroke-width="8"
                            fill="transparent"
                            class="text-gold"
                            stroke-dasharray="351"
                            stroke-dashoffset={351 - (351 * score) / 100}
                        />
                    </svg>
                </div>
            </div>

            <!-- Findings List -->
            <div class="space-y-4">
                <h3
                    class="font-bold text-muted-foreground text-sm uppercase tracking-wider mb-6 ml-2"
                >
                    Questions to review
                </h3>

                {#each findings as finding (finding.id)}
                    {@const Icon = getIcon(finding.severity)}
                    <div
                        class="bg-card p-6 rounded-xl border border-border shadow-sm flex flex-col md:flex-row gap-6 items-start md:items-center hover:shadow-md transition-all group"
                    >
                        <div
                            class="p-3 rounded-full shrink-0 {getColor(
                                finding.severity,
                            )}"
                        >
                            <Icon size={24} />
                        </div>

                        <div class="flex-1">
                            {#if finding.category}
                                <div class="flex items-center gap-2 mb-1">
                                    <span
                                        class="text-xs font-bold text-muted-foreground uppercase"
                                        >{finding.category}</span
                                    >
                                </div>
                            {/if}
                            <h4 class="font-bold text-lg text-foreground">
                                {finding.title}
                            </h4>
                            {#if finding.desc}<p class="text-muted-foreground text-sm">{finding.desc}</p>{/if}
                        </div>

                        {#if finding.actionUrl}
                            <a
                                href={finding.actionUrl}
                                class="px-5 py-2 bg-muted text-foreground font-bold rounded-lg text-sm group-hover:bg-primary-deep group-hover:text-white transition-colors flex items-center gap-2"
                            >
                                Take a look <ArrowRight size={16} />
                            </a>
                        {/if}
                    </div>
                {/each}
            </div>
        </div>
    {/if}

    <style>
        @keyframes slide-right {
            0% {
                left: -30%;
            }
            100% {
                left: 100%;
            }
        }
        .animate-slide-right {
            animation: slide-right 2s infinite linear;
        }
    </style>
</div>
