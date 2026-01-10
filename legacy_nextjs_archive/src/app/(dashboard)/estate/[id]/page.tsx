import { LivingBlueprintHeader } from "@/components/ui/living-blueprint-header"
import { RevealTransition } from "@/components/ui/reveal-transition"
import { MechanicalIcon, Icons } from "@/components/ui/mechanical-icon"
import { SmartGuidanceEngine } from "@/lib/smart-guidance"
import { prisma } from "@/lib/db"
import { notFound, redirect } from "next/navigation"

export default async function EstateDashboardPage({
    params
}: {
    params: Promise<{ id: string }>
}) {
    const { id } = await params
    // DEMO MODE: Mock User
    let user = { id: "demo_user", firstName: "Demo", lastName: "Admin" } as any

    // DEMO MODE: Mock User if no auth keys
    if (!user) {
        user = { id: "demo_user", firstName: "Demo", lastName: "Admin" } as any
    }

    if (!user) redirect("/sign-in")

    // MOCK DATA MODE
    const estate = {
        id: id,
        name: "The Anderson Legacy",
        description: "Primary residence and investment portfolio.",
        createdAt: new Date(),
        tasks: [
            { id: "t1", title: "Locate Will and Testament", status: "COMPLETED", priority: "Critical" },
            { id: "t2", title: "Notify Financial Institutions", status: "IN_PROGRESS", priority: "High" },
            { id: "t3", title: "Secure Primary Residence", status: "NOT_STARTED", priority: "Medium" }
        ]
    } as any

    // const estate = await prisma.estate.findUnique({
    //     where: { id },
    //     include: { tasks: true }
    // })

    if (!estate) notFound()

    // Generate Smart Guidance
    const guidance = SmartGuidanceEngine.generateGuidance(estate, estate.tasks)

    return (
        <div className="pb-20">
            <LivingBlueprintHeader
                title={estate.name}
                subtitle="Executor Control Center"
                tier="executor"
            />

            <div className="container px-6 py-12 space-y-8">

                {/* Smart Guidance Section */}
                <RevealTransition delay={0.1}>
                    <div className="border border-primary/20 bg-primary/5 rounded-lg p-6 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                            <Icons.Chronos className="size-32" />
                        </div>

                        <div className="relative z-10">
                            <div className="flex items-center gap-3 mb-2 font-blueprint text-sm text-primary uppercase tracking-widest">
                                <MechanicalIcon className="size-4" paths={<circle cx="12" cy="12" r="10" />} urgency={guidance.priority === "critical" ? "urgent" : "normal"} />
                                STATUS: {guidance.priority}
                            </div>
                            <h2 className="text-3xl font-serif text-foreground mb-2">{guidance.headline}</h2>
                            <p className="text-muted-foreground text-lg max-w-2xl">{guidance.subtext}</p>
                        </div>
                    </div>
                </RevealTransition>

                {/* Metrics Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <RevealTransition delay={0.2} type="fade">
                        <MetricCard
                            label="Tasks Pending"
                            value={estate.tasks.filter(t => t.status !== "COMPLETED").length.toString()}
                            icon={<Icons.Vault className="size-6" />}
                        />
                    </RevealTransition>
                    <RevealTransition delay={0.3} type="fade">
                        <MetricCard
                            label="Documents Secured"
                            value="0"
                            icon={<Icons.Estate className="size-6" />}
                            subtext="Vault Empty"
                        />
                    </RevealTransition>
                    <RevealTransition delay={0.4} type="fade">
                        <MetricCard
                            label="Days Active"
                            value={Math.floor((Date.now() - estate.createdAt.getTime()) / (1000 * 60 * 60 * 24)).toString()}
                            icon={<Icons.Chronos className="size-6" />}
                        />
                    </RevealTransition>
                </div>

                {/* Task List (Simplified Preview) */}
                <div>
                    <h3 className="text-xl font-serif mb-4">Immediate Actions</h3>
                    {estate.tasks.length === 0 ? (
                        <div className="p-8 border border-dashed border-border rounded text-center text-muted-foreground">
                            No tasks assigned yet. Run the initialization wizard.
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {estate.tasks.slice(0, 5).map(task => (
                                <div key={task.id} className="flex items-center justify-between p-4 bg-card border border-border rounded">
                                    <span className="font-medium">{task.title}</span>
                                    <span className="text-xs font-blueprint uppercase px-2 py-1 bg-secondary/10 text-secondary rounded">
                                        {task.status}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

function MetricCard({ label, value, icon, subtext }: { label: string, value: string, icon: React.ReactNode, subtext?: string }) {
    return (
        <div className="bg-card border border-border p-6 rounded-lg flex items-start justify-between group hover:border-primary/50 transition-colors">
            <div>
                <p className="text-sm font-blueprint text-muted-foreground uppercase tracking-wider mb-1">{label}</p>
                <div className="text-4xl font-serif font-bold text-primary">{value}</div>
                {subtext && <p className="text-xs text-muted-foreground mt-2">{subtext}</p>}
            </div>
            <div className="text-muted-foreground group-hover:text-primary transition-colors">
                {icon}
            </div>
        </div>
    )
}
