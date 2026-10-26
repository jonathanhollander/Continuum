/**
 * Export (card D1, CU-003): one snapshot, two outputs.
 *
 *   fetchSnapshot()            -> GET /api/export/snapshot: every record of the signed-in owner
 *   buildPacket(snapshot)      -> the readable packet: sections, records, full text, attachments
 *   packetHTML(packet, urlFor) -> the packet as HTML (the binder page shows it; print saves a PDF)
 *   createPDFBlob(...)         -> the same packet as a PDF file
 *   buildDownloadCopy(...)     -> zip: packet.html + packet.pdf + the actual files + manifest.json
 *
 * Every output reads the one snapshot through buildPacket, so the binder, the PDF and the
 * download copy always show the same records, names, values and text. A recipient view
 * (card D2) can pass its own snapshot and file fetcher.
 */
import jsPDF from 'jspdf';
import { get } from 'svelte/store';
import { API_BASE_URL } from '$lib/config';
import { auth } from '$lib/stores/auth';
import { estateTotals, isDebt } from '$lib/stores/financialAssetsStore.svelte';
import { formatMoney } from '$lib/utils/money';
import { fetchMediaBlob } from '$lib/services/mediaService';
import { dateWords } from '$lib/utils/dateWords';

export type ExportScope = 'full' | 'insurance' | 'medical';

export interface SnapshotAttachment {
    key: string;
    source: 'media' | 'inline';
    media_id?: number;
    filename?: string;
    mime_type: string;
    file_size: number;
    download_url?: string;
    records: { section: string; id: any; field: string }[];
}

export interface Snapshot {
    version: number;
    generated_at: string;
    owner: Record<string, any>;
    sections: Record<string, any[]>;
    attachments: SnapshotAttachment[];
    missing_attachments: any[];
}

export interface PacketField {
    label: string;
    value: string;
    long?: boolean;
}

export interface PacketRecord {
    section: string;
    id: any;
    title: string;
    fields: PacketField[];
    attachments: SnapshotAttachment[];
}

export interface PacketSection {
    key: string;
    title: string;
    summary: PacketField[];
    records: PacketRecord[];
}

export interface Packet {
    ownerName: string;
    executors: string[];
    generatedAt: string;
    sections: PacketSection[];
    attachments: SnapshotAttachment[];
}

// ---------------------------------------------------------------------------
// Snapshot
// ---------------------------------------------------------------------------

export async function fetchSnapshot(): Promise<Snapshot> {
    const token = get(auth).token;
    const res = await fetch(`${API_BASE_URL}/api/export/snapshot`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
    });
    if (!res.ok) throw new Error('Your records are taking a moment to gather. You can try again shortly.');
    return res.json();
}

// ---------------------------------------------------------------------------
// Packet (the one readable model every output renders)
// ---------------------------------------------------------------------------

const money = formatMoney;

const has = (v: any) => v !== null && v !== undefined && v !== '' && !(typeof v === 'number' && Number.isNaN(v));

