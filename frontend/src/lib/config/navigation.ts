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
    Database
} from "lucide-svelte";

export type UserRole = "Owner" | "Executor" | "Family";

export type NavItem = {
    label: string;
    key: string;
    href: string;
    icon: any;
    allowedRoles: UserRole[];
};

export type NavGroup = {
    groupLabel: string;
    groupKey: string;
    groupDescription?: string;
    isCollapsedByDefault?: boolean;
    items: NavItem[];
};

export const navGroups: NavGroup[] = [
    {
        groupLabel: "Estate Overview",
        groupKey: "groupOverview",
        groupDescription: "Your central command and situation reports.",
        items: [
            {
                label: "Dashboard",
                key: "dashboard",
                href: "/dashboard",
                icon: LayoutDashboard,
                allowedRoles: ["Owner", "Executor", "Family"],
            },
            {
                label: "Estate Analytics",
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
        ],
    },
    {
        groupLabel: "Assets & Wealth",
        groupKey: "groupAssets",
        groupDescription: "Manage your properties, accounts, and portfolio.",
        items: [
            {
                label: "Financial Accounts",
                key: "assets",
                href: "/modules/financial-accounts",
                icon: Wallet,
                allowedRoles: ["Owner", "Executor"],
            },
            {
                label: "Real Estate",
                key: "property",
                href: "/modules/property",
                icon: Home,
                allowedRoles: ["Owner", "Executor"],
            },
            {
                label: "Insurance Portfolio",
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
        ],
    },
    {
        groupLabel: "Life & Legacy",
        groupKey: "groupLegacy",
        groupDescription: "Preserve your memories, letters, and wishes.",
        items: [
            {
                label: "Legacy Journal",
                key: "journal",
                href: "/modules/legacy-journal",
                icon: BookOpen,
                allowedRoles: ["Owner", "Executor", "Family"],
            },
            {
                label: "Heirlooms Registry",
                key: "heirlooms",
                href: "/modules/heirlooms",
                icon: Gift,
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
                label: "Legacy Letters",
                key: "letters",
                href: "/modules/letters",
                icon: Heart,
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
                label: "Time Capsule",
                key: "capsule",
                href: "/modules/time-capsule",
                icon: Box,
                allowedRoles: ["Owner", "Executor", "Family"],
            },
            {
                label: "Family & Contacts",
                key: "contacts",
                href: "/modules/contacts",
                icon: Users,
                allowedRoles: ["Owner", "Executor", "Family"],
            },
            {
                label: "Funeral Planner",
                key: "funeral",
                href: "/modules/funeral",
                icon: Scroll,
                allowedRoles: ["Owner", "Executor", "Family"],
            },
        ],
    },
    {
        groupLabel: "Logistics & Security",
        groupKey: "groupLogistics",
        groupDescription: "The vital essentials for your survivors.",
        items: [
            {
                label: "The Red Binder",
                key: "binder",
                href: "/binder",
                icon: Activity,
                allowedRoles: ["Owner", "Executor"],
            },
            {
                label: "Document Vault",
                key: "documents",
                href: "/modules/legal-documents",
                icon: Files,
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
                label: "Digital Guardian",
                key: "guardian",
                href: "/modules/digital-guardian",
                icon: Shield,
                allowedRoles: ["Owner", "Executor"],
            },
            {
                label: "Health & Medical",
                key: "medical",
                href: "/modules/medical",
                icon: Heart,
                allowedRoles: ["Owner", "Executor", "Family"],
            },
            {
                label: "Pet Care Plan",
                key: "pets",
                href: "/modules/pets",
                icon: Dog,
                allowedRoles: ["Owner", "Executor", "Family"],
            },
        ],
    },
    {
        groupLabel: "Admin & Tools",
        groupKey: "groupAdmin",
        groupDescription: "System settings and advanced controls.",
        isCollapsedByDefault: true,
        items: [
            {
                label: "Executor Toolkit",
                key: "executor",
                href: "/modules/executor-toolkit",
                icon: Briefcase,
                allowedRoles: ["Owner", "Executor"],
            },
            {
                label: "QR Access Center",
                key: "qrcodes",
                href: "/modules/qr-codes",
                icon: QrCode,
                allowedRoles: ["Owner", "Executor"],
            },
            {
                label: "Builder's Console",
                key: "builder",
                href: "/modules/builders-console",
                icon: ShieldCheck,
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
                label: "Module Catalog",
                key: "catalog",
                href: "/catalog",
                icon: Library,
                allowedRoles: ["Owner"],
            },
            {
                label: "Fire Drill",
                key: "simulator",
                href: "/modules/simulator",
                icon: Siren,
                allowedRoles: ["Owner"],
            },
            {
                label: "Data Confidence",
                key: "data-confidence",
                href: "/settings/data",
                icon: Database,
                allowedRoles: ["Owner"],
            },
        ],
    },
    {
        groupLabel: "Pulse & Wellness",
        groupKey: "groupPulse",
        groupDescription: "Monitoring your well-being and guardianship.",
        isCollapsedByDefault: true,
        items: [
            {
                label: "The Pulse Dashboard",
                key: "pulseDashboard",
                href: "/modules/pulse",
                icon: Heart,
                allowedRoles: ["Owner", "Executor", "Family"],
            },
            {
                label: "Security Instructions",
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
                label: "Message Center",
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
                label: "Pulse Settings",
                key: "pulseSettings",
                href: "/modules/pulse/settings",
                icon: Settings,
                allowedRoles: ["Owner"],
            },
        ],
    },
];
