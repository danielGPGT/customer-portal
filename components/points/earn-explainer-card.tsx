"use client"

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { DollarSign, ArrowRight } from 'lucide-react'
import Link from 'next/link'

interface EarnExplainerCardProps {
  pointsPerPound: number
  currency: string
}

export function EarnExplainerCard({ 
  pointsPerPound,
  currency 
}: EarnExplainerCardProps) {
  const currencySymbol = currency === 'GBP' ? '£' : currency === 'USD' ? '$' : '€'
  const pointsPerCurrencyUnit = pointsPerPound * 20 // Points per £20

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5 text-primary" />
          Earn Points
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <p className="text-base font-medium">
            {currencySymbol}20 spent = 1 point
          </p>
          <p className="text-sm text-muted-foreground">
            ({pointsPerPound} points per {currencySymbol}1)
          </p>
        </div>

        <div className="p-4 bg-muted rounded-lg space-y-2">
          <p className="text-sm font-medium">Example:</p>
          <p className="text-sm text-muted-foreground">
            {currencySymbol}4,500 booking = {Math.round(4500 * pointsPerPound).toLocaleString()} points
          </p>
        </div>

        <Button asChild variant="outline" className="w-full">
          <Link href="/points/earn" className="flex items-center justify-between">
            <span>Learn More</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  )
}

