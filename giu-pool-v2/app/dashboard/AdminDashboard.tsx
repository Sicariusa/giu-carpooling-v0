import { useEffect, useState } from 'react';
import axios from 'axios';
import styles from './AdminDashboard.module.css';

const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState({
    totalRides: 0,
    activeBookings: 0,
    pendingDrivers: 0,
    passengers: 0,
  });

  const [ridesTableData, setRidesTableData] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const token = sessionStorage.getItem('token');

    const headers = {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    };

    const fetchStats = async () => {
      try {
        const [ridesRes, bookingsRes, driversRes, passengersRes] = await Promise.all([
          axios.post('http://localhost:3002/graphql', {
            query: `query { rides { _id } }`,
          }, { headers }),

          axios.post('http://localhost:3001/graphql', {
            query: `query { AllBookings { id } }`,
          }, { headers }),

          axios.post('http://localhost:3000/graphql', {
            query: `query { getAllDrivers { id } }`,
          }, { headers }),

          axios.post('http://localhost:3000/graphql', {
            query: `query { getAllPassengers { id } }`,
          }, { headers }),
        ]);

        setStats({
          totalRides: ridesRes.data.data.rides.length,
          activeBookings: bookingsRes.data.data.AllBookings.length,
          pendingDrivers: driversRes.data.data.getAllDrivers.length,
          passengers: passengersRes.data.data.getAllPassengers.length,
        });
      } catch (error) {
        console.error('Failed to fetch admin stats:', error);
      }
    };

    const fetchRidesTable = async () => {
      try {
        const rideRes = await axios.post('http://localhost:3002/graphql', {
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
            const driverRes = await axios.post('http://localhost:3000/graphql', {
              query: `
                query GetUserByUuid($id: String!) {
                    getUserByUuid(id: $id) {
                        firstName
                        lastName
                    }
                }
              `,
              variables: { id: ride.driverId },
            }, { headers });

            const driver = driverRes.data.data.getUserByUuid;
            return {
              ...ride,
              driverName: driver ? `${driver.firstName} ${driver.lastName}` : 'Unknown',
              passengers: ride.totalSeats - ride.availableSeats,
            };
          } catch (err) {
            console.warn("Failed to fetch driver info for ride:", ride._id, err);
            return {
              ...ride,
              driverName: 'Unknown',
              passengers: ride.totalSeats - ride.availableSeats,
            };
          }
        }));

        setRidesTableData(enrichedRides);
      } catch (error) {
        console.error('Failed to fetch ride data:', error);
      }
    };

    const fetchUsers = async () => {
      try {
        const res = await axios.post('http://localhost:3000/graphql', {
          query: `
            query {
              getAllUsers {
                id
                firstName
                lastName
                universityId
                role
                isApproved
              }
            }
          `
        }, { headers });

        setUsers(res.data.data.getAllUsers);
      } catch (err) {
        console.error("Failed to fetch users:", err);
      }
    };

    fetchStats();
    fetchRidesTable();
    fetchUsers();
  }, []);

  return (
    <div>
      <header className={styles.header}>
        GIU Admin Dashboard
      </header>

      <div className={styles.container}>
        {/* Overview */}
        <section className={styles.section}>
          <h2>Dashboard Overview</h2>
          <div className={styles.stats}>
            <div className={styles.statBox}>
              <h3>{stats.totalRides}</h3>
              <p>Total Rides</p>
            </div>
            <div className={styles.statBox}>
              <h3>{stats.activeBookings}</h3>
              <p>Bookings</p>
            </div>
            <div className={styles.statBox}>
              <h3>{stats.pendingDrivers}</h3>
              <p>Drivers</p>
            </div>
            <div className={styles.statBox}>
              <h3>{stats.passengers}</h3>
              <p>Passengers</p>
            </div>
          </div>
        </section>

        {/* Ride Monitoring */}
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

        {/* Payments */}
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
              <tr>
                <td>Menna Ayman</td>
                <td>50 EGP</td>
                <td>Refund Request</td>
                <td><button className={styles.primary}>Issue Refund</button></td>
              </tr>
            </tbody>
          </table>
        </section>

        {/* Complaints */}
        <section className={styles.section}>
          <h2>Complaints</h2>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>User</th>
                <th>Issue</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Ali Mahmoud</td>
                <td>Driver didn’t show up</td>
                <td><span className={`${styles.status} ${styles.pending}`}>Pending</span></td>
                <td><button className={styles.primary}>Mark as Resolved</button></td>
              </tr>
            </tbody>
          </table>
        </section>

        {/* User Management */}
        <section className={styles.section}>
          <h2>Users</h2>
          <input
            type="text"
            placeholder="Search user by name or GIU ID"
            className={styles.input}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Name</th>
                <th>GIU ID</th>
                <th>Role</th>
                <th>Status</th>
                <th>Privileges</th>
              </tr>
            </thead>
            <tbody>
              {users
                .filter((user) => {
                  const name = `${user.firstName} ${user.lastName}`.toLowerCase();
                  const idStr = user.universityId.toString();
                  return name.includes(searchTerm.toLowerCase()) || idStr.includes(searchTerm);
                })
                .map((user) => (
                  <tr key={user.id}>
                    <td>{user.firstName} {user.lastName}</td>
                    <td>GIU{user.universityId}</td>
                    <td>{user.role.charAt(0) + user.role.slice(1).toLowerCase()}</td>
                    <td>{user.isApproved ? 'Active' : 'Pending'}</td>
                    <td>
                      <button className={styles.primary}>Block</button>
                      {user.role !== 'ADMIN' && (
                        <button className={styles.secondary}>Make Admin</button>
                      )}
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
