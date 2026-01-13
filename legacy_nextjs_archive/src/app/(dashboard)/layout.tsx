import { UserButton, SignedIn } from "@clerk/nextjs"
import { LayoutDashboard, FileText, Settings, ShieldCheck, Users } from "lucide-react"
import Link from "next/link"

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="flex min-h-screen bg-background text-foreground">
            {/* Sidebar Navigation (Heirloom Style: "The Ledger") */}
            <aside className="w-64 border-r border-border bg-card/50 backdrop-blur-sm hidden md:flex flex-col">
                <div className="p-6 border-b border-border">
                    <div className="font-serif text-2xl font-bold tracking-tighter text-primary">
                        ANTIGRAVITY
                    </div>
                    <div className="text-xs font-blueprint text-muted-foreground mt-1">
                        ESTATE CONCIERGE v9
                    </div>
                </div>

                <nav className="flex-1 p-4 space-y-2">
                    <NavItem href="/dashboard" icon={<LayoutDashboard size={18} />} label="Overview" />
                    <NavItem href="/dashboard/tasks" icon={<FileText size={18} />} label="Executor Tasks" />
                    <NavItem href="/dashboard/people" icon={<Users size={18} />} label="People & Contacts" />
                    <NavItem href="/dashboard/assets" icon={<ShieldCheck size={18} />} label="Asset Vault" />
                    <div className="pt-4 mt-4 border-t border-border">
                        <NavItem href="/dashboard/settings" icon={<Settings size={18} />} label="Configuration" />
                    </div>
                </nav>

                <div className="p-4 border-t border-border">
                    {/* DEMO MODE: Replaced SignedIn for preview */}
                    <div className="flex items-center gap-3">
                        <div className="size-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-serif">D</div>
                        <div className="text-sm font-medium">Demo Admin</div>
                    </div>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 overflow-auto relative">
                {/* Paper Texture Overlay */}
                <div className="pointer-events-none absolute inset-0 opacity-[0.03] bg-[url('/noise.png')] mix-blend-multiply" />
                {children}
            </main>
        </div>
    )
}

function NavItem({ href, icon, label }: { href: string, icon: React.ReactNode, label: string }) {
    return (
        <Link
            href={href}
            className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors"
        >
            {icon}
            <span>{label}</span>
        </Link>
    )
}
