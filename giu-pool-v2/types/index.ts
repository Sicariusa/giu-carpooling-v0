// User related types
export interface User {
  id: string
  name: string
  email: string
  studentId: string
  avatarUrl?: string
  stats: UserStats
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

