/**
 * Milestone ids as words (card G4, moved here by X223 so pages that only need the labels
 * don't load the PDF exporter): one map for letters (triggerMilestone) and time capsules
 * (trigger_value), from the time capsule's COMMON_MILESTONES and the letters page's labels.
 * An id the owner typed themselves reads as words ("first_job" -> "First job").
 */
export const MILESTONE_LABELS: Record<string, string> = {
    grad: 'College Graduation',
    wedding: 'Wedding Day',
    parent: 'Becoming a Parent',
    home: 'First Home',
    career: 'Major Career Achievement',
    anniv_10: '10th Marriage Anniversary'
};

// Same wording rule as exportService's humanize: "first_job" / "firstJob" -> "First job".
function humanize(key: string): string {
    const words = key
        .replace(/_/g, ' ')
        .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
        .toLowerCase()
        .trim();
    return words.charAt(0).toUpperCase() + words.slice(1);
}

export const milestoneLabel = (id: any): string => {
    const k = String(id ?? '').trim();
    return MILESTONE_LABELS[k] ?? (k ? humanize(k.replace(/[-]+/g, '_')) : '');
};
