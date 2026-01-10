<script lang="ts">
    import {
        ArrowRight,
        Check,
        Settings,
        Shield,
        Users,
        Save,
    } from "lucide-svelte";

    let currentStep = 1;
    let completedSteps = [0]; // Step 0 is 'Start'

    const steps = [
        {
            id: 1,
            title: "Complexity",
            icon: Settings,
            desc: "Tailor the estate plan to your needs",
        },
        {
            id: 2,
            title: "Key People",
            icon: Users,
            desc: "Add executor and family members",
        },
        {
            id: 3,
            title: "Core Assets",
            icon: Shield,
            desc: "Secure your financial foundation",
        },
        { id: 4, title: "Complete", icon: Check, desc: "You're ready to go!" },
    ];

    function nextStep() {
        if (currentStep < 4) {
            completedSteps = [...completedSteps, currentStep];
            currentStep++;
        }
    }
</script>

<div class="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
    <!-- Progress Bar -->
    <div class="flex justify-between items-center mb-12 relative">
        <div class="absolute top-1/2 left-0 w-full h-1 bg-gray-100 -z-0"></div>
        <div
            class="absolute top-1/2 left-0 h-1 bg-[#4A7C74] -z-0 transition-all duration-500"
            style="width: {((currentStep - 1) / 3) * 100}%"
        ></div>

        {#each steps as step}
            <div class="relative z-10 flex flex-col items-center">
                <div
                    class="w-10 h-10 rounded-full flex items-center justify-center border-4 transition-all duration-300
                    {currentStep >= step.id
                        ? 'bg-[#4A7C74] border-[#4A7C74] text-white'
                        : 'bg-white border-gray-200 text-gray-300'}"
                >
                    <svelte:component this={step.icon} size={18} />
                </div>
                <span
                    class="mt-2 text-xs font-bold uppercase tracking-wide {currentStep >=
                    step.id
                        ? 'text-[#304743]'
                        : 'text-gray-300'}"
                >
                    {step.title}
                </span>
            </div>
        {/each}
    </div>

    <!-- Content Area -->
    <div class="min-h-[300px] max-w-2xl mx-auto text-center">
        {#if currentStep === 1}
            <h2 class="text-3xl font-serif text-[#304743] mb-4">
                How complex is your estate?
            </h2>
            <p class="text-gray-500 mb-8">
                This helps us hide tools you don't need.
            </p>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button
                    class="p-6 rounded-xl border-2 border-gray-100 hover:border-[#4A7C74] hover:bg-[#4A7C74]/5 transition-all text-left group"
                >
                    <div
                        class="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform"
                    >
                        <span class="text-xl font-bold">1</span>
                    </div>
                    <h3 class="font-bold text-gray-800 mb-2">Simple</h3>
                    <p class="text-xs text-gray-500">
                        Single home, simple accounts, no complex trusts.
                    </p>
                </button>
                <button
                    class="p-6 rounded-xl border-2 border-[#4A7C74] bg-[#4A7C74]/5 text-left relative overflow-hidden"
                >
                    <div
                        class="absolute top-3 right-3 text-xs font-bold text-[#4A7C74] bg-white px-2 py-1 rounded-full shadow-sm"
                    >
                        Rec
                    </div>
                    <div
                        class="w-12 h-12 rounded-full bg-[#4A7C74] text-white flex items-center justify-center mb-4"
                    >
                        <span class="text-xl font-bold">2</span>
                    </div>
                    <h3 class="font-bold text-[#304743] mb-2">Standard</h3>
                    <p class="text-xs text-gray-600">
                        Home + investments, life insurance, retirement accounts.
                    </p>
                </button>
                <button
                    class="p-6 rounded-xl border-2 border-gray-100 hover:border-[#4A7C74] hover:bg-[#4A7C74]/5 transition-all text-left group"
                >
                    <div
                        class="w-12 h-12 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform"
                    >
                        <span class="text-xl font-bold">3</span>
                    </div>
                    <h3 class="font-bold text-gray-800 mb-2">Complex</h3>
                    <p class="text-xs text-gray-500">
                        Business interests, multiple properties, advanced tax
                        planning.
                    </p>
                </button>
            </div>
        {:else if currentStep === 2}
            <h2 class="text-3xl font-serif text-[#304743] mb-4">
                Who is your Executor?
            </h2>
            <p class="text-gray-500 mb-8">
                We'll set up a special dashboard just for them.
            </p>
            <div class="flex flex-col gap-4 max-w-md mx-auto text-left">
                <label class="block">
                    <span class="text-sm font-bold text-gray-700"
                        >Full Name</span
                    >
                    <input
                        type="text"
                        placeholder="e.g. Jane Doe"
                        class="mt-1 w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-[#4A7C74]/20 focus:outline-none"
                    />
                </label>
                <label class="block">
                    <span class="text-sm font-bold text-gray-700"
                        >Email (for notifications)</span
                    >
                    <input
                        type="email"
                        placeholder="jane@example.com"
                        class="mt-1 w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-[#4A7C74]/20 focus:outline-none"
                    />
                </label>
                <label class="block">
                    <span class="text-sm font-bold text-gray-700"
                        >Relationship</span
                    >
                    <select
                        class="mt-1 w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-[#4A7C74]/20 focus:outline-none bg-white"
                    >
                        <option>Spouse / Partner</option>
                        <option>Child</option>
                        <option>Sibling</option>
                        <option>Professional / Attorney</option>
                        <option>Friend</option>
                    </select>
                </label>
            </div>
        {:else if currentStep === 3}
            <h2 class="text-3xl font-serif text-[#304743] mb-4">
                Where are your documents?
            </h2>
            <p class="text-gray-500 mb-8">
                Just a quick check - do you know where these valid docs are?
            </p>
            <div class="space-y-3 max-w-md mx-auto text-left">
                {#each ["Last Will & Testament", "Power of Attorney", "Advance Healthcare Directive", "Life Insurance Policies"] as doc}
                    <label
                        class="flex items-center gap-4 p-4 rounded-xl border border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors"
                    >
                        <input
                            type="checkbox"
                            class="w-5 h-5 rounded border-gray-300 text-[#4A7C74] focus:ring-[#4A7C74]"
                        />
                        <span class="text-gray-700 font-medium">{doc}</span>
                    </label>
                {/each}
            </div>
        {:else}
            <div class="py-12">
                <div
                    class="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6"
                >
                    <Check size={40} />
                </div>
                <h2 class="text-3xl font-serif text-[#304743] mb-4">
                    You're All Set!
                </h2>
                <p class="text-gray-500 text-lg mb-8 max-w-md mx-auto">
                    We've configured your dashboard for a <strong
                        >Standard Estate</strong
                    >. Your Executor dashboard is ready to share.
                </p>
                <button
                    class="px-8 py-3 bg-[#304743] text-white rounded-xl font-bold hover:bg-[#2A3F3B] transition-colors shadow-lg shadow-[#304743]/20"
                >
                    Go to Dashboard
                </button>
            </div>
        {/if}
    </div>

    <!-- Actions -->
    {#if currentStep < 4}
        <div class="border-t border-gray-100 mt-12 pt-6 flex justify-end">
            <button
                on:click={nextStep}
                class="flex items-center gap-2 px-6 py-3 bg-[#4A7C74] text-white rounded-xl font-bold hover:bg-[#3A635D] transition-all shadow-lg shadow-[#4A7C74]/20 hover:shadow-xl hover:translate-y-[-1px]"
            >
                Next Step
                <ArrowRight size={18} />
            </button>
        </div>
    {/if}
</div>
