'use client'

import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Calendar, History, XCircle } from 'lucide-react'
import { useMemo } from 'react'

type TripTab = 'upcoming' | 'past' | 'cancelled'

interface TripTabsProps {
  activeTab: TripTab
}

export function TripTabs({ activeTab }: TripTabsProps) {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const createTabUrl = (tab: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('tab', tab)
    return `${pathname}?${params.toString()}`
  }

  const upcomingUrl = useMemo(() => createTabUrl('upcoming'), [pathname, searchParams])
  const pastUrl = useMemo(() => createTabUrl('past'), [pathname, searchParams])
  const cancelledUrl = useMemo(() => createTabUrl('cancelled'), [pathname, searchParams])

  return (
    <Tabs value={activeTab} className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="upcoming" asChild>
          <Link href={upcomingUrl} className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <span className="hidden sm:inline">Upcoming</span>
          </Link>
        </TabsTrigger>
        <TabsTrigger value="past" asChild>
          <Link href={pastUrl} className="flex items-center gap-2">
            <History className="h-4 w-4" />
            <span className="hidden sm:inline">Past</span>
          </Link>
        </TabsTrigger>
        <TabsTrigger value="cancelled" asChild>
          <Link href={cancelledUrl} className="flex items-center gap-2">
            <XCircle className="h-4 w-4" />
            <span className="hidden sm:inline">Cancelled</span>
          </Link>
        </TabsTrigger>
      </TabsList>
    </Tabs>
  )
}

