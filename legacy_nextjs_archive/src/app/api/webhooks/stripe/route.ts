import { headers } from "next/headers"
import { NextResponse } from "next/server"
import { stripe } from "@/lib/stripe"
import Stripe from "stripe"

export async function POST(req: Request) {
    const body = await req.text()
    const signature = (await headers()).get("Stripe-Signature") as string

    let event: Stripe.Event

    try {
        event = stripe.webhooks.constructEvent(
            body,
            signature,
            process.env.STRIPE_WEBHOOK_SECRET ?? ""
        )
    } catch (error) {
        return new NextResponse(`Webhook Error: ${error instanceof Error ? error.message : "Unknown Error"}`, { status: 400 })
    }

    // Handle specific events
    switch (event.type) {
        case "checkout.session.completed":
            const session = event.data.object as Stripe.Checkout.Session
            console.log(`💰 Payment successful for session ID: ${session.id}`)
            // TODO: Provision Estate Logic
            break
        default:
            console.log(`Unhandled event type ${event.type}`)
    }

    return new NextResponse(null, { status: 200 })
}
