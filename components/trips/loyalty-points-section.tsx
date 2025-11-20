'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Gift, Sparkles, TrendingUp, Calendar, Info, CheckCircle2 } from 'lucide-react'
import { format } from 'date-fns'

interface LoyaltyPointsSectionProps {
  pointsUsed: number
  pointsEarned: number
  discountApplied: number
  currency: string
  pointValue: number
  totalAmount: number
  isCancelled: boolean
  earnTransaction?: any
  spendTransaction?: any
  redemptions?: any[]
  isFirstLoyaltyBooking: boolean
}

export function LoyaltyPointsSection({
  pointsUsed,
  pointsEarned,
  discountApplied,
  currency,
  pointValue,
  totalAmount,
  isCancelled,
  earnTransaction,
  spendTransaction,
  redemptions = [],
  isFirstLoyaltyBooking
}: LoyaltyPointsSectionProps) {
  const currencySymbol = currency === 'GBP' ? '£' : currency === 'USD' ? '$' : '€'
  const netPoints = pointsEarned - pointsUsed

  const formatDate = (date: string | null | undefined) => {
    if (!date) return null
    try {
      return format(new Date(date), 'MMM d, yyyy, h:mm a')
    } catch {
      return date
    }
  }

  // Filter applied redemptions
  const appliedRedemptions = redemptions?.filter(r => r.status === 'applied') || []

  if (isCancelled) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-800 text-base sm:text-lg">
            <Sparkles className="h-4 w-4 sm:h-5 sm:w-5" />
            Points Refund Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 sm:space-y-4">
          <div className="space-y-1.5 sm:space-y-2">
            <p className="text-xs sm:text-sm text-red-700">
              This booking was cancelled. Points have been refunded according to our refund policy.
            </p>
          </div>
          {pointsUsed > 0 && (
            <div className="space-y-1.5 sm:space-y-2 pt-2 border-t border-red-200">
              <div className="text-xs sm:text-sm text-muted-foreground">Points Refunded</div>
              <div className="flex items-center gap-1.5 sm:gap-2 text-green-600 flex-wrap">
                <Gift className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
                <span className="font-medium text-xs sm:text-sm">+{pointsUsed.toLocaleString()} points</span>
                <span className="text-[10px] sm:text-xs text-muted-foreground">
                  ({currencySymbol}{(pointsUsed * pointValue).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} discount refunded)
                </span>
              </div>
              {spendTransaction && (
                <div className="flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs text-muted-foreground mt-1">
                  <Calendar className="h-3 w-3 sm:h-3.5 sm:w-3.5 shrink-0" />
                  <span>Refunded: {formatDate(spendTransaction.created_at)}</span>
                </div>
              )}
            </div>
          )}
          {pointsEarned > 0 && (
            <div className="space-y-1.5 sm:space-y-2 pt-2 border-t border-red-200">
              <div className="text-xs sm:text-sm text-muted-foreground">Points Deducted</div>
              <div className="flex items-center gap-1.5 sm:gap-2 text-red-600 flex-wrap">
                <Sparkles className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
                <span className="font-medium text-xs sm:text-sm">-{pointsEarned.toLocaleString()} points</span>
                <span className="text-[10px] sm:text-xs text-muted-foreground">
                  (Points earned from this booking)
                </span>
              </div>
              {earnTransaction && (
                <div className="flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs text-muted-foreground mt-1">
                  <Calendar className="h-3 w-3 sm:h-3.5 sm:w-3.5 shrink-0" />
                  <span>Earned: {formatDate(earnTransaction.created_at)}</span>
                </div>
              )}
            </div>
          )}
          {netPoints !== 0 && (
            <div className="pt-2 border-t border-red-200">
              <div className="flex items-center justify-between">
                <span className="text-xs sm:text-sm font-medium">Net Change</span>
                <span className={`font-bold text-xs sm:text-sm ${netPoints >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {netPoints >= 0 ? '+' : ''}{netPoints.toLocaleString()} points
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
          <Gift className="h-4 w-4 sm:h-5 sm:w-5" />
          Loyalty Points
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 sm:space-y-4">
        {/* First Loyalty Booking Badge */}
        {isFirstLoyaltyBooking && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 sm:p-4 mb-3 sm:mb-4">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-600 shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm font-semibold text-yellow-800">
                  Your First Loyalty Booking! 🎉
                </p>
                <p className="text-[10px] sm:text-xs text-yellow-700 mt-0.5 sm:mt-1">
                  Special bonus points may apply for your first booking
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Points Earned */}
        {pointsEarned > 0 && (
          <div className="space-y-1.5 sm:space-y-2">
            <div className="flex items-center justify-between">
              <div className="text-xs sm:text-sm text-muted-foreground">Points Earned</div>
              {earnTransaction && (
                <Badge variant="outline" className="text-[10px] sm:text-xs">
                  <CheckCircle2 className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-1" />
                  Confirmed
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2 text-green-600 flex-wrap">
              <Gift className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
              <span className="font-medium text-xs sm:text-sm">+{pointsEarned.toLocaleString()} points</span>
              <span className="text-[10px] sm:text-xs text-muted-foreground">
                (from {currencySymbol}{totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} spend)
              </span>
            </div>
            {earnTransaction && (
              <div className="flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs text-muted-foreground">
                <Calendar className="h-3 w-3 sm:h-3.5 sm:w-3.5 shrink-0" />
                <span>Earned: {formatDate(earnTransaction.created_at)}</span>
                {earnTransaction.balance_after !== undefined && (
                  <span className="ml-1.5">• Balance: {earnTransaction.balance_after.toLocaleString()} points</span>
                )}
              </div>
            )}
          </div>
        )}

        {/* Points Used */}
        {pointsUsed > 0 && (
          <div className={`space-y-1.5 sm:space-y-2 ${pointsEarned > 0 ? 'border-t pt-3 sm:pt-4' : ''}`}>
            <div className="flex items-center justify-between">
              <div className="text-xs sm:text-sm text-muted-foreground">Points Used</div>
              {spendTransaction && (
                <Badge variant="outline" className="text-[10px] sm:text-xs">
                  <CheckCircle2 className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-1" />
                  Applied
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2 text-purple-600 flex-wrap">
              <Sparkles className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
              <span className="font-medium text-xs sm:text-sm">-{pointsUsed.toLocaleString()} points</span>
              <span className="text-[10px] sm:text-xs text-muted-foreground">
                ({currencySymbol}{discountApplied.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} discount applied)
              </span>
            </div>
            {spendTransaction && (
              <div className="flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs text-muted-foreground">
                <Calendar className="h-3 w-3 sm:h-3.5 sm:w-3.5 shrink-0" />
                <span>Used: {formatDate(spendTransaction.created_at)}</span>
                {spendTransaction.balance_after !== undefined && (
                  <span className="ml-1.5">• Balance: {spendTransaction.balance_after.toLocaleString()} points</span>
                )}
              </div>
            )}
            
            {/* Redemption Details */}
            {appliedRedemptions.length > 0 && (
              <div className="mt-2 space-y-1.5 sm:space-y-2 pl-4 sm:pl-6 border-l-2 border-muted">
                {appliedRedemptions.map((redemption, idx) => (
                  <div key={redemption.id || idx} className="text-[10px] sm:text-xs text-muted-foreground">
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      <Info className="h-2.5 w-2.5 sm:h-3 sm:w-3 shrink-0" />
                      <span>
                        {redemption.points_redeemed.toLocaleString()} points → {currencySymbol}{redemption.discount_amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        {redemption.applied_at && (
                          <span className="ml-1.5">• {formatDate(redemption.applied_at)}</span>
                        )}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Net Benefit */}
        {(pointsEarned > 0 || pointsUsed > 0) && (
          <div className="border-t pt-3 sm:pt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <TrendingUp className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground shrink-0" />
                <span className="text-xs sm:text-sm font-medium">Net Benefit</span>
              </div>
              <span className={`font-bold text-xs sm:text-sm ${netPoints >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {netPoints >= 0 ? '+' : ''}{netPoints.toLocaleString()} points
              </span>
            </div>
            <div className="text-[10px] sm:text-xs text-muted-foreground mt-1">
              {netPoints >= 0 ? 'Net gain' : 'Net used'} from this booking
            </div>
          </div>
        )}

        {/* No Points Activity */}
        {pointsEarned === 0 && pointsUsed === 0 && (
          <div className="text-center py-4 sm:py-6 text-muted-foreground">
            <Info className="h-8 w-8 sm:h-10 sm:w-10 mx-auto mb-2 sm:mb-3 opacity-50" />
            <p className="text-xs sm:text-sm">No loyalty points activity for this booking</p>
            {!isCancelled && (
              <p className="text-[10px] sm:text-xs mt-1">Points will be earned when the booking is confirmed</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
