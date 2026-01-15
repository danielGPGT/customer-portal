'use client'

import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Calendar, History, List } from 'lucide-react'
import { useMemo } from 'react'

type TripTab = 'upcoming' | 'past' | 'all'

interface TripTabsProps {
  activeTab: TripTab
  counts: Record<TripTab, number>
}

export function TripTabs({ activeTab, counts }: TripTabsProps) {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const createTabUrl = (tab: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('tab', tab)
    return `${pathname}?${params.toString()}`
  }

  const upcomingUrl = useMemo(() => createTabUrl('upcoming'), [pathname, searchParams])
  const pastUrl = useMemo(() => createTabUrl('past'), [pathname, searchParams])
  const allUrl = useMemo(() => createTabUrl('all'), [pathname, searchParams])

  const tabConfig: { value: TripTab; label: string; icon: typeof Calendar; href: string }[] = [
    { value: 'upcoming', label: 'Upcoming Trip', icon: Calendar, href: upcomingUrl },
    { value: 'past', label: 'Past Trips', icon: History, href: pastUrl },
    { value: 'all', label: 'All Trips', icon: List, href: allUrl },
  ]

  return (
    <Tabs value={activeTab} className="">
      <TabsList className="grid grid-cols-3">
        {tabConfig.map(({ value, label, icon: Icon, href }) => (
          <TabsTrigger
            key={value}
            value={value}
            asChild
            className="transition-all px-6 data-[state=active]:shadow-md data-[state=active]:scale-[1.02]"
          >
            <Link href={href} className="flex items-center justify-center gap-2">
              <Icon className="h-4 w-4" />
              <span className="hidden sm:inline whitespace-nowrap">
                {label} {counts[value] > 0 && `(${counts[value]})`}
              </span>
              <span className="sm:hidden text-xs font-medium">{counts[value]}</span>
            </Link>
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  )
}

