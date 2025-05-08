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
        const userResponse = await axios.post(
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
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const userData: User = userResponse.data.data.getUserByToken;
        setUser(userData);
        setIsLoggedIn(true);
      } catch (error) {
        console.error("Failed to fetch user data:", error);
        setIsLoggedIn(false);
      }
    };

    fetchUserData();

    // Listen for custom event to update login state dynamically
    const handleLoginStatusChange = () => {
      const updatedToken = sessionStorage.getItem("token");
      setIsLoggedIn(!!updatedToken);
      if (updatedToken) {
        fetchUserData();
      } else {
        setUser(null);
      }
    };

    window.addEventListener("userLoginStatusChanged", handleLoginStatusChange);

    return () => {
      window.removeEventListener("userLoginStatusChanged", handleLoginStatusChange);
    };
  }, [setIsLoggedIn]);

  const handleLogout = () => {
    // Clear the token from sessionStorage and redirect to the home page
    sessionStorage.removeItem("token");
    setIsLoggedIn(false);

    // Dispatch custom event to notify other components
    window.dispatchEvent(new Event("userLoginStatusChanged"));

    router.push("/");
  };

  return (
    <header className="border-b">
      <div className="container flex h-16 items-center justify-between px-4">
        <Link href="/" className="flex items-center space-x-2">
          <div className="flex items-center">
            <span className="text-2xl font-bold">G</span>
            <span className="text-2xl font-bold text-giu-red">I</span>
            <span className="text-2xl font-bold text-giu-gold">U</span>
            <span className="ml-2 hidden text-sm font-medium sm:block">Pool</span>
          </div>
        </Link>
        <nav className="flex items-center space-x-6">
          {isLoggedIn && user ? (
            <>
              <Link
                href={`/dashboard/${user.role.toLowerCase()}`}
                className="text-sm font-medium text-muted-foreground hover:text-primary"
              >
                Dashboard
              </Link>
              <Link
                href="/book"
                className="text-sm font-medium text-muted-foreground hover:text-primary"
              >
                Book a Ride
              </Link>
              <Link
                href="/offer"
                className="text-sm font-medium text-muted-foreground hover:text-primary"
              >
                Offer a Ride
              </Link>
              <Link href="/profile" className="text-muted-foreground hover:text-primary">
                <FaUserCircle size={24} />
              </Link>
              <button
                className="bg-giu-red hover:bg-giu-red/90 text-white px-4 py-2 rounded"
                onClick={handleLogout}
              >
                Log Out
              </button>
            </>
          ) : (
            <>
              <Link href="/sign-in">
                <button className="bg-giu-red hover:bg-giu-red/90 text-white px-4 py-2 rounded">
                  Sign In
                </button>
              </Link>
              <Link href="/sign-up">
                <button className="bg-giu-gold hover:bg-giu-gold/90 text-white px-4 py-2 rounded">
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