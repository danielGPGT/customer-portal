"use client"

import * as React from "react"
import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Menu, HelpCircle, FileText, Mail, LogIn, UserPlus, ChevronRight } from "lucide-react"
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface AuthNavItem {
  title: string
  url: string
  icon: React.ComponentType<{ className?: string }>
}

const authNavigationItems: AuthNavItem[] = [
  {
    title: "Contact",
    url: "/contact",
    icon: Mail,
  },
  {
    title: "FAQ",
    url: "/faq",
    icon: HelpCircle,
  },
  {
    title: "Terms & Conditions",
    url: "/terms",
    icon: FileText,
  },
]

export function AuthNavbar() {
  const pathname = usePathname()
  const isLoginPage = pathname === '/login'
  const isSignupPage = pathname === '/signup'
  const [open, setOpen] = React.useState(false)

  const isActive = (url: string) => {
    return pathname === url
  }

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
        <SheetContent side="left" className="w-[280px] p-0 bg-sidebar">
          <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
          
          {/* Sidebar Header */}
          <div className="bg-card border-b border-border h-14 flex items-center justify-between px-4">
            <div className="flex items-center">
              <Image
                src="/assets/images/gpgt-logo-light.png"
                alt="Grand Prix Grand Tours"
                width={200}
                height={60}
                className="h-8 w-auto"
                priority
                quality={90}
                sizes="200px"
              />
            </div>
          </div>

          {/* Navigation Items */}
          <div className="flex flex-col py-4">
            {authNavigationItems.map((item) => {
              const itemActive = isActive(item.url)
              return (
                <Link
                  key={item.title}
                  href={item.url}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors",
                    itemActive
                      ? "bg-accent text-accent-foreground"
                      : "text-foreground hover:bg-accent hover:text-accent-foreground"
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  <span>{item.title}</span>
                </Link>
              )
            })}
          </div>

          {/* Auth Buttons */}
          <div className="px-4 pb-4 mt-auto space-y-2">
            <Button
              asChild
              variant={isSignupPage ? "default" : "outline"}
              className="w-full"
              onClick={() => setOpen(false)}
            >
              <Link href="/signup" className="flex items-center justify-center gap-2">
                <UserPlus className="h-4 w-4" />
                Sign Up
              </Link>
            </Button>
            <Button
              asChild
              variant={isLoginPage ? "default" : "outline"}
              className="w-full"
              onClick={() => setOpen(false)}
            >
              <Link href="/login" className="flex items-center justify-center gap-2">
                <LogIn className="h-4 w-4" />
                Log In
              </Link>
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
