import 'server-only'
import { createClient } from '@supabase/supabase-js'

/**
 * Creates a Supabase client using the service role key, bypassing RLS.
 * Safe because all queries already filter by client_id and Clerk auth
 * is verified via getClient() before any query runs.
 */
export function createServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )
}
