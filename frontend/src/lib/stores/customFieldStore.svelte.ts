import { browser } from '$app/environment';
import { auth } from '$lib/stores/auth';
import { get } from 'svelte/store';
import { captureSession, isCurrentSession, sessionToken, SessionChangedError, type SessionOwnership } from '$lib/services/sessionOwnership';
import type { CustomFieldDefinition } from '$lib/types/customFields';
import { API_BASE_URL } from '$lib/config';

type DefinitionOwner = { userId: number; key: string; session: SessionOwnership };
type LoadState = { loading: boolean; loaded: boolean; error: string | null };

class CustomFieldStore {
    definitions = $state<CustomFieldDefinition[]>([]);
    loading = $state(false);
    error = $state<string | null>(null);
    ownerKey = $state<string | null>(null);
    accountId = $state<number | null>(null);
    private owner: DefinitionOwner | null = null;
    private epoch = 0;
    private active = 0;
    private loads = $state<Record<string, LoadState>>({});
    private inflight = new Map<string, Promise<boolean>>();
    private revision = 0;
    private writes = new Map<number, number>();

    constructor() {
        if (browser) auth.subscribe(() => {
            const owner = this.captureOwner();
            if ((owner?.key ?? null) === this.ownerKey) return;
            this.epoch++;
            this.owner = owner;
            this.ownerKey = owner?.key ?? null;
            this.accountId = owner?.userId ?? null;
            this.definitions = [];
            this.loads = {};
            this.inflight.clear();
            this.writes.clear();
            this.active = 0;
            this.loading = false;
            this.error = null;
        });
    }

    private captureOwner(): DefinitionOwner | null {
        if (!browser) return null;
        const state = get(auth);
        const session = captureSession();
        if (state.loading || !state.isAuthenticated || !state.user || !session.token || !isCurrentSession(session)) return null;
        return { userId: state.user.id, key: JSON.stringify([state.user.id, session.generation]), session };
    }
    private current(owner: DefinitionOwner, epoch: number): boolean {
        const state = get(auth);
        return epoch === this.epoch && this.ownerKey === owner.key && !state.loading
            && state.isAuthenticated && state.user?.id === owner.userId && isCurrentSession(owner.session);
    }
    private requireOwner(): DefinitionOwner {
        const owner = this.captureOwner();
        if (!owner || owner.key !== this.ownerKey) throw new SessionChangedError();
        return owner;
    }
    private reconcileReturnedOwner(owner: DefinitionOwner, entityType?: string) {
        const returned = this.captureOwner();
        if (!entityType || !returned || returned.userId !== owner.userId) return;
        const epoch = this.epoch;
        const before = this.inflight.get(entityType) || Promise.resolve(true);
        // An identified account may have loaded before its earlier write settled. Wait
        // for that read, then reconcile through a fresh owned GET, never another write.
        void before.then(() => {
            if (!this.current(returned, epoch) || this.inflight.has(entityType)) return;
            this.setLoad(entityType, { loading: false, loaded: false, error: null });
            return this.loadDefinitions(entityType);
        });
    }

    private setLoad(entityType: string, state: LoadState) {
        this.loads = { ...this.loads, [entityType]: state };
    }
    getLoadState(entityType: string): LoadState {
        if (!this.ownerKey || !this.owner || !this.current(this.owner, this.epoch)) return { loading: false, loaded: false, error: null };
        return this.loads[entityType] || { loading: false, loaded: false, error: null };
    }

