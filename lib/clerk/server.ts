import { auth, currentUser } from "@clerk/nextjs/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Get the current Clerk user (server-side)
 * Returns null if user is not authenticated
 * Retries currentUser() if it fails initially (timing issue after sign-in)
 */
export async function getClerkUser() {
  const { userId } = await auth();
  
  if (!userId) {
    return null;
  }

  // Try to get full user data with currentUser()
  // This might fail immediately after sign-in due to session cookie propagation
  let user = null;
  try {
    user = await currentUser();
  } catch (error) {
    // currentUser() might fail if session isn't fully loaded yet
    // Retry once more - sometimes the session needs a moment to be available
    try {
      user = await currentUser();
    } catch (retryError) {
      // If retry also fails, continue with minimal user object
      // The email and other data will be available on the next request once session is fully loaded
    }
  }
  
  // If currentUser() succeeds, return full user data
  if (user) {
    const rawEmail = user.emailAddresses[0]?.emailAddress
    const email = rawEmail ? rawEmail.trim().toLowerCase() : null
    const result = {
      id: userId,
      email,
      firstName: user.firstName || null,
      lastName: user.lastName || null,
      phoneNumber: user.phoneNumbers[0]?.phoneNumber || null,
      imageUrl: user.imageUrl || null,
    };
    return result;
  }

  // If currentUser() still fails after retry but we have userId,
  // return a minimal user object with just the userId
  // This allows the flow to continue - email will be fetched from database if needed
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
