import { LivingBlueprintHeader } from "@/components/ui/living-blueprint-header"
import { RevealTransition } from "@/components/ui/reveal-transition"
import { prisma } from "@/lib/db"
import { Plus, Settings, ShieldCheck } from "lucide-react"
import Link from "next/link"

export default async function DashboardPage() {
    // DEMO MODE: Mock User
    let user = { id: "demo_user", firstName: "Demo", lastName: "Admin" } as any

    // DEMO MODE: Mock User if no auth keys
    if (!user) {
        user = { id: "demo_user", firstName: "Demo", lastName: "Admin" } as any
    }

    if (!user) return null

    // MOCK DATA MODE due to local DB issues
    const estates = [
        { id: "estate_1", name: "The Anderson Legacy", description: "Primary residence and investment portfolio.", ownerId: "demo_user", createdAt: new Date() },
        { id: "estate_2", name: "Highland Trust", description: "Family vacation property and trust assets.", ownerId: "demo_user", createdAt: new Date() }
    ] as any[]

    // const estates = await prisma.estate.findMany({
    //     where: { ownerId: user.id } 
    // })

    return (
        <div className="pb-20">
            <LivingBlueprintHeader
                title={`Welcome, ${user.firstName || 'Executor'}`}
                subtitle="Your legacy command center is ready. Review the status of your active estates below."
                tier="preparation"
            />

            <div className="container px-6 py-12">
                <RevealTransition delay={0.2} type="fade">
                    <div className="flex items-center justify-between mb-8">
                        <h2 className="text-2xl font-serif text-primary">Active Estates</h2>
                        <Link
                            href="/estate/new"
                            className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-sm hover:bg-primary/90 transition-colors font-blueprint text-sm tracking-wider"
                        >
                            <Plus size={16} />
                            INITIATE NEW ESTATE
                        </Link>
                    </div>

                    {estates.length === 0 ? (
                        <div className="bg-card border border-dashed border-border p-12 rounded-lg text-center">
                            <div className="inline-flex items-center justify-center size-16 rounded-full bg-secondary/10 text-secondary mb-4">
                                <ShieldCheck size={32} />
                            </div>
                            <h3 className="text-lg font-medium mb-2">No Active Estates Found</h3>
                            <p className="text-muted-foreground max-w-sm mx-auto mb-6">
                                Begin by initializing a new estate plan or importing an existing one to access the full suite of concierge tools.
                            </p>
                            <Link
                                href="/estate/new"
                                className="text-primary hover:underline font-medium"
                            >
                                Start your first plan &rarr;
                            </Link>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {estates.map(estate => (
                                <Link key={estate.id} href={`/estate/${estate.id}`}>
                                    <div className="group relative bg-card border border-border p-6 rounded-lg hover:shadow-lg transition-all hover:border-primary/50 cursor-pointer">
                                        <div className="absolute top-0 right-0 p-4 opacity-50 group-hover:opacity-100 transition-opacity">
                                            <Settings size={16} />
                                        </div>
                                        <div className="mb-4 size-10 rounded bg-primary/10 flex items-center justify-center text-primary">
                                            <ShieldCheck size={20} />
                                        </div>
                                        <h3 className="text-xl font-serif mb-1 group-hover:text-primary transition-colors">{estate.name}</h3>
                                        <p className="text-sm text-muted-foreground line-clamp-2">{estate.description || "No description provided."}</p>
                                        <div className="mt-4 pt-4 border-t border-border flex items-center justify-between text-xs text-muted-foreground font-blueprint">
                                            <span>STATUS: ACTIVE</span>
                                            <span>ID: {estate.id.slice(-4)}</span>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </RevealTransition>
            </div>
        </div>
    )
}
