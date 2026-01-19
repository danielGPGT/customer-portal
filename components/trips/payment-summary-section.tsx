'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CreditCard } from 'lucide-react'
import { getCurrencySymbol, formatCurrencyWithSymbol } from '@/lib/utils/currency'

interface Payment {
  id: string
  amount: number
  currency: string
  paid: boolean
  deleted_at?: string | null
}

interface PaymentSummarySectionProps {
  totalAmount: number
  discountApplied: number
  currency: string
  preferredCurrency?: string
  discountAppliedConverted?: number
  payments?: Payment[]
}

export function PaymentSummarySection({
  totalAmount,
  discountApplied,
  currency,
  preferredCurrency,
  discountAppliedConverted,
  payments = []
}: PaymentSummarySectionProps) {
  const currencySymbol = getCurrencySymbol(currency)
  const displayCurrency = preferredCurrency || currency
  const subtotal = totalAmount + discountApplied
  
  // Calculate total paid from actual payments (only count paid payments that aren't deleted)
  const totalPaid = payments
    .filter(p => p.paid && !p.deleted_at)
    .reduce((sum, p) => sum + (p.amount || 0), 0)
  
  const discountDisplay = discountAppliedConverted !== undefined ? discountAppliedConverted : discountApplied

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
                -{formatCurrencyWithSymbol(discountDisplay, displayCurrency)}
                {preferredCurrency && preferredCurrency !== currency && (
                  <span className="ml-1 text-muted-foreground">
                    ({formatCurrencyWithSymbol(discountApplied, currency)})
                  </span>
                )}
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

