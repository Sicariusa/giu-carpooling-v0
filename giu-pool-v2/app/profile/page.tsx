import { Settings, Car } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"

export default function ProfilePage() {
  return (
    <div className="container max-w-4xl py-6">
      <Card className="mb-8">
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-full bg-giu-gold/10 flex items-center justify-center">
                <Car className="h-8 w-8 text-giu-red" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">John Doe</h1>
                <p className="text-muted-foreground">john.doe@student.giu-uni.de</p>
                <p className="text-sm text-muted-foreground">Student ID: GIU2Z001234</p>
              </div>
            </div>
            <Button variant="outline" size="sm" className="gap-2">
              <Settings className="h-4 w-4" />
              Edit Profile
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-3 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="text-3xl font-bold text-giu-gold">12</div>
            <p className="text-sm text-muted-foreground">Total Rides</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-3xl font-bold text-giu-gold">4.9</div>
            <p className="text-sm text-muted-foreground">Average Rating</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-3xl font-bold text-giu-gold">320</div>
            <p className="text-sm text-muted-foreground">EGP Saved</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="history">
        <TabsList className="w-full justify-start">
          <TabsTrigger value="history">Ride History</TabsTrigger>
          <TabsTrigger value="offered">Offered Rides</TabsTrigger>
        </TabsList>
        <TabsContent value="history" className="space-y-4 mt-4">
          {[
            {
              from: "GIU Campus",
              to: "Maadi",
              date: "2024-02-20",
              time: "2:30 PM",
              price: "50 EGP",
              type: "Passenger",
              status: "Completed",
            },
            {
              from: "Maadi",
              to: "GIU Campus",
              date: "2024-02-19",
              time: "9:00 AM",
              price: "45 EGP",
              type: "Driver",
              status: "Completed",
            },
          ].map((ride, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">
                      {ride.from} → {ride.to}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {ride.type} • {ride.price}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {ride.date} • {ride.time}
                    </div>
                  </div>
                  <Badge variant="secondary" className="bg-giu-gold/10 text-giu-gold">
                    {ride.status}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  )
}

