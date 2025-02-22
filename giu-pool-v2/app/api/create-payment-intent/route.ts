import { NextResponse } from "next/server"
import Stripe from "stripe"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2022-11-15",
})

export async function POST(request: Request) {
  const { items } = await request.json()

  // Create a PaymentIntent with the order amount and currency
  const paymentIntent = await stripe.paymentIntents.create({
    amount: 5000, // Replace with actual amount
    currency: "egp",
    automatic_payment_methods: {
      enabled: true,
    },
  })

  return NextResponse.json({
    clientSecret: paymentIntent.client_secret,
  })
}

