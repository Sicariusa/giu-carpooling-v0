"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { getRideById } from "@/lib/api";
import { Ride } from "@/types";
import CheckoutForm from "./CheckoutForm";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

export default function PaymentContent() {
  const [ride, setRide] = useState<Ride | null>(null);
  const searchParams = useSearchParams();

useEffect(() => {
  const rideId = searchParams.get("rideId");
  const token = typeof window !== "undefined" ? sessionStorage.getItem("token") : null;

  if (!rideId || !token) {
    console.warn("🚫 rideId or token missing");
    return;
  }

  getRideById(rideId, token)
    .then((data) => {
      console.log("✅ Ride fetched:", data);
      setRide(data);
    })
    .catch((err) => {
      console.error("❌ Ride fetch error:", err);
      alert("❌ Ride not found.");
    });
}, [searchParams]);


  if (!ride) return <div className="p-6">Loading ride details...</div>;

  return (
    <Elements stripe={stripePromise}>
      <div className="container max-w-md py-16">
        <CheckoutForm ride={ride} />
      </div>
    </Elements>
  );
}
