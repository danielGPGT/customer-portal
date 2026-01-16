"use client";

import { useUser, useAuth } from "@clerk/nextjs";

/**
 * Get the current Clerk user (client-side)
 * Returns null if user is not authenticated
 */
export function useClerkAuth() {
  const { userId, isLoaded } = useAuth();
  const { user } = useUser();

  if (!isLoaded) {
    return {
      userId: null,
      user: null,
      email: null,
      isLoading: true,
    };
  }

  if (!userId || !user) {
    return {
      userId: null,
      user: null,
      email: null,
      isLoading: false,
    };
  }

  return {
    userId,
    user,
    email: user.emailAddresses[0]?.emailAddress || null,
    firstName: user.firstName || null,
    lastName: user.lastName || null,
    phoneNumber: user.phoneNumbers[0]?.phoneNumber || null,
    imageUrl: user.imageUrl || null,
    isLoading: false,
  };
}
