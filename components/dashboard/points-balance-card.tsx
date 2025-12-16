'use client'

import Link from 'next/link'
import { Sparkles, TrendingUp, Gift, ArrowRight } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface PointsBalanceCardProps {
  pointsBalance: number
  lifetimeEarned?: number
  lifetimeSpent?: number
}

export function PointsBalanceCard({
  pointsBalance,
  lifetimeEarned = 0,
  lifetimeSpent = 0,
}: PointsBalanceCardProps) {
  const pointsValue = pointsBalance // Assuming 1 point = £1
  const formattedPoints = pointsBalance.toLocaleString()
  const formattedValue = pointsValue.toLocaleString('en-GB', {
    style: 'currency',
    currency: 'GBP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })

  return (
    <Card className="relative overflow-hidden border-2 bg-gradient-to-br from-primary via-primary/95 to-primary/90 text-primary-foreground shadow-lg">
      {/* Decorative Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute -bottom-8 -left-8 h-40 w-40 rounded-full bg-white/5 blur-3xl" />
        <div className="absolute right-4 top-4 h-16 w-16 rounded-full bg-white/5 blur-xl" />
      </div>

      <CardContent className="relative p-6">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-white/20 backdrop-blur-sm p-2">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-sm font-medium text-primary-foreground/90 uppercase tracking-wide">
                Points Balance
              </h2>
            </div>
          </div>
        </div>

        {/* Main Points Display */}
        <div className="mb-6">
          <div className="flex items-baseline gap-2 mb-2">
            <span className="text-5xl font-bold leading-none">{formattedPoints}</span>
            <span className="text-lg font-medium text-primary-foreground/80">points</span>
          </div>
          <p className="text-sm text-primary-foreground/80 font-medium">
            {formattedValue} in discounts available
          </p>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="rounded-lg bg-white/10 backdrop-blur-sm border border-white/20 p-3">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="h-3.5 w-3.5 text-primary-foreground/80" />
              <span className="text-xs font-medium text-primary-foreground/70 uppercase tracking-wide">
                Lifetime Earned
              </span>
            </div>
            <p className="text-lg font-bold">{lifetimeEarned.toLocaleString()}</p>
          </div>
          <div className="rounded-lg bg-white/10 backdrop-blur-sm border border-white/20 p-3">
            <div className="flex items-center gap-2 mb-1">
              <Gift className="h-3.5 w-3.5 text-primary-foreground/80" />
              <span className="text-xs font-medium text-primary-foreground/70 uppercase tracking-wide">
                Lifetime Spent
              </span>
            </div>
            <p className="text-lg font-bold">{lifetimeSpent.toLocaleString()}</p>
          </div>
        </div>

        {/* Action Button */}
        <Button
          asChild
          variant="secondary"
          className="w-full bg-white/20 hover:bg-white/30 text-primary-foreground border-white/30 backdrop-blur-sm"
        >
          <Link href="/points">
            View Points Statement
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  )
}

