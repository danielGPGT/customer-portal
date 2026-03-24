'use server'

import { createServiceClient } from '@/lib/supabase/service'
import { getClerkUserId } from '@/lib/clerk/server'
import { revalidatePath } from 'next/cache'

/**
 * Resolve the client ID for the current Clerk user.
 * Uses the service client to bypass RLS.
 */
async function getAuthedClientId() {
  const clerkUserId = await getClerkUserId()
  if (!clerkUserId) {
    throw new Error('Not authenticated')
  }

  const supabase = createServiceClient()

  const { data: client, error } = await supabase
    .from('clients')
    .select('id')
    .eq('clerk_user_id', clerkUserId)
    .single()

  if (error || !client) {
    throw new Error('Client not found')
  }

  return { supabase, clientId: client.id }
}

export async function markNotificationReadAction(
  notificationId: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const { supabase, clientId } = await getAuthedClientId()

    const { error } = await supabase
      .from('notifications')
      .update({ read: true, read_at: new Date().toISOString() })
      .eq('id', notificationId)
      .eq('client_id', clientId) // Ensure ownership

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to mark notification as read'
    return { success: false, error: message }
  }
}

export async function markAllNotificationsReadAction(
  notificationIds: string[],
): Promise<{ success: boolean; error?: string }> {
  if (notificationIds.length === 0) return { success: true }

  try {
    const { supabase, clientId } = await getAuthedClientId()

    const { error } = await supabase
      .from('notifications')
      .update({ read: true, read_at: new Date().toISOString() })
      .in('id', notificationIds)
      .eq('client_id', clientId) // Ensure ownership

    if (error) {
      return { success: false, error: error.message }
    }

    revalidatePath('/notifications')
    return { success: true }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to mark notifications as read'
    return { success: false, error: message }
  }
}

export async function fetchNotificationsAction(
  options?: { limit?: number },
): Promise<{ success: boolean; data?: any[]; error?: string }> {
  try {
    const { supabase, clientId } = await getAuthedClientId()

    let query = supabase
      .from('notifications')
      .select('*')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false })

    if (options?.limit) {
      query = query.limit(options.limit)
    }

    const { data, error } = await query

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, data: data || [] }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to fetch notifications'
    return { success: false, error: message }
  }
}
