"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Home,
  Coins,
  Plane,
  UserPlus,
  Settings,
  CreditCard,
  ChevronDown,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

interface NavItem {
  title: string
  url: string
  icon: React.ComponentType<{ className?: string }>
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
      { title: "Statement", url: "/points/statement" },
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
    title: "Referrals",
    url: "/refer",
    icon: UserPlus,
    subItems: [
      { title: "Refer Hub", url: "/refer" },
      { title: "My Referrals", url: "/refer/my-referrals" },
    ],
  },
  {
    title: "Settings",
    url: "/profile",
    icon: Settings,
  },
  {
    title: "Billing & Invoice",
    url: "/billing",
    icon: CreditCard,
  },
]

export function NavBar() {
  const pathname = usePathname()
  const [openDropdown, setOpenDropdown] = React.useState<string | null>(null)

  // Prevent body scroll lock when dropdown is open
  React.useEffect(() => {
    if (openDropdown) {
      // Remove any overflow hidden that Radix might add
      const originalOverflow = document.body.style.overflow
      document.body.style.overflow = ''
      return () => {
        document.body.style.overflow = originalOverflow
      }
    }
  }, [openDropdown])

  const isActive = (url: string) => {
    if (url === "/") {
      return pathname === "/" || pathname === "/dashboard"
    }
    return pathname === url || pathname?.startsWith(url + "/")
  }

  return (
    <nav className="bg-card border-b border-border w-full py-2 flex items-center px-4 lg:px-6 z-40 fixed top-16 left-0 right-0">
      <div className="container mx-auto flex items-center">
      <div className="flex items-center gap-1 flex-1 min-w-0">
        {navigationItems.map((item) => {
          const hasSubItems = item.subItems && item.subItems.length > 0
          const itemActive = isActive(item.url)
          const isOpen = openDropdown === item.title

          if (hasSubItems) {
            return (
              <DropdownMenu 
                key={item.title}
                open={isOpen}
                onOpenChange={(open) => setOpenDropdown(open ? item.title : null)}
                modal={false}
              >
                <div
                  className="relative"
                  onMouseEnter={() => setOpenDropdown(item.title)}
                  onMouseLeave={() => setOpenDropdown(null)}
                >
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      className={cn(
                        "h-9 px-3 text-sm font-medium rounded-md transition-colors",
                        itemActive
                          ? "bg-accent text-accent-foreground"
                          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                      )}
                    >
                      <item.icon className={cn(
                        "h-4 w-4 mr-2",
                        itemActive ? "text-accent-foreground" : "text-muted-foreground"
                      )} />
                      <span className="hidden sm:inline">{item.title}</span>
                      <ChevronDown className={cn(
                        "h-3 w-3 ml-1 transition-transform duration-200",
                        isOpen && "rotate-180",
                        itemActive ? "text-accent-foreground" : "text-muted-foreground"
                      )} />
                    </Button>
                  </DropdownMenuTrigger>
                  {/* Invisible bridge to cover the gap */}
                  {isOpen && (
                    <div 
                      className="absolute top-full left-0 right-0 h-2 -mb-2 z-50"
                      onMouseEnter={() => setOpenDropdown(item.title)}
                    />
                  )}
                  <DropdownMenuContent 
                    align="start" 
                    className="w-56"
                    sideOffset={1}
                    onMouseEnter={() => setOpenDropdown(item.title)}
                    onMouseLeave={() => setOpenDropdown(null)}
                    onInteractOutside={(e) => {
                      // Don't close on outside click when using hover
                      e.preventDefault()
                    }}
                  >
                    {item.subItems?.map((subItem) => (
                      <DropdownMenuItem key={subItem.url} asChild>
                        <Link
                          href={subItem.url}
                          className={cn(
                            "cursor-pointer",
                            pathname === subItem.url && "bg-accent text-accent-foreground"
                          )}
                        >
                          {subItem.title}
                        </Link>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </div>
              </DropdownMenu>
            )
          }

          return (
            <Button
              key={item.title}
              variant="ghost"
              asChild
              className={cn(
                "h-9 px-3 text-sm font-medium rounded-md transition-colors",
                itemActive
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <Link href={item.url}>
                <item.icon className={cn(
                  "h-4 w-4 mr-2",
                  itemActive ? "text-accent-foreground" : "text-muted-foreground"
                )} />
                <span className="hidden sm:inline">{item.title}</span>
              </Link>
            </Button>
          )
        })}
      </div>

      {/* Apply Now Button */}
      <Button
        className="bg-primary hover:bg-primary-700 text-primary-foreground h-9 px-4 ml-4 hidden md:flex"
        asChild
      >
        <Link href="/refer">Refer a friend</Link>
      </Button>
      </div>
    </nav>
  )
}

