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
  const [email, setEmail] = useState("");
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
                firstName
                lastName
                email
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
        setFirstName(user.firstName);
        setLastName(user.lastName);
        setEmail(user.email);
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
    if (!token) return;

    try {
      const response = await axios.post(
        "http://localhost:3000/graphql",
        {
          query: `
            mutation UpdateUser($firstName: String!, $lastName: String!, $email: String!) {
              updateUser(firstName: $firstName, lastName: $lastName, email: $email) {
                id
                firstName
                lastName
                email
              }
            }
          `,
          variables: { firstName, lastName, email },
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

          <div className="bg-yellow-100 text-yellow-800 px-4 py-2 rounded text-sm border border-yellow-300">
            ⚠️ Edit profile functionality is <strong>not working yet</strong>. You can view and test the form UI.
          </div>

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
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  disabled
                />
                <p className="text-xs text-muted-foreground mt-1">
                  To change your email, please request support.
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
