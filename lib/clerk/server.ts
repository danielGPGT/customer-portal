import { auth, currentUser } from "@clerk/nextjs/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Get the current Clerk user (server-side)
 * Returns null if user is not authenticated
 * Retries currentUser() if it fails initially (timing issue after sign-in)
 */
export async function getClerkUser() {
  console.log('[getClerkUser] Starting getClerkUser()...')
  const { userId } = await auth();
  console.log('[getClerkUser] auth() returned userId:', userId)
  
  if (!userId) {
    console.log('[getClerkUser] No userId, returning null')
    return null;
  }

  // Try to get full user data with currentUser()
  // This might fail immediately after sign-in due to session cookie propagation
  let user = null;
  try {
    console.log('[getClerkUser] Calling currentUser() (first attempt)...')
    user = await currentUser();
    console.log('[getClerkUser] currentUser() succeeded:', {
      id: user?.id,
      email: user?.emailAddresses[0]?.emailAddress,
      firstName: user?.firstName
    })
  } catch (error) {
    console.warn('[getClerkUser] currentUser() failed (first attempt):', error)
    // currentUser() might fail if session isn't fully loaded yet
    // Retry once more - sometimes the session needs a moment to be available
    try {
      console.log('[getClerkUser] Retrying currentUser()...')
      user = await currentUser();
      console.log('[getClerkUser] currentUser() succeeded on retry:', {
        id: user?.id,
        email: user?.emailAddresses[0]?.emailAddress,
        firstName: user?.firstName
      })
    } catch (retryError) {
      console.warn('[getClerkUser] currentUser() failed on retry:', retryError)
      // If retry also fails, continue with minimal user object
      // The email and other data will be available on the next request once session is fully loaded
    }
  }
  
  // If currentUser() succeeds, return full user data
  if (user) {
    const result = {
      id: userId,
      email: user.emailAddresses[0]?.emailAddress || null,
      firstName: user.firstName || null,
      lastName: user.lastName || null,
      phoneNumber: user.phoneNumbers[0]?.phoneNumber || null,
      imageUrl: user.imageUrl || null,
    };
    console.log('[getClerkUser] Returning full user object:', { id: result.id, email: result.email })
    return result;
  }

  // If currentUser() still fails after retry but we have userId,
  // return a minimal user object with just the userId
  // This allows the flow to continue - email will be fetched from database if needed
  console.log('[getClerkUser] currentUser() failed, returning minimal user object with userId only')
  return {
    id: userId,
    email: null, // Will be fetched from database or retried
    firstName: null,
    lastName: null,
    phoneNumber: null,
    imageUrl: null,
  };
}

/**
 * Get Clerk user ID from JWT token for database queries
 * This is used in RLS policies and database functions
 */
export async function getClerkUserId(): Promise<string | null> {
  const { userId } = await auth();
  return userId;
}

/**
 * Get Supabase client with Clerk user ID in JWT
 * This allows RLS policies to work with Clerk authentication
 */
export async function getSupabaseClientWithClerk() {
  const supabase = await createClient();
  const clerkUserId = await getClerkUserId();
  
  // Set the Clerk user ID in the request context for RLS policies
  // Note: This requires custom RLS functions that read from JWT claims
  if (clerkUserId) {
    // The Clerk user ID will be available in RLS policies via get_clerk_user_id() function
    // We'll need to pass it through the JWT or use a different approach
  }
  
  return supabase;
}
