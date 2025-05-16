"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2, Users, ChevronDown, ChevronUp, Check, X, Navigation } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Ride, Booking, BookingStatus, UserInfo, RideStop } from "@/types";
import styles from './DriverDashboard.module.css';
import { Button } from "@/components/ui/button";

// Remove the RideWithStops interface since we updated the base Ride type
type DashboardRide = Ride;

enum BookingsState {
  LOADING = 'LOADING',
  LOADED = 'LOADED',
  EMPTY = 'EMPTY'
}

// Move fetchUserDetails outside the hook
const fetchUserDetails = async (userId: string): Promise<UserInfo | null> => {
  try {
    const response = await fetch("http://localhost:3002/graphql", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query: `
          query GetUserByUuid($id: String!) {
            getUserByUuid(id: $id) {
              id
              email
              firstName
              lastName
              gender
              phoneNumber
              role
              universityId
            }
          }
        `,
        variables: { id: userId },
      }),
    });

    const data = await response.json();
    if (data.errors) {
      console.error("Error fetching user:", data.errors);
      return null;
    }
    return data.data.getUserByUuid;
  } catch (err) {
    console.error("Error fetching user:", err);
    return null;
  }
};

// Create a more robust cache manager
const cacheManager = {
  data: null as {
    activeRides: DashboardRide[];
    scheduledRides: DashboardRide[];
    pastRides: DashboardRide[];
    bookings: Record<string, Booking[]>;
    timestamp: number;
  } | null,
  subscribers: new Set<() => void>(),
  isFetching: false,
  fetchPromise: null as Promise<{
    activeRides: DashboardRide[];
    scheduledRides: DashboardRide[];
    pastRides: DashboardRide[];
    bookings: Record<string, Booking[]>;
    timestamp: number;
  }> | null,
  lastError: null as Error | null,

  subscribe(callback: () => void) {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  },

  notifySubscribers() {
    this.subscribers.forEach(callback => callback());
  },

  async fetchData() {
    // If we have fresh data (less than 30 seconds old), return it
    if (this.data && Date.now() - this.data.timestamp < 30000) {
      return this.data;
    }

    // If we're already fetching, wait for that to complete
    if (this.isFetching && this.fetchPromise) {
      await this.fetchPromise;
      return this.data;
    }

    this.isFetching = true;
    this.lastError = null;

    try {
      this.fetchPromise = this._fetchData();
      const result = await this.fetchPromise;
      return result;
    } finally {
      this.isFetching = false;
      this.fetchPromise = null;
    }
  },

  async _fetchData() {
    const token = sessionStorage.getItem("token");
    if (!token) {
      throw new Error("No authentication token found");
    }

    const headers = {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };

    try {
      console.log("Fetching dashboard data...");
      const [activeRes, scheduledRes, pastRes] = await Promise.all([
        fetch("http://localhost:3002/graphql", {
          method: "POST",
          headers,
          body: JSON.stringify({
            query: `
              query {
                myActiveRides {
                  _id
                  startLocation
                  endLocation
                  departureTime
                  status
                  totalSeats
                  availableSeats
                  pricePerSeat
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
          }),
        }),
        fetch("http://localhost:3002/graphql", {
          method: "POST",
          headers,
          body: JSON.stringify({
            query: `
              query {
                myScheduledRides {
                  _id
                  startLocation
                  endLocation
                  departureTime
                  status
                  totalSeats
                  availableSeats
                  pricePerSeat
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
          }),
        }),
        fetch("http://localhost:3002/graphql", {
          method: "POST",
          headers,
          body: JSON.stringify({
            query: `
              query {
                myRideHistory {
                  _id
                  startLocation
                  endLocation
                  departureTime
                  status
                  totalSeats
                  availableSeats
                  pricePerSeat
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
          }),
        }),
      ]);

      const [activeData, scheduledData, pastData] = await Promise.all([
        activeRes.json(),
        scheduledRes.json(),
        pastRes.json(),
      ]);

      console.log("activeData", activeData);
      console.log("scheduledData", scheduledData);
      console.log("pastData", pastData);

      if (activeData.errors) throw new Error(activeData.errors[0].message);
      if (scheduledData.errors) throw new Error(scheduledData.errors[0].message);
      if (pastData.errors) throw new Error(pastData.errors[0].message);

      const activeRidesData = activeData.data.myActiveRides;
      const scheduledRidesData = scheduledData.data.myScheduledRides;
      const pastRidesData = pastData.data.myRideHistory;

      // Fetch bookings for all active and scheduled rides
      const allRideIds = [...activeRidesData, ...scheduledRidesData].map(ride => ride._id);
      const bookingsData: Record<string, Booking[]> = {};

      if (allRideIds.length > 0) {
        await Promise.all(
          allRideIds.map(async (rideId) => {
            try {
              const bookingsRes = await fetch("http://localhost:3001/graphql", {
                method: "POST",
                headers,
                body: JSON.stringify({
                  query: `
                    query GetRideBookings($rideId: ID!) {
                      getRideBookings(rideId: $rideId) {
                        id
                        userId
                        status
                        pickupLocation
                        dropoffLocation
                        price
                        createdAt
                        updatedAt
                      }
                    }
                  `,
                  variables: { rideId },
                }),
              });

              const data = await bookingsRes.json();
              
              // Handle unauthorized access
              if (data.errors) {
                const error = data.errors[0];
                if (error.message.includes('unauthorized') || error.message.includes('not authorized')) {
                  console.error(`Unauthorized access to bookings for ride ${rideId}:`, error.message);
                  throw new Error('You are not authorized to view ride bookings. Only drivers can access this information.');
                }
                throw new Error(error.message);
              }

              // Since getRideBookings returns [Booking!]!, we can safely assert this
              const bookings = data.data.getRideBookings as Booking[];
              if (!Array.isArray(bookings)) {
                throw new Error('Invalid response format: bookings must be an array');
              }

              // Validate each booking has required fields based on actual backend response
              const validBookings = bookings.every(booking => 
                booking && 
                typeof booking.id === 'string' &&
                typeof booking.userId === 'string' &&
                typeof booking.status === 'string' &&
                typeof booking.pickupLocation === 'string' &&
                typeof booking.dropoffLocation === 'string' &&
                booking.createdAt &&
                booking.updatedAt &&
                // Optional fields
                (!booking.pickupStopId || typeof booking.pickupStopId === 'string') &&
                (!booking.dropoffStopId || typeof booking.dropoffStopId === 'string') &&
                (!booking.price || typeof booking.price === 'number') &&
                (!booking.passengerId || typeof booking.passengerId === 'string')
              );

              if (!validBookings) {
                console.error('Invalid booking data:', JSON.stringify(bookings, null, 2));
                throw new Error('Invalid booking data received from server');
              }

              // Fetch user details for each booking
              const bookingsWithUsers = await Promise.all(
                bookings.map(async (booking) => {
                  try {
                    const userRes = await fetch("http://localhost:3000/graphql", {
                      method: "POST",
                      headers,
                      body: JSON.stringify({
                        query: `
                          query GetUserByUuid($id: String!) {
                            getUserByUuid(id: $id) {
                              id
                              email
                              firstName
                              lastName
                              gender
                              phoneNumber
                              role
                              universityId
                            }
                          }
                        `,
                        variables: { id: booking.userId },
                      }),
                    });

                    const userData = await userRes.json();
                    if (userData.errors) {
                      console.error(`Error fetching user details for ${booking.userId}:`, userData.errors);
                      return {
                        ...booking,
                        rideId: rideId,
                        createdAt: new Date(booking.createdAt).toISOString(),
                        updatedAt: new Date(booking.updatedAt).toISOString(),
                        user: null
                      };
                    }

                    return {
                      ...booking,
                      rideId: rideId,
                      createdAt: new Date(booking.createdAt).toISOString(),
                      updatedAt: new Date(booking.updatedAt).toISOString(),
                      user: userData.data.getUserByUuid
                    };
                  } catch (err) {
                    console.error(`Error fetching user details for ${booking.userId}:`, err);
                    return {
                      ...booking,
                      rideId: rideId,
                      createdAt: new Date(booking.createdAt).toISOString(),
                      updatedAt: new Date(booking.updatedAt).toISOString(),
                      user: null
                    };
                  }
                })
              );

              bookingsData[rideId] = bookingsWithUsers;
            } catch (err) {
              console.error(`Error fetching bookings for ride ${rideId}:`, err);
              if (err instanceof Error && err.message.includes('unauthorized')) {
                // If unauthorized, clear the bookings and show an error message
                bookingsData[rideId] = [];
                throw err; // Propagate the unauthorized error to be handled by the UI
              }
              bookingsData[rideId] = [];
            }
          })
        );
      }

      this.data = {
        activeRides: activeRidesData,
        scheduledRides: scheduledRidesData,
        pastRides: pastRidesData,
        bookings: bookingsData,
        timestamp: Date.now()
      };

      this.notifySubscribers();
      return this.data;
    } catch (err) {
      this.lastError = err instanceof Error ? err : new Error("Failed to fetch data");
      throw this.lastError;
    }
  }
};

// Add this after the cacheManager definition but before the DriverDashboard component
const statusCheckManager = {
  interval: null as NodeJS.Timeout | null,
  isRunning: false,
  subscribers: new Set<() => void>(),

  start() {
    if (this.isRunning) return;
    console.log("Starting status check manager");
    this.isRunning = true;

    // Initial check
    this.checkStatuses();

    // Set up interval
    this.interval = setInterval(() => {
      this.checkStatuses();
    }, 30000); // Check every 30 seconds
  },

  stop() {
    if (!this.isRunning) return;
    console.log("Stopping status check manager");
    this.isRunning = false;
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
  },

  subscribe(callback: () => void) {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  },

  notifySubscribers() {
    this.subscribers.forEach(callback => callback());
  },

  async checkStatuses() {
    if (!cacheManager.data) return;
    console.log("Status check manager checking rides");
    
    const ridesToUpdate = cacheManager.data.scheduledRides.filter(ride => {
      const departureTime = new Date(ride.departureTime);
      const now = new Date();
      console.log("Checking ride:", ride._id, "departure:", departureTime, "now:", now);
      return ride.status === "SCHEDULED" && departureTime <= now;
    });

    if (ridesToUpdate.length === 0) {
      console.log("No rides to update");
      return;
    }

    console.log("Found rides to update:", ridesToUpdate.length);
    const token = sessionStorage.getItem("token");
    if (!token) return;

    try {
      await Promise.all(
        ridesToUpdate.map(async (ride) => {
          try {
            console.log("Updating ride status:", ride._id);
            const response = await fetch("http://localhost:3002/graphql", {
              method: "POST",
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                query: `
                  mutation UpdateRide($id: ID!, $updateRideInput: UpdateRideInput!) {
                    updateRide(id: $id, updateRideInput: $updateRideInput) {
                      _id
                      status
                    }
                  }
                `,
                variables: {
                  id: ride._id,
                  updateRideInput: {
                    status: "ACTIVE"
                  }
                },
              }),
            });

            const data = await response.json();
            if (data.errors) {
              console.error(`Error updating ride ${ride._id}:`, data.errors);
              return;
            }

            // Update the ride status in the cache
            if (cacheManager.data) {
              const updateRideInArray = (rides: DashboardRide[]) => 
                rides.map(r => r._id === ride._id ? { ...r, status: "ACTIVE" } : r);

              cacheManager.data = {
                ...cacheManager.data,
                scheduledRides: updateRideInArray(cacheManager.data.scheduledRides),
                activeRides: [...cacheManager.data.activeRides, { ...ride, status: "ACTIVE" }]
              };
              cacheManager.notifySubscribers();
              this.notifySubscribers();
            }
          } catch (err) {
            console.error(`Error updating ride ${ride._id}:`, err);
          }
        })
      );
    } catch (err) {
      console.error("Error updating ride statuses:", err);
    }
  }
};

const DriverDashboard = () => {
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    return () => {
      // Only stop the status check manager when the entire dashboard is unmounted
      statusCheckManager.stop();
    };
  }, []);

  // If we're not on the client yet, show a loading state
  if (!isClient) {
    return <p className={styles.loading}>Initializing dashboard...</p>;
  }

  return <DriverDashboardContent />;
};

// Separate the dashboard content into its own component
const DriverDashboardContent: React.FC = () => {
  const router = useRouter();
  const {
    activeRides,
    scheduledRides,
    pastRides,
    loading,
    error,
    bookings,
    bookingsLoading,
    refetch,
    handleBookingAction
  } = useDashboardData();

  // Add a mount effect to verify the component is mounted
  useEffect(() => {
    console.log("DriverDashboardContent mounted");
    return () => {
      console.log("DriverDashboardContent unmounted");
    };
  }, []);

  const handleCreateRide = () => {
    router.push("/offer");
  };

  const handleEditRide = (rideId: string) => {
    router.push(`/offer/edit/${rideId}`);
  };

  const handleDeleteRide = async (rideId: string) => {
    if (!confirm("Are you sure you want to delete this ride?")) return;

    const token = sessionStorage.getItem("token");
    if (!token) return;

    try {
      const response = await fetch("http://localhost:3002/graphql", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: `
            mutation UpdateRide($id: ID!, $updateRideInput: UpdateRideInput!) {
              updateRide(id: $id, updateRideInput: $updateRideInput) {
                _id
                status
              }
            }
          `,
          variables: {
            id: rideId,
            updateRideInput: {
              status: "CANCELLED"
            }
          },
        }),
      });

      const data = await response.json();
      if (data.errors) throw new Error(data.errors[0].message);

      // Refetch the data instead of manually updating state
      await refetch();

    } catch (err) {
      console.error("Error deleting ride:", err);
      alert("Failed to delete ride. Please try again.");
    }
  };

  const handleCompleteRide = async (rideId: string) => {
    if (!confirm("Are you sure you want to mark this ride as completed?")) return;

    const token = sessionStorage.getItem("token");
    if (!token) return;

    try {
      const response = await fetch("http://localhost:3002/graphql", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: `
            mutation UpdateRide($id: ID!, $updateRideInput: UpdateRideInput!) {
              updateRide(id: $id, updateRideInput: $updateRideInput) {
                _id
                status
              }
            }
          `,
          variables: {
            id: rideId,
            updateRideInput: {
              status: "COMPLETED"
            }
          },
        }),
      });

      const data = await response.json();
      if (data.errors) throw new Error(data.errors[0].message);

      // Update the ride status in the cache
      if (cacheManager.data) {
        const updateRideInArray = (rides: DashboardRide[]) => 
          rides.map(r => r._id === rideId ? { ...r, status: "COMPLETED" } : r);

        cacheManager.data = {
          ...cacheManager.data,
          activeRides: updateRideInArray(cacheManager.data.activeRides),
          pastRides: [...cacheManager.data.pastRides, 
            cacheManager.data.activeRides.find(r => r._id === rideId)!
          ].map(r => r._id === rideId ? { ...r, status: "COMPLETED" } : r)
        };
        cacheManager.notifySubscribers();
      }

    } catch (err) {
      console.error("Error completing ride:", err);
      alert("Failed to complete ride. Please try again.");
    }
  };

  const renderBookingActions = (booking: Booking) => {
    if (booking.status !== BookingStatus.PENDING) return null;

    return (
      <div className={styles.bookingActions}>
        <button
          className={`${styles.actionButton} ${styles.acceptButton}`}
          onClick={() => handleBookingAction(booking.id, 'accept')}
          title="Accept Booking"
        >
          <Check className="h-4 w-4" />
        </button>
        <button
          className={`${styles.actionButton} ${styles.rejectButton}`}
          onClick={() => handleBookingAction(booking.id, 'reject')}
          title="Reject Booking"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    );
  };

  const renderBookings = (rideId: string) => {
    const rideBookings = bookings[rideId];
    const isLoading = bookingsLoading[rideId];

    if (isLoading) {
      return <p className={styles.loading}>Loading bookings...</p>;
    }

    if (!rideBookings || rideBookings.length === 0) {
      return <p className={styles.noBookings}>No bookings for this ride yet.</p>;
    }

    return (
      <div className={styles.bookingsList}>
        <p className={styles.label}>Bookings:</p>
        {rideBookings.map((booking) => (
          <div key={booking.id} className={styles.bookingItem}>
            <div className={styles.bookingInfo}>
              {booking.user ? (
                <>
                  <p className={styles.userName}>
                    {booking.user.firstName} {booking.user.lastName}
                  </p>
                  <p className={styles.userEmail}>{booking.user.email}</p>
                  <p className={styles.userId}>ID: {booking.user.universityId}</p>
                  {booking.user.phoneNumber && (
                    <p className={styles.userPhone}>Phone: {booking.user.phoneNumber}</p>
                  )}
                  {booking.user.gender && (
                    <p className={styles.userGender}>Gender: {booking.user.gender}</p>
                  )}
                </>
              ) : (
                <p className={styles.loading}>Loading user details...</p>
              )}
              <p className={styles.bookingDetails}>
                From: {booking.pickupLocation} → To: {booking.dropoffLocation}
              </p>
              <p className={styles.bookingStatus + " " + styles[`status${booking.status}`]}>
                {booking.status}
              </p>
            </div>
            <div className={styles.bookingRight}>
              <div className={styles.bookingPrice}>
                <p>{booking.price || 0} EGP</p>
                <p className={styles.bookingDate}>
                  Booked: {new Date(booking.createdAt).toLocaleDateString()}
                </p>
              </div>
              {renderBookingActions(booking)}
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderRideCard = (ride: DashboardRide, showActions = true) => (
    <Card key={ride._id} className={styles.card}>
      <CardContent className={styles.cardContent}>
        <div className="flex gap-6">
          {/* Ride Details */}
          <div className="flex-1">
            <div className={styles.statusBadge + " " + styles[`status${ride.status}`]}>
              {ride.status}
            </div>
            <p><span className={styles.label}>From:</span> {ride.startLocation}</p>
            <p><span className={styles.label}>To:</span> {ride.endLocation}</p>
            <p>
              <span className={styles.label}>Departure:</span>{" "}
              {new Date(ride.departureTime).toLocaleString()}
            </p>
            <p>
              <span className={styles.label}>Seats:</span>{" "}
              {ride.availableSeats}/{ride.totalSeats} available
            </p>
            <p>
              <span className={styles.label}>Price:</span>{" "}
              {ride.pricePerSeat} EGP per seat
            </p>
            {ride.girlsOnly && (
              <p className={styles.value}>Girls Only Ride</p>
            )}

            <div className={styles.actions}>
              {showActions && ride.status === "SCHEDULED" && (
                <>
                  <button
                    className={`${styles.actionButton} ${styles.editButton}`}
                    onClick={() => handleEditRide(ride._id)}
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    className={`${styles.actionButton} ${styles.deleteButton}`}
                    onClick={() => handleDeleteRide(ride._id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </>
              )}
              {ride.status === "ACTIVE" && (
                <button
                  className={`${styles.actionButton} ${styles.completeButton}`}
                  onClick={() => handleCompleteRide(ride._id)}
                >
                  Complete Ride
                </button>
              )}
            </div>
          </div>

          {/* Stops List */}
          <div className="flex-1">
            <div className={styles.stopsList}>
              <p className={styles.label}>Stops:</p>
              <div className="space-y-2">
                {ride.stops.map((stop: RideStop, index: number) => (
                  <div key={stop.stopId} className={styles.stopItem}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className={styles.stopLocation}>
                          {index + 1}. {stop.location}
                        </p>
                        <p className={styles.stopCoordinates}>
                          ({stop.latitude.toFixed(6)}, {stop.longitude.toFixed(6)})
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="ml-2"
                        onClick={() => {
                          // Get current location
                          if (navigator.geolocation) {
                            navigator.geolocation.getCurrentPosition(
                              (position) => {
                                const { latitude: startLat, longitude: startLng } = position.coords;
                                // Open Google Maps in a new tab with directions
                                const url = `https://www.google.com/maps/dir/?api=1&origin=${startLat},${startLng}&destination=${stop.latitude},${stop.longitude}&travelmode=driving`;
                                window.open(url, '_blank');
                              },
                              (error) => {
                                console.error("Error getting location:", error);
                                alert("Could not get your location. Please enable location services.");
                              }
                            );
                          } else {
                            alert("Geolocation is not supported by your browser");
                          }
                        }}
                      >
                        <Navigation className="h-4 w-4 mr-2" />
                        Navigate
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {renderBookings(ride._id)}
      </CardContent>
    </Card>
  );

  if (loading) return <p className={styles.loading}>Loading your dashboard...</p>;
  if (error) {
    if (error.includes('unauthorized') || error.includes('not authorized')) {
      return (
        <div className={styles.error}>
          <p>Access Denied</p>
          <p className={styles.errorMessage}>{error}</p>
          <p>Please make sure you are logged in as a driver to view this dashboard.</p>
        </div>
      );
    }
    return <p className={styles.error}>{error}</p>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.heading}>Driver Dashboard</h1>
        <button className={styles.createButton} onClick={handleCreateRide}>
          <Plus className="h-5 w-5" />
          Create Ride
        </button>
      </div>

      <h2 className={styles.heading}>Active Rides</h2>
      {activeRides.length === 0 ? (
        <p className={styles.noRides}>No active rides.</p>
      ) : (
        <div className={styles.cardGrid}>
          {activeRides.map(ride => renderRideCard(ride, false))}
        </div>
      )}

      <h2 className={styles.heading}>Scheduled Rides</h2>
      {scheduledRides.length === 0 ? (
        <p className={styles.noRides}>No scheduled rides.</p>
      ) : (
        <div className={styles.cardGrid}>
          {scheduledRides.map(ride => renderRideCard(ride, true))}
        </div>
      )}

      <h2 className={styles.heading}>Past Rides</h2>
      {pastRides.length === 0 ? (
        <p className={styles.noRides}>No past rides found.</p>
      ) : (
        <div className={styles.cardGrid}>
          {pastRides.map(ride => renderRideCard(ride, false))}
        </div>
      )}
    </div>
  );
};

// Custom hook for dashboard data
const useDashboardData = () => {
  const [state, setState] = useState<{
    activeRides: DashboardRide[];
    scheduledRides: DashboardRide[];
    pastRides: DashboardRide[];
    bookings: Record<string, Booking[]>;
    loading: boolean;
    error: string | null;
    bookingsLoading: Record<string, boolean>;
  }>({
    activeRides: cacheManager.data?.activeRides || [],
    scheduledRides: cacheManager.data?.scheduledRides || [],
    pastRides: cacheManager.data?.pastRides || [],
    bookings: cacheManager.data?.bookings || {},
    loading: !cacheManager.data,
    error: null,
    bookingsLoading: {}
  });

  useEffect(() => {
    console.log("Setting up dashboard data effect");
    
    const updateState = () => {
      if (cacheManager.data) {
        console.log("Updating state with new data");
        setState(prev => ({
          ...prev,
          activeRides: cacheManager.data!.activeRides,
          scheduledRides: cacheManager.data!.scheduledRides,
          pastRides: cacheManager.data!.pastRides,
          bookings: cacheManager.data!.bookings,
          loading: false,
          error: null
        }));
      }
    };

    // Subscribe to cache updates
    const unsubscribeCache = cacheManager.subscribe(updateState);
    const unsubscribeStatus = statusCheckManager.subscribe(updateState);

    // Start the status check manager
    statusCheckManager.start();

    // Initial fetch if needed
    if (!cacheManager.data && !cacheManager.isFetching) {
      console.log("Performing initial data fetch");
      setState(prev => ({ ...prev, loading: true }));
      cacheManager.fetchData().catch(err => {
        setState(prev => ({
          ...prev,
          loading: false,
          error: err.message
        }));
      });
    }

    return () => {
      console.log("Cleaning up dashboard data effect");
      unsubscribeCache();
      unsubscribeStatus();
      // Don't stop the status check manager here, as it should persist across remounts
    };
  }, []);

  const refetch = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    try {
      await cacheManager.fetchData();
    } catch (err) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: err instanceof Error ? err.message : "Failed to fetch data"
      }));
    }
  }, []);

  const handleBookingAction = async (bookingId: string, action: 'accept' | 'reject') => {
    const token = sessionStorage.getItem("token");
    if (!token) return;

    try {
      const response = await fetch("http://localhost:3001/graphql", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: `
            mutation ${action === 'accept' ? 'AcceptBooking' : 'RejectBooking'}($id: ID!) {
              ${action === 'accept' ? 'acceptBooking' : 'rejectBooking'}(id: $id) {
                id
                status
                updatedAt
              }
            }
          `,
          variables: { id: bookingId },
        }),
      });

      const data = await response.json();
      if (data.errors) throw new Error(data.errors[0].message);

      // Update the booking status in the cache
      if (cacheManager.data) {
        const newBookings = { ...cacheManager.data.bookings };
        Object.keys(newBookings).forEach(rideId => {
          newBookings[rideId] = newBookings[rideId].map((booking: Booking) => 
            booking.id === bookingId 
              ? { 
                  ...booking, 
                  status: action === 'accept' ? BookingStatus.CONFIRMED : BookingStatus.REJECTED,
                  updatedAt: data.data[action === 'accept' ? 'acceptBooking' : 'rejectBooking'].updatedAt
                }
              : booking
          );
        });
        cacheManager.data = {
          ...cacheManager.data,
          bookings: newBookings
        };
        cacheManager.notifySubscribers();
      }
    } catch (err) {
      console.error(`Error ${action}ing booking:`, err);
      alert(`Failed to ${action} booking. Please try again.`);
    }
  };

  return {
    ...state,
    refetch,
    handleBookingAction
  };
};

export default DriverDashboard;
