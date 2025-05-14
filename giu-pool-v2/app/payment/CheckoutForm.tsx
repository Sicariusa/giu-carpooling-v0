"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useStripe, useElements, CardElement } from "@stripe/react-stripe-js";
import { Button } from "@/components/ui/button";
import { bookRide, createPayment, confirmBooking } from "@/lib/api";
import { Ride } from "@/types";

export default function CheckoutForm({ ride }: { ride: Ride }) {
  const [paymentMethod, setPaymentMethod] = useState("card");
  const [bookingId, setBookingId] = useState<string | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);

  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();

 useEffect(() => {
  const init = async () => {
    try {
      const token = sessionStorage.getItem("token");
      if (!token) throw new Error("No token");

      const pickupStopId = ride.stops[0]?.stopId;
      const dropoffStopId = ride.stops[ride.stops.length - 1]?.stopId;

      if (!pickupStopId || !dropoffStopId) {
        throw new Error("Ride is missing valid stops.");
      }

      const booking = await bookRide(ride.id, pickupStopId, dropoffStopId);
      setBookingId(booking.id);

      const payment = await createPayment({ bookingId: booking.id, amount: ride.price, token });
      setClientSecret(payment.clientSecret);
    } catch (err) {
      console.error("❌ Init failed in CheckoutForm:", err);
      alert("❌ Failed to start payment. Please try again.");
    }
  };

  if (paymentMethod === "card" && !bookingId && !clientSecret) {
    init();
  }
}, [paymentMethod]);



  const [loading, setLoading] = useState(false);

const handlePay = async () => {
  if (loading) return;
  setLoading(true);

  try {
    if (!bookingId) return;

    if (paymentMethod === "cash") {
      await confirmBooking(bookingId);
      alert("✅ Booking confirmed. Please pay cash on the ride.");
      router.push("/");
    } else if (stripe && elements && clientSecret) {
      const cardElement = elements.getElement(CardElement);
      const result = await stripe.confirmCardPayment(clientSecret, {
        payment_method: { card: cardElement! },
      });

      if (result.error) {
        alert(`❌ ${result.error.message}`);
      } else if (result.paymentIntent?.status === "succeeded") {
        alert("✅ Payment complete!");
        router.push("/");
      }
    }
  } catch (error) {
    console.error("❌ Payment failed:", error);
  } finally {
    setLoading(false);
  }
};


  return (
    <div className="space-y-4">
      <div className="rounded-lg bg-muted p-4 space-y-2">
        <div className="flex justify-between"><span>From</span><span>{ride.from}</span></div>
        <div className="flex justify-between"><span>To</span><span>{ride.to}</span></div>
        <div className="flex justify-between"><span>Date</span><span>{ride.date}</span></div>
        <div className="flex justify-between"><span>Time</span><span>{ride.time}</span></div>
        <div className="border-t pt-2 mt-2 flex justify-between font-semibold">
          <span>Total</span><span>{ride.price} EGP</span>
        </div>
      </div>

      <div>
        <label className="block mb-2">Payment Method</label>
        <div className="flex gap-4">
          <button
            className={`px-4 py-2 rounded ${paymentMethod === "card" ? "bg-giu-red text-white" : "bg-gray-200"}`}
            onClick={() => setPaymentMethod("card")}
          >
            Card
          </button>
          <button
            className={`px-4 py-2 rounded ${paymentMethod === "cash" ? "bg-giu-red text-white" : "bg-gray-200"}`}
            onClick={() => setPaymentMethod("cash")}
          >
            Cash
          </button>
        </div>
      </div>

      {paymentMethod === "card" && (
        <CardElement options={{ style: { base: { fontSize: "16px" } } }} />
      )}

     <Button onClick={handlePay} className="w-full bg-giu-red mt-4" disabled={loading}>
  {loading ? "Processing..." : `Pay ${ride.price} EGP`}
</Button>

    </div>
  );
}
