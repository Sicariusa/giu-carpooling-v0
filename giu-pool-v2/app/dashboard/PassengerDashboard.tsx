"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { cancelBooking, getPaymentByBooking } from "@/lib/api";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { RotateCcw, XCircle, CheckCircle, Loader2, AlertTriangle } from "lucide-react";

interface Booking {
  id: string;
  rideId: string;
  status: string;
  pickupLocation: string;
  dropoffLocation: string;
  price: number;
  createdAt: string;
}

interface Ride {
  _id: string;
  startLocation: string;
  endLocation: string;
  departureTime: string;
  status: string;
}

interface EnrichedBooking extends Booking {
  rideDetails: Ride | null;
}

interface CancelledRideGroup {
  rideId: string;
  rideDetails: Ride | null;
  count: number;
  lastCancellation: string;
  bookings: EnrichedBooking[];
}

const PassengerDashboard = () => {
  const [upcoming, setUpcoming] = useState<EnrichedBooking[]>([]);
  const [active, setActive] = useState<EnrichedBooking[]>([]);
  const [past, setPast] = useState<EnrichedBooking[]>([]);
  const [invalid, setInvalid] = useState<EnrichedBooking[]>([]);
  const [cancelled, setCancelled] = useState<EnrichedBooking[]>([]);
  const [refundedBookings, setRefundedBookings] = useState<string[]>([]);
  const [canceledBookings, setCanceledBookings] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const router = useRouter();

  useEffect(() => {
    const token = sessionStorage.getItem("token");

    const headers = {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };

    const fetchData = async () => {
      try {
        const bookingRes = await axios.post(
          "http://localhost:3001/graphql",
          {
            query: `
              query {
                MyBookings {
                  id
                  rideId
                  status
                  pickupLocation
                  dropoffLocation
                  price
                  createdAt
                }
              }
            `,
          },
          { headers }
        );

        const bookings: Booking[] = bookingRes.data?.data?.MyBookings ?? [];

        const enriched = await Promise.all(
          bookings.map(async (booking) => {
            try {
              const rideRes = await axios.post(
                "http://localhost:3002/graphql",
                {
                  query: `
                    query GetRide($id: ID!) {
                      ride(id: $id) {
                        _id
                        startLocation
                        endLocation
                        departureTime
                        status
                      }
                    }
                  `,
                  variables: { id: booking.rideId },
                },
                { headers }
              );

              return {
                ...booking,
                rideDetails: rideRes.data.data.ride,
              };
            } catch (err) {
              console.warn("Failed to fetch ride", booking.rideId);
              return { ...booking, rideDetails: null };
            }
          })
        );

        const now = new Date();
        const tempActive: EnrichedBooking[] = [];
        const tempUpcoming: EnrichedBooking[] = [];
        const tempPast: EnrichedBooking[] = [];
        const tempInvalid: EnrichedBooking[] = [];
        const tempCancelled: EnrichedBooking[] = [];

        for (const b of enriched) {
          if (!b.rideDetails) {
            tempInvalid.push(b);
            continue;
          }

          const dep = new Date(b.rideDetails.departureTime);

          if (b.status === "CANCELLED") {
            if (b.rideDetails.status === "SCHEDULED") {
              tempCancelled.push(b);
            }
          } else if (b.rideDetails.status === "ACTIVE" && dep <= now) {
            tempActive.push(b);
          } else if (b.rideDetails.status === "SCHEDULED" && dep > now) {
            tempUpcoming.push(b);
          } else if (b.rideDetails.status === "COMPLETED" && dep <= now) {
            tempPast.push(b);
          } else {
            tempInvalid.push(b);
          }
        }

        setActive(tempActive);
        setUpcoming(tempUpcoming);
        setPast(tempPast);
        setInvalid(tempInvalid);
        setCancelled(tempCancelled);
      } catch (err) {
        setError("Failed to load bookings.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [canceledBookings, refundedBookings]);

  const handleCancel = async (bookingId: string) => {
    setCancellingId(bookingId);
    try {
      await cancelBooking(bookingId);
      const payment = await getPaymentByBooking(bookingId);
      if (payment?.status === "succeeded" && payment?.bookingId === bookingId) {
        setRefundedBookings((prev) => [...prev, bookingId]);
      } else {
        setCanceledBookings((prev) => [...prev, bookingId]);
      }
    } catch (err) {
      console.error("Cancel failed:", err);
    } finally {
      setTimeout(() => setCancellingId(null), 1000);
    }
  };

  const handleBookAgain = (rideId: string) => {
    router.push(`/payment?rideId=${rideId}`);
  };

  const getIssueDescription = (booking: EnrichedBooking): string => {
    if (!booking.rideDetails) return "Ride information unavailable";
    
    const now = new Date();
    const dep = new Date(booking.rideDetails.departureTime);
    
    if (booking.status === "CANCELLED") {
      return "This booking was cancelled";
    }
    
    if (booking.rideDetails.status === "ACTIVE" && dep > now) {
      return "Ride is active but departure time is in the future";
    }
    
    if (booking.rideDetails.status === "COMPLETED" && dep > now) {
      return "Ride marked completed before departure time";
    }
    
    if (booking.rideDetails.status === "SCHEDULED" && dep < now) {
      return "Ride is scheduled but departure time has passed";
    }
    
    return "Unknown issue with this ride";
  };

  const groupedCancelledRides = cancelled.reduce((acc, booking) => {
    const existingGroup = acc.find(group => group.rideId === booking.rideId);
    if (existingGroup) {
      existingGroup.count++;
      existingGroup.bookings.push(booking);
      if (new Date(booking.createdAt) > new Date(existingGroup.lastCancellation)) {
        existingGroup.lastCancellation = booking.createdAt;
      }
    } else {
      acc.push({
        rideId: booking.rideId,
        rideDetails: booking.rideDetails,
        count: 1,
        lastCancellation: booking.createdAt,
        bookings: [booking]
      });
    }
    return acc;
  }, [] as CancelledRideGroup[]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const renderRideCard = (b: EnrichedBooking, allowCancel: boolean, showRebook = false, isInvalid = false) => (
    <motion.div
      key={b.id}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -50 }}
      transition={{ duration: 0.3 }}
    >
      <Card className={`mb-4 hover:shadow-md transition-shadow ${isInvalid ? 'border-yellow-400' : ''}`}>
        <CardContent className="p-6">
          {isInvalid && (
            <div className="flex items-center bg-yellow-50 text-yellow-700 p-3 rounded-md mb-4">
              <AlertTriangle className="h-5 w-5 mr-2" />
              <span className="font-medium">{getIssueDescription(b)}</span>
            </div>
          )}
          
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <p className="text-sm text-gray-500">From</p>
              <p className="font-medium">{b.rideDetails?.startLocation || 'Unknown'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">To</p>
              <p className="font-medium">{b.rideDetails?.endLocation || 'Unknown'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Departure</p>
              <p className="font-medium">
                {b.rideDetails ? formatDate(b.rideDetails.departureTime) : 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Status</p>
              <p className="font-medium capitalize">
                {b.rideDetails?.status.toLowerCase() || 'unknown'}
              </p>
            </div>
          </div>
          
          <div className="flex gap-2">
            {allowCancel && (
              <Button
                variant="destructive"
                onClick={() => handleCancel(b.id)}
                disabled={cancellingId === b.id}
              >
                {cancellingId === b.id ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Cancelling...
                  </span>
                ) : (
                  "Cancel Booking"
                )}
              </Button>
            )}
            {showRebook && b.rideDetails?.status === "SCHEDULED" && (
              <Button onClick={() => handleBookAgain(b.rideId)}>
                <RotateCcw className="h-4 w-4 mr-2" />
                Book Again
              </Button>
            )}
          </div>

          {refundedBookings.includes(b.id) && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mt-3 flex items-center text-green-600"
            >
              <CheckCircle className="h-4 w-4 mr-1" />
              <span>Refund requested</span>
            </motion.div>
          )}
          {canceledBookings.includes(b.id) && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mt-3 flex items-center text-red-600"
            >
              <XCircle className="h-4 w-4 mr-1" />
              <span>Booking canceled</span>
            </motion.div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="flex flex-col items-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
        <p className="mt-2 text-gray-600">Loading your dashboard...</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="flex items-center justify-center h-64">
      <div className="text-center p-4 bg-red-50 rounded-lg max-w-md">
        <XCircle className="h-8 w-8 mx-auto text-red-500" />
        <p className="mt-2 text-red-600">{error}</p>
        <Button 
          variant="outline" 
          className="mt-4"
          onClick={() => window.location.reload()}
        >
          Try Again
        </Button>
      </div>
    </div>
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-8">Your Rides</h1>

      <div className="space-y-12">
        <section>
          <h2 className="text-xl font-semibold mb-4">Active Rides</h2>
          <AnimatePresence>
            {active.length === 0 ? (
              <p className="text-gray-500">No active rides.</p>
            ) : (
              <div className="space-y-4">
                {active.map(b => renderRideCard(b, false))}
              </div>
            )}
          </AnimatePresence>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">Upcoming Rides</h2>
          <AnimatePresence>
            {upcoming.length === 0 ? (
              <p className="text-gray-500">No upcoming rides.</p>
            ) : (
              <div className="space-y-4">
                {upcoming.map(b => renderRideCard(b, true))}
              </div>
            )}
          </AnimatePresence>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">Past Rides</h2>
          <AnimatePresence>
            {past.length === 0 ? (
              <p className="text-gray-500">No past rides found.</p>
            ) : (
              <div className="space-y-4">
                {past.map(b => renderRideCard(b, false))}
              </div>
            )}
          </AnimatePresence>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <AlertTriangle className="h-5 w-5 text-yellow-500 mr-2" />
            Rides with Issues
          </h2>
          <AnimatePresence>
            {invalid.length === 0 ? (
              <p className="text-gray-500">No issues detected.</p>
            ) : (
              <div className="space-y-4">
                {invalid.map(b => renderRideCard(b, true, false, true))}
              </div>
            )}
          </AnimatePresence>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">Cancelled Rides</h2>
          {groupedCancelledRides.length === 0 ? (
            <p className="text-gray-500">No cancelled bookings.</p>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader className="bg-gray-50">
                  <TableRow>
                    <TableHead>Ride</TableHead>
                    <TableHead>From → To</TableHead>
                    <TableHead>Departure</TableHead>
                    <TableHead>Cancellations</TableHead>
                    <TableHead>Last Cancelled</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {groupedCancelledRides.map((group) => (
                    <TableRow key={group.rideId}>
                      <TableCell className="font-medium">
                        {group.rideDetails?.startLocation} → {group.rideDetails?.endLocation}
                      </TableCell>
                      <TableCell>
                        {group.rideDetails?.startLocation} → {group.rideDetails?.endLocation}
                      </TableCell>
                      <TableCell>
                        {group.rideDetails ? formatDate(group.rideDetails.departureTime) : 'N/A'}
                      </TableCell>
                      <TableCell>
                        {group.count} time{group.count > 1 ? 's' : ''}
                      </TableCell>
                      <TableCell>
                        {formatDate(group.lastCancellation)}
                      </TableCell>
                      <TableCell>
                        {group.rideDetails?.status === "SCHEDULED" && (
                          <Button 
                            size="sm" 
                            onClick={() => handleBookAgain(group.rideId)}
                          >
                            <RotateCcw className="h-4 w-4 mr-2" />
                            Rebook
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default PassengerDashboard;