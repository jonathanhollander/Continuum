<script lang="ts">
  import { page } from "$app/stores";
  import { onMount } from "svelte";
  import { fade } from "svelte/transition";
  import { API_BASE_URL } from "$lib/config";

  let token = $page.params.token;
  let loading = $state(true);
  let error: string | null = $state(null);
  let data: any = $state(null);
  // The owner's Pulse vault notes: the API opens them once escalation reaches this guardian
  // and the owner's Automatic Release is on (one portal: /pulse/portal forwards here)
  let vaultItems: { name: string; content: string }[] = $state([]);

  let actionLoading = $state(false);
  let actionMessage = $state("");

  // The API sends UTC with "Z"; a time without a zone is still read as UTC, never local
  function parseUtc(ts: string): Date {
    return new Date(/[zZ]|[+-]\d\d:?\d\d$/.test(ts) ? ts : ts + "Z");
  }

  onMount(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/pulse/portal/${token}`);
      if (res.ok) {
        data = await res.json();
        if (data.show_sensitive) {
          const vRes = await fetch(`${API_BASE_URL}/api/pulse/portal/${token}/vault`);
          if (vRes.ok) vaultItems = await vRes.json();
        }
      } else {
        error =
          "This link may have expired or been replaced. The person who shared it can send you a new one.";
      }
    } catch (e) {
      error = "Let's try again in a little while.";
    } finally {
      loading = false;
    }
  });

  async function sendNudge() {
    if (!data) return;
    actionLoading = true;
    try {
      const res = await fetch(`${API_BASE_URL}/api/pulse/nudge/${token}`, {
        method: "POST",
      });
      if (res.ok) {
        actionMessage = `Thank you. ${data.user_name} will see your note in Continuum.`;
      } else {
        actionMessage = "Your note is waiting. Let's try again in a little while.";
      }
      setTimeout(() => (actionMessage = ""), 5000);
    } catch (e) {
      console.error(e);
      actionMessage = "Your note is waiting. Let's try again in a little while.";
      setTimeout(() => (actionMessage = ""), 5000);
    } finally {
      actionLoading = false;
    }
  }

  async function confirmContact() {
    if (!token) return;
    actionLoading = true;
    try {
      const res = await fetch(`${API_BASE_URL}/api/pulse/confirm/${token}`, {
        method: "POST",
      });
      if (res.ok) {
        // A guardian confirmation pauses new alerts; the owner's own check-in time stays as shown
        actionMessage = "Thank you for checking on them. This appears in their check-in history.";
      } else {
        actionMessage =
          "This link may have expired or been replaced. The person who shared it can send you a new one.";
      }
      setTimeout(() => (actionMessage = ""), 5000);
    } catch (e) {
      console.error(e);
      actionMessage = "Let's try again in a little while.";
      setTimeout(() => (actionMessage = ""), 5000);
    } finally {
      actionLoading = false;
    }
  }
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
      <h1 class="text-2xl font-serif text-red-400 mb-2">This link has rested for now</h1>
      <p class="text-slate-400">{error}</p>
    </div>
  {:else}
    <div
      class="max-w-md w-full bg-slate-800 rounded-2xl overflow-hidden shadow-2xl border border-slate-700"
      in:fade
    >
      <!-- Header -->
      <div class="bg-slate-900 p-6 text-center border-b border-slate-700">
        <h1 class="text-xl font-medium text-white">
          {data.user_status === "active"
            ? `${data.user_name} checked in recently`
            : `We're waiting to hear from ${data.user_name}`}
        </h1>
        <p class="text-sm text-slate-400 mt-1">
          {data.user_status === "active"
            ? "All is well for now."
            : "A gentle note from you may help."}
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

        {#if data.last_checkin}
          <div>
            <p class="text-slate-400 text-sm mb-1">LAST CONFIRMED CHECK-IN</p>
            <p class="text-2xl font-mono text-white">
              {parseUtc(data.last_checkin).toLocaleString()}
            </p>
          </div>
        {/if}

        <div class="w-full bg-slate-700/50 p-4 rounded-xl text-left">
          <p
            class="text-xs text-slate-400 uppercase tracking-widest mb-2 font-bold"
          >
            Guardian Access{data.contact_tier
              ? ` (Tier ${data.contact_tier})`
              : ""}
          </p>
          <ul class="space-y-2 text-sm text-slate-300">
            <li class="flex items-center gap-2">
              <span class="text-emerald-400">✓</span> View Status
            </li>
            <li class="flex items-center gap-2">
              <span class="text-emerald-400">✓</span> Send "Thinking of You" Nudge
            </li>
            <li class="flex items-center gap-2">
              <span class="text-emerald-400">✓</span> Read notes from {data.user_name}
            </li>
          </ul>
        </div>

        <!-- What you can do (the Tier 2 email's steps), plus the owner's phone when the profile has one -->
        <div class="w-full bg-slate-700/50 p-4 rounded-xl text-left">
          <p class="text-xs text-slate-400 uppercase tracking-widest mb-2 font-bold">
            What you can do
          </p>
          <ul class="space-y-2 text-sm text-slate-300 list-disc pl-5">
            <li>
              Reach {data.user_name} by phone, text or email{#if data.user_phone}: <a href="tel:{data.user_phone}" class="text-teal-400 hover:underline whitespace-nowrap">{data.user_phone}</a>{/if}
            </li>
            <li>Ask mutual friends or family, if that feels right</li>
            <li>Let us know below once you've spoken with them, which pauses further alerts for a while</li>
          </ul>
        </div>

        <!-- Notes from the owner's Pulse vault (opened by the API when the time comes) -->
        <div class="w-full bg-slate-700/50 p-4 rounded-xl text-left">
          <p class="text-xs text-slate-400 uppercase tracking-widest mb-2 font-bold">
            Notes {data.user_name} shared with you
          </p>
          {#if vaultItems.length > 0}
            <ul class="space-y-3">
              {#each vaultItems as item}
                <li>
                  <p class="text-sm font-bold text-slate-200">{item.name}</p>
                  <p class="text-sm text-slate-300 whitespace-pre-wrap">{item.content}</p>
                </li>
              {/each}
            </ul>
          {:else}
            <p class="text-sm text-slate-300">
              Notes from {data.user_name} will appear here when they are needed. You are welcome to simply be present for now.
            </p>
          {/if}
        </div>

        <!-- The owner's own messages to this guardian (Pulse Messages) -->
        {#if data.notes?.length > 0}
          <div class="w-full bg-slate-700/50 p-4 rounded-xl text-left">
            <p class="text-xs text-slate-400 uppercase tracking-widest mb-2 font-bold">
              Messages from {data.user_name}
            </p>
            <ul class="space-y-3">
              {#each data.notes as note}
                <li>
                  <p class="text-sm text-slate-200 whitespace-pre-wrap">{note.message}</p>
                  <p class="text-xs text-slate-500 mt-1">
                    {parseUtc(note.sent_at).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })}
                  </p>
                </li>
              {/each}
            </ul>
          </div>
        {/if}
      </div>

      <!-- Actions -->
      <div class="p-4 bg-slate-900/50 flex gap-4">
        <button
          onclick={sendNudge}
          disabled={actionLoading}
          class="flex-1 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-white py-3 rounded-xl font-medium transition-colors border border-slate-700"
        >
          {actionLoading ? "Sending..." : "Send Nudge"}
        </button>
        <button
          onclick={confirmContact}
          disabled={actionLoading}
          class="flex-1 bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white py-3 rounded-xl font-medium transition-colors"
        >
          {actionLoading ? "Verifying..." : "I've Spoken to Them"}
        </button>
      </div>

      <div class="px-4 pb-4 bg-slate-900/50 text-center">
        <a href="/pulse/respond/{token}" class="text-sm text-teal-400 hover:underline">
          Let them know I've seen this
        </a>
      </div>

      {#if actionMessage}
        <div
          class="p-4 text-center text-sm font-bold text-teal-400 bg-teal-900/20 border-t border-teal-500/20"
          in:fade
        >
          {actionMessage}
        </div>
      {/if}
    </div>
  {/if}
</div>
