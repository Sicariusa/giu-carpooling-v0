import type { CreateRideForm, Ride } from '@/types';

const USER_SERVICE_URL = process.env.NEXT_PUBLIC_USER_SERVICE_URL || 'http://localhost:3000/graphql';
const RIDE_SERVICE_URL = process.env.NEXT_PUBLIC_RIDE_SERVICE_URL || 'http://localhost:3002/graphql';
const BOOKING_SERVICE_URL = process.env.NEXT_PUBLIC_BOOKING_SERVICE_URL || 'http://localhost:3001/graphql';

const getTokenHeader = () => {
  const token = typeof window !== 'undefined' ? sessionStorage.getItem('token') : '';
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
};

// 👤 Get Current User
export async function getCurrentUser() {
  const res = await fetch(USER_SERVICE_URL, {
    method: 'POST',
    headers: getTokenHeader(),
    body: JSON.stringify({
      query: `
        query {
          getUserByToken {
            id
            name: firstName
            email
            universityId
            role
          }
        }
      `
    })
  });

  const data = await res.json();
  return data.data.getUserByToken;
}

// 🚗 Get Available Rides
export async function getAvailableRides(filters = {}) {
  const res = await fetch(RIDE_SERVICE_URL, {
    method: 'POST',
    headers: getTokenHeader(),
    body: JSON.stringify({
      query: `
        query($searchInput: SearchRideInput!) {
          searchRides(searchInput: $searchInput) {
            id: _id
            from: startLocation
            to: endLocation
            date: departureTime
            price: pricePerSeat
            availableSeats
            girlsOnly
            status
            driverId
            passengers
          }
        }
      `,
      variables: { searchInput: filters }
    })
  });

  const data = await res.json();
  return data.data.searchRides;
}


export async function createRide(data: CreateRideForm): Promise<Ride> {
  const res = await fetch(RIDE_SERVICE_URL, {
    method: 'POST',
    headers: getTokenHeader(),
    body: JSON.stringify({
      query: `
        mutation($input: CreateRideInput!) {
          createRide(createRideInput: $input) {
            id: _id
            from: startLocation
            to: endLocation
            date: departureTime
            price: pricePerSeat
            status
          }
        }
      `,
      variables: {
        input: {
          startLocation: data.from,
          endLocation: data.to,
          departureTime: `${data.date}T${data.time}`,
          pricePerSeat: data.price,
          availableSeats: data.availableSeats,
          totalSeats: data.availableSeats,
          girlsOnly: data.girlsOnly,
          stops: [] // you can add real stops here later
        }
      }
    })
  });

  const result = await res.json();
  return result.data.createRide;
}



// 🚘 Get Rides by User (Driver history)
export async function getUserRides(userId: string) {
  const res = await fetch(RIDE_SERVICE_URL, {
    method: 'POST',
    headers: getTokenHeader(),
    body: JSON.stringify({
      query: `
        query {
          myRides {
            id: _id
            from: startLocation
            to: endLocation
            date: departureTime
            status
            price: pricePerSeat
          }
        }
      `
    })
  });

  const result = await res.json();
  return result.data.myRides;
}


// lib/api.ts

export async function getRideById(rideId: string, token: string): Promise<Ride> {
  const response = await fetch("http://localhost:3002/graphql", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      query: `
        query($id: ID!) {
          ride(id: $id) {
            _id
            startLocation
            endLocation
            departureTime
            pricePerSeat
            availableSeats
            totalSeats
            driverId
            girlsOnly
            status
            stops {
              stopId
              sequence
            }
          }
        }
      `,
      variables: { id: rideId },
    }),
  });

  const result = await response.json();
  if (result.errors) {
    console.error("❌ GraphQL error:", result.errors);
    throw new Error("Failed to fetch ride");
  }

  const ride = result.data?.ride;
  if (!ride) throw new Error("Ride not found");

  return {
    _id: ride._id,
    startLocation: ride.startLocation,
    endLocation: ride.endLocation,
    departureTime: ride.departureTime,
    pricePerSeat: ride.pricePerSeat,
    availableSeats: ride.availableSeats,
    totalSeats: ride.totalSeats ?? ride.availableSeats,
    girlsOnly: ride.girlsOnly ?? false,
    status: ride.status,
    driverId: ride.driverId ?? "",
    stops: ride.stops ?? [],
  };
}


export async function bookRide(rideId: string, pickupStopId: string, dropoffStopId: string) {
  const token = typeof window !== "undefined" ? sessionStorage.getItem("token") : null;

  const res = await fetch("http://localhost:3001/graphql", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token || ""}`,
    },
    body: JSON.stringify({
      query: `
        mutation($data: CreateBookingInput!) {
          BookRide(data: $data) {
            id
            status
          }
        }
      `,
      variables: {
        data: {
          rideId,
          pickupStopId,
          dropoffStopId,
        },
      },
    }),
  });

  const json = await res.json();

  if (json.errors) {
    console.error("🚨 GraphQL Error while booking ride:", json.errors);
    throw new Error("Booking failed");
  }

  return json.data.BookRide;
}


export async function createPayment({ bookingId, amount, token }: { bookingId: string; amount: number, token: string }) {
  const res = await fetch("http://localhost:3003/graphql", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      query: `
        mutation($data: CreatePaymentDto!) {
          createPayment(data: $data) {
            id
            clientSecret
          }
        }
      `,
      variables: {
        data: {
          bookingId,
          amount,
        },
      },
    }),
  });

  const data = await res.json();

  if (data.errors) {
    console.error("🚨 GraphQL Error while creating payment:", data.errors);
    throw new Error("Payment creation failed");
  }

  return data.data.createPayment;
}


export async function confirmBooking(bookingId: string) {
  const res = await fetch("http://localhost:3001/graphql", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
    },
    body: JSON.stringify({
      query: `
        mutation($id: ID!) {
          internalConfirmBooking(id: $id) {
            id
            status
          }
        }
      `,
      variables: { id: bookingId },
    }),
  });

  const data = await res.json();
  return data.data.internalConfirmBooking;
}

export async function getMyBookedRideIds(token: string): Promise<string[]> {

  const res = await fetch("http://localhost:3001/graphql", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      query: `
        query {
         MyBookings {
            id
            rideId
            status
          }
        }
      `,
    }),
  });

  const data = await res.json();
  return data.data?.MyBookings?.map((b: any) => b.rideId) || [];
}

export async function cancelBooking(bookingId: string) {
  const res = await fetch("http://localhost:3001/graphql", {
    method: "POST",
    headers: getTokenHeader(),
    body: JSON.stringify({
      query: `
        mutation($id: ID!) {
          cancelBooking(id: $id) {
            id
            status
          }
        }
      `,
      variables: { id: bookingId },
    }),
  });

  const data = await res.json();

  if (data.errors) {
    console.error("🚨 GraphQL Error:", data.errors);
    throw new Error(data.errors[0]?.message || "Cancellation failed");
  }

  if (!data.data?.cancelBooking) {
    throw new Error("No response from cancelBooking");
  }

  return data.data.cancelBooking;
}


export async function cancelRide(rideId: string) {
  const res = await fetch("http://localhost:3002/graphql", {
    method: "POST",
    headers: getTokenHeader(),
    body: JSON.stringify({
      query: `
        mutation($id: ID!) {
          cancelRide(id: $id) {
            id: _id
            status
          }
        }
      `,
      variables: { id: rideId },
    }),
  });

  const data = await res.json();
  return data.data.cancelRide;
}

export async function refundPayment(paymentId: string) {
  const res = await fetch("http://localhost:3003/graphql", {
    method: "POST",
    headers: getTokenHeader(),
    body: JSON.stringify({
      query: `
        mutation($id: ID!) {
          refundPayment(id: $id) {
            id
            status
          }
        }
      `,
      variables: { id: paymentId },
    }),
  });

  const data = await res.json();
  return data.data.refundPayment;
}

// export async function getPaymentByBookingId(bookingId: string) {
//   const res = await fetch("http://localhost:3003/graphql", {
//     method: "POST",
//     headers: getTokenHeader(),
//     body: JSON.stringify({
//       query: `
//         query($id: ID!) {
//           getPaymentById(id: $id) {
//             id
//             bookingId
//             amount
//             currency
//             status
//             paymentIntentId
//             clientSecret
//           }
//         }
//       `,
//       variables: { id: bookingId },
//     }),
// //   });

//   const data = await res.json();

//   if (data.errors || !data.data?.getPaymentById) {
//     console.warn("No payment found or unauthorized:", data.errors);
//     return null;
//   }

//   return data.data.getPaymentById;
// }

export async function getMyPayments() {
  const res = await fetch("http://localhost:3003/graphql", {
    method: "POST",
    headers: getTokenHeader(),
    body: JSON.stringify({
      query: `
        query {
          getMyPayments {
            id
            bookingId
            amount
            currency
            status
            paymentIntentId
            clientSecret
            createdAt
          }
        }
      `
    }),
  });

  const data = await res.json();
  return data.data.getMyPayments;
}

export async function getPaymentByBooking(bookingId: string) {
  const res = await fetch("http://localhost:3003/graphql", {
    method: "POST",
    headers: getTokenHeader(),
    body: JSON.stringify({
      query: `
        query($bookingId: ID!) {
          getPaymentByBooking(bookingId: $bookingId) {
            id
            status
            bookingId
          }
        }
      `,
      variables: { bookingId },
    }),
  });

  const data = await res.json();

  if (data.errors || !data.data?.getPaymentByBooking) {
    console.warn("No payment found or unauthorized:", data.errors);
    return null;
  }

  return data.data.getPaymentByBooking;
}


