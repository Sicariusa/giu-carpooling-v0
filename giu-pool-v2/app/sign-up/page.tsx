"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function SignUpPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    universityId: "",
    email: "",
    password: "",
    confirmPassword: "",
    firstName: "",
    lastName: "",
    phoneNumber: "",
    gender: ""
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const validateInputs = () => {
    const { universityId, email, password, confirmPassword, firstName, lastName, gender, phoneNumber } = formData;
    
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
    if (!gender) {
      setError("Gender is required.");
      return false;
    }
    if (phoneNumber && isNaN(Number(phoneNumber))) {
      setError("Phone number must be a valid number.");
      return false;
    }
    return true;
  };

  const capitalize = (text: string) => text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();

  const handleSignUp = async () => {
    if (!validateInputs()) return;

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
            universityId: parseInt(formData.universityId, 10),
            email: formData.email,
            password: formData.password,
            firstName: formData.firstName,
            lastName: formData.lastName,
            gender: capitalize(formData.gender),
            phoneNumber: formData.phoneNumber ? parseInt(formData.phoneNumber, 10) : null,
          },
        },
      });

      if (response.data.data?.registerUser) {
        setSuccess("Sign-up successful! Redirecting to OTP verification...");
        setError("");
        setTimeout(() => {
          router.push(`/verify-otp?email=${encodeURIComponent(formData.email)}`);
        }, 2000);
      } else {
        setError(response.data.errors?.[0]?.message || "Sign-up failed");
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-50 to-white p-4">
      <Card className="w-full max-w-md border-none shadow-lg">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto flex items-center justify-center w-16 h-16 rounded-full bg-giu-gold/10 mb-4">
            <span className="text-2xl font-bold text-giu-gold">G</span>
          </div>
          <CardTitle className="text-2xl font-bold text-gray-800">Create Your Account</CardTitle>
          <p className="text-sm text-gray-500">Join the GIU carpooling community</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName" className="text-gray-700">First Name</Label>
              <Input
                id="firstName"
                placeholder="John"
                value={formData.firstName}
                onChange={handleChange}
                className="focus:ring-2 focus:ring-giu-gold"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName" className="text-gray-700">Last Name</Label>
              <Input
                id="lastName"
                placeholder="Doe"
                value={formData.lastName}
                onChange={handleChange}
                className="focus:ring-2 focus:ring-giu-gold"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="universityId" className="text-gray-700">GIU ID</Label>
            <Input
              id="universityId"
              placeholder="123456"
              value={formData.universityId}
              onChange={handleChange}
              className="focus:ring-2 focus:ring-giu-gold"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="text-gray-700">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="john.doe@example.com"
              value={formData.email}
              onChange={handleChange}
              className="focus:ring-2 focus:ring-giu-gold"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="password" className="text-gray-700">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
                className="focus:ring-2 focus:ring-giu-gold"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-gray-700">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                value={formData.confirmPassword}
                onChange={handleChange}
                className="focus:ring-2 focus:ring-giu-gold"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="gender" className="text-gray-700">Gender</Label>
            <Select value={formData.gender} onValueChange={(value) => setFormData({...formData, gender: value})}>
              <SelectTrigger className="focus:ring-2 focus:ring-giu-gold">
                <SelectValue placeholder="Select gender" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Male">Male</SelectItem>
                <SelectItem value="Female">Female</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="phoneNumber" className="text-gray-700">Phone Number (Optional)</Label>
            <Input
              id="phoneNumber"
              placeholder="01234567890"
              value={formData.phoneNumber}
              onChange={handleChange}
              className="focus:ring-2 focus:ring-giu-gold"
            />
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}
          {success && <p className="text-green-500 text-sm">{success}</p>}

          <Button
            className="w-full bg-giu-red hover:bg-giu-red/90 transition-colors shadow-md"
            onClick={handleSignUp}
          >
            Sign Up
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}