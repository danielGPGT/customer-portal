'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CreditCard, Calendar, CheckCircle2, Clock } from 'lucide-react'
import { format } from 'date-fns'

interface Payment {
  id: string
  payment_type: string
  payment_number: number
  amount: number
  currency: string
  due_date?: string | null
  paid: boolean
  paid_at?: string | null
  payment_reference?: string | null
  payment_method?: string | null
  notes?: string | null
  deleted_at?: string | null
}

interface PaymentScheduleSectionProps {
  payments: Payment[]
  currency: string
}

export function PaymentScheduleSection({ payments, currency }: PaymentScheduleSectionProps) {
  if (!payments || payments.length === 0) {
    return null
  }

  // Filter out deleted payments
  const activePayments = payments.filter(p => !p.deleted_at)

  if (activePayments.length === 0) {
    return null
  }

  // Sort by payment number
  const sortedPayments = [...activePayments].sort((a, b) => a.payment_number - b.payment_number)

  const currencySymbol = currency === 'GBP' ? '£' : currency === 'USD' ? '$' : '€'
  const totalAmount = sortedPayments.reduce((sum, p) => sum + (p.amount || 0), 0)
  const totalPaid = sortedPayments.filter(p => p.paid).reduce((sum, p) => sum + (p.amount || 0), 0)
  const totalOutstanding = totalAmount - totalPaid

  const formatDate = (date: string | null | undefined) => {
    if (!date) return 'TBD'
    try {
      return format(new Date(date), 'MMM d, yyyy')
    } catch {
      return date
    }
  }

  const formatDateTime = (date: string | null | undefined) => {
    if (!date) return null
    try {
      return format(new Date(date), 'MMM d, yyyy, h:mm a')
    } catch {
      return date
    }
  }

  const getPaymentTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      deposit: 'Deposit',
      second_payment: 'Second Payment',
      third_payment: 'Third Payment',
      final_payment: 'Final Payment',
      additional: 'Additional Payment',
      refund: 'Refund'
    }
    return labels[type] || type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
  }

  return (
    <Card>
      <CardHeader >
        <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
          <CreditCard className="h-4 w-4 sm:h-5 sm:w-5" />
          Payment Schedule
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 sm:space-y-4">
          {sortedPayments.map((payment) => (
            <div key={payment.id} className="border rounded-lg p-3 sm:p-4 space-y-2">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 sm:gap-2 mb-1 flex-wrap">
                    <h4 className="font-semibold text-sm sm:text-base">{getPaymentTypeLabel(payment.payment_type)}</h4>
                    <Badge variant={payment.paid ? 'default' : 'secondary'} className="text-[10px] sm:text-xs">
                      {payment.paid ? (
                        <>
                          <CheckCircle2 className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-1" />
                          Paid
                        </>
                      ) : (
                        <>
                          <Clock className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-1" />
                          Pending
                        </>
                      )}
                    </Badge>
                  </div>

                  <div className="text-lg sm:text-xl lg:text-2xl font-bold">
                    {currencySymbol}{payment.amount.toLocaleString(undefined, { 
                      minimumFractionDigits: 2, 
                      maximumFractionDigits: 2 
                    })}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs sm:text-sm text-muted-foreground">
                {payment.due_date && (
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
                    <span>
                      Due: {formatDate(payment.due_date)}
                    </span>
                  </div>
                )}

                {payment.paid && payment.paid_at && (
                  <div className="flex items-center gap-1.5 sm:gap-2 text-green-600">
                    <CheckCircle2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
                    <span>Paid: {formatDateTime(payment.paid_at)}</span>
                  </div>
                )}

                {payment.payment_reference && (
                  <div className="md:col-span-2">
                    <span className="font-medium">Reference:</span> <span className="font-mono text-[10px] sm:text-xs">{payment.payment_reference}</span>
                  </div>
                )}

                {payment.payment_method && (
                  <div>
                    <span className="font-medium">Method:</span> {payment.payment_method}
                  </div>
                )}

                {payment.notes && (
                  <div className="md:col-span-2 text-[10px] sm:text-xs">
                    <span className="font-medium">Notes:</span> {payment.notes}
                  </div>
                )}
              </div>
            </div>
          ))}

          <div className="border-t pt-3 sm:pt-4 space-y-1.5 sm:space-y-2">
            <div className="flex justify-between text-xs sm:text-sm">
              <span className="text-muted-foreground">Total Amount</span>
              <span className="font-semibold">
                {currencySymbol}{totalAmount.toLocaleString(undefined, { 
                  minimumFractionDigits: 2, 
                  maximumFractionDigits: 2 
                })}
              </span>
            </div>
            <div className="flex justify-between text-xs sm:text-sm">
              <span className="text-muted-foreground">Total Paid</span>
              <span className="font-semibold text-green-600">
                {currencySymbol}{totalPaid.toLocaleString(undefined, { 
                  minimumFractionDigits: 2, 
                  maximumFractionDigits: 2 
                })}
              </span>
            </div>
            {totalOutstanding > 0 && (
              <div className="flex justify-between text-xs sm:text-sm pt-2 border-t">
                <span className="font-medium">Outstanding</span>
                <span className="font-bold text-orange-600">
                  {currencySymbol}{totalOutstanding.toLocaleString(undefined, { 
                    minimumFractionDigits: 2, 
                    maximumFractionDigits: 2 
                  })}
                </span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

