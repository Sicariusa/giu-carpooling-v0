"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import DashboardLoading from "./loading";
import AdminDashboard from "../AdminDashboard";
import PassengerDashboard from "../PassengerDashboard";
//import DriverDashboard from "../DriverDashboard"; // You can make this later

interface User {
  id: string;
  firstName: string;
  role: "DRIVER" | "PASSENGER" | "ADMIN";
}

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const router = useRouter();

  useEffect(() => {
    const token = sessionStorage.getItem("token");
    if (!token) {
      router.push("/sign-in");
      return;
    }

    axios
      .post(
        "http://localhost:3000/graphql",
        {
          query: `
            query {
              getUserByToken {
                id
                firstName
                role
              }
            }
          `,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      )
      .then((res) => {
        const data = res.data?.data?.getUserByToken;
        if (!data) throw new Error("User not found");
        setUser(data);
      })
      .catch((err) => {
        console.error(err);
        setError("Failed to load user");
      })
      .finally(() => setLoading(false));
  }, [router]);

  if (loading) return <DashboardLoading />;
  if (error) return <p className="text-red-500">{error}</p>;
  if (!user) return <p>User not found</p>;

  return (
    <div className="container py-8">
      <h1 className="text-2xl font-bold mb-6">Welcome, {user.firstName}!</h1>
      {user.role === "ADMIN" && <AdminDashboard />}
      {user.role === "PASSENGER" && <PassengerDashboard />}
    </div>
  );
}
