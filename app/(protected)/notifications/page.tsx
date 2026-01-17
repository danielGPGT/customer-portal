import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/app/page-header'
import { getClient } from '@/lib/utils/get-client'
import { NotificationsList } from '@/components/notifications/notifications-list'

export const metadata: Metadata = {
  title: 'Notifications | Grand Prix Grand Tours Portal',
  description: 'View your account notifications and updates',
}

// Notifications should be fresh
export const revalidate = 0

export default async function NotificationsPage() {
  const { client, user } = await getClient()

  if (!user || !client) {
    redirect('/login')
  }

  const supabase = await createClient()

  // Fetch all notifications for the client
  const { data: notifications, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('client_id', client.id)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching notifications:', error)
  }

  const unreadCount = notifications?.filter((n) => !n.read).length || 0

  return (
    <div className="space-y-6">
      <PageHeader
        title="Notifications"
        description={`You have ${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}`}
      />
      <NotificationsList 
        notifications={notifications || []} 
        clientId={client.id}
      />
    </div>
  )
}
