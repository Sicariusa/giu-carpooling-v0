"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { Card, CardContent } from "@/components/ui/card";
import styles from './PassengerDashboard.module.css'; // Import the CSS module

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

const PassengerDashboard = () => {
  const [upcoming, setUpcoming] = useState<EnrichedBooking[]>([]);
  const [past, setPast] = useState<EnrichedBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = sessionStorage.getItem("token");

    const headers = {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };

    const fetchData = async () => {
      try {
        // Step 1: Get Bookings
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

        const bookings: Booking[] = bookingRes.data.data.MyBookings;

        // Step 2: Enrich with Ride info
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

        // Step 3: Split upcoming vs past
        const now = new Date();
        setUpcoming(
          enriched.filter(
            (b) =>
              b.rideDetails &&
              new Date(b.rideDetails.departureTime) > now
          )
        );
        setPast(
          enriched.filter(
            (b) =>
              b.rideDetails &&
              new Date(b.rideDetails.departureTime) <= now
          )
        );
      } catch (err) {
        setError("Failed to load bookings.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) return <p className={styles.loading}>Loading your dashboard...</p>;
  if (error) return <p className={styles.error}>{error}</p>;

  return (
    <div className={styles.container}>
      <h2 className={styles.heading}>Upcoming Rides</h2>
      {upcoming.length === 0 ? (
        <p className={styles.noRides}>No upcoming rides.</p>
      ) : (
        <div className={styles.cardGrid}>
          {upcoming.map((b) => (
            <Card key={b.id} className={styles.card}>
              <CardContent className={styles.cardContent}>
                <p><strong className={styles.label}>From:</strong> {b.rideDetails?.startLocation}</p>
                <p><strong className={styles.label}>To:</strong> {b.rideDetails?.endLocation}</p>
                <p>
                  <strong className={styles.label}>Departure:</strong>{" "}
                  {b.rideDetails?.departureTime ? new Date(b.rideDetails.departureTime).toLocaleString() : "N/A"}
                </p>
                <p><strong className={styles.label}>Status:</strong> {b.rideDetails?.status}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <h2 className={styles.heading}>Past Rides</h2>
      {past.length === 0 ? (
        <p className={styles.noRides}>No past rides found.</p>
      ) : (
        <div className={styles.cardGrid}>
          {past.map((b) => (
            <Card key={b.id} className={styles.card}>
              <CardContent className={styles.cardContent}>
                <p><strong className={styles.label}>From:</strong> {b.rideDetails?.startLocation}</p>
                <p><strong className={styles.label}>To:</strong> {b.rideDetails?.endLocation}</p>
                <p>
                  <strong className={styles.label}>Departure:</strong>{" "}
                  {b.rideDetails?.departureTime ? new Date(b.rideDetails.departureTime).toLocaleString() : "N/A"}
                </p>
                <p><strong className={styles.label}>Status:</strong> {b.rideDetails?.status}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default PassengerDashboard;
