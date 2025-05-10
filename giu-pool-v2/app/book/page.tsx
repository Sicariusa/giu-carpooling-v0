"use client";
import { useState, ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { MapPin, Clock, Calendar, DollarSign, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import axios from "axios";

// Define types for ride data
interface Ride {
  id: string;
  startLocation: string;
  endLocation: string;
  availableSeats: number;
  pricePerSeat: number;
  departureTime: string;
  driverName: string;
  status: string;
  totalSeats: number;
  stops: { stopId: string; sequence: number }[];
}

// Define types for form data
interface FormData {
  fromZoneId: string;
  toZoneId: string;
  date: string;
  time: string;
  girlsOnly: boolean;
  minAvailableSeats: number;
  maxPrice: string;
}

const zones = [
  { id: "67f679d3329a90cf753b5248", name: "GIU Campus" },
  { id: "67f679d3329a90cf753b524c", name: "Heliopolis" },
  { id: "67f679d3329a90cf753b5249", name: "New Cairo - 1st Settlement" },
  { id: "67f679d3329a90cf753b524a", name: "New Cairo - 5th Settlement" },
  { id: "67f679d3329a90cf753b524b", name: "Maadi" },
  { id: "67f679d3329a90cf753b524d", name: "Nasr City" },
];

export default function BookRidePage() {
  const [rides, setRides] = useState<Ride[]>([]); // Array of rides
  const [loading, setLoading] = useState<boolean>(false); // Loading state
  const [formData, setFormData] = useState<FormData>({
    fromZoneId: "",
    toZoneId: "",
    date: "",
    time: "",
    girlsOnly: false,
    minAvailableSeats: 1,
    maxPrice: "",
  });
  const router = useRouter();

  // Handle input changes
  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
    console.log("Updated formData:", { ...formData, [name]: value });
  };

  const handleSwitchChange = (checked: boolean) => {
    setFormData({
      ...formData,
      girlsOnly: checked,
    });
    console.log("Updated girlsOnly:", checked);
  };

  // Search rides
  const searchRides = async () => {
    setLoading(true);

    const searchInput: Record<string, any> = {};
    if (formData.fromZoneId) searchInput.fromZoneId = formData.fromZoneId;
    if (formData.toZoneId) searchInput.toZoneId = formData.toZoneId;
    if (formData.date) searchInput.departureDate = formData.date;
    if (formData.girlsOnly !== undefined) searchInput.girlsOnly = formData.girlsOnly;
    if (formData.minAvailableSeats) searchInput.minAvailableSeats = formData.minAvailableSeats;
    if (formData.maxPrice) searchInput.maxPrice = parseFloat(formData.maxPrice);

    console.log("Filtered searchInput:", searchInput);

    const token = sessionStorage.getItem("token");

    if (!token) {
      console.error("No authentication token found. Please sign in.");
      setLoading(false);
      return;
    }

    try {
      const response = await axios.post(
        "http://localhost:3002/graphql",
        {
          query: `
            query SearchRides($searchInput: SearchRideInput!) {
              searchRides(searchInput: $searchInput) {
                _id
                startLocation
                endLocation
                availableSeats
                pricePerSeat
                totalSeats
                status
                departureTime
                stops {
                  stopId
                  sequence
                }
              }
            }
          `,
          variables: {
            searchInput,
          },
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log("Response from backend:", response.data);

      if (response.data?.data?.searchRides) {
        const mappedRides = await Promise.all(
          response.data.data.searchRides.map(async (ride: any) => {
            const enhancedStops = await enhanceStopsWithNames(ride.stops);
            return {
              id: ride._id,
              ...ride,
              stops: enhancedStops, // Replace stops with enhanced stops
            };
          })
        );
        console.log("Mapped rides with enhanced stops:", mappedRides);
        setRides(mappedRides);
      } else {
        console.error("No rides found or error in response:", response.data);
      }
    } catch (error) {
      console.error("Error fetching rides:", error);
      if (axios.isAxiosError(error)) {
        console.log("Error response from backend:", error.response?.data);
      } else {
        console.error("Unexpected error:", error);
      }
    } finally {
      setLoading(false);
    }
  };

  // Book a ride
  const bookRide = (rideId: string) => {
    console.log("Booking ride with ID:", rideId);
  };

  const fetchStopName = async (stopId: string) => {
    try {
      const token = sessionStorage.getItem("token");
      const response = await axios.post(
        "http://localhost:3002/graphql",
        {
          query: `
            query GetStop($id: ID!) {
              stop(id: $id) {
                name
              }
            }
          `,
          variables: {
            id: stopId,
          },
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      return response.data.data.stop.name; // Return the stop name
    } catch (error) {
      console.error(`Error fetching stop name for stopId ${stopId}:`, error);
      return "Unknown Stop"; // Fallback name in case of an error
    }
  };

  const enhanceStopsWithNames = async (stops: any[]) => {
    const enhancedStops = await Promise.all(
      stops.map(async (stop) => {
        const stopName = await fetchStopName(stop.stopId);
        return {
          ...stop,
          stopName, // Add the stop name to the stop object
        };
      })
    );
    return enhancedStops;
  };

  return (
    <div className="container max-w-2xl py-6">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold mb-2">Book a Ride</h1>
        <p className="text-muted-foreground">Find the perfect ride for your journey</p>
      </div>

      <Card>
        <CardContent className="p-6 space-y-6">
          <div className="space-y-4">
            <div className="relative">
              <Label htmlFor="fromZoneId">From</Label>
              <select
                id="fromZoneId"
                name="fromZoneId"
                className="w-full border rounded px-3 py-2"
                value={formData.fromZoneId}
                onChange={handleInputChange}
              >
                <option value="">Select a starting zone</option>
                {zones.map((zone) => (
                  <option key={zone.id} value={zone.id}>
                    {zone.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="relative">
              <Label htmlFor="toZoneId">To</Label>
              <select
                id="toZoneId"
                name="toZoneId"
                className="w-full border rounded px-3 py-2"
                value={formData.toZoneId}
                onChange={handleInputChange}
              >
                <option value="">Select a destination zone</option>
                {zones.map((zone) => (
                  <option key={zone.id} value={zone.id}>
                    {zone.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="relative">
              <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                name="date"
                type="date"
                className="pl-10"
                value={formData.date}
                onChange={handleInputChange}
              />
            </div>

            <div className="relative">
              <Clock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                name="time"
                type="time"
                className="pl-10"
                value={formData.time}
                onChange={handleInputChange}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="relative">
              <Users className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                name="minAvailableSeats"
                type="number"
                placeholder="Min Seats"
                className="pl-10"
                value={formData.minAvailableSeats}
                onChange={handleInputChange}
              />
            </div>

            <div className="relative">
              <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                name="maxPrice"
                type="number"
                placeholder="Max Price"
                className="pl-10"
                value={formData.maxPrice}
                onChange={handleInputChange}
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="girls-only">Girls Only Ride</Label>
            <Switch
              id="girls-only"
              name="girlsOnly"
              checked={formData.girlsOnly}
              onCheckedChange={handleSwitchChange}
            />
          </div>

          <Button
            className="w-full bg-giu-red hover:bg-giu-red/90"
            onClick={() => {
              console.log("Button clicked");
              searchRides();
            }}
            disabled={loading}
          >
            {loading ? "Searching..." : "Search Available Rides"}
          </Button>
        </CardContent>
      </Card>

      <div className="mt-8 space-y-4">
        {rides.map((ride) => (
          <Card key={ride.id}>
            <CardHeader>
              <CardTitle>
                {ride.startLocation} → {ride.endLocation}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p><strong>Status:</strong> {ride.status}</p>
              <p><strong>Departure:</strong> {new Date(ride.departureTime).toLocaleString()}</p>
              <p><strong>Seats Available:</strong> {ride.availableSeats}</p>
              <p><strong>Price Per Seat:</strong> ${ride.pricePerSeat}</p>
              <p><strong>Stops:</strong></p>
              <ul className="list-disc pl-5">
                {ride.stops.map((stop: any) => (
                  <li key={stop.stopId}>
                    Stop Name: {stop.stopName}, Sequence: {stop.sequence}
                  </li>
                ))}
              </ul>
              <Button
                className="mt-4 bg-green-500 hover:bg-green-600"
                onClick={() => bookRide(ride.id)}
              >
                Book Ride
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