function isFileValue(v: any): boolean {
    return typeof v === 'string' && (/^data:/i.test(v) || /\/api\/media\/\d+(\/download)?([?#].*)?$/.test(v));
}

function humanize(key: string): string {
    const words = key
        .replace(/_/g, ' ')
        .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
        .toLowerCase()
        .trim();
    return words.charAt(0).toUpperCase() + words.slice(1);
}

// Stored values such as "active" or "needs_review" read as words: "Active", "Needs review".
const words = (v: any) => humanize(String(v));

/**
 * Milestone ids as words (card G4): one map for letters (triggerMilestone) and time capsules
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
export const milestoneLabel = (id: any): string => {
    const k = String(id ?? '').trim();
    return MILESTONE_LABELS[k] ?? (k ? humanize(k.replace(/[-]+/g, '_')) : '');
};

/**
 * One executor test for the packet and the recipient page (card G4; the server's
 * recipient.is_executor): the contact's flag, the role "Executor", or the name the owner
 * gave as executor in the estate profile.
 */
export function isExecutorContact(c: any, executorName?: any): boolean {
    if (!c) return false;
    if (c.is_executor === true || c.isExecutor === true) return true;
    if (String(c.role ?? '').trim().toLowerCase() === 'executor') return true;
    const named = String(executorName ?? '').trim().toLowerCase();
    return !!named && named === String(c.name ?? '').trim().toLowerCase();
}

// Important Dates keep "MMDD"/"YYYYMMDD" (calendar page) or "MM-DD"/"YYYY-MM-DD".
function calendarDate(v: any): string {
    const d = String(v ?? '').replace(/-/g, '');
    if (!/^\d{4}(\d{4})?$/.test(d)) return text(v);
    const [y, m, day] = d.length === 8 ? [d.slice(0, 4), d.slice(4, 6), d.slice(6, 8)] : ['', d.slice(0, 2), d.slice(2, 4)];
    const dt = new Date(2000, Number(m) - 1, Number(day));
    if (Number.isNaN(dt.getTime())) return text(v);
    const md = dt.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
    return y ? `${md}, ${y}` : md;
}

// The calendar page keeps its email template as JSON {recipient, subject, body} in ritual_instructions.
function calendarMessage(v: any): { recipient?: string; subject?: string; body?: string } | null {
    const t = parseJSON(v);
    return t && typeof t === 'object' && !Array.isArray(t) && ('body' in t || 'subject' in t) ? t : null;
}

function text(v: any): string {
    if (typeof v === 'boolean') return v ? 'Yes' : '';
    if (Array.isArray(v)) return v.map(text).filter(Boolean).join(', ');
    if (v && typeof v === 'object') {
        return Object.entries(v)
            .filter(([, x]) => has(x) && text(x) !== '')
            .map(([k, x]) => `${humanize(k)}: ${text(x)}`)
            .join('; ');
    }
    if (typeof v === 'string') return dateWords(v);
    return has(v) ? String(v) : '';
}

function parseJSON(v: any): any {
    if (typeof v !== 'string') return v;
    try {
        return JSON.parse(v);
    } catch {
        return v;
    }
}

type Spec = [key: string | ((r: any) => any), label: string, opts?: { long?: boolean; money?: boolean; fmt?: (v: any, r: any) => string }];

interface SectionDef {
    key: string; // packet section key
    source: string; // snapshot section
    title: string;
    filter?: (r: any) => boolean;
    name: (r: any) => string;
    fields: Spec[];
    consumed?: string[]; // fields shown through a spec function or the title
    summary?: (rows: any[]) => PacketField[];
    keep?: (r: any) => boolean;
}

// Never shown as a field: identifiers, internal JSON and the record's own name.
const ALWAYS_SKIP = new Set([
    'id', 'user_id', 'userId', 'custom_attributes', 'customAttributes', 'valueHistory', 'category',
    'media_id', 'mediaId', 'portal_token', 'portal_token_expires', 'recipient_token', 'recipient_token_created_at', 'tier_id', 'priority',
    'can_view_history', 'individual_delay_hours', 'notify_on_safety_timer', 'notification_status',
    'beneficiary_id', 'maintenanceSchedule', 'thumbnail', 'is_digitized', 'assigned_contact_id',
    'image', 'avatar', 'url' // files show as attachments; stock pictures are left out
]);

const assetCategoryTotals = (rows: any[]): PacketField[] => [
    { label: 'Items', value: String(rows.length) },
    ...(rows.some((r) => has(r.valuation))
        ? [{ label: 'Recorded value', value: money(rows.reduce((s, r) => s + (Number(r.valuation) || 0), 0)) }]
        : [])
];

// The documents module's readiness (DocumentVault docState): "Review due" once the review
// date arrives, "Ready" when the family can find it.
function documentState(r: any): string {
    const t = new Date();
    const today = `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`;
    if (r.next_review_date && String(r.next_review_date).slice(0, 10) <= today) return 'Review due';
    return r.file_path || String(r.location || r.location_physical || '').trim() ? 'Ready' : '';
}

const SECTIONS: SectionDef[] = [
    {
        key: 'financial_accounts', source: 'financial_accounts', title: 'Accounts and debts',
        name: (r) => r.name || r.institution || 'Account',
        consumed: ['name', 'institution', 'value', 'balance_estimate', 'type', 'account_type',
            'accountNumber', 'account_number_encrypted', 'is_closed', 'closure_date', 'closureNotes'],
        fields: [
            [(r) => r.type || r.account_type, 'Type'],
            [(r) => (has(r.value) ? r.value : r.balance_estimate), 'Value', {
                fmt: (v, r) => (isDebt(r) ? `${money(Math.abs(Number(v) || 0))} owed` : money(v))
            }],
            [(r) => r.accountNumber || r.account_number_encrypted, 'Account number'],
            ['ownershipPercentage', 'Ownership', { fmt: (v) => `${v}%` }],
            ['location', 'Institution or location'],
            ['holder_name', 'Account holder'],
            ['beneficiaries', 'Beneficiaries'],
            ['beneficiaryEmail', 'Beneficiary email'],
            ['loginUrl', 'Login address'],
            ['notes', 'Notes', { long: true }],
            [(r) => (r.is_closed ? [r.closure_date && dateWords(r.closure_date), r.closureNotes].filter(Boolean).join(' — ') || 'Closed' : ''), 'Closed']
        ],
        summary: (rows) => {
            const t = estateTotals(rows.map((r) => ({ ...r, value: has(r.value) ? r.value : r.balance_estimate })));
            return [
                { label: 'Accounts', value: String(rows.length) },
                { label: 'Total assets', value: money(t.assets) },
                { label: 'Total debts', value: money(t.debts) },
                { label: 'Net estate', value: money(t.net) }
            ];
        }
    },
    {
        key: 'properties', source: 'assets', title: 'Property', filter: (r) => r.category === 'properties',
        name: (r) => r.name,
        fields: [
            ['type', 'Type'], ['valuation', 'Value', { money: true }], ['location', 'Location'],
            ['purchaseDate', 'Purchase date'], ['ownershipDetails', 'Ownership'], ['status', 'Status', { fmt: words }],
            ['notes', 'Notes', { long: true }],
            [(r) => {
                const ev = parseJSON(r.evidence);
                return Array.isArray(ev) ? ev.map((e: any) => (typeof e === 'string' ? (isFileValue(e) ? '' : e) : e?.name || e?.filename || e?.label || '')).filter(Boolean).join(', ') : '';
            }, 'Evidence']
        ],
        consumed: ['evidence'],
        summary: assetCategoryTotals
    },
    {
        key: 'digital_assets', source: 'assets', title: 'Digital accounts', filter: (r) => r.category === 'digital_assets',
        name: (r) => r.name || r.platform,
        fields: [
            ['platform', 'Platform'], ['username', 'Username'], ['preference', 'Wish for this account'],
            ['instructions', 'Instructions', { long: true }], ['description', 'Description', { long: true }],
            ['valuation', 'Value', { money: true }], ['notes', 'Notes', { long: true }],
            [(r) => (r.is_closed ? (r.closure_date ? dateWords(r.closure_date) : 'Closed') : ''), 'Closed']
        ],
        consumed: ['is_closed', 'closure_date', 'type', 'status'],
        summary: assetCategoryTotals
    },
    {
        key: 'heirlooms', source: 'assets', title: 'Heirlooms', filter: (r) => r.category === 'heirlooms',
        name: (r) => r.name,
        fields: [
            ['recipient', 'For'], ['valuation', 'Value', { money: true }], ['location', 'Location'],
            ['ownershipDetails', 'Provenance', { long: true }], ['story', 'Story', { long: true }],
            ['notes', 'Notes', { long: true }]
        ],
        consumed: ['type', 'status'],
        summary: assetCategoryTotals
    },
    {
        key: 'other_assets', source: 'assets', title: 'Other assets',
        filter: (r) => !['properties', 'digital_assets', 'heirlooms'].includes(r.category),
        name: (r) => r.name,
        fields: [['type', 'Type'], ['valuation', 'Value', { money: true }], ['location', 'Location'], ['notes', 'Notes', { long: true }]],
        summary: assetCategoryTotals
    },
    {
        key: 'insurance_policies', source: 'insurance_policies', title: 'Insurance',
        name: (r) => r.policy_name,
        fields: [
            ['insurance_type', 'Type'], ['insurer', 'Insurer'], ['policy_number', 'Policy number'],
            [(r) => (has(r.premium_amount) && Number(r.premium_amount) !== 0 ? `${money(r.premium_amount)}${r.premium_frequency ? ` ${String(r.premium_frequency).toLowerCase()}` : ''}` : ''), 'Premium'],
            ['beneficiaries', 'Beneficiaries'], ['agent_name', 'Agent'], ['agent_contact', 'Agent contact'],
            ['expiration_date', 'Expires', { fmt: dateWords }], ['status', 'Status', { fmt: words }],
            ['claims_procedure', 'How to claim', { long: true }], ['notes', 'Notes', { long: true }]
        ],
        consumed: ['premium_amount', 'premium_frequency']
    },
    {
        key: 'documents', source: 'documents', title: 'Documents',
        name: (r) => r.name || r.title,
        fields: [
            [(r) => r.category, 'Type'],
            [(r) => r.location || r.location_physical, 'Original kept at'],
            ['witnesses', 'Witnesses'], ['signed_date', 'Signed'], ['next_review_date', 'Next review'],
            [(r) => documentState(r), 'Status'], ['notes', 'Notes', { long: true }]
        ],
        consumed: ['title', 'name', 'location', 'location_physical', 'file_path', 'status']
    },
    {
        key: 'contacts', source: 'contacts', title: 'People to contact',
        name: (r) => r.name,
        fields: [
            ['role', 'Role'], ['relation', 'Relationship'], ['phone', 'Phone'], ['email', 'Email'],
            [(r) => [r.is_executor && 'Executor', r.is_beneficiary && 'Beneficiary', r.is_emergency_contact && 'Emergency contact', r.is_recipient && 'Recipient'].filter(Boolean).join(', '), 'Named as'],
            ['call_tier', 'Call order', { fmt: (v) => ({ '1_Immediate': 'Tier 1: Immediate Notification', '2_SameDay': 'Tier 2: Same Day (Inner Circle)', '3_Service': 'Tier 3: Service Notice', '4_DNR': 'Tier 4' } as Record<string, string>)[v] || v }],
            ['notes', 'Notes', { long: true }]
        ],
        consumed: ['is_executor', 'is_beneficiary', 'is_emergency_contact', 'is_recipient', 'avatar']
    },
    {
        key: 'letters', source: 'letters', title: 'Letters',
        name: (r) => r.title,
        fields: [
            ['recipient_name', 'To'], ['date', 'Written'],
            [(r) => (r.triggerDate ? dateWords(r.triggerDate) : milestoneLabel(r.triggerMilestone)), 'For when'],
            [(r) => (r.isLocked ? 'Kept on hold by the author' : ''), 'Hold'],
            ['content', 'Letter', { long: true }]
        ],
        consumed: ['recipient_contact_id', 'release_condition', 'status', 'type', 'triggerDate', 'triggerMilestone', 'isLocked']
    },
    {
        key: 'journal_entries', source: 'journal_entries', title: 'Stories, lessons and reflections',
        name: (r) => r.title || humanize(r.type || 'reflection'),
        fields: [
            ['type', 'Kind', { fmt: (v) => humanize(v) }],
            ['created_at', 'Written', { fmt: dateWords }],
            ['tags', 'Tags'],
            ['content', 'In their words', { long: true }]
        ],
        consumed: ['title']
    },
    {
        key: 'time_capsule', source: 'time_capsule', title: 'Time capsule messages',
        name: (r) => r.title,
        fields: [
            ['recipient', 'For'],
            [(r) => (r.trigger_type === 'milestone' ? `Milestone: ${milestoneLabel(r.trigger_value)}` : r.trigger_value ? `On ${dateWords(r.trigger_value)}` : ''), 'Opens'],
            [(r) => (r.is_released ? 'Released' : ''), 'Status'],
            ['created_at', 'Recorded', { fmt: dateWords }],
            ['content_preview', 'Message', { long: true }]
        ],
        consumed: ['trigger_type', 'trigger_value', 'is_released', 'video_url', 'audio_url']
    },
    {
        key: 'visual_memories', source: 'visual_memories', title: 'Photos and videos',
        name: (r) => r.name,
        fields: [['type', 'Kind', { fmt: (v) => humanize(v) }], ['date', 'Date'], ['tags', 'Tags'], ['description', 'Description', { long: true }]],
        consumed: ['url', 'size', 'is_favorite']
    },
    {
        key: 'external_archives', source: 'external_archives', title: 'Photo archives',
        name: (r) => r.platform,
        fields: [['location_details', 'Where and how to reach it', { long: true }], ['access_url', 'Address']],
        consumed: ['platform', 'icon']
    },
    {
        key: 'family_memories', source: 'family_memories', title: 'Family memories',
        name: (r) => r.title,
        fields: [['type', 'Kind', { fmt: (v) => humanize(v) }], ['date', 'Date'], ['author', 'Shared by'], ['desc', 'Description', { long: true }], ['text', 'In their words', { long: true }]],
        consumed: ['is_favorite']
    },
    {
        key: 'calendar_events', source: 'calendar_events', title: 'Important dates',
        name: (r) => r.title,
        fields: [
            ['date', 'Date', { fmt: (v, r) => `${calendarDate(v)}${r.recurring ? ', every year' : ''}` }],
            ['type', 'Kind', { fmt: words }],
            ['description', 'Wish', { long: true }],
            [(r) => (calendarMessage(r.ritual_instructions) ? '' : r.ritual_instructions), 'Ritual', { long: true }],
            [(r) => {
                const m = calendarMessage(r.ritual_instructions);
                return m ? [m.recipient && `To ${m.recipient}`, m.subject, m.body].filter(Boolean).join('\n') : '';
            }, 'Message', { long: true }],
            ['tags', 'Tags']
        ],
        consumed: ['title', 'recurring', 'ritual_instructions']
    },
    {
        key: 'home_access', source: 'home_access', title: 'Home access',
        name: (r) => r.location,
        fields: [['code_encrypted', 'Code'], ['instructions', 'Instructions', { long: true }]]
    },
    {
        key: 'utilities', source: 'utilities', title: 'Utilities',
        name: (r) => r.provider,
        fields: [['service_type', 'Service'], ['account_number', 'Account number'], ['support_phone', 'Support phone'], ['location', 'Location']]
    },
    {
        key: 'vendors', source: 'vendors', title: 'Trusted services',
        name: (r) => r.name,
        fields: [['category', 'Service'], ['phone', 'Phone'], ['email', 'Email'], ['website', 'Website'], ['notes', 'Notes', { long: true }]],
        consumed: ['category']
    },
    {
        key: 'medical_profiles', source: 'medical_profiles', title: 'Medical profile',
        name: () => 'Medical profile',
        keep: (r) => !!(r.organ_donor || r.blood_type || r.allergies),
        fields: [[(r) => (r.organ_donor ? 'Yes' : ''), 'Organ donor'], ['blood_type', 'Blood type'], ['allergies', 'Allergies', { long: true }]],
        consumed: ['organ_donor']
    },
    {
        key: 'medical_directives', source: 'medical_directives', title: 'Medical directives',
        name: (r) => r.title,
        fields: [['type', 'Type', { fmt: (v) => humanize(v) }], ['location_of_original', 'Original kept at'], ['primary_contact', 'Primary contact'], ['contact_phone', 'Contact phone'], ['summary', 'Summary', { long: true }]]
    },
    {
        key: 'timeline_events', source: 'timeline_events', title: 'Life timeline',
        name: (r) => r.label,
        fields: [['year', 'Year'], ['date', 'Date'], ['type', 'Kind', { fmt: (v) => humanize(v) }], ['description', 'Description', { long: true }], ['reflection', 'Reflection', { long: true }], ['impact', 'Impact', { long: true }]],
        consumed: ['is_highlight', 'category', 'label']
    },
    {
        key: 'pets', source: 'pets', title: 'Pets',
        name: (r) => r.name,
        fields: [['type', 'Kind'], ['breed', 'Breed'], ['guardian', 'Guardian'], ['vet_name', 'Vet'], ['vet_phone', 'Vet phone'], ['microchip_number', 'Microchip'], ['food_instructions', 'Food', { long: true }], ['medical_needs', 'Medical needs', { long: true }], ['notes', 'Notes', { long: true }]]
    },
    {
        key: 'subscriptions', source: 'subscriptions', title: 'Recurring services',
        name: (r) => r.name,
        fields: [
            ['cost', 'Cost', { money: true }], [(r) => r.cycle || r.frequency, 'Billed'], ['paymentMethod', 'Paid with'],
            ['nextBilling', 'Next billing'], ['loginUrl', 'Login address'],
            ['cancellationInstructions', 'How to cancel', { long: true }], ['notes', 'Notes', { long: true }]
        ],
        consumed: ['cycle', 'frequency', 'auto_renew', 'renewal_date', 'difficulty']
    },
    {
        key: 'funeral_data', source: 'funeral_data', title: 'Final wishes',
        name: () => 'Final wishes',
        keep: (r) => {
            const w = parseJSON(r.wishes), b = parseJSON(r.budget);
            return text(w) !== '' || (Array.isArray(b) && b.length > 0);
        },
        fields: [],
        consumed: ['wishes', 'budget']
    }
];

const SCOPES: Record<ExportScope, string[] | null> = {
    full: null,
    insurance: ['financial_accounts', 'properties', 'digital_assets', 'heirlooms', 'other_assets', 'insurance_policies'],
    medical: ['medical_profiles', 'medical_directives']
};

function buildFields(def: SectionDef, r: any, title = ''): PacketField[] {
    const out: PacketField[] = [];
    const used = new Set<string>([...(def.consumed || [])]);
    for (const [key, label, opts] of def.fields) {
        const raw = typeof key === 'function' ? key(r) : r[key];
        if (typeof key === 'string') used.add(key);
        if (!has(raw) || isFileValue(raw)) continue;
        const value = opts?.fmt ? opts.fmt(raw, r) : opts?.money ? money(raw) : text(raw);
        if (value !== '') out.push({ label, value, long: opts?.long });
    }
    if (def.key === 'funeral_data') {
        const w = parseJSON(r.wishes);
        if (w && typeof w === 'object' && !Array.isArray(w)) {
            for (const [k, v] of Object.entries(w)) {
                const t = text(v);
                if (t) out.push({ label: humanize(k), value: t, long: t.length > 80 });
            }
        }
        const b = parseJSON(r.budget);
        if (Array.isArray(b) && b.length) out.push({ label: 'Budget', value: b.map(text).join('\n'), long: true });
    }
    // Everything else the record holds, so no entered detail is left out of the packet.
    for (const [k, v] of Object.entries(r)) {
        if (used.has(k) || ALWAYS_SKIP.has(k) || !has(v) || isFileValue(v)) continue;
        if (typeof v === 'boolean' && !v) continue;
        const t = text(v);
        if (t && t !== title) out.push({ label: humanize(k), value: t, long: t.length > 80 }); // the card title is said once
    }
    // Custom fields the owner added (their own keys, kept as written).
    const custom = parseJSON(r.custom_attributes);
    if (custom && typeof custom === 'object' && !Array.isArray(custom)) {
        for (const [k, v] of Object.entries(custom)) {
            if (k.startsWith('_')) continue; // held by the app itself (e.g. _media: the attached file)
            const t = text(v);
            if (t) out.push({ label: k, value: t, long: t.length > 80 });
        }
    }
    return out;
}

export function buildPacket(snapshot: Snapshot, scope: ExportScope = 'full'): Packet {
    const allowed = SCOPES[scope];
    const byRecord = new Map<string, SnapshotAttachment[]>();
    for (const a of snapshot.attachments) {
        for (const ref of a.records) {
            const k = `${ref.section}:${ref.id}`;
            const list = byRecord.get(k) ?? [];
            if (!list.includes(a)) list.push(a);
            byRecord.set(k, list);
        }
    }

    const sections: PacketSection[] = [];
    const used: SnapshotAttachment[] = [];
    for (const def of SECTIONS) {
        if (allowed && !allowed.includes(def.key)) continue;
        let rows = snapshot.sections[def.source] ?? [];
        if (def.filter) rows = rows.filter(def.filter);
        if (def.keep) rows = rows.filter(def.keep);
        if (rows.length === 0) continue; // empty sections are left out
        const records = rows.map((r) => {
            const id = def.source === 'medical_profiles' ? 'profile' : r.id;
            const attachments = byRecord.get(`${def.source}:${id}`) ?? [];
            for (const a of attachments) if (!used.includes(a)) used.push(a);
            const title = text(def.name(r)) || def.title;
            return {
                section: def.source,
                id,
                title,
                fields: buildFields(def, r, title),
                attachments
            };
        });
        sections.push({ key: def.key, title: def.title, summary: def.summary ? def.summary(rows) : [], records });
    }

    const o = snapshot.owner || {};
    const contacts = snapshot.sections.contacts ?? [];
    const executors = [
        ...(o.executor_name ? [String(o.executor_name)] : []),
        ...contacts.filter((c) => isExecutorContact(c, o.executor_name)).map((c) => String(c.name))
    ].filter((n, i, a) => n && a.indexOf(n) === i);

    return {
        // The name the owner gave (estate profile, else the account's name); never the sign-in email.
        ownerName: String(o.owner_name || o.display_name || '').trim(),
        executors,
        generatedAt: snapshot.generated_at,
        sections,
        attachments: used
    };
}

// ---------------------------------------------------------------------------
// Files
// ---------------------------------------------------------------------------

const EXT: Record<string, string> = {
    'application/pdf': 'pdf', 'image/jpeg': 'jpg', 'image/png': 'png', 'image/gif': 'gif', 'image/webp': 'webp',
    'image/heic': 'heic', 'video/mp4': 'mp4', 'video/webm': 'webm', 'video/quicktime': 'mov', 'audio/mpeg': 'mp3',
    'audio/webm': 'webm', 'audio/wav': 'wav', 'audio/ogg': 'ogg', 'audio/mp4': 'm4a', 'text/plain': 'txt', 'text/csv': 'csv'
};

const safeName = (s: string) => s.replace(/[^\w.\- ]+/g, '_').replace(/\s+/g, ' ').trim().slice(0, 100) || 'file';

/** Where an attachment sits inside the download copy. */
export function attachmentPath(a: SnapshotAttachment): string {
    const ref = a.records[0];
    const section = ref?.section || 'files';
    if (a.source === 'media') return `files/${section}/${a.media_id}-${safeName(a.filename || 'file')}`;
    return `files/${section}/${ref?.id}-${safeName(ref?.field || 'file')}.${EXT[a.mime_type] || 'bin'}`;
}

function dataUrlBlob(value: string): Blob {
    const comma = value.indexOf(',');
    const head = value.slice(5, comma);
    const body = value.slice(comma + 1);
    const mime = head.split(';')[0] || 'text/plain';
    if (/;base64/i.test(head)) {
        const bin = atob(body);
        const bytes = new Uint8Array(bin.length);
        for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
        return new Blob([bytes], { type: mime });
    }
    return new Blob([decodeURIComponent(body)], { type: mime });
}

/**
 * The actual bytes of every attachment the packet shows. Stored files come from the
 * media API (the owner's token by default; D2 can pass a token-scoped fetcher); files
 * kept inside a record (data: URLs) come from the snapshot itself.
 */
export async function loadAttachmentFiles(
    snapshot: Snapshot,
    attachments: SnapshotAttachment[],
    fetchBlob: (a: SnapshotAttachment) => Promise<Blob> = (a) => fetchMediaBlob(a.media_id as number),
    onProgress: (msg: string) => void = () => { }
): Promise<Map<string, Blob>> {
    const out = new Map<string, Blob>();
    let n = 0;
    await Promise.all(attachments.map(async (a) => {
        try {
            if (a.source === 'media') {
                out.set(a.key, await fetchBlob(a));
            } else {
                const ref = a.records[0];
                const row = (snapshot.sections[ref.section] ?? []).find((r) => String(r.id) === String(ref.id));
                const v = row?.[ref.field];
                if (typeof v === 'string') out.set(a.key, dataUrlBlob(v));
            }
        } catch (e) {
            console.warn('[export] Attachment is taking a moment to open', a.key, e);
        }
        onProgress(`Gathering files (${++n} of ${attachments.length})...`);
    }));
    return out;
}

// ---------------------------------------------------------------------------
// HTML packet (binder screen, print/PDF, and packet.html in the download copy)
// ---------------------------------------------------------------------------

const esc = (s: any) =>
    String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string));

const fmtSize = (b: number) => (b >= 1048576 ? `${(b / 1048576).toFixed(1)} MB` : b >= 1024 ? `${Math.round(b / 1024)} KB` : `${b} bytes`);

const fmtDate = (iso: string) => dateWords(iso);

export const PACKET_CSS = `
.cx-packet{font-family:Georgia,'Times New Roman',serif;color:#1c1917;line-height:1.55}
.cx-packet .cx-page{padding:56px 64px;border-bottom:1px solid #e7e5e4}
.cx-packet .cx-cover{border-bottom:4px solid #304743;min-height:520px;display:flex;flex-direction:column;justify-content:space-between}
.cx-packet .cx-kicker{letter-spacing:.2em;text-transform:uppercase;font:700 13px system-ui,sans-serif;color:#304743}
.cx-packet h1{font-size:52px;line-height:1.1;color:#304743;margin:16px 0 20px}
.cx-packet .cx-rule{width:96px;height:8px;background:#D4AF37}
.cx-packet .cx-meta{display:grid;grid-template-columns:1fr 1fr;gap:32px;margin-top:48px}
.cx-packet .cx-meta h3,.cx-packet .cx-label{font:700 12px system-ui,sans-serif;text-transform:uppercase;letter-spacing:.06em;color:#57534e;margin:0 0 4px}
.cx-packet h2{font-size:28px;color:#304743;margin:0 0 20px}
.cx-packet .cx-toc li{font-size:18px;margin:6px 0}
.cx-packet .cx-summary{display:flex;flex-wrap:wrap;gap:12px 32px;margin:0 0 24px;padding:16px 20px;background:#f5f5f4;border-radius:12px}
.cx-packet .cx-summary div{font-size:18px}
.cx-packet .cx-record{margin:0 0 20px;padding:20px 24px;border:1px solid #e7e5e4;border-radius:12px;break-inside:avoid}
.cx-packet .cx-record h3{font-size:21px;margin:0 0 12px;color:#1c1917}
.cx-packet .cx-fields{display:grid;grid-template-columns:200px 1fr;gap:6px 16px;margin:0}
.cx-packet .cx-fields dt{font:600 13px system-ui,sans-serif;color:#57534e;padding-top:3px}
.cx-packet .cx-fields dd{margin:0;font-size:16px;white-space:pre-wrap;overflow-wrap:anywhere}
.cx-packet .cx-long{margin:12px 0 0}
.cx-packet .cx-long dt{font:600 13px system-ui,sans-serif;color:#57534e}
.cx-packet .cx-long dd{margin:4px 0 0;font-size:16px;white-space:pre-wrap;overflow-wrap:anywhere}
.cx-packet .cx-files{margin-top:14px;display:flex;flex-direction:column;gap:10px}
.cx-packet .cx-files img{max-width:360px;max-height:280px;border-radius:8px;display:block}
.cx-packet .cx-files video{max-width:480px;border-radius:8px;display:block}
.cx-packet .cx-file-name{font:13px system-ui,sans-serif;color:#57534e}
.cx-packet a{color:#304743}
.cx-packet .cx-id{font:12px system-ui,sans-serif;color:#78716c;margin-left:8px}
@media print{.cx-packet .cx-page{break-after:page;border:none}.cx-packet .cx-page:last-child{break-after:auto}.cx-packet .cx-record{border-color:#d6d3d1;break-inside:avoid}.cx-packet h2,.cx-packet h3{break-after:avoid}.cx-packet .cx-files video,.cx-packet .cx-files audio{display:none}}
`;

function fileBlock(a: SnapshotAttachment, url: string | null): string {
    const name = esc(a.filename || attachmentPath(a).split('/').pop());
    const caption = `<div class="cx-file-name">${name} · ${esc(fmtSize(a.file_size))}${url ? ` · <a href="${esc(url)}" download="${name}" target="_blank" rel="noopener">Open this file</a>` : ''}</div>`;
    if (!url) return caption;
    if (a.mime_type.startsWith('image/')) return `<img src="${esc(url)}" alt="${name}">${caption}`;
    if (a.mime_type.startsWith('video/')) return `<video src="${esc(url)}" controls preload="metadata"></video>${caption}`;
    if (a.mime_type.startsWith('audio/')) return `<audio src="${esc(url)}" controls></audio>${caption}`;
    return caption;
}

/** The packet as HTML. `urlFor` gives each attachment's address (a blob URL on screen, a path in the zip). */
export function packetHTML(packet: Packet, urlFor: (a: SnapshotAttachment) => string | null = () => null): string {
    const parts: string[] = [`<style>${PACKET_CSS}</style>`];
    parts.push(`<section class="cx-page cx-cover"><div>${packet.ownerName ? `<div class="cx-kicker">The estate of</div><h1>${esc(packet.ownerName)}</h1>` : '<h1>The Red Binder</h1>'}<div class="cx-rule"></div></div>
<div class="cx-meta"><div><h3>Prepared</h3><p>${esc(fmtDate(packet.generatedAt))}</p></div>${packet.executors.length ? `<div><h3>Executor</h3><p>${packet.executors.map(esc).join('<br>')}</p></div>` : ''}</div></section>`);
    parts.push(`<section class="cx-page"><h2>Contents</h2><ol class="cx-toc">${packet.sections
        .map((s) => `<li><a href="#cx-${esc(s.key)}">${esc(s.title)}</a> <span class="cx-id">${s.records.length}</span></li>`)
        .join('')}</ol></section>`);
    for (const s of packet.sections) {
        parts.push(`<section class="cx-page" id="cx-${esc(s.key)}" data-section="${esc(s.key)}"><h2>${esc(s.title)}</h2>`);
        if (s.summary.length) {
            parts.push(`<div class="cx-summary">${s.summary.map((f) => `<div><div class="cx-label">${esc(f.label)}</div>${esc(f.value)}</div>`).join('')}</div>`);
        }
        for (const r of s.records) {
            // Short details in a two-column grid; long text as plain blocks so it flows across printed pages.
            const short = r.fields.filter((f) => !f.long);
            const long = r.fields.filter((f) => f.long);
            parts.push(`<article class="cx-record" data-record="${esc(r.section)}:${esc(r.id)}"><h3>${esc(r.title)}</h3>${short.length
                ? `<dl class="cx-fields">${short.map((f) => `<dt>${esc(f.label)}</dt><dd>${esc(f.value)}</dd>`).join('')}</dl>`
                : ''}${long.map((f) => `<dl class="cx-long"><dt>${esc(f.label)}</dt><dd>${esc(f.value)}</dd></dl>`).join('')}${r.attachments.length ? `<div class="cx-files">${r.attachments.map((a) => fileBlock(a, urlFor(a))).join('')}</div>` : ''}</article>`);
        }
        parts.push(`</section>`);
    }
    return `<div class="cx-packet">${parts.join('\n')}</div>`;
}

// ---------------------------------------------------------------------------
// PDF packet
// ---------------------------------------------------------------------------

/** jsPDF's built-in fonts cover Latin-1; map common typography to it so words stay readable. */
const latin1 = (s: string) =>
    s.replace(/[‘’]/g, "'").replace(/[“”]/g, '"').replace(/[–—]/g, '-')
        .replace(/…/g, '...').replace(/·/g, '-').replace(/[^\x00-\xFF\n]/g, '?');

const blobToDataUrl = (b: Blob) =>
    new Promise<string>((resolve, reject) => {
        const r = new FileReader();
        r.onload = () => resolve(String(r.result));
        r.onerror = () => reject(r.error);
        r.readAsDataURL(b);
    });

export function packetPDF(packet: Packet, images: Map<string, string> = new Map()): Blob {
    const doc = new jsPDF({ unit: 'pt', format: 'letter' });
    const W = doc.internal.pageSize.getWidth();
    const H = doc.internal.pageSize.getHeight();
    const M = 54;
    let y = M;
    const need = (h: number) => {
        if (y + h > H - M) { doc.addPage(); y = M; }
    };
    const write = (s: string, size: number, opts: { bold?: boolean; color?: number; indent?: number; gap?: number } = {}) => {
        doc.setFont('helvetica', opts.bold ? 'bold' : 'normal');
        doc.setFontSize(size);
        doc.setTextColor(opts.color ?? 28);
        const lines: string[] = doc.splitTextToSize(latin1(s), W - 2 * M - (opts.indent ?? 0));
        const lh = size * 1.35;
        for (const line of lines) {
            need(lh);
            doc.text(line, M + (opts.indent ?? 0), y + size);
            y += lh;
        }
        y += opts.gap ?? 0;
    };

    // Cover
    y = 200;
    if (packet.ownerName) {
        write('THE ESTATE OF', 12, { bold: true, color: 48, gap: 8 });
        write(packet.ownerName, 32, { bold: true, color: 48, gap: 24 });
    } else {
        // No name given: the binder's own name, so the cover still has a title (card X144).
        write('The Red Binder', 32, { bold: true, color: 48, gap: 24 });
    }
    write(`Prepared ${fmtDate(packet.generatedAt)}`, 13, { color: 90, gap: 6 });
    if (packet.executors.length) write(`Executor: ${packet.executors.join(', ')}`, 13, { color: 90 });

    // Contents
    doc.addPage(); y = M;
    write('Contents', 22, { bold: true, color: 48, gap: 10 });
    packet.sections.forEach((s, i) => write(`${i + 1}. ${s.title} (${s.records.length})`, 13, { gap: 2 }));

    for (const s of packet.sections) {
        doc.addPage(); y = M;
        write(s.title, 22, { bold: true, color: 48, gap: 8 });
        if (s.summary.length) write(s.summary.map((f) => `${f.label}: ${f.value}`).join('    '), 12, { color: 60, gap: 12 });
        for (const r of s.records) {
            need(60);
            write(r.title, 15, { bold: true, gap: 4 });
            for (const f of r.fields) {
                if (f.long) {
                    write(f.label, 10, { bold: true, color: 90, indent: 12 });
                    write(f.value, 11, { indent: 12, gap: 4 });
                } else {
                    write(`${f.label}: ${f.value}`, 11, { indent: 12, gap: 1 });
                }
            }
            for (const a of r.attachments) {
                const img = images.get(a.key);
                if (img && /^data:image\/(jpeg|jpg|png)/i.test(img)) {
                    try {
                        const p = doc.getImageProperties(img);
                        const w = Math.min(240, p.width);
                        const h = (p.height / p.width) * w;
                        need(h + 8);
                        doc.addImage(img, M + 12, y, w, h);
                        y += h + 6;
                    } catch {
                        // the file is listed below and kept in the download copy
                    }
                }
                write(`File: ${a.filename || attachmentPath(a).split('/').pop()} (${fmtSize(a.file_size)}), in the download copy at ${attachmentPath(a)}`, 10, { color: 90, indent: 12, gap: 2 });
            }
            y += 12;
        }
    }
    return doc.output('blob');
}

async function imageDataUrls(files: Map<string, Blob>, attachments: SnapshotAttachment[]): Promise<Map<string, string>> {
    const out = new Map<string, string>();
    for (const a of attachments) {
        const b = files.get(a.key);
        if (b && /^image\/(jpeg|jpg|png)$/i.test(a.mime_type)) out.set(a.key, await blobToDataUrl(b));
    }
    return out;
}

/** The packet as a PDF file (export preview page). */
export async function createPDFBlob(
    scope: ExportScope,
    includeImages: boolean,
    onProgress: (msg: string) => void = () => { },
    snapshot?: Snapshot
): Promise<Blob> {
    onProgress('Gathering your records...');
    const snap = snapshot ?? (await fetchSnapshot());
    const packet = buildPacket(snap, scope);
    let images = new Map<string, string>();
    if (includeImages) {
        const imgs = packet.attachments.filter((a) => /^image\/(jpeg|jpg|png)$/i.test(a.mime_type));
        images = await imageDataUrls(await loadAttachmentFiles(snap, imgs, undefined, onProgress), imgs);
    }
    onProgress('Writing the pages...');
    return packetPDF(packet, images);
}

export function saveBlob(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function generatePDF(scope: ExportScope, includeImages: boolean, onProgress: (msg: string) => void): Promise<void> {
    saveBlob(await createPDFBlob(scope, includeImages, onProgress), 'Continuum_packet.pdf');
}

// ---------------------------------------------------------------------------
// Download copy (zip)
// ---------------------------------------------------------------------------

const CRC_TABLE = (() => {
    const t = new Uint32Array(256);
    for (let n = 0; n < 256; n++) {
        let c = n;
        for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
        t[n] = c >>> 0;
    }
    return t;
})();

function crc32(bytes: Uint8Array): number {
    let c = 0xffffffff;
    for (let i = 0; i < bytes.length; i++) c = CRC_TABLE[(c ^ bytes[i]) & 0xff] ^ (c >>> 8);
    return (c ^ 0xffffffff) >>> 0;
}

/** A plain (stored, uncompressed) zip: every file is kept byte for byte. */
function makeZip(entries: { path: string; data: Uint8Array }[]): Blob {
    const enc = new TextEncoder();
    const parts: BlobPart[] = [];
    const central: Uint8Array[] = [];
    let offset = 0;
    const now = new Date();
    const dosTime = (now.getHours() << 11) | (now.getMinutes() << 5) | Math.floor(now.getSeconds() / 2);
    const dosDate = ((now.getFullYear() - 1980) << 9) | ((now.getMonth() + 1) << 5) | now.getDate();
    for (const e of entries) {
        const name = enc.encode(e.path);
        const crc = crc32(e.data);
        const size = e.data.length;
        const local = new DataView(new ArrayBuffer(30));
        local.setUint32(0, 0x04034b50, true);
        local.setUint16(4, 20, true);
        local.setUint16(6, 0x0800, true); // UTF-8 names
        local.setUint16(8, 0, true); // stored
        local.setUint16(10, dosTime, true);
        local.setUint16(12, dosDate, true);
        local.setUint32(14, crc, true);
        local.setUint32(18, size, true);
        local.setUint32(22, size, true);
        local.setUint16(26, name.length, true);
        local.setUint16(28, 0, true);
        parts.push(local.buffer, name, e.data as BlobPart);

        const cd = new DataView(new ArrayBuffer(46));
        cd.setUint32(0, 0x02014b50, true);
        cd.setUint16(4, 20, true);
        cd.setUint16(6, 20, true);
        cd.setUint16(8, 0x0800, true);
        cd.setUint16(10, 0, true);
        cd.setUint16(12, dosTime, true);
        cd.setUint16(14, dosDate, true);
        cd.setUint32(16, crc, true);
        cd.setUint32(20, size, true);
        cd.setUint32(24, size, true);
        cd.setUint16(28, name.length, true);
        cd.setUint32(42, offset, true);
        const rec = new Uint8Array(46 + name.length);
        rec.set(new Uint8Array(cd.buffer), 0);
        rec.set(name, 46);
        central.push(rec);
        offset += 30 + name.length + size;
    }
    const cdSize = central.reduce((s, c) => s + c.length, 0);
    const end = new DataView(new ArrayBuffer(22));
    end.setUint32(0, 0x06054b50, true);
    end.setUint16(8, entries.length, true);
    end.setUint16(10, entries.length, true);
    end.setUint32(12, cdSize, true);
    end.setUint32(16, offset, true);
    parts.push(...(central as BlobPart[]), end.buffer);
    return new Blob(parts, { type: 'application/zip' });
}

async function sha256(bytes: Uint8Array): Promise<string> {
    const h = await crypto.subtle.digest('SHA-256', bytes as BufferSource);
    return Array.from(new Uint8Array(h)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * The download copy: packet.html (opens in any browser, files beside it), packet.pdf,
 * every attachment file as stored, snapshot.json (the records) and manifest.json
 * (each file with its size, SHA-256 and the record it belongs to).
 */
export async function buildDownloadCopy(
    snapshot: Snapshot,
    onProgress: (msg: string) => void = () => { },
    files?: Map<string, Blob>,
    fetchBlob?: (a: SnapshotAttachment) => Promise<Blob>
): Promise<Blob> {
    const packet = buildPacket(snapshot, 'full');
    const blobs = files ?? (await loadAttachmentFiles(snapshot, packet.attachments, fetchBlob, onProgress));
    const enc = new TextEncoder();
    const entries: { path: string; data: Uint8Array }[] = [];
    const manifestFiles: any[] = [];
    const titleOf = new Map<string, string>();
    for (const s of packet.sections) for (const r of s.records) titleOf.set(`${r.section}:${r.id}`, r.title);

    onProgress('Packing your files...');
    const included = packet.attachments.filter((a) => blobs.has(a.key));
    for (const a of included) {
        const data = new Uint8Array(await (blobs.get(a.key) as Blob).arrayBuffer());
        const path = attachmentPath(a);
        entries.push({ path, data });
        manifestFiles.push({
            path,
            filename: a.filename ?? path.split('/').pop(),
            mime_type: a.mime_type,
            size: data.length,
            sha256: await sha256(data),
            media_id: a.media_id ?? null,
            records: a.records.map((r) => ({ ...r, title: titleOf.get(`${r.section}:${r.id}`) ?? '' }))
        });
    }

    onProgress('Writing the packet...');
    const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${packet.ownerName ? `The estate of ${esc(packet.ownerName)}` : 'Continuum'}</title></head><body style="margin:0;background:#fff">${packetHTML(packet, (a) => (blobs.has(a.key) ? attachmentPath(a) : null))}</body></html>`;
    entries.unshift({ path: 'packet.html', data: enc.encode(html) });
    const images = await imageDataUrls(blobs, included);
    entries.splice(1, 0, { path: 'packet.pdf', data: new Uint8Array(await packetPDF(packet, images).arrayBuffer()) });

    // The records as recorded; files kept inside a record point at their copy in files/.
    const records: Record<string, any[]> = {};
    for (const [k, rows] of Object.entries(snapshot.sections)) {
        records[k] = rows.map((r) => {
            const copy = { ...r };
            for (const a of included) {
                if (a.source !== 'inline') continue;
                for (const ref of a.records) if (ref.section === k && String(ref.id) === String(r.id)) copy[ref.field] = attachmentPath(a);
            }
            return copy;
        });
    }
    entries.push({ path: 'snapshot.json', data: enc.encode(JSON.stringify({ ...snapshot, sections: records }, null, 2)) });
    entries.push({
        path: 'manifest.json',
        data: enc.encode(JSON.stringify({
            generated_at: snapshot.generated_at,
            owner: packet.ownerName,
            packet: ['packet.html', 'packet.pdf'],
            sections: packet.sections.map((s) => ({ key: s.key, title: s.title, records: s.records.map((r) => ({ section: r.section, id: r.id, title: r.title })) })),
            files: manifestFiles,
            files_to_retry: packet.attachments.filter((a) => !blobs.has(a.key)).map((a) => ({ key: a.key, filename: a.filename, records: a.records })),
            missing_attachments: snapshot.missing_attachments
        }, null, 2))
    });
    return makeZip(entries);
}
