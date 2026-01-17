<script lang="ts">
  import { page } from "$app/stores";
  import { onMount } from "svelte";
  import { fade } from "svelte/transition";

  let token = $page.params.token;
  let loading = true;
  let error = null;
  let data = null;

  onMount(async () => {
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_BASE || "http://localhost:8000"}/api/pulse/portal/${token}`,
      );
      if (res.ok) {
        data = await res.json();
      } else {
        error = "Access Link Invalid or Expired";
      }
    } catch (e) {
      error = "Connection Failed";
    } finally {
      loading = false;
    }
  });
</script>

<div
  class="min-h-screen bg-slate-900 text-slate-200 flex flex-col items-center justify-center p-4"
>
  {#if loading}
    <div class="animate-pulse text-teal-500">
      Connecting to Secure Portal...
    </div>
  {:else if error}
    <div
      class="bg-red-900/20 p-8 rounded-2xl border border-red-800 text-center max-w-md"
    >
      <h1 class="text-2xl font-serif text-red-400 mb-2">Access Denied</h1>
      <p class="text-slate-400">{error}</p>
    </div>
  {:else}
    <div
      class="max-w-md w-full bg-slate-800 rounded-3xl overflow-hidden shadow-2xl border border-slate-700"
      in:fade
    >
      <!-- Header -->
      <div class="bg-slate-900 p-6 text-center border-b border-slate-700">
        <h1 class="text-xl font-medium text-white">
          {data.user_name} is Active
        </h1>
        <p class="text-sm text-slate-400 mt-1">
          Status: <span class="text-emerald-400 font-bold uppercase"
            >{data.status}</span
          >
        </p>
      </div>

      <!-- Main Status -->
      <div class="p-8 flex flex-col items-center text-center space-y-6">
        <div
          class="w-32 h-32 rounded-full bg-emerald-500/10 flex items-center justify-center relative"
        >
          <div
            class="absolute inset-0 rounded-full border border-emerald-500/30 animate-ping opacity-20"
          ></div>
          <!-- Heartbeat Icon -->
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="w-12 h-12 text-emerald-400"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2" /></svg
          >
        </div>

        <div>
          <p class="text-slate-400 text-sm mb-1">LAST CONFIRMED CHECK-IN</p>
          <p class="text-2xl font-mono text-white">
            {data.last_checkin
              ? new Date(data.last_checkin).toLocaleString()
              : "Never"}
          </p>
        </div>

        <div class="w-full bg-slate-700/50 p-4 rounded-xl text-left">
          <p
            class="text-xs text-slate-400 uppercase tracking-widest mb-2 font-bold"
          >
            Guardian Access (Tier {data.contact_tier})
          </p>
          <ul class="space-y-2 text-sm text-slate-300">
            <li class="flex items-center gap-2">
              <span class="text-emerald-400">✓</span> View Status
            </li>
            <li class="flex items-center gap-2">
              <span class="text-emerald-400">✓</span> Send "Thinking of You" Nudge
            </li>
            <li class="flex items-center gap-2 opacity-50">
              <span class="text-slate-600">🔒</span> Emergency Contacts (Locked)
            </li>
            <li class="flex items-center gap-2 opacity-50">
              <span class="text-slate-600">🔒</span> Medical Directives (Locked)
            </li>
          </ul>
        </div>
      </div>

      <!-- Actions -->
      <div class="p-4 bg-slate-900/50 flex gap-4">
        <button
          class="flex-1 bg-slate-800 hover:bg-slate-700 text-white py-3 rounded-xl font-medium transition-colors border border-slate-700"
        >
          Send Nudge
        </button>
        <button
          class="flex-1 bg-teal-600 hover:bg-teal-500 text-white py-3 rounded-xl font-medium transition-colors"
        >
          I've Spoken to Them
        </button>
      </div>
    </div>
  {/if}
</div>
