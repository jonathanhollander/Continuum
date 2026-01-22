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
    Search
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
    isCoreAction?: boolean; // Part of the 3 essential actions
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
// MINIMAL NAVIGATION - Focus on ONE problem
// ===========================================
// Core problem: "Make sure your family knows what to do"
// Core actions: 1) Add contacts, 2) Add documents, 3) Set up Pulse
// Everything else: Discover in catalog

export const coreActions: NavItem[] = [
    {
        label: "My Contacts",
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
        label: "Wellness Check-in",
        key: "pulse",
        href: "/modules/pulse",
        icon: Heart,
        allowedRoles: ["Owner", "Executor", "Family"],
        isCoreAction: true,
    },
];

// ===========================================
// SIMPLIFIED SIDEBAR - Only essentials visible
// ===========================================
// Before: 36 items in 4 groups
// After: 4 essentials + "Explore More" link

export const navGroups: NavGroup[] = [
    {
        groupLabel: "Essentials",
        groupKey: "groupEssentials",
        groupDescription: "The foundation of your plan",
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
            ...coreActions,
        ],
    },
    {
        groupLabel: "Explore More",
        groupKey: "groupExplore",
        groupDescription: "All features",
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
                label: "Financial",
                key: "financial",
                href: "/modules/financial-accounts",
                icon: Wallet,
                allowedRoles: ["Owner", "Executor"],
                isExecutorEssential: true,
            },
            {
                label: "Letters",
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
                label: "Medical",
                key: "medical",
                href: "/modules/medical",
                icon: Heart,
                allowedRoles: ["Owner", "Executor", "Family"],
            },
        ],
    },
    {
        groupLabel: "Tools",
        groupKey: "groupTools",
        groupDescription: "Advanced",
        isCollapsedByDefault: true,
        items: [
            {
                label: "Red Binder",
                key: "binder",
                href: "/binder",
                icon: Activity,
                allowedRoles: ["Owner", "Executor"],
            },
            {
                label: "Executor Kit",
                key: "executor",
                href: "/modules/executor-toolkit",
                icon: Briefcase,
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
// CATALOG CATEGORIES - All features organized
// ===========================================
// These appear in the catalog discovery page, not sidebar

export type CatalogCategory = {
    id: string;
    label: string;
    description: string;
    icon: any;
    items: NavItem[];
};

export const catalogCategories: CatalogCategory[] = [
    {
        id: "estate",
        label: "Assets & Wealth",
        description: "Track your financial picture",
        icon: Wallet,
        items: [
            { label: "Financial Accounts", key: "assets", href: "/modules/financial-accounts", icon: Wallet, allowedRoles: ["Owner", "Executor"], isExecutorEssential: true },
            { label: "Real Estate", key: "property", href: "/modules/property", icon: Home, allowedRoles: ["Owner", "Executor"], isExecutorEssential: true },
            { label: "Insurance", key: "insurance", href: "/modules/insurance", icon: Shield, allowedRoles: ["Owner", "Executor"] },
            { label: "Subscriptions", key: "subscriptions", href: "/modules/subscriptions", icon: Receipt, allowedRoles: ["Owner", "Executor"] },
        ]
    },
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
        id: "logistics",
        label: "Practical Matters",
        description: "Day-to-day essentials",
        icon: Hammer,
        items: [
            { label: "Home Manual", key: "home-manual", href: "/modules/home-manual", icon: Hammer, allowedRoles: ["Owner", "Executor", "Family"] },
            { label: "Health & Medical", key: "medical", href: "/modules/medical", icon: Heart, allowedRoles: ["Owner", "Executor", "Family"] },
            { label: "Pet Care", key: "pets", href: "/modules/pets", icon: Dog, allowedRoles: ["Owner", "Executor", "Family"] },
            { label: "Digital Guardian", key: "guardian", href: "/modules/digital-guardian", icon: Shield, allowedRoles: ["Owner", "Executor"] },
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
