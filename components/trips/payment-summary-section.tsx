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
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Payment Summary
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Subtotal</span>
            <span className="font-medium">
              {currencySymbol}{subtotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>

          {discountApplied > 0 && (
            <div className="flex items-center justify-between text-green-600">
              <span className="text-sm">Discount</span>
              <span className="font-medium">
                -{currencySymbol}{discountApplied.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          )}

          <div className="border-t pt-3 flex items-center justify-between">
            <span className="font-semibold">Total Paid</span>
            <span className="text-lg font-bold">
              {currencySymbol}{totalPaid.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

