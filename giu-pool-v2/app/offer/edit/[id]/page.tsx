"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { MapPin, Clock, Calendar, DollarSign, Users, Plus, X, Navigation, GripVertical } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { toast } from "sonner"
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core'
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { CreateRideInput, RideStopInput, Ride } from "@/types/index"

// Sortable stop item component
function SortableStopItem({ stop, index, totalStops, onRemove, onNavigate }: { 
  stop: RideStopInput, 
  index: number,
  totalStops: number,
  onRemove: () => void,
  onNavigate: () => void 
}) {
  const isOrigin = index === 0;
  const isDestination = index === totalStops - 1;
  const isDraggable = !isOrigin && !isDestination;

  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ 
    id: stop.stopId,
    disabled: !isDraggable
  });
  const style = { transform: CSS.Transform.toString(transform), transition }

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      className={`relative flex items-center gap-2 ${isOrigin || isDestination ? 'bg-muted/50 rounded-lg p-2' : ''}`}
    >
      {isDraggable && (
        <button {...attributes} {...listeners} className="cursor-grab p-2">
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </button>
      )}
      {!isDraggable && <div className="w-10" />}
      <MapPin className="absolute left-10 top-3 h-4 w-4 text-muted-foreground" />
      <Input 
        value={stop.location}
        readOnly
        className="pl-10 flex-1"
      />
      <Badge variant="secondary" className={`
        ${isOrigin ? 'bg-green-500/10 text-green-500' : 
          isDestination ? 'bg-red-500/10 text-red-500' : 
          'bg-giu-gold/10 text-giu-gold'}
      `}>
        {isOrigin ? 'Origin' : isDestination ? 'Destination' : `Stop ${index + 1}`}
      </Badge>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={onNavigate}
      >
        <Navigation className="h-4 w-4 mr-2" />
        Navigate
      </Button>
      {isDraggable && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onRemove}
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  )
}

