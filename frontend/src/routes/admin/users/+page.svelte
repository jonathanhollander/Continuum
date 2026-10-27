<script lang="ts">
    import { onMount } from 'svelte';
    import { apiFetch } from '$lib/api/client';
    import { captureSession, isCurrentSession } from '$lib/services/sessionOwnership';

    interface Administrator {
        id: number;
        email: string;
        display_name: string | null;
        is_admin: boolean;
    }
    interface AdministratorList {
        administrators: Administrator[];
        next_cursor: number | null;
    }

    let administrators = $state<Administrator[]>([]);
    let nextCursor = $state<number | null>(null);
    let loaded = $state(false);
    let loading = $state(false);
    let loadError = $state(false);
    let email = $state('');
    let saving = $state(false);
    let saveError = $state<string | null>(null);
    let confirmation = $state('');
    let loadVersion = 0;
    const retryMessage = "Your draft is kept. We can save it again whenever you're ready.";

    async function loadAdministrators(append = false) {
        const owner = captureSession();
        const version = ++loadVersion;
        const after = append ? nextCursor : null;
        loading = true;
        loadError = false;
        try {
            const res = await apiFetch(`/api/admin/users${after === null ? '' : `?after_id=${after}`}`);
            if (!res.ok) throw new Error('Load administrators');
            const data: AdministratorList = await res.json();
            if (version !== loadVersion || !isCurrentSession(owner)) return;
            administrators = append
                ? [...new Map([...administrators, ...data.administrators].map(a => [a.id, a])).values()]
                : data.administrators;
            nextCursor = data.next_cursor;
            loaded = true;
        } catch {
            if (version === loadVersion && isCurrentSession(owner)) loadError = true;
        } finally {
            if (version === loadVersion) loading = false;
        }
    }

    async function grantAdministrator() {
        if (saving || !email.trim()) return;
        const owner = captureSession();
        const submitted = email.trim();
        saving = true;
        saveError = null;
        confirmation = '';
        try {
            const res = await apiFetch('/api/admin/users/grant', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: submitted })
            });
            if (!isCurrentSession(owner)) return;
            if (!res.ok) {
                saveError = res.status === 404 ? 'Use the exact email for an existing account.' : retryMessage;
                return;
            }
            const saved: Administrator = await res.json();
            if (!isCurrentSession(owner)) return;
            if (saved.is_admin !== true) throw new Error('Confirm administrator designation');
            confirmation = `${saved.email} is an administrator.`;
            if (email.trim() === submitted) email = '';
            // A pre-grant list may still be arriving. Refresh from the confirmed server state.
            loadVersion++;
            await loadAdministrators();
        } catch {
            if (isCurrentSession(owner)) saveError = retryMessage;
        } finally {
            if (isCurrentSession(owner)) saving = false;
        }
    }

    onMount(() => {
        void loadAdministrators();
        return () => { loadVersion++; };
    });
</script>

<div class="max-w-3xl space-y-8">
    <header class="space-y-2">
        <h1 class="text-3xl font-serif font-bold">Users</h1>
        <p class="text-muted-foreground">Administrators can designate other existing accounts as administrators.</p>
    </header>

    <section class="bg-card border border-border rounded-2xl p-6 space-y-4">
        <h2 class="text-xl font-semibold">Make an administrator</h2>
        <form class="space-y-4" aria-busy={saving} onsubmit={(event) => { event.preventDefault(); void grantAdministrator(); }}>
            <div class="space-y-2">
                <label for="admin-account-email" class="block text-sm font-medium">Account email</label>
                <input id="admin-account-email" type="email" autocomplete="email" required
                    bind:value={email} disabled={saving} oninput={() => (saveError = null)}
                    class="w-full bg-background border border-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary" />
                <p class="text-sm text-muted-foreground">Use the exact email for an existing account.</p>
            </div>
            {#if saveError}<p role="alert" class="text-sm text-warning">{saveError}</p>{/if}
            {#if confirmation}<p role="status" class="text-sm text-success">{confirmation}</p>{/if}
            <button type="submit" disabled={saving}
                class="bg-primary text-primary-foreground rounded-xl px-5 py-3 font-semibold hover:bg-primary-hover disabled:opacity-60">
                {saving ? 'Saving...' : saveError ? 'Try Again' : 'Make administrator'}
            </button>
        </form>
    </section>

    <section class="bg-card border border-border rounded-2xl p-6 space-y-4" aria-labelledby="administrator-list-title">
        <h2 id="administrator-list-title" class="text-xl font-semibold">Administrators</h2>
        {#if loading}<p role="status" class="text-sm text-muted-foreground">Loading administrators...</p>{/if}
        {#if loadError}
            <p role="alert" class="text-sm text-warning">Choose Try Again to load the administrator list.</p>
            <button type="button" onclick={() => loadAdministrators()} disabled={loading}
                class="text-primary font-semibold hover:underline">Try Again</button>
        {/if}
        {#if loaded}
            <ul class="divide-y divide-border">
                {#each administrators as account (account.id)}
                    <li class="py-3 space-y-1">
                        {#if account.display_name}<p class="font-medium">{account.display_name}</p>{/if}
                        <p class="text-sm text-muted-foreground break-all">{account.email}</p>
                    </li>
                {/each}
            </ul>
            {#if nextCursor !== null}
                <button type="button" onclick={() => loadAdministrators(true)} disabled={loading}
                    class="text-primary font-semibold hover:underline disabled:opacity-60">Load more</button>
            {/if}
        {/if}
    </section>
</div>
