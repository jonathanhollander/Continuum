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
        groupLabel: "Estate Essentials",
        groupKey: "groupEssentials",
        groupDescription: "Core estate planning",
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
                label: "Assets & Financial",
                key: "financial",
                href: "/modules/financial-accounts",
                icon: Wallet,
                allowedRoles: ["Owner", "Executor"],
                isExecutorEssential: true,
                isCoreAction: true,
            },
            {
                label: "Insurance",
                key: "insurance",
                href: "/modules/insurance",
                icon: Shield,
                allowedRoles: ["Owner", "Executor"],
                isExecutorEssential: true,
                isCoreAction: true,
            },
            {
                label: "Contacts",
                key: "contacts",
                href: "/modules/contacts",
                icon: Users,
                allowedRoles: ["Owner", "Executor", "Family"],
                isExecutorEssential: true,
                isCoreAction: true,
            },
            {
                label: "Documents",
                key: "documents",
                href: "/modules/legal-documents",
                icon: Files,
                allowedRoles: ["Owner", "Executor"],
                isExecutorEssential: true,
                isCoreAction: true,
            },
            {
                label: "Medical",
                key: "medical",
                href: "/modules/medical",
                icon: Stethoscope,
                allowedRoles: ["Owner", "Executor", "Family"],
                isExecutorEssential: true,
                isCoreAction: true,
            },
            {
                label: "Home Access",
                key: "home-manual",
                href: "/modules/home-manual",
                icon: Key,
                allowedRoles: ["Owner", "Executor", "Family"],
                isExecutorEssential: true,
                isCoreAction: true,
            },
            {
                label: "Pulse",
                key: "pulse",
                href: "/modules/pulse",
                icon: Heart,
                allowedRoles: ["Owner", "Executor", "Family"],
                isCoreAction: true,
            },
        ],
    },
    {
        groupLabel: "Secondary",
        groupKey: "groupSecondary",
        groupDescription: "Additional records",
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
                label: "Real Estate",
                key: "property",
                href: "/modules/property",
                icon: Building2,
                allowedRoles: ["Owner", "Executor"],
                isExecutorEssential: true,
            },
            {
                label: "Digital Guardian",
                key: "guardian",
                href: "/modules/digital-guardian",
                icon: Shield,
                allowedRoles: ["Owner", "Executor"],
            },
        ],
    },
    {
        groupLabel: "Legacy & More",
        groupKey: "groupLegacy",
        groupDescription: "Memories, letters, tools",
        isCollapsedByDefault: true,
        items: [
            {
                label: "Browse All Features",
                key: "catalog",
                href: "/catalog",
                icon: Compass,
                allowedRoles: ["Owner", "Executor", "Family"],
            },
            {
                label: "Legacy Letters",
                key: "letters",
                href: "/modules/letters",
                icon: Heart,
                allowedRoles: ["Owner", "Executor", "Family"],
            },
            {
                label: "Heirlooms",
                key: "heirlooms",
                href: "/modules/heirlooms",
                icon: Gift,
                allowedRoles: ["Owner", "Executor", "Family"],
            },
            {
                label: "Red Binder",
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
        description: "Preserve what matters most",
        icon: Heart,
        items: [
            { label: "Legacy Letters", key: "letters", href: "/modules/letters", icon: Heart, allowedRoles: ["Owner", "Executor", "Family"] },
            { label: "Heirlooms", key: "heirlooms", href: "/modules/heirlooms", icon: Gift, allowedRoles: ["Owner", "Executor", "Family"] },
            { label: "Life Journal", key: "journal", href: "/modules/legacy-journal", icon: BookOpen, allowedRoles: ["Owner", "Executor", "Family"] },
            { label: "Visual Memories", key: "visual-memories", href: "/modules/visual-memories", icon: Image, allowedRoles: ["Owner", "Executor", "Family"] },
            { label: "Time Capsule", key: "capsule", href: "/modules/time-capsule", icon: Box, allowedRoles: ["Owner", "Executor", "Family"] },
            { label: "Life Timeline", key: "timeline", href: "/modules/timeline", icon: Calendar, allowedRoles: ["Owner", "Executor", "Family"] },
            { label: "Funeral Wishes", key: "funeral", href: "/modules/funeral", icon: Scroll, allowedRoles: ["Owner", "Executor", "Family"] },
        ]
    },
    {
        id: "tools",
        label: "Power Tools",
        description: "Advanced features",
        icon: Settings,
        items: [
            { label: "The Red Binder", key: "binder", href: "/binder", icon: Activity, allowedRoles: ["Owner", "Executor"] },
            { label: "Executor Toolkit", key: "executor", href: "/modules/executor-toolkit", icon: Briefcase, allowedRoles: ["Owner", "Executor"] },
            { label: "Fire Drill", key: "simulator", href: "/modules/simulator", icon: Siren, allowedRoles: ["Owner"] },
            { label: "QR Access", key: "qrcodes", href: "/modules/qr-codes", icon: QrCode, allowedRoles: ["Owner", "Executor"] },
            { label: "Analytics", key: "analytics", href: "/modules/analytics", icon: BarChart3, allowedRoles: ["Owner"] },
            { label: "Activity Log", key: "activity", href: "/modules/activity-log", icon: History, allowedRoles: ["Owner"] },
            { label: "Anniversary Manager", key: "anniversary", href: "/modules/anniversary-manager", icon: Sparkles, allowedRoles: ["Owner", "Executor", "Family"] },
        ]
    },
];

// Core actions for onboarding tracking
export const coreActions: NavItem[] = navGroups[0].items.filter(item => item.isCoreAction);
