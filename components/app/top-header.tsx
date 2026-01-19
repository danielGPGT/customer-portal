"use client"

import * as React from "react"
import dynamic from 'next/dynamic'
import { Search, Menu, X, Coins, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { SignOutButton } from "@/components/auth/signout-button"
import { CurrencySelector } from "@/components/app/currency-selector"
import Image from "next/image"
import { useTheme } from "next-themes"
import Link from "next/link"
import { getClientPreferredCurrency, type CurrencyCode } from "@/lib/utils/currency"
import { useCurrency } from "@/components/providers/currency-provider"

// Dynamically import components that are only shown on user interaction
const NotificationsPopover = dynamic(() => 
  import('@/components/app/notifications-popover').then(mod => ({ default: mod.NotificationsPopover })),
  { ssr: false } // Client-side only
)

const SearchDropdown = dynamic(() => 
  import('@/components/app/search-dropdown').then(mod => ({ default: mod.SearchDropdown })),
  { ssr: false } // Only shown when search is focused
)

interface TopHeaderProps {
  onMenuClick?: () => void
  isSidebarOpen?: boolean
  clientId: string
  user?: any
  client?: any
  baseCurrency?: string
}

export function TopHeader({ 
  onMenuClick, 
  isSidebarOpen = false,
  clientId,
  user,
  client,
  baseCurrency = 'GBP'
}: TopHeaderProps) {
  // Get currency from context (enterprise-level state management)
  let preferredCurrency: CurrencyCode
  try {
    const { currency } = useCurrency()
    preferredCurrency = currency
  } catch {
    // Fallback if context not available (shouldn't happen, but safe fallback)
    preferredCurrency = client 
      ? getClientPreferredCurrency(client, baseCurrency)
      : (baseCurrency as CurrencyCode)
  }

  const [searchQuery, setSearchQuery] = React.useState("")
  const [searchFocused, setSearchFocused] = React.useState(false)
  const { resolvedTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  // Avoid hydration mismatch
  React.useEffect(() => {
    setMounted(true)
  }, [])

  // Determine which logo to use based on theme
  const logoSrc = mounted && resolvedTheme === 'dark' 
    ? "/assets/images/gpgt-logo-light.png" 
    : "/assets/images/gpgt-logo.png"

  const userInitials = client?.first_name && client?.last_name
    ? `${client.first_name[0] || ''}${client.last_name[0] || ''}`.toUpperCase()
    : client?.email?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || "U"

  const userName = client?.first_name && client?.last_name
    ? `${client.first_name} ${client.last_name}`
    : client?.email || user?.email || "User"

  // Get avatar URL from user prop (Clerk user object has imageUrl property)
  const avatarUrl = user?.imageUrl || null

  return (
    <header className="bg-secondary-1000 text-foreground border-b border-border h-16 flex items-center px-4 lg:px-6 z-50 fixed top-0 left-0 right-0">
      <div className="container mx-auto flex items-center">
      {/* Left: Menu + Logo */}
      <div className="flex items-center gap-3">
        {/* Hamburger Menu (Mobile/Tablet) */}
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden text-background hover:bg-accent h-9 w-9"
          onClick={onMenuClick}
        >
          {isSidebarOpen ? (
            <X className="h-7 w-7" />
          ) : (
            <Menu className="h-7 w-7" />
          )}
          <span className="sr-only">Toggle menu</span>
        </Button>

        {/* Logo */}
        <Link href="/" className="flex items-center">
          {/* Mobile: Small SVG logo */}
          <Image
            src="/assets/images/gpgt-small.svg"
            alt="Grand Prix Grand Tours"
            width={80}
            height={17}
            className="h-5 w-[80px] md:hidden object-contain"
            priority
            sizes="80px"
          />
          {/* Desktop: Full logo */}
          <Image
            src={logoSrc}
            alt="Grand Prix Grand Tours"
            width={200}
            height={60}
            className="h-8 w-auto hidden md:block"
            priority
            quality={90}
            sizes="200px"
          />
        </Link>
      </div>

      {/* Center: Search */}
      <div className="flex-1 max-w-md mx-4 hidden md:flex">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white pointer-events-none z-10" />
          <Input
            type="search"
            placeholder="Search pages..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setSearchFocused(true)}
            onBlur={(e) => {
              // Delay to allow link clicks
              setTimeout(() => setSearchFocused(false), 200)
            }}
            className="pl-9 h-9 w-full bg-secondary-1000 border-border text-white placeholder:text-white"
          />
          {searchFocused && searchQuery.trim() && (
            <SearchDropdown 
              query={searchQuery} 
              clientId={clientId}
              onSelect={() => {
                setSearchFocused(false)
                setSearchQuery("")
              }}
            />
          )}
        </div>
      </div>

      {/* Right: Icons */}
      <div className="flex items-center gap-1 sm:gap-2 ml-auto">
        {/* Currency Selector */}
        {client && (
          <CurrencySelector
            currentCurrency={preferredCurrency}
            clientId={clientId}
            baseCurrency={baseCurrency}
          />
        )}

        {/* Notifications */}
        <NotificationsPopover clientId={clientId} />

        {/* User Profile */}
        {user && (
          mounted ? (
            <DropdownMenu modal={false}>
              <div className="relative">
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="relative h-9 w-9 rounded-full p-0"
                  >
                    <Avatar className="h-8 w-8">
                      {avatarUrl && (
                        <AvatarImage src={avatarUrl} alt={userName} />
                      )}
                      <AvatarFallback className="text-foreground text-xs">
                        {userInitials}
                      </AvatarFallback>
                    </Avatar>
                    <span className="sr-only">User menu</span>
                  </Button>
                </DropdownMenuTrigger>
                {/* Invisible bridge to cover the gap */}
                <div 
                  className="absolute top-full right-0 w-full h-2 -mb-2 z-50 pointer-events-none"
                />
                <DropdownMenuContent align="end" className="w-56" sideOffset={1}>
                  <DropdownMenuLabel>
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{userName}</p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {client?.email || user?.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <a href="/profile" className="cursor-pointer">
                      <User className="mr-2 h-4 w-4" />
                      Profile
                    </a>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <SignOutButton className="text-destructive focus:text-destructive cursor-pointer w-full text-left">
                      Log out
                    </SignOutButton>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </div>
            </DropdownMenu>
          ) : (
            <Button
              variant="default"
              className="relative h-9 w-9 rounded-full p-0"
              disabled
            >
              <Avatar className="h-8 w-8">
                {avatarUrl && (
                  <AvatarImage src={avatarUrl} alt={userName} />
                )}
                <AvatarFallback className="text-foreground text-xs">
                  {userInitials}
                </AvatarFallback>
              </Avatar>
              <span className="sr-only">User menu</span>
            </Button>
          )
        )}
        {/* Points Wallet */}
        {client && (
          <Link href="/points" className="flex items-center">
            {/* Mobile: Compact version */}
            <Button
              variant="default"
              className="md:hidden items-center gap-1.5 h-9 px-2.5 "
            >
              <Coins className="h-4 w-4 text-background" />
              <span className="font-semibold text-sm">
                {client.points_balance?.toLocaleString() || 0}
              </span>
            </Button>
            {/* Desktop: Full version */}
            <Button
              variant="default"
              className="hidden md:flex items-center gap-2 h-9 px-3"
            >
              <Coins className="h-4 w-4 text-background" />
              <span className="font-semibold text-sm">
                {client.points_balance?.toLocaleString() || 0}
              </span>
              <span className="text-xs hidden lg:inline">
                points
              </span>
            </Button>
          </Link>
        )}
      </div>
      </div>
    </header>
  )
}

