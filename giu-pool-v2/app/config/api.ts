export const API_CONFIG = {
  userService: "http://localhost:3000/graphql",
  rideService: "http://localhost:3002/graphql",
  headers: (token: string | null) => ({
    "Content-Type": "application/json",
    "Accept": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }),
}; 