    loadDefinitions(entityType: string): Promise<boolean> {
        const owner = this.captureOwner();
        if (!owner || owner.key !== this.ownerKey) return Promise.resolve(false);
        if (this.loads[entityType]?.loaded) return Promise.resolve(true);
        const pending = this.inflight.get(entityType);
        if (pending) return pending;
        const epoch = this.epoch;
        const revision = this.revision;
        this.active++;
        this.loading = true;
        this.error = null;
        this.setLoad(entityType, { loading: true, loaded: false, error: null });
        const run: Promise<boolean> = Promise.resolve().then(async () => {
            try {
                const token = sessionToken(owner.session);
                if (!token) throw new SessionChangedError();
                const response = await fetch(`${API_BASE_URL}/api/data/custom-fields/${encodeURIComponent(entityType)}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (!this.current(owner, epoch)) return false;
                if (!response.ok) throw new Error('Failed to load custom fields');
                const rows: CustomFieldDefinition[] = await response.json();
                if (!this.current(owner, epoch)) return false;
                if (!Array.isArray(rows)) throw new Error('Failed to load custom fields');
                // A GET begun before a confirmed create/delete must retain that newer result.
                const changed = new Set([...this.writes].filter(([, version]) => version > revision).map(([id]) => id));
                const later = this.definitions.filter(d => d.entity_type === entityType && d.id != null && changed.has(d.id));
                this.definitions = [
                    ...this.definitions.filter(d => d.entity_type !== entityType),
                    ...rows.filter(d => d.entity_type === entityType && (d.id == null || !changed.has(d.id))),
                    ...later,
                ];
                this.setLoad(entityType, { loading: false, loaded: true, error: null });
                return true;
            } catch (error) {
                if (!this.current(owner, epoch)) return false;
                this.error = 'Failed to load custom fields';
                this.setLoad(entityType, { loading: false, loaded: false, error: this.error });
                return false;
            } finally {
                if (this.inflight.get(entityType) === run) this.inflight.delete(entityType);
                if (this.current(owner, epoch)) {
                    this.active--;
                    this.loading = this.active > 0;
                }
            }
        });
        this.inflight.set(entityType, run);
        return run;
    }

    getDefinitions(entityType: string) {
        if (!this.ownerKey || !this.owner || !this.current(this.owner, this.epoch)) return [];
        return this.definitions.filter(d => d.entity_type === entityType).sort((a, b) => (a.order || 0) - (b.order || 0));
    }

    async createDefinition(def: Partial<CustomFieldDefinition>) {
        const owner = this.requireOwner();
        const epoch = this.epoch;
        const payload = JSON.parse(JSON.stringify(def));
        this.active++;
        this.loading = true;
        this.error = null;
        try {
            const token = sessionToken(owner.session);
            if (!token) throw new SessionChangedError();
            const response = await fetch(`${API_BASE_URL}/api/data/custom-fields`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify(payload)
            });
            if (!this.current(owner, epoch)) throw new SessionChangedError();
            if (!response.ok) throw new Error('Failed to create field');
            const saved: CustomFieldDefinition = await response.json();
            if (!this.current(owner, epoch)) throw new SessionChangedError();
            this.definitions = [...this.definitions.filter(d => d.id !== saved.id), saved];
            if (saved.id != null) this.writes.set(saved.id, ++this.revision);
            return saved;
        } catch (error) {
            if (!this.current(owner, epoch)) throw new SessionChangedError();
            this.error = String(error);
            throw error;
        } finally {
            if (this.current(owner, epoch)) {
                this.active--;
                this.loading = this.active > 0;
            } else this.reconcileReturnedOwner(owner, payload.entity_type);
        }
    }

    async deleteDefinition(id: number) {
        const owner = this.requireOwner();
        const epoch = this.epoch;
        const entityType = this.definitions.find(d => d.id === id)?.entity_type;
        this.active++;
        this.loading = true;
        this.error = null;
        try {
            const token = sessionToken(owner.session);
            if (!token) throw new SessionChangedError();
            const response = await fetch(`${API_BASE_URL}/api/data/custom-fields/${id}`, {
                method: 'DELETE', headers: { Authorization: `Bearer ${token}` }
            });
            if (!this.current(owner, epoch)) throw new SessionChangedError();
            if (!response.ok) throw new Error('Failed to remove field');
            this.definitions = this.definitions.filter(d => d.id !== id);
            this.writes.set(id, ++this.revision);
            return true;
        } catch (error) {
            if (!this.current(owner, epoch)) throw new SessionChangedError();
            this.error = String(error);
            throw error;
        } finally {
            if (this.current(owner, epoch)) {
                this.active--;
                this.loading = this.active > 0;
            } else this.reconcileReturnedOwner(owner, entityType);
        }
    }
}

export const customFieldStore = new CustomFieldStore();
