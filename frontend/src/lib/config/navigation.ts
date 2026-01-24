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
    MapPin
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
    behaviour?: "background-tab";
    isExternal?: boolean;
    tooltip?: string;
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
// ESTATE PLANNING NAVIGATION
// ===========================================
// Core problem: Complete estate planning
// Core essentials: What survivors NEED on day one
// Secondary: Important but not urgent
// Catalog: Nice-to-have legacy/memory features

export const navGroups: NavGroup[] = [
    {
        groupLabel: "What Matters Most",
        groupKey: "groupEssentials",
        groupDescription: "The foundation of your estate",
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
            {
                label: "Financial Security",
                key: "financial",
                href: "/modules/financial-accounts",
                icon: Wallet,
                allowedRoles: ["Owner", "Executor"],
                isExecutorEssential: true,
                isCoreAction: true,
                tooltip: "Securely document bank accounts and investments"
            },
            {
                label: "Protection & Insurance",
                key: "insurance",
                href: "/modules/insurance",
                icon: Shield,
                allowedRoles: ["Owner", "Executor"],
                isExecutorEssential: true,
                isCoreAction: true,
                tooltip: "Policies that protect the people you love"
            },
            {
                label: "People Who Matter",
                key: "contacts",
                href: "/modules/contacts",
                icon: Users,
                allowedRoles: ["Owner", "Executor", "Family"],
                isExecutorEssential: true,
                isCoreAction: true,
                tooltip: "Key contacts, advisors, and family members"
            },
            {
                label: "Important Documents",
                key: "documents",
                href: "/modules/legal-documents",
                icon: Files,
                allowedRoles: ["Owner", "Executor"],
                isExecutorEssential: true,
                isCoreAction: true,
                tooltip: "Wills, trusts, and critical legal files"
            },
            {
                label: "Health & Care",
                key: "medical",
                href: "/modules/medical",
                icon: Stethoscope,
                allowedRoles: ["Owner", "Executor", "Family"],
                isExecutorEssential: true,
                isCoreAction: true,
                tooltip: "Medical directives and healthcare wishes"
            },
            {
                label: "Home & Keys",
                key: "home-manual",
                href: "/modules/home-manual",
                icon: Key,
                allowedRoles: ["Owner", "Executor", "Family"],
                isExecutorEssential: true,
                isCoreAction: true,
                tooltip: "Access codes, spare keys, and home details"
            },
            {
                label: "Wellness Check-in",
                key: "pulse",
                href: "/modules/pulse",
                icon: Heart,
                allowedRoles: ["Owner", "Executor", "Family"],
                isCoreAction: true,
                tooltip: "Let loved ones know you're okay"
            },
        ],
    },
    {
        groupLabel: "When You're Ready",
        groupKey: "groupSecondary",
        groupDescription: "Additional areas to explore",
        isCollapsedByDefault: true,
        items: [
            {
                label: "Subscriptions",
                key: "subscriptions",
                href: "/modules/subscriptions",
                icon: Receipt,
                allowedRoles: ["Owner", "Executor"],
                tooltip: "Recurring payments and memberships to cancel"
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
                label: "Property",
                key: "property",
                href: "/modules/property",
                icon: Building2,
                allowedRoles: ["Owner", "Executor"],
                isExecutorEssential: true,
                tooltip: "Real estate deeds and property details"
            },
            {
                label: "Digital Accounts",
                key: "guardian",
                href: "/modules/digital-guardian",
                icon: Shield,
                allowedRoles: ["Owner", "Executor"],
                tooltip: "Online accounts, passwords, and digital life"
            },
        ],
    },
    {
        groupLabel: "Life & Legacy",
        groupKey: "groupLegacy",
        groupDescription: "Memories, messages, and more",
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
                label: "Letters to Loved Ones",
                key: "letters",
                href: "/modules/letters",
                icon: Heart,
                allowedRoles: ["Owner", "Executor", "Family"],
                tooltip: "Leave meaningful messages for the future"
            },
            {
                label: "Treasured Heirlooms",
                key: "heirlooms",
                href: "/modules/heirlooms",
                icon: Gift,
                allowedRoles: ["Owner", "Executor", "Family"],
                tooltip: "Items with special meaning and their stories"
            },
            {
                label: "The Red Binder",
                key: "binder",
                href: "/binder",
                icon: Activity,
                allowedRoles: ["Owner", "Executor"],
                tooltip: "Generate a physical backup of your plan"
            },
            {
                label: "Settings",
                key: "settings",
                href: "/settings",
                icon: Settings,
                allowedRoles: ["Owner", "Executor", "Family"],
                tooltip: "Manage your account and preferences"
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
                label: "Family Tree",
                key: "family-hub",
                href: "/modules/family-hub",
                icon: Users,
                allowedRoles: ["Owner", "Executor", "Family"],
                tooltip: "Your family network and connections"
            },
            {
                label: "Future Scenarios",
                key: "scenario",
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
                label: "Complete Record",
                key: "advanced-registry",
                href: "/modules/advanced-registry",
                icon: Database,
                allowedRoles: ["Owner", "Executor"],
                tooltip: "Comprehensive database of all items"
            },
            {
                label: "Builder Tools",
                key: "builders",
                href: "/modules/builders-console",
                icon: Hammer,
                allowedRoles: ["Owner"],
                tooltip: "Developer tools for customizing Continuum"
            },
            {
                label: "Treasure Hunt",
                key: "treasurehunt",
                href: "/modules/treasure-hunt",
                icon: MapPin,
                allowedRoles: ["Owner", "Executor", "Family"],
                tooltip: "Interactive guide to finding important items"
            },
        ],
    },
];

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
        label: "Security Vault",
        key: "pulseVault",
        href: "/modules/pulse/vault",
        icon: ShieldCheck,
        allowedRoles: ["Owner"],
    },
    {
        label: "Transparency",
        key: "pulseTransparency",
        href: "/modules/pulse/transparency",
        icon: Info,
        allowedRoles: ["Owner", "Executor", "Family"],
    },
    {
        label: "Messages",
        key: "pulseMessages",
        href: "/modules/pulse/messages",
        icon: MessageSquare,
        allowedRoles: ["Owner", "Executor", "Family"],
    },
    {
        label: "History",
        key: "pulseHistory",
        href: "/modules/pulse/history",
        icon: History,
        allowedRoles: ["Owner", "Executor"],
    },
    {
        label: "Contacts",
        key: "pulseContacts",
        href: "/modules/pulse/contacts",
        icon: Users,
        allowedRoles: ["Owner"],
    },
    {
        label: "Escalation",
        key: "pulseEscalation",
        href: "/modules/pulse/escalation",
        icon: Activity,
        allowedRoles: ["Owner"],
    },
    {
        label: "Settings",
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
            { label: "Practice Run", key: "simulator", href: "/modules/simulator", icon: Siren, allowedRoles: ["Owner"] },
            { label: "QR Access Codes", key: "qrcodes", href: "/modules/qr-codes", icon: QrCode, allowedRoles: ["Owner", "Executor"] },
            { label: "Insights", key: "analytics", href: "/modules/analytics", icon: BarChart3, allowedRoles: ["Owner"] },
            { label: "Activity History", key: "activity", href: "/modules/activity-log", icon: History, allowedRoles: ["Owner"] },
            { label: "Important Dates", key: "anniversary", href: "/modules/anniversary-manager", icon: Sparkles, allowedRoles: ["Owner", "Executor", "Family"] },
            { label: "Future Scenarios", key: "scenario", href: "/modules/scenario-mode", icon: Compass, allowedRoles: ["Owner"] },
            { label: "Event Calendar", key: "calendar", href: "/modules/calendar", icon: Calendar, allowedRoles: ["Owner", "Executor", "Family"] },
            { label: "Complete Record", key: "advanced-registry", href: "/modules/advanced-registry", icon: Database, allowedRoles: ["Owner", "Executor"] },
            { label: "Treasure Hunt", key: "treasurehunt", href: "/modules/treasure-hunt", icon: MapPin, allowedRoles: ["Owner", "Executor", "Family"] },
            { label: "Builder Tools", key: "builders", href: "/modules/builders-console", icon: Hammer, allowedRoles: ["Owner"] },
        ]
    },
];

// Core actions for onboarding tracking
export const coreActions: NavItem[] = navGroups[0].items.filter(item => item.isCoreAction);
