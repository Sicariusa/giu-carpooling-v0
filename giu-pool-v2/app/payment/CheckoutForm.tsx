"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useStripe, useElements, CardElement } from "@stripe/react-stripe-js";
import { Button } from "@/components/ui/button";
import { bookRide, createPayment, confirmBooking } from "@/lib/api";
import { Ride } from "@/types";
import { Loader2, CreditCard, Banknote, ChevronLeft, MapPin, Calendar, Clock } from "lucide-react";

export default function CheckoutForm({ ride }: { ride: Ride }) {
  const [paymentMethod, setPaymentMethod] = useState<"card" | "cash">("card");
  const [bookingId, setBookingId] = useState<string | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [hasInitialized, setHasInitialized] = useState(false);
  const initLock = useRef(false);

  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();

  const initBooking = async () => {
    if (initLock.current) return;
    initLock.current = true;

    try {
      const token = sessionStorage.getItem("token");
      if (!token) throw new Error("No token found");

      const pickupStopId = ride.stops[0]?.stopId;
      const dropoffStopId = ride.stops[ride.stops.length - 1]?.stopId;

      if (!pickupStopId || !dropoffStopId) {
        throw new Error("Ride has no valid stops.");
      }

      const booking = await bookRide(ride._id, pickupStopId, dropoffStopId);
      setBookingId(booking.id);

      const payment = await createPayment({
        bookingId: booking.id,
        amount: ride.pricePerSeat,
        token,
      });
      setClientSecret(payment.clientSecret);
    } catch (err) {
      console.error("❌ initBooking failed:", err);
      alert("Something went wrong. Please refresh and try again.");
    }
  };

  useEffect(() => {
    if (paymentMethod === "card" && !hasInitialized) {
      setHasInitialized(true);
      initBooking();
    }
  }, [paymentMethod, hasInitialized]);

  const handlePay = async () => {
    if (loading || !bookingId) return;
    setLoading(true);

    try {
      if (paymentMethod === "cash") {
        await confirmBooking(bookingId);
        router.push("/booking-confirmation?status=success");
      } else if (stripe && elements && clientSecret) {
        const cardElement = elements.getElement(CardElement);
        if (!cardElement) throw new Error("Card element not loaded");

        const result = await stripe.confirmCardPayment(clientSecret, {
          payment_method: { card: cardElement },
        });

        if (result.error) {
          console.error("❌ Stripe error:", result.error.message);
          router.push("/booking-confirmation?status=failure");
        } else if (result.paymentIntent?.status === "succeeded") {
          await confirmBooking(bookingId);
          router.push("/booking-confirmation?status=success");
        }
      }
    } catch (err) {
      console.error("❌ Payment failed:", err);
      router.push("/booking-confirmation?status=failure");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2">
        <Button 
          variant="ghost" 
          size="icon" 
          className="rounded-full"
          onClick={() => router.back()}
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-bold">Complete Payment</h1>
      </div>

      {/* Ride Summary Card */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold mb-4 flex items-center">
          <MapPin className="w-5 h-5 mr-2 text-giu-red" />
          Ride Details
        </h2>
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-gray-600">Pickup</span>
            <span className="font-medium text-right">{ride.startLocation}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Dropoff</span>
            <span className="font-medium text-right">{ride.endLocation}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600 flex items-center">
              <Calendar className="w-4 h-4 mr-1" />
              Departure
            </span>
            <span className="font-medium">{formatDate(ride.departureTime)}</span>
          </div>
          <div className="border-t pt-3 mt-2 flex justify-between font-bold text-lg">
            <span>Total Amount</span>
            <span className="text-giu-red">{ride.pricePerSeat} EGP</span>
          </div>
        </div>
      </div>

      {/* Payment Method Selection */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold mb-4">Select Payment Method</h2>
        <div className="grid grid-cols-2 gap-3">
          <button
            className={`p-4 rounded-lg border-2 transition-all flex flex-col items-center ${
              paymentMethod === "card" 
                ? "border-giu-red bg-giu-red/10" 
                : "border-gray-200 hover:border-gray-300"
            }`}
            onClick={() => setPaymentMethod("card")}
            disabled={!!bookingId}
          >
            <CreditCard className={`w-6 h-6 mb-2 ${
              paymentMethod === "card" ? "text-giu-red" : "text-gray-500"
            }`} />
            <span className={`font-medium ${
              paymentMethod === "card" ? "text-giu-red" : "text-gray-700"
            }`}>Credit Card</span>
          </button>
          <button
            className={`p-4 rounded-lg border-2 transition-all flex flex-col items-center ${
              paymentMethod === "cash" 
                ? "border-giu-red bg-giu-red/10" 
                : "border-gray-200 hover:border-gray-300"
            }`}
            onClick={() => setPaymentMethod("cash")}
            disabled={!!bookingId}
          >
            <Banknote className={`w-6 h-6 mb-2 ${
              paymentMethod === "cash" ? "text-giu-red" : "text-gray-500"
            }`} />
            <span className={`font-medium ${
              paymentMethod === "cash" ? "text-giu-red" : "text-gray-700"
            }`}>Cash</span>
          </button>
        </div>

        {paymentMethod === "card" && (
          <div className="mt-6">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Card Details</h3>
            <div className="p-4 border border-gray-200 rounded-lg">
              <CardElement 
                options={{ 
                  style: { 
                    base: { 
                      fontSize: "16px",
                      color: "#374151",
                      "::placeholder": {
                        color: "#9CA3AF",
                      },
                    } 
                  },
                  hidePostalCode: true
                }} 
              />
            </div>
          </div>
        )}
      </div>

      {/* Pay Button */}
      <Button
        onClick={handlePay}
        className="w-full h-14 bg-gradient-to-r from-giu-red to-giu-red-dark hover:from-giu-red/90 hover:to-giu-red-dark/90 mt-2 flex items-center justify-center rounded-xl shadow-md transition-all"
        disabled={loading}
      >
        {loading ? (
          <span className="flex items-center gap-2">
            <Loader2 className="w-5 h-5 animate-spin" /> 
            <span className="text-lg">Processing Payment...</span>
          </span>
        ) : (
          <span className="text-lg">
            Pay {ride.pricePerSeat} EGP
          </span>
        )}
      </Button>

      {paymentMethod === "cash" && (
        <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 text-center text-blue-700 text-sm">
          <p>You'll pay the driver in cash when you meet for the ride.</p>
        </div>
      )}
    </div>
  );
}