export default function EditRidePage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [stops, setStops] = useState<RideStopInput[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [loading, setLoading] = useState(true)
  const [ride, setRide] = useState<Ride | null>(null)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // Fetch ride data on mount
  useEffect(() => {
    const fetchRide = async () => {
      const token = sessionStorage.getItem("token")
      if (!token) {
        router.push("/login")
        return
      }

      try {
        const response = await fetch("http://localhost:3002/graphql", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify({
            query: `
              query GetRide($id: ID!) {
                ride(id: $id) {
                  _id
                  departureTime
                  status
                  totalSeats
                  availableSeats
                  pricePerSeat
                  priceScale
                  girlsOnly
                  stops {
                    stopId
                    location
                    sequence
                    latitude
                    longitude
                  }
                }
              }
            `,
            variables: { id: params.id },
          }),
        })

        const data = await response.json()
        if (data.errors) {
          throw new Error(data.errors[0].message)
        }

        const rideData = data.data.ride
        if (!rideData) {
          throw new Error("Ride not found")
        }

        if (rideData.status !== "SCHEDULED") {
          toast.error("Only scheduled rides can be edited")
          router.push("/dashboard/driver")
          return
        }

        setRide(rideData)
        setStops(rideData.stops.map((stop: any) => ({
          stopId: stop.stopId,
          location: stop.location,
          sequence: stop.sequence,
          latitude: stop.latitude,
          longitude: stop.longitude,
        })))

      } catch (error) {
        console.error("Error fetching ride:", error)
        toast.error("Failed to load ride data")
        router.push("/dashboard/driver")
      } finally {
        setLoading(false)
      }
    }

    fetchRide()
  }, [params.id, router])

  // Prevent accidental navigation when there are unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  // Prevent any form submission during drag
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    handleSubmit(e);
  };

  // Prevent any default drag behavior
  const handleDragStart = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setStops((items) => {
        const oldIndex = items.findIndex((item) => item.stopId === active.id);
        const newIndex = items.findIndex((item) => item.stopId === over.id);
        
        // Prevent moving to first or last position
        if (newIndex === 0 || newIndex === items.length - 1) {
          return items;
        }
        
        const newStops = arrayMove(items, oldIndex, newIndex).map((stop, index) => ({
          ...stop,
          sequence: index + 1
        }));
        setHasUnsavedChanges(true);
        return newStops;
      });
    }
  }, []);

  // Update search results when query changes
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    
    if (searchQuery) {
      timeoutId = setTimeout(() => {
        handleAddStop();
      }, 300); // Add debounce to prevent too many requests
    } else {
      setSearchResults([]);
    }

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  // Debug search results changes
  useEffect(() => {
    console.log("searchResults updated:", searchResults);
  }, [searchResults]);

  const handleAddStop = async () => {
    if (!searchQuery) return;
    
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
      if (data.errors) {
        throw new Error(data.errors[0].message);
      }
      
      const results = data.data.searchStops;
      setSearchResults(results);
    } catch (error) {
      console.error("Error searching stops:", error);
      toast.error("Failed to search stops");
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectStop = (stop: any) => {
    if (!stop.name) {
      console.error("Stop name is required");
      return;
    }

    // If this is the first stop being added, make it the origin
    if (stops.length === 0) {
      const newStop: RideStopInput = {
        stopId: stop._id,
        location: stop.name,
        latitude: stop.latitude,
        longitude: stop.longitude,
        sequence: 1,
      };
      setStops([newStop]);
      setSearchQuery("");
      setSearchResults([]);
      setHasUnsavedChanges(true);
      return;
    }

    // If this is the second stop being added, make it the destination
    if (stops.length === 1) {
      const newStop: RideStopInput = {
        stopId: stop._id,
        location: stop.name,
        latitude: stop.latitude,
        longitude: stop.longitude,
        sequence: 2,
      };
      setStops([...stops, newStop]);
      setSearchQuery("");
      setSearchResults([]);
      setHasUnsavedChanges(true);
      return;
    }

    // For all other stops, insert before the destination
    const destination = stops[stops.length - 1];
    const intermediateStops = stops.slice(0, -1);
    
    const newStop: RideStopInput = {
      stopId: stop._id,
      location: stop.name,
      latitude: stop.latitude,
      longitude: stop.longitude,
      sequence: intermediateStops.length + 1,
    };

    // Insert the new stop before the destination
    const updatedStops = [...intermediateStops, newStop, destination].map((stop, index) => ({
      ...stop,
      sequence: index + 1,
    }));

    setStops(updatedStops);
    setSearchQuery("");
    setSearchResults([]);
    setHasUnsavedChanges(true);
  };

  const handleRemoveStop = (index: number) => {
    // Prevent removing first or last stop
    if (index === 0 || index === stops.length - 1) {
      toast.error("Cannot remove origin or destination stop");
      return;
    }
    
    const newStops = stops.filter((_, i) => i !== index).map((stop, i) => ({
      ...stop,
      sequence: i + 1,
    }));
    setStops(newStops);
    setHasUnsavedChanges(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!hasUnsavedChanges) {
      toast.info("No changes to save");
      return;
    }

    const formData = new FormData(e.target as HTMLFormElement);
    
    const token = sessionStorage.getItem("token");
    if (!token) {
      toast.error("No authentication token found");
      return;
    }

    if (stops.length < 2) {
      toast.error("Ride must have at least 2 stops");
      return;
    }

    const updateRideInput = {
      stops: stops,
      departureTime: new Date(`${formData.get("date")}T${formData.get("time")}`),
      totalSeats: Number(formData.get("totalSeats")),
      availableSeats: Number(formData.get("availableSeats")),
      pricePerSeat: Number(formData.get("pricePerSeat")),
      priceScale: Number(formData.get("priceScale")) || 1,
      girlsOnly: formData.get("girlsOnly") === "on",
    };

    try {
      const response = await fetch("http://localhost:3002/graphql", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          query: `
            mutation UpdateRide($id: ID!, $updateRideInput: UpdateRideInput!) {
              updateRide(id: $id, updateRideInput: $updateRideInput) {
                _id
                departureTime
                availableSeats
                pricePerSeat
                girlsOnly
                status
              }
            }
          `,
          variables: {
            id: params.id,
            updateRideInput,
          },
        }),
      });

      const data = await response.json();
      if (data.errors) {
        throw new Error(data.errors[0].message);
      }

      setHasUnsavedChanges(false);
      toast.success("Ride updated successfully");
      router.push("/dashboard/driver");
    } catch (error) {
      console.error("Error updating ride:", error);
      toast.error("Failed to update ride");
    }
  };

  if (loading) {
    return (
      <div className="container max-w-2xl py-6">
        <div className="text-center">
          <p>Loading ride data...</p>
        </div>
      </div>
    )
  }

  if (!ride) {
    return (
      <div className="container max-w-2xl py-6">
        <div className="text-center">
          <p>Ride not found</p>
          <Button onClick={() => router.push("/dashboard/driver")}>
            Return to Dashboard
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div 
      className="container max-w-2xl py-6"
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
    >
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold mb-2">Edit Ride</h1>
        {hasUnsavedChanges && (
          <p className="text-sm text-amber-600">You have unsaved changes</p>
        )}
      </div>

      <form 
        onSubmit={handleFormSubmit}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDrop={(e) => e.preventDefault()}
      >
        <Card>
          <CardContent 
            className="p-6 space-y-6"
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDrop={(e) => e.preventDefault()}
          >
            <div 
              className="space-y-4"
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDrop={(e) => e.preventDefault()}
            >
              <DndContext 
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
                modifiers={[]}
              >
                <SortableContext 
                  items={stops.map(stop => stop.stopId)}
                  strategy={verticalListSortingStrategy}
                >
                  {stops.map((stop, index) => (
                    <SortableStopItem
                      key={stop.stopId}
                      stop={stop}
                      index={index}
                      totalStops={stops.length}
                      onRemove={() => handleRemoveStop(index)}
                      onNavigate={() => {
                        if (navigator.geolocation) {
                          navigator.geolocation.getCurrentPosition(
                            (position) => {
                              const { latitude: startLat, longitude: startLng } = position.coords;
                              const url = `https://www.google.com/maps/dir/?api=1&origin=${startLat},${startLng}&destination=${stop.latitude},${stop.longitude}&travelmode=driving`;
                              window.open(url, '_blank');
                            },
                            (error) => {
                              console.error("Error getting location:", error);
                              toast.error("Could not get your location. Please enable location services.");
                            }
                          );
                        } else {
                          toast.error("Geolocation is not supported by your browser");
                        }
                      }}
                    />
                  ))}
                </SortableContext>
              </DndContext>

              <div className="flex items-center gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button type="button" variant="outline" className="w-full">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Stop
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[300px] p-0">
                    <Command>
                      <CommandInput 
                        placeholder="Search stops..." 
                        value={searchQuery}
                        onValueChange={setSearchQuery}
                      />
                      {isSearching ? (
                        <div className="py-6 text-center text-sm">Searching...</div>
                      ) : searchResults.length > 0 ? (
                        <CommandGroup heading="Search Results">
                          {searchResults.map((stop) => (
                            <CommandItem
                              key={stop._id}
                              onSelect={() => {
                                handleSelectStop(stop);
                                setSearchQuery("");
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
                      ) : searchQuery ? (
                        <div className="py-6 text-center text-sm">No stops found.</div>
                      ) : (
                        <div className="py-6 text-center text-sm">Type to search stops...</div>
                      )}
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {/* Date and Time */}
            <div className="grid grid-cols-2 gap-4">
              <div className="relative">
                <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input 
                  name="date"
                  type="date" 
                  className="pl-10" 
                  required
                  defaultValue={new Date(ride.departureTime).toISOString().split('T')[0]}
                />
              </div>

              <div className="relative">
                <Clock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input 
                  name="time"
                  type="time" 
                  className="pl-10" 
                  required
                  defaultValue={new Date(ride.departureTime).toISOString().split('T')[1].substring(0, 5)}
                />
              </div>
            </div>

            {/* Price and Seats */}
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
                  defaultValue={ride.pricePerSeat}
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
                  defaultValue={ride.totalSeats}
                />
              </div>
            </div>

            {/* Available seats */}
            <div className="relative">
              <Users className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input 
                name="availableSeats"
                type="number"
                min="1"
                placeholder="Available seats" 
                className="pl-10" 
                required
                defaultValue={ride.availableSeats}
              />
            </div>

            {/* Price scale */}
            <div className="relative">
              <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input 
                name="priceScale"
                type="number"
                min="1"
                step="0.1"
                placeholder="Price scale (default: 1)" 
                className="pl-10" 
                defaultValue={ride.priceScale || 1}
              />
            </div>

            {/* Girls only switch */}
            <div className="flex items-center justify-between">
              <Label htmlFor="girls-only">Girls Only Ride</Label>
              <Switch 
                id="girls-only" 
                name="girlsOnly" 
                defaultChecked={ride.girlsOnly}
              />
            </div>

            {/* Submit button */}
            <Button 
              type="submit" 
              className="w-full bg-giu-red hover:bg-giu-red/90"
              disabled={!hasUnsavedChanges}
            >
              {hasUnsavedChanges ? "Save Changes" : "No Changes to Save"}
            </Button>
          </CardContent>
        </Card>
      </form>
    </div>
  )
} 