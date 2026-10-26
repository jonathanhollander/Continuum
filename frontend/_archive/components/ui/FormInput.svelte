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

    const uid = $props.id();

    let inputClasses = $derived(
        `w-full px-4 py-3 rounded-xl border bg-card outline-none transition-all text-foreground ${
            error
                ? "border-warning focus:border-warning focus:ring-2 focus:ring-warning/20"
                : "border-border focus:border-primary focus:ring-2 focus:ring-primary/20"
        }`
    );
</script>

<div class="space-y-1.5">
    {#if label}
        <label for="{uid}-input" class="block text-xs font-bold uppercase text-muted-foreground tracking-wide px-1">
            {label}{#if required}<span class="text-primary-hover ml-1">*</span>{/if}
        </label>
    {/if}
    <input
        id="{uid}-input"
        {type}
        bind:value
        {placeholder}
        class={inputClasses}
    />
    {#if error}
        <p class="text-xs text-warning px-1">{error}</p>
    {:else if helpText}
        <p class="text-xs text-muted-foreground px-1">{helpText}</p>
    {/if}
</div>
