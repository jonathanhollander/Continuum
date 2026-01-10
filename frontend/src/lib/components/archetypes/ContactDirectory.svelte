<script lang="ts">
    import { onMount } from "svelte";
    import {
        Plus,
        User,
        Phone,
        Mail,
        Building,
        Trash2,
        Heart,
        Scale,
        Stethoscope,
        Briefcase,
        Siren,
        Smartphone,
        Users,
        Sparkles,
        ShieldCheck,
    } from "lucide-svelte";
    import { slide, scale, fade } from "svelte/transition";
    import { estateProfile } from "$lib/stores/estateStore";
    import { getStored, setStored } from "$lib/stores/persistence";

    export let module: any;

    type RoleType =
        | "Spouse"
        | "Child"
        | "Parent"
        | "Attorney"
        | "Accountant"
        | "Advisor"
        | "Medical"
        | "Other";

    interface Contact {
        id: string;
        name: string;
        role: RoleType;
        email: string;
        phone: string;
        organization: string;
        notes: string;
        isEmergencyContact: boolean;
    }

    let contacts: Contact[] = [];
    let showAddForm = false;

    let newContact: Partial<Contact> = {
        name: "",
        role: "Other",
        email: "",
        phone: "",
        organization: "",
        notes: "",
        isEmergencyContact: false,
    };

    const storageKey = `contacts_${module.id}`;

    onMount(() => {
        const defaultContacts: Contact[] = [
            {
                id: "1",
                name: "Sarah Hollander",
                role: "Spouse",
                email: "sarah@example.com",
                phone: "555-0101",
                organization: "",
                notes: "Primary Beneficiary",
                isEmergencyContact: true,
            },
            {
                id: "2",
                name: "Michael Hollander",
                role: "Child",
                email: "mike@example.com",
                phone: "555-0102",
                organization: "University of WA",
                notes: "Trust Fund A",
                isEmergencyContact: false,
            },
            {
                id: "3",
                name: "Robert Davis, Esq.",
                role: "Attorney",
                email: "rdavis@lawfirm.com",
                phone: "555-0200",
                organization: "Davis & Partners",
                notes: "Estate Lawyer",
                isEmergencyContact: false,
            },
        ];
        contacts = getStored(storageKey, defaultContacts);
    });

    function save() {
        setStored(storageKey, contacts);
    }

    function addContact() {
        if (!newContact.name) return;

        contacts = [
            ...contacts,
            {
                id: crypto.randomUUID(),
                name: newContact.name,
                role: newContact.role as RoleType,
                email: newContact.email || "",
                phone: newContact.phone || "",
                organization: newContact.organization || "",
                notes: newContact.notes || "",
                isEmergencyContact: newContact.isEmergencyContact || false,
            },
        ];

        save();
        newContact = {
            name: "",
            role: "Other",
            email: "",
            phone: "",
            organization: "",
            notes: "",
            isEmergencyContact: false,
        };
        showAddForm = false;
    }

    function removeContact(id: string) {
        contacts = contacts.filter((c) => c.id !== id);
        save();
    }

    function designateExecutor(name: string) {
        estateProfile.update((p) => ({ ...p, executorName: name }));
    }

    // Role Styling Helper
    function getRoleIcon(role: string) {
        switch (role) {
            case "Spouse":
                return Heart;
            case "Child":
                return User;
            case "Attorney":
                return Scale;
            case "Advisor":
            case "Accountant":
                return Briefcase;
            case "Medical":
                return Stethoscope;
            default:
                return User;
        }
    }

    function getRoleColor(role: string) {
        switch (role) {
            case "Spouse":
            case "Child":
                return "bg-rose-100 text-rose-600 border-rose-200";
            case "Attorney":
                return "bg-slate-100 text-slate-700 border-slate-200";
            case "Medical":
                return "bg-blue-100 text-blue-600 border-blue-200";
            case "Advisor":
            case "Accountant":
                return "bg-emerald-100 text-emerald-700 border-emerald-200";
            default:
                return "bg-gray-100 text-gray-600 border-gray-200";
        }
    }

    function getRoleDescription(role: string): string {
        switch (role) {
            case "Attorney":
                return "Helps navigate legal complexities.";
            case "Accountant":
                return "Manages tax liabilities and filings.";
            case "Medical":
                return "Holds vital health directives.";
            case "Spouse":
                return "Primary partner in decision making.";
            case "Advisor":
                return "Ensures financial continuity.";
            default:
                return "A trusted member of your circle.";
        }
    }

    // Segregate Contacts
    $: family = contacts.filter((c) =>
        ["Spouse", "Child", "Parent"].includes(c.role),
    );
    $: professionals = contacts.filter(
        (c) => !["Spouse", "Child", "Parent"].includes(c.role),
    );
    $: emergencyContacts = contacts.filter((c) => c.isEmergencyContact);
