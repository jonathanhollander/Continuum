<script lang="ts">
    import { fade, slide } from "svelte/transition";
    import {
        Shield,
        Mail,
        Facebook,
        Linkedin,
        CircleCheck,
        ExternalLink,
        Key,
        Lock,
        Siren,
        Apple,
        ChevronDown,
        ChevronRight,
        UserCheck,
        FingerprintPattern as Fingerprint,
    } from "lucide-svelte";
    import { onMount } from "svelte";
    import { estateProfile } from "$lib/stores/estateStore";
    import { getStored, setStored } from "$lib/stores/persistence";

    let activeGuide = $state<string | null>(null);
    let setupStatus = $state({
        apple: false,
        google: false,
        facebook: false,
        linkedin: false,
        passwordManager: false,
    });

    onMount(() => {
        setupStatus = getStored("digital_guardian", setupStatus);
        fireDrill = getStored("digital_guardian_drill", fireDrill);
    });

    function toggleGuide(id: string) {
        if (activeGuide === id) {
            activeGuide = null;
        } else {
            activeGuide = id;
        }
    }

    // Fire Drill State
    let fireDrill = $state({
        key: false,
        twoFactor: false,
        login: false,
        phone: false,
        email: false,
        will: false,
    });

    function toggleDrill(step: keyof typeof fireDrill) {
        fireDrill[step] = !fireDrill[step];
        setStored("digital_guardian_drill", fireDrill);
    }

    // Initial load handled in first onMount

    function markComplete(id: keyof typeof setupStatus) {
        setupStatus[id] = !setupStatus[id];
        setStored("digital_guardian", setupStatus);
    }
</script>

