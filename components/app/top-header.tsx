"use client"

import * as React from "react"
import { Search, Type, BarChart3, Bell, User, Menu, X, Coins } from "lucide-react"
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
import { NotificationsPopover } from "@/components/app/notifications-popover"
import { ThemeToggle } from "@/components/app/theme-toggle"
import Image from "next/image"
import { useTheme } from "next-themes"
import Link from "next/link"

interface TopHeaderProps {
  onMenuClick?: () => void
  isSidebarOpen?: boolean
  clientId: string
  user?: any
  client?: any
}

export function TopHeader({ 
  onMenuClick, 
  isSidebarOpen = false,
  clientId,
  user,
  client 
}: TopHeaderProps) {
  const [searchQuery, setSearchQuery] = React.useState("")
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

  const userInitials = client?.first_name && client?.last_name
    ? `${client.first_name[0] || ''}${client.last_name[0] || ''}`.toUpperCase()
    : client?.email?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || "U"

  const userName = client?.first_name && client?.last_name
    ? `${client.first_name} ${client.last_name}`
    : client?.email || user?.email || "User"

  return (
    <header className="bg-card text-foreground border-b border-border h-16 flex items-center px-4 lg:px-6 z-50 fixed top-0 left-0 right-0">
      <div className="container mx-auto flex items-center">
      {/* Left: Menu + Logo */}
      <div className="flex items-center gap-3">
        {/* Hamburger Menu (Mobile/Tablet) */}
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden text-foreground hover:bg-accent h-9 w-9"
          onClick={onMenuClick}
        >
          {isSidebarOpen ? (
            <X className="h-5 w-5" />
          ) : (
            <Menu className="h-5 w-5" />
          )}
          <span className="sr-only">Toggle menu</span>
        </Button>

        {/* Logo */}
        <div className="flex items-center">
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
        </div>
      </div>

      {/* Center: Search */}
      <div className="flex-1 max-w-md mx-4 hidden md:flex">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            type="search"
            placeholder="Type to search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9 w-full bg-background dark:bg-base-950 border-border text-foreground dark:text-primary-foreground placeholder:text-muted-foreground"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && searchQuery.trim()) {
                // Handle search
                console.log('Searching for:', searchQuery)
              }
            }}
          />
        </div>
      </div>

      {/* Right: Icons */}
      <div className="flex items-center gap-2 ml-auto">
        {/* Text Size / Accessibility */}
        <Button
          variant="ghost"
          size="icon"
          className="text-foreground dark:text-primary-foreground hover:bg-accent h-9 w-9 hidden lg:flex"
        >
          <Type className="h-4 w-4" />
          <span className="sr-only">Text size</span>
        </Button>

        {/* Analytics / Graph */}
        <Button
          variant="ghost"
          size="icon"
          className="text-foreground dark:text-primary-foreground hover:bg-accent h-9 w-9 hidden lg:flex"
        >
          <BarChart3 className="h-4 w-4" />
          <span className="sr-only">Analytics</span>
        </Button>

        {/* Theme Toggle - Desktop only */}
        <div className="hidden lg:flex">
          <ThemeToggle />
        </div>

        {/* Notifications */}
        <NotificationsPopover clientId={clientId} />

        

        {/* User Profile */}
        {user && (
          <DropdownMenu modal={false}>
            <div className="relative">
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="relative h-9 w-9 rounded-full text-foreground dark:text-primary-foreground hover:bg-accent p-0"
                >
                  <Avatar className="h-8 w-8 border border-border">
                    <AvatarImage src="" alt={userName} />
                    <AvatarFallback className="bg-muted text-foreground dark:text-primary-foreground text-xs">
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
              <DropdownMenuItem
                onClick={async () => {
                  const { createClient } = await import('@/lib/supabase/client')
                  const supabase = createClient()
                  await supabase.auth.signOut()
                  window.location.href = '/login'
                }}
                className="text-destructive focus:text-destructive cursor-pointer"
              >
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
            </div>
          </DropdownMenu>
        )}
        {/* Points Wallet */}
        {client && (
          <Link href="/points" className="flex items-center">
            {/* Mobile: Compact version */}
            <Button
              variant="outline"
              className="md:hidden items-center gap-1.5 h-9 px-2.5 border-border hover:bg-accent text-foreground"
            >
              <Coins className="h-4 w-4 text-primary" />
              <span className="font-semibold text-sm">
                {client.points_balance?.toLocaleString() || 0}
              </span>
            </Button>
            {/* Desktop: Full version */}
            <Button
              variant="outline"
              className="hidden md:flex items-center gap-2 h-9 px-3 border-border hover:bg-accent text-foreground"
            >
              <Coins className="h-4 w-4 text-primary" />
              <span className="font-semibold text-sm">
                {client.points_balance?.toLocaleString() || 0}
              </span>
              <span className="text-xs text-muted-foreground hidden lg:inline">
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

