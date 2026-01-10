<script lang="ts">
    import {
        PlayCircle,
        FileText,
        ChevronDown,
        ChevronUp,
        X,
    } from "lucide-svelte";
    import { slide, fade } from "svelte/transition";

    type Video = {
        id: number;
        title: string;
        duration: string;
        description: string;
        script: string[];
    };

    type Series = {
        title: string;
        videos: Video[];
    };

    const videoSeries: Series[] = [
        {
            title: "Introduction Video Series",
            videos: [
                {
                    id: 1,
                    title: "Estate Planning System Overview",
                    duration: "5 min",
                    description:
                        "Understand how this system protects your family's future.",
                    script: [
                        "0:00-1:00: Introduction and overview of three-hub architecture",
                        "1:00-2:30: Preparation Hub walkthrough and key features",
                        "2:30-3:30: Executor Hub overview and professional coordination",
                        "3:30-4:30: Family Hub introduction and accessibility features",
                        "4:30-5:00: Next steps and getting started guidance",
                    ],
                },
                {
                    id: 2,
                    title: "Family Access and Roles",
                    duration: "4 min",
                    description:
                        "How everyone can contribute and stay informed.",
                    script: [
                        "0:00-1:00: Overview of family roles and access levels",
                        "1:00-2:00: How to access and navigate the Family Hub",
                        "2:00-3:00: Understanding progress updates and how to help",
                        "3:00-4:00: Communication tools and asking questions",
                    ],
                },
                {
                    id: 3,
                    title: "Understanding Your Estate Plan",
                    duration: "8 min",
                    description:
                        "Fundamentals of protecting the people you love.",
                    script: [
                        "0:00-2:00: What is estate planning and why it matters",
                        "2:00-4:00: Key documents explained (will, trust, power of attorney)",
                        "4:00-6:00: Professional team roles and how they help",
                        "6:00-8:00: Timeline expectations and next steps",
                    ],
                },
            ],
        },
        {
            title: "Technical How-To Series",
            videos: [
                {
                    id: 4,
                    title: "Using the Progress Dashboard",
                    duration: "3 min",
                    description:
                        "Technical walkthrough of progress tracking features.",
                    script: [
                        "0:00-0:30: Accessing the progress dashboard",
                        "0:30-1:30: Understanding progress bars and completion percentages",
                        "1:30-2:30: Using analytics and trend information",
                        "2:30-3:00: Customizing your progress view",
                    ],
                },
                {
                    id: 5,
                    title: "Mobile Access and Notifications",
                    duration: "4 min",
                    description:
                        "Guide to mobile features and notification management.",
                    script: [
                        "0:00-1:00: Accessing the system on mobile devices",
                        "1:00-2:30: Setting up and customizing notifications",
                        "2:30-3:30: Using mobile features for quick updates",
                        "3:30-4:00: Best practices for mobile estate planning management",
                    ],
                },
            ],
        },
    ];

    let activeVideo: Video | null = null;
</script>

<div class="space-y-8">
    {#each videoSeries as series}
        <div class="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
            <h3
                class="font-bold text-xl text-[#304743] mb-6 flex items-center gap-2"
            >
                <PlayCircle class="text-[#4A7C74]" />
                {series.title}
            </h3>

            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {#each series.videos as video}
                    <button
                        class="text-left bg-slate-50 hover:bg-[#4A7C74]/5 border border-transparent hover:border-[#4A7C74]/20 rounded-xl p-4 transition-all group relative overflow-hidden"
                        on:click={() => (activeVideo = video)}
                    >
                        <div
                            class="absolute top-3 right-3 bg-white/80 backdrop-blur px-2 py-0.5 rounded text-xs font-bold text-slate-500 group-hover:text-[#4A7C74]"
                        >
                            {video.duration}
                        </div>

                        <div
                            class="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm text-slate-400 group-hover:text-[#4A7C74] group-hover:scale-110 transition-all mb-3"
                        >
                            <PlayCircle size={20} />
                        </div>

                        <h4
                            class="font-bold text-slate-700 group-hover:text-[#304743] mb-1"
                        >
                            {video.title}
                        </h4>
                        <p class="text-xs text-slate-500 line-clamp-2">
                            {video.description}
                        </p>
                    </button>
                {/each}
            </div>
        </div>
    {/each}

    <!-- Video Script Modal -->
    {#if activeVideo}
        <div
            class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
            transition:fade
        >
            <div
                class="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]"
                in:slide={{ duration: 200, axis: "y" }}
            >
                <!-- Video Player Placeholder -->
                <div
                    class="aspect-video bg-black flex items-center justify-center relative group cursor-pointer"
                >
                    <div class="text-center text-white/50">
                        <PlayCircle
                            size={64}
                            class="mx-auto mb-2 opacity-50 group-hover:opacity-100 transition-opacity"
                        />
                        <p class="text-sm font-medium">Click to Play Demo</p>
                    </div>
                    <div class="absolute inset-x-0 bottom-0 h-1 bg-gray-800">
                        <div class="w-1/3 h-full bg-[#4A7C74]"></div>
                    </div>
                </div>

                <div class="p-6 flex-1 overflow-y-auto">
                    <div class="flex justify-between items-start mb-6">
                        <div>
                            <h3
                                class="font-serif font-bold text-2xl text-[#304743]"
                            >
                                {activeVideo.title}
                            </h3>
                            <p class="text-slate-500">
                                {activeVideo.description}
                            </p>
                        </div>
                        <button
                            on:click={() => (activeVideo = null)}
                            class="p-2 hover:bg-gray-100 rounded-full transition-colors"
                        >
                            <X size={20} class="text-gray-400" />
                        </button>
                    </div>

                    <div
                        class="bg-slate-50 rounded-xl p-6 border border-slate-100"
                    >
                        <h4
                            class="font-bold text-sm text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2"
                        >
                            <FileText size={14} /> Video Transcript / Outline
                        </h4>
                        <div class="space-y-3">
                            {#each activeVideo.script as line}
                                <div class="flex gap-3 text-sm text-slate-600">
                                    <div
                                        class="w-1.5 h-1.5 rounded-full bg-[#4A7C74] mt-2 shrink-0"
                                    ></div>
                                    <p>{line}</p>
                                </div>
                            {/each}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    {/if}
</div>
