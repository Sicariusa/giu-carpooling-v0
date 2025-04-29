"use client";

import { useState } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";

export default function SignInPage() {
  const [universityId, setUniversityId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  // Helper function to validate inputs
  const validateInputs = () => {
    if (!universityId || isNaN(Number(universityId))) {
      setError("University ID must be a valid number.");
      return false;
    }
    if (!password || password.trim().length < 6) {
      setError("Password must be at least 6 characters long.");
      return false;
    }
    return true;
  };

  const handleSignIn = async () => {
    if (!validateInputs()) {
      return;
    }

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
          universityId: parseInt(universityId, 10),
          password,
        },
      });

      const result = response.data;

      if (result.data?.login) {
        const { accessToken } = result.data.login;
        sessionStorage.setItem("token", accessToken);
        alert("Sign-in successful!");
        // Redirect or perform further actions here
      } else {
        setError(result.errors?.[0]?.message || "Sign-in failed");
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
    }
  };

  return (
    <div className="container max-w-md py-16">
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Sign In</CardTitle>
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
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          {error && <p className="text-red-500">{error}</p>}
          <Button
            className="w-full bg-emerald-400 hover:bg-emerald-500"
            onClick={handleSignIn}
          >
            Sign In
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}