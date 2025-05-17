"use client";

import { Shield, Users2, Clock, Car } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useUser } from "@/app/utils/UserContext";

export default function Home() {
  const { isLoggedIn } = useUser();

  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col">
      <section className="flex-1 space-y-6 pb-8 pt-6 md:pb-12 md:pt-10 lg:py-16">
        <div className="container flex max-w-[64rem] flex-col items-center gap-4 text-center">
          <span className="rounded-2xl bg-giu-gold/10 px-4 py-1.5 text-sm font-medium text-emerald-800">
            GIU Students & Staff Only
          </span>
          <h1 className="font-heading text-3xl sm:text-5xl md:text-6xl lg:text-7xl">
            Your Campus
            <br />
            Carpooling Solution
          </h1>
          <p className="max-w-[42rem] leading-normal text-muted-foreground sm:text-xl sm:leading-8">
            Share rides with your fellow GIU community members. Save money, reduce emissions, and travel safely.
          </p>
          {isLoggedIn && (
            <div className="space-x-4">
              <Button asChild size="lg" className="bg-giu-red hover:bg-giu-red/90">
                <Link href="/book">Find a Ride</Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/offer">Offer a Ride</Link>
              </Button>
            </div>
          )}
        </div>
      </section>

      <section className="container space-y-6 py-8 md:py-12 lg:py-16">
        <div className="mx-auto grid justify-center gap-4 sm:grid-cols-2 md:max-w-[64rem] md:grid-cols-4">
          <div className="relative overflow-hidden rounded-lg border bg-background p-2">
            <div className="flex h-[180px] flex-col justify-between rounded-md p-6">
              <Shield className="h-12 w-12 text-giu-gold" />
              <div className="space-y-2">
                <h3 className="font-bold">Safe & Secure</h3>
                <p className="text-sm text-muted-foreground">Verified university members only</p>
              </div>
            </div>
          </div>
          <div className="relative overflow-hidden rounded-lg border bg-background p-2">
            <div className="flex h-[180px] flex-col justify-between rounded-md p-6">
              <Users2 className="h-12 w-12 text-giu-gold" />
              <div className="space-y-2">
                <h3 className="font-bold">Girls Only Option</h3>
                <p className="text-sm text-muted-foreground">Choose female-only rides</p>
              </div>
            </div>
          </div>
          <div className="relative overflow-hidden rounded-lg border bg-background p-2">
            <div className="flex h-[180px] flex-col justify-between rounded-md p-6">
              <Clock className="h-12 w-12 text-giu-gold" />
              <div className="space-y-2">
                <h3 className="font-bold">Real-time Updates</h3>
                <p className="text-sm text-muted-foreground">Track your ride status</p>
              </div>
            </div>
          </div>
          <div className="relative overflow-hidden rounded-lg border bg-background p-2">
            <div className="flex h-[180px] flex-col justify-between rounded-md p-6">
              <Car className="h-12 w-12 text-giu-gold" />
              <div className="space-y-2">
                <h3 className="font-bold">Easy Booking</h3>
                <p className="text-sm text-muted-foreground">Book rides in seconds</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}