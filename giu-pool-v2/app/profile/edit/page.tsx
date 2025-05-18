"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";

export default function EditProfilePage() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState<string>("");
  const [email, setEmail] = useState("");
  const [universityId, setUniversityId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState("");
  const router = useRouter();

  useEffect(() => {
    const token = sessionStorage.getItem("token");
    if (!token) return;

    axios
      .post(
        "http://localhost:3000/graphql",
        {
          query: `
            query {
              getUserByToken {
                email
                universityId
                firstName
                lastName
              }
            }
          `,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      )
      .then((res) => {
        const user = res.data?.data?.getUserByToken;
        setEmail(user.email);
        setUniversityId(user.universityId);
        setFirstName(user.firstName);
        setLastName(user.lastName);
      })
      .catch((err) => {
        console.error(err);
        setFeedback("Failed to load user data.");
      })
      .finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = sessionStorage.getItem("token");
    if (!token || !universityId) return;

    const phoneRegex = /^\d{11}$/;
    if (phoneNumber && !phoneRegex.test(phoneNumber)) {
      setFeedback("Phone number must be exactly 11 digits.");
      return;
    }

    try {
      const response = await axios.post(
        "http://localhost:3000/graphql",
        {
          query: `
            mutation($universityId: Int!, $input: UpdateUserInput!) {
              updateUser(universityId: $universityId, input: $input) {
                id
                email
              }
            }
          `,
          variables: {
            universityId,
            input: {
              firstName,
              lastName,
              phoneNumber: phoneNumber ? parseInt(phoneNumber) : undefined,
            },
          },
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const updated = response.data?.data?.updateUser;
      if (updated) {
        setFeedback("Profile updated successfully!");
        setTimeout(() => router.push("/profile"), 1500);
      } else {
        setFeedback("Update failed.");
      }
    } catch (err) {
      console.error(err);
      setFeedback("Error updating profile.");
    }
  };

  return (
    <div className="container max-w-xl py-10">
      <Card>
        <CardContent className="p-6 space-y-6">
          <h2 className="text-xl font-bold">Edit Profile</h2>

          {loading ? (
            <p>Loading...</p>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                />
              </div>

              <div>
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                />
              </div>

              <div>
                <Label htmlFor="phoneNumber">Phone Number</Label>
                <Input
                  id="phoneNumber"
                  type="text"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                />
              </div>

              <div>
                <Label>Email</Label>
                <Input id="email" value={email} disabled />
                <p className="text-xs text-muted-foreground mt-1 italic">
                  Email is locked. Please contact support to change it.
                </p>
              </div>

              <Button type="submit">Save Changes</Button>
              {feedback && <p className="text-sm text-muted-foreground mt-2">{feedback}</p>}
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
