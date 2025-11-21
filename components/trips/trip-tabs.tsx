'use client'

import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Calendar, History, XCircle } from 'lucide-react'
import { useMemo } from 'react'

type TripTab = 'upcoming' | 'past' | 'cancelled'

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
  const cancelledUrl = useMemo(() => createTabUrl('cancelled'), [pathname, searchParams])

  const tabConfig: { value: TripTab; label: string; icon: typeof Calendar; href: string }[] = [
    { value: 'upcoming', label: 'Upcoming', icon: Calendar, href: upcomingUrl },
    { value: 'past', label: 'Past', icon: History, href: pastUrl },
    { value: 'cancelled', label: 'Cancelled', icon: XCircle, href: cancelledUrl },
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
                {label} · {counts[value]}
              </span>
              <span className="sm:hidden text-xs font-medium">{counts[value]}</span>
            </Link>
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  )
}

