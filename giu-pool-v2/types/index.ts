// User related types
export interface User {
  id: string
  name: string
  email: string
  studentId: string
  avatarUrl?: string
  stats: UserStats
  role: "DRIVER" | "PASSENGER"
}

export interface UserStats {
  totalRides: number
  averageRating: number
  egpSaved: number
}

// Ride related types
export interface Ride {
  _id: string;
  startLocation: string;
  endLocation: string;
  departureTime: string;
  status: string;
  totalSeats: number;
  availableSeats: number;
  pricePerSeat: number;
  girlsOnly: boolean;
  stops: RideStop[];
}

export interface RideStop {
  stopId: string;
  location: string;
  sequence: number;
}

export enum BookingStatus {
  PENDING = "PENDING",
  CONFIRMED = "CONFIRMED",
  REJECTED = "REJECTED",
  CANCELLED = "CANCELLED"
}

export interface UserInfo {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  gender?: string;
  phoneNumber?: number;
  role: string;
  universityId: number;
}

export interface Booking {
  id: string;
  userId: string;
  rideId: string;
  status: BookingStatus;
  pickupStopId?: string;
  dropoffStopId?: string;
  pickupLocation: string;
  dropoffLocation: string;
  price?: number;
  createdAt: string;
  updatedAt: string;
  user?: UserInfo;
  passengerId?: string;
}

export interface RideFilters {
  from?: string
  to?: string
  date?: string
  girlsOnly?: boolean
}

// Form types
export interface RideStopInput {
  stopId: string;
  location: string;
  sequence: number;
}

export interface CreateRideInput {
  stops: RideStopInput[];
  departureTime: Date;
  totalSeats: number;
  availableSeats: number;
  pricePerSeat: number;
  priceScale?: number;
  girlsOnly?: boolean;
  startLocation: string;
  endLocation: string;
}

export interface CreateRideForm {
  from: string
  to: string
  date: string
  time: string
  price: number
  availableSeats: number
  girlsOnly: boolean
}

export interface BookRideForm {
  from: string
  to: string
  date: string
  time: string
  girlsOnly: boolean
}