<div class="max-w-5xl mx-auto p-8 animate-in fade-in duration-500">
    <!-- Header -->
    <div class="mb-12 text-center">
        <div
            class="inline-flex items-center justify-center p-4 bg-sky-100 text-sky-700 rounded-full mb-6"
        >
            <Shield size={48} />
        </div>
        <h1 class="font-serif font-bold text-4xl text-[#304743] mb-4">
            Digital Guardian
        </h1>
        <p class="text-lg text-muted-foreground max-w-2xl mx-auto">
            Your physical assets are protected by law. Your digital assets are
            protected by passwords. Without these specific setups, your family
            will be locked out of your photos, emails, and accounts forever.
        </p>
    </div>

    <!-- Global Successor Sync Card -->
    <div class="mb-12 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div
            class="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex items-center gap-5"
        >
            <div class="p-4 bg-indigo-50 text-indigo-600 rounded-2xl shrink-0">
                <UserCheck size={28} />
            </div>
            <div>
                <span
                    class="text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-1"
                    >Primary Digital Successor</span
                >
                <div class="text-xl font-bold text-slate-800">
                    {$estateProfile.executorName || "None Designated"}
                </div>
                <p class="text-xs text-slate-500 mt-1">
                    Synced from your Lead Executor designation.
                </p>
            </div>
        </div>

        <div
            class="bg-white border border-indigo-100 rounded-3xl p-6 shadow-sm flex items-center gap-5 relative overflow-hidden group"
        >
            <div
                class="absolute right-0 top-0 p-8 opacity-[0.03] group-hover:scale-110 transition-transform"
            >
                <Fingerprint size={80} />
            </div>
            <div
                class="p-4 bg-emerald-50 text-emerald-600 rounded-2xl shrink-0"
            >
                <Fingerprint size={28} />
            </div>
            <div>
                <span
                    class="text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-1"
                    >Recovery Verification Info</span
                >
                <div class="text-xl font-bold text-slate-800">
                    ID: {($estateProfile.ownerName || "").split(" ")[0]} / SSN: ***-**-{$estateProfile.last4SSN ||
                        "####"}
                </div>
                <p class="text-xs text-slate-500 mt-1">
                    Pre-filled for identity verification forms.
                </p>
            </div>
        </div>
    </div>

    <!-- Access Drill (Verification Mode) -->
    <div
        class="mb-12 bg-rose-50 border border-rose-100 rounded-3xl p-8 relative overflow-hidden"
    >
        <div class="relative z-10 flex flex-col md:flex-row items-start gap-6">
            <div class="p-4 bg-rose-100 text-rose-700 rounded-2xl shrink-0">
                <Siren size={32} />
            </div>
            <div class="flex-1">
                <h3 class="font-serif font-bold text-2xl text-[#304743] mb-2">
                    The Fire Drill
                </h3>
                <p class="text-gray-600 mb-6 max-w-xl leading-relaxed">
                    Hope is not a strategy. Verify that your Legacy Contact can
                    actually get in when you aren't there to help.
                </p>

                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <button
                        class="text-left p-4 rounded-xl border transition-all group {fireDrill.key
                            ? 'bg-rose-500 border-rose-600 text-white shadow-md transform scale-[1.02]'
                            : 'bg-white border-rose-200 hover:shadow-md'}"
                        on:click={() => toggleDrill("key")}
                    >
                        <span
                            class="block text-xs font-bold uppercase tracking-wide mb-1 {fireDrill.key
                                ? 'text-white/80'
                                : 'text-rose-500'}">Step 1</span
                        >
                        <div class="flex items-center gap-2">
                            <span
                                class="font-bold {fireDrill.key
                                    ? 'text-white'
                                    : 'text-gray-900 group-hover:text-rose-700'}"
                                >Locate the Key</span
                            >
                            {#if fireDrill.key}
                                <CircleCheck size={16} />
                            {/if}
                        </div>
                    </button>
                    <button
                        class="text-left p-4 rounded-xl border transition-all group {fireDrill.twoFactor
                            ? 'bg-rose-500 border-rose-600 text-white shadow-md transform scale-[1.02]'
                            : 'bg-white border-rose-200 hover:shadow-md'}"
                        on:click={() => toggleDrill("twoFactor")}
                    >
                        <span
                            class="block text-xs font-bold uppercase tracking-wide mb-1 {fireDrill.twoFactor
                                ? 'text-white/80'
                                : 'text-rose-500'}">Step 2</span
                        >
                        <div class="flex items-center gap-2">
                            <span
                                class="font-bold {fireDrill.twoFactor
                                    ? 'text-white'
                                    : 'text-gray-900 group-hover:text-rose-700'}"
                                >Bypass 2FA</span
                            >
                            {#if fireDrill.twoFactor}
                                <CircleCheck size={16} />
                            {/if}
                        </div>
                    </button>
                    <button
                        class="text-left p-4 rounded-xl border transition-all group {fireDrill.login
                            ? 'bg-rose-500 border-rose-600 text-white shadow-md transform scale-[1.02]'
                            : 'bg-white border-rose-200 hover:shadow-md'}"
                        on:click={() => toggleDrill("login")}
                    >
                        <span
                            class="block text-xs font-bold uppercase tracking-wide mb-1 {fireDrill.login
                                ? 'text-white/80'
                                : 'text-rose-500'}">Step 3</span
                        >
                        <div class="flex items-center gap-2">
                            <span
                                class="font-bold {fireDrill.login
                                    ? 'text-white'
                                    : 'text-gray-900 group-hover:text-rose-700'}"
                                >Confirm Login</span
                            >
                            {#if fireDrill.login}
                                <CircleCheck size={16} />
                            {/if}
                        </div>
                    </button>
                    <button
                        class="text-left p-4 rounded-xl border transition-all group {fireDrill.phone
                            ? 'bg-rose-500 border-rose-600 text-white shadow-md transform scale-[1.02]'
                            : 'bg-white border-rose-200 hover:shadow-md'}"
                        on:click={() => toggleDrill("phone")}
                    >
                        <span
                            class="block text-xs font-bold uppercase tracking-wide mb-1 {fireDrill.phone
                                ? 'text-white/80'
                                : 'text-rose-500'}">Step 4</span
                        >
                        <div class="flex items-center gap-2">
                            <span
                                class="font-bold {fireDrill.phone
                                    ? 'text-white'
                                    : 'text-gray-900 group-hover:text-rose-700'}"
                                >Unlock Phone</span
                            >
                            {#if fireDrill.phone}
                                <CircleCheck size={16} />
                            {/if}
                        </div>
                    </button>
                    <button
                        class="text-left p-4 rounded-xl border transition-all group {fireDrill.email
                            ? 'bg-rose-500 border-rose-600 text-white shadow-md transform scale-[1.02]'
                            : 'bg-white border-rose-200 hover:shadow-md'}"
                        on:click={() => toggleDrill("email")}
                    >
                        <span
                            class="block text-xs font-bold uppercase tracking-wide mb-1 {fireDrill.email
                                ? 'text-white/80'
                                : 'text-rose-500'}">Step 5</span
                        >
                        <div class="flex items-center gap-2">
                            <span
                                class="font-bold {fireDrill.email
                                    ? 'text-white'
                                    : 'text-gray-900 group-hover:text-rose-700'}"
                                >Access Email</span
                            >
                            {#if fireDrill.email}
                                <CircleCheck size={16} />
                            {/if}
                        </div>
                    </button>
                    <button
                        class="text-left p-4 rounded-xl border transition-all group {fireDrill.will
                            ? 'bg-rose-500 border-rose-600 text-white shadow-md transform scale-[1.02]'
                            : 'bg-white border-rose-200 hover:shadow-md'}"
                        on:click={() => toggleDrill("will")}
                    >
                        <span
                            class="block text-xs font-bold uppercase tracking-wide mb-1 {fireDrill.will
                                ? 'text-white/80'
                                : 'text-rose-500'}">Step 6</span
                        >
                        <div class="flex items-center gap-2">
                            <span
                                class="font-bold {fireDrill.will
                                    ? 'text-white'
                                    : 'text-gray-900 group-hover:text-rose-700'}"
                                >Locate Will</span
                            >
                            {#if fireDrill.will}
                                <CircleCheck size={16} />
                            {/if}
                        </div>
                    </button>
                </div>
            </div>
        </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
        <!-- Apple Legacy Contact -->
        <div
            class="bg-white rounded-2xl border border-border overflow-hidden shadow-sm hover:shadow-md transition-shadow"
        >
            <button
                class="w-full text-left p-6 flex items-start gap-4 cursor-pointer"
                on:click={() => toggleGuide("apple")}
            >
                <div
                    class="w-12 h-12 rounded-xl bg-gray-50 flex items-center justify-center shrink-0"
                >
                    <Apple class="w-6 h-6 text-foreground" />
                </div>
                <div class="flex-1">
                    <div class="flex items-center justify-between mb-1">
                        <h3 class="font-bold text-lg text-foreground">
                            Apple Legacy Contact
                        </h3>
                        {#if activeGuide === "apple"}
                            <ChevronDown
                                class="w-5 h-5 text-muted-foreground"
                            />
                        {:else}
                            <ChevronRight
                                class="w-5 h-5 text-muted-foreground"
                            />
                        {/if}
                    </div>
                    <p class="text-sm text-muted-foreground">
                        Allow someone to access your Apple account data after
                        you pass away.
                    </p>
                </div>
            </button>

            {#if activeGuide === "apple"}
                <div
                    class="p-6 bg-gray-50 border-t border-gray-100"
                    transition:slide
                >
                    <ol
                        class="space-y-4 text-sm text-gray-700 list-decimal pl-4 mb-6"
                    >
                        <li>
                            Open <strong>Settings</strong> on your iPhone / iPad.
                        </li>
                        <li>
                            Tap your <strong>Name</strong> (Apple ID) at the top.
                        </li>
                        <li>
                            Select <strong>Sign-In & Security</strong> >
                            <strong>Legacy Contact</strong>.
                        </li>
                        <li>
                            Tap <strong>Add Legacy Contact</strong> and choose a
                            trusted person.
                        </li>
                        <li>
                            <strong>Print the Access Key</strong> provided and store
                            it in your physical Red Binder.
                        </li>
                    </ol>
                    <div
                        class="flex items-center gap-4 pt-4 border-t border-gray-200"
                    >
                        <a
                            href="https://support.apple.com/en-us/HT212360"
                            target="_blank"
                            class="text-sky-600 font-bold text-xs flex items-center gap-1 hover:underline"
                        >
                            Official Guide <ExternalLink size={12} />
                        </a>
                        <button
                            on:click={() => markComplete("apple")}
                            class="ml-auto text-xs font-bold px-3 py-1.5 rounded-full border border-gray-300 hover:bg-green-50 hover:text-green-700 hover:border-green-200 transition-colors"
                        >
                            {setupStatus.apple
                                ? "Mark Incomplete"
                                : "Mark Done"}
                        </button>
                    </div>
                </div>
            {/if}
        </div>

        <!-- Google Inactive Account Manager -->
        <div
            class="bg-white rounded-2xl border border-border overflow-hidden shadow-sm hover:shadow-md transition-shadow"
        >
            <button
                class="w-full text-left p-6 flex items-start gap-4 cursor-pointer"
                on:click={() => toggleGuide("google")}
            >
                <div
                    class="w-12 h-12 rounded-xl bg-gray-50 flex items-center justify-center shrink-0"
                >
                    <Mail class="w-6 h-6 text-foreground" />
                </div>
                <div class="flex-1">
                    <div class="flex items-center justify-between mb-1">
                        <h3 class="font-bold text-lg text-foreground">
                            Google Inactive Account
                        </h3>
                        {#if activeGuide === "google"}
                            <ChevronDown
                                class="w-5 h-5 text-muted-foreground"
                            />
                        {:else}
                            <ChevronRight
                                class="w-5 h-5 text-muted-foreground"
                            />
                        {/if}
                    </div>
                    <p class="text-sm text-muted-foreground">
                        Decide when Google should consider your account inactive
                        and what to do with your data.
                    </p>
                </div>
            </button>

            {#if activeGuide === "google"}
                <div
                    class="p-6 bg-gray-50 border-t border-gray-100"
                    transition:slide
                >
                    <p class="text-sm text-gray-600 mb-4">
                        Google acts as a "Dead Man's Switch". If you don't log
                        in for X months, it notifies your contact.
                    </p>
                    <ol
                        class="space-y-4 text-sm text-gray-700 list-decimal pl-4 mb-6"
                    >
                        <li>Go to <strong>myaccount.google.com</strong>.</li>
                        <li>
                            Search for <strong
                                >"Inactive Account Manager"</strong
                            >.
                        </li>
                        <li>Set waiting period (e.g., 3 months).</li>
                        <li>
                            Choose who to notify and what data they can access
                            (Photos, Drive, etc.).
                        </li>
                        <li>Review the auto-reply email they will receive.</li>
                    </ol>
                    <div
                        class="flex items-center gap-4 pt-4 border-t border-gray-200"
                    >
                        <a
                            href="https://myaccount.google.com/inactive"
                            target="_blank"
                            class="text-sky-600 font-bold text-xs flex items-center gap-1 hover:underline"
                        >
                            Direct Link <ExternalLink size={12} />
                        </a>
                        <button
                            on:click={() => markComplete("google")}
                            class="ml-auto text-xs font-bold px-3 py-1.5 rounded-full border border-gray-300 hover:bg-green-50 hover:text-green-700 hover:border-green-200 transition-colors"
                        >
                            {setupStatus.google
                                ? "Mark Incomplete"
                                : "Mark Done"}
                        </button>
                    </div>
                </div>
            {/if}
        </div>

        <!-- Password Manager (The Master Key) -->
        <div
            class="bg-white rounded-2xl border border-border overflow-hidden shadow-sm hover:shadow-md transition-shadow md:col-span-2"
        >
            <button
                class="w-full text-left p-6 flex items-start gap-4 cursor-pointer"
                on:click={() => toggleGuide("passwordManager")}
            >
                <div
                    class="w-12 h-12 rounded-xl bg-gray-50 flex items-center justify-center shrink-0"
                >
                    <Key class="w-6 h-6 text-foreground" />
                </div>
                <div class="flex-1">
                    <div class="flex items-center justify-between mb-1">
                        <h3 class="font-bold text-lg text-foreground">
                            Password Manager Setup
                        </h3>
                        {#if activeGuide === "passwordManager"}
                            <ChevronDown
                                class="w-5 h-5 text-muted-foreground"
                            />
                        {:else}
                            <ChevronRight
                                class="w-5 h-5 text-muted-foreground"
                            />
                        {/if}
                    </div>
                    <p class="text-sm text-muted-foreground">
                        Ensure your executor has access to your master password
                        through a secure mechanism (e.g., emergency kit).
                    </p>
                </div>
            </button>
            {#if activeGuide === "passwordManager"}
                <div
                    class="p-6 bg-gray-50 border-t border-gray-100"
                    transition:slide
                >
                    <div
                        class="flex gap-4 items-start bg-amber-50 p-4 rounded-lg border border-amber-100 text-amber-900 text-sm mb-6"
                    >
                        <Lock size={18} class="shrink-0 mt-0.5" />
                        <div>
                            <strong
                                >Do NOT store your Master Password digitally.</strong
                            ><br />
                            It should be written down on the Emergency Card in your
                            physical Red Binder, or stored in a bank safety deposit
                            box.
                        </div>
                    </div>

                    <h4 class="font-bold text-sm mb-2">
                        Emergency Kit Checklist:
                    </h4>
                    <ul
                        class="space-y-2 text-sm text-gray-700 list-disc pl-4 mb-6"
                    >
                        <li>
                            Export your "Emergency Kit" PDF from your password
                            manager.
                        </li>
                        <li>
                            Write the Master Password on it (it is usually
                            blank).
                        </li>
                        <li>
                            Seal it in an envelope marked "For Executor Only".
                        </li>
                        <li>Place in Red Binder or Safe.</li>
                    </ul>
                    <div
                        class="flex items-center gap-4 pt-4 border-t border-gray-200"
                    >
                        <button
                            on:click={() => markComplete("passwordManager")}
                            class="ml-auto text-xs font-bold px-3 py-1.5 rounded-full border border-gray-300 hover:bg-green-50 hover:text-green-700 hover:border-green-200 transition-colors"
                        >
                            {setupStatus.passwordManager
                                ? "Mark Incomplete"
                                : "Mark Done"}
                        </button>
                    </div>
                </div>
            {/if}
        </div>

        <!-- Social Media -->
        <div
            class="bg-white rounded-2xl border border-border overflow-hidden shadow-sm hover:shadow-md transition-shadow"
        >
            <button
                class="w-full text-left p-6 flex items-start gap-4 cursor-pointer"
                on:click={() => toggleGuide("facebook")}
            >
                <div
                    class="w-12 h-12 rounded-xl bg-gray-50 flex items-center justify-center shrink-0"
                >
                    <Facebook class="w-6 h-6 text-foreground" />
                </div>
                <div class="flex-1">
                    <div class="flex items-center justify-between mb-1">
                        <h3 class="font-bold text-lg text-foreground">
                            Facebook Legacy Contact
                        </h3>
                        {#if activeGuide === "facebook"}
                            <ChevronDown
                                class="w-5 h-5 text-muted-foreground"
                            />
                        {:else}
                            <ChevronRight
                                class="w-5 h-5 text-muted-foreground"
                            />
                        {/if}
                    </div>
                    <p class="text-sm text-muted-foreground">
                        Designate a legacy contact to manage your memorialized
                        account.
                    </p>
                </div>
            </button>
            {#if activeGuide === "facebook"}
                <div
                    class="p-6 bg-gray-50 border-t border-gray-100"
                    transition:slide
                >
                    <ol
                        class="space-y-4 text-sm text-gray-700 list-decimal pl-4 mb-6"
                    >
                        <li>Settings & Privacy > Settings.</li>
                        <li><strong>Memorialization Settings</strong>.</li>
                        <li>
                            Choose a friend to manage your account (they can pin
                            posts, change profile pic).
                        </li>
                        <li>Alternatively, select "Delete After Death".</li>
                    </ol>
                    <div
                        class="flex items-center gap-4 pt-4 border-t border-gray-200"
                    >
                        <button
                            on:click={() => markComplete("facebook")}
                            class="ml-auto text-xs font-bold px-3 py-1.5 rounded-full border border-gray-300 hover:bg-green-50 hover:text-green-700 hover:border-green-200 transition-colors"
                        >
                            {setupStatus.facebook
                                ? "Mark Incomplete"
                                : "Mark Done"}
                        </button>
                    </div>
                </div>
            {/if}
        </div>

        <div
            class="bg-white rounded-2xl border border-border overflow-hidden shadow-sm hover:shadow-md transition-shadow"
        >
            <button
                class="w-full text-left p-6 flex items-start gap-4 cursor-pointer"
                on:click={() => toggleGuide("linkedin")}
            >
                <div
                    class="w-12 h-12 rounded-xl bg-gray-50 flex items-center justify-center shrink-0"
                >
                    <Linkedin class="w-6 h-6 text-foreground" />
                </div>
                <div class="flex-1">
                    <div class="flex items-center justify-between mb-1">
                        <h3 class="font-bold text-lg text-foreground">
                            LinkedIn Memorialization
                        </h3>
                        {#if activeGuide === "linkedin"}
                            <ChevronDown
                                class="w-5 h-5 text-muted-foreground"
                            />
                        {:else}
                            <ChevronRight
                                class="w-5 h-5 text-muted-foreground"
                            />
                        {/if}
                    </div>
                    <p class="text-sm text-muted-foreground">
                        Request to memorialize or close the account of a
                        deceased member.
                    </p>
                </div>
            </button>
            {#if activeGuide === "linkedin"}
                <div
                    class="p-6 bg-gray-50 border-t border-gray-100"
                    transition:slide
                >
                    <p class="text-sm text-gray-600 mb-4">
                        LinkedIn does not allow pre-selection. Your executor
                        must contact them.
                    </p>
                    <ul
                        class="space-y-4 text-sm text-gray-700 list-disc pl-4 mb-6"
                    >
                        <li>
                            Include your LinkedIn URL in your Executor Toolkit.
                        </li>
                        <li>
                            Note your preference: <strong>Memorialize</strong>
                            (stays up) or <strong>Close Account</strong>.
                        </li>
                        <li>
                            Executor will need: Link to obituary or death
                            certificate.
                        </li>
                    </ul>
                    <div
                        class="flex items-center gap-4 pt-4 border-t border-gray-200"
                    >
                        <button
                            on:click={() => markComplete("linkedin")}
                            class="ml-auto text-xs font-bold px-3 py-1.5 rounded-full border border-gray-300 hover:bg-green-50 hover:text-green-700 hover:border-green-200 transition-colors"
                        >
                            {setupStatus.linkedin
                                ? "Mark Incomplete"
                                : "Mark Done"}
                        </button>
                    </div>
                </div>
            {/if}
        </div>
    </div>
</div>
