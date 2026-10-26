<script lang="ts">
  import { page } from "$app/stores";
  import { onMount } from "svelte";
  import { fade } from "svelte/transition";
  import { API_BASE_URL } from "$lib/config";
  import LivingMesh from "$lib/components/pulse/LivingMesh.svelte";
  import { Shield } from "lucide-svelte";

  let token = $page.params.token;
  let loading = $state(true);
  let error: string | null = $state(null);
  let data: any = $state(null);
  // The owner's Pulse vault notes: the API opens them once escalation reaches this guardian
  // and the owner's Automatic Release is on (one portal: /pulse/portal forwards here)
  let vaultItems: { name: string; content: string }[] = $state([]);
  let vaultLoading = $state(false);
  let vaultError: string | null = $state(null);

  let actionLoading = $state(false);
  let actionMessage = $state("");

  // The name opens the heading; the API's fallback ("someone close to you") starts lowercase
  function capitalise(s: string): string {
    return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
  }

  // The API sends UTC with "Z"; a time without a zone is still read as UTC, never local
  function parseUtc(ts: string): Date {
    return new Date(/[zZ]|[+-]\d\d:?\d\d$/.test(ts) ? ts : ts + "Z");
  }

  async function loadVault() {
    if (vaultLoading || !data?.show_sensitive) return;
    vaultLoading = true;
    vaultError = null;
    try {
      const res = await fetch(`${API_BASE_URL}/api/pulse/portal/${token}/vault`);
      if (!res.ok) throw new Error("Shared notes need another read.");
      const items = await res.json();
      if (!Array.isArray(items) || items.some((item) =>
        typeof item?.name !== "string" || typeof item?.content !== "string"
      )) throw new Error("Shared notes need another read.");
      vaultItems = items;
    } catch {
      vaultError = "You can try loading shared notes again whenever you're ready.";
    } finally {
      vaultLoading = false;
    }
  }

  onMount(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/pulse/portal/${token}`);
      if (res.ok) {
        data = await res.json();
        // The portal is useful as soon as its status/messages arrive. A separate notes
        // read can wait or be retried without hiding that already-loaded content.
        loading = false;
        if (data.show_sensitive) await loadVault();
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
  class="surface-dark isolate bg-background min-h-screen relative overflow-hidden text-foreground flex flex-col items-center justify-center p-4"
>
  <LivingMesh
    status={error ? "disabled" : data?.user_status === "grace" ? "grace" : "active"}
  />
  {#if loading}
    <div class="animate-pulse text-primary">
      Connecting to Secure Portal...
    </div>
  {:else if error}
    <div
      class="bg-background/60 p-8 rounded-2xl border border-border text-center max-w-md backdrop-blur-md"
    >
      <Shield class="w-12 h-12 text-warning mx-auto mb-4" />
      <h1 class="text-2xl font-serif text-foreground mb-2">This link has rested for now</h1>
      <p class="text-muted-foreground">{error}</p>
    </div>
  {:else}
    <div
      class="max-w-md w-full bg-card rounded-2xl overflow-hidden shadow-2xl border border-border"
      in:fade
    >
      <!-- Header -->
      <div class="bg-background p-6 text-center border-b border-border">
        <h1 class="text-xl font-medium text-foreground">
          {data.user_status === "active"
            ? `${capitalise(data.user_name)} checked in recently`
            : `We're waiting to hear from ${data.user_name}`}
        </h1>
        <p class="text-sm text-muted-foreground mt-1">
          {data.user_status === "active"
            ? "All is well for now."
            : "A gentle note from you may help."}
        </p>
      </div>

      <!-- Main Status -->
      <div class="p-8 flex flex-col items-center text-center space-y-6">
        <div
          class="w-32 h-32 rounded-full bg-primary/10 flex items-center justify-center relative"
        >
          <div
            class="absolute inset-0 rounded-full border border-primary/30 animate-ping opacity-20"
          ></div>
          <!-- Heartbeat Icon -->
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="w-12 h-12 text-primary"
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
            <p class="text-muted-foreground text-sm mb-1">LAST CONFIRMED CHECK-IN</p>
            <p class="text-2xl font-mono text-foreground">
              {parseUtc(data.last_checkin).toLocaleString()}
            </p>
          </div>
        {/if}

        <div class="w-full bg-slate-700/50 p-4 rounded-xl text-left">
          <p
            class="text-xs text-muted-foreground uppercase tracking-widest mb-2 font-bold"
          >
            Guardian Access{data.contact_tier
              ? ` (Tier ${data.contact_tier})`
              : ""}
          </p>
          <ul class="space-y-2 text-sm text-slate-300">
            <li class="flex items-center gap-2">
              <span class="text-primary">✓</span> View Status
            </li>
            <li class="flex items-center gap-2">
              <span class="text-primary">✓</span> Send "Thinking of You" Nudge
            </li>
            <li class="flex items-center gap-2">
              <span class="text-primary">✓</span> Read notes from {data.user_name}
            </li>
          </ul>
        </div>

        <!-- What you can do (the Tier 2 email's steps), plus the owner's phone when the profile has one -->
        <div class="w-full bg-slate-700/50 p-4 rounded-xl text-left">
          <p class="text-xs text-muted-foreground uppercase tracking-widest mb-2 font-bold">
            What you can do
          </p>
          <ul class="space-y-2 text-sm text-slate-300 list-disc pl-5">
            <li>
              Reach {data.user_name} by phone, text or email{#if data.user_phone}: <a href="tel:{data.user_phone}" class="text-primary hover:underline whitespace-nowrap">{data.user_phone}</a>{/if}
            </li>
            <li>Ask mutual friends or family, if that feels right</li>
            <li>Let us know below once you've spoken with them, which pauses further alerts for a while</li>
          </ul>
        </div>

        <!-- Notes from the owner's Pulse vault (opened by the API when the time comes) -->
        <div
          class="w-full bg-slate-700/50 p-4 rounded-xl text-left"
          role="region"
          aria-labelledby="vault-notes-title"
          aria-busy={vaultLoading}
        >
          <p id="vault-notes-title" class="text-xs text-muted-foreground uppercase tracking-widest mb-2 font-bold">
            Notes {data.user_name} shared with you
          </p>
          {#if vaultItems.length > 0}
            <ul class="space-y-3">
              {#each vaultItems as item}
                <li>
                  <p class="text-sm font-bold text-foreground">{item.name}</p>
                  <p class="text-sm text-slate-300 whitespace-pre-wrap">{item.content}</p>
                </li>
              {/each}
            </ul>
          {/if}
          {#if vaultLoading}
            <p class="text-sm text-slate-300" role="status">Opening shared notes…</p>
          {/if}
          {#if vaultError}
            <div class="space-y-3" role="status">
              <p class="text-sm text-slate-300">{vaultError}</p>
              <button
                onclick={loadVault}
                disabled={vaultLoading}
                class="rounded-lg border border-primary/40 px-3 py-2 text-sm font-medium text-primary hover:bg-primary/10 disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              >Try again</button>
            </div>
          {/if}
          {#if vaultItems.length === 0 && !vaultLoading && !vaultError}
            <p class="text-sm text-slate-300">
              Notes from {data.user_name} will appear here when they are needed. You are welcome to simply be present for now.
            </p>
          {/if}
        </div>

        <!-- The owner's own messages to this guardian (Pulse Messages) -->
        {#if data.notes?.length > 0}
          <div class="w-full bg-slate-700/50 p-4 rounded-xl text-left">
            <p class="text-xs text-muted-foreground uppercase tracking-widest mb-2 font-bold">
              Messages from {data.user_name}
            </p>
            <ul class="space-y-3">
              {#each data.notes as note}
                <li>
                  <p class="text-sm text-foreground whitespace-pre-wrap">{note.message}</p>
                  <p class="text-xs text-muted-foreground mt-1">
                    {parseUtc(note.sent_at).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })}
                  </p>
                </li>
              {/each}
            </ul>
          </div>
        {/if}
      </div>

      <!-- Actions -->
      <div class="p-4 bg-background/50 flex gap-4">
        <button
          onclick={sendNudge}
          disabled={actionLoading}
          class="flex-1 bg-card hover:bg-slate-700 disabled:hover:bg-card text-foreground disabled:text-muted-foreground py-3 rounded-xl font-medium transition-colors border border-border"
        >
          {actionLoading ? "Sending..." : "Send Nudge"}
        </button>
        <button
          onclick={confirmContact}
          disabled={actionLoading}
          class="flex-1 bg-primary hover:bg-primary-hover text-primary-foreground disabled:bg-muted disabled:text-muted-foreground py-3 rounded-xl font-medium transition-colors border border-transparent disabled:border-border"
        >
          {actionLoading ? "Verifying..." : "I've Spoken to Them"}
        </button>
      </div>

      <div class="px-4 pb-4 bg-background/50 text-center">
        <a href="/pulse/respond/{token}" class="text-sm text-primary hover:underline">
          Let them know I've seen this
        </a>
      </div>

      {#if actionMessage}
        <div
          class="p-4 text-center text-sm font-bold text-primary bg-primary-soft border-t border-primary/20"
          in:fade
        >
          {actionMessage}
        </div>
      {/if}
    </div>
  {/if}
</div>
