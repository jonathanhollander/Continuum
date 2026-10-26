import {
    LayoutDashboard,
    BarChart3,
    History,
    Wallet,
    Home,
    Shield,
    Receipt,
    Activity,
    Files,
    Hammer,
    Heart,
    Dog,
    BookOpen,
    Gift,
    Calendar,
    Box,
    Users,
    Scroll,
    Briefcase,
    QrCode,
    ShieldCheck,
    Sparkles,
    Library,
    Siren,
    Image,
    Info,
    MessageSquare,
    Settings,
    Database,
    Star,
    Zap,
    Compass,
    ArrowRight,
    Search,
    Key,
    Stethoscope,
    Building2,
    MapPin,
    Eye,
    LifeBuoy
} from "lucide-svelte";

export type UserRole = "Owner" | "Executor" | "Family";

export type NavItem = {
    label: string;
    key: string;
    href: string;
    icon: any;
    allowedRoles: UserRole[];
    isExecutorEssential?: boolean;
    isQuickStart?: boolean;
    isCoreAction?: boolean;
    isExternal?: boolean;
    tooltip?: string;
    // Shows an "Early preview" tag next to the item (card E2).
    isPreview?: boolean;
};

export type NavGroup = {
    groupLabel: string;
    groupKey: string;
    groupDescription?: string;
    isCollapsedByDefault?: boolean;
    isPrimary?: boolean;
    items: NavItem[];
};

// ===========================================
// ESTATE PLANNING NAVIGATION (card E1, CU-018)
// ===========================================
// Legacy and finances first: after the Dashboard come My Legacy, My Finances,
// My Instructions and the owner's preview of their recipient's start page
// (recipientPreviewEntry, rendered by the sidebar after "My Instructions").
// Labels are the English names; each matches its page heading where the
// heading is a name. Other languages read `dictionary.ts` by item key.

