<script lang="ts">
    import { Palette, Monitor, Smartphone, Check } from "lucide-svelte";

    let checks = [
        {
            id: 1,
            label: "Typography Hierarchy (Serif Headers / Sans Body)",
            checked: true,
        },
        {
            id: 2,
            label: "Color System Consistency (#4A7C74 Primary)",
            checked: true,
        },
        { id: 3, label: "Interactive States (Hover/Focus)", checked: false },
        { id: 4, label: "Mobile Responsiveness (No overflow)", checked: false },
        { id: 5, label: "Loading States (Skeletons/Spinners)", checked: true },
        {
            id: 6,
            label: "Error Handling (Graceful degradation)",
            checked: false,
        },
    ];

    function toggle(id: number) {
        checks = checks.map((c) =>
            c.id === id ? { ...c, checked: !c.checked } : c,
        );
    }
</script>

<div class="space-y-8">
    <div
        class="flex items-center justify-between border-b border-slate-800 pb-8"
    >
        <div>
            <h2 class="text-3xl font-bold text-white mb-2">UI Quality Audit</h2>
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
                    <Palette size={18} class="text-purple-400" />
                    Visual Integrity Checklist
                </h3>

                <div class="space-y-3">
                    {#each checks as check}
                        <!-- svelte-ignore a11y-click-events-have-key-events - Admin tool -->
                        <div
                            class="flex items-center justify-between p-4 rounded-lg border cursor-pointer transition-all
                            {check.checked
                                ? 'bg-emerald-500/5 border-emerald-500/20'
                                : 'bg-slate-950 border-slate-800 hover:border-slate-700'}"
                            onclick={() => toggle(check.id)}
                        >
                            <span
                                class={check.checked
                                    ? "text-emerald-400"
                                    : "text-slate-400"}>{check.label}</span
                            >
                            {#if check.checked}
                                <Check size={18} class="text-emerald-400" />
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
                <div class="flex items-end gap-4 text-slate-600 mb-4">
                    <Monitor size={64} />
                    <Smartphone size={32} />
                </div>
                <p class="text-center text-slate-500 text-sm">
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
                        class="w-8 h-8 rounded bg-[#4A7C74] ring-1 ring-white/10"
                        title="Primary"
                    ></div>
                    <div
                        class="w-8 h-8 rounded bg-[#527B84] ring-1 ring-white/10"
                        title="Secondary"
                    ></div>
                    <div
                        class="w-8 h-8 rounded bg-[#90CDF4] ring-1 ring-white/10"
                        title="Accent"
                    ></div>
                </div>
            </div>
        </div>
    </div>
</div>
