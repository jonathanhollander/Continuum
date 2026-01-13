"use client"

import * as React from "react"
import { motion, Variants } from "framer-motion"
import { cn } from "@/lib/utils"

interface LivingBlueprintHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
    title: string
    subtitle?: string
    tier?: "preparation" | "executor" | "financial" | "legal" | "family"
}

export function LivingBlueprintHeader({
    title,
    subtitle,
    tier = "preparation",
    className,
    ...props
}: LivingBlueprintHeaderProps) {

    // Grid Pattern Definition
    const GridPattern = () => (
        <svg className="absolute inset-0 size-full opacity-20" aria-hidden="true">
            <defs>
                <pattern
                    id="blueprint-grid"
                    width="40"
                    height="40"
                    patternUnits="userSpaceOnUse"
                >
                    <path
                        d="M0 40L40 0H20L0 20M40 40V20L20 40"
                        stroke="currentColor"
                        strokeWidth="0.5"
                        fill="none"
                    />
                </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#blueprint-grid)" />
        </svg>
    )

    // Architectural Lines Animation
    const draw: Variants = {
        hidden: { pathLength: 0, opacity: 0 },
        visible: {
            pathLength: 1,
            opacity: 1,
            transition: { pathLength: { delay: 0.5, duration: 1.5, ease: "easeInOut" } }
        }
    }

    return (
        <header
            className={cn(
                "relative overflow-hidden bg-background text-foreground border-b border-border py-24",
                "before:absolute before:inset-0 before:bg-[radial-gradient(circle_at_center,var(--color-primary)_0%,transparent_70%)] before:opacity-5",
                className
            )}
            {...props}
        >
            {/* Layer 1: Technical Grid */}
            <div className="absolute inset-0 pointer-events-none text-muted-foreground/30">
                <GridPattern />
            </div>

            {/* Layer 2: Architectural Drawing (Simplified "Cornerstone" for now) */}
            <motion.svg
                viewBox="0 0 100 100"
                className="absolute top-0 right-0 size-64 text-primary/20 pointer-events-none"
                initial="hidden"
                animate="visible"
            >
                <motion.rect
                    x="10" y="10" width="80" height="80"
                    fill="none" stroke="currentColor" strokeWidth="1"
                    variants={draw}
                />
                <motion.line
                    x1="10" y1="10" x2="90" y2="90"
                    stroke="currentColor" strokeWidth="0.5"
                    variants={draw}
                />
                <motion.line
                    x1="90" y1="10" x2="10" y2="90"
                    stroke="currentColor" strokeWidth="0.5"
                    variants={draw}
                />
            </motion.svg>

            {/* Layer 3: Content using Heirloom Typography */}
            <div className="container relative z-10 px-6">
                <div className="max-w-3xl space-y-4">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                    >
                        {/* Tier Indicator (Blueprint Style) */}
                        <div className="font-blueprint text-xs tracking-[0.2em] uppercase text-muted-foreground mb-4 flex items-center gap-2">
                            <span className="w-8 h-[1px] bg-border" />
                            {tier} Module
                        </div>

                        {/* Main Title (Monument Serif) */}
                        <h1 className="font-serif text-5xl md:text-6xl font-bold tracking-tight text-primary">
                            {title}
                        </h1>

                        {/* Subtitle (Sans/Blueprint mix) */}
                        {subtitle && (
                            <p className="font-sans text-xl text-muted-foreground mt-4 max-w-xl leading-relaxed">
                                {subtitle}
                            </p>
                        )}
                    </motion.div>
                </div>
            </div>

            {/* Decorative Bottom Border (Meridian Line) */}
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
        </header>
    )
}