export const navGroups: NavGroup[] = [
    {
        groupLabel: "Estate Overview",
        groupKey: "groupOverview",
        isPrimary: true,
        items: [
            {
                label: "Dashboard",
                key: "dashboard",
                href: "/dashboard",
                icon: LayoutDashboard,
                allowedRoles: ["Owner", "Executor", "Family"],
                isQuickStart: true,
                tooltip: "Your central hub for estate progress and status"
            },
        ],
    },
    {
        groupLabel: "My Legacy",
        groupKey: "groupMyLegacy",
        groupDescription: "Letters, memories, and treasures",
        items: [
            {
                label: "Legacy Correspondence",
                key: "letters",
                href: "/modules/letters",
                icon: Heart,
                allowedRoles: ["Owner", "Executor", "Family"],
                tooltip: "Leave meaningful messages for the future"
            },
            {
                label: "Heirlooms & Treasures",
                key: "heirlooms",
                href: "/modules/heirlooms",
                icon: Gift,
                allowedRoles: ["Owner", "Executor", "Family"],
                tooltip: "Items with special meaning and their stories"
            },
            {
                label: "Legacy Journal",
                key: "journal",
                href: "/modules/legacy-journal",
                icon: BookOpen,
                allowedRoles: ["Owner", "Executor", "Family"],
                tooltip: "Your story, in your own words"
            },
            {
                label: "Visual Memories",
                key: "visual-memories",
                href: "/modules/visual-memories",
                icon: Image,
                allowedRoles: ["Owner", "Executor", "Family"],
                tooltip: "Photos and videos, and where the rest are kept"
            },
            {
                label: "Time Capsule Vault",
                key: "capsule",
                href: "/modules/time-capsule",
                icon: Box,
                allowedRoles: ["Owner", "Executor", "Family"],
                tooltip: "Messages that open on a date or a milestone"
            },
            {
                label: "The Life Timeline",
                key: "timeline",
                href: "/modules/timeline",
                icon: Calendar,
                allowedRoles: ["Owner", "Executor", "Family"],
                tooltip: "The milestones of your life"
            },
        ],
    },
    {
        groupLabel: "My Finances",
        groupKey: "groupFinances",
        groupDescription: "Accounts, insurance, and property",
        isCollapsedByDefault: true,
        items: [
            {
                label: "Financial Accounts",
                key: "financial",
                href: "/modules/financial-accounts",
                icon: Wallet,
                allowedRoles: ["Owner", "Executor"],
                isExecutorEssential: true,
                isCoreAction: true,
                tooltip: "A place for your bank accounts and investments"
            },
            {
                label: "Insurance Portfolio",
                key: "insurance",
                href: "/modules/insurance",
                icon: Shield,
                allowedRoles: ["Owner", "Executor"],
                isExecutorEssential: true,
                isCoreAction: true,
                tooltip: "Policies that protect the people you love"
            },
            {
                label: "Property & Real Estate",
                key: "property",
                href: "/modules/property",
                icon: Building2,
                allowedRoles: ["Owner", "Executor"],
                isExecutorEssential: true,
                tooltip: "Real estate deeds and property details"
            },
            {
                label: "Subscriptions & Services",
                key: "subscriptions",
                href: "/modules/subscriptions",
                icon: Receipt,
                allowedRoles: ["Owner", "Executor"],
                tooltip: "Recurring payments and memberships your family may want to review"
            },
            {
                label: "Digital Guardian",
                key: "guardian",
                href: "/modules/digital-guardian",
                icon: Shield,
                allowedRoles: ["Owner", "Executor"],
                tooltip: "Online accounts, passwords, and digital life"
            },
        ],
    },
    {
        groupLabel: "My Instructions",
        groupKey: "groupInstructions",
        groupDescription: "Documents, care, and wishes",
        isCollapsedByDefault: true,
        items: [
            {
                label: "Document Vault",
                key: "documents",
                href: "/modules/legal-documents",
                icon: Files,
                allowedRoles: ["Owner", "Executor"],
                isExecutorEssential: true,
                isCoreAction: true,
                tooltip: "Wills, trusts, and the legal papers that matter"
            },
            {
                label: "Health & Medical",
                key: "medical",
                href: "/modules/medical",
                icon: Stethoscope,
                allowedRoles: ["Owner", "Executor", "Family"],
                isExecutorEssential: true,
                isCoreAction: true,
                tooltip: "Medical directives and healthcare wishes"
            },
            {
                label: "The Home Operating Manual",
                key: "home-manual",
                href: "/modules/home-manual",
                icon: Key,
                allowedRoles: ["Owner", "Executor", "Family"],
                isExecutorEssential: true,
                isCoreAction: true,
                tooltip: "Access codes, spare keys, and home details"
            },
            {
                label: "Final Wishes",
                key: "funeral",
                href: "/modules/funeral",
                icon: Scroll,
                allowedRoles: ["Owner", "Executor", "Family"],
                tooltip: "How you would like to be honored"
            },
            {
                label: "Pet Care",
                key: "pets",
                href: "/modules/pets",
                icon: Dog,
                allowedRoles: ["Owner", "Executor", "Family"],
                tooltip: "Care instructions for your furry friends"
            },
            {
                label: "The Red Binder",
                key: "binder",
                href: "/binder",
                icon: Activity,
                allowedRoles: ["Owner", "Executor"],
                tooltip: "A printed copy of your plan to keep close"
            },
        ],
    },
    {
        groupLabel: "People & Check-ins",
        groupKey: "groupPeople",
        groupDescription: "The people you trust",
        isCollapsedByDefault: true,
        items: [
            {
                label: "Family & Contacts",
                key: "contacts",
                href: "/modules/contacts",
                icon: Users,
                allowedRoles: ["Owner", "Executor", "Family"],
                isExecutorEssential: true,
                isCoreAction: true,
                tooltip: "Key contacts, advisors, and family members"
            },
            {
                label: "Family Hub",
                key: "family-hub",
                href: "/modules/family-hub",
                icon: Users,
                allowedRoles: ["Owner", "Executor", "Family"],
                tooltip: "Your family network and connections"
            },
            {
                label: "Wellness Check-in",
                key: "pulse",
                isPreview: true,
                href: "/modules/pulse",
                icon: Heart,
                allowedRoles: ["Owner", "Executor", "Family"],
                isCoreAction: true,
                tooltip: "Let loved ones know you're okay"
            },
        ],
    },
    {
        groupLabel: "Extras",
        groupKey: "groupExtras",
        groupDescription: "Additional tools and features",
        isCollapsedByDefault: true,
        items: [
            {
                label: "Explore All Features",
                key: "catalog",
                href: "/catalog",
                icon: Compass,
                allowedRoles: ["Owner", "Executor", "Family"],
                tooltip: "Browse all available Continuum modules"
            },
            {
                label: "Future Scenarios",
                key: "scenario",
                isPreview: true,
                href: "/modules/scenario-mode",
                icon: Compass,
                allowedRoles: ["Owner"],
                tooltip: "Visualize and plan for different futures"
            },
            {
                label: "Event Calendar",
                key: "calendar",
                href: "/modules/calendar",
                icon: Calendar,
                allowedRoles: ["Owner", "Executor", "Family"],
                tooltip: "Important dates and milestones"
            },
            {
                label: "Executor Guide",
                key: "executor",
                href: "/modules/executor-toolkit",
                icon: Briefcase,
                allowedRoles: ["Owner", "Executor"],
                tooltip: "Step-by-step help for the person settling the estate"
            },
            {
                label: "Your Full Record",
                key: "advanced-registry",
                href: "/modules/advanced-registry",
                icon: Database,
                allowedRoles: ["Owner", "Executor"],
                tooltip: "Everything you have recorded, in one place"
            },
            {
                label: "Builder Tools",
                key: "builders",
                isPreview: true,
                href: "/modules/builders-console",
                icon: Hammer,
                allowedRoles: ["Owner"],
                tooltip: "Customize how Continuum works for you"
            },
            {
                label: "Treasure Hunt",
                key: "treasurehunt",
                isPreview: true,
                href: "/modules/treasure-hunt",
                icon: MapPin,
                allowedRoles: ["Owner", "Executor", "Family"],
                tooltip: "A gentle guide to finding what matters"
            },
            {
                label: "Settings",
                key: "settings",
                href: "/settings",
                icon: Settings,
                allowedRoles: ["Owner", "Executor", "Family"],
                tooltip: "Your account and preferences"
            },
        ],
    },
];

