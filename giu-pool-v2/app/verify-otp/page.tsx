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

      const result = response.data;

      if (result.data?.verifyOtp) {
        setSuccess("OTP verified successfully! Redirecting to login...");
        setError("");

        // Redirect to the login page after a short delay
        setTimeout(() => {
          router.push("/sign-in");
        }, 2000);
      } else {
        setError(result.errors?.[0]?.message || "OTP verification failed.");
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

      const result = response.data;

      if (result.data?.sendOtp) {
        setResendSuccess("OTP has been resent to your email.");
        setError("");
      } else {
        setError(result.errors?.[0]?.message || "Failed to resend OTP.");
      }
    } catch (err) {
      setError("An error occurred while resending OTP. Please try again.");
    }
  };

  return (
    <div className="container max-w-md py-16">
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Verify OTP</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="otp">OTP</Label>
            <Input
              id="otp"
              type="text"
              placeholder="Enter the OTP sent to your email"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
            />
          </div>
          {error && <p className="text-red-500">{error}</p>}
          {success && <p className="text-green-500">{success}</p>}
          {resendSuccess && <p className="text-green-500">{resendSuccess}</p>}
          <Button
            className="w-full bg-emerald-400 hover:bg-emerald-500"
            onClick={handleVerifyOtp}
          >
            Verify OTP
          </Button>
          <Button
            className="w-full bg-blue-400 hover:bg-blue-500 mt-4"
            onClick={handleResendOtp}
          >
            Resend OTP
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}