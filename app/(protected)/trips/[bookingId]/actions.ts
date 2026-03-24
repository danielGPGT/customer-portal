'use server'

import { createServiceClient } from '@/lib/supabase/service'
import { getClerkUserId } from '@/lib/clerk/server'
import { revalidatePath } from 'next/cache'

type ActionResult = {
  success: boolean
  error?: string
}

// Keep backward-compatible alias
type FlightActionResult = ActionResult

/**
 * Verify the current Clerk user owns the given booking.
 * Uses the service client (bypasses RLS) — same approach as the page.tsx
 * loader — because the server client's RLS session variable is unreliable
 * with connection pooling. Ownership is enforced explicitly below.
 */
async function getAuthedClient(bookingId: string) {
  const clerkUserId = await getClerkUserId()
  if (!clerkUserId) {
    throw new Error('Not authenticated')
  }

  const supabase = createServiceClient()

  // Explicitly verify ownership: booking → client → clerk_user_id
  const { data: booking, error } = await supabase
    .from('bookings')
    .select('id, client_id, team_id, booking_reference, clients!inner(clerk_user_id)')
    .eq('id', bookingId)
    .eq('clients.clerk_user_id', clerkUserId)
    .single()

  if (error || !booking) {
    throw new Error('Booking not found')
  }

  return { supabase, booking }
}

export async function insertFlightAction(
  bookingId: string,
  flightDetails: Record<string, unknown>,
  outboundAirlineCode: string | null,
  inboundAirlineCode: string | null,
): Promise<FlightActionResult> {
  try {
    const { supabase, booking } = await getAuthedClient(bookingId)

    const { error } = await supabase
      .from('bookings_flights')
      .insert({
        booking_id: bookingId,
        flight_type: 'customer',
        flight_details: flightDetails,
        outbound_airline_code: outboundAirlineCode,
        inbound_airline_code: inboundAirlineCode,
        quantity: 1,
        cost: 0,
        unit_price: 0,
        total_price: 0,
      })

    if (error) {
      return { success: false, error: error.message }
    }

    // Notify internal staff
    if (booking.team_id && booking.booking_reference) {
      await supabase
        .from('internal_notifications')
        .insert({
          team_id: booking.team_id,
          type: 'booking_updated_by_client',
          title: `Booking ${booking.booking_reference} updated by client`,
          message: 'Traveler details or client flights were changed. Review in booking.',
          link_path: `/booking/${bookingId}`,
          link_id: null,
          metadata: { booking_id: bookingId },
        })
        .then(() => {}, () => {})
    }

    revalidatePath(`/trips/${bookingId}`)
    return { success: true }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to add flight information'
    return { success: false, error: message }
  }
}

export async function updateFlightAction(
  bookingId: string,
  flightId: string,
  updateData: Record<string, unknown>,
): Promise<FlightActionResult> {
  try {
    const { supabase, booking } = await getAuthedClient(bookingId)

    const { error } = await supabase
      .from('bookings_flights')
      .update(updateData)
      .eq('id', flightId)
      .eq('flight_type', 'customer')

    if (error) {
      return { success: false, error: error.message }
    }

    // Notify internal staff
    if (booking.team_id && booking.booking_reference) {
      await supabase
        .from('internal_notifications')
        .insert({
          team_id: booking.team_id,
          type: 'booking_updated_by_client',
          title: `Booking ${booking.booking_reference} updated by client`,
          message: 'Traveler details or client flights were changed. Review in booking.',
          link_path: `/booking/${bookingId}`,
          link_id: null,
          metadata: { booking_id: bookingId },
        })
        .then(() => {}, () => {})
    }

    revalidatePath(`/trips/${bookingId}`)
    return { success: true }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to update flight information'
    return { success: false, error: message }
  }
}

export async function getFlightForEditAction(
  bookingId: string,
  flightId: string,
): Promise<{ success: boolean; data?: Record<string, unknown>; error?: string }> {
  try {
    const { supabase } = await getAuthedClient(bookingId)

    const { data: flight, error } = await supabase
      .from('bookings_flights')
      .select('flight_details, outbound_airline_code, inbound_airline_code')
      .eq('id', flightId)
      .eq('flight_type', 'customer')
      .single()

    if (error || !flight) {
      return { success: false, error: 'Could not load flight data' }
    }

    return { success: true, data: flight as Record<string, unknown> }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to load flight'
    return { success: false, error: message }
  }
}

export async function deleteFlightAction(
  bookingId: string,
  flightId: string,
): Promise<FlightActionResult> {
  try {
    const { supabase } = await getAuthedClient(bookingId)

    const { error } = await supabase
      .from('bookings_flights')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', flightId)
      .eq('flight_type', 'customer')

    if (error) {
      return { success: false, error: error.message }
    }

    revalidatePath(`/trips/${bookingId}`)
    return { success: true }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to delete flight'
    return { success: false, error: message }
  }
}

// ─── Traveler Actions ────────────────────────────────────────────────

export async function updateTravelerAction(
  bookingId: string,
  travelerId: string,
  updateData: Record<string, unknown>,
): Promise<{ success: boolean; data?: Record<string, unknown>; error?: string }> {
  try {
    const { supabase, booking } = await getAuthedClient(bookingId)

    // Verify traveler exists and is not deleted
    const { data: existing, error: checkError } = await supabase
      .from('booking_travelers')
      .select('id, deleted_at')
      .eq('id', travelerId)
      .single()

    if (checkError || !existing) {
      return { success: false, error: 'Traveller not found. Please refresh the page and try again.' }
    }

    if (existing.deleted_at) {
      return { success: false, error: 'This traveller has been deleted and cannot be updated.' }
    }

    const { data: updatedData, error } = await supabase
      .from('booking_travelers')
      .update(updateData)
      .eq('id', travelerId)
      .is('deleted_at', null)
      .select()
      .single()

    if (error) {
      // Map specific Postgres error codes to user-friendly messages
      if (error.code === '23505') {
        return { success: false, error: 'A traveller with this information already exists' }
      }
      if (error.code === '23503') {
        return { success: false, error: 'Invalid reference. Please refresh the page and try again.' }
      }
      if (error.code === 'PGRST116' || error.code === 'PGRST301') {
        return { success: false, error: 'Unable to update traveller. Please refresh the page and try again.' }
      }
      return { success: false, error: error.message }
    }

    if (!updatedData) {
      return { success: false, error: 'Update completed but no data was returned. Please refresh the page.' }
    }

    // Notify internal staff
    if (booking.team_id && booking.booking_reference) {
      await supabase
        .from('internal_notifications')
        .insert({
          team_id: booking.team_id,
          type: 'booking_updated_by_client',
          title: `Booking ${booking.booking_reference} updated by client`,
          message: 'Traveler details or client flights were changed. Review in booking.',
          link_path: `/booking/${bookingId}`,
          link_id: null,
          metadata: { booking_id: bookingId },
        })
        .then(() => {}, () => {})
    }

    revalidatePath(`/trips/${bookingId}`)
    return { success: true, data: updatedData as Record<string, unknown> }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to update traveller information'
    return { success: false, error: message }
  }
}
