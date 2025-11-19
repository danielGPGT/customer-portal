"use client"

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { AlertTriangle, ArrowRight, Calendar } from 'lucide-react'
import Link from 'next/link'

interface PointsExpiringAlertProps {
  pointsExpiring: number
  daysRemaining: number
  currency: string
  pointValue: number
}

export function PointsExpiringAlert({
  pointsExpiring,
  daysRemaining,
  currency,
  pointValue
}: PointsExpiringAlertProps) {
  const currencySymbol = currency === 'GBP' ? '£' : currency === 'USD' ? '$' : '€'
  const discountValue = pointsExpiring * pointValue

  if (pointsExpiring === 0 || daysRemaining <= 0) {
    return null
  }

  const getSeverity = () => {
    if (daysRemaining <= 7) return 'destructive'
    if (daysRemaining <= 14) return 'default'
    return 'default'
  }

  const getMessage = () => {
    if (daysRemaining === 1) return 'tomorrow'
    if (daysRemaining <= 7) return `in ${daysRemaining} days`
    if (daysRemaining <= 14) return `in ${daysRemaining} days`
    return `in ${daysRemaining} days`
  }

  return (
    <Alert variant={getSeverity()} className="border-orange-200 bg-orange-50 dark:bg-orange-950/20 dark:border-orange-900">
      <AlertTriangle className="h-5 w-5 text-orange-600 dark:text-orange-400" />
      <AlertTitle className="flex items-center gap-2">
        <Calendar className="h-4 w-4" />
        Points Expiring Soon
      </AlertTitle>
      <AlertDescription className="space-y-3 mt-2">
        <div>
          <p className="font-medium text-foreground">
            You have {pointsExpiring.toLocaleString()} points expiring {getMessage()}!
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            That's {currencySymbol}{discountValue.toLocaleString('en-GB', { 
              minimumFractionDigits: 2, 
              maximumFractionDigits: 2 
            })} worth of discounts. Don't let them go to waste!
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <Button asChild variant={daysRemaining <= 7 ? "default" : "outline"} size="sm">
            <Link href="/points/redeem" className="flex items-center gap-2">
              Redeem Now
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          <Button asChild variant="ghost" size="sm">
            <Link href="/trips">
              Book a Trip
            </Link>
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  )
}

