<script lang="ts">
    import type { Snippet } from "svelte";
    import { page } from "$app/stores";
    import { goto } from "$app/navigation";
    import { auth } from "$lib/stores/auth";
    import {
        LayoutDashboard,
        Stethoscope,
        Palette,
        Zap,
        ArrowLeft,
        Users,
        Settings,
    } from "lucide-svelte";

    let { children }: { children: Snippet } = $props();

    // The app's one admin rule (Settings › Data and the email admin routes use it too)
    let isAdmin = $derived($auth.user?.is_admin === true);

    // Anyone else goes to their dashboard once sign-in has settled
    $effect(() => {
        if (!$auth.loading && !isAdmin) goto("/dashboard", { replaceState: true });
    });

    const navItems = [
        { label: "Users", href: "/admin/users", icon: Users },
        { label: "AI Settings", href: "/admin/ai-settings", icon: Settings },
        {
            label: "Readiness Hub",
            href: "/admin/readiness",
            icon: LayoutDashboard,
        },
        { label: "Data Health", href: "/admin/health", icon: Stethoscope },
        { label: "UI Quality", href: "/admin/ui-audit", icon: Palette },
        { label: "Automation", href: "/admin/automation", icon: Zap },
    ];
</script>

{#if isAdmin}
<div
    class="surface-dark min-h-screen bg-slate-950 text-foreground flex font-sans antialiased selection:bg-primary/30"
>
    <!-- Admin Sidebar -->
    <aside
        class="w-64 border-r border-border bg-background/50 backdrop-blur-xl flex flex-col fixed h-full z-50"
    >
        <div class="p-6 border-b border-border">
            <div
                class="font-bold text-xl tracking-tight text-foreground flex items-center gap-2"
            >
                <div
                    class="w-3 h-3 rounded-full bg-primary"
                ></div>
                Admin Suite
            </div>
        </div>

        <nav class="flex-1 p-4 space-y-1">
            {#each navItems as item}
                <a
                    href={item.href}
                    class="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200
                    {$page.url.pathname === item.href
                        ? 'bg-primary-soft text-primary border border-primary/20'
                        : 'text-muted-foreground border border-transparent hover:text-foreground hover:bg-card'}"
                >
                    <item.icon size={18} />
                    {item.label}
                </a>
            {/each}
        </nav>

        <div class="p-4 border-t border-border">
            <a
                href="/dashboard"
                class="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
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
            {@render children()}
        </div>
    </main>
</div>
{/if}

