"use client"

import * as React from "react"
import { motion, HTMLMotionProps, Variants } from "framer-motion"
import { cn } from "@/lib/utils"

interface MechanicalIconProps extends HTMLMotionProps<"svg"> {
    urgency?: "normal" | "urgent"
    paths: React.ReactNode // The SVG paths to render
}

export function MechanicalIcon({ urgency = "normal", paths, className, ...props }: MechanicalIconProps) {
    // Mechanical "Tick" animation
    const tickVariants: Variants = {
        normal: { opacity: 1, rotate: 0 },
        urgent: {
            opacity: 1,
            rotate: [0, -5, 5, -5, 0],
            transition: {
                duration: 0.5,
                repeat: Infinity,
                repeatDelay: 1
            }
        }
    }

    // Gear rotation simulation
    const gearVariants: Variants = {
        hover: { rotate: 180, transition: { duration: 1, ease: "anticipate" } }
    }

    return (
        <motion.svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5" // Fine technical line
            strokeLinecap="round"
            strokeLinejoin="round"
            className={cn("size-6 text-foreground/80", className)}
            whileHover="hover"
            animate={urgency === "urgent" ? "urgent" : "normal"}
            variants={tickVariants}
            {...props}
        >
            <motion.g variants={gearVariants} style={{ originX: "50%", originY: "50%" }}>
                {paths}
            </motion.g>

            {/* Decorative "Jewel" Bearing - Swiss Watch Style */}
            <circle cx="12" cy="12" r="1" className="fill-destructive/20 stroke-none" />
        </motion.svg>
    )
}

// Example Icons using the System
export const Icons = {
    // Vault / Security
    Vault: (props: Omit<MechanicalIconProps, "paths">) => (
        <MechanicalIcon {...props} paths={
            <>
                <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </>
        } />
    ),
    // Estate / Home
    Estate: (props: Omit<MechanicalIconProps, "paths">) => (
        <MechanicalIcon {...props} paths={
            <>
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
            </>
        } />
    ),
    // Timeline / Clock
    Chronos: (props: Omit<MechanicalIconProps, "paths">) => (
        <MechanicalIcon {...props} paths={
            <>
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
            </>
        } />
    )
}
