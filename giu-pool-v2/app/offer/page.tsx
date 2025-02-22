import { MapPin, Clock, Calendar, DollarSign, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent } from "@/components/ui/card"

export default function OfferRidePage() {
  return (
    <div className="container max-w-2xl py-6">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold mb-2">Offer a Ride</h1>
      </div>

      <Card>
        <CardContent className="p-6 space-y-6">
          <div className="space-y-4">
            <div className="relative">
              <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input placeholder="From (GIU or destination)" className="pl-10" />
            </div>

            <div className="relative">
              <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input placeholder="To (GIU or destination)" className="pl-10" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="relative">
              <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input type="date" className="pl-10" />
            </div>

            <div className="relative">
              <Clock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input type="time" className="pl-10" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="relative">
              <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Price per seat (EGP)" className="pl-10" />
            </div>

            <div className="relative">
              <Users className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Available seats" className="pl-10" />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="girls-only">Girls Only Ride</Label>
            <Switch id="girls-only" />
          </div>

          <Button className="w-full bg-giu-red hover:bg-giu-red/90">Create Ride</Button>
        </CardContent>
      </Card>
    </div>
  )
}

