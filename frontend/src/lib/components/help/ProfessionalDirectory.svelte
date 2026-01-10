<script lang="ts">
    import {
        Search,
        MapPin,
        Phone,
        Mail,
        Award,
        CircleCheck,
    } from "lucide-svelte";
    import { mockProfessionals } from "$lib/data/professionals";

    let searchTerm = "";
    let selectedRole = "All";

    $: filteredPros = mockProfessionals.filter((p) => {
        const matchesSearch =
            p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.company.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesRole = selectedRole === "All" || p.role === selectedRole;
        return matchesSearch && matchesRole;
    });

    const roles = ["All", ...new Set(mockProfessionals.map((p) => p.role))];
</script>

<div class="space-y-6">
    <!-- Filters -->
    <div class="flex flex-col md:flex-row gap-4">
        <div class="relative flex-1">
            <Search
                class="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                size={18}
            />
            <input
                type="text"
                bind:value={searchTerm}
                placeholder="Search professionals..."
                class="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4A7C74]/20"
            />
        </div>
        <div class="flex gap-2 overflow-x-auto pb-2 md:pb-0">
            {#each roles as role}
                <button
                    class="px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors {selectedRole ===
                    role
                        ? 'bg-[#304743] text-white'
                        : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}"
                    on:click={() => (selectedRole = role)}
                >
                    {role}
                </button>
            {/each}
        </div>
    </div>

    <!-- Grid -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {#each filteredPros as pro}
            <div
                class="bg-white p-6 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all"
            >
                <div class="flex justify-between items-start mb-4">
                    <div>
                        <h3
                            class="font-serif text-lg text-[#304743] flex items-center gap-2"
                        >
                            {pro.name}
                            {#if pro.verified}
                                <CircleCheck
                                    size={14}
                                    class="text-blue-500"
                                    fill="currentColor"
                                    color="white"
                                />
                            {/if}
                        </h3>
                        <p class="text-sm text-gray-500 font-medium">
                            {pro.company}
                        </p>
                    </div>
                    <span
                        class="px-2 py-1 bg-gray-100 text-gray-500 text-xs rounded-md font-medium uppercase tracking-wide"
                    >
                        {pro.role}
                    </span>
                </div>

                <div class="space-y-3 mb-6">
                    <div class="flex items-center gap-3 text-sm text-gray-600">
                        <Award size={16} class="text-[#D4AF37]" />
                        <span>{pro.specialty}</span>
                    </div>
                    <div class="flex items-center gap-3 text-sm text-gray-600">
                        <Phone size={16} class="text-gray-400" />
                        <span>{pro.phone}</span>
                    </div>
                    <div class="flex items-center gap-3 text-sm text-gray-600">
                        <Mail size={16} class="text-gray-400" />
                        <a
                            href="mailto:{pro.email}"
                            class="hover:text-[#4A7C74] hover:underline"
                            >{pro.email}</a
                        >
                    </div>
                </div>

                <button
                    class="w-full py-2 border border-[#4A7C74] text-[#4A7C74] rounded-lg text-sm font-medium hover:bg-[#4A7C74] hover:text-white transition-colors"
                >
                    View Profile
                </button>
            </div>
        {/each}
    </div>
</div>
