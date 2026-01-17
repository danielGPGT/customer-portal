import { redirect } from 'next/navigation'
import { auth } from '@clerk/nextjs/server'
import { LayoutWrapper } from '@/components/app/layout-wrapper'
import { getClient } from '@/lib/utils/get-client'
import { canAccessClientPortal } from '@/lib/utils/portal-access'

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // First check Clerk auth directly - this is faster and more reliable
  const { userId } = await auth()
  
  // If no userId, redirect to sign-in
  if (!userId) {
    redirect('/sign-in')
  }

  // Get client data - getClient() will handle timing issues by retrying currentUser()
  const { client, user, error, portalAccess } = await getClient()

  // If we have userId from Clerk but no user from getClient(),
  // it could be a timing issue OR a real error
  // Only redirect if it's a specific error that we know about
  if (!user) {
    if (error === 'no_email') {
      redirect('/sign-in?error=no_email')
    } else if (error === 'setup_failed') {
      redirect('/sign-in?error=setup_failed')
    } else if (error === 'no_client_access') {
      // User exists but doesn't have portal access - show error on dashboard
      redirect('/dashboard?error=client_access_required')
    } else {
      // If we have userId but no user and no specific error,
      // AND error is 'not_authenticated', it means getClerkUser() returned null
      // This should not happen if we have userId, but if it does, it's a timing issue
      // The best we can do is redirect, but this might cause a loop if session isn't ready
      // To prevent loops, we should ensure getClient() always returns a user when userId exists
      // Instead of redirecting (which causes a loop), we'll let the page render
      // and handle the missing user/client in the page components
      // But for now, redirect as a fallback - the retry in getClerkUser() should fix timing issues
      redirect('/sign-in?error=setup_failed')
    }
  }

  const clientPortalEnabled = canAccessClientPortal(portalAccess)

  if (!clientPortalEnabled) {
    // User is already logged in but doesn't have client portal access
    // Redirect to dashboard with error message instead of login page
    redirect('/dashboard?error=client_access_required')
  }

  if (!client) {
    // Final check - if we have user but no client, something went wrong
    if (error === 'no_email') {
      redirect('/sign-in?error=no_email')
    }
    redirect('/sign-in?error=setup_failed')
  }

  return (
    <LayoutWrapper user={user} client={client}>
      {children}
    </LayoutWrapper>
  )
}
