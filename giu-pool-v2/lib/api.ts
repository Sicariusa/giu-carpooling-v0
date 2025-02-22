// This file will contain all API calls to your backend
import type { User, Ride, CreateRideForm, RideFilters } from "@/types"

export async function getCurrentUser(): Promise<User> {
  // TODO: Implement API call to get current user
  // GET /api/users/me
  throw new Error("Not implemented")
}

export async function getAvailableRides(filters?: RideFilters): Promise<Ride[]> {
  // TODO: Implement API call to get available rides
  // GET /api/rides?from=X&to=Y&date=Z
  throw new Error("Not implemented")
}

export async function createRide(data: CreateRideForm): Promise<Ride> {
  // TODO: Implement API call to create a ride
  // POST /api/rides
  throw new Error("Not implemented")
}

export async function bookRide(rideId: string): Promise<Ride> {
  // TODO: Implement API call to book a ride
  // POST /api/rides/{rideId}/book
  throw new Error("Not implemented")
}

export async function getUserRides(userId: string): Promise<Ride[]> {
  // TODO: Implement API call to get user rides
  // GET /api/users/{userId}/rides
  throw new Error("Not implemented")
}

