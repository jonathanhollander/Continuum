import { createProfileStore } from './persistence';

export interface LifeEvent {
    id: number;
    year: number;
    label: string;
    description?: string;
    date?: string; // ISO Date string YYYY-MM-DD
    type: "milestone" | "education" | "work" | "relationship" | "future" | "accomplishment";
    // Accomplishment specific fields
    category?: "Career" | "Personal" | "Education" | "Relationships" | "Travel" | "Other";
    reflection?: string;
    isHighlight?: boolean;
    impact?: "High" | "Medium" | "Low";
    assignedContactId?: string;
}

const DEFAULT_EVENTS: LifeEvent[] = [
    { id: 1, year: 1990, label: "Born", type: "milestone" },
    { id: 2, year: 2008, label: "Graduated HS", type: "education" },
    { id: 3, year: 2012, label: "Started Career", type: "work" },
    { id: 4, year: 2016, label: "Married", type: "relationship" },
    { id: 5, year: 2018, label: "Bought First Home", type: "milestone" },
    { id: 6, year: 2021, label: "Won Industry Award", type: "accomplishment" },
    { id: 7, year: 2024, label: "Big Promotion", type: "work" },
    { id: 8, year: 2030, label: "Retire Early?", type: "future" },
    { id: 9, year: 2040, label: "Grandkids?", type: "future" },
];

// Migration / Initialization Logic
const getInitialData = (): LifeEvent[] => {
    if (typeof localStorage === 'undefined') return DEFAULT_EVENTS;

    // Check for new unified data for owner
    const unified = localStorage.getItem('continuum_owner_timeline_events');
    if (unified) return DEFAULT_EVENTS;

    // Fallback to legacy
    const legacy = localStorage.getItem('continuum_timeline_events');
    if (legacy) {
        try {
            const parsed = JSON.parse(legacy);
            return Array.isArray(parsed) ? parsed : DEFAULT_EVENTS;
        } catch (e) {
            console.error("Migration failed for timeline", e);
        }
    }
    return DEFAULT_EVENTS;
};

// Use reactive profile store
export const timelineStore = createProfileStore<LifeEvent[]>('timeline_events', getInitialData());
