"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FaUserCircle } from "react-icons/fa";
import { useUser } from "@/app/utils/UserContext";
import { User } from "@/types";
import axios from "axios";

export function Header() {
  const { isLoggedIn, setIsLoggedIn } = useUser();
  const [user, setUser] = useState<User | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchUserData = async () => {
      const token = sessionStorage.getItem("token");
      if (!token) {
        setIsLoggedIn(false);
        return;
      }

      try {
        const res = await axios.post(
          "http://localhost:3000/graphql",
          {
            query: `
              query GetUserByToken {
                getUserByToken {
                  id
                  email
                  universityId
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
        );
        const userData: User = res.data.data.getUserByToken;
        setUser(userData);
        setIsLoggedIn(true);
      } catch (error) {
        console.error("Failed to fetch user data:", error);
        setIsLoggedIn(false);
      }
    };

    fetchUserData();

    const handleLoginStatusChange = () => {
      const token = sessionStorage.getItem("token");
      setIsLoggedIn(!!token);
      if (token) {
        fetchUserData();
      } else {
        setUser(null);
      }
    };

    window.addEventListener("userLoginStatusChanged", handleLoginStatusChange);
    return () => window.removeEventListener("userLoginStatusChanged", handleLoginStatusChange);
  }, [setIsLoggedIn]);

  const handleLogout = () => {
    sessionStorage.removeItem("token");
    setIsLoggedIn(false);
    window.dispatchEvent(new Event("userLoginStatusChanged"));
    router.push("/");
  };

  return (
    <header className="border-b bg-white shadow-sm">
      <div className="container flex h-16 items-center justify-between px-4">
        <Link href="/" className="flex items-center space-x-2">
          <span className="text-2xl font-bold">G</span>
          <span className="text-2xl font-bold text-giu-red">I</span>
          <span className="text-2xl font-bold text-giu-gold">U</span>
          <span className="ml-2 hidden text-sm font-medium sm:block">Pool</span>
        </Link>

        <nav className="flex items-center space-x-4">
          {isLoggedIn && user ? (
            <>
              <Link
                href={`/dashboard/${user.role.toLowerCase()}`}
                className="text-sm font-medium text-muted-foreground hover:text-primary transition"
              >
                Dashboard
              </Link>

              {user.role === "PASSENGER" && (
                <Link
                  href="/book"
                  className="text-sm font-medium text-muted-foreground hover:text-primary transition"
                >
                  Book a Ride
                </Link>
              )}

              {user.role === "DRIVER" && (
                <Link
                  href="/offer"
                  className="text-sm font-medium text-muted-foreground hover:text-primary transition"
                >
                  Offer a Ride
                </Link>
              )}

              <Link
                href="/profile"
                className="text-muted-foreground hover:text-primary transition"
              >
                <FaUserCircle size={22} />
              </Link>

              <button
                onClick={handleLogout}
                className="text-sm px-4 py-1.5 rounded bg-giu-red text-white hover:bg-giu-red/90 transition"
              >
                Log Out
              </button>
            </>
          ) : (
            <>
              <Link href="/sign-in">
                <button className="text-sm px-4 py-1.5 rounded bg-giu-red text-white hover:bg-giu-red/90 transition">
                  Sign In
                </button>
              </Link>
              <Link href="/sign-up">
                <button className="text-sm px-4 py-1.5 rounded bg-giu-gold text-white hover:bg-giu-gold/90 transition">
                  Sign Up
                </button>
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
