<script lang="ts">
    import { onMount, onDestroy, createEventDispatcher } from "svelte";
    import {
        Video,
        Square,
        Play,
        Save,
        RefreshCw,
        CircleAlert,
        Loader2,
    } from "lucide-svelte";
    import { fade, slide } from "svelte/transition";

    const dispatch = createEventDispatcher();

    let stream: MediaStream | null = null;
    let mediaRecorder: MediaRecorder | null = null;
    let chunks: Blob[] = [];
    let videoPreview: HTMLVideoElement;

    let isRecording = false;
    let isPaused = false;
    let recordedBlob: Blob | null = null;
    let recordedUrl: string | null = null;
    let duration = 0;
    let timerInterval: any;
    let error: string | null = null;
    let isSaving = false;

    async function startCamera() {
        try {
            stream = await navigator.mediaDevices.getUserMedia({
                video: true,
                audio: true,
            });
            if (videoPreview) {
                videoPreview.srcObject = stream;
                videoPreview.muted = true; // Avoid feedback loop
            }
            error = null;
        } catch (err) {
            console.error("Camera access denied:", err);
            error = "Camera access denied. Please verify permissions.";
        }
    }

    function startRecording() {
        if (!stream) return;
        chunks = [];
        mediaRecorder = new MediaRecorder(stream);

        mediaRecorder.ondataavailable = (e) => {
            if (e.data.size > 0) chunks.push(e.data);
        };

        mediaRecorder.onstop = () => {
            recordedBlob = new Blob(chunks, { type: "video/webm" });
            recordedUrl = URL.createObjectURL(recordedBlob);
            if (videoPreview) {
                videoPreview.srcObject = null;
                videoPreview.src = recordedUrl;
                videoPreview.muted = false;
                videoPreview.controls = true;
            }
        };

        mediaRecorder.start();
        isRecording = true;
        duration = 0;
        startTimer();
    }

    function stopRecording() {
        if (mediaRecorder && isRecording) {
            mediaRecorder.stop();
            isRecording = false;
            stopTimer();
            // Stop stream tracks to turn off camera light
            stream?.getTracks().forEach((track) => track.stop());
        }
    }

    function startTimer() {
        clearInterval(timerInterval);
        timerInterval = setInterval(() => {
            duration++;
        }, 1000);
    }

    function stopTimer() {
        clearInterval(timerInterval);
    }

    function formatTime(seconds: number) {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, "0")}`;
    }

    function reset() {
        if (recordedUrl) URL.revokeObjectURL(recordedUrl);
        recordedBlob = null;
        recordedUrl = null;
        chunks = [];
        duration = 0;
        isRecording = false;
        error = null;
        startCamera(); // Restart camera
    }

    function handleSave() {
        if (!recordedBlob) return;
        isSaving = true;
        dispatch("save", { blob: recordedBlob, duration });
    }

    onMount(() => {
        startCamera();
    });

    onDestroy(() => {
        stopTimer();
        stream?.getTracks().forEach((track) => track.stop());
        if (recordedUrl) URL.revokeObjectURL(recordedUrl);
    });
</script>

<div
    class="relative bg-slate-900 rounded-2xl overflow-hidden aspect-video shadow-2xl group border border-slate-800"
>
    <!-- Main Video Area -->
    <!-- svelte-ignore a11y-media-has-caption -->
    <video
        bind:this={videoPreview}
        autoplay
        playsinline
        class="w-full h-full object-cover {recordedBlob
            ? ''
            : 'transform scale-x-[-1]'}"
    ></video>

    <!-- Overlays -->
    {#if error}
        <div
            class="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/90 text-white p-6 text-center"
            in:fade
        >
            <CircleAlert size={48} class="text-rose-500 mb-4" />
            <h3 class="font-bold text-xl mb-2">Camera Error</h3>
            <p class="text-slate-400">{error}</p>
            <button
                on:click={startCamera}
                class="mt-6 px-6 py-2 bg-indigo-600 rounded-full font-bold hover:bg-indigo-700 transition"
                >Try Again</button
            >
        </div>
    {/if}

    {#if !recordedBlob && !error}
        <!-- Recording UI -->
        <div
            class="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent flex items-center justify-between"
        >
            <div class="flex items-center gap-3">
                <div
                    class="w-2 h-2 rounded-full {isRecording
                        ? 'bg-rose-500 animate-pulse'
                        : 'bg-emerald-500'}"
                ></div>
                <span class="text-white font-mono font-bold tracking-widest"
                    >{formatTime(duration)}</span
                >
            </div>

            {#if !isRecording}
                <button
                    on:click={startRecording}
                    class="w-16 h-16 rounded-full border-[6px] border-white/30 flex items-center justify-center hover:scale-105 transition-all group/rec"
                >
                    <div
                        class="w-12 h-12 bg-rose-500 rounded-full group-hover/rec:scale-90 transition-all"
                    ></div>
                </button>
            {:else}
                <button
                    on:click={stopRecording}
                    class="w-16 h-16 rounded-full border-[6px] border-white/30 flex items-center justify-center hover:scale-105 transition-all group/stop"
                >
                    <div class="w-6 h-6 bg-white rounded-md"></div>
                </button>
            {/if}

            <div class="w-10"></div>
            <!-- Spacer for balance -->
        </div>
    {/if}

    {#if recordedBlob}
        <!-- Review UI -->
        <div
            class="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
        >
            <div class="flex gap-4">
                <button
                    on:click={() => videoPreview.play()}
                    class="p-4 bg-white/20 backdrop-blur rounded-full text-white hover:bg-white/40 transition"
                >
                    <Play size={32} fill="currentColor" />
                </button>
            </div>
        </div>

        <div
            class="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/90 to-transparent flex items-center justify-between gap-4"
            in:slide={{ axis: "y" }}
        >
            <button
                on:click={reset}
                class="px-4 py-2 rounded-xl text-white font-bold hover:bg-white/10 transition flex items-center gap-2"
                disabled={isSaving}
            >
                <RefreshCw size={18} />
                Retake
            </button>

            <button
                on:click={handleSave}
                class="px-8 py-3 bg-emerald-500 text-white rounded-xl font-bold shadow-lg shadow-emerald-500/30 hover:bg-emerald-600 transition flex items-center gap-2"
                disabled={isSaving}
            >
                {#if isSaving}
                    <Loader2 size={18} class="animate-spin" />
                    Saving...
                {:else}
                    <Save size={18} />
                    Save Memory
                {/if}
            </button>
        </div>
    {/if}
</div>
