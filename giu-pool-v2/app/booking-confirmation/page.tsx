"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { CheckCircle, XCircle } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function BookingConfirmationPage() {
  const [status, setStatus] = useState<"success" | "failure" | null>(null)
  const searchParams = useSearchParams()

  useEffect(() => {
    const paymentIntent = searchParams.get("payment_intent")
    const paymentIntentClientSecret = searchParams.get("payment_intent_client_secret")

    if (paymentIntent && paymentIntentClientSecret) {
      // Here you would typically verify the payment status with your backend
      // For this example, we'll just set it to success
      setStatus("success")
    } else {
      setStatus("failure")
    }
  }, [searchParams])

  if (status === null) {
    return <div>Loading...</div>
  }

  return (
    <div className="container max-w-md py-16">
      <Card>
        <CardHeader>
          <CardTitle>{status === "success" ? "Booking Confirmed!" : "Booking Failed"}</CardTitle>
          <CardDescription>
            {status === "success" ? "Your ride has been successfully booked." : "There was an issue with your booking."}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center">
          {status === "success" ? (
            <CheckCircle className="w-16 h-16 text-emerald-400" />
          ) : (
            <XCircle className="w-16 h-16 text-red-400" />
          )}
          <p className="mt-4 text-center">
            {status === "success"
              ? "Thank you for using GIU Pool. Your driver will be notified of your booking."
              : "Please try again or contact support if the problem persists."}
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

