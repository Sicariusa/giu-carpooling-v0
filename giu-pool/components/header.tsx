import Link from "next/link"
import { Car } from "lucide-react"
import { Button } from "@/components/ui/button"

export function Header() {
  return (
    <header className="border-b">
      <div className="container flex h-16 items-center justify-between px-4">
        <Link href="/" className="flex items-center space-x-2">
          <Car className="h-6 w-6 text-emerald-400" />
          <span className="text-xl font-bold">GIU Pool</span>
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
          <Link href="/profile" className="text-sm font-medium text-muted-foreground hover:text-primary">
            Profile
          </Link>
          <Button variant="default" className="bg-emerald-400 hover:bg-emerald-500">
            Sign In
          </Button>
        </nav>
      </div>
    </header>
  )
}

