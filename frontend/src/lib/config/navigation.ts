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
    Building2
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
            },
            {
                label: "Financial Security",
                key: "financial",
                href: "/modules/financial-accounts",
                icon: Wallet,
                allowedRoles: ["Owner", "Executor"],
                isExecutorEssential: true,
                isCoreAction: true,
            },
            {
                label: "Protection & Insurance",
                key: "insurance",
                href: "/modules/insurance",
                icon: Shield,
                allowedRoles: ["Owner", "Executor"],
                isExecutorEssential: true,
                isCoreAction: true,
            },
            {
                label: "People Who Matter",
                key: "contacts",
                href: "/modules/contacts",
                icon: Users,
                allowedRoles: ["Owner", "Executor", "Family"],
                isExecutorEssential: true,
                isCoreAction: true,
            },
            {
                label: "Important Documents",
                key: "documents",
                href: "/modules/legal-documents",
                icon: Files,
                allowedRoles: ["Owner", "Executor"],
                isExecutorEssential: true,
                isCoreAction: true,
            },
            {
                label: "Health & Care",
                key: "medical",
                href: "/modules/medical",
                icon: Stethoscope,
                allowedRoles: ["Owner", "Executor", "Family"],
                isExecutorEssential: true,
                isCoreAction: true,
            },
            {
                label: "Home & Keys",
                key: "home-manual",
                href: "/modules/home-manual",
                icon: Key,
                allowedRoles: ["Owner", "Executor", "Family"],
                isExecutorEssential: true,
                isCoreAction: true,
            },
            {
                label: "Wellness Check-in",
                key: "pulse",
                href: "/modules/pulse",
                icon: Heart,
                allowedRoles: ["Owner", "Executor", "Family"],
                isCoreAction: true,
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
            },
            {
                label: "Pet Care",
                key: "pets",
                href: "/modules/pets",
                icon: Dog,
                allowedRoles: ["Owner", "Executor", "Family"],
            },
            {
                label: "Property",
                key: "property",
                href: "/modules/property",
                icon: Building2,
                allowedRoles: ["Owner", "Executor"],
                isExecutorEssential: true,
            },
            {
                label: "Digital Accounts",
                key: "guardian",
                href: "/modules/digital-guardian",
                icon: Shield,
                allowedRoles: ["Owner", "Executor"],
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
            },
            {
                label: "Letters to Loved Ones",
                key: "letters",
                href: "/modules/letters",
                icon: Heart,
                allowedRoles: ["Owner", "Executor", "Family"],
            },
            {
                label: "Treasured Heirlooms",
                key: "heirlooms",
                href: "/modules/heirlooms",
                icon: Gift,
                allowedRoles: ["Owner", "Executor", "Family"],
            },
            {
                label: "The Red Binder",
                key: "binder",
                href: "/binder",
                icon: Activity,
                allowedRoles: ["Owner", "Executor"],
            },
            {
                label: "Settings",
                key: "settings",
                href: "/settings",
                icon: Settings,
                allowedRoles: ["Owner", "Executor", "Family"],
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
        ]
    },
];

// Core actions for onboarding tracking
export const coreActions: NavItem[] = navGroups[0].items.filter(item => item.isCoreAction);
