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
    Zap
} from "lucide-svelte";

export type UserRole = "Owner" | "Executor" | "Family";

export type NavItem = {
    label: string;
    key: string;
    href: string;
    icon: any;
    allowedRoles: UserRole[];
    isExecutorEssential?: boolean; // Highlighted for executor mode
    isQuickStart?: boolean; // Part of quick start flow
};

export type NavGroup = {
    groupLabel: string;
    groupKey: string;
    groupDescription?: string;
    isCollapsedByDefault?: boolean;
    isPrimary?: boolean; // Always visible, not collapsible
    items: NavItem[];
};

// Simplified navigation: 4 groups with progressive disclosure
// Quick Actions always visible, other groups expand as needed
export const navGroups: NavGroup[] = [
    {
        groupLabel: "Quick Actions",
        groupKey: "groupQuick",
        groupDescription: "Start here — the essentials",
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
                label: "My Contacts",
                key: "contacts",
                href: "/modules/contacts",
                icon: Users,
                allowedRoles: ["Owner", "Executor", "Family"],
                isExecutorEssential: true,
                isQuickStart: true,
            },
            {
                label: "Documents",
                key: "documents",
                href: "/modules/legal-documents",
                icon: Files,
                allowedRoles: ["Owner", "Executor"],
                isExecutorEssential: true,
                isQuickStart: true,
            },
            {
                label: "Wellness Check-in",
                key: "pulse",
                href: "/modules/pulse",
                icon: Heart,
                allowedRoles: ["Owner", "Executor", "Family"],
                isQuickStart: true,
            },
        ],
    },
    {
        groupLabel: "My Estate",
        groupKey: "groupEstate",
        groupDescription: "Assets, accounts, and records",
        items: [
            {
                label: "Financial Accounts",
                key: "assets",
                href: "/modules/financial-accounts",
                icon: Wallet,
                allowedRoles: ["Owner", "Executor"],
                isExecutorEssential: true,
            },
            {
                label: "Real Estate",
                key: "property",
                href: "/modules/property",
                icon: Home,
                allowedRoles: ["Owner", "Executor"],
                isExecutorEssential: true,
            },
            {
                label: "Insurance",
                key: "insurance",
                href: "/modules/insurance",
                icon: Shield,
                allowedRoles: ["Owner", "Executor"],
            },
            {
                label: "Subscriptions",
                key: "subscriptions",
                href: "/modules/subscriptions",
                icon: Receipt,
                allowedRoles: ["Owner", "Executor"],
            },
            {
                label: "Home Manual",
                key: "home-manual",
                href: "/modules/home-manual",
                icon: Hammer,
                allowedRoles: ["Owner", "Executor", "Family"],
            },
            {
                label: "Health & Medical",
                key: "medical",
                href: "/modules/medical",
                icon: Heart,
                allowedRoles: ["Owner", "Executor", "Family"],
            },
            {
                label: "Pet Care",
                key: "pets",
                href: "/modules/pets",
                icon: Dog,
                allowedRoles: ["Owner", "Executor", "Family"],
            },
        ],
    },
    {
        groupLabel: "My Legacy",
        groupKey: "groupLegacy",
        groupDescription: "Memories, messages, and wishes",
        items: [
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
                label: "Life Journal",
                key: "journal",
                href: "/modules/legacy-journal",
                icon: BookOpen,
                allowedRoles: ["Owner", "Executor", "Family"],
            },
            {
                label: "Visual Memories",
                key: "visual-memories",
                href: "/modules/visual-memories",
                icon: Image,
                allowedRoles: ["Owner", "Executor", "Family"],
            },
            {
                label: "Time Capsule",
                key: "capsule",
                href: "/modules/time-capsule",
                icon: Box,
                allowedRoles: ["Owner", "Executor", "Family"],
            },
            {
                label: "Life Timeline",
                key: "timeline",
                href: "/modules/timeline",
                icon: Calendar,
                allowedRoles: ["Owner", "Executor", "Family"],
            },
            {
                label: "Funeral Wishes",
                key: "funeral",
                href: "/modules/funeral",
                icon: Scroll,
                allowedRoles: ["Owner", "Executor", "Family"],
            },
        ],
    },
    {
        groupLabel: "Tools & Settings",
        groupKey: "groupTools",
        groupDescription: "Advanced features",
        isCollapsedByDefault: true,
        items: [
            {
                label: "The Red Binder",
                key: "binder",
                href: "/binder",
                icon: Activity,
                allowedRoles: ["Owner", "Executor"],
            },
            {
                label: "Executor Toolkit",
                key: "executor",
                href: "/modules/executor-toolkit",
                icon: Briefcase,
                allowedRoles: ["Owner", "Executor"],
            },
            {
                label: "Fire Drill",
                key: "simulator",
                href: "/modules/simulator",
                icon: Siren,
                allowedRoles: ["Owner"],
            },
            {
                label: "Digital Guardian",
                key: "guardian",
                href: "/modules/digital-guardian",
                icon: Shield,
                allowedRoles: ["Owner", "Executor"],
            },
            {
                label: "QR Access",
                key: "qrcodes",
                href: "/modules/qr-codes",
                icon: QrCode,
                allowedRoles: ["Owner", "Executor"],
            },
            {
                label: "Analytics",
                key: "analytics",
                href: "/modules/analytics",
                icon: BarChart3,
                allowedRoles: ["Owner"],
            },
            {
                label: "Activity Log",
                key: "activity",
                href: "/modules/activity-log",
                icon: History,
                allowedRoles: ["Owner"],
            },
            {
                label: "Module Catalog",
                key: "catalog",
                href: "/catalog",
                icon: Library,
                allowedRoles: ["Owner"],
            },
            {
                label: "Anniversary Manager",
                key: "anniversary",
                href: "/modules/anniversary-manager",
                icon: Sparkles,
                allowedRoles: ["Owner", "Executor", "Family"],
            },
            {
                label: "Builder's Console",
                key: "builder",
                href: "/modules/builders-console",
                icon: ShieldCheck,
                allowedRoles: ["Owner"],
            },
            {
                label: "Data Settings",
                key: "data-confidence",
                href: "/settings/data",
                icon: Database,
                allowedRoles: ["Owner"],
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
