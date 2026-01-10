<script>
    import { page } from "$app/stores";
    import {
        LayoutDashboard,
        Stethoscope,
        Palette,
        ArrowLeft,
    } from "lucide-svelte";

    const navItems = [
        {
            label: "Readiness Hub",
            href: "/admin/readiness",
            icon: LayoutDashboard,
        },
        { label: "Data Health", href: "/admin/health", icon: Stethoscope },
        { label: "UI Quality", href: "/admin/ui-audit", icon: Palette },
    ];
</script>

<div
    class="min-h-screen bg-slate-950 text-slate-200 flex font-sans antialiased selection:bg-emerald-500/30"
>
    <!-- Admin Sidebar -->
    <aside
        class="w-64 border-r border-slate-800 bg-slate-900/50 backdrop-blur-xl flex flex-col fixed h-full z-50"
    >
        <div class="p-6 border-b border-slate-800">
            <h1
                class="font-bold text-xl tracking-tight text-white flex items-center gap-2"
            >
                <div
                    class="w-3 h-3 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]"
                ></div>
                Admin Suite
            </h1>
            <p
                class="text-xs text-slate-500 mt-2 uppercase tracking-wider font-mono"
            >
                System v4.0
            </p>
        </div>

        <nav class="flex-1 p-4 space-y-1">
            {#each navItems as item}
                <a
                    href={item.href}
                    class="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200
                    {$page.url.pathname === item.href
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800'}"
                >
                    <svelte:component this={item.icon} size={18} />
                    {item.label}
                </a>
            {/each}
        </nav>

        <div class="p-4 border-t border-slate-800">
            <a
                href="/"
                class="flex items-center gap-2 text-xs text-slate-500 hover:text-white transition-colors"
            >
                <ArrowLeft size={14} />
                Return to App
            </a>
        </div>
    </aside>

    <!-- Main Content Area -->
    <main class="flex-1 ml-64 p-8 overflow-y-auto">
        <div
            class="max-w-6xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500"
        >
            <slot />
        </div>
    </main>
</div>
