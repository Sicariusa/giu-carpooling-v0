'use client';
import { Settings, Car } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import axios from "axios";
import { useState, useEffect } from "react";

interface Ride {
  id: string;
  startLocation: string;
  endLocation: string;
  departureTime: string;
  pricePerSeat: number;
  girlsOnly: boolean;
  availableSeats?: number;
  status?: string;
}

export default function ProfilePage() {
  const [user, setUser] = useState<{
    firstName: string;
    lastName: string;
    email: string;
    universityId: string;
  } | null>(null);

  const [offeredRides, setOfferedRides] = useState<Ride[]>([]);
  const [rideHistory, setRideHistory] = useState<Ride[]>([]);

  // Fetch user data
  const fetchUserData = async () => {
    try {
      const token = sessionStorage.getItem("token");
      if (!token) {
        console.error("No token found in sessionStorage.");
        return null;
      }

      const response = await axios.post(
        "http://localhost:3000/graphql",
        {
          query: `
            query GetUserByToken {
              getUserByToken {
                id
                firstName
                lastName
                email
                universityId
              }
            }
          `,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      return response.data.data.getUserByToken; // Return the user data
    } catch (error) {
      console.error("Error fetching user data:", error);
      return null; // Fallback in case of an error
    }
  };

  // Fetch offered rides
  const fetchOfferedRides = async () => {
    try {
      const token = sessionStorage.getItem("token");
      if (!token) {
        console.error("No token found in sessionStorage.");
        return [];
      }

      const response = await axios.post(
        "http://localhost:3002/graphql",
        {
          query: `
            query MyRides {
              myRides {
                id
                startLocation
                endLocation
                departureTime
                availableSeats
                pricePerSeat
                girlsOnly
              }
            }
          `,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      return response.data.data.myRides || [];
    } catch (error) {
      console.error("Error fetching offered rides:", error);
      return [];
    }
  };

  // Fetch ride history
  const fetchRideHistory = async () => {
    try {
      const token = sessionStorage.getItem("token");
      if (!token) {
        console.error("No token found in sessionStorage.");
        return [];
      }

      const response = await axios.post(
        "http://localhost:3002/graphql",
        {
          query: `
            query MyRideHistory {
              myRideHistory {
                id
                startLocation
                endLocation
                departureTime
                pricePerSeat
                girlsOnly
                status
              }
            }
          `,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      return response.data.data.myRideHistory || [];
    } catch (error) {
      console.error("Error fetching ride history:", error);
      return [];
    }
  };

  // Fetch all data on page load
  useEffect(() => {
    const fetchData = async () => {
      const userData = await fetchUserData();
      setUser(userData);

      const offered = await fetchOfferedRides();
      const history = await fetchRideHistory();
      setOfferedRides(offered);
      setRideHistory(history);
    };
    fetchData();
  }, []);

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
                  {user ? `${user.firstName} ${user.lastName}` : "Loading..."}
                </h1>
                <p className="text-muted-foreground">
                  {user ? user.email : "Loading..."}
                </p>
                <p className="text-sm text-muted-foreground">
                  {user ? `Student ID: ${user.universityId}` : "Loading..."}
                </p>
              </div>
            </div>
            <Button variant="outline" size="sm" className="gap-2">
              <Settings className="h-4 w-4" />
              Edit Profile
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-3 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="text-3xl font-bold text-giu-gold">{offeredRides.length}</div>
            <p className="text-sm text-muted-foreground">Total Offered Rides</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-3xl font-bold text-giu-gold">{rideHistory.length}</div>
            <p className="text-sm text-muted-foreground">Total Ride History</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="history">
        <TabsList className="w-full justify-start">
          <TabsTrigger value="history">Ride History</TabsTrigger>
          <TabsTrigger value="offered">Offered Rides</TabsTrigger>
        </TabsList>

        {/* Ride History Tab */}
        <TabsContent value="history" className="space-y-4 mt-4">
          {rideHistory.length > 0 ? (
            rideHistory.map((ride) => (
              <Card key={ride.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">
                        {ride.startLocation} → {ride.endLocation}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {new Date(ride.departureTime).toLocaleString()} • {ride.pricePerSeat} EGP
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {ride.girlsOnly ? "Girls Only" : "Open to All"}
                      </div>
                    </div>
                    <Badge variant="secondary" className="bg-giu-gold/10 text-giu-gold">
                      {ride.status}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <p className="text-muted-foreground">No ride history available.</p>
          )}
        </TabsContent>

        {/* Offered Rides Tab */}
        <TabsContent value="offered" className="space-y-4 mt-4">
          {offeredRides.length > 0 ? (
            offeredRides.map((ride) => (
              <Card key={ride.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">
                        {ride.startLocation} → {ride.endLocation}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {new Date(ride.departureTime).toLocaleString()} • {ride.pricePerSeat} EGP
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {ride.girlsOnly ? "Girls Only" : "Open to All"}
                      </div>
                    </div>
                    <Badge variant="secondary" className="bg-giu-gold/10 text-giu-gold">
                      {ride.availableSeats} Seats Available
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <p className="text-muted-foreground">No offered rides available.</p>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

