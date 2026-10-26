/**
 * A record's custom field values, as an object to edit.
 * Server rows arrive camel-cased (`customAttributes`, sync.svelte.ts); records saved from a form
 * hold `custom_attributes`. The form's own copy wins when both are present.
 */
export function readCustom(record: any): Record<string, any> {
    const raw = record?.custom_attributes ?? record?.customAttributes;
    let value = raw;
    if (typeof raw === 'string') {
        try { value = JSON.parse(raw || '{}'); } catch { value = {}; }
    }
    return value && typeof value === 'object' && !Array.isArray(value) ? { ...value } : {};
}
