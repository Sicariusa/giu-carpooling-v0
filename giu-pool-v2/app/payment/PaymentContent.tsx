"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { getRideById } from "@/lib/api";
import { Ride } from "@/types";
import CheckoutForm from "./CheckoutForm";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button"; // Make sure this path is correct

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

export default function PaymentContent() {
  const [ride, setRide] = useState<Ride | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const searchParams = useSearchParams();

  useEffect(() => {
    const rideId = searchParams.get("rideId");
    const token = typeof window !== "undefined" ? sessionStorage.getItem("token") : null;

    if (!rideId || !token) {
      setError("Missing ride information. Please try again.");
      setLoading(false);
      return;
    }

    getRideById(rideId, token)
      .then((data) => {
        const transformedRide: Ride = {
          _id: data._id,
          startLocation: data.startLocation,
          endLocation: data.endLocation,
          departureTime: data.departureTime,
          pricePerSeat: data.pricePerSeat,
          availableSeats: data.availableSeats,
          totalSeats: data.totalSeats ?? data.availableSeats,
          girlsOnly: data.girlsOnly || false,
          status: data.status,
          driverId: data.driverId || "",
          stops: data.stops || [],
        };
        setRide(transformedRide);
      })
      .catch((err) => {
        console.error("Ride fetch error:", err);
        setError("Failed to load ride details. Please try again.");
      })
      .finally(() => setLoading(false));
  }, [searchParams]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="w-12 h-12 animate-spin text-giu-red" />
          <p className="text-lg font-medium text-gray-700">Loading ride details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-6">
        <div className="bg-red-50 border border-red-100 rounded-xl p-6 max-w-md text-center">
          <h2 className="text-xl font-bold text-red-600 mb-2">Error Loading Ride</h2>
          <p className="text-gray-700 mb-4">{error}</p>
          <Button 
            variant="outline" 
            className="border-red-200 text-red-600"
            onClick={() => window.location.reload()}
          >
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  if (!ride) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-6">
        <div className="bg-yellow-50 border border-yellow-100 rounded-xl p-6 max-w-md text-center">
          <h2 className="text-xl font-bold text-yellow-600 mb-2">Ride Not Found</h2>
          <p className="text-gray-700">The ride you're looking for is no longer available.</p>
        </div>
      </div>
    );
  }

  return (
    <Elements stripe={stripePromise}>
      <div className="container max-w-md py-8 px-4">
        <CheckoutForm ride={ride} />
      </div>
    </Elements>
  );
}