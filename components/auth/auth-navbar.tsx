"use client"

import * as React from "react"
import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Menu } from "lucide-react"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"

export function AuthNavbar() {
  const pathname = usePathname()
  const isLoginPage = pathname === '/login'
  const isSignupPage = pathname === '/signup'
  const [open, setOpen] = React.useState(false)

  return (
    <div className="flex items-center justify-between w-full">
      {/* Logo */}
      <Link href="/" className="flex items-center">
        <Image
          src="/assets/images/gpgt-logo-light.png"
          alt="Grand Prix Grand Tours"
          width={200}
          height={60}
          className="h-8 w-auto"
          priority
          quality={100}
          unoptimized
        />
      </Link>

      {/* Mobile Menu */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="right" className="w-[300px] sm:w-[400px]">
          <SheetHeader>
            <SheetTitle>Menu</SheetTitle>
          </SheetHeader>
          <div className="mt-6 flex flex-col gap-4">
            <nav className="flex flex-col gap-2">
              <Link
                href="/contact"
                onClick={() => setOpen(false)}
                className="text-sm font-medium hover:text-primary transition-colors py-2"
              >
                Contact
              </Link>
              <Link
                href="/terms"
                onClick={() => setOpen(false)}
                className="text-sm font-medium hover:text-primary transition-colors py-2"
              >
                Terms
              </Link>
              <Link
                href="/faq"
                onClick={() => setOpen(false)}
                className="text-sm font-medium hover:text-primary transition-colors py-2"
              >
                FAQ
              </Link>
            </nav>
            <Separator />
            <div className="flex flex-col gap-2">
              <Button
                asChild
                variant={isSignupPage ? "default" : "outline"}
                className="w-full"
                onClick={() => setOpen(false)}
              >
                <Link href="/signup">Sign Up</Link>
              </Button>
              <Button
                asChild
                variant={isLoginPage ? "default" : "outline"}
                className="w-full"
                onClick={() => setOpen(false)}
              >
                <Link href="/login">Log In</Link>
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
