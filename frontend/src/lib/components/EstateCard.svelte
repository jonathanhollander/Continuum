<script lang="ts">
    import MechanicalIcon from "$lib/components/MechanicalIcon.svelte";
    import { ShieldCheck, Settings } from "lucide-svelte";

    export let estate: {
        id: string;
        name: string;
        description: string;
        status?: string;
    };

    // SVG Paths for Mechanical Icons (mirrored from legacy Icon system)
    const estatePath = `
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <polyline points="9 22 9 12 15 12 15 22" />
  `;
</script>

<a href={`/estate/${estate.id}`} class="block group">
    <div
        class="relative bg-card border border-border p-6 rounded-lg hover:shadow-lg transition-all hover:border-primary/50 cursor-pointer overflow-hidden"
    >
        <!-- Hover Gear Animation (Top Right) -->
        <div
            class="absolute top-0 right-0 p-4 opacity-50 group-hover:opacity-100 transition-opacity"
        >
            <Settings size={16} />
        </div>

        <!-- Main Icon -->
        <div
            class="mb-4 size-10 rounded bg-primary/10 flex items-center justify-center text-primary"
        >
            <ShieldCheck size={20} />
        </div>

        <!-- Content -->
        <h3
            class="text-xl font-serif mb-1 group-hover:text-primary transition-colors"
        >
            {estate.name}
        </h3>
        <p class="text-sm text-muted-foreground line-clamp-2">
            {estate.description || "No description provided."}
        </p>

        <!-- Footer -->
        <div
            class="mt-4 pt-4 border-t border-border flex items-center justify-between text-xs text-muted-foreground font-blueprint"
        >
            <span class="uppercase">STATUS: {estate.status || "ACTIVE"}</span>
            <span>ID: {estate.id.slice(-4)}</span>
        </div>
    </div>
</a>
