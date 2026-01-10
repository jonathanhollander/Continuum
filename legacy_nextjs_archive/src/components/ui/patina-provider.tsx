"use client"

import React, { createContext, useContext, useEffect, useState } from "react"

type PatinaLevel = "new" | "aged" | "ancient"

interface PatinaContextType {
    level: PatinaLevel
    setPatinaLevel: (level: PatinaLevel) => void
}

const PatinaContext = createContext<PatinaContextType | undefined>(undefined)

export function PatinaProvider({ children }: { children: React.ReactNode }) {
    const [level, setLevel] = useState<PatinaLevel>("new")

    // Update CSS variables based on patina level
    useEffect(() => {
        const root = document.documentElement
        if (level === "new") {
            root.style.setProperty("--patina-opacity", "0")
            root.style.setProperty("--patina-sepia", "0")
        } else if (level === "aged") {
            root.style.setProperty("--patina-opacity", "0.05") // 5% overlay
            root.style.setProperty("--patina-sepia", "0.1")
        } else if (level === "ancient") {
            root.style.setProperty("--patina-opacity", "0.15") // 15% overlay
            root.style.setProperty("--patina-sepia", "0.3")
        }
    }, [level])

    return (
        <PatinaContext.Provider value={{ level, setPatinaLevel: setLevel }}>
            <div className="relative isolate">
                {/* Global Patina Overlay */}
                <div
                    className="pointer-events-none fixed inset-0 z-[-1] transition-all duration-1000 ease-in-out"
                    style={{
                        backgroundColor: `hsl(var(--color-umber-script) / var(--patina-opacity, 0))`,
                        filter: `sepia(var(--patina-sepia, 0)) url('/tex/paper-grain.png')`, // Texture placeholder
                    }}
                />
                {children}
            </div>
        </PatinaContext.Provider>
    )
}

export const usePatina = () => {
    const context = useContext(PatinaContext)
    if (!context) throw new Error("usePatina must be used within a PatinaProvider")
    return context
}