</script>

<div class="space-y-12 animate-in fade-in duration-500">
    <!-- Trusted Guide Header -->
    <div
        class="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-border/50 pb-6"
    >
        <div>
            <div class="flex items-center gap-2 mb-2">
                <div class="bg-indigo-100 text-indigo-700 p-2 rounded-full">
                    <Users size={20} />
                </div>
                <h3 class="text-3xl font-serif font-bold text-primary">
                    Circle of Trust
                </h3>
            </div>

            <p class="text-muted-foreground mt-1 max-w-xl">
                These are the people who will carry out your wishes and support
                your legacy. Keeping this list current is an act of care.
            </p>
        </div>
        <button
            on:click={() => (showAddForm = true)}
            class="bg-indigo-600 text-white hover:bg-indigo-700 px-5 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all"
        >
            <Plus size={18} /> Add Trusted Person
        </button>
    </div>

    {#if showAddForm}
        <div
            transition:slide
            class="glass-panel p-8 rounded-xl relative overflow-hidden border-indigo-100"
        >
            <h4
                class="font-serif font-bold text-xl text-indigo-900 mb-6 flex items-center gap-2"
            >
                <Sparkles size={18} /> Add to Your Circle
            </h4>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <!-- Name & Role -->
                <div class="space-y-2">
                    <label
                        class="text-xs font-bold uppercase text-muted-foreground"
                        >Full Name</label
                    >
                    <input
                        bind:value={newContact.name}
                        class="w-full p-3 rounded-lg border border-border bg-white/50 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
                        placeholder="e.g. John Doe"
                    />
                </div>
                <div class="space-y-2">
                    <label
                        class="text-xs font-bold uppercase text-muted-foreground"
                        >Role in your life</label
                    >
                    <select
                        bind:value={newContact.role}
                        class="w-full p-3 rounded-lg border border-border bg-white/50 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
                    >
                        <option value="Spouse">Spouse / Partner</option>
                        <option value="Child">Child / Dependent</option>
                        <option value="Parent">Parent</option>
                        <option value="Attorney"
                            >Attorney (Legal Council)</option
                        >
                        <option value="Accountant"
                            >Accountant (Tax Guide)</option
                        >
                        <option value="Medical">Medical Provider</option>
                        <option value="Advisor">Financial Advisor</option>
                        <option value="Other">Other Friend/Family</option>
                    </select>
                </div>

                <!-- Contact Info -->
                <div class="space-y-2">
                    <label
                        class="text-xs font-bold uppercase text-muted-foreground"
                        >Email</label
                    >
                    <input
                        bind:value={newContact.email}
                        class="w-full p-3 rounded-lg border border-border bg-white/50 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
                    />
                </div>
                <div class="space-y-2">
                    <label
                        class="text-xs font-bold uppercase text-muted-foreground"
                        >Phone</label
                    >
                    <input
                        bind:value={newContact.phone}
                        class="w-full p-3 rounded-lg border border-border bg-white/50 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
                    />
                </div>

                <!-- Org -->
                <div class="col-span-full space-y-2">
                    <label
                        class="text-xs font-bold uppercase text-muted-foreground"
                        >Organization / Firm</label
                    >
                    <input
                        bind:value={newContact.organization}
                        class="w-full p-3 rounded-lg border border-border bg-white/50 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
                        placeholder="e.g. Smith & Assoc."
                    />
                </div>

                <!-- ICE Checkbox -->
                <div
                    class="col-span-full flex items-center gap-2 pt-2 bg-red-50 p-3 rounded-lg border border-red-100"
                >
                    <input
                        type="checkbox"
                        id="ice"
                        bind:checked={newContact.isEmergencyContact}
                        class="w-4 h-4 rounded border-gray-300 text-red-600 focus:ring-red-500"
                    />
                    <div>
                        <label
                            for="ice"
                            class="text-sm font-bold text-red-700 flex items-center gap-1"
                        >
                            <Siren size={14} /> Emergency Contact (ICE)
                        </label>
                        <p class="text-xs text-red-600/70">
                            Check this if this person should be called first in
                            a crisis.
                        </p>
                    </div>
                </div>
            </div>

            <div class="flex justify-end gap-3 mt-8">
                <button
                    on:click={() => (showAddForm = false)}
                    class="px-5 py-2.5 text-sm font-medium hover:bg-black/5 rounded-lg transition-colors"
                    >Cancel</button
                >
                <button
                    on:click={addContact}
                    class="px-6 py-2.5 bg-indigo-600 text-white font-bold rounded-lg shadow hover:shadow-lg transition-all"
                    >Welcome to Circle</button
                >
            </div>
        </div>
    {/if}

    <!-- Emergency Contacts Banner -->
    {#if emergencyContacts.length > 0}
        <div
            class="bg-red-500/5 border border-red-500/20 p-4 rounded-xl flex flex-wrap gap-4 items-center"
        >
            <div class="bg-red-500/10 p-2 rounded-full text-red-600">
                <Siren size={20} />
            </div>
            <div class="flex-1">
                <h4
                    class="font-bold text-red-800 text-sm uppercase tracking-wide"
                >
                    In Case of Emergency
                </h4>
                <div class="flex gap-4 mt-1">
                    {#each emergencyContacts as ice}
                        <div
                            class="flex items-center gap-2 text-sm font-medium text-red-900/80"
                        >
                            <span>{ice.name}</span>
                            <a
                                href="tel:{ice.phone}"
                                class="bg-white/50 hover:bg-white px-2 py-0.5 rounded-full text-xs flex items-center gap-1 transition-colors border border-red-200 text-red-700"
                            >
                                <Phone size={10} />
                                {ice.phone}
                            </a>
                        </div>
                    {/each}
                </div>
            </div>
        </div>
    {/if}

    <!-- Family Hierarchy Section -->
    {#if family.length > 0}
        <section>
            <h4
                class="text-sm font-bold uppercase tracking-widest text-muted-foreground mb-6 flex items-center gap-2"
            >
                <Heart size={16} class="text-rose-500" /> Your Inner Family Circle
            </h4>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <!-- Anchor Stub -->
                <div
                    class="glass-card p-6 rounded-xl flex items-center gap-4 opacity-75 grayscale hover:grayscale-0 transition-all border-dashed border-2"
                >
                    <div
                        class="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-serif font-bold text-xl shadow-lg"
                    >
                        You
                    </div>
                    <div>
                        <h5 class="font-bold text-lg">Estate Owner</h5>
                        <p class="text-xs text-muted-foreground">
                            The central pillar
                        </p>
                    </div>
                </div>

                {#each family as member (member.id)}
                    <div
                        class="glass-card p-6 rounded-xl flex items-center gap-4 relative group hover:border-rose-200 transition-colors shadow-sm"
                        transition:scale
                    >
                        <div
                            class="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                            <button
                                on:click={() => removeContact(member.id)}
                                class="text-muted-foreground hover:text-rose-500"
                                ><Trash2 size={16} /></button
                            >
                        </div>

                        <div class="relative">
                            <div
                                class="w-12 h-12 rounded-full {getRoleColor(
                                    member.role,
                                )} flex items-center justify-center shadow-inner border"
                            >
                                <svelte:component
                                    this={getRoleIcon(member.role)}
                                    size={20}
                                />
                            </div>
                            {#if member.isEmergencyContact}
                                <div
                                    class="absolute -bottom-1 -right-1 bg-red-500 text-white rounded-full p-1 border border-white shadow-sm"
                                    title="Emergency Contact"
                                >
                                    <Siren size={10} />
                                </div>
                            {/if}
                        </div>

                        <div>
                            <h5 class="font-bold text-lg">{member.name}</h5>
                            <span
                                class="text-xs font-bold uppercase tracking-wide text-muted-foreground bg-secondary/10 px-1.5 py-0.5 rounded"
                                >{member.role}</span
                            >
                            {#if member.phone}
                                <a
                                    href="tel:{member.phone}"
                                    class="mt-1 flex items-center gap-1 text-xs text-primary hover:underline"
                                >
                                    <Smartphone size={10} />
                                    {member.phone}
                                </a>
                            {/if}
                            <button
                                on:click={() => designateExecutor(member.name)}
                                class="mt-3 w-full py-1.5 text-[10px] font-bold uppercase tracking-widest border rounded transition-all flex items-center justify-center gap-1.5
                                {$estateProfile.executorName === member.name
                                    ? 'bg-[#4A7C74] text-white border-[#4A7C74]'
                                    : 'bg-white text-slate-400 border-slate-200 hover:border-[#4A7C74] hover:text-[#4A7C74]'}"
                            >
                                <ShieldCheck size={12} />
                                {$estateProfile.executorName === member.name
                                    ? "Lead Executor"
                                    : "Designate Executor"}
                            </button>
                        </div>
                    </div>
                {/each}
            </div>
        </section>
    {/if}

    <!-- Professional Network Section -->
    <section>
        <h4
            class="text-sm font-bold uppercase tracking-widest text-muted-foreground mb-6 flex items-center gap-2"
        >
            <Briefcase size={16} class="text-indigo-600" /> Trusted Counsel
        </h4>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {#each professionals as pro (pro.id)}
                <div
                    class="bg-card border border-border p-5 rounded-lg hover:shadow-lg transition-all group relative"
                    transition:fade
                >
                    <button
                        on:click={() => removeContact(pro.id)}
                        class="absolute top-3 right-3 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                        ><Trash2 size={14} /></button
                    >

                    <div class="flex items-start justify-between mb-3">
                        <div class="relative">
                            <div
                                class="w-10 h-10 rounded-lg {getRoleColor(
                                    pro.role,
                                )} flex items-center justify-center"
                            >
                                <svelte:component
                                    this={getRoleIcon(pro.role)}
                                    size={18}
                                />
                            </div>
                            {#if pro.isEmergencyContact}
                                <div
                                    class="absolute -bottom-1 -right-1 bg-red-500 text-white rounded-full p-1 border border-white"
                                    title="Emergency Contact"
                                >
                                    <Siren size={10} />
                                </div>
                            {/if}
                        </div>
                    </div>

                    <h5 class="font-bold text-foreground mb-0.5">{pro.name}</h5>
                    <div class="group/tooltip relative">
                        <p
                            class="text-xs text-primary font-medium mb-3 cursor-help border-b border-primary/20 w-fit"
                        >
                            {pro.role}
                        </p>
                        <div
                            class="absolute left-0 bottom-full mb-2 hidden group-hover/tooltip:block w-48 bg-black/80 text-white text-[10px] p-2 rounded shadow-xl z-20"
                        >
                            {getRoleDescription(pro.role)}
                        </div>
                    </div>

                    <div
                        class="space-y-2 text-xs text-muted-foreground border-t border-border pt-3"
                    >
                        {#if pro.organization}
                            <div
                                class="flex items-center gap-2 font-medium text-foreground/80"
                            >
                                <Building size={12} />
                                {pro.organization}
                            </div>
                        {/if}
                        {#if pro.email}
                            <div class="flex items-center gap-2 truncate">
                                <Mail size={12} />
                                {pro.email}
                            </div>
                        {/if}
                        {#if pro.phone}
                            <a
                                href="tel:{pro.phone}"
                                class="flex items-center gap-2 hover:text-primary transition-colors"
                            >
                                <Phone size={12} />
                                {pro.phone}
                            </a>
                        {/if}
                    </div>
                </div>
            {/each}
            {#if professionals.length === 0}
                <div
                    class="col-span-full py-12 text-center text-muted-foreground text-sm italic border border-dashed border-border rounded-xl bg-secondary/5"
                >
                    <p>You haven't added any professional advisors yet.</p>
                    <p class="text-xs mt-1 text-muted-foreground/60">
                        Attorneys, Accountants, and Financial Advisors go here.
                    </p>
                </div>
            {/if}
        </div>
    </section>
</div>
