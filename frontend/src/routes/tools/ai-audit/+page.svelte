<script lang="ts">
    import { onMount } from "svelte";
    import {
        CircleCheck,
        TriangleAlert,
        Shield,
        ArrowRight,
        BrainCircuit,
    } from "lucide-svelte";
    import { fade, slide } from "svelte/transition";

    // Mock finding types
    interface AuditFinding {
        id: string;
        severity: "critical" | "warning" | "pass";
        category: "Legal" | "Financial" | "Digital" | "Contacts";
        title: string;
        desc: string;
        actionUrl?: string;
    }

    let findings: AuditFinding[] = [];
    let scanning = true;
    let score = 0;

    // Simulation of scanning logic
    onMount(() => {
        setTimeout(() => {
            // In a real app, this would read from your Svelte stores or localStorage
            // For now, we simulate a scan based on typical missing items
            const mockFindings: AuditFinding[] = [
                {
                    id: "1",
                    severity: "critical",
                    category: "Legal",
                    title: "Missing Will & Testament",
                    desc: 'No document tagged as "Will" was found in the Legal Vault.',
                    actionUrl: "/modules/legal-documents",
                },
                {
                    id: "2",
                    severity: "critical",
                    category: "Financial",
                    title: "No Life Insurance Policy",
                    desc: "You have listed dependents but no active life insurance policy.",
                    actionUrl: "/modules/insurance",
                },
                {
                    id: "3",
                    severity: "warning",
                    category: "Digital",
                    title: "Password Manager Unlinked",
                    desc: 'Your "Digital Guardian" module has no entries for password management.',
                    actionUrl: "/modules/digital-guardian",
                },
                {
                    id: "4",
                    severity: "pass",
                    category: "Contacts",
                    title: "Executor Designated",
                    desc: "Primary executor contact information is complete.",
                },
                {
                    id: "5",
                    severity: "pass",
                    category: "Financial",
                    title: "Bank Accounts Listed",
                    desc: "3 bank accounts found in the ledger.",
                },
            ];

            findings = mockFindings;
            const passCount = findings.filter(
                (f) => f.severity === "pass",
            ).length;
            score = Math.round((passCount / findings.length) * 100);
            scanning = false;
        }, 2000);
    });

    function getIcon(severity: string) {
        switch (severity) {
            case "critical":
                return TriangleAlert;
            case "warning":
                return Shield;
            case "pass":
                return CircleCheck;
        }
    }

    function getColor(severity: string) {
        switch (severity) {
            case "critical":
                return "text-red-500 bg-red-50 border-red-100";
            case "warning":
                return "text-amber-500 bg-amber-50 border-amber-100";
            case "pass":
                return "text-green-500 bg-green-50 border-green-100";
        }
    }
</script>

<div class="max-w-4xl mx-auto p-8 min-h-screen">
    <div class="mb-12 text-center">
        <div
            class="inline-flex items-center justify-center p-4 bg-indigo-50 text-indigo-600 rounded-full mb-6 relative"
        >
            <BrainCircuit size={40} />
            {#if scanning}
                <span
                    class="absolute top-0 right-0 w-3 h-3 bg-indigo-500 rounded-full animate-ping"
                ></span>
            {/if}
        </div>
        <h1 class="font-serif font-bold text-4xl text-[#304743] mb-4">
            AI Completeness Check
        </h1>
        <p class="text-lg text-muted-foreground max-w-xl mx-auto">
            Our algorithmic audit scans your entire estate plan for holes,
            missing documents, and overlooked assets.
        </p>
    </div>

    {#if scanning}
        <div
            class="max-w-xl mx-auto bg-white rounded-2xl p-12 border border-gray-100 shadow-sm text-center"
            in:fade
        >
            <div
                class="w-full bg-gray-100 rounded-full h-2 mb-8 overflow-hidden relative"
            >
                <div
                    class="absolute inset-0 bg-indigo-500 animate-slide-right w-1/3"
                ></div>
            </div>
            <p class="font-mono text-sm text-indigo-600 animate-pulse">
                Scanning Legal Vault...
            </p>
            <p class="font-mono text-sm text-gray-400 mt-2">
                Analyzing Financial Relations...
            </p>
        </div>
    {:else}
        <div in:slide={{ duration: 400, axis: "y" }}>
            <!-- Score Card -->
            <div
                class="bg-[#304743] text-white rounded-3xl p-10 mb-12 relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8 shadow-xl"
            >
                <div class="relative z-10">
                    <h2
                        class="font-bold text-xl text-emerald-300 uppercase tracking-widest mb-2"
                    >
                        Audit Score
                    </h2>
                    <div class="text-6xl font-serif font-bold mb-4">
                        {score}/100
                    </div>
                    <p class="text-emerald-100/70 max-w-sm">
                        {score < 50
                            ? "Critical gaps detected. Your estate is vulnerable."
                            : score < 80
                              ? "Good progress, but key protections are missing."
                              : "Excellent. Your estate plan is robust."}
                    </p>
                </div>

                <!-- Circular Chart Visualization (CSS only) -->
                <div
                    class="w-32 h-32 rounded-full border-8 border-emerald-900 relative flex items-center justify-center"
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
                            class="text-emerald-400"
                            stroke-dasharray="351"
                            stroke-dashoffset={351 - (351 * score) / 100}
                        />
                    </svg>
                </div>
            </div>

            <!-- Findings List -->
            <div class="space-y-4">
                <h3
                    class="font-bold text-gray-400 text-sm uppercase tracking-wider mb-6 ml-2"
                >
                    Action Items
                </h3>

                {#each findings.sort( (a, b) => (a.severity === "critical" ? -1 : 1), ) as finding}
                    <div
                        class="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex flex-col md:flex-row gap-6 items-start md:items-center hover:shadow-md transition-all group"
                    >
                        <div
                            class="p-3 rounded-full shrink-0 {getColor(
                                finding.severity,
                            )}"
                        >
                            <svelte:component
                                this={getIcon(finding.severity)}
                                size={24}
                            />
                        </div>

                        <div class="flex-1">
                            <div class="flex items-center gap-2 mb-1">
                                <span
                                    class="text-xs font-bold text-gray-400 uppercase"
                                    >{finding.category}</span
                                >
                                {#if finding.severity === "critical"}
                                    <span
                                        class="text-xs font-bold text-red-500 bg-red-50 px-2 py-0.5 rounded-full"
                                        >URGENT</span
                                    >
                                {/if}
                            </div>
                            <h4 class="font-bold text-lg text-gray-800">
                                {finding.title}
                            </h4>
                            <p class="text-gray-500 text-sm">{finding.desc}</p>
                        </div>

                        {#if finding.actionUrl}
                            <a
                                href={finding.actionUrl}
                                class="px-5 py-2 bg-gray-50 text-gray-600 font-bold rounded-lg text-sm group-hover:bg-[#304743] group-hover:text-white transition-colors flex items-center gap-2"
                            >
                                Fix Now <ArrowRight size={16} />
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
