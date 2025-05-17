"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { CheckCircle, XCircle, ArrowLeft, Clock, Calendar, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function BookingConfirmationPage() {
  const [status, setStatus] = useState<"success" | "failure" | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const statusParam = searchParams.get("status");
    if (statusParam === "success") {
      setStatus("success");
    } else {
      setStatus("failure");
    }
    // Simulate loading delay for better UX
    const timer = setTimeout(() => setIsLoading(false), 1500);
    return () => clearTimeout(timer);
  }, [searchParams]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center space-y-4">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-giu-red/20 border-t-giu-red rounded-full animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <Clock className="w-6 h-6 text-giu-red animate-pulse" />
            </div>
          </div>
          <h2 className="text-xl font-medium text-gray-700">Finalizing your booking...</h2>
          <p className="text-gray-500 text-sm">This will just take a moment</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container max-w-md py-8 px-4">
        <Button 
          variant="ghost" 
          className="mb-4 -ml-2" 
          onClick={() => router.push("/")}
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back to home
        </Button>

        <Card className="overflow-hidden shadow-lg border-0">
          <CardHeader className={`${status === "success" ? "bg-gradient-to-r from-emerald-500 to-emerald-600" : "bg-gradient-to-r from-red-500 to-red-600"} text-white pb-16 relative`}>
            <div className="absolute -bottom-12 left-1/2 transform -translate-x-1/2">
              <div className={`w-24 h-24 rounded-full ${status === "success" ? "bg-emerald-100" : "bg-red-100"} flex items-center justify-center shadow-lg`}>
                {status === "success" ? (
                  <CheckCircle className="w-12 h-12 text-emerald-600 animate-bounce" />
                ) : (
                  <XCircle className="w-12 h-12 text-red-600" />
                )}
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="pt-16 pb-8">
            <div className="text-center mb-6">
              <CardTitle className="text-2xl font-bold mb-2">
                {status === "success" ? "Booking Confirmed!" : "Booking Failed"}
              </CardTitle>
              <CardDescription className={`${status === "success" ? "text-emerald-600" : "text-red-600"} font-medium`}>
                {status === "success" 
                  ? "Your ride is all set!" 
                  : "We couldn't complete your booking"}
              </CardDescription>
            </div>

            {status === "success" && (
              <div className="bg-emerald-50 rounded-lg p-4 mb-6 space-y-3">
                <div className="flex items-center space-x-3">
                  <Calendar className="w-5 h-5 text-emerald-600" />
                  <span className="text-sm">Thursday, May 23 at 8:30 AM</span>
                </div>
                <div className="flex items-center space-x-3">
                  <MapPin className="w-5 h-5 text-emerald-600" />
                  <span className="text-sm">From GIU Main Gate to Downtown Cairo</span>
                </div>
              </div>
            )}

            <p className={`text-center mb-6 ${status === "success" ? "text-gray-600" : "text-gray-700"}`}>
              {status === "success"
                ? "Your driver has been notified and will contact you with pickup details. You can view all your bookings in your account."
                : "Please try again or contact our support team if the problem persists."}
            </p>

            <div className="flex flex-col space-y-3">
              <Button 
                size="lg" 
                className={`w-full ${status === "success" ? "bg-emerald-600 hover:bg-emerald-700" : "bg-red-600 hover:bg-red-700"}`}
                onClick={() => router.push(status === "success" ? "/dashboard/passenger" : "/")}
              >
                {status === "success" ? "View My Bookings" : "Try Again"}
              </Button>
              {status === "success" && (
                <Button 
                  variant="outline" 
                  size="lg" 
                  className="w-full"
                  onClick={() => router.push("/")}
                >
                  Back to Home
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {status === "success" && (
          <div className="mt-6 text-center text-sm text-gray-500">
            <p>Need help? Contact support@giupool.com</p>
          </div>
        )}
      </div>
    </div>
  );
}