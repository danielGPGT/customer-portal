"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { ThemeToggle } from "@/components/app/theme-toggle"

export function AuthRightNav() {
  const pathname = usePathname()
  const isLoginPage = pathname === '/login'
  const isSignupPage = pathname === '/signup'

  return (
    <nav className="flex items-center gap-4 xl:gap-6 text-white">
      <a 
        href="/contact" 
        className="text-sm font-medium uppercase hover:opacity-80 transition-opacity"
      >
        Contact
      </a>
      <a 
        href="/terms" 
        className="text-sm font-medium uppercase hover:opacity-80 transition-opacity"
      >
        Terms
      </a>
      <a 
        href="/faq" 
        className="text-sm font-medium uppercase hover:opacity-80 transition-opacity"
      >
        FAQ
      </a>
      <Link 
        href="/signup" 
        className={`text-sm font-medium uppercase px-4 py-2 rounded transition-colors ${
          isSignupPage 
            ? "bg-primary text-primary-foreground hover:bg-primary/90" 
            : "hover:opacity-80"
        }`}
      >
        Sign Up
      </Link>
      <Link 
        href="/login" 
        className={`text-sm font-medium uppercase px-4 py-2 rounded transition-colors ${
          isLoginPage 
            ? "bg-primary text-primary-foreground hover:bg-primary/90" 
            : "hover:opacity-80"
        }`}
      >
        Log In
      </Link>
      <div className="hidden xl:flex items-center ml-2">
        <ThemeToggle />
      </div>
    </nav>
  )
}
