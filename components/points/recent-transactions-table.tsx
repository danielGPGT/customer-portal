"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowDown, RefreshCw, Settings, Gift, ArrowRight, CheckCircle2, XCircle } from 'lucide-react'
import Link from 'next/link'

interface Transaction {
  id: string
  transaction_type: string
  source_type: string
  points: number
  balance_after: number
  description: string
  created_at: string
  source_reference_id?: string | null
  booking_reference?: string | null
}

interface RecentTransactionsTableProps {
  transactions: Transaction[]
  maxRows?: number
}

export function RecentTransactionsTable({ 
  transactions, 
  maxRows = 5 
}: RecentTransactionsTableProps) {
  const displayTransactions = transactions.slice(0, maxRows)

  const getTransactionIcon = (type: string, sourceType: string) => {
    if (sourceType?.includes('referral')) {
      return <Gift className="h-4 w-4 text-muted-foreground" />
    }
    if (type === 'refund') {
      return <RefreshCw className="h-4 w-4 text-muted-foreground" />
    }
    if (type === 'adjustment') {
      return <Settings className="h-4 w-4 text-muted-foreground" />
    }
    if (type === 'earn') {
      return <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
    }
    if (type === 'spend') {
      return <ArrowDown className="h-4 w-4 text-muted-foreground" />
    }
    return <XCircle className="h-4 w-4 text-muted-foreground" />
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const day = date.getDate().toString().padStart(2, '0')
    const month = (date.getMonth() + 1).toString().padStart(2, '0')
    const year = date.getFullYear()
    return `${day}.${month}.${year}`
  }

  const formatDescription = (description: string, type: string, sourceType: string) => {
    // Extract key action words to bold
    const actionWords = ['earned', 'spent', 'redeemed', 'refunded', 'adjusted', 'completed', 'processed', 'received', 'used']
    let formatted = description
    
    // Find and bold action words
    actionWords.forEach(word => {
      const regex = new RegExp(`\\b(${word})\\b`, 'gi')
      formatted = formatted.replace(regex, (match) => `**${match}**`)
    })

    // Split by ** to create bold parts
    const parts = formatted.split(/(\*\*.*?\*\*)/g)
    
    return (
      <span className="text-sm">
        {parts.map((part, index) => {
          if (part.startsWith('**') && part.endsWith('**')) {
            return <strong key={index} className="font-semibold">{part.slice(2, -2)}</strong>
          }
          return <span key={index}>{part}</span>
        })}
      </span>
    )
  }

  if (displayTransactions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground text-sm">
            No transactions yet. Start earning points by making bookings!
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-base sm:text-lg">Activity</CardTitle>
          <Button asChild variant="ghost" size="sm" className="shrink-0">
            <Link href="/points" className="flex items-center gap-1 sm:gap-2">
              <span className="hidden sm:inline">View All</span>
              <span className="sm:hidden">All</span>
              <ArrowRight className="h-3 w-3 sm:h-4 sm:w-4" />
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="relative pl-2">
          {/* Vertical timeline line */}
          <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border" />
          
          {/* Timeline items */}
          <div className="space-y-0">
            {displayTransactions.map((transaction, index) => {
              return (
                <div
                  key={transaction.id}
                  className="relative flex items-start gap-3 sm:gap-4 pb-6 last:pb-0"
                >
                  {/* Icon with background circle */}
                  <div className="relative z-10 flex h-7 w-7 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-full bg-card border border-border">
                    {getTransactionIcon(transaction.transaction_type, transaction.source_type)}
                  </div>
                  
                  {/* Content */}
                  <div className="flex-1 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 sm:gap-4 min-w-0">
                    <div className="flex-1 min-w-0">
                      <div className="text-xs sm:text-sm">
                        {formatDescription(transaction.description, transaction.transaction_type, transaction.source_type)}
                      </div>
                      {transaction.booking_reference && (
                        <div className="mt-1 text-xs text-muted-foreground font-mono break-all">
                          {transaction.booking_reference}
                        </div>
                      )}
                    </div>
                    
                    {/* Date on the right */}
                    <div className="text-xs text-muted-foreground whitespace-nowrap shrink-0">
                      {formatDate(transaction.created_at)}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

