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
  id: string;
  from: string;
  to: string;
  date: string;
  time: string;
  price: number;
  availableSeats: number;
  totalSeats: number;
  girlsOnly: boolean;
  status: string;
  driverId?: string;
  passengers?: any[];
  stops: {
    stopId: string;
    sequence: number;
    stopName?: string;
  }[];
}

export interface RideFilters {
  from?: string
  to?: string
  date?: string
  girlsOnly?: boolean
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