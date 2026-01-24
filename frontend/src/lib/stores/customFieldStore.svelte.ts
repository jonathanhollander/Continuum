import { browser } from '$app/environment';
import { user } from '$lib/stores/auth';
import type { CustomFieldDefinition } from '$lib/types/customFields';
import { API_BASE_URL } from '$lib/config';

class CustomFieldStore {
    definitions = $state<CustomFieldDefinition[]>([]);
    loading = $state(false);
    error = $state<string | null>(null);

    // Cache by entity type to avoid fetching all at once
    private cache = new Map<string, boolean>();

    async loadDefinitions(entityType: string) {
        if (!browser || !user) return;
        if (this.cache.get(entityType)) return; // Already loaded

        this.loading = true;
        try {
            const token = localStorage.getItem('continuum_auth_token');
            const res = await fetch(`${API_BASE_URL}/api/data/custom-fields/${entityType}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (res.ok) {
                const data = await res.json();
                // Merge into definitions array, avoiding duplicates
                const existingIds = new Set(this.definitions.map(d => d.id));
                const newDefs = data.filter((d: CustomFieldDefinition) => !existingIds.has(d.id));
                this.definitions = [...this.definitions, ...newDefs];
                this.cache.set(entityType, true);
            } else {
                console.error('Failed to load custom fields:', await res.text());
            }
        } catch (e) {
            console.error('Error loading custom fields:', e);
            this.error = 'Failed to load custom fields';
        } finally {
            this.loading = false;
        }
    }

    getDefinitions(entityType: string) {
        return this.definitions
            .filter(d => d.entity_type === entityType)
            .sort((a, b) => (a.order || 0) - (b.order || 0));
    }

    async createDefinition(def: Partial<CustomFieldDefinition>) {
        if (!browser) return;
        this.loading = true;
        try {
            const token = localStorage.getItem('continuum_auth_token');
            const res = await fetch(`${API_BASE_URL}/api/data/custom-fields`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(def)
            });

            if (res.ok) {
                const newDef = await res.json();
                this.definitions = [...this.definitions, newDef];
                return newDef;
            } else {
                this.error = 'Failed to create field';
                throw new Error(await res.text());
            }
        } catch (e) {
            this.error = String(e);
            throw e;
        } finally {
            this.loading = false;
        }
    }

    async deleteDefinition(id: number) {
        if (!browser) return;
        this.loading = true;
        try {
            const token = localStorage.getItem('continuum_auth_token');
            const res = await fetch(`${API_BASE_URL}/api/data/custom-fields/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (res.ok) {
                this.definitions = this.definitions.filter(d => d.id !== id);
                return true;
            }
        } catch (e) {
            this.error = String(e);
        } finally {
            this.loading = false;
        }
    }
}

export const customFieldStore = new CustomFieldStore();
