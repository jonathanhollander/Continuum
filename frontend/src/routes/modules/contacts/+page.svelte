<script lang="ts">
    import { fade, slide } from "svelte/transition";
    import {
        Users,
        Phone,
        Mail,
        CircleAlert,
        CircleCheck,
        Clock,
        Plus,
        User,
        Shield,
        Trash2,
    } from "lucide-svelte";
    import { onMount } from "svelte";
    import ContactRow from "$lib/components/modules/contacts/ContactRow.svelte";
    import GhostRow from "$lib/components/ui/GhostRow.svelte";
    import { t, language } from "$lib/stores/localization";
    import { getSmartSamples } from "$lib/data/smartSamples";
    import EmptyStateGuide from "$lib/components/ui/EmptyStateGuide.svelte";
    import SmartTextarea from "$lib/components/ui/SmartTextarea.svelte";
    import { getStored, setStored } from "$lib/stores/persistence";

    type ContactRole =
        | "Family"
        | "Friend"
        | "Medical"
        | "Legal"
        | "Financial"
        | "Other";
    type NotificationTier = "1_Immediate" | "2_SameDay" | "3_Service" | "4_DNR"; // DNR = Do Not Reach out initially

    type Contact = {
        id: string;
        name: string;
        role: ContactRole;
        relation: string; // "Brother", "Lawyer"
        phone: string;
        email: string;
        tier: NotificationTier;
        notificationStatus:
            | "Pending"
            | "Called"
            | "LeftMsg"
            | "Notified"
            | "Unreachable";
        notes: string;
    };

    let activeTab = "call-list"; // call-list | directory
    let contacts: Contact[] = [];
    let showAddModal = false;

    // Contact Form Stub
    let newContact: Partial<Contact> = {
        role: "Family",
        tier: "2_SameDay",
        notificationStatus: "Pending",
    };

    // Derived
    $: tier1 = contacts.filter((c) => c.tier === "1_Immediate");
    $: tier2 = contacts.filter((c) => c.tier === "2_SameDay");
    $: tier3 = contacts.filter((c) => c.tier === "3_Service");

    onMount(() => {
        contacts = getStored<Contact[]>("contacts", []);
    });

    function save() {
        setStored("contacts", contacts);
    }

    function addContact() {
        if (!newContact.name) return;
        contacts = [
            ...contacts,
            {
                id: crypto.randomUUID(),
                name: newContact.name,
                role: newContact.role || "Friend",
                relation: newContact.relation || "",
                phone: newContact.phone || "",
                email: newContact.email || "",
                tier: newContact.tier || "3_Service",
                notificationStatus: "Pending",
                notes: newContact.notes || "",
            } as Contact,
        ];
        save();
        showAddModal = false;
        newContact = {
            role: "Family",
            tier: "2_SameDay",
            notificationStatus: "Pending",
        };
    }

    function updateStatus(id: string, status: string) {
        contacts = contacts.map((c) =>
            c.id === id ? { ...c, notificationStatus: status as any } : c,
        );
        save();
    }

    function deleteContact(id: string) {
        if (!confirm("Remove this contact?")) return;
        contacts = contacts.filter((c) => c.id !== id);
        save();
    }
</script>

