import { redirect } from 'next/navigation'
import { TransactionList } from '@/components/points/transaction-list'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { getClient } from '@/lib/utils/get-client'

// Points statement can be cached briefly
export const revalidate = 60

export default async function PointsStatementPage() {
  const { client, user, error } = await getClient()

  if (!user) {
    redirect('/login')
  }

  if (!client || error) {
    redirect('/dashboard?error=client_not_found')
  }

  const supabase = await (await import('@/lib/supabase/server')).createClient()

  // Get recent transactions (first 20)
  const { data: transactions } = await supabase
    .from('loyalty_transactions')
    .select('*')
    .eq('client_id', client.id)
    .order('created_at', { ascending: false })
    .limit(20)

  // Get booking references for transactions (BATCH QUERY - fixes N+1 problem)
  const bookingIds = (transactions || [])
    .filter(tx => tx.source_reference_id && (tx.source_type === 'purchase' || tx.source_type === 'redemption'))
    .map(tx => tx.source_reference_id)
    .filter((id, index, self) => self.indexOf(id) === index) // Get unique IDs

  // Batch fetch all bookings in one query
  const bookingMap = new Map<string, { booking_reference: string | null; event_name: string | null }>()
  if (bookingIds.length > 0) {
    const { data: bookings } = await supabase
      .from('bookings')
      .select(`
        id,
        booking_reference,
        events (
          name
        )
      `)
      .in('id', bookingIds)
      .is('deleted_at', null)

    // Create map for O(1) lookup
    bookings?.forEach(booking => {
      bookingMap.set(booking.id, {
        booking_reference: booking.booking_reference || null,
        event_name: (booking.events as { name?: string } | null)?.name || null,
      })
    })
  }

  // Map transactions with bookings (in-memory, fast)
  const transactionsWithBookings = (transactions || []).map(tx => {
    if (tx.source_reference_id && (tx.source_type === 'purchase' || tx.source_type === 'redemption')) {
      const booking = bookingMap.get(tx.source_reference_id)
      return {
        ...tx,
        booking_reference: booking?.booking_reference || null,
        event_name: booking?.event_name || null,
      }
    }
    return {
      ...tx,
      booking_reference: null,
      event_name: null,
    }
  })

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/points">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Points Statement</h1>
        </div>
      </div>

      {/* Current Balance */}
      <div className="rounded-lg border bg-card p-4">
        <div className="text-sm text-muted-foreground mb-1">Current Balance</div>
        <div className="text-2xl font-bold">{client.points_balance?.toLocaleString() || 0} points</div>
      </div>

      {/* Transaction List */}
      <TransactionList 
        clientId={client.id}
        initialTransactions={transactionsWithBookings || []}
        initialBalance={client.points_balance || 0}
      />
    </div>
  )
}

