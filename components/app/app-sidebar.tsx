"use client"

import * as React from "react"
import {
  Home,
  Coins,
  Plane,
  UserPlus,
  FileText,
  User,
  ChevronRight,
  Wallet,
  History,
  Gift,
  TrendingUp,
  Calendar,
  MapPin,
  Settings,
  Lock,
  Bell,
  LogOut,
} from "lucide-react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useUser } from "@clerk/nextjs"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
} from "@/components/ui/sidebar"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"

interface NavItem {
  title: string
  url: string
  icon: React.ComponentType<{ className?: string }>
  badge?: string | number
  subItems?: {
    title: string
    url: string
  }[]
}

const navigationItems: NavItem[] = [
  {
    title: "Dashboard",
    url: "/",
    icon: Home,
  },
  {
    title: "Points Hub",
    url: "/points",
    icon: Coins,
    subItems: [
      { title: "Points Overview", url: "/points" },
      { title: "How to Earn", url: "/points/earn" },
      { title: "How to Redeem", url: "/points/redeem" },
    ],
  },
  {
    title: "Trip Management",
    url: "/trips",
    icon: Plane,
    subItems: [
      { title: "All Trips", url: "/trips" },
      { title: "Upcoming", url: "/trips/upcoming" },
      { title: "Past", url: "/trips/past" },
    ],
  },
  {
    title: "Referral Center",
    url: "/refer",
    icon: UserPlus,
  },
  {
    title: "Profile & Settings",
    url: "/profile",
    icon: User,
    subItems: [
      { title: "Profile Overview", url: "/profile" },
      { title: "Edit Profile", url: "/profile/edit" },
      { title: "Security", url: "/profile/security" },
      { title: "Preferences", url: "/profile/preferences" },
    ],
  },
]

export function AppSidebar({ user, client }: { user: any; client: any }) {
  const { user: clerkUser } = useUser()
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  // SignOutButton component handles signout now

  const userInitials = client?.first_name && client?.last_name
    ? `${client.first_name[0] || ''}${client.last_name[0] || ''}`.toUpperCase()
    : client?.email?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || "U"

  const userName = client?.first_name && client?.last_name
    ? `${client.first_name} ${client.last_name}`
    : client?.email || user?.email || "User"

  // Get Clerk avatar URL if available
  const avatarUrl = clerkUser?.imageUrl || null

  const isActive = (url: string) => {
    if (url === "/") {
      return pathname === "/" || pathname === "/dashboard"
    }
    return pathname === url || pathname?.startsWith(url + "/")
  }

  return (
    <Sidebar collapsible="icon" className="border-none">
      <SidebarHeader className="border-sidebar-border px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Coins className="h-5 w-5" />
          </div>
          <div className="flex flex-col gap-0.5 group-data-[collapsible=icon]:hidden">
            <span className="text-sm font-semibold text-sidebar-foreground">
              Loyalty Portal
            </span>
            <span className="text-xs text-sidebar-foreground/70">
              Customer Portal
            </span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-medium text-sidebar-foreground/70">
            Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationItems.map((item) => (
                <NavigationItem 
                  key={item.title} 
                  item={item} 
                  isActive={isActive(item.url)} 
                  pathname={pathname}
                />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="mt-auto">
          <SidebarGroupLabel className="text-xs font-medium text-sidebar-foreground/70">
            Quick Access
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === "/notifications"}
                  tooltip="Notifications"
                >
                  <Link href="/notifications" prefetch={true}>
                    <Bell className="h-4 w-4" />
                    <span>Notifications</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 h-auto py-2 px-2 hover:bg-sidebar-accent data-[collapsible=icon]:justify-center"
            >
              <Avatar className="h-8 w-8 shrink-0">
                {avatarUrl && (
                  <AvatarImage src={avatarUrl} alt={userName} />
                )}
                <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                  {userInitials}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col items-start gap-0.5 flex-1 min-w-0 group-data-[collapsible=icon]:hidden">
                <span className="text-sm font-medium text-sidebar-foreground truncate w-full">
                  {userName}
                </span>
                <span className="text-xs text-sidebar-foreground/70 truncate w-full">
                  {client?.email || user?.email}
                </span>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-56"
            side="right"
            sideOffset={8}
          >
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/profile" prefetch={true}>
                <User className="mr-2 h-4 w-4" />
                Profile
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/profile/preferences" prefetch={true}>
                <Settings className="mr-2 h-4 w-4" />
                Preferences
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <SignOutButton className="text-destructive focus:text-destructive cursor-pointer w-full text-left flex items-center gap-2">
                <LogOut className="mr-2 h-4 w-4" />
                Log out
              </SignOutButton>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}

// Separate component to use hooks properly
function NavigationItem({ 
  item, 
  isActive, 
  pathname 
}: { 
  item: NavItem
  isActive: boolean
  pathname: string
}) {
  const hasSubItems = item.subItems && item.subItems.length > 0
  const [open, setOpen] = React.useState(isActive)

  // Auto-expand if active
  React.useEffect(() => {
    if (isActive) {
      setOpen(true)
    }
  }, [isActive])

  if (hasSubItems) {
    return (
      <Collapsible
        defaultOpen={isActive}
        open={open}
        onOpenChange={setOpen}
      >
        <SidebarMenuItem>
          <CollapsibleTrigger asChild>
            <SidebarMenuButton
              tooltip={item.title}
              isActive={isActive}
            >
              <item.icon className="h-4 w-4" />
              <span>{item.title}</span>
              <ChevronRight
                className={cn(
                  "ml-auto h-4 w-4 transition-transform duration-200",
                  open && "rotate-90"
                )}
              />
            </SidebarMenuButton>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <SidebarMenuSub>
              {item.subItems?.map((subItem) => (
                <SidebarMenuSubItem key={subItem.title}>
                  <SidebarMenuSubButton
                    asChild
                    isActive={pathname === subItem.url}
                  >
                    <Link href={subItem.url} prefetch={true}>
                      <span>{subItem.title}</span>
                    </Link>
                  </SidebarMenuSubButton>
                </SidebarMenuSubItem>
              ))}
            </SidebarMenuSub>
          </CollapsibleContent>
        </SidebarMenuItem>
      </Collapsible>
    )
  }

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        asChild
        isActive={isActive}
        tooltip={item.title}
      >
        <Link href={item.url} prefetch={true}>
          <item.icon className="h-4 w-4" />
          <span>{item.title}</span>
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  )
}
