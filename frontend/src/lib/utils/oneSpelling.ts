/**
 * A store keeps each field under one name. `names` maps that name to the other spelling of the
 * same field (SyncManager camel-cases server rows; older saved copies may hold the other one).
 * The kept name wins whenever it is present — the page's own edit, null included — and the other
 * spelling only fills it when the kept name is absent. The other spelling is always dropped, so a
 * stale copy can never come back after an edit or a cleared field.
 */
export function oneSpelling<T extends Record<string, any>>(item: T, names: Record<string, string>): T {
    const out: Record<string, any> = { ...item };
    for (const [keep, other] of Object.entries(names)) {
        if (!(keep in out) && other in out) out[keep] = out[other];
        delete out[other];
    }
    return out as T;
}