// The owner's preview of the start page their recipient opens (card D2). The sidebar
// shows it after "My Instructions" and points it at /for/preview/<contactId> once a
// contact is marked as a recipient; until then it opens Family & Contacts, where a
// recipient is chosen. Kept out of navGroups so the dashboard grid, the data settings
// cards and the role guard see only modules.
export const recipientPreviewAfterGroup = "groupInstructions";
export const recipientPreviewEntry: NavItem = {
    label: "For My Son (preview)",
    key: "recipient-preview",
    href: "/modules/contacts",
    icon: Eye,
    allowedRoles: ["Owner"],
    tooltip: "You can choose who receives a start page of their own in Family & Contacts",
};

// Help & Resources (G0e U-f). The sidebar lists it at the end of Extras and the Command
// Center finds it; kept out of navGroups (like the recipient preview) so the dashboard grid
// and the data settings cards see only modules.
export const helpAfterGroup = "groupExtras";
export const helpEntry: NavItem = {
    label: "Help & Resources",
    key: "help",
    href: "/help",
    icon: LifeBuoy,
    allowedRoles: ["Owner", "Executor", "Family"],
    tooltip: "Guides and answers, whenever you need them",
};

// Pulse sub-navigation (shown when in Pulse section)
export const pulseSubNav: NavItem[] = [
    {
        label: "Overview",
        key: "pulseDashboard",
        href: "/modules/pulse",
        icon: Heart,
        allowedRoles: ["Owner", "Executor", "Family"],
    },
    {
        label: "The Vault",
        key: "pulseVault",
        href: "/modules/pulse/vault",
        icon: ShieldCheck,
        allowedRoles: ["Owner"],
    },
    {
        label: "Data Transparency",
        key: "pulseTransparency",
        href: "/modules/pulse/transparency",
        icon: Info,
        allowedRoles: ["Owner", "Executor", "Family"],
    },
    {
        label: "Message Hub",
        key: "pulseMessages",
        href: "/modules/pulse/messages",
        icon: MessageSquare,
        allowedRoles: ["Owner", "Executor", "Family"],
    },
    {
        label: "Check-in History",
        key: "pulseHistory",
        href: "/modules/pulse/history",
        icon: History,
        allowedRoles: ["Owner", "Executor"],
    },
    {
        label: "Trusted Contacts",
        key: "pulseContacts",
        href: "/modules/pulse/contacts",
        icon: Users,
        allowedRoles: ["Owner"],
    },
    {
        label: "Escalation Plan",
        key: "pulseEscalation",
        href: "/modules/pulse/escalation",
        icon: Activity,
        allowedRoles: ["Owner"],
    },
    {
        label: "Pulse Configuration",
        key: "pulseSettings",
        href: "/modules/pulse/settings",
        icon: Settings,
        allowedRoles: ["Owner"],
    },
];

