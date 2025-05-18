"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FaUserCircle } from "react-icons/fa";
import { FiLogOut } from "react-icons/fi";
import { useUser } from "@/app/utils/UserContext";
import { User } from "@/types";
import axios from "axios";

export function Header() {
  const { isLoggedIn, setIsLoggedIn } = useUser();
  const [user, setUser] = useState<User | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
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
    setMobileMenuOpen(false);
    window.dispatchEvent(new Event("userLoginStatusChanged"));
    router.push("/");
  };

  return (
    <header className="border-b bg-white shadow-sm sticky top-0 z-50">
      <div className="container flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <Link href="/" className="flex items-center space-x-1">
          <div className="flex items-center">
            <span className="text-2xl font-bold text-black">G</span>
            <span className="text-2xl font-bold text-giu-red">I</span>
            <span className="text-2xl font-bold text-giu-gold">U</span>
          </div>
          <span className="ml-1 text-lg font-semibold text-gray-800 hidden sm:block">Pool</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-6">
          {isLoggedIn && user ? (
            <>
              <div className="flex items-center space-x-6">
                <Link
                  href={`/dashboard/${user.role.toLowerCase()}`}
                  className="text-sm font-medium text-gray-600 hover:text-giu-red transition-colors"
                >
                  Dashboard
                </Link>

                {user.role === "PASSENGER" && (
                  <Link
                    href="/book"
                    className="text-sm font-medium text-gray-600 hover:text-giu-red transition-colors"
                  >
                    Book a Ride
                  </Link>
                )}

                {user.role === "DRIVER" && (
                  <Link
                    href="/offer"
                    className="text-sm font-medium text-gray-600 hover:text-giu-red transition-colors"
                  >
                    Offer a Ride
                  </Link>
                )}
              </div>

              <div className="flex items-center space-x-4 pl-4 border-l border-gray-200">
                <Link
                  href="/profile"
                  className="text-gray-500 hover:text-giu-red transition-colors"
                  title="Profile"
                >
                  <FaUserCircle size={20} />
                </Link>

                <button
                  onClick={handleLogout}
                  className="flex items-center text-sm px-3 py-1 rounded-md bg-giu-red text-white hover:bg-giu-red/90 transition-colors"
                >
                  <FiLogOut className="mr-1.5" />
                  Logout
                </button>
              </div>
            </>
          ) : (
            <div className="flex items-center space-x-4">
              <Link href="/sign-in">
                <button className="text-sm px-4 py-1.5 rounded-md bg-giu-red text-white hover:bg-giu-red/90 transition-colors">
                  Sign In
                </button>
              </Link>
              <Link href="/sign-up">
                <button className="text-sm px-4 py-1.5 rounded-md bg-giu-gold text-white hover:bg-giu-gold/90 transition-colors">
                  Sign Up
                </button>
              </Link>
            </div>
          )}
        </nav>

        {/* Mobile Menu Button */}
        <button 
          className="md:hidden p-2 rounded-md text-gray-600 hover:bg-gray-100"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {mobileMenuOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-t">
          <div className="container px-4 py-3 space-y-3">
            {isLoggedIn && user ? (
              <>
                <Link
                  href={`/dashboard/${user.role.toLowerCase()}`}
                  className="block py-2 px-2 text-sm font-medium text-gray-700 rounded hover:bg-gray-50"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Dashboard
                </Link>

                {user.role === "PASSENGER" && (
                  <Link
                    href="/book"
                    className="block py-2 px-2 text-sm font-medium text-gray-700 rounded hover:bg-gray-50"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Book a Ride
                  </Link>
                )}

                {user.role === "DRIVER" && (
                  <Link
                    href="/offer"
                    className="block py-2 px-2 text-sm font-medium text-gray-700 rounded hover:bg-gray-50"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Offer a Ride
                  </Link>
                )}

                <Link
                  href="/profile"
                  className="flex items-center py-2 px-2 text-sm font-medium text-gray-700 rounded hover:bg-gray-50"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <FaUserCircle className="mr-2" />
                  Profile
                </Link>

                <button
                  onClick={handleLogout}
                  className="flex items-center w-full py-2 px-2 text-sm font-medium text-white bg-giu-red rounded hover:bg-giu-red/90"
                >
                  <FiLogOut className="mr-2" />
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/sign-in"
                  className="block py-2 px-2 text-sm font-medium text-white bg-giu-red rounded hover:bg-giu-red/90 text-center"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Sign In
                </Link>
                <Link
                  href="/sign-up"
                  className="block py-2 px-2 text-sm font-medium text-white bg-giu-gold rounded hover:bg-giu-gold/90 text-center"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}