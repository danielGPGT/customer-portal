"use client"

import { Card, CardContent } from '@/components/ui/card'
import { ArrowUp, ArrowDown, RefreshCw, Settings, Gift } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { formatDistanceToNow } from 'date-fns'
import Link from 'next/link'
import { cn } from '@/lib/utils'

interface Transaction {
  id: string
  transaction_type: string
  source_type: string
  points: number
  balance_after: number
  description: string
  source_reference_id?: string | null
  created_at: string
  booking_reference?: string | null
  event_name?: string | null
}

interface TransactionItemProps {
  transaction: Transaction
  previousBalance?: number
}

export function TransactionItem({ transaction, previousBalance }: TransactionItemProps) {
  const isEarn = transaction.transaction_type === 'earn' || transaction.transaction_type === 'refund'
  const isReferral = transaction.source_type?.includes('referral')
  const isRefund = transaction.transaction_type === 'refund'
  const isAdjustment = transaction.transaction_type === 'adjustment'

  // Get icon and color based on type
  const getIcon = () => {
    if (isReferral) return <Gift className="h-4 w-4 text-purple-600 dark:text-purple-400" />
    if (isRefund) return <RefreshCw className="h-4 w-4 text-blue-600 dark:text-blue-400" />
    if (isAdjustment) return <Settings className="h-4 w-4 text-gray-600 dark:text-gray-400" />
    if (isEarn) return <ArrowUp className="h-4 w-4 text-green-600 dark:text-green-400" />
    return <ArrowDown className="h-4 w-4 text-red-600 dark:text-red-400" />
  }

  const getColorClass = () => {
    if (isReferral) return 'border-l-purple-500'
    if (isRefund) return 'border-l-blue-500'
    if (isAdjustment) return 'border-l-gray-500'
    if (isEarn) return 'border-l-green-500'
    return 'border-l-red-500'
  }

  const getPointsColor = () => {
    if (isReferral) return 'text-purple-600 dark:text-purple-400'
    if (isRefund) return 'text-blue-600 dark:text-blue-400'
    if (isAdjustment) return 'text-gray-600 dark:text-gray-400'
    if (isEarn) return 'text-green-600 dark:text-green-400'
    return 'text-red-600 dark:text-red-400'
  }

  const pointsDisplay = isEarn ? `+${Math.abs(transaction.points)}` : `-${Math.abs(transaction.points)}`
  const balanceBefore = previousBalance ?? transaction.balance_after - transaction.points

  return (
    <Card className={cn("border-l-4", getColorClass())}>
      <CardContent>
        <div className="flex items-start gap-3">
          <div className="mt-0.5 shrink-0">
            {getIcon()}
          </div>
          
          <div className="flex-1 min-w-0 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className={cn("text-lg font-bold", getPointsColor())}>
                    {pointsDisplay} pts
                  </span>
                </div>
                <p className="text-sm font-medium text-foreground mb-1">
                  {transaction.description}
                </p>
                {transaction.booking_reference && (
                  <p className="text-xs text-muted-foreground font-mono">
                    {transaction.booking_reference}
                  </p>
                )}
                {transaction.event_name && (
                  <p className="text-xs text-muted-foreground">
                    {transaction.event_name}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>
                {formatDistanceToNow(new Date(transaction.created_at), { addSuffix: true })}
              </span>
              <span>•</span>
              <span>
                {new Date(transaction.created_at).toLocaleDateString('en-GB', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                  hour: 'numeric',
                  minute: '2-digit'
                })}
              </span>
            </div>

            <div className="text-xs text-muted-foreground pt-1 border-t">
              Balance: {balanceBefore.toLocaleString()} → {transaction.balance_after.toLocaleString()}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

