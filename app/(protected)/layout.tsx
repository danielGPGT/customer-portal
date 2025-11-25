import { redirect } from 'next/navigation'
import { LayoutWrapper } from '@/components/app/layout-wrapper'
import { getClient } from '@/lib/utils/get-client'
import { canAccessClientPortal } from '@/lib/utils/portal-access'

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { client, user, error, portalAccess } = await getClient()

  if (!user) {
    redirect('/login')
  }

  const clientPortalEnabled = canAccessClientPortal(portalAccess)

  if (!clientPortalEnabled) {
    // User is already logged in but doesn't have client portal access
    // Redirect to dashboard with error message instead of login page
    redirect('/dashboard?error=client_access_required')
  }

  if (!client) {
    if (error === 'no_email') {
      redirect('/login?error=no_email')
    }
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
