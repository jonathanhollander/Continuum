import { Estate, Task } from "@prisma/client"

export class SmartGuidanceEngine {

    /**
     * Generates contextual guidance based on Estate status and progress.
     * Maps to the 'Smart_Help_Guidance' Notion formula.
     */
    static generateGuidance(estate: Estate, tasks: Task[]): {
        headline: string,
        subtext: string,
        priority: "low" | "medium" | "high" | "critical"
    } {
        const totalTasks = tasks.length
        if (totalTasks === 0) {
            return {
                headline: "Initialize Estate Plan",
                subtext: "Begin by adding the first critical tasks to the immediate checklist.",
                priority: "high"
            }
        }

        const completedTasks = tasks.filter(t => t.status === "COMPLETED").length
        const progress = completedTasks / totalTasks
        const daysActive = Math.floor((Date.now() - new Date(estate.createdAt).getTime()) / (1000 * 60 * 60 * 24))

        // Early Stage Logic
        if (daysActive < 7) {
            if (progress < 0.1) {
                return {
                    headline: "Focus on Immediate Necessities",
                    subtext: "The first week is about securing assets and notifying key contacts. Don't worry about the long term yet.",
                    priority: "critical"
                }
            }
        }

        // Mid Stage Logic
        if (progress > 0.5 && progress < 0.8) {
            return {
                headline: "Significant Progress Made",
                subtext: "You passed the halfway mark. Now is the time to review tax implications.",
                priority: "medium"
            }
        }

        // Default Fallback
        return {
            headline: "Continue Steady Progress",
            subtext: "Maintain momentum on the remaining checklist items.",
            priority: "low"
        }
    }
}