<div class="max-w-6xl mx-auto p-6 md:p-8 animate-in fade-in duration-500">
    <!-- Header -->
    <div
        class="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8"
    >
        <div class="flex items-center gap-4">
            <div class="p-3 bg-rose-100 text-rose-600 rounded-xl shadow-sm">
                <Phone size={32} />
            </div>
            <div>
                <h1 class="font-serif font-bold text-3xl text-slate-900">
                    Connections & Notifications
                </h1>
                <p class="text-slate-500">
                    Manage your network and define the "Call List" strategy.
                </p>
            </div>
        </div>

        <button
            on:click={() => (showAddModal = true)}
            class="px-5 py-2.5 bg-slate-900 text-white font-bold rounded-xl shadow-lg hover:bg-slate-800 transition-all flex items-center gap-2"
        >
            <Plus size={18} /> Add Contact
        </button>
    </div>

    <!-- Stats -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
        <div
            class="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between"
        >
            <div>
                <div class="text-xs font-bold uppercase text-slate-400">
                    Total Network
                </div>
                <div class="text-2xl font-bold text-slate-800">
                    {contacts.length}
                </div>
            </div>
            <Users class="text-slate-200" size={32} />
        </div>
        <div
            class="bg-rose-50 p-5 rounded-2xl border border-rose-100 shadow-sm flex items-center justify-between"
        >
            <div>
                <div class="text-xs font-bold uppercase text-rose-400">
                    Pending Immediate
                </div>
                <div class="text-2xl font-bold text-rose-700">
                    {tier1.filter((c) =>
                        ["Pending", "Called", "LeftMsg"].includes(
                            c.notificationStatus,
                        ),
                    ).length}
                </div>
            </div>
            <CircleAlert class="text-rose-300" size={32} />
        </div>
        <div
            class="bg-green-50 p-5 rounded-2xl border border-green-100 shadow-sm flex items-center justify-between"
        >
            <div>
                <div class="text-xs font-bold uppercase text-green-600">
                    Notifications Confirmed
                </div>
                <div class="text-2xl font-bold text-green-700">
                    {contacts.filter((c) => c.notificationStatus === "Notified")
                        .length}
                </div>
            </div>
            <CircleCheck class="text-green-300" size={32} />
        </div>
    </div>

    <!-- Tabs -->
    <div class="flex gap-2 mb-8 border-b border-slate-200 pb-1">
        <button
            on:click={() => (activeTab = "call-list")}
            class="px-5 py-2.5 font-bold text-sm rounded-t-xl transition-all border-b-2
            {activeTab === 'call-list'
                ? 'border-rose-500 text-rose-600 bg-rose-50'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'}"
        >
            The Call List
        </button>
        <button
            on:click={() => (activeTab = "directory")}
            class="px-5 py-2.5 font-bold text-sm rounded-t-xl transition-all border-b-2
            {activeTab === 'directory'
                ? 'border-indigo-500 text-indigo-600 bg-indigo-50'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'}"
        >
            Full Directory
        </button>
    </div>

    <!-- Content -->
    <div class="min-h-[500px]">
        {#if contacts.length === 0}
            <div class="max-w-3xl mx-auto space-y-4">
                {#each getSmartSamples($language).contacts || [] as sample}
                    <GhostRow
                        name={sample.name}
                        subtitle={`${sample.role} • ${sample.relation}`}
                        type="Contact"
                        onClick={() => {
                            newContact = {
                                ...newContact,
                                name: sample.name,
                                role: sample.role as ContactRole,
                                relation: sample.relation,
                                phone: sample.phone,
                                email: sample.email,
                                tier: "2_SameDay",
                            };
                            showAddModal = true;
                        }}
                    >
                        <svelte:fragment slot="icon">
                            <User size={20} class="text-slate-400" />
                        </svelte:fragment>
                    </GhostRow>
                {/each}

                <div class="flex justify-center mt-4">
                    <button
                        on:click={() => (showAddModal = true)}
                        class="text-sm font-bold text-[#4A7C74] hover:bg-[#4A7C74]/5 px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
                    >
                        <Plus size={14} /> Create First Contact
                    </button>
                </div>
            </div>
        {:else if activeTab === "call-list"}
            <div in:fade class="space-y-8 max-w-4xl mx-auto">
                <div
                    class="bg-indigo-50 p-4 rounded-xl text-indigo-800 text-sm flex gap-3 border border-indigo-100"
                >
                    <Shield class="shrink-0" size={20} />
                    <p>
                        <strong>Caller Strategy:</strong> This specific order is
                        designed to prevent bad news from spreading via social media
                        before key people are informed directly.
                    </p>
                </div>

                <!-- TIER 1 -->
                <div class="space-y-4">
                    <div
                        class="flex items-center gap-2 text-rose-600 border-b border-rose-100 pb-2"
                    >
                        <CircleAlert size={20} />
                        <h2 class="font-bold text-lg">
                            Tier 1: Immediate Notification
                        </h2>
                        <span
                            class="text-xs bg-rose-100 text-rose-700 px-2 py-0.5 rounded-full"
                            >Call Now</span
                        >
                    </div>
                    {#if tier1.length === 0}
                        <div
                            class="text-center py-6 text-slate-400 italic bg-slate-50 rounded-xl border border-dashed border-slate-200"
                        >
                            No immediate contacts set.
                        </div>
                    {/if}
                    {#each tier1 as contact}
                        <ContactRow {contact} {updateStatus} />
                    {/each}
                </div>

                <!-- TIER 2 -->
                <div class="space-y-4 pt-4">
                    <div
                        class="flex items-center gap-2 text-orange-600 border-b border-orange-100 pb-2"
                    >
                        <Clock size={20} />
                        <h2 class="font-bold text-lg">
                            Tier 2: Same Day (Inner Circle)
                        </h2>
                    </div>
                    {#if tier2.length === 0}
                        <div
                            class="text-center py-6 text-slate-400 italic bg-slate-50 rounded-xl border border-dashed border-slate-200"
                        >
                            No Tier 2 contacts found.
                        </div>
                    {/if}
                    {#each tier2 as contact}
                        <ContactRow {contact} {updateStatus} />
                    {/each}
                </div>
                <!-- TIER 3 -->
                <div class="space-y-4 pt-4">
                    <div
                        class="flex items-center gap-2 text-slate-600 border-b border-slate-100 pb-2"
                    >
                        <Mail size={20} />
                        <h2 class="font-bold text-lg">
                            Tier 3: Service Notice
                        </h2>
                    </div>
                    {#if tier3.length === 0}
                        <div
                            class="text-center py-6 text-slate-400 italic bg-slate-50 rounded-xl border border-dashed border-slate-200"
                        >
                            No Tier 3 contacts found.
                        </div>
                    {/if}
                    {#each tier3 as contact}
                        <ContactRow {contact} {updateStatus} />
                    {/each}
                </div>
            </div>
        {:else}
            <!-- Directory Grid -->
            <div
                in:fade
                class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
                {#each contacts as contact}
                    <div
                        class="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:border-indigo-300 transition-all group relative"
                    >
                        <button
                            on:click={() => deleteContact(contact.id)}
                            class="absolute top-4 right-4 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                            <Trash2 size={16} />
                        </button>

                        <div class="flex items-center gap-3 mb-4">
                            <div
                                class="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center text-slate-500"
                            >
                                <User size={24} />
                            </div>
                            <div>
                                <h3 class="font-bold text-slate-800 text-lg">
                                    {contact.name}
                                </h3>
                                <div
                                    class="text-xs text-slate-500 font-bold uppercase flex items-center gap-1"
                                >
                                    {contact.role}
                                    {#if contact.relation}• {contact.relation}{/if}
                                </div>
                            </div>
                        </div>

                        <div class="space-y-2 text-sm text-slate-600">
                            {#if contact.phone}
                                <div
                                    class="flex items-center gap-2 bg-slate-50 p-2 rounded-lg"
                                >
                                    <Phone size={14} class="text-slate-400" />
                                    {contact.phone}
                                </div>
                            {/if}
                            {#if contact.email}
                                <div
                                    class="flex items-center gap-2 bg-slate-50 p-2 rounded-lg"
                                >
                                    <Mail size={14} class="text-slate-400" />
                                    {contact.email}
                                </div>
                            {/if}
                        </div>

                        <div
                            class="mt-4 pt-4 border-t border-slate-100 flex justify-between items-center"
                        >
                            <span
                                class="text-xs font-bold px-2 py-1 rounded bg-slate-100 text-slate-500"
                                >{contact.tier.split("_")[1]}</span
                            >
                        </div>
                    </div>
                {/each}
            </div>
        {/if}
    </div>

    <!-- Add Modal -->
    {#if showAddModal}
        <div
            class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            transition:fade
        >
            <div
                class="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden max-h-[90vh] overflow-y-auto"
            >
                <div
                    class="p-6 border-b border-gray-100 bg-gray-50 flex justify-between items-center"
                >
                    <h3 class="font-serif font-bold text-2xl text-slate-800">
                        New Contact
                    </h3>
                    <button
                        on:click={() => (showAddModal = false)}
                        class="text-gray-400 hover:text-gray-600">Close</button
                    >
                </div>
                <div class="p-6 space-y-4">
                    <input
                        bind:value={newContact.name}
                        class="w-full px-4 py-3 rounded-xl border border-gray-200"
                        placeholder="Full Name"
                    />

                    <div class="grid grid-cols-2 gap-4">
                        <input
                            bind:value={newContact.relation}
                            class="w-full px-4 py-3 rounded-xl border border-gray-200"
                            placeholder="Relation (e.g. Spouse)"
                        />
                        <select
                            bind:value={newContact.role}
                            class="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white"
                        >
                            <option>Family</option>
                            <option>Friend</option>
                            <option>Medical</option>
                            <option>Legal</option>
                            <option>Other</option>
                        </select>
                    </div>

                    <div class="grid grid-cols-2 gap-4">
                        <input
                            bind:value={newContact.phone}
                            class="w-full px-4 py-3 rounded-xl border border-gray-200"
                            placeholder="Phone"
                        />
                        <input
                            bind:value={newContact.email}
                            class="w-full px-4 py-3 rounded-xl border border-gray-200"
                            placeholder="Email"
                        />
                    </div>

                    <div
                        class="bg-indigo-50 p-4 rounded-xl border border-indigo-100"
                    >
                        <label
                            for="contact-tier"
                            class="block text-xs font-bold uppercase text-indigo-700 mb-2"
                            >Notification Priority</label
                        >
                        <select
                            id="contact-tier"
                            bind:value={newContact.tier}
                            class="w-full px-4 py-3 rounded-xl border border-indigo-200 bg-white"
                        >
                            <option value="1_Immediate"
                                >Tier 1: Immediate (Critical)</option
                            >
                            <option value="2_SameDay"
                                >Tier 2: Same Day (Inner Circle)</option
                            >
                            <option value="3_Service"
                                >Tier 3: Service Notice (Extended)</option
                            >
                            <option value="4_DNR">No Notification Needed</option
                            >
                        </select>
                        <p class="text-xs text-indigo-500 mt-2">
                            Determines the order for the Executor call list.
                        </p>
                    </div>

                    <div class="space-y-1">
                        <SmartTextarea
                            bind:value={newContact.notes}
                            context="contact"
                            placeholder="Private notes for the caller (e.g. 'Be gentle, they are fragile')"
                            label="Caller Notes"
                            minHeight="100px"
                        />
                    </div>

                    <button
                        on:click={addContact}
                        class="w-full py-4 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800"
                        >Save Contact</button
                    >
                </div>
            </div>
        </div>
    {/if}
</div>
