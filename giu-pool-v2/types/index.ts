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
  id: string
  from: string
  to: string
  date: string
  time: string
  price: number
  availableSeats: number
  girlsOnly: boolean
  status: "active" | "completed" | "cancelled"
  driverId: string
  passengers: string[]
}

export interface RideFilters {
  from?: string
  to?: string
  date?: string
  girlsOnly?: boolean
}

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

// Form types
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

