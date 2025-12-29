"use client"

import * as React from "react"
import { Menu, Settings, LogOut, Search } from "lucide-react"
import { usePathname, useRouter } from "next/navigation"
import { SidebarTrigger, useSidebar } from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { NotificationsPopover } from "@/components/app/notifications-popover"
import { ThemeToggle } from "@/components/app/theme-toggle"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { createClient } from "@/lib/supabase/client"

const pageTitles: Record<string, string> = {
  '/': 'Dashboard',
  '/dashboard': 'Dashboard',
  '/points': 'Points Hub',
  '/points/statement': 'Points Statement',
  '/points/earn': 'How to Earn Points',
  '/points/redeem': 'How to Redeem Points',
  '/trips': 'Trip Management',
  '/trips/upcoming': 'Upcoming Trips',
  '/trips/past': 'Past Trips',
  '/trips/cancelled': 'Cancelled Trips',
  '/refer': 'Referral Center',
  '/refer/terms': 'Referral Terms',
  '/profile': 'Profile & Settings',
  '/profile/edit': 'Edit Profile',
  '/profile/security': 'Security Settings',
  '/profile/preferences': 'Preferences',
  '/profile/password': 'Change Password',
  '/notifications': 'Notifications',
  '/help': 'Help Center',
  '/support': 'Support',
}

export function AppHeader({ clientId }: { clientId: string }) {
  const { toggleSidebar } = useSidebar()
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  const [user, setUser] = React.useState<any>(null)
  const [client, setClient] = React.useState<any>(null)
  const [searchQuery, setSearchQuery] = React.useState("")

  React.useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUser(user)
        const { data: clientData } = await supabase
          .from('clients')
          .select('*')
          .eq('user_id', user.id)
          .single()
        if (clientData) {
          setClient(clientData)
        }
      }
    }
    fetchUser()
  }, [supabase])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const pageTitle = React.useMemo(() => {
    for (const [path, title] of Object.entries(pageTitles)) {
      if (pathname === path || pathname?.startsWith(path + '/')) {
        return title
      }
    }
    return 'Dashboard'
  }, [pathname])

  const userInitials = client?.first_name && client?.last_name
    ? `${client.first_name[0] || ''}${client.last_name[0] || ''}`.toUpperCase()
    : client?.email?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || "U"

  const userName = client?.first_name && client?.last_name
    ? `${client.first_name} ${client.last_name}`
    : client?.email || user?.email || "User"

  return (
    <header className="sticky top-0 z-40 bg-sidebar w-full border-none ">
      <div className="flex h-14 items-center gap-4 px-4 lg:px-6">
        {/* Sidebar Toggle */}
        <div className="flex items-center gap-2">
          <SidebarTrigger className="hidden lg:flex" />
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={toggleSidebar}
          >
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle menu</span>
          </Button>
        </div>

        {/* Page Title & Search */}
        <div className="flex flex-1 items-center gap-4 min-w-0">
          <h1 className="text-lg font-semibold truncate hidden sm:block shrink-0">
            {pageTitle}
          </h1>
          <div className="hidden md:flex flex-1 max-w-lg items-center gap-2 ml-4">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                type="search"
                placeholder="Search trips, points, notifications..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9 w-full bg-background/50 border-sidebar-border focus-visible:bg-background transition-colors"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && searchQuery.trim()) {
                    // Handle search - can be implemented later
                    console.log('Searching for:', searchQuery)
                  }
                }}
              />
            </div>
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2">
          {/* Theme Toggle */}
          <ThemeToggle />

          {/* Separator */}
          <Separator orientation="vertical" className="h-6" />

          {/* Notifications */}
          <NotificationsPopover clientId={clientId} />

          {/* User Menu */}
          {user && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="relative h-9 w-9 rounded-full"
                >
                  <Avatar className="h-8 w-8">
                    <AvatarImage src="" alt={userName} />
                    <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                      {userInitials}
                    </AvatarFallback>
                  </Avatar>
                  <span className="sr-only">User menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
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
                    <Settings className="mr-2 h-4 w-4" />
                    Profile & Settings
                  </a>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleSignOut}
                  className="text-destructive focus:text-destructive cursor-pointer"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    </header>
  )
}

