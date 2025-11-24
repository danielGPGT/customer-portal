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
  Shield,
  CreditCard,
  ChevronRight,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Sheet, SheetContent } from "@/components/ui/sheet"
import Image from "next/image"
import { useTheme } from "next-themes"
import { ThemeToggle } from "@/components/app/theme-toggle"

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
    title: "Admin",
    url: "/admin",
    icon: Shield,
  },
]

interface MobileSidebarProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function MobileSidebar({ open, onOpenChange }: MobileSidebarProps) {
  const pathname = usePathname()
  const [expandedItems, setExpandedItems] = React.useState<string[]>([])
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

  const isActive = (url: string) => {
    if (url === "/") {
      return pathname === "/" || pathname === "/dashboard"
    }
    return pathname === url || pathname?.startsWith(url + "/")
  }

  const toggleExpanded = (title: string) => {
    setExpandedItems((prev) =>
      prev.includes(title)
        ? prev.filter((item) => item !== title)
        : [...prev, title]
    )
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="w-[280px] p-0 bg-sidebar">
        {/* Sidebar Header */}
        <div className="bg-card border-b border-border h-14 flex items-center justify-between px-4">
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
          {/* Theme Toggle - visible on tablet and below, hidden on desktop */}
          <div className="flex lg:hidden">
            <ThemeToggle />
          </div>
        </div>

        {/* Navigation Items */}
        <div className="flex flex-col py-4">
          {navigationItems.map((item) => {
            const hasSubItems = item.subItems && item.subItems.length > 0
            const itemActive = isActive(item.url)
            const isExpanded = expandedItems.includes(item.title)

            if (hasSubItems) {
              return (
                <div key={item.title}>
                  <button
                    onClick={() => toggleExpanded(item.title)}
                    className={cn(
                      "w-full flex items-center justify-between px-4 py-3 text-sm font-medium transition-colors",
                      itemActive
                        ? "bg-accent text-accent-foreground"
                        : "text-foreground hover:bg-accent hover:text-accent-foreground"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </div>
                    <ChevronRight
                      className={cn(
                        "h-4 w-4 transition-transform duration-200 ease-in-out",
                        isExpanded && "rotate-90"
                      )}
                    />
                  </button>
                  <div
                    className={cn(
                      "overflow-hidden transition-all duration-300 ease-in-out",
                      isExpanded ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
                    )}
                  >
                    <div className="bg-muted">
                      {item.subItems?.map((subItem) => (
                        <Link
                          key={subItem.url}
                          href={subItem.url}
                          onClick={() => onOpenChange(false)}
                          className={cn(
                            "block px-4 py-2.5 pl-12 text-sm transition-colors",
                            pathname === subItem.url
                              ? "bg-accent text-accent-foreground font-medium"
                              : "text-foreground hover:bg-accent hover:text-accent-foreground"
                          )}
                        >
                          {subItem.title}
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              )
            }

            return (
              <Link
                key={item.title}
                href={item.url}
                onClick={() => onOpenChange(false)}
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

        {/* Apply Now Button */}
        <div className="px-4 pb-4 mt-auto">
          <Button
            className="w-full bg-primary hover:bg-primary-700 text-primary-foreground"
            asChild
          >
            <Link href="/apply" onClick={() => onOpenChange(false)}>
              Apply Now
            </Link>
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}

