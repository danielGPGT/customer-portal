"use client"

import * as React from "react"
import Image from "next/image"
import Link from "next/link"
import { useTheme } from "next-themes"
import { ThemeToggle } from "@/components/app/theme-toggle"

export function AuthNavbar() {
  const { resolvedTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  // Avoid hydration mismatch
  React.useEffect(() => {
    setMounted(true)
  }, [])

  // Determine which logo to use based on theme
  const logoSrc = mounted && resolvedTheme === 'dark' 
    ? "/assets/images/gpgt-logo.png" 
    : "/assets/images/gpgt-logo-light.png"

  return (
    <div className="flex items-center justify-between w-full">
      {/* Logo */}
      <Link href="/" className="flex items-center">
        {mounted ? (
          <Image
            src={logoSrc}
            alt="Grand Prix Grand Tours"
            width={200}
            height={60}
            className="h-8 w-auto"
            priority
            quality={100}
            unoptimized
          />
        ) : (
          <div className="h-8 w-32 bg-muted animate-pulse rounded" />
        )}
      </Link>

      {/* Theme Toggle - Mobile only (desktop nav is on right side) */}
      <div className="lg:hidden">
        <ThemeToggle />
      </div>
    </div>
  )
}
