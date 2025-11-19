import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { LayoutWrapper } from '@/components/app/layout-wrapper'

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
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
    if (user.email) {
      const { data: clientByEmail, error: emailError } = await supabase
        .from('clients')
        .select('*')
        .eq('email', user.email)
        .maybeSingle()

      if (clientByEmail && !emailError) {
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
          const { data: updatedClient } = await supabase
            .from('clients')
            .select('*')
            .eq('user_id', user.id)
            .single()
          
          if (updatedClient) {
            client = updatedClient
            clientError = null
          }
        }
      }
    }
  }

  // If client still doesn't exist, create one automatically
  if (clientError || !client) {
    if (!user.email) {
      redirect('/login?error=no_email')
    }

    const userMetadata = user.user_metadata || {}
    const firstName = userMetadata.first_name || user.email.split('@')[0] || 'Customer'
    const lastName = userMetadata.last_name || ''
    const phone = userMetadata.phone || null

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

    if (!createError && newClient) {
      client = newClient
    } else if (createError?.message?.includes('unique constraint') || createError?.message?.includes('duplicate')) {
      const { data: existingByEmail } = await supabase
        .from('clients')
        .select('*')
        .eq('email', user.email)
        .single()

      if (existingByEmail) {
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
          const { data: updatedClient } = await supabase
            .from('clients')
            .select('*')
            .eq('user_id', user.id)
            .single()
          
          if (updatedClient) {
            client = updatedClient
          }
        }
      }
    }
  }

  // Final check - if still no client, something is wrong
  if (!client) {
    redirect('/login?error=setup_failed')
  }

  return (
    <LayoutWrapper user={user} client={client}>
      <div className="">
        {children}
      </div>
    </LayoutWrapper>
  )
}
