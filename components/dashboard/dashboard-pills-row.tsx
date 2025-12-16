'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { Calendar, Sparkles, UserPlus, Clock, ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface DashboardPillsRowProps {
  upcomingTripsCount: number
  pointsBalance: number
  friendsReferred: number
  expiringPoints?: number
  expiringDays?: number
}

export function DashboardPillsRow({
  upcomingTripsCount,
  pointsBalance,
  friendsReferred,
  expiringPoints,
  expiringDays,
}: DashboardPillsRowProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(true)

  const pills = [
    {
      id: 'trips',
      label: 'Upcoming Trips',
      value: upcomingTripsCount,
      icon: Calendar,
      href: '/trips?tab=upcoming',
      color: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-900/50',
    },
    {
      id: 'points',
      label: 'Available Points',
      value: pointsBalance.toLocaleString(),
      icon: Sparkles,
      href: '/points',
      color: 'bg-primary/10 text-primary border-primary/20',
    },
    {
      id: 'referrals',
      label: 'Friends Referred',
      value: friendsReferred,
      icon: UserPlus,
      href: '/refer',
      color: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/20 dark:text-purple-400 dark:border-purple-900/50',
    },
    ...(expiringPoints && expiringPoints > 0 && expiringDays && expiringDays <= 30
      ? [
          {
            id: 'expiring',
            label: 'Points Expiring',
            value: `${expiringPoints.toLocaleString()} pts`,
            icon: Clock,
            href: '/points/redeem',
            color: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/50',
          },
        ]
      : []),
  ]

  const checkScroll = () => {
    if (!scrollRef.current) return
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current
    setCanScrollLeft(scrollLeft > 0)
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10)
  }

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return
    const scrollAmount = 220 // Card width + gap
    scrollRef.current.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    })
  }

  useEffect(() => {
    checkScroll()
    if (scrollRef.current) {
      scrollRef.current.addEventListener('scroll', checkScroll)
      const resizeObserver = new ResizeObserver(checkScroll)
      resizeObserver.observe(scrollRef.current)
      return () => {
        scrollRef.current?.removeEventListener('scroll', checkScroll)
        resizeObserver.disconnect()
      }
    }
  }, [pills.length])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between md:hidden">
        <h2 className="text-lg font-semibold">Quick Stats</h2>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => scroll('left')}
            disabled={!canScrollLeft}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => scroll('right')}
            disabled={!canScrollRight}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div
        ref={scrollRef}
        onScroll={checkScroll}
        className="flex gap-3 overflow-x-auto scroll-smooth pb-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] md:grid md:grid-cols-3 md:overflow-visible"
      >
        {pills.map((pill) => {
          const Icon = pill.icon
          return (
            <Link
              key={pill.id}
              href={pill.href}
              className="group min-w-[200px] shrink-0 md:min-w-0"
            >
              <Card className="h-full border-2 p-4 transition-all hover:shadow-md hover:-translate-y-0.5">
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      'flex h-10 w-10 items-center justify-center rounded-xl border',
                      pill.color
                    )}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      {pill.label}
                    </p>
                    <p className="text-lg font-bold text-foreground">{pill.value}</p>
                  </div>
                  <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-1" />
                </div>
              </Card>
            </Link>
          )
        })}
      </div>
    </div>
  )
}

