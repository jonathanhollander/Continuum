<script lang="ts">
    import SmartTextarea from "$lib/components/ui/SmartTextarea.svelte";

    let story = "";
    let timeline = "Went to Italy in 2018. Ate great food. Saw the colosseum.";
</script>

<div class="max-w-2xl mx-auto p-12 space-y-12">
    <div>
        <h2 class="text-2xl font-bold mb-4">Heirloom Context (Empty)</h2>
        <SmartTextarea
            bind:value={story}
            context="heirloom"
            placeholder="Tell the story of this item..."
            label="Provenance"
        />
        <div class="mt-4 p-4 bg-slate-100 rounded text-sm">
            <strong>Bound Value:</strong>
            {story}
        </div>
    </div>

    <div>
        <h2 class="text-2xl font-bold mb-4">Timeline Context (Pre-filled)</h2>
        <SmartTextarea
            bind:value={timeline}
            context="timeline"
            placeholder="Describe the memory..."
            label="Memory Details"
        />
        <div class="mt-4 p-4 bg-slate-100 rounded text-sm">
            <strong>Bound Value:</strong>
            {timeline}
        </div>
    </div>
</div>
