"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { Settings, Car } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  universityId: number;
  role: "DRIVER" | "PASSENGER" | "ADMIN";
}

interface Ride {
  _id: string;
  startLocation: string;
  endLocation: string;
  departureTime: string;
  status: string;
}

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [rideHistory, setRideHistory] = useState<Ride[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const router = useRouter();

  useEffect(() => {
    const token = sessionStorage.getItem("token");
    if (!token) return;

    const headers = {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };

    const fetchUserData = async () => {
      try {
        const userRes = await axios.post(
          "http://localhost:3000/graphql",
          {
            query: `
              query {
                getUserByToken {
                  id
                  firstName
                  lastName
                  email
                  universityId
                  role
                }
              }
            `,
          },
          { headers }
        );

        const userData = userRes.data?.data?.getUserByToken;
        setUser(userData);

        if (userData) {
          const ridesRes = await axios.post(
            "http://localhost:3002/graphql",
            {
              query: `
                query {
                  myRideHistory {
                    _id
                    startLocation
                    endLocation
                    departureTime
                    status
                  }
                }
              `,
            },
            { headers }
          );
          setRideHistory(ridesRes.data?.data?.myRideHistory ?? []);
        }
      } catch (err) {
        console.error(err);
        setError("Failed to load profile.");
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  if (loading) return <p>Loading profile...</p>;
  if (error) return <p className="text-red-500">{error}</p>;
  if (!user) return <p>User not found.</p>;

  return (
    <div className="container max-w-4xl py-6">
      <Card className="mb-8">
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-full bg-giu-gold/10 flex items-center justify-center">
                <Car className="h-8 w-8 text-giu-red" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">
                  {user.firstName} {user.lastName}
                </h1>
                <p className="text-muted-foreground">{user.email}</p>
                <p className="text-sm text-muted-foreground">
                  Student ID: {user.universityId}
                </p>
              </div>
            </div>
            <Button variant="outline" size="sm" className="gap-2" onClick={() => router.push("/profile/edit")}>  <Settings className="h-4 w-4" />
              Edit Profile
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-3 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="text-3xl font-bold text-giu-gold">{rideHistory.length}</div>
            <p className="text-sm text-muted-foreground">Total Rides</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-3xl font-bold text-muted-foreground">Coming Soon</div>
            <p className="text-sm text-muted-foreground">Average Rating</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-3xl font-bold text-muted-foreground">Coming Soon</div>
            <p className="text-sm text-muted-foreground">EGP Saved</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="history">
        <TabsList className="w-full justify-start">
          <TabsTrigger value="history">Ride History</TabsTrigger>
          <TabsTrigger value="offered">Offered Rides</TabsTrigger>
        </TabsList>

        <TabsContent value="history" className="space-y-4 mt-4">
          {rideHistory.length === 0 ? (
            <p className="text-muted-foreground">No rides yet.</p>
          ) : (
            rideHistory.map((ride) => (
              <Card key={ride._id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">
                        {ride.startLocation} → {ride.endLocation}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {new Date(ride.departureTime).toLocaleString()}
                      </div>
                    </div>
                    <Badge variant="secondary" className="bg-giu-gold/10 text-giu-gold">
                      {ride.status}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="offered" className="mt-4">
          {user.role === "DRIVER" ? (
            <p className="text-muted-foreground">Coming soon: Offered ride history.</p>
          ) : (
            <p className="text-muted-foreground">Only drivers can offer rides.</p>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
