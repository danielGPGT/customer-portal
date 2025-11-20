'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CreditCard } from 'lucide-react'

interface PaymentSummarySectionProps {
  totalAmount: number
  discountApplied: number
  currency: string
}

export function PaymentSummarySection({
  totalAmount,
  discountApplied,
  currency
}: PaymentSummarySectionProps) {
  const currencySymbol = currency === 'GBP' ? '£' : currency === 'USD' ? '$' : '€'
  const subtotal = totalAmount + discountApplied
  const totalPaid = totalAmount

  return (
    <Card>
      <CardHeader >
        <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
          <CreditCard className="h-4 w-4 sm:h-5 sm:w-5" />
          Payment Summary
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 sm:space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs sm:text-sm text-muted-foreground">Subtotal</span>
            <span className="font-medium text-xs sm:text-sm">
              {currencySymbol}{subtotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>

          {discountApplied > 0 && (
            <div className="flex items-center justify-between text-green-600">
              <span className="text-xs sm:text-sm">Discount</span>
              <span className="font-medium text-xs sm:text-sm">
                -{currencySymbol}{discountApplied.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          )}

          <div className="border-t pt-2 sm:pt-3 flex items-center justify-between">
            <span className="font-semibold text-xs sm:text-sm">Total Paid</span>
            <span className="text-base sm:text-lg font-bold">
              {currencySymbol}{totalPaid.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

