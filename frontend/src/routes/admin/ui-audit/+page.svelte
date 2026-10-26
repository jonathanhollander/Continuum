<script lang="ts">
    import { Palette, Monitor, Smartphone, Check } from "lucide-svelte";
    import { registerProfileSlice } from "$lib/services/sync.svelte";

    // Ticks are saved with the account's profile (key ui_audit_checks), so they survive a reload
    const tickSync = registerProfileSlice<{ uiAuditChecks: number[] }>(
        "admin_ui_audit",
        (data: Record<string, unknown>) => ({
            uiAuditChecks: Array.isArray(data.uiAuditChecks)
                ? (data.uiAuditChecks as number[])
                : [],
        }),
    );

    const checkList = [
        { id: 1, label: "Typography Hierarchy (Serif Headers / Sans Body)" },
        { id: 2, label: "Color System Consistency (#4A7C74 Primary)" },
        { id: 3, label: "Interactive States (Hover/Focus)" },
        { id: 4, label: "Mobile Responsiveness (No overflow)" },
        { id: 5, label: "Loading States (Skeletons/Spinners)" },
        { id: 6, label: "Error Handling (Graceful degradation)" },
    ];

    let ticked = $derived(tickSync.data?.uiAuditChecks ?? []);
    let checks = $derived(
        checkList.map((c) => ({ ...c, checked: ticked.includes(c.id) })),
    );

    function toggle(id: number) {
        const next = ticked.includes(id)
            ? ticked.filter((x) => x !== id)
            : [...ticked, id];
        tickSync.update({ uiAuditChecks: next }).catch(() => {});
    }
</script>

<div class="space-y-8">
    <div
        class="flex items-center justify-between border-b border-slate-800 pb-8"
    >
        <div>
            <h1 class="text-3xl font-bold text-white mb-2">UI Quality Audit</h1>
            <p class="text-slate-400">
                Manual visual verification to ensure the "Stunning" standard is
                met.
            </p>
        </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <!-- Vibe Check List -->
        <div class="lg:col-span-2 space-y-4">
            <div class="bg-slate-900 border border-slate-800 rounded-xl p-6">
                <h3
                    class="text-lg font-bold text-white mb-6 flex items-center gap-2"
                >
                    <Palette size={18} class="text-primary" />
                    Visual Integrity Checklist
                </h3>

                <div class="space-y-3">
                    {#each checks as check}
                        <div
                            class="flex items-center justify-between p-4 rounded-lg border cursor-pointer transition-all
                            {check.checked
                                ? 'bg-success/10 border-success/30'
                                : 'bg-slate-950 border-slate-800 hover:border-slate-700'}"
                            role="button"
                            tabindex="0"
                            onclick={() => toggle(check.id)}
                            onkeydown={(e) => {
                                if (e.target === e.currentTarget && (e.key === "Enter" || e.key === " ")) {
                                    e.preventDefault();
                                    toggle(check.id);
                                }
                            }}
                        >
                            <span
                                class={check.checked
                                    ? "text-success"
                                    : "text-slate-400"}>{check.label}</span
                            >
                            {#if check.checked}
                                <Check size={18} class="text-success" />
                            {/if}
                        </div>
                    {/each}
                </div>
            </div>
        </div>

        <!-- Responsive Preview Mockup (Static) -->
        <div class="space-y-6">
            <div
                class="bg-slate-900 border border-slate-800 rounded-xl p-6 flex flex-col items-center justify-center min-h-[300px]"
            >
                <div class="flex items-end gap-4 text-muted-foreground mb-4">
                    <Monitor size={64} />
                    <Smartphone size={32} />
                </div>
                <p class="text-center text-muted-foreground text-sm">
                    Open this dashboard on different<br />devices to test
                    responsiveness live.
                </p>
            </div>

            <div class="bg-slate-800/50 rounded-xl p-6 border border-slate-800">
                <h4 class="text-sm font-bold text-white mb-2">
                    Theme Token Check
                </h4>
                <div class="flex gap-2">
                    <div
                        class="w-8 h-8 rounded bg-primary ring-1 ring-white/10"
                        title="Primary"
                    ></div>
                    <div
                        class="w-8 h-8 rounded bg-secondary ring-1 ring-white/10"
                        title="Secondary"
                    ></div>
                    <div
                        class="w-8 h-8 rounded bg-accent ring-1 ring-white/10"
                        title="Accent"
                    ></div>
                </div>
            </div>
        </div>
    </div>
</div>
