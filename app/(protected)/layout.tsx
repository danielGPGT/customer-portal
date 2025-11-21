import { redirect } from 'next/navigation'
import { LayoutWrapper } from '@/components/app/layout-wrapper'
import { getClient } from '@/lib/utils/get-client'

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { client, user, error } = await getClient()

  if (!user) {
    redirect('/login')
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
