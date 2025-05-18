"use client";

import { Shield, Users2, Clock, Car } from "lucide-react";

export default function Home() {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col">
      {/* Hero Section */}
      <section className="flex-1 pb-8 pt-6 md:pb-12 md:pt-10 lg:py-16 px-4 bg-gradient-to-b from-white to-gray-50">
        <div className="container flex max-w-[64rem] flex-col items-center gap-6 text-center">
          <span className="inline-flex items-center rounded-full bg-giu-gold/10 px-4 py-1.5 text-sm font-medium text-giu-gold-dark ring-1 ring-inset ring-giu-gold/20">
            <span className="h-2 w-2 rounded-full bg-giu-red mr-2"></span>
            GIU Students & Staff Only
          </span>
          
          <h1 className="font-heading text-4xl sm:text-5xl md:text-6xl lg:text-7xl">
            <span className="text-gray-900">Your Campus</span>
            <br />
            <span className="bg-gradient-to-r from-giu-red to-giu-gold bg-clip-text text-transparent">
              Carpooling Solution
            </span>
          </h1>
          
          <p className="max-w-[42rem] leading-normal text-gray-600 sm:text-xl sm:leading-8">
            Share rides with your fellow GIU community members. Save money, reduce emissions, and travel safely.
          </p>
        </div>
      </section>

      {/* Features Section */}
      <section className="container space-y-6 py-8 md:py-12 lg:py-16 px-4">
        <h2 className="text-center text-3xl font-bold text-gray-900 mb-8">
          Why Choose <span className="text-giu-red">GIU</span> Pool?
        </h2>
        <div className="mx-auto grid justify-center gap-6 sm:grid-cols-2 md:max-w-[64rem] md:grid-cols-4">
          {[
            {
              icon: <Shield className="h-10 w-10 text-giu-gold" />,
              title: "Safe & Secure",
              desc: "Verified university members only"
            },
            {
              icon: <Users2 className="h-10 w-10 text-giu-gold" />,
              title: "Girls Only",
              desc: "Choose female-only rides"
            },
            {
              icon: <Clock className="h-10 w-10 text-giu-gold" />,
              title: "Real-time",
              desc: "Track your ride status"
            },
            {
              icon: <Car className="h-10 w-10 text-giu-gold" />,
              title: "Easy Booking",
              desc: "Book rides in seconds"
            }
          ].map((feature, index) => (
            <div 
              key={index} 
              className="relative overflow-hidden rounded-xl bg-white border border-gray-200 p-2 hover:shadow-md transition-all"
            >
              <div className="flex h-[160px] flex-col justify-between rounded-lg p-4">
                <div className="rounded-lg bg-giu-gold/10 p-3 w-fit">
                  {feature.icon}
                </div>
                <div className="space-y-1">
                  <h3 className="font-bold text-gray-900">{feature.title}</h3>
                  <p className="text-sm text-gray-600">{feature.desc}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}