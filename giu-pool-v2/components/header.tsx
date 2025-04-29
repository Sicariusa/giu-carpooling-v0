"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { FaUserCircle } from "react-icons/fa";

export function Header() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Check if the user is logged in by checking for a token in sessionStorage
    const token = sessionStorage.getItem("token");
    setIsLoggedIn(!!token);
  }, []);

  const handleLogout = () => {
    // Clear the token from sessionStorage and redirect to the home page
    sessionStorage.removeItem("token");
    setIsLoggedIn(false);
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
              <Button
                variant="default"
                className="bg-giu-red hover:bg-giu-red/90 text-white"
                onClick={handleLogout}
              >
                Log Out
              </Button>
            </>
          ) : (
            <>
              <Link href="/sign-in">
                <Button variant="default" className="bg-giu-red hover:bg-giu-red/90 text-white">
                  Sign In
                </Button>
              </Link>
              <Link href="/sign-up">
                <Button variant="default" className="bg-giu-gold hover:bg-giu-gold/90 text-white">
                  Sign Up
                </Button>
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}