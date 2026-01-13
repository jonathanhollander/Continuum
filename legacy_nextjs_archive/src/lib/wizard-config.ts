import { z } from "zod"

export const WIZARD_SCHEMA = z.object({
    estateName: z.string().min(3, "Estate name must be at least 3 characters"),
    region: z.string().min(2, "Region/State is required"),
    ownerRole: z.enum(["owner", "executor", "beneficiary"]),
    primaryGoal: z.enum(["probate", "planning", "administration"]),
})

export type WizardData = z.infer<typeof WIZARD_SCHEMA>

export const WIZARD_STEPS = [
    {
        id: "basics",
        title: "Estate Essentials",
        subtitle: "Let's establish the foundation of the estate.",
        fields: [
            { name: "estateName", label: "Estate Name", type: "text", placeholder: "The Estate of Arthur ..." },
            { name: "region", label: "Jurisdiction (State)", type: "select", options: ["CA", "NY", "TX", "FL", "IL"] }, // Simplified
        ]
    },
    {
        id: "role",
        title: "Your Role",
        subtitle: "Clarify your legal standing regarding this estate.",
        fields: [
            { name: "ownerRole", label: "I am the...", type: "radio", options: ["Executor", "Owner", "Beneficiary"] }
        ]
    },
    {
        id: "goal",
        title: "Primary Objective",
        subtitle: "What is the most urgent focus right now?",
        fields: [
            { name: "primaryGoal", label: "Focus", type: "card_select", options: ["Probate Administration", "Proactive Planning", "Trust Administration"] }
        ]
    }
]
