import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ReferFriendBanner } from '@/components/points/refer-friend-banner'

export default async function DashboardPage() {
  const supabase = await createClient()
  
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Get client data by user_id
  let { data: client, error: clientError } = await supabase
    .from('clients')
    .select('*')
    .eq('user_id', user.id)
    .single()

  // If client doesn't exist by user_id, try to find by email (recovery scenario)
  if (clientError || !client) {
    console.warn('Client not found by user_id, attempting to find by email:', user.id, user.email)
    
    if (user.email) {
      const { data: clientByEmail, error: emailError } = await supabase
        .from('clients')
        .select('*')
        .eq('email', user.email)
        .maybeSingle()

      // If client exists by email, update it to link to this auth account
      if (clientByEmail) {
        console.log('Found client by email, updating user_id:', clientByEmail.id)
        const { error: updateError } = await supabase
          .from('clients')
          .update({
            user_id: user.id,
            team_id: clientByEmail.team_id || '0cef0867-1b40-4de1-9936-16b867a753d7',
            loyalty_enrolled: clientByEmail.loyalty_enrolled ?? true,
            loyalty_enrolled_at: clientByEmail.loyalty_enrolled_at ?? new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', clientByEmail.id)

        if (!updateError) {
          // Retry fetch after update
          const { data: updatedClient } = await supabase
            .from('clients')
            .select('*')
            .eq('user_id', user.id)
            .single()
          
          if (updatedClient) {
            client = updatedClient
            clientError = null
          }
        } else {
          // Update failed, but client exists - use it anyway
          console.warn('Failed to update client user_id, but client exists:', updateError)
          client = clientByEmail
          clientError = null
        }
      } else if (emailError && emailError.code !== 'PGRST116') {
        // Error other than "not found" - log it
        console.error('Error finding client by email:', emailError)
      }
    }
  }

  // If client still doesn't exist, check one more time by email before creating
  if (clientError || !client) {
    if (user.email) {
      // Final check: does a client with this email exist?
      const { data: finalCheck } = await supabase
        .from('clients')
        .select('*')
        .eq('email', user.email)
        .maybeSingle()
      
      if (finalCheck) {
        // Client exists but couldn't be linked - use it anyway
        console.warn('Client exists by email but couldn\'t be linked, using existing record:', finalCheck.id)
        client = finalCheck
        clientError = null
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

    // Final safety check: verify client doesn't exist by email before inserting
    const { data: existingCheck } = await supabase
      .from('clients')
      .select('*')
      .eq('email', user.email)
      .maybeSingle()
    
    if (existingCheck) {
      // Client exists - update it instead of inserting
      console.log('Client exists by email, updating instead of inserting:', existingCheck.id)
      const { error: updateError } = await supabase
        .from('clients')
        .update({
          user_id: user.id,
          team_id: existingCheck.team_id || '0cef0867-1b40-4de1-9936-16b867a753d7',
          loyalty_enrolled: existingCheck.loyalty_enrolled ?? true,
          loyalty_enrolled_at: existingCheck.loyalty_enrolled_at ?? new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingCheck.id)

      if (!updateError) {
        // Fetch the updated client
        const { data: updatedClient } = await supabase
          .from('clients')
          .select('*')
          .eq('user_id', user.id)
          .single()
        
        if (updatedClient) {
          client = updatedClient
          clientError = null
        } else {
          // Fallback to existing client
          client = existingCheck
          clientError = null
        }
      } else {
        // Update failed, but use existing client anyway
        console.warn('Failed to update existing client, using as-is:', updateError)
        client = existingCheck
        clientError = null
      }
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
          user_id: user.id,
          team_id: '0cef0867-1b40-4de1-9936-16b867a753d7',
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
        
        // If insert fails due to unique constraint (email already exists), try update
        if (createError?.code === '23505' || createError?.message?.includes('unique constraint') || createError?.message?.includes('duplicate')) {
          const { data: existingByEmail } = await supabase
            .from('clients')
            .select('*')
            .eq('email', user.email)
            .maybeSingle()

          if (existingByEmail) {
            // Update existing client to link to this auth account
            const { error: updateError } = await supabase
              .from('clients')
              .update({
                user_id: user.id,
                team_id: existingByEmail.team_id || '0cef0867-1b40-4de1-9936-16b867a753d7',
                loyalty_enrolled: existingByEmail.loyalty_enrolled ?? true,
                loyalty_enrolled_at: existingByEmail.loyalty_enrolled_at ?? new Date().toISOString(),
                updated_at: new Date().toISOString(),
              })
              .eq('id', existingByEmail.id)

            if (!updateError) {
              // Fetch the updated client
              const { data: updatedClient } = await supabase
                .from('clients')
                .select('*')
                .eq('user_id', user.id)
                .single()
              
              if (updatedClient) {
                client = updatedClient
                clientError = null
              } else {
                // Fallback to existing client
                client = existingByEmail
                clientError = null
              }
            } else {
              // Update failed, but use existing client anyway
              console.warn('Failed to update existing client after insert error, using as-is:', updateError)
              client = existingByEmail
              clientError = null
            }
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

  // Get loyalty settings for referral bonus
  const { data: settings } = await supabase
    .from('loyalty_settings')
    .select('referral_bonus_referee, referral_bonus_referrer')
    .eq('id', 1)
    .single()

  // Get referral data
  const { data: referralData } = await supabase
    .from('referrals')
    .select('referral_code, referral_link')
    .eq('referrer_client_id', client.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  // Get referrer bonus points from loyalty settings (what the user gets when someone books)
  const referrerBonusPoints = settings?.referral_bonus_referrer || 100

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

      {/* Refer Friend Banner */}
      <ReferFriendBanner
        referralCode={referralData?.referral_code}
        referralLink={referralData?.referral_link}
        bonusPoints={referrerBonusPoints}
      />

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

