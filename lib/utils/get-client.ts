import { cache } from 'react'
import { createClient } from '@/lib/supabase/server'

/**
 * Cached client fetcher - prevents duplicate queries on the same request
 * Uses React cache() to deduplicate requests within the same render
 */
export const getClient = cache(async () => {
  const supabase = await createClient()
  
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { client: null, user: null, error: 'not_authenticated' as const }
  }

  // Get client data by user_id (most common case)
  let { data: client, error: clientError } = await supabase
    .from('clients')
    .select('*')
    .eq('user_id', user.id)
    .single()

  // If client doesn't exist by user_id, try to find by email (recovery scenario)
  if (clientError || !client) {
    if (user.email) {
      const { data: clientByEmail } = await supabase
        .from('clients')
        .select('*')
        .eq('email', user.email)
        .maybeSingle()

      if (clientByEmail) {
        // Update to link to this auth account
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
          // Fetch updated client
          const { data: updatedClient } = await supabase
            .from('clients')
            .select('*')
            .eq('user_id', user.id)
            .single()
          
          if (updatedClient) {
            client = updatedClient
            clientError = null
          } else {
            client = clientByEmail
            clientError = null
          }
        } else {
          client = clientByEmail
          clientError = null
        }
      }
    }
  }

  // If client still doesn't exist, check one more time by email before creating
  if (clientError || !client) {
    if (user.email) {
      const { data: finalCheck } = await supabase
        .from('clients')
        .select('*')
        .eq('email', user.email)
        .maybeSingle()
      
      if (finalCheck) {
        client = finalCheck
        clientError = null
      }
    }
  }

  // If client still doesn't exist, create one automatically
  if (clientError || !client) {
    if (!user.email) {
      return { client: null, user, error: 'no_email' as const }
    }

    // Final safety check: verify client doesn't exist by email before inserting
    const { data: existingCheck } = await supabase
      .from('clients')
      .select('*')
      .eq('email', user.email)
      .maybeSingle()
    
    if (existingCheck) {
      // Client exists - update it instead of inserting
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
        const { data: updatedClient } = await supabase
          .from('clients')
          .select('*')
          .eq('user_id', user.id)
          .single()
        
        if (updatedClient) {
          client = updatedClient
        } else {
          client = existingCheck
        }
      } else {
        client = existingCheck
      }
    } else {
      // No existing client - safe to insert
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
      } else if (createError?.code === '23505' || createError?.message?.includes('unique constraint') || createError?.message?.includes('duplicate')) {
        // Insert failed due to duplicate - try to fetch and update
        const { data: existingByEmail } = await supabase
          .from('clients')
          .select('*')
          .eq('email', user.email)
          .maybeSingle()

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
            } else {
              client = existingByEmail
            }
          } else {
            client = existingByEmail
          }
        }
      }
    }
  }

  if (!client) {
    return { client: null, user, error: 'setup_failed' as const }
  }

  return { client, user, error: null }
})

