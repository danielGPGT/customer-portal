'use server'

import { revalidatePath, revalidateTag } from 'next/cache'
import { clearClientCache } from './get-client'
import { getClerkUser } from '@/lib/clerk/server'

/**
 * Enterprise-level cache invalidation utility
 * Ensures all caches are cleared when data is updated
 */
export async function invalidateAllCaches(userId?: string) {
  // Clear in-memory client cache
  if (userId) {
    clearClientCache(userId)
  } else {
    const clerkUser = await getClerkUser()
    if (clerkUser) {
      clearClientCache(clerkUser.id)
    }
  }

  // Revalidate all paths that display user data
  const pathsToRevalidate = [
    '/', // Dashboard
    '/profile',
    '/profile/edit',
    '/profile/preferences',
    '/profile/security',
    '/points',
    '/points/earn',
    '/points/redeem',
    '/trips',
    '/refer',
    '/notifications',
  ]

  // Revalidate each path
  pathsToRevalidate.forEach(path => {
    revalidatePath(path, 'page')
  })

  // Revalidate dynamic routes
  revalidatePath('/trips/[bookingId]', 'page')
  
  // Revalidate layout to update header/navigation
  revalidatePath('/', 'layout')
  
  // Revalidate all cache tags
  revalidateTag('client-data')
  revalidateTag('client-preferences')
  revalidateTag('loyalty-data')
}

/**
 * Invalidate caches related to currency changes
 */
export async function invalidateCurrencyCaches(userId?: string) {
  if (userId) {
    clearClientCache(userId)
  } else {
    const clerkUser = await getClerkUser()
    if (clerkUser) {
      clearClientCache(clerkUser.id)
    }
  }

  // Revalidate all paths that display currency
  const currencyPaths = [
    '/',
    '/profile',
    '/profile/preferences',
    '/points',
    '/points/earn',
    '/points/redeem',
    '/trips',
    '/trips/[bookingId]',
  ]

  currencyPaths.forEach(path => {
    revalidatePath(path, 'page')
  })

  revalidatePath('/', 'layout')
  revalidateTag('client-data')
  revalidateTag('client-preferences')
}

/**
 * Invalidate caches related to profile changes
 */
export async function invalidateProfileCaches(userId?: string) {
  if (userId) {
    clearClientCache(userId)
  } else {
    const clerkUser = await getClerkUser()
    if (clerkUser) {
      clearClientCache(clerkUser.id)
    }
  }

  revalidatePath('/profile', 'page')
  revalidatePath('/profile/edit', 'page')
  revalidatePath('/', 'layout')
  revalidateTag('client-data')
}

/**
 * Invalidate caches related to traveler/booking changes
 */
export async function invalidateBookingCaches(userId?: string) {
  if (userId) {
    clearClientCache(userId)
  } else {
    const clerkUser = await getClerkUser()
    if (clerkUser) {
      clearClientCache(clerkUser.id)
    }
  }

  revalidatePath('/trips', 'page')
  revalidatePath('/trips/[bookingId]', 'page')
  revalidateTag('client-data')
  revalidateTag('booking-data')
}
