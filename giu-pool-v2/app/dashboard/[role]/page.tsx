"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useRouter } from "next/navigation";
import { Plus, Edit } from "lucide-react";
import DashboardLoading from "../loading"; // Import the loading component

interface User {
  id: string;
  name: string;
  role: "DRIVER" | "PASSENGER";
}

interface Ride {
  id: string;
  startLocation: string;
  endLocation: string;
  departureTime: string;
  availableSeats: number;
  pricePerSeat: number;
  girlsOnly: boolean;
}

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [rides, setRides] = useState<Ride[]>([]);
  const [currentRide, setCurrentRide] = useState<Ride | null>(null);
  const [scheduledRides, setScheduledRides] = useState<Ride[]>([]);
  const [error, setError] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(true); // Add loading state
  const router = useRouter();

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const token = sessionStorage.getItem("token");
        if (!token) {
          router.push("/sign-in");
          return;
        }

        // Fetch user details
        const userResponse = await axios.post(
          "http://localhost:3000/graphql",
          {
            query: `
              query GetUserByToken {
                getUserByToken {
                  id
                  email
                  universityId
                  role
                }
              }
            `,
          },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const userData: User = userResponse.data.data.getUserByToken;
        console.log("userData", userData);
        setUser(userData);

        // Fetch rides based on role
        if (userData.role === "DRIVER") {
          const [currentRideResponse, scheduledRidesResponse] = await Promise.all([
            axios.post(
              "http://localhost:3002/graphql",
              {
                query: `
                  query {
                    myActiveRides {
                      _id
                      startLocation
                      endLocation
                      departureTime
                      status
                      availableSeats
                    }
                  }
                `,
              },
              { headers: { Authorization: `Bearer ${token}` } }
            ),
            axios.post(
              "http://localhost:3002/graphql",
              {
                query: `
                  query MyScheduledRides {
                    myScheduledRides {
                      _id
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
              { headers: { Authorization: `Bearer ${token}` } }
            ),
          ]);

          const activeRides: Ride[] = currentRideResponse.data.data.myActiveRides;
          const scheduledRides: Ride[] = scheduledRidesResponse.data.data.myScheduledRides;

          setCurrentRide(activeRides.length > 0 ? activeRides[0] : null);
          setScheduledRides(scheduledRides);
        } else if (userData.role === "PASSENGER") {
          // Autodetect location
          navigator.geolocation.getCurrentPosition(async (position) => {
            const { latitude, longitude } = position.coords;

            const ridesResponse = await axios.post(
              "http://localhost:3000/graphql",
              {
                query: `
                  query GetRidesByZone($latitude: Float!, $longitude: Float!) {
                    getRidesByZone(latitude: $latitude, longitude: $longitude) {
                      _id
                      startLocation
                      endLocation
                      departureTime
                      availableSeats
                      pricePerSeat
                      girlsOnly
                    }
                  }
                `,
                variables: { latitude, longitude },
              },
              { headers: { Authorization: `Bearer ${token}` } }
            );

            const availableRides: Ride[] = ridesResponse.data.data.getRidesByZone;
            setRides(availableRides);
          });
        }
      } catch (err) {
        setError("Failed to fetch data. Please try again.");
      } finally {
        setIsLoading(false); // Set loading to false after data is fetched
      }
    };

    fetchUserData();
  }, [router]);

  const handleCreateRide = () => {
    router.push("/offer");
  };

  const handleEditRide = (rideId: string) => {
    // Open modal to edit ride details
    console.log("Edit ride:", rideId);
  };

  if (isLoading) {
    return <DashboardLoading />; // Render the loading skeleton while data is being fetched
  }

  if (!user) {
    return <DashboardLoading />;
  }

  return (
    <div className="container py-8">
      <h1 className="text-2xl font-bold mb-6">Welcome, {user.name}!</h1>

      {user.role === "DRIVER" && (
        <>
          <Button
            className="mb-6 flex items-center gap-2 bg-giu-red hover:bg-giu-red/90 text-white"
            onClick={handleCreateRide}
          >
            <Plus className="h-4 w-4" />
            Create Ride
          </Button>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Current Ride</CardTitle>
            </CardHeader>
            <CardContent>
              {currentRide ? (
                <div>
                  <p>
                    <strong>From:</strong> {currentRide.startLocation}
                  </p>
                  <p>
                    <strong>To:</strong> {currentRide.endLocation}
                  </p>
                  <p>
                    <strong>Departure:</strong> {new Date(currentRide.departureTime).toLocaleString()}
                  </p>
                  <p>
                    <strong>Seats:</strong> {currentRide.availableSeats}
                  </p>
                  <p>
                    <strong>Price:</strong> {currentRide.pricePerSeat} EGP
                  </p>
                  <Button
                    className="mt-4 flex items-center gap-2"
                    onClick={() => handleEditRide(currentRide.id)}
                  >
                    <Edit className="h-4 w-4" />
                    Edit Ride
                  </Button>
                </div>
              ) : (
                <p>No active ride at the moment.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Scheduled Rides</CardTitle>
            </CardHeader>
            <CardContent>
              {scheduledRides.length > 0 ? (
                scheduledRides.map((ride) => (
                  <div key={ride.id} className="mb-4">
                    <p>
                      <strong>From:</strong> {ride.startLocation}
                    </p>
                    <p>
                      <strong>To:</strong> {ride.endLocation}
                    </p>
                    <p>
                      <strong>Departure:</strong> {new Date(ride.departureTime).toLocaleString()}
                    </p>
                    <p>
                      <strong>Seats:</strong> {ride.availableSeats}
                    </p>
                    <p>
                      <strong>Price:</strong> {ride.pricePerSeat} EGP
                    </p>
                    <Button
                      className="mt-2 flex items-center gap-2"
                      onClick={() => handleEditRide(ride.id)}
                    >
                      <Edit className="h-4 w-4" />
                      Edit Ride
                    </Button>
                  </div>
                ))
              ) : (
                <p>No scheduled rides.</p>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {user.role === "PASSENGER" && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {rides.map((ride) => (
            <Card key={ride.id}>
              <CardContent>
                <p>
                  <strong>From:</strong> {ride.startLocation}
                </p>
                <p>
                  <strong>To:</strong> {ride.endLocation}
                </p>
                <p>
                  <strong>Departure:</strong> {new Date(ride.departureTime).toLocaleString()}
                </p>
                <p>
                  <strong>Seats:</strong> {ride.availableSeats}
                </p>
                <p>
                  <strong>Price:</strong> {ride.pricePerSeat} EGP
                </p>
                {ride.girlsOnly && <p className="text-pink-500">Girls Only</p>}
                <Button className="mt-4 bg-giu-red hover:bg-giu-red/90">Book Now</Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}