"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";

export default function VerifyOtpPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [resendSuccess, setResendSuccess] = useState("");

  useEffect(() => {
    const emailFromQuery = searchParams.get("email");
    if (emailFromQuery) {
      setEmail(emailFromQuery);
    }
  }, [searchParams]);

  const handleVerifyOtp = async () => {
    if (!email || !email.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }
    if (!otp || otp.trim().length !== 6) {
      setError("Please enter a valid 6-digit OTP.");
      return;
    }
    try {
      const response = await axios.post("http://localhost:3000/graphql", {
        query: `
          mutation VerifyOtp($email: String!, $otp: String!) {
            verifyOtp(email: $email, otp: $otp)
          }
        `,
        variables: {
          email,
          otp,
        },
      });
      if (response.data.data?.verifyOtp) {
        setSuccess("OTP verified successfully! Redirecting to login...");
        setError("");
        setTimeout(() => {
          router.push("/sign-in");
        }, 2000);
      } else {
        setError(response.data.errors?.[0]?.message || "OTP verification failed.");
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
    }
  };

  const handleResendOtp = async () => {
    if (!email || !email.includes("@")) {
      setError("Please enter a valid email address to resend OTP.");
      return;
    }
    try {
      const response = await axios.post("http://localhost:3000/graphql", {
        query: `
          mutation SendOtp($email: String!) {
            sendOtp(email: $email)
          }
        `,
        variables: {
          email,
        },
      });
      if (response.data.data?.sendOtp) {
        setResendSuccess("OTP has been resent to your email.");
        setError("");
      } else {
        setError(response.data.errors?.[0]?.message || "Failed to resend OTP.");
      }
    } catch (err) {
      setError("An error occurred while resending OTP. Please try again.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-50 to-white p-4">
      <Card className="w-full max-w-md border-none shadow-lg">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto flex items-center justify-center w-16 h-16 rounded-full bg-giu-gold/10 mb-4">
            <span className="text-2xl font-bold text-giu-gold">G</span>
          </div>
          <CardTitle className="text-2xl font-bold text-gray-800">Verify Your Email</CardTitle>
          <p className="text-sm text-gray-500">Enter the OTP sent to your email</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-gray-700">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="your.email@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="focus:ring-2 focus:ring-giu-gold"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="otp" className="text-gray-700">OTP Code</Label>
            <Input
              id="otp"
              type="text"
              placeholder="Enter 6-digit code"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              className="focus:ring-2 focus:ring-giu-gold text-center tracking-widest"
            />
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}
          {success && <p className="text-green-500 text-sm">{success}</p>}
          {resendSuccess && <p className="text-green-500 text-sm">{resendSuccess}</p>}

          <Button
            className="w-full bg-giu-red hover:bg-giu-red/90 transition-colors shadow-md"
            onClick={handleVerifyOtp}
          >
            Verify OTP
          </Button>
          <Button
            variant="outline"
            className="w-full border-giu-gold text-giu-gold hover:bg-giu-gold/10 mt-2"
            onClick={handleResendOtp}
          >
            Resend OTP
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}