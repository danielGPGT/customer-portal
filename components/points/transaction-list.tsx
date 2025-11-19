"use client"

import * as React from "react"
import { TransactionItem } from './transaction-item'
import { MonthDivider } from './month-divider'
import { TransactionFilter } from './transaction-filter'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { Loader2 } from 'lucide-react'

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

interface TransactionListProps {
  clientId: string
  initialTransactions: Transaction[]
  initialBalance: number
}

export function TransactionList({ 
  clientId, 
  initialTransactions,
  initialBalance 
}: TransactionListProps) {
  const [transactions, setTransactions] = React.useState<Transaction[]>(initialTransactions)
  const [filteredTransactions, setFilteredTransactions] = React.useState<Transaction[]>(initialTransactions)
  const [isLoading, setIsLoading] = React.useState(false)
  const [hasMore, setHasMore] = React.useState(initialTransactions.length >= 20)
  const [page, setPage] = React.useState(1)
  
  const [filters, setFilters] = React.useState({
    transactionType: 'all' as 'all' | 'earn' | 'spend' | 'refund' | 'adjustment',
    sortOrder: 'desc' as 'desc' | 'asc',
    dateRange: 'all' as 'all' | 'last_30' | 'last_90' | 'last_year',
  })

  const supabase = createClient()

  // Group transactions by month
  const groupedTransactions = React.useMemo(() => {
    const grouped: Record<string, Transaction[]> = {}
    
    filteredTransactions.forEach((tx) => {
      const date = new Date(tx.created_at)
      const monthKey = `${date.toLocaleString('en-GB', { month: 'long', year: 'numeric' })}`
      
      if (!grouped[monthKey]) {
        grouped[monthKey] = []
      }
      grouped[monthKey].push(tx)
    })

    // Sort months (newest first)
    return Object.entries(grouped).sort((a, b) => {
      const dateA = new Date(a[1][0].created_at)
      const dateB = new Date(b[1][0].created_at)
      return dateB.getTime() - dateA.getTime()
    })
  }, [filteredTransactions])

  // Filter transactions
  React.useEffect(() => {
    let filtered = [...transactions]

    // Filter by transaction type
    if (filters.transactionType !== 'all') {
      filtered = filtered.filter(t => t.transaction_type === filters.transactionType)
    }

    // Filter by date range
    if (filters.dateRange !== 'all') {
      const now = new Date()
      const daysAgo = filters.dateRange === 'last_30' ? 30 : filters.dateRange === 'last_90' ? 90 : 365
      const cutoffDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000)
      
      filtered = filtered.filter(t => new Date(t.created_at) >= cutoffDate)
    }

    // Sort
    filtered.sort((a, b) => {
      const dateA = new Date(a.created_at).getTime()
      const dateB = new Date(b.created_at).getTime()
      return filters.sortOrder === 'desc' ? dateB - dateA : dateA - dateB
    })

    setFilteredTransactions(filtered)
  }, [transactions, filters])

  const loadMore = async () => {
    if (isLoading || !hasMore) return

    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from('loyalty_transactions')
        .select('*')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false })
        .range(page * 20, (page + 1) * 20 - 1)

      if (!error && data && data.length > 0) {
        // Get booking references for new transactions
        const transactionsWithBookings = await Promise.all(
          data.map(async (tx) => {
            if (tx.source_reference_id && (tx.source_type === 'purchase' || tx.source_type === 'redemption')) {
              const { data: booking } = await supabase
                .from('bookings_cache')
                .select('booking_reference, event_name')
                .eq('booking_id', tx.source_reference_id)
                .maybeSingle()
              
              if (booking) {
                return {
                  ...tx,
                  booking_reference: booking.booking_reference || null,
                  event_name: booking.event_name || null,
                }
              }
            }
            return {
              ...tx,
              booking_reference: null,
              event_name: null,
            }
          })
        )

        setTransactions(prev => [...prev, ...transactionsWithBookings])
        setPage(prev => prev + 1)
        setHasMore(data.length === 20)
      } else {
        setHasMore(false)
      }
    } catch (error) {
      console.error('Error loading more transactions:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <TransactionFilter 
        filters={filters}
        onFiltersChange={setFilters}
      />

      {/* Transactions */}
      {filteredTransactions.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            No transactions found. Start earning points by making bookings!
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {groupedTransactions.map(([monthKey, monthTransactions]) => {
            const firstDate = new Date(monthTransactions[0].created_at)
            const month = firstDate.toLocaleString('en-GB', { month: 'long' })
            const year = firstDate.getFullYear()

            return (
              <div key={monthKey}>
                <MonthDivider month={month} year={year} />
                <div className="space-y-3">
                  {monthTransactions.map((transaction, index) => {
                    // Calculate previous balance: current balance minus this transaction's points change
                    const previousBalance = transaction.balance_after - transaction.points

                    return (
                      <TransactionItem
                        key={transaction.id}
                        transaction={transaction}
                        previousBalance={previousBalance}
                      />
                    )
                  })}
                </div>
              </div>
            )
          })}

          {/* Load More */}
          {hasMore && (
            <div className="flex justify-center pt-4">
              <Button 
                variant="outline" 
                onClick={loadMore}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Loading...
                  </>
                ) : (
                  'Load More'
                )}
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Export (Future) */}
      <div className="pt-6 border-t">
        <div className="text-sm text-muted-foreground">
          <p className="font-medium mb-1">Export</p>
          <p className="text-xs">Download PDF (Coming Soon)</p>
        </div>
      </div>
    </div>
  )
}

