import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default async function DashboardPage() {
  const supabase = await createClient()
  
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Get client data by auth_user_id
  let { data: client, error: clientError } = await supabase
    .from('clients')
    .select('*')
    .eq('auth_user_id', user.id)
    .single()

  // If client doesn't exist by auth_user_id, try to link by email using RPC function
  // This bypasses RLS to find and link existing client records
  if (clientError || !client) {
    console.warn('Client not found by auth_user_id, attempting to link by email:', user.id, user.email)
    
    if (user.email) {
      // Use RPC function to find and link client by email (bypasses RLS)
      const { data: linkedClient, error: linkError } = await supabase
        .rpc('link_client_to_user', { p_user_id: user.id })

      if (linkedClient && linkedClient.length > 0) {
        console.log('Successfully linked client to user:', linkedClient[0].id)
        // The RPC returns an array, get the first result
        client = linkedClient[0]
        clientError = null
      } else if (linkError) {
        console.error('Error linking client to user:', linkError)
      }
    }
  }

  // If client still doesn't exist, try RPC function one more time
  if (clientError || !client) {
    if (user.email) {
      // Try RPC function one more time (in case the function wasn't available on first try)
      const { data: linkedClient, error: linkError } = await supabase
        .rpc('link_client_to_user', { p_user_id: user.id })

      if (linkedClient && linkedClient.length > 0) {
        client = linkedClient[0]
        clientError = null
      } else if (linkError) {
        console.error('Error linking client to user (retry):', linkError)
      }
    }
  }

  // If client still doesn't exist, create one automatically
  if (clientError || !client) {
    console.warn('Client not found for user after recovery attempt, creating new client record:', {
      userId: user.id,
      email: user.email
    })
    
    if (!user.email) {
      // Cannot create client without email
      return (
        <div className="container py-8 px-4">
          <div className="max-w-4xl mx-auto text-center space-y-4">
            <h1 className="text-2xl font-bold">Account Setup Error</h1>
            <p className="text-gray-600">
              Your account doesn't have an email address. Please contact support.
            </p>
            <div className="pt-4">
              <form action="/auth/signout" method="post" className="inline">
                <Button variant="outline" type="submit">Log out</Button>
              </form>
            </div>
          </div>
        </div>
      )
    }

    // Final safety check: try RPC function one more time before inserting
    // This handles the case where a client exists but wasn't linked yet
    const { data: linkedClient, error: linkError } = await supabase
      .rpc('link_client_to_user', { p_user_id: user.id })

    if (linkedClient && linkedClient.length > 0) {
      // Client was found and linked
      client = linkedClient[0]
      clientError = null
    } else {
      // No existing client - safe to insert
    // Extract user metadata from auth
    const userMetadata = user.user_metadata || {}
    const firstName = userMetadata.first_name || user.email.split('@')[0] || 'Customer'
    const lastName = userMetadata.last_name || ''
    const phone = userMetadata.phone || null

    // Create new client record
    // Note: team_id is required by klaviyo_profile_queue trigger
    const { data: newClient, error: createError } = await supabase
      .from('clients')
      .insert({
        user_id: user.id,  // Keep user_id for backward compatibility
        auth_user_id: user.id,  // Use auth_user_id for portal access
        team_id: '0cef0867-1b40-4de1-9936-16b867a753d7', // Default team ID for customer portal
        email: user.email,
        first_name: firstName,
        last_name: lastName || 'User',
        phone: phone,
        status: 'active',
        loyalty_enrolled: true,
        loyalty_enrolled_at: new Date().toISOString(),
        loyalty_signup_source: 'self_signup',
      })
      .select()
      .single()

    if (createError || !newClient) {
      console.error('Failed to create client record:', createError)
      
      // If insert fails due to unique constraint (email already exists), use RPC function to link
        if (createError?.code === '23505' || createError?.message?.includes('unique constraint') || createError?.message?.includes('duplicate')) {
        // Use RPC function to link existing client
        const { data: linkedClient, error: linkError } = await supabase
          .rpc('link_client_to_user', { p_user_id: user.id })

        if (linkedClient && linkedClient.length > 0) {
          client = linkedClient[0]
          clientError = null
        } else if (linkError) {
          console.error('Error linking client after duplicate insert:', linkError)
        }
      }

      // If still no client, show error
      if (!client) {
        return (
          <div className="container py-8 px-4">
            <div className="max-w-4xl mx-auto text-center space-y-4">
              <h1 className="text-2xl font-bold">Account Setup Error</h1>
              <p className="text-gray-600">
                We couldn't create your customer account. This might happen if:
              </p>
              <ul className="text-left text-sm text-gray-600 space-y-2 max-w-md mx-auto">
                <li>• There's a database error</li>
                <li>• Your email is already linked to another account</li>
                <li>• You're trying to access the customer portal with a staff account</li>
              </ul>
              <div className="pt-4 space-x-4">
                <form action="/auth/signout" method="post" className="inline">
                  <Button variant="outline" type="submit">Log out</Button>
                </form>
                <Button asChild variant="default">
                  <a href="mailto:support@example.com">Contact Support</a>
                </Button>
              </div>
            </div>
          </div>
        )
      }
    } else {
      // Successfully created new client
      client = newClient
      clientError = null
      console.log('Successfully created client record for user:', user.id)
      }
    }
  }

  // Final check - if still no client, something is seriously wrong
  if (!client) {
    return (
      <div className="container py-8 px-4">
        <div className="max-w-4xl mx-auto text-center space-y-4">
          <h1 className="text-2xl font-bold">Account Setup Error</h1>
          <p className="text-gray-600">
            We couldn't set up your account. Please contact support.
          </p>
          <div className="pt-4">
            <form action="/auth/signout" method="post" className="inline">
              <Button variant="outline" type="submit">Log out</Button>
            </form>
          </div>
        </div>
      </div>
    )
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

