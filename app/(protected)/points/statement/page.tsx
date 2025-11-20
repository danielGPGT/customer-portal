import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { TransactionList } from '@/components/points/transaction-list'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default async function PointsStatementPage() {
  const supabase = await createClient()
  
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Get client data
  let { data: client } = await supabase
    .from('clients')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (!client) {
    redirect('/login')
  }

  // Get recent transactions (first 20)
  const { data: transactions } = await supabase
    .from('loyalty_transactions')
    .select('*')
    .eq('client_id', client.id)
    .order('created_at', { ascending: false })
    .limit(20)

  // Get booking references for transactions
  const transactionsWithBookings = await Promise.all(
    (transactions || []).map(async (tx) => {
      if (tx.source_reference_id && (tx.source_type === 'purchase' || tx.source_type === 'redemption')) {
        const { data: booking } = await supabase
          .from('bookings')
          .select(`
            booking_reference,
            event_id,
            events (
              name
            )
          `)
          .eq('id', tx.source_reference_id)
          .is('deleted_at', null)
          .maybeSingle()
        
        if (booking) {
          return {
            ...tx,
            booking_reference: booking.booking_reference || null,
            event_name: (booking.events as { name?: string } | null)?.name || null,
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

