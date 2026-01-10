"use client"

import * as React from "react"
import { motion } from "framer-motion"

interface RevealTransitionProps {
    children: React.ReactNode
    delay?: number
    type?: "fade" | "vault" | "blueprint"
}

export function RevealTransition({ children, delay = 0, type = "vault" }: RevealTransitionProps) {

    // "Vault" Effect: Circular Reveal
    const vaultVariants = {
        hidden: {
            clipPath: "circle(0% at 50% 50%)",
            opacity: 0
        },
        visible: {
            clipPath: "circle(150% at 50% 50%)",
            opacity: 1,
            transition: {
                duration: 1.2,
                ease: [0.22, 1, 0.36, 1], // Custom easing
                delay: delay
            }
        }
    }

    // "Blueprint" Effect: Unfolding from top
    const blueprintVariants = {
        hidden: {
            height: 0,
            opacity: 0,
            borderBottom: "1px solid transparent"
        },
        visible: {
            height: "auto",
            opacity: 1,
            borderBottom: "1px solid var(--border)",
            transition: {
                duration: 0.8,
                ease: "easeInOut",
                delay: delay
            }
        }
    }

    const variants = type === "vault" ? vaultVariants : blueprintVariants

    return (
        <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={variants}
            className={type === "blueprint" ? "overflow-hidden" : ""}
        >
            {children}
        </motion.div>
    )
}
