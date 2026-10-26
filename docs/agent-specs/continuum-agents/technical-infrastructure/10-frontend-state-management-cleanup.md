# Agent 10: Frontend State Management Cleanup
**Priority:** P2 - MEDIUM
**Estimated Time:** 2 days
**Dependencies:** 01-authentication-architect
**Category:** Technical Infrastructure

---

## OBJECTIVE

Consolidate and standardize frontend state management using consistent Svelte store patterns.

**Current Issues:**
- Inconsistent state management patterns
- Some data in stores, some in component state
- No single source of truth for shared data
- Duplicate state across components
- No state persistence strategy

**Expected Outcome:**
- Centralized stores for all global state
- Consistent store patterns
- Type-safe state management
- State persistence where appropriate
- Clear data flow

---

## FILES TO CREATE/MODIFY

### New Store Files:
1. `/frontend/src/lib/stores/documentsStore.ts`
2. `/frontend/src/lib/stores/contactsStore.ts`
3. `/frontend/src/lib/stores/wishesStore.ts`
4. `/frontend/src/lib/stores/inventoryStore.ts`
5. `/frontend/src/lib/stores/pulseStore.ts`
6. `/frontend/src/lib/stores/uiStore.ts` - UI state (modals, sidebars, etc.)

### Update Components:
7. All module components to use centralized stores

---

## IMPLEMENTATION

### Store Pattern Template:

```typescript
// Example: documentsStore.ts
import { writable, derived } from 'svelte/store';
import { apiRequest } from '$lib/api/client';
import type { Document } from '$lib/types';

interface DocumentsState {
  documents: Document[];
  loading: boolean;
  error: string | null;
  selectedDocumentId: number | null;
}

function createDocumentsStore() {
  const { subscribe, set, update } = writable<DocumentsState>({
    documents: [],
    loading: false,
    error: null,
    selectedDocumentId: null
  });

  return {
    subscribe,

    async load() {
      update(state => ({ ...state, loading: true, error: null }));

      try {
        const response = await apiRequest('/api/documents');
        const documents = await response.json();

        update(state => ({
          ...state,
          documents,
          loading: false
        }));
      } catch (error) {
        update(state => ({
          ...state,
          loading: false,
          error: error.message
        }));
      }
    },

    async create(document: Partial<Document>) {
      const response = await apiRequest('/api/documents', {
        method: 'POST',
        body: JSON.stringify(document)
      });
      const newDocument = await response.json();

      update(state => ({
        ...state,
        documents: [...state.documents, newDocument]
      }));

      return newDocument;
    },

    async update(id: number, updates: Partial<Document>) {
      const response = await apiRequest(`/api/documents/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updates)
      });
      const updated = await response.json();

      update(state => ({
        ...state,
        documents: state.documents.map(d =>
          d.id === id ? updated : d
        )
      }));
    },

    async delete(id: number) {
      await apiRequest(`/api/documents/${id}`, {
        method: 'DELETE'
      });

      update(state => ({
        ...state,
        documents: state.documents.filter(d => d.id !== id)
      }));
    },

    selectDocument(id: number | null) {
      update(state => ({ ...state, selectedDocumentId: id }));
    }
  };
}

export const documentsStore = createDocumentsStore();

// Derived stores
export const selectedDocument = derived(
  documentsStore,
  $store => $store.documents.find(d => d.id === $store.selectedDocumentId)
);
```

---

## VALIDATION

```bash
cd frontend
npm run check
npm run build
```

---

## SUCCESS CRITERIA

- [ ] All global state in centralized stores
- [ ] Consistent store patterns
- [ ] Type-safe state management
- [ ] No duplicate state across components
- [ ] Components use stores instead of local state for shared data
- [ ] Derived stores for computed values

---

## COMMIT MESSAGE

```
refactor(frontend): consolidate state management with centralized stores

Standardize all state management using consistent Svelte store patterns.

Implementation:
- Created centralized stores for all modules
- Consistent CRUD operations in stores
- Type-safe state interfaces
- Derived stores for computed values
- Removed duplicate state from components

Impact:
- Single source of truth for data
- Consistent state management patterns
- Better type safety
- Easier to maintain and debug

Closes: Frontend state management cleanup
```

---

**READY TO EXECUTE**
