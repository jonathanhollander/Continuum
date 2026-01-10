import { PrismaClient } from "@prisma/client"
import fs from "fs"
import path from "path"

// Note: You would typically install 'js-yaml' to parse the actual files.
// npm install js-yaml @types/js-yaml

const prisma = new PrismaClient()

async function main() {
    console.log("🌱 Starting Content Seeding...")

    // Mock Data mimicking what would be parsed from '52_executor_tools_content.yaml'
    const guides = [
        {
            title: "Immediate Steps After Loss",
            slug: "immediate-steps",
            category: "Critical",
            content: `
# Immediate Steps
The first 24-48 hours are about securing the physical estate and notifying key parties.

## 1. Secure Property
Ensure the primary residence is locked and pets are cared for.

## 2. Locate Will
Do not throw anything away. Search for the Will in the safe or filing cabinet.
      `
        },
        {
            title: "Understanding Probate",
            slug: "understanding-probate",
            category: "Legal",
            content: `
# Probate Basics
Probate is the legal process of administering the estate.

## Thresholds
Check if the total asset value exceeds your state's small estate threshold.
      `
        }
    ]

    for (const guide of guides) {
        await prisma.resource.upsert({
            where: { slug: guide.slug },
            update: {
                content: guide.content,
                title: guide.title,
                category: guide.category
            },
            create: {
                slug: guide.slug,
                title: guide.title,
                content: guide.content,
                category: guide.category
            }
        })
        console.log(`✅ Upserted Guide: ${guide.title}`)
    }

    console.log("🏁 Seeding Complete.")
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
