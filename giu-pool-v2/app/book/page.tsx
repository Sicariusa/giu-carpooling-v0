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
}

// Define types for form data
interface FormData {
  from: string;
  to: string;
  date: string;
  time: string;
  girlsOnly: boolean;
  minAvailableSeats: number;
  maxPrice: string;
}

export default function BookRidePage() {
  const [rides, setRides] = useState<Ride[]>([]); // Array of rides
  const [loading, setLoading] = useState<boolean>(false); // Loading state
  const [formData, setFormData] = useState<FormData>({
    from: "",
    to: "",
    date: "",
    time: "",
    girlsOnly: false,
    minAvailableSeats: 1,
    maxPrice: "",
  });
  const router = useRouter();

  // Handle input changes
  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type, checked } = e.target as HTMLInputElement; 
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
    console.log("Updated formData:", { ...formData, [name]: type === "checkbox" ? checked : value });
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
    if (formData.from) searchInput.fromZoneId = formData.from;
    if (formData.to) searchInput.toZoneId = formData.to;
    if (formData.date) searchInput.departureDate = formData.date;
    if (formData.girlsOnly !== undefined) searchInput.girlsOnly = formData.girlsOnly;
    if (formData.minAvailableSeats) searchInput.minAvailableSeats = formData.minAvailableSeats;
    if (formData.maxPrice) searchInput.maxPrice = parseFloat(formData.maxPrice);

    console.log("Filtered searchInput:", searchInput);

    try {
      const response = await axios.post("http://localhost:3002/graphql", {
        query: `
          query SearchRides($searchInput: SearchRideInput!) {
            searchRides(searchInput: $searchInput) {
              _id
              startLocation
              endLocation
              availableSeats
            }
          }
        `,
        variables: {
          searchInput,
        },
      });

      console.log("Response from backend:", response.data);
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
    router.push(`/booking-confirmation?rideId=${rideId}`);
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
              <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                name="from"
                placeholder="From (GIU or destination)"
                className="pl-10"
                value={formData.from}
                onChange={handleInputChange}
              />
            </div>

            <div className="relative">
              <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                name="to"
                placeholder="To (GIU or destination)"
                className="pl-10"
                value={formData.to}
                onChange={handleInputChange}
              />
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
              <CardTitle>{ride.startLocation} → {ride.endLocation}</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Driver: {ride.driverName}</p>
              <p>Departure: {new Date(ride.departureTime).toLocaleString()}</p>
              <p>Seats Available: {ride.availableSeats}</p>
              <p>Price: ${ride.pricePerSeat}</p>
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

