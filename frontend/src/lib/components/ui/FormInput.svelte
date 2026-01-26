<script lang="ts">
    let {
        value = $bindable(""),
        label = "",
        placeholder = "",
        type = "text",
        required = false,
        error = "",
        helpText = "",
    } = $props<{
        value?: string;
        label?: string;
        placeholder?: string;
        type?: string;
        required?: boolean;
        error?: string;
        helpText?: string;
    }>();

    let inputClasses = $derived(
        `w-full px-4 py-3 rounded-xl border bg-white outline-none transition-all text-slate-800 ${
            error
                ? "border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
                : "border-slate-200 focus:border-primary focus:ring-2 focus:ring-primary/20"
        }`
    );
</script>

<div class="space-y-1.5">
    {#if label}
        <label class="block text-xs font-bold uppercase text-slate-500 tracking-wide px-1">
            {label}{#if required}<span class="text-rose-500 ml-1">*</span>{/if}
        </label>
    {/if}
    <input
        {type}
        bind:value
        {placeholder}
        class={inputClasses}
    />
    {#if error}
        <p class="text-xs text-red-500 px-1">{error}</p>
    {:else if helpText}
        <p class="text-xs text-slate-400 px-1">{helpText}</p>
    {/if}
</div>
