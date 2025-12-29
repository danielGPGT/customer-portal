"use client"

import * as React from "react"
import { Home, Coins, Plane, UserPlus, Settings, FileText, Calendar, TrendingUp, Gift } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"

interface PageResult {
  title: string
  url: string
  icon: React.ComponentType<{ className?: string }>
  description?: string
}

interface SearchDropdownProps {
  query: string
  clientId: string
  onSelect?: () => void
}

const allPages: PageResult[] = [
  { title: 'Dashboard', url: '/', icon: Home, description: 'View your overview' },
  { title: 'Points Hub', url: '/points', icon: Coins, description: 'View your points balance' },
  { title: 'Points Statement', url: '/points/statement', icon: FileText, description: 'View transaction history' },
  { title: 'How to Earn Points', url: '/points/earn', icon: TrendingUp, description: 'Learn how to earn points' },
  { title: 'How to Redeem Points', url: '/points/redeem', icon: Gift, description: 'Learn how to redeem points' },
  { title: 'Trip Management', url: '/trips', icon: Plane, description: 'Manage your trips' },
  { title: 'Upcoming Trips', url: '/trips?tab=upcoming', icon: Calendar, description: 'View upcoming trips' },
  { title: 'Past Trips', url: '/trips?tab=past', icon: Plane, description: 'View past trips' },
  { title: 'Referral Center', url: '/refer', icon: UserPlus, description: 'Refer friends and earn rewards' },
  { title: 'Profile & Settings', url: '/profile', icon: Settings, description: 'Manage your profile' },
]

export function SearchDropdown({ query, onSelect }: SearchDropdownProps) {
  const [results, setResults] = React.useState<PageResult[]>([])

  React.useEffect(() => {
    if (!query.trim() || query.trim().length < 2) {
      setResults([])
      return
    }

    const queryLower = query.toLowerCase()
    const matchingPages = allPages.filter((page) => {
      const titleMatch = page.title.toLowerCase().includes(queryLower)
      const descriptionMatch = page.description?.toLowerCase().includes(queryLower)
      const urlMatch = page.url.toLowerCase().includes(queryLower)
      return titleMatch || descriptionMatch || urlMatch
    }).slice(0, 8) // Limit to 8 results

    setResults(matchingPages)
  }, [query])

  if (!query.trim() || query.trim().length < 2) {
    return null
  }

  return (
    <div className="absolute top-full left-0 right-0 mt-1 bg-popover border rounded-md shadow-lg z-50 max-h-[400px] overflow-y-auto">
      {results.length === 0 ? (
        <div className="p-4 text-center text-sm text-muted-foreground">
          No pages found
        </div>
      ) : (
        <div className="p-1">
          {results.map((result) => {
            const Icon = result.icon
            return (
              <Link
                key={result.url}
                href={result.url}
                onClick={onSelect}
                className="block px-3 py-2 rounded-sm hover:bg-accent transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{result.title}</p>
                    {result.description && (
                      <p className="text-xs text-muted-foreground truncate">
                        {result.description}
                      </p>
                    )}
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
