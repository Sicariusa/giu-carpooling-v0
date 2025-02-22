import { Search, MapPin, Users, Filter } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"

export default function DashboardPage() {
  return (
    <div className="container py-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-2">Available Rides</h1>
        <p className="text-muted-foreground">Find and book your next ride to or from GIU</p>
      </div>

      <div className="flex gap-4 mb-8">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search rides..." className="pl-10" />
        </div>
        <Button variant="outline" className="gap-2">
          <Filter className="h-4 w-4" />
          Filters
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[
          {
            from: "GIU Campus",
            to: "Maadi",
            date: "2024-02-20",
            time: "2:30 PM",
            price: "50 EGP",
            seats: 3,
            girlsOnly: true,
          },
          {
            from: "Maadi",
            to: "GIU Campus",
            date: "2024-02-21",
            time: "9:00 AM",
            price: "45 EGP",
            seats: 2,
            girlsOnly: false,
          },
        ].map((ride, i) => (
          <Card key={i} className="overflow-hidden">
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-emerald-400" />
                    <span>{ride.from}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-emerald-400" />
                    <span>{ride.to}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    {ride.date}
                    <br />
                    {ride.time}
                  </div>
                  <div className="text-lg font-bold text-emerald-400">{ride.price}</div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Users className="h-4 w-4" />
                    {ride.seats} seats left
                  </div>
                  {ride.girlsOnly && (
                    <Badge variant="secondary" className="bg-pink-50 text-pink-500 hover:bg-pink-50">
                      Girls Only
                    </Badge>
                  )}
                </div>

                <Button className="w-full bg-emerald-400 hover:bg-emerald-500">Book Now</Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

