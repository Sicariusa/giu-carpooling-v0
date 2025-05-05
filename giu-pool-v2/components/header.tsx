"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { FaUserCircle } from "react-icons/fa";
import { useUser } from "@/app/utils/UserContext";

export function Header() {
  const { isLoggedIn, setIsLoggedIn } = useUser();
  const router = useRouter();

  useEffect(() => {
    // Check if the user is logged in by checking for a token in sessionStorage
    const token = sessionStorage.getItem("token");
    setIsLoggedIn(!!token);

    // Listen for custom event to update login state dynamically
    const handleLoginStatusChange = () => {
      const updatedToken = sessionStorage.getItem("token");
      setIsLoggedIn(!!updatedToken);
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
          <Link href="/dashboard" className="text-sm font-medium text-muted-foreground hover:text-primary">
            Dashboard
          </Link>
          <Link href="/book" className="text-sm font-medium text-muted-foreground hover:text-primary">
            Book a Ride
          </Link>
          <Link href="/offer" className="text-sm font-medium text-muted-foreground hover:text-primary">
            Offer a Ride
          </Link>
          {isLoggedIn ? (
            <>
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