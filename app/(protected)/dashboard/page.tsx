import { redirect } from 'next/navigation'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { getClient } from '@/lib/utils/get-client'

// Cache dashboard summary for 60 seconds
export const revalidate = 60

export default async function DashboardPage() {
  const { client, user, error } = await getClient()

  if (!user) {
    redirect('/login')
  }

  if (!client || error) {
    redirect('/login?error=setup_failed')
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">
          Welcome back, {client?.first_name || 'Customer'}!
        </h1>
        <p className="text-muted-foreground mt-1">Your loyalty dashboard</p>
      </div>
      
      {/* Points Card */}
      <div className="rounded-lg border border-primary/20 bg-primary text-primary-foreground p-6 shadow-sm">
        <h2 className="text-lg font-medium mb-2">Points Balance</h2>
        <p className="text-4xl font-bold">{client?.points_balance || 0}</p>
        <p className="text-sm text-primary-foreground/90 mt-2">
          Worth £{(client?.points_balance || 0).toLocaleString()} in discounts
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border border-border bg-card p-4">
          <h3 className="text-sm font-medium text-muted-foreground">Lifetime Earned</h3>
          <p className="text-2xl font-bold mt-2">{client?.lifetime_points_earned || 0}</p>
        </div>

        <div className="rounded-lg border border-border bg-card p-4">
          <h3 className="text-sm font-medium text-muted-foreground">Lifetime Spent</h3>
          <p className="text-2xl font-bold mt-2">{client?.lifetime_points_spent || 0}</p>
        </div>

        <div className="rounded-lg border border-border bg-card p-4">
          <h3 className="text-sm font-medium text-muted-foreground">Member Since</h3>
          <p className="text-2xl font-bold mt-2">
            {client?.loyalty_enrolled_at 
              ? new Date(client.loyalty_enrolled_at).toLocaleDateString('en-GB', { 
                  month: 'short', 
                  year: 'numeric' 
                })
              : 'N/A'
            }
          </p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Quick Actions</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <Button asChild variant="outline" className="h-auto py-4">
            <Link href="/points">
              <div className="text-left">
                <p className="font-semibold">My Points</p>
                <p className="text-sm text-muted-foreground">View statement & history</p>
              </div>
            </Link>
          </Button>
          
          <Button asChild variant="outline" className="h-auto py-4">
            <Link href="/trips">
              <div className="text-left">
                <p className="font-semibold">My Trips</p>
                <p className="text-sm text-muted-foreground">View bookings</p>
              </div>
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}

