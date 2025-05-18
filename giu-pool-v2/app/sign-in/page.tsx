"use client";

import { useState } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function SignInPage() {
  const [formData, setFormData] = useState({
    universityId: "",
    password: ""
  });
  const [error, setError] = useState("");
  const [showVerifyButton, setShowVerifyButton] = useState(false);
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const validateInputs = () => {
    if (!formData.universityId || isNaN(Number(formData.universityId))) {
      setError("University ID must be a valid number.");
      return false;
    }
    if (!formData.password || formData.password.trim().length < 6) {
      setError("Password must be at least 6 characters long.");
      return false;
    }
    return true;
  };

  const handleSignIn = async () => {
    if (!validateInputs()) return;

    setError("");
    setShowVerifyButton(false);

    try {
      const response = await axios.post("http://localhost:3000/graphql", {
        query: `
          mutation Login($universityId: Int!, $password: String!) {
            login(universityId: $universityId, password: $password) {
              accessToken
              user {
                id
                universityId
                email
                role
              }
            }
          }
        `,
        variables: {
          universityId: parseInt(formData.universityId, 10),
          password: formData.password,
        },
      });

      const result = response.data;

      if (result.data?.login) {
        const { accessToken, user } = result.data.login;
        sessionStorage.setItem("token", accessToken);
        window.dispatchEvent(new Event("userLoginStatusChanged"));
        router.push(`/dashboard/${user.role.toLowerCase()}`);
      } else {
        const errMsg = result.errors?.[0]?.message || "Sign-in failed";
        setError(errMsg);
        if (errMsg.toLowerCase().includes("verify")) {
          setShowVerifyButton(true);
        }
      }
    } catch (err: any) {
      const errMsg = err.response?.data?.errors?.[0]?.message || "An error occurred. Please try again.";
      setError(errMsg);
      if (errMsg.toLowerCase().includes("verify")) {
        setShowVerifyButton(true);
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-50 to-white p-4">
      <Card className="w-full max-w-md border-none shadow-lg">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto flex items-center justify-center w-16 h-16 rounded-full bg-giu-gold/10 mb-4">
            <span className="text-2xl font-bold text-giu-gold">G</span>
          </div>
          <CardTitle className="text-2xl font-bold text-gray-800">Welcome Back</CardTitle>
          <p className="text-sm text-gray-500">Sign in to your GIU Pool account</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="universityId" className="text-gray-700">GIU ID</Label>
            <Input
              id="universityId"
              type="text"
              placeholder="Enter your GIU ID"
              value={formData.universityId}
              onChange={handleChange}
              className="focus:ring-2 focus:ring-giu-gold"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password" className="text-gray-700">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="Enter your password"
              value={formData.password}
              onChange={handleChange}
              className="focus:ring-2 focus:ring-giu-gold"
            />
          </div>

          {error && (
            <div className="text-red-500 text-sm p-3 bg-red-50 rounded-md">
              {error}
            </div>
          )}

          <div className="flex justify-end">
            <Link 
              href="/forgot-password" 
              className="text-sm text-giu-red hover:underline"
            >
              Forgot password?
            </Link>
          </div>

          {showVerifyButton && (
            <Button
              variant="outline"
              className="w-full border-giu-red text-giu-red hover:bg-giu-red/10"
              onClick={() => router.push("/verify-otp")}
            >
              Go to Email Verification
            </Button>
          )}

          <Button
            className="w-full bg-giu-red hover:bg-giu-red/90 transition-colors shadow-md"
            onClick={handleSignIn}
          >
            Sign In
          </Button>

          <div className="text-center text-sm text-gray-500 mt-4">
            Don't have an account?{" "}
            <Link href="/sign-up" className="text-giu-gold hover:underline">
              Sign up
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}