"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { refundPayment } from "@/lib/api";
import styles from "./AdminDashboard.module.css";

const AdminDashboard: React.FC = () => {
  const [refundRequests, setRefundRequests] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [ridesTableData, setRidesTableData] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loadingRefundId, setLoadingRefundId] = useState<string | null>(null);
  const [updatingRoleId, setUpdatingRoleId] = useState<number | null>(null);
  const [deletingUserId, setDeletingUserId] = useState<number | null>(null);

  useEffect(() => {
    const token = sessionStorage.getItem("token");

    const headers = {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };

    const fetchRefundRequests = async () => {
      try {
        const [paymentsRes, bookingsRes, usersRes] = await Promise.all([
          axios.post("http://localhost:3003/graphql", {
            query: `query { getAllPayments { id bookingId status amount userId } }`
          }, { headers }),

          axios.post("http://localhost:3001/graphql", {
            query: `query { AllBookings { id userId status } }`
          }, { headers }),

          axios.post("http://localhost:3000/graphql", {
            query: `query { getAllUsers { id email universityId role } }`
          }, { headers })
        ]);

        const succeededPayments = paymentsRes.data.data.getAllPayments.filter((p: any) => p.status === "succeeded");
        const cancelledBookings = bookingsRes.data.data.AllBookings.filter((b: any) => b.status === "CANCELLED");

        const matched = succeededPayments.filter((p: any) =>
          cancelledBookings.find((b: any) => b.id === p.bookingId && b.userId === p.userId)
        ).map((p: any) => {
          const user = usersRes.data.data.getAllUsers.find((u: any) => u.id === p.userId);
          return {
            userName: user ? user.email : "Unknown",
            amount: p.amount,
            paymentId: p.id
          };
        });

        setRefundRequests(matched);
        setUsers(usersRes.data.data.getAllUsers);
      } catch (err) {
        console.error("Error fetching refunds:", err);
      }
    };

    const fetchRidesTable = async () => {
      try {
        const rideRes = await axios.post("http://localhost:3002/graphql", {
          query: `
            query {
              rides {
                _id
                startLocation
                endLocation
                departureTime
                driverId
                totalSeats
                availableSeats
                status
              }
            }
          `,
        }, { headers });

        const rides = rideRes.data.data.rides;

        const enrichedRides = await Promise.all(rides.map(async (ride: any) => {
          try {
            const driverRes = await axios.post("http://localhost:3000/graphql", {
              query: `
                query GetUserByUuid($id: String!) {
                    getUserByUuid(id: $id) {
                        email
                    }
                }
              `,
              variables: { id: ride.driverId },
            }, { headers });

            const driver = driverRes.data.data.getUserByUuid;
            return {
              ...ride,
              driverName: driver ? driver.email : "Unknown",
              passengers: ride.totalSeats - ride.availableSeats,
            };
          } catch (err) {
            console.warn("Failed to fetch driver info for ride:", ride._id, err);
            return {
              ...ride,
              driverName: "Unknown",
              passengers: ride.totalSeats - ride.availableSeats,
            };
          }
        }));

        setRidesTableData(enrichedRides);
      } catch (error) {
        console.error("Failed to fetch ride data:", error);
      }
    };

    fetchRefundRequests();
    fetchRidesTable();
  }, []);

  const handleRefund = async (paymentId: string) => {
    try {
      setLoadingRefundId(paymentId);
      await refundPayment(paymentId);
      setRefundRequests((prev) => prev.filter((r) => r.paymentId !== paymentId));
    } catch (err) {
      console.error("Refund failed:", err);
    } finally {
      setLoadingRefundId(null);
    }
  };

  const handleDeleteUser = async (universityId: number) => {
    try {
      setDeletingUserId(universityId);
      await axios.post("http://localhost:3000/graphql", {
        query: `
          mutation($universityId: Int!) {
            deleteUser(universityId: $universityId)
          }
        `,
        variables: { universityId },
      }, {
        headers: {
          Authorization: `Bearer ${sessionStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
      });
      setUsers((prev) => prev.filter((u) => u.universityId !== universityId));
    } catch (err) {
      console.error("Failed to delete user:", err);
    } finally {
      setDeletingUserId(null);
    }
  };

  const handleChangeRole = async (universityId: number, newRole: string) => {
    try {
      setUpdatingRoleId(universityId);
      await axios.post("http://localhost:3000/graphql", {
        query: `
          mutation($universityId: Int!, $role: Role!) {
            changeUserRole(universityId: $universityId, role: $role) {
              id
              role
            }
          }
        `,
        variables: { universityId, role: newRole },
      }, {
        headers: {
          Authorization: `Bearer ${sessionStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
      });
      setUsers((prev) =>
        prev.map((u) =>
          u.universityId === universityId ? { ...u, role: newRole } : u
        )
      );
    } catch (err) {
      console.error("Failed to change user role:", err);
    } finally {
      setUpdatingRoleId(null);
    }
  };

  return (
    <div>
      <header className={styles.header}>GIU Admin Dashboard</header>

      <div className={styles.container}>
        <section className={styles.section}>
          <h2>Rides & Bookings</h2>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Ride</th>
                <th>Date</th>
                <th>Driver</th>
                <th>Passengers</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {ridesTableData.map((ride) => (
                <tr key={ride._id}>
                  <td>{ride.startLocation} → {ride.endLocation}</td>
                  <td>{new Date(ride.departureTime).toLocaleDateString()}</td>
                  <td>{ride.driverName}</td>
                  <td>{ride.passengers}/{ride.totalSeats}</td>
                  <td>{ride.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className={styles.section}>
          <h2>Payments & Refunds</h2>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>User</th>
                <th>Amount</th>
                <th>Type</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {refundRequests.length === 0 ? (
                <tr><td colSpan={4}>No refund requests</td></tr>
              ) : (
                refundRequests.map((r) => (
                  <tr key={r.paymentId}>
                    <td>{r.userName}</td>
                    <td>{r.amount} EGP</td>
                    <td>Refund Request</td>
                    <td>
                      <button
                        className={styles.primary}
                        onClick={() => handleRefund(r.paymentId)}
                        disabled={loadingRefundId === r.paymentId}
                      >
                        {loadingRefundId === r.paymentId ? "Processing..." : "Issue Refund"}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </section>

        <section className={styles.section}>
          <h2>All Users</h2>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Email</th>
                <th>University ID</th>
                <th>Role</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <td>{user.email}</td>
                  <td>{user.universityId}</td>
                  <td>
                    <select
                      value={user.role}
                      onChange={(e) => handleChangeRole(user.universityId, e.target.value)}
                      disabled={updatingRoleId === user.universityId}
                    >
                      <option value="PASSENGER">PASSENGER</option>
                      <option value="DRIVER">DRIVER</option>
                      <option value="ADMIN">ADMIN</option>
                    </select>
                  </td>
                  <td>
                    <button
                      className={styles.secondary}
                      onClick={() => handleDeleteUser(user.universityId)}
                      disabled={deletingUserId === user.universityId}
                    >
                      {deletingUserId === user.universityId ? "Deleting..." : "Delete"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>
    </div>
  );
};

export default AdminDashboard;