// ===========================================
// CATALOG CATEGORIES - Legacy & Tools
// ===========================================
// These appear in the catalog discovery page

export type CatalogCategory = {
    id: string;
    label: string;
    description: string;
    icon: any;
    items: NavItem[];
};

export const catalogCategories: CatalogCategory[] = [
    {
        id: "legacy",
        label: "Life & Legacy",
        description: "Words, memories, and treasures to preserve",
        icon: Heart,
        items: [
            { label: "Letters to Loved Ones", key: "letters", href: "/modules/letters", icon: Heart, allowedRoles: ["Owner", "Executor", "Family"] },
            { label: "Treasured Heirlooms", key: "heirlooms", href: "/modules/heirlooms", icon: Gift, allowedRoles: ["Owner", "Executor", "Family"] },
            { label: "Life Journal", key: "journal", href: "/modules/legacy-journal", icon: BookOpen, allowedRoles: ["Owner", "Executor", "Family"] },
            { label: "Visual Memories", key: "visual-memories", href: "/modules/visual-memories", icon: Image, allowedRoles: ["Owner", "Executor", "Family"] },
            { label: "Time Capsule", key: "capsule", href: "/modules/time-capsule", icon: Box, allowedRoles: ["Owner", "Executor", "Family"] },
            { label: "Life Timeline", key: "timeline", href: "/modules/timeline", icon: Calendar, allowedRoles: ["Owner", "Executor", "Family"] },
            { label: "Final Wishes", key: "funeral", href: "/modules/funeral", icon: Scroll, allowedRoles: ["Owner", "Executor", "Family"] },
            { label: "Family Tree", key: "family-hub", href: "/modules/family-hub", icon: Users, allowedRoles: ["Owner", "Executor", "Family"] },
        ]
    },
    {
        id: "tools",
        label: "Helpful Tools",
        description: "Features to support your planning",
        icon: Settings,
        items: [
            { label: "The Red Binder", key: "binder", href: "/binder", icon: Activity, allowedRoles: ["Owner", "Executor"] },
            { label: "Executor Guide", key: "executor", href: "/modules/executor-toolkit", icon: Briefcase, allowedRoles: ["Owner", "Executor"] },
            { label: "Practice Run", key: "simulator", href: "/modules/simulator", icon: Siren, allowedRoles: ["Owner"], isPreview: true },
            { label: "QR Access Codes", key: "qrcodes", href: "/modules/qr-codes", icon: QrCode, allowedRoles: ["Owner", "Executor"], isPreview: true },
            { label: "Insights", key: "analytics", href: "/modules/analytics", icon: BarChart3, allowedRoles: ["Owner"], isPreview: true },
            { label: "Activity History", key: "activity", href: "/modules/activity-log", icon: History, allowedRoles: ["Owner"] },
            { label: "Important Dates", key: "anniversary", href: "/modules/anniversary-manager", icon: Sparkles, allowedRoles: ["Owner", "Executor", "Family"] },
            { label: "Future Scenarios", key: "scenario", href: "/modules/scenario-mode", icon: Compass, allowedRoles: ["Owner"], isPreview: true },
            { label: "Event Calendar", key: "calendar", href: "/modules/calendar", icon: Calendar, allowedRoles: ["Owner", "Executor", "Family"] },
            { label: "Your Full Record", key: "advanced-registry", href: "/modules/advanced-registry", icon: Database, allowedRoles: ["Owner", "Executor"] },
            { label: "Treasure Hunt", key: "treasurehunt", href: "/modules/treasure-hunt", icon: MapPin, allowedRoles: ["Owner", "Executor", "Family"], isPreview: true },
            { label: "Builder Tools", key: "builders", href: "/modules/builders-console", icon: Hammer, allowedRoles: ["Owner"], isPreview: true },
        ]
    },
];

// Core actions for onboarding tracking
export const coreActions: NavItem[] = navGroups.flatMap(group => group.items).filter(item => item.isCoreAction);
