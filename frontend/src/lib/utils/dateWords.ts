// Dates read in words, as the modules show them: "2030-01-01" -> "January 1, 2030".
const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})(?:[T ]\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?(?:Z|[+-]\d{2}:?\d{2})?)?$/;
export function dateWords(v: any): string {
    const raw = String(v ?? '');
    const s = raw.trim();
    const m = ISO_DATE.exec(s);
    if (!m) return raw; // anything else is kept exactly as written
    // A plain date is a calendar day, read without a time zone shift.
    const d = s.length === 10 ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : new Date(s);
    return Number.isNaN(d.getTime()) ? s : d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}
