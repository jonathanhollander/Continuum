<script lang="ts">
    import "../../app.css";
    import logo from "$lib/assets/logo.png";

    let { children } = $props();
</script>

<div
    class="h-screen w-screen bg-slate-950 text-slate-200 font-sans overflow-hidden flex relative selection:bg-primary/30"
>
    <!-- Ambient Background (The Void) -->
    <div class="absolute inset-0 z-0">
        <div
            class="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,_rgba(17,24,39,1)_0%,_rgba(2,6,23,1)_100%)]"
        ></div>
        <!-- Subtle Grid -->
        <div
            class="absolute inset-0 opacity-[0.03]"
            style="background-image: linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px); background-size: 50px 50px;"
        ></div>
        <!-- Aurora effect -->
        <div
            class="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-primary/10 blur-[120px] rounded-full"
        ></div>
    </div>

    <!-- Main Content Stage -->
    <main class="relative z-10 flex-1 flex flex-col h-full overflow-hidden">
        <!-- Top Tech Header -->
        <header
            class="h-20 shrink-0 flex items-center justify-between px-8 border-b border-white/5 bg-transparent"
        >
            <div class="flex items-center gap-3">
                <a
                    href="/"
                    class="w-10 h-10 rounded-lg overflow-hidden border border-white/10 hover:border-white/30 transition-all cursor-pointer block"
                >
                    <img
                        src={logo}
                        alt="Continuum"
                        class="w-full h-full object-cover"
                    />
                </a>
                <div
                    class="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500"
                >
                    Continuum <span class="text-primary">v1.0</span>
                </div>
            </div>
        </header>

        <!-- Dynamic Slot -->
        <div class="flex-1 flex overflow-hidden">
            {@render children()}
        </div>
    </main>
</div>
