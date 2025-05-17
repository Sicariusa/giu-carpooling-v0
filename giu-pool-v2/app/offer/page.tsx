"use client"

import { useState, useEffect } from "react"
import { MapPin, Clock, Calendar, DollarSign, Users, Plus, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import type { CreateRideInput, RideStopInput } from "@/types/index"

export default function OfferRidePage() {
  const [stops, setStops] = useState<RideStopInput[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [toGIU, setToGIU] = useState(true);
  const [giuStop, setGiuStop] = useState<any>(null);
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [closestStop, setClosestStop] = useState<any>(null);
  const [originSearchQuery, setOriginSearchQuery] = useState("");
  const [originSearchResults, setOriginSearchResults] = useState<any[]>([]);
  const [originPopoverOpen, setOriginPopoverOpen] = useState(false);
  const [selectedOriginStop, setSelectedOriginStop] = useState<any>(null);

  // Fetch GIU stop on mount
  useEffect(() => {
    const fetchGIUStop = async () => {
      const token = sessionStorage.getItem("token");
      if (!token) return;
      const response = await fetch("http://localhost:3002/graphql", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          query: `
            query SearchStops($query: String!) {
              searchStops(query: $query) {
                _id
                name
                address
                latitude
                longitude
                isActive
                zone {
                  _id
                  name
                  description
                }
              }
            }
          `,
          variables: { query: "GIU Main gate" },
        }),
      });
      const data = await response.json();
      if (data.data && data.data.searchStops && data.data.searchStops.length > 0) {
        setGiuStop(data.data.searchStops[0]);
      }
    };
    fetchGIUStop();
  }, []);

  // Autodetect driver location and fetch closest stop
  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        console.log("latitude", latitude, "longitude", longitude);
        const token = sessionStorage.getItem("token");
        if (!token) return;
        const response = await fetch("http://localhost:3002/graphql", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify({
            query: `
              query ClosestStop($latitude: Float!, $longitude: Float!) {
                closestStop(latitude: $latitude, longitude: $longitude) {
                  _id
                  name
                  address
                  latitude
                  longitude
                  isActive
                  zone {
                    _id
                    name
                    description
                  }
                }
              }
            `,
            variables: { latitude, longitude },
          }),
        });
        const data = await response.json();
        if (data.data && data.data.closestStop) {
          setClosestStop(data.data.closestStop);
          if (toGIU) {
            setOrigin(data.data.closestStop.name);
            setSelectedOriginStop(data.data.closestStop);
          }
        }
      },
      (error) => {
        console.error(error);
      },
      { enableHighAccuracy: true }
    );
  }, [toGIU]);

  // Update origin/destination when toggle, GIU stop, or closest stop changes
  useEffect(() => {
    if (!giuStop) return;
    if (toGIU) {
      setDestination(giuStop.name);
      if (closestStop) {
        setOrigin(closestStop.name);
        setSelectedOriginStop(closestStop);
      }
    } else {
      setOrigin(giuStop.name);
      setSelectedOriginStop(giuStop);
      if (closestStop) setDestination(closestStop.name);
    }
  }, [toGIU, giuStop, closestStop]);

  // Search stops for origin field
  useEffect(() => {
    if (!originPopoverOpen || !originSearchQuery) {
      setOriginSearchResults([]);
      return;
    }
    const fetchStops = async () => {
      const token = sessionStorage.getItem("token");
      if (!token) return;
      const response = await fetch("http://localhost:3002/graphql", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          query: `
            query SearchStops($query: String!) {
              searchStops(query: $query) {
                _id
                name
                address
                latitude
                longitude
                isActive
                zone {
                  _id
                  name
                  description
                }
              }
            }
          `,
          variables: { query: originSearchQuery },
        }),
      });
      const data = await response.json();
      if (data.data && data.data.searchStops) {
        setOriginSearchResults(data.data.searchStops);
      }
    };
    fetchStops();
  }, [originSearchQuery, originPopoverOpen]);

  const handleAddStop = async () => {
    setIsSearching(true);
    try {
      const token = sessionStorage.getItem("token");
      if (!token) {
        console.error("No authentication token found");
        return;
      }

      const response = await fetch("http://localhost:3002/graphql", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          query: `
            query SearchStops ($query: String!) {
              searchStops(query: $query) {
                _id
                name
                address
                latitude
                longitude
                isActive
                zone {
                  _id
                  name
                  description
                }
              }
            }
          `,
          variables: {
            query: searchQuery,
          },
        }),
      });

      const data = await response.json();
      console.log(data.data.searchStops);
      setSearchResults(data.data.searchStops);
      console.log("searchResults", searchResults);
    } catch (error) {
      console.error("Error searching stops:", error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectStop = (stop: any) => {
    if (!stop.name) {
      console.error("Stop name is required");
      return;
    }
    const newStop: RideStopInput = {
      stopId: stop._id,
      location: stop.name,
      latitude: stop.latitude,
      longitude: stop.longitude,
      sequence: stops.length + 1,
    };
    setStops([...stops, newStop]);
    setSearchQuery("");
    setSearchResults([]);

    console.log("stops", stops);
  };

  const handleRemoveStop = (index: number) => {
    const newStops = stops.filter((_, i) => i !== index).map((stop, i) => ({
      ...stop,
      sequence: i + 1,
    }));
    setStops(newStops);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    
    const token = sessionStorage.getItem("token");
    if (!token) {
      console.error("No authentication token found");
      return;
    }

    // Create stops array with origin, intermediate stops, and destination
    const allStops: RideStopInput[] = [];
    
    // Add origin as first stop if we have a selected origin stop
    if (selectedOriginStop) {
      if (!selectedOriginStop.name) {
        console.error("Origin stop name is required");
        return;
      }
      allStops.push({
        stopId: selectedOriginStop._id,
        location: selectedOriginStop.name,
        latitude: selectedOriginStop.latitude,
        longitude: selectedOriginStop.longitude,
        sequence: 1
      });
    }

    // Add intermediate stops with updated sequence numbers
    const intermediateStops = stops.map((stop, index) => ({
      ...stop,
      sequence: index + 2 // Start from 2 since origin is 1
    }));
    allStops.push(...intermediateStops);

    // Add destination as last stop if we have a GIU stop
    if (giuStop) {
      if (!giuStop.name) {
        console.error("Destination stop name is required");
        return;
      }
      allStops.push({
        stopId: giuStop._id,
        location: giuStop.name,
        latitude: giuStop.latitude,
        longitude: giuStop.longitude,
        sequence: allStops.length + 1
      });
    }
    
    const rideData: CreateRideInput = {
      stops: allStops,
      departureTime: new Date(`${formData.get("date")}T${formData.get("time")}`),
      totalSeats: Number(formData.get("totalSeats")),
      availableSeats: Number(formData.get("availableSeats")),
      pricePerSeat: Number(formData.get("pricePerSeat")),
      priceScale: Number(formData.get("priceScale")) || 1,
      girlsOnly: formData.get("girlsOnly") === "on",
      startLocation: selectedOriginStop ? selectedOriginStop.name : origin,
      endLocation: giuStop ? giuStop.name : destination,
    };

    console.log("rideData", rideData);
    try {
      const response = await fetch("http://localhost:3002/graphql", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          query: `
            mutation CreateRide($createRideInput: CreateRideInput!) {
              createRide(createRideInput: $createRideInput) {
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
          variables: {
            createRideInput: rideData,
          },
        }),
      });

      const data = await response.json();
      console.log("data", data);
      if (data.errors) {
        throw new Error(data.errors[0].message);
      }
      // Handle successful creation
      window.location.href = "/dashboard/driver";
    } catch (error) {
      console.error("Error creating ride:", error);
      // Handle error (show error message to user)
    }
  };

  return (
    <div className="container max-w-2xl py-6">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold mb-2">Offer a Ride</h1>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardContent className="p-6 space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="to-giu">To the GIU</Label>
                <Switch id="to-giu" checked={toGIU} onCheckedChange={setToGIU} />
              </div>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                {(!giuStop ? false : !toGIU) ? (
                  <Input
                    name="startLocation"
                    placeholder="From (GIU or destination)"
                    className="pl-10 text-left"
                    required
                    value={origin}
                    readOnly
                  />
                ) : (
                  <Popover open={originPopoverOpen} onOpenChange={setOriginPopoverOpen}>
                    <PopoverTrigger asChild>
                      <Input
                        name="startLocation"
                        placeholder="From (GIU or destination)"
                        className="pl-10 cursor-pointer text-left"
                        required
                        value={origin}
                        onChange={e => {
                          setOrigin(e.target.value);
                          setOriginSearchQuery(e.target.value);
                        }}
                        onFocus={() => setOriginPopoverOpen(true)}
                        readOnly={false}
                        autoComplete="off"
                      />
                    </PopoverTrigger>
                    <PopoverContent key={originSearchResults.map(s => s._id).join(',')} className="w-[300px] p-0">
                      <Command>
                        <CommandInput
                          placeholder="Search stops..."
                          value={originSearchQuery}
                          onValueChange={setOriginSearchQuery}
                        />
                        <CommandEmpty>No stops found.</CommandEmpty>
                        <CommandGroup>
                          {originSearchResults.map((stop) => (
                            <CommandItem
                              key={stop._id}
                              onSelect={() => {
                                setOrigin(stop.name);
                                setSelectedOriginStop(stop);
                                setOriginPopoverOpen(false);
                              }}
                              className="flex flex-col items-start py-2"
                            >
                              <div className="font-medium">{stop.name}</div>
                              <div className="text-sm text-muted-foreground">{stop.address}</div>
                              {stop.zone && (
                                <div className="text-xs text-muted-foreground">
                                  Zone: {stop.zone.name}
                                </div>
                              )}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </Command>
                    </PopoverContent>
                  </Popover>
                )}
              </div>

              {stops.map((stop, index) => (
                <div key={index} className="relative flex items-center gap-2">
                  <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input 
                    value={stop.location}
                    readOnly
                    className="pl-10 flex-1"
                  />
                  <Badge variant="secondary" className="bg-giu-gold/10 text-giu-gold">
                    Stop {stop.sequence}
                  </Badge>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveStop(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}

              <div className="flex items-center gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button type="button" variant="outline" className="w-full">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Stop
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent key={searchResults.map(s => s._id).join(',')} className="w-[300px] p-0">
                    <Command>
                      <CommandInput 
                        placeholder="Search stops..." 
                        value={searchQuery}
                        onValueChange={setSearchQuery}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            handleAddStop();
                          }
                        }}
                      />
                      <CommandEmpty>No stops found.</CommandEmpty>
                      <CommandGroup>
                        {searchResults.map((stop) => (
                          <CommandItem
                            key={stop._id}
                            onSelect={() => handleSelectStop(stop)}
                            className="flex flex-col items-start py-2"
                          >
                            <div className="font-medium">{stop.name}</div>
                            <div className="text-sm text-muted-foreground">{stop.address}</div>
                            {stop.zone && (
                              <div className="text-xs text-muted-foreground">
                                Zone: {stop.zone.name}
                              </div>
                            )}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

              <div className="relative">
                <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  name="endLocation"
                  placeholder="To (GIU or destination)"
                  className="pl-10"
                  required
                  value={destination}
                  onChange={e => setDestination(e.target.value)}
                  readOnly={!giuStop ? false : toGIU}
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
                  required
                />
              </div>

              <div className="relative">
                <Clock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input 
                  name="time"
                  type="time" 
                  className="pl-10" 
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="relative">
                <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input 
                  name="pricePerSeat"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="Price per seat (EGP)" 
                  className="pl-10" 
                  required
                />
              </div>

              <div className="relative">
                <Users className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input 
                  name="totalSeats"
                  type="number"
                  min="1"
                  placeholder="Total seats" 
                  className="pl-10" 
                  required
                />
              </div>
            </div>

            <div className="relative">
              <Users className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input 
                name="availableSeats"
                type="number"
                min="1"
                placeholder="Available seats" 
                className="pl-10" 
                required
              />
            </div>

            <div className="relative">
              <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input 
                name="priceScale"
                type="number"
                min="1"
                step="0.1"
                placeholder="Price scale (default: 1)" 
                className="pl-10" 
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="girls-only">Girls Only Ride</Label>
              <Switch id="girls-only" name="girlsOnly" />
            </div>

            <Button type="submit" className="w-full bg-giu-red hover:bg-giu-red/90">
              Create Ride
            </Button>
          </CardContent>
        </Card>
      </form>
    </div>
  )
}