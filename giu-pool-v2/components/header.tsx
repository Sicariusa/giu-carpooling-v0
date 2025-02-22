import Link from "next/link"
import { Button } from "@/components/ui/button"

export function Header() {
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
          <Link href="/profile" className="text-sm font-medium text-muted-foreground hover:text-primary">
            Profile
          </Link>
          <Button variant="default" className="bg-giu-red hover:bg-giu-red/90 text-white">
            Sign In
          </Button>
        </nav>
      </div>
    </header>
  )
}

