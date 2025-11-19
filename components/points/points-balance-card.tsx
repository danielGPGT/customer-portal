"use client"

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Coins, ArrowRight } from 'lucide-react'
import Link from 'next/link'

interface PointsBalanceCardProps {
  points: number
  availablePoints?: number
  reservedPoints?: number
  pointValue: number
  currency: string
}

export function PointsBalanceCard({ 
  points,
  availablePoints,
  reservedPoints = 0,
  pointValue,
  currency 
}: PointsBalanceCardProps) {
  const currencySymbol = currency === 'GBP' ? '£' : currency === 'USD' ? '$' : '€'
  const displayPoints = availablePoints !== undefined ? availablePoints : points
  const discountValue = displayPoints * pointValue

  return (
    <Card className="bg-primary text-primary-foreground border-none shadow-lg">
      <CardContent className="">
        <div className="flex items-center gap-2 mb-4">
          <Coins className="h-5 w-5" />
          <span className="text-sm font-medium opacity-90">AVAILABLE POINTS</span>
        </div>
        
        <div className="space-y-3 mb-6">
          <div className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight">
            {displayPoints.toLocaleString()} Points
          </div>
          <div className="text-base sm:text-lg opacity-90">
            Worth {currencySymbol}{discountValue.toLocaleString('en-GB', { 
              minimumFractionDigits: 2, 
              maximumFractionDigits: 2 
            })}
          </div>
          <div className="text-xs sm:text-sm opacity-75">
            in travel discounts
          </div>

          {/* Reserved Points Breakdown */}
          {reservedPoints > 0 && (
            <div className="pt-4 border-t border-white/20 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="opacity-75">Total Balance:</span>
                <span className="font-semibold">{points.toLocaleString()} pts</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="opacity-75">Reserved (pending):</span>
                <span className="font-semibold opacity-90">{reservedPoints.toLocaleString()} pts</span>
              </div>
              <div className="flex items-center justify-between text-sm pt-2 border-t border-white/10">
                <span className="opacity-90 font-medium">Available:</span>
                <span className="font-bold">{displayPoints.toLocaleString()} pts</span>
              </div>
            </div>
          )}
        </div>

        <Button 
          asChild
          variant="outline" 
          className="w-full bg-white/10 hover:bg-white/20 border-white/20 text-white hover:text-white"
        >
          <Link href="/points/statement" className="flex items-center justify-between">
            <span>View Statement</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  )
}

