"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";

export default function SignUpPage() {
  const router = useRouter();
  const [universityId, setUniversityId] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const validateInputs = () => {
    if (!universityId || isNaN(Number(universityId))) {
      setError("University ID must be a valid number.");
      return false;
    }
    if (!email || !email.includes("@")) {
      setError("Please enter a valid email address.");
      return false;
    }
    if (!password || password.trim().length < 6) {
      setError("Password must be at least 6 characters long.");
      return false;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return false;
    }
    if (!firstName.trim()) {
      setError("First name is required.");
      return false;
    }
    if (!lastName.trim()) {
      setError("Last name is required.");
      return false;
    }
    if (phoneNumber && isNaN(Number(phoneNumber))) {
      setError("Phone number must be a valid number.");
      return false;
    }
    return true;
  };

  const handleSignUp = async () => {
    if (!validateInputs()) {
      return;
    }

    try {
      const response = await axios.post("http://localhost:3000/graphql", {
        query: `
          mutation RegisterUser($input: CreateUserInput!) {
            registerUser(input: $input) {
              id
              universityId
              email
              role
            }
          }
        `,
        variables: {
          input: {
            universityId: parseInt(universityId, 10),
            email,
            password,
            firstName,
            lastName,
            phoneNumber: phoneNumber ? parseInt(phoneNumber, 10) : null,
          },
        },
      });

      const result = response.data;

      if (result.data?.registerUser) {
        setSuccess("Sign-up successful! Redirecting to OTP verification...");
        setError("");
        setTimeout(() => {
          router.push(
            `/verify-otp?email=${encodeURIComponent(email)}`
          );
        }, 2000);
      } else {
        setError(result.errors?.[0]?.message || "Sign-up failed");
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
    }
  };

  return (
    <div className="container max-w-md py-16">
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Sign Up</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="GIU id">GIU ID</Label>
            <Input
              id="ID"
              type="text"
              placeholder="Enter your GIU ID"
              value={universityId}
              onChange={(e) => setUniversityId(e.target.value)}
            />
          </div>
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
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm-password">Confirm Password</Label>
            <Input
              id="confirm-password"
              type="password"
              placeholder="Confirm your password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="first-name">First Name</Label>
            <Input
              id="first-name"
              type="text"
              placeholder="Enter your first name"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="last-name">Last Name</Label>
            <Input
              id="last-name"
              type="text"
              placeholder="Enter your last name"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone-number">Phone Number (Optional)</Label>
            <Input
              id="phone-number"
              type="text"
              placeholder="Enter your phone number"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
            />
          </div>
          {error && <p className="text-red-500">{error}</p>}
          {success && <p className="text-green-500">{success}</p>}
          <Button
            className="w-full bg-emerald-400 hover:bg-emerald-500"
            onClick={handleSignUp}
          >
            Sign Up